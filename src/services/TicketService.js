import { ChannelType, PermissionFlagsBits, userMention } from 'discord.js';
import { config } from '../config/index.js';
import { TicketStatus } from '../constants/ticketStatus.js';
import { TicketError } from '../utils/TicketError.js';
import { baseEmbed, warningEmbed } from '../utils/embeds.js';
import { ticketNumber, toChannelSlug } from '../utils/format.js';
import { staffRoleIdsFor } from '../utils/permissions.js';
import { buildCloseLogEmbed, buildOpenLogEmbed, buildTicketOpeningMessage } from '../ui/ticketMessages.js';

const MAX_CHANNELS_PER_CATEGORY = 50;

/**
 * Regras de negocio do sistema de tickets.
 *
 * Concentra criacao, atribuicao, participacao e encerramento, mantendo os
 * handlers de interacao restritos a validacao de entrada e resposta ao usuario.
 */
export class TicketService {
  #client;
  #repository;
  #transcripts;
  #logger;
  #creating = new Set();
  #closing = new Set();

  /**
   * @param {{ client: import('discord.js').Client, repository: import('../store/TicketRepository.js').TicketRepository, transcripts: import('./TranscriptService.js').TranscriptService, logger: object }} dependencies
   */
  constructor({ client, repository, transcripts, logger }) {
    this.#client = client;
    this.#repository = repository;
    this.#transcripts = transcripts;
    this.#logger = logger;
  }

  /**
   * Abre um ticket para o membro informado.
   *
   * @param {{ guild: import('discord.js').Guild, member: import('discord.js').GuildMember, category: object, answers: Record<string, string> }} params
   * @returns {Promise<{ channel: import('discord.js').TextChannel, ticket: object }>}
   */
  async open({ guild, member, category, answers }) {
    const lockKey = `${guild.id}:${member.id}`;

    if (this.#creating.has(lockKey)) {
      throw new TicketError('Ja existe uma abertura de ticket em andamento. Aguarde um instante.');
    }

    this.#creating.add(lockKey);

    try {
      const open = this.#repository.findOpenByOwner(member.id, guild.id);

      if (open.length >= config.tickets.maxOpenPerUser) {
        const channels = open.map((ticket) => `<#${ticket.channelId}>`).join(', ');
        throw new TicketError(
          `Voce ja possui o limite de tickets abertos (${config.tickets.maxOpenPerUser}): ${channels}`,
        );
      }

      const parent = await this.#resolveParentCategory(guild);
      const number = await this.#repository.nextNumber();

      const channel = await guild.channels.create({
        name: this.#buildChannelName({ number, member, category }),
        type: ChannelType.GuildText,
        parent: parent.id,
        topic: `Ticket ${ticketNumber(number)} | Solicitante: ${member.user.tag} (${member.id}) | Categoria: ${category.label}`,
        permissionOverwrites: this.#buildOverwrites({ guild, member, category }),
        reason: `Ticket ${ticketNumber(number)} aberto por ${member.user.tag}`,
      });

      const record = await this.#repository.create({
        channelId: channel.id,
        guildId: guild.id,
        ownerId: member.id,
        categoryId: category.id,
        answers,
        number,
      });

      const message = await channel.send(buildTicketOpeningMessage({ ticket: record, category }));
      await message.pin().catch(() => undefined);

      await this.#repository.update(channel.id, { controlMessageId: message.id });

      await this.#sendLog({
        guild,
        embeds: [buildOpenLogEmbed({ ticket: record, category, channelId: channel.id })],
      });

      this.#logger.info(
        `Ticket ${ticketNumber(record.number)} aberto por ${member.user.tag} em #${channel.name}`,
      );

      return { channel, ticket: record };
    } finally {
      this.#creating.delete(lockKey);
    }
  }

  /**
   * Atribui o atendimento a um membro da equipe.
   *
   * @param {{ channel: import('discord.js').TextChannel, ticket: object, member: import('discord.js').GuildMember }} params
   * @returns {Promise<object>}
   */
  async claim({ channel, ticket, member }) {
    if (ticket.claimedBy) {
      throw new TicketError(`Este atendimento ja foi assumido por ${userMention(ticket.claimedBy)}.`);
    }

    const updated = await this.#repository.update(channel.id, { claimedBy: member.id });

    await channel.send({
      embeds: [baseEmbed({ description: `${userMention(member.id)} assumiu este atendimento.` })],
    });

    return updated;
  }

  /**
   * Renomeia o canal do ticket.
   *
   * @param {{ channel: import('discord.js').TextChannel, ticket: object, name: string, moderator: import('discord.js').User }} params
   * @returns {Promise<string>} nome aplicado ao canal
   */
  async rename({ channel, ticket, name, moderator }) {
    const slug = toChannelSlug(name);

    if (!slug) {
      throw new TicketError('O nome informado nao gera um nome de canal valido.');
    }

    await channel.setName(
      slug,
      `Ticket ${ticketNumber(ticket.number)} renomeado por ${moderator.tag}`,
    );

    return slug;
  }

  /**
   * Adiciona um participante ao canal do ticket.
   *
   * @param {{ channel: import('discord.js').TextChannel, user: import('discord.js').User }} params
   * @returns {Promise<void>}
   */
  async addParticipant({ channel, user }) {
    await channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });

    await this.#repository.addParticipant(channel.id, user.id);
  }

  /**
   * Remove um participante do canal do ticket.
   *
   * @param {{ channel: import('discord.js').TextChannel, ticket: object, user: import('discord.js').User }} params
   * @returns {Promise<void>}
   */
  async removeParticipant({ channel, ticket, user }) {
    if (user.id === ticket.ownerId) {
      throw new TicketError('O solicitante nao pode ser removido do proprio ticket.');
    }

    await channel.permissionOverwrites.delete(user.id).catch(() => undefined);
    await this.#repository.removeParticipant(channel.id, user.id);
  }

  /**
   * Gera a transcricao do canal sem encerrar o atendimento.
   *
   * @param {{ channel: import('discord.js').TextChannel, ticket: object }} params
   * @returns {Promise<{ attachment: import('discord.js').AttachmentBuilder, messageCount: number }>}
   */
  generateTranscript({ channel, ticket }) {
    return this.#transcripts.generate({
      channel,
      ticket,
      category: config.getCategory(ticket.categoryId),
    });
  }

  /**
   * Encerra o ticket, arquiva a transcricao e agenda a exclusao do canal.
   *
   * @param {{ channel: import('discord.js').TextChannel, ticket: object, moderator: import('discord.js').User, reason?: string|null }} params
   * @returns {Promise<void>}
   */
  async close({ channel, ticket, moderator, reason = null }) {
    if (this.#closing.has(channel.id) || ticket.status === TicketStatus.CLOSED) {
      throw new TicketError('Este ticket ja esta em processo de encerramento.');
    }

    this.#closing.add(channel.id);

    try {
      const category = config.getCategory(ticket.categoryId);
      const closed = await this.#repository.update(channel.id, {
        status: TicketStatus.CLOSED,
        closedAt: new Date().toISOString(),
        closedBy: moderator.id,
        closeReason: reason,
      });

      const { attachment } = await this.#transcripts.generate({ channel, ticket: closed, category });

      await this.#sendLog({
        guild: channel.guild,
        embeds: [buildCloseLogEmbed({ ticket: closed, category, channelName: channel.name })],
        files: [attachment],
      });

      if (config.tickets.sendTranscriptToAuthor) {
        await this.#notifyAuthor({ ticket: closed, category, channel, attachment });
      }

      await channel.send({
        embeds: [
          warningEmbed(
            `Ticket encerrado por ${userMention(moderator.id)}. O canal sera excluido em ${config.tickets.deleteDelaySeconds} segundos.`,
          ),
        ],
      });

      this.#logger.info(
        `Ticket ${ticketNumber(closed.number)} fechado por ${moderator.tag} (${reason ?? 'sem motivo informado'})`,
      );

      setTimeout(() => {
        channel
          .delete(`Ticket ${ticketNumber(closed.number)} encerrado por ${moderator.tag}`)
          .catch((error) => this.#logger.warn('Falha ao excluir canal do ticket:', error));
      }, config.tickets.deleteDelaySeconds * 1000).unref?.();
    } finally {
      this.#closing.delete(channel.id);
    }
  }

  /**
   * Marca como fechado um ticket cujo canal foi excluido manualmente.
   *
   * @param {string} channelId
   * @returns {Promise<void>}
   */
  async handleChannelDeleted(channelId) {
    const ticket = this.#repository.findByChannel(channelId);

    if (!ticket || ticket.status === TicketStatus.CLOSED) {
      return;
    }

    await this.#repository.update(channelId, {
      status: TicketStatus.CLOSED,
      closedAt: new Date().toISOString(),
      closedBy: this.#client.user?.id ?? null,
      closeReason: 'Canal excluido manualmente.',
    });

    this.#logger.warn(
      `Canal do ticket ${ticketNumber(ticket.number)} foi excluido fora do fluxo padrao.`,
    );
  }

  /**
   * Resolve a categoria do Discord onde o canal sera criado.
   *
   * @param {import('discord.js').Guild} guild
   * @returns {Promise<import('discord.js').CategoryChannel>}
   */
  async #resolveParentCategory(guild) {
    const primary = await this.#fetchCategory(guild, config.tickets.categoryId);

    if (primary.children.cache.size < MAX_CHANNELS_PER_CATEGORY) {
      return primary;
    }

    if (!config.tickets.overflowCategoryId) {
      throw new TicketError(
        'A categoria de tickets atingiu o limite do Discord. Contate a administracao.',
      );
    }

    const overflow = await this.#fetchCategory(guild, config.tickets.overflowCategoryId);

    if (overflow.children.cache.size >= MAX_CHANNELS_PER_CATEGORY) {
      throw new TicketError(
        'Todas as categorias de tickets estao cheias. Contate a administracao.',
      );
    }

    return overflow;
  }

  /**
   * @param {import('discord.js').Guild} guild
   * @param {string} categoryId
   * @returns {Promise<import('discord.js').CategoryChannel>}
   */
  async #fetchCategory(guild, categoryId) {
    const channel = await guild.channels.fetch(categoryId).catch(() => null);

    if (!channel || channel.type !== ChannelType.GuildCategory) {
      throw new TicketError(
        'A categoria configurada para os tickets nao foi encontrada. Contate a administracao.',
      );
    }

    return channel;
  }

  /**
   * @param {{ number: number, member: import('discord.js').GuildMember, category: object }} params
   * @returns {string}
   */
  #buildChannelName({ number, member, category }) {
    const name = config.tickets.channelNamePattern
      .replaceAll('{number}', ticketNumber(number))
      .replaceAll('{user}', member.user.username)
      .replaceAll('{category}', category.id);

    return toChannelSlug(name) || `ticket-${ticketNumber(number)}`;
  }

  /**
   * @param {{ guild: import('discord.js').Guild, member: import('discord.js').GuildMember, category: object }} params
   * @returns {import('discord.js').OverwriteResolvable[]}
   */
  #buildOverwrites({ guild, member, category }) {
    const memberPermissions = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
    ];

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: this.#client.user.id,
        allow: [...memberPermissions, PermissionFlagsBits.ManageChannels],
      },
      { id: member.id, allow: memberPermissions },
    ];

    for (const roleId of staffRoleIdsFor(category)) {
      if (guild.roles.cache.has(roleId)) {
        overwrites.push({
          id: roleId,
          allow: [...memberPermissions, PermissionFlagsBits.ManageMessages],
        });
      }
    }

    return overwrites;
  }

  /**
   * Envia a transcricao em mensagem direta para o solicitante.
   *
   * @param {{ ticket: object, category: object|null, channel: import('discord.js').TextChannel, attachment: import('discord.js').AttachmentBuilder }} params
   * @returns {Promise<void>}
   */
  async #notifyAuthor({ ticket, category, channel, attachment }) {
    try {
      const user = await this.#client.users.fetch(ticket.ownerId);

      await user.send({
        embeds: [
          baseEmbed({
            title: `Ticket ${ticketNumber(ticket.number)} encerrado`,
            description: [
              `Servidor: ${channel.guild.name}`,
              `Categoria: ${category?.label ?? ticket.categoryId}`,
              `Motivo: ${ticket.closeReason ?? 'Nao informado'}`,
              '',
              'A transcricao completa esta anexada a esta mensagem.',
            ].join('\n'),
          }),
        ],
        files: [attachment],
      });
    } catch {
      this.#logger.debug(`Nao foi possivel enviar a transcricao em DM para ${ticket.ownerId}.`);
    }
  }

  /**
   * Publica um registro no canal de logs configurado.
   *
   * @param {{ guild: import('discord.js').Guild, embeds: object[], files?: object[] }} params
   * @returns {Promise<void>}
   */
  async #sendLog({ guild, embeds, files = [] }) {
    try {
      const channel = await guild.channels.fetch(config.tickets.logChannelId);

      if (!channel?.isTextBased()) {
        return;
      }

      await channel.send({ embeds, files });
    } catch (error) {
      this.#logger.warn('Falha ao registrar no canal de logs:', error);
    }
  }
}

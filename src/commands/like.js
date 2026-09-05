import { InteractionContextType, SlashCommandBuilder, channelMention } from 'discord.js';
import { config } from '../config/index.js';
import { buildLikeCooldownEmbed, buildLikeResultEmbed } from '../ui/likeMessages.js';
import { TicketError } from '../utils/TicketError.js';
import { respond } from '../utils/interactions.js';

/**
 * Indica se o membro pode ignorar o intervalo de espera.
 *
 * @param {import('discord.js').GuildMember|null} member
 * @returns {boolean}
 */
function canBypassCooldown(member) {
  const roles = config.like.bypassRoleIds;
  return roles.length > 0 && Boolean(member) && roles.some((roleId) => member.roles.cache.has(roleId));
}

const data = new SlashCommandBuilder()
  .setName('like')
  .setDescription('Envia likes para um ID de jogador.')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      .setName('id')
      .setDescription('ID numerico do jogador.')
      .setMinLength(6)
      .setMaxLength(15)
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('regiao')
      .setDescription('Regiao da conta. Padrao: a configurada no bot.')
      .addChoices(...config.like.regions.map(({ label, value }) => ({ name: label, value })))
      .setRequired(false),
  );

if (config.like.customQuantity.enabled) {
  data.addIntegerOption((option) =>
    option
      .setName('quantidade')
      .setDescription('Quantidade customizada de likes. Padrao: o maximo aceito pelo perfil.')
      .setMinValue(config.like.customQuantity.min)
      .setMaxValue(config.like.customQuantity.max)
      .setRequired(false),
  );
}

export default {
  data,
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const allowed = config.like.allowedChannelIds;

    if (allowed.length > 0 && !allowed.includes(interaction.channelId)) {
      throw new TicketError(
        `Este comando so pode ser usado em: ${allowed.map((id) => channelMention(id)).join(', ')}`,
      );
    }

    const service = context.services.likes;
    const playerId = service.normalizePlayerId(interaction.options.getString('id', true));
    const region = interaction.options.getString('regiao') ?? config.like.defaultRegion;
    const quantity = service.normalizeQuantity(interaction.options.getInteger('quantidade'));
    const ignoreCooldown = canBypassCooldown(interaction.member);

    const status = service.status(playerId);

    if (status.blocked && !ignoreCooldown) {
      await respond(interaction, {
        embeds: [
          buildLikeCooldownEmbed({
            playerId,
            region,
            availableAt: status.availableAt,
            entry: status.entry,
          }),
        ],
      });

      return;
    }

    await interaction.deferReply();

    const { result, availableAt } = await service.send({
      playerId,
      region,
      quantity,
      requestedBy: interaction.user.id,
      guildId: interaction.guildId,
      ignoreCooldown,
    });

    await interaction.editReply({
      embeds: [
        buildLikeResultEmbed({
          result,
          playerId,
          region,
          requestedBy: interaction.user.id,
          availableAt,
        }),
      ],
    });
  },
};

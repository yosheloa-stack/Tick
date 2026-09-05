import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  channelMention,
} from 'discord.js';
import { buildPanelMessage } from '../ui/panel.js';
import { TicketError } from '../utils/TicketError.js';
import { successEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Gerencia o painel de abertura de atendimentos.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('enviar')
        .setDescription('Publica o painel de atendimento em um canal.')
        .addChannelOption((option) =>
          option
            .setName('canal')
            .setDescription('Canal onde o painel sera publicado. Padrao: canal atual.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('atualizar')
        .setDescription('Atualiza um painel ja publicado com a configuracao atual.')
        .addStringOption((option) =>
          option
            .setName('mensagem')
            .setDescription('ID da mensagem do painel.')
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName('canal')
            .setDescription('Canal onde o painel esta publicado. Padrao: canal atual.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    ),
  staffOnly: false,
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const channel = interaction.options.getChannel('canal') ?? interaction.channel;
    const payload = buildPanelMessage();

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (interaction.options.getSubcommand() === 'enviar') {
      const message = await channel.send(payload);

      await interaction.editReply({
        embeds: [
          successEmbed(
            `Painel publicado em ${channelMention(channel.id)}.\nID da mensagem: \`${message.id}\``,
          ),
        ],
      });

      return;
    }

    const messageId = interaction.options.getString('mensagem', true);
    const message = await channel.messages.fetch(messageId).catch(() => null);

    if (!message) {
      throw new TicketError('Mensagem nao encontrada no canal informado.');
    }

    if (message.author.id !== interaction.client.user.id) {
      throw new TicketError('A mensagem informada nao foi publicada por este bot.');
    }

    await message.edit(payload);

    await interaction.editReply({
      embeds: [successEmbed(`Painel atualizado em ${channelMention(channel.id)}.`)],
    });
  },
};

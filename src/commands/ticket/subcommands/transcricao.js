import { MessageFlags } from 'discord.js';
import { successEmbed } from '../../../utils/embeds.js';
import { requireStaff, requireTicket } from '../../../utils/ticketContext.js';

export default {
  name: 'transcricao',
  description: 'Gera a transcricao do ticket atual sem encerra-lo.',
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   * @returns {import('discord.js').SlashCommandSubcommandBuilder}
   */
  register(subcommand) {
    return subcommand;
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const ticket = requireTicket(interaction, context);
    requireStaff(interaction, ticket);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { attachment, messageCount } = await context.services.tickets.generateTranscript({
      channel: interaction.channel,
      ticket,
    });

    await interaction.editReply({
      embeds: [successEmbed(`Transcricao gerada com ${messageCount} mensagem(ns).`)],
      files: [attachment],
    });
  },
};

import { MessageFlags } from 'discord.js';
import { CustomIds } from '../../constants/customIds.js';
import { requireStaff, requireTicket } from '../../utils/ticketContext.js';
import { successEmbed } from '../../utils/embeds.js';

export default {
  id: CustomIds.TRANSCRIPT,
  /**
   * Gera a transcricao parcial do atendimento sem encerra-lo.
   *
   * @param {import('discord.js').ButtonInteraction} interaction
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

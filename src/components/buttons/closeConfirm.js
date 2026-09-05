import { CustomIds } from '../../constants/customIds.js';
import { requireStaffOrOwner, requireTicket } from '../../utils/ticketContext.js';
import { warningEmbed } from '../../utils/embeds.js';

export default {
  id: CustomIds.CLOSE_CONFIRM,
  /**
   * Confirma o encerramento e dispara o fluxo de fechamento.
   *
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const ticket = requireTicket(interaction, context);
    requireStaffOrOwner(interaction, ticket);

    await interaction.update({
      embeds: [warningEmbed('Encerrando o atendimento e arquivando a transcricao.')],
      components: [],
    });

    await context.services.tickets.close({
      channel: interaction.channel,
      ticket,
      moderator: interaction.user,
    });
  },
};

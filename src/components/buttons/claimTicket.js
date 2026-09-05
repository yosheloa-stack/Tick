import { CustomIds } from '../../constants/customIds.js';
import { buildControlRow } from '../../ui/ticketMessages.js';
import { requireStaff, requireTicket } from '../../utils/ticketContext.js';
import { replySuccess } from '../../utils/interactions.js';

export default {
  id: CustomIds.CLAIM,
  /**
   * Atribui o atendimento ao membro da equipe que acionou o botao.
   *
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const ticket = requireTicket(interaction, context);
    requireStaff(interaction, ticket);

    await interaction.deferUpdate();

    const updated = await context.services.tickets.claim({
      channel: interaction.channel,
      ticket,
      member: interaction.member,
    });

    await interaction.message.edit({ components: [buildControlRow(updated)] });
    await replySuccess(interaction, 'Voce assumiu este atendimento.');
  },
};

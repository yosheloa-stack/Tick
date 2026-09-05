import { CustomIds } from '../../constants/customIds.js';
import { buildCloseConfirmation } from '../../ui/ticketMessages.js';
import { requireStaffOrOwner, requireTicket } from '../../utils/ticketContext.js';
import { respond } from '../../utils/interactions.js';

export default {
  id: CustomIds.CLOSE_REQUEST,
  /**
   * Solicita a confirmacao antes de encerrar o atendimento.
   *
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const ticket = requireTicket(interaction, context);
    requireStaffOrOwner(interaction, ticket);

    await respond(interaction, buildCloseConfirmation());
  },
};

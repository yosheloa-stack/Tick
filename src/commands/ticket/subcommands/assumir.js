import { buildControlRow } from '../../../ui/ticketMessages.js';
import { replySuccess } from '../../../utils/interactions.js';
import { requireStaff, requireTicket } from '../../../utils/ticketContext.js';

export default {
  name: 'assumir',
  description: 'Assume o atendimento do ticket atual.',
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

    const updated = await context.services.tickets.claim({
      channel: interaction.channel,
      ticket,
      member: interaction.member,
    });

    if (ticket.controlMessageId) {
      const message = await interaction.channel.messages
        .fetch(ticket.controlMessageId)
        .catch(() => null);

      await message?.edit({ components: [buildControlRow(updated)] }).catch(() => undefined);
    }

    await replySuccess(interaction, 'Voce assumiu este atendimento.');
  },
};

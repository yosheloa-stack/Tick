import { userMention } from 'discord.js';
import { baseEmbed } from '../../../utils/embeds.js';
import { formatDateTime, formatDuration, ticketNumber } from '../../../utils/format.js';
import { respond } from '../../../utils/interactions.js';
import { requireStaffOrOwner, requireTicket } from '../../../utils/ticketContext.js';

export default {
  name: 'informacoes',
  description: 'Exibe os dados registrados do ticket atual.',
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
    requireStaffOrOwner(interaction, ticket);

    const category = context.config.getCategory(ticket.categoryId);
    const participants = ticket.participantIds.map((id) => userMention(id)).join(', ');

    const embed = baseEmbed({ title: `Ticket ${ticketNumber(ticket.number)}` }).addFields(
      { name: 'Solicitante', value: userMention(ticket.ownerId), inline: true },
      { name: 'Categoria', value: category?.label ?? ticket.categoryId, inline: true },
      {
        name: 'Atendente',
        value: ticket.claimedBy ? userMention(ticket.claimedBy) : 'Nao assumido',
        inline: true,
      },
      { name: 'Aberto em', value: formatDateTime(ticket.createdAt), inline: true },
      {
        name: 'Tempo em aberto',
        value: formatDuration(Date.now() - new Date(ticket.createdAt).getTime()),
        inline: true,
      },
      { name: 'Participantes', value: participants || 'Nenhum' },
    );

    await respond(interaction, { embeds: [embed] });
  },
};

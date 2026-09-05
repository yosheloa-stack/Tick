import { config } from '../config/index.js';
import { TicketStatus } from '../constants/ticketStatus.js';
import { TicketError } from './TicketError.js';
import { isStaff } from './permissions.js';

/**
 * Recupera o ticket associado ao canal da interacao.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {object} context
 * @returns {object}
 */
export function requireTicket(interaction, context) {
  const ticket = context.repository.findByChannel(interaction.channelId);

  if (!ticket || ticket.status !== TicketStatus.OPEN) {
    throw new TicketError('Esta acao so pode ser executada dentro de um canal de ticket ativo.');
  }

  return ticket;
}

/**
 * Garante que o autor da interacao seja da equipe ou o solicitante do ticket.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {object} ticket
 * @returns {void}
 */
export function requireStaffOrOwner(interaction, ticket) {
  const category = config.getCategory(ticket.categoryId);

  if (interaction.user.id === ticket.ownerId || isStaff(interaction.member, category)) {
    return;
  }

  throw new TicketError('Voce nao possui permissao para executar esta acao neste ticket.');
}

/**
 * Garante que o autor da interacao pertenca a equipe de atendimento.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {object} ticket
 * @returns {void}
 */
export function requireStaff(interaction, ticket) {
  const category = ticket ? config.getCategory(ticket.categoryId) : null;

  if (!isStaff(interaction.member, category)) {
    throw new TicketError('Somente a equipe de atendimento pode executar esta acao.');
  }
}

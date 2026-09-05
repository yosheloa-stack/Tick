import { TicketStatus } from '../constants/ticketStatus.js';
import { JsonStore } from './JsonStore.js';

const DEFAULTS = { sequence: 0, tickets: {} };

/**
 * Persistencia dos tickets.
 *
 * Os registros sao indexados pelo ID do canal, que e a chave natural
 * usada por todas as interacoes do sistema.
 */
export class TicketRepository {
  #store;

  /**
   * @param {string} filePath
   */
  constructor(filePath) {
    this.#store = new JsonStore(filePath, DEFAULTS);
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    await this.#store.load();
  }

  /**
   * Cria um registro de ticket e devolve o objeto persistido.
   *
   * @param {{ channelId: string, guildId: string, ownerId: string, categoryId: string, answers: Record<string, string>, number?: number }} input
   * @returns {Promise<object>}
   */
  create(input) {
    return this.#store.update((data) => {
      if (typeof input.number !== 'number') {
        data.sequence += 1;
      }

      const ticket = {
        number: input.number ?? data.sequence,
        channelId: input.channelId,
        guildId: input.guildId,
        ownerId: input.ownerId,
        categoryId: input.categoryId,
        answers: input.answers ?? {},
        status: TicketStatus.OPEN,
        claimedBy: null,
        createdAt: new Date().toISOString(),
        closedAt: null,
        closedBy: null,
        closeReason: null,
        participantIds: [input.ownerId],
      };

      data.tickets[ticket.channelId] = ticket;

      return ticket;
    });
  }

  /**
   * Reserva o proximo numero da sequencia sem criar o registro.
   *
   * @returns {Promise<number>}
   */
  nextNumber() {
    return this.#store.update((data) => {
      data.sequence += 1;
      return data.sequence;
    });
  }

  /**
   * @param {string} channelId
   * @returns {object|null}
   */
  findByChannel(channelId) {
    return this.#store.data.tickets[channelId] ?? null;
  }

  /**
   * @param {string} ownerId
   * @param {string} guildId
   * @returns {object[]}
   */
  findOpenByOwner(ownerId, guildId) {
    return Object.values(this.#store.data.tickets).filter(
      (ticket) =>
        ticket.ownerId === ownerId &&
        ticket.guildId === guildId &&
        ticket.status === TicketStatus.OPEN,
    );
  }

  /**
   * @param {string} guildId
   * @returns {object[]}
   */
  findOpen(guildId) {
    return Object.values(this.#store.data.tickets).filter(
      (ticket) => ticket.guildId === guildId && ticket.status === TicketStatus.OPEN,
    );
  }

  /**
   * Aplica alteracoes parciais a um ticket existente.
   *
   * @param {string} channelId
   * @param {object} changes
   * @returns {Promise<object|null>}
   */
  update(channelId, changes) {
    return this.#store.update((data) => {
      const ticket = data.tickets[channelId];

      if (!ticket) {
        return null;
      }

      Object.assign(ticket, changes);
      return ticket;
    });
  }

  /**
   * Registra um participante adicional no ticket.
   *
   * @param {string} channelId
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  addParticipant(channelId, userId) {
    return this.#store.update((data) => {
      const ticket = data.tickets[channelId];

      if (!ticket) {
        return null;
      }

      if (!ticket.participantIds.includes(userId)) {
        ticket.participantIds.push(userId);
      }

      return ticket;
    });
  }

  /**
   * Remove um participante do ticket.
   *
   * @param {string} channelId
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  removeParticipant(channelId, userId) {
    return this.#store.update((data) => {
      const ticket = data.tickets[channelId];

      if (!ticket) {
        return null;
      }

      ticket.participantIds = ticket.participantIds.filter((id) => id !== userId);
      return ticket;
    });
  }

  /**
   * Remove definitivamente o registro do ticket.
   *
   * @param {string} channelId
   * @returns {Promise<void>}
   */
  delete(channelId) {
    return this.#store.update((data) => {
      delete data.tickets[channelId];
    });
  }
}

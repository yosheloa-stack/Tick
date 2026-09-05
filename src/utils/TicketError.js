/**
 * Erro previsto do fluxo de atendimento.
 * A mensagem e exibida diretamente ao usuario que executou a interacao.
 */
export class TicketError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'TicketError';
  }
}

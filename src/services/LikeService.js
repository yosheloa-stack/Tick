import { config } from '../config/index.js';
import { TicketError } from '../utils/TicketError.js';

const PLAYER_ID_PATTERN = /^\d{6,15}$/;

/**
 * Regras do comando /like.
 *
 * O intervalo de espera e aplicado por ID de jogador: nao ha limite de contas
 * atendidas por membro, mas cada ID so recebe um novo envio depois do prazo.
 */
export class LikeService {
  #repository;
  #client;
  #logger;
  #inFlight = new Set();

  /**
   * @param {{ repository: import('../store/LikeRepository.js').LikeRepository, client: import('./LikeApiClient.js').LikeApiClient, logger: object }} dependencies
   */
  constructor({ repository, client, logger }) {
    this.#repository = repository;
    this.#client = client;
    this.#logger = logger;
  }

  /**
   * Duracao do intervalo de espera em milissegundos.
   *
   * @returns {number}
   */
  get cooldownMs() {
    return config.like.cooldownHours * 3_600_000;
  }

  /**
   * Valida o formato do ID informado pelo membro.
   *
   * @param {string} value
   * @returns {string}
   */
  normalizePlayerId(value) {
    const playerId = value.trim();

    if (!PLAYER_ID_PATTERN.test(playerId)) {
      throw new TicketError('O ID informado e invalido. Utilize apenas numeros, entre 6 e 15 digitos.');
    }

    return playerId;
  }

  /**
   * Valida a quantidade customizada de likes (parametro `qtd` da API).
   *
   * @param {number|null} value
   * @returns {number|undefined}
   */
  normalizeQuantity(value) {
    if (value === null || value === undefined) {
      return undefined;
    }

    const { customQuantity } = config.like;

    if (!customQuantity.enabled) {
      throw new TicketError('Este bot nao permite escolher a quantidade de likes.');
    }

    if (!Number.isInteger(value) || value < customQuantity.min || value > customQuantity.max) {
      throw new TicketError(
        `A quantidade deve ser um numero inteiro entre ${customQuantity.min} e ${customQuantity.max}.`,
      );
    }

    return value;
  }

  /**
   * Consulta o intervalo de espera de um jogador.
   *
   * @param {string} playerId
   * @returns {{ blocked: boolean, availableAt: Date|null, entry: object|null }}
   */
  status(playerId) {
    const entry = this.#repository.find(playerId);

    if (!entry) {
      return { blocked: false, availableAt: null, entry: null };
    }

    const availableAt = new Date(new Date(entry.sentAt).getTime() + this.cooldownMs);

    return { blocked: availableAt.getTime() > Date.now(), availableAt, entry };
  }

  /**
   * Envia os likes e registra o uso do ID.
   *
   * @param {{ playerId: string, region: string, quantity?: number, requestedBy: string, guildId: string|null, ignoreCooldown?: boolean }} params
   * @returns {Promise<{ result: object, availableAt: Date }>}
   */
  async send({ playerId, region, quantity, requestedBy, guildId, ignoreCooldown = false }) {
    if (this.#inFlight.has(playerId)) {
      throw new TicketError('Ja existe um envio em andamento para este ID. Aguarde a conclusao.');
    }

    if (!ignoreCooldown) {
      const { blocked, availableAt } = this.status(playerId);

      if (blocked) {
        throw new TicketError(
          `Este ID ja recebeu likes nas ultimas ${config.like.cooldownHours} horas. Novo envio disponivel em ${availableAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
        );
      }
    }

    this.#inFlight.add(playerId);

    try {
      const result = await this.#client.send({ playerId, region, quantity });

      const record = await this.#repository.register({
        playerId,
        region,
        requestedBy,
        guildId,
        cooldownMs: this.cooldownMs,
      });

      this.#logger.info(
        `Likes enviados para ${playerId} (${region}) por ${requestedBy}: ${result.likesGiven ?? 'quantidade nao informada'}`,
      );

      return {
        result,
        availableAt: new Date(new Date(record.sentAt).getTime() + this.cooldownMs),
      };
    } finally {
      this.#inFlight.delete(playerId);
    }
  }
}

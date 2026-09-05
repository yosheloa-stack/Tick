import { JsonStore } from './JsonStore.js';

const DEFAULTS = { entries: {} };

/**
 * Persistencia do intervalo de espera do comando /like.
 *
 * O controle e feito por ID de jogador, nao por membro do Discord:
 * um mesmo membro pode enviar likes para quantos IDs quiser, mas cada ID
 * respeita o proprio intervalo.
 */
export class LikeRepository {
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
   * Retorna o ultimo envio registrado para o jogador.
   *
   * O ID e a chave: trocar a regiao nao libera um novo envio.
   *
   * @param {string} playerId
   * @returns {object|null}
   */
  find(playerId) {
    return this.#store.data.entries[playerId] ?? null;
  }

  /**
   * Registra um envio bem-sucedido e remove os registros ja expirados.
   *
   * @param {{ playerId: string, region: string, requestedBy: string, guildId: string|null, cooldownMs: number }} input
   * @returns {Promise<object>}
   */
  register({ playerId, region, requestedBy, guildId, cooldownMs }) {
    return this.#store.update((data) => {
      const now = Date.now();

      for (const [key, entry] of Object.entries(data.entries)) {
        if (now - new Date(entry.sentAt).getTime() > cooldownMs) {
          delete data.entries[key];
        }
      }

      const record = {
        playerId,
        region,
        requestedBy,
        guildId,
        sentAt: new Date(now).toISOString(),
      };

      data.entries[playerId] = record;

      return record;
    });
  }

  /**
   * Remove o registro de um jogador, liberando novo envio imediato.
   *
   * @param {string} playerId
   * @returns {Promise<void>}
   */
  clear(playerId) {
    return this.#store.update((data) => {
      delete data.entries[playerId];
    });
  }
}

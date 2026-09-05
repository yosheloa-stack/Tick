import { config } from '../config/index.js';
import { TicketError } from '../utils/TicketError.js';

/**
 * Le um valor aninhado a partir de um caminho com pontos.
 *
 * @param {object} source
 * @param {string} path
 * @returns {unknown}
 */
function readPath(source, path) {
  return path.split('.').reduce((value, key) => {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }

    return value[key];
  }, source);
}

/**
 * Retorna o primeiro valor definido entre os caminhos informados.
 *
 * @param {object} source
 * @param {string[]} paths
 * @returns {unknown}
 */
function firstDefined(source, paths) {
  for (const path of paths ?? []) {
    const value = readPath(source, path);

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

/**
 * Cliente HTTP da API de likes.
 *
 * O formato da requisicao e a leitura da resposta sao declarados em
 * `config/like.js`, permitindo adaptar a integracao sem alterar codigo.
 */
export class LikeApiClient {
  #logger;

  /**
   * @param {object} logger
   */
  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Monta a URL, os cabecalhos e o corpo da requisicao.
   *
   * @param {{ playerId: string, region: string }} params
   * @returns {{ url: URL, init: RequestInit }}
   */
  #buildRequest({ playerId, region }) {
    const { api } = config.like;
    const url = new URL(api.path, api.baseUrl);
    const headers = { Accept: 'application/json', ...api.extraHeaders };
    const parameters = { ...api.extraParams, [api.playerIdParam]: playerId };

    if (api.regionParam) {
      parameters[api.regionParam] = region;
    }

    if (api.authStyle !== 'none') {
      const key = config.env.likeApiKey;

      if (!key) {
        throw new TicketError(
          'A chave da API de likes nao esta configurada. Defina LIKE_API_KEY no arquivo .env.',
        );
      }

      if (api.authStyle === 'query') {
        parameters[api.authName] = key;
      } else if (api.authStyle === 'header') {
        headers[api.authName] = key;
      } else {
        headers.Authorization = `Bearer ${key}`;
      }
    }

    const init = { method: api.method, headers, signal: AbortSignal.timeout(api.timeoutMs) };

    if (api.method === 'POST' && api.parameterStyle === 'json') {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(parameters);
    } else {
      for (const [name, value] of Object.entries(parameters)) {
        url.searchParams.set(name, String(value));
      }
    }

    return { url, init };
  }

  /**
   * Interpreta a resposta da API conforme os caminhos configurados.
   *
   * @param {object} payload
   * @param {boolean} httpOk
   * @returns {{ success: boolean, nickname?: string, level?: unknown, likesBefore?: unknown, likesAfter?: unknown, likesGiven?: unknown, message?: string }}
   */
  #parse(payload, httpOk) {
    const { response } = config.like;
    const flag = firstDefined(payload, response.successPaths);

    const success =
      flag === undefined
        ? httpOk
        : response.successValues.some(
            (value) => String(value).toLowerCase() === String(flag).toLowerCase(),
          );

    const likesBefore = firstDefined(payload, response.likesBeforePaths);
    const likesAfter = firstDefined(payload, response.likesAfterPaths);
    const likesGiven = firstDefined(payload, response.likesGivenPaths);

    return {
      success,
      nickname: firstDefined(payload, response.nicknamePaths),
      level: firstDefined(payload, response.levelPaths),
      likesBefore,
      likesAfter,
      likesGiven:
        likesGiven ??
        (Number.isFinite(Number(likesAfter)) && Number.isFinite(Number(likesBefore))
          ? Number(likesAfter) - Number(likesBefore)
          : undefined),
      message: firstDefined(payload, response.messagePaths),
    };
  }

  /**
   * Envia os likes para o jogador informado.
   *
   * @param {{ playerId: string, region: string }} params
   * @returns {Promise<object>}
   */
  async send({ playerId, region }) {
    const { url, init } = this.#buildRequest({ playerId, region });

    this.#logger.debug(`Requisicao de like: ${init.method} ${url.origin}${url.pathname}`);

    let httpResponse;

    try {
      httpResponse = await fetch(url, init);
    } catch (error) {
      this.#logger.error('Falha de rede ao contatar a API de likes:', error);

      throw new TicketError(
        error.name === 'TimeoutError'
          ? 'A API de likes demorou demais para responder. Tente novamente em instantes.'
          : 'Nao foi possivel contatar a API de likes. Tente novamente em instantes.',
      );
    }

    const text = await httpResponse.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      this.#logger.warn(`Resposta nao-JSON da API de likes (HTTP ${httpResponse.status}).`);

      throw new TicketError('A API de likes retornou uma resposta em formato inesperado.');
    }

    const result = this.#parse(payload, httpResponse.ok);

    if (!httpResponse.ok || !result.success) {
      this.#logger.warn(
        `API de likes recusou o envio (HTTP ${httpResponse.status}): ${result.message ?? text.slice(0, 200)}`,
      );

      throw new TicketError(
        result.message
          ? `A API de likes recusou o envio: ${result.message}`
          : `A API de likes recusou o envio (HTTP ${httpResponse.status}).`,
      );
    }

    return result;
  }
}

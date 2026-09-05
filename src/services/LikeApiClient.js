import { config } from '../config/index.js';
import { formatDateTime } from '../utils/format.js';
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
 * O formato da requisicao e a leitura da resposta seguem o contrato
 * declarado em `config/like.js`, sem valores fixos no codigo.
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
   * @param {{ playerId: string, region: string, quantity?: number }} params
   * @returns {{ url: URL, init: RequestInit }}
   */
  #buildRequest({ playerId, region, quantity }) {
    const { api } = config.like;
    const url = new URL(api.path, api.baseUrl);
    const headers = { Accept: 'application/json', ...api.extraHeaders };
    const parameters = { ...api.extraParams, [api.playerIdParam]: playerId };

    if (api.regionParam) {
      parameters[api.regionParam] = region;
    }

    if (api.quantityParam && quantity) {
      parameters[api.quantityParam] = quantity;
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
   * Resolve um link retornado pela API (absoluto ou relativo) contra o endereco base.
   *
   * @param {unknown} value
   * @returns {string|undefined}
   */
  #resolveLink(value) {
    if (!value) {
      return undefined;
    }

    try {
      return new URL(String(value), config.like.api.baseUrl).toString();
    } catch {
      return String(value);
    }
  }

  /**
   * Mensagem amigavel para um HTTP de erro sem mensagem propria no corpo.
   *
   * @param {number} status
   * @returns {string}
   */
  #httpErrorMessage(status) {
    return config.like.httpErrorMessages[status] ?? `A API de likes retornou um erro (HTTP ${status}).`;
  }

  /**
   * Interpreta o corpo da resposta conforme os caminhos configurados.
   *
   * @param {object} payload
   * @returns {object}
   */
  #parse(payload) {
    const { response } = config.like;
    const flag = firstDefined(payload, response.successPaths);
    const success = response.successValues.some(
      (value) => String(value).toLowerCase() === String(flag).toLowerCase(),
    );

    const availableAtRaw = firstDefined(payload, response.availableAtPaths);

    return {
      success,
      message: firstDefined(payload, response.messagePaths),
      availableAt: availableAtRaw ? new Date(String(availableAtRaw)) : undefined,
      nickname: firstDefined(payload, response.nicknamePaths),
      source: firstDefined(payload, response.sourcePaths),
      likesBefore: firstDefined(payload, response.likesBeforePaths),
      likesAfter: firstDefined(payload, response.likesAfterPaths),
      likesGiven: firstDefined(payload, response.likesGivenPaths),
      quota: {
        limit: firstDefined(payload, response.quotaLimitPaths),
        used: firstDefined(payload, response.quotaUsedPaths),
        remaining: firstDefined(payload, response.quotaRemainingPaths),
      },
      receiptUrl: this.#resolveLink(firstDefined(payload, response.receiptUrlPaths)),
    };
  }

  /**
   * Envia os likes para o jogador informado.
   *
   * @param {{ playerId: string, region: string, quantity?: number }} params
   * @returns {Promise<object>}
   */
  async send({ playerId, region, quantity }) {
    const { url, init } = this.#buildRequest({ playerId, region, quantity });

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

    if (!httpResponse.ok) {
      const message = firstDefined(payload, config.like.response.messagePaths);

      this.#logger.warn(`API de likes recusou o envio (HTTP ${httpResponse.status}): ${message ?? text.slice(0, 200)}`);

      throw new TicketError(message ?? this.#httpErrorMessage(httpResponse.status));
    }

    const result = this.#parse(payload);

    if (!result.success) {
      // HTTP 200 com sucesso:false e o formato usado pela API quando o ID
      // ainda esta no tempo de espera do proprio provedor.
      const suffix = result.availableAt
        ? ` Libera novamente em ${formatDateTime(result.availableAt)}.`
        : '';

      this.#logger.info(
        `API de likes recusou o envio para ${playerId}: ${result.message ?? 'motivo nao informado'}`,
      );

      throw new TicketError(`${result.message ?? 'A API de likes recusou o envio.'}${suffix}`);
    }

    return result;
  }
}

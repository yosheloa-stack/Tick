/**
 * Configuracao do comando /like.
 *
 * A chave da API fica no arquivo `.env` (LIKE_API_KEY), nunca neste arquivo.
 * Os nomes de parametros e de campos da resposta sao declarados aqui para que
 * a integracao seja ajustada sem alterar codigo.
 */

export const like = {
  /** Intervalo obrigatorio entre dois envios para o mesmo ID de jogador. */
  cooldownHours: 24,
  /** Canais onde o comando pode ser usado. Lista vazia libera todos. */
  allowedChannelIds: [],
  /** Cargos isentos do intervalo de espera. Lista vazia desativa a isencao. */
  bypassRoleIds: [],
  /** Regiao usada quando o membro nao informa nenhuma. */
  defaultRegion: 'br',
  /** Regioes oferecidas na opcao do comando (maximo 25). */
  regions: [
    { label: 'Brasil', value: 'br' },
    { label: 'America do Norte', value: 'na' },
    { label: 'America do Sul', value: 'sac' },
    { label: 'Europa', value: 'eu' },
    { label: 'India', value: 'ind' },
    { label: 'Indonesia', value: 'id' },
    { label: 'Singapura', value: 'sg' },
    { label: 'Tailandia', value: 'th' },
    { label: 'Vietna', value: 'vn' },
    { label: 'Taiwan', value: 'tw' },
    { label: 'Oriente Medio', value: 'me' },
    { label: 'Paquistao', value: 'pk' },
    { label: 'Bangladesh', value: 'bd' },
    { label: 'CIS', value: 'cis' },
  ],

  api: {
    /** Endereco base da API. */
    baseUrl: 'https://autolikesystem.com.br',
    /** Caminho do endpoint de envio de likes. */
    path: '/api/like',
    /** Metodo HTTP: GET ou POST. */
    method: 'GET',
    /** Onde os parametros viajam em requisicoes POST: 'query' ou 'json'. */
    parameterStyle: 'query',
    /** Nome do parametro que recebe o ID do jogador. */
    playerIdParam: 'uid',
    /** Nome do parametro que recebe a regiao. Use null para nao enviar. */
    regionParam: 'region',
    /** Como a chave e enviada: 'query', 'header', 'bearer' ou 'none'. */
    authStyle: 'query',
    /** Nome do parametro ou do cabecalho que carrega a chave. */
    authName: 'key',
    /** Tempo maximo de espera pela resposta, em milissegundos. */
    timeoutMs: 15000,
    /** Parametros fixos adicionais enviados em toda requisicao. */
    extraParams: {},
    /** Cabecalhos adicionais enviados em toda requisicao. */
    extraHeaders: {},
  },

  /**
   * Leitura da resposta da API.
   *
   * Cada campo lista os caminhos possiveis dentro do JSON; o primeiro que
   * existir na resposta e utilizado. Aceita caminhos aninhados com ponto.
   */
  response: {
    /** Campos que indicam sucesso. Ausentes, considera-se sucesso o HTTP 2xx. */
    successPaths: ['status', 'success', 'ok'],
    /** Valores tratados como sucesso quando o campo acima e texto ou numero. */
    successValues: [true, 1, 'true', 'ok', 'success', 'sucesso', 200],
    nicknamePaths: ['nickname', 'player.nickname', 'data.nickname', 'PlayerNickname'],
    likesBeforePaths: ['likes_before', 'data.likes_before', 'LikesbeforeCommand'],
    likesAfterPaths: ['likes_after', 'data.likes_after', 'LikesafterCommand'],
    likesGivenPaths: ['likes_given', 'data.likes_given', 'LikesGivenByAPI'],
    levelPaths: ['level', 'player.level', 'data.level'],
    messagePaths: ['message', 'msg', 'error', 'detail', 'description'],
  },
};

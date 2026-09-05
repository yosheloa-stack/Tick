/**
 * Configuracao do comando /like.
 *
 * A chave da API fica no arquivo `.env` (LIKE_API_KEY), nunca neste arquivo.
 * Os valores abaixo seguem o contrato documentado em
 * https://autolikesystem.com.br/docs#like (Auto System).
 */

export const like = {
  /** Intervalo obrigatorio entre dois envios para o mesmo ID de jogador. */
  cooldownHours: 24,
  /** Canais onde o comando pode ser usado. Lista vazia libera todos. */
  allowedChannelIds: [],
  /** Cargos isentos do intervalo de espera. Lista vazia desativa a isencao. */
  bypassRoleIds: [],
  /** Regiao usada quando o membro nao informa nenhuma. A propria API assume BR se omitida. */
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

  /**
   * Quantidade customizada de likes por envio (parametro `qtd` da API).
   * Sem informar, a API usa o padrao da casa e cobra apenas o que entrou de fato.
   */
  customQuantity: {
    enabled: true,
    min: 1,
    max: 2000,
  },

  api: {
    /** Endereco base da API. */
    baseUrl: 'https://autolikesystem.com.br',
    /** Caminho do endpoint de envio de likes. */
    path: '/v1/like',
    /** Metodo HTTP: GET ou POST. */
    method: 'GET',
    /** Onde os parametros viajam em requisicoes POST: 'query' ou 'json'. */
    parameterStyle: 'query',
    /** Nome do parametro que recebe o ID do jogador. */
    playerIdParam: 'uid',
    /** Nome do parametro que recebe a regiao. Use null para nao enviar. */
    regionParam: 'region',
    /** Nome do parametro que recebe a quantidade customizada. Use null para nao enviar. */
    quantityParam: 'qtd',
    /** Como a chave e enviada: 'query', 'header', 'bearer' ou 'none'. */
    authStyle: 'query',
    /** Nome do parametro (authStyle 'query') ou do cabecalho (authStyle 'header') que carrega a chave. */
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
   * existir na resposta e utilizado. Aceita caminhos aninhados com ponto
   * (ex.: "cota.restam").
   */
  response: {
    /** Campo que indica sucesso do envio. */
    successPaths: ['sucesso'],
    /** Valores tratados como sucesso. */
    successValues: [true, 'true'],
    /** Mensagem de erro ou de bloqueio (ex.: ID ainda no tempo de espera). */
    messagePaths: ['erro', 'message'],
    /** Horario em que o ID volta a poder receber likes, quando bloqueado pela propria API. */
    availableAtPaths: ['libera_em'],
    nicknamePaths: ['nick', 'nickname'],
    likesBeforePaths: ['likes_antes', 'likes_before'],
    likesAfterPaths: ['likes_depois', 'likes_after'],
    likesGivenPaths: ['likes_enviados', 'likes_given'],
    sourcePaths: ['fonte'],
    quotaLimitPaths: ['cota.limite'],
    quotaUsedPaths: ['cota.usadas'],
    quotaRemainingPaths: ['cota.restam'],
    /** Link permanente do comprovante (pagina, nao expira). */
    receiptUrlPaths: ['comprovante'],
  },

  /**
   * Mensagens exibidas conforme o codigo HTTP retornado pela API,
   * quando a resposta nao traz uma mensagem propria no campo `erro`.
   */
  httpErrorMessages: {
    400: 'O UID informado esta ausente ou invalido. Confira o ID.',
    401: 'Chave da API invalida. Confira se ela foi copiada por completo.',
    402: 'Saldo insuficiente na conta da API. Compre mais likes.',
    403: 'Chave da API revogada ou vencida. Fale com o suporte da API.',
    404: 'Jogador nao encontrado. Confira o UID e a regiao.',
    429: 'A cota da chave foi esgotada. Solicite um aumento de limite ao suporte da API.',
  },
};

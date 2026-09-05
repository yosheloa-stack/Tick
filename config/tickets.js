/**
 * Configuracao funcional do sistema de tickets.
 *
 * Este e o unico arquivo que precisa ser editado no dia a dia.
 * Credenciais ficam no arquivo `.env`.
 *
 * Projeto desenvolvido por YoshGGx.
 */

export const appearance = {
  /** Cor primaria usada nos embeds (hexadecimal). */
  primaryColor: 0x7b2fff,
  /** Cor usada em avisos e confirmacoes destrutivas. */
  warningColor: 0xd9a406,
  /** Cor usada em erros. */
  dangerColor: 0xd94c4c,
  /** Cor usada em confirmacoes positivas. */
  successColor: 0x3fa96a,
  /** Texto exibido no rodape dos embeds. */
  footerText: 'Central de Atendimento',
  /** Credito do desenvolvedor, anexado ao rodape. Use null para ocultar. */
  developerCredit: 'Desenvolvido por YoshGGx',
};

export const panel = {
  title: 'Central de Atendimento',
  description: [
    'Bem-vindo ao suporte.',
    '',
    'Para agilizar o seu atendimento, selecione abaixo a categoria correspondente',
    'e informe os dados solicitados no formulario.',
    '',
    'Ao abrir um atendimento, tenha em maos:',
    '- Descricao detalhada da duvida ou problema',
    '- Prints ou imagens da tela, quando aplicavel',
    '- ID da transacao ou numero do pedido, em casos de compra e venda',
    '',
    'A equipe respondera assim que possivel. Evite marcar a staff sem necessidade,',
    'isso nao acelera o atendimento e prejudica a fila.',
  ].join('\n'),
  /** URL de uma imagem exibida no painel. Use null para desativar. */
  imageUrl: null,
  /** URL de uma miniatura exibida no painel. Use null para desativar. */
  thumbnailUrl: null,
  /** Texto exibido no menu de selecao. */
  selectPlaceholder: 'Clique aqui para ver as opcoes',
};

export const tickets = {
  /** ID da categoria (canal do tipo categoria) onde os tickets serao criados. */
  categoryId: '000000000000000000',
  /** ID da categoria usada quando a principal atingir o limite de 50 canais. Opcional. */
  overflowCategoryId: null,
  /** ID do canal que recebe os registros de abertura e fechamento. */
  logChannelId: '000000000000000000',
  /** Cargos com acesso a todos os tickets e aos comandos de gerenciamento. */
  staffRoleIds: ['000000000000000000'],
  /** Quantidade maxima de tickets abertos simultaneamente por membro. */
  maxOpenPerUser: 1,
  /** Padrao de nome do canal. Variaveis: {number}, {user}, {category}. */
  channelNamePattern: 'ticket-{number}',
  /** Segundos de espera entre a confirmacao de fechamento e a exclusao do canal. */
  deleteDelaySeconds: 10,
  /** Envia a transcricao em DM para o autor do ticket ao fechar. */
  sendTranscriptToAuthor: true,
  /** Quantidade maxima de mensagens incluidas na transcricao. */
  transcriptMessageLimit: 2000,
};

/**
 * Categorias exibidas no menu do painel.
 *
 * id            identificador interno, usado nos customIds (a-z, 0-9, hifen)
 * label         texto exibido no menu
 * description   texto auxiliar exibido no menu
 * emoji         emoji do item do menu (null para nenhum)
 * staffRoleIds  cargos adicionais com acesso aos tickets desta categoria
 * questions     campos do formulario exibido ao abrir o ticket (maximo 5)
 */
export const categories = [
  {
    id: 'denuncias',
    label: 'Denuncias',
    description: 'Reportar membros',
    emoji: null,
    staffRoleIds: [],
    openingMessage:
      'Descreva a ocorrencia com o maximo de detalhes e anexe as provas disponiveis.',
    questions: [
      {
        id: 'denunciado',
        label: 'Quem voce esta denunciando?',
        placeholder: 'Nome de usuario ou ID',
        style: 'short',
        required: true,
        maxLength: 100,
      },
      {
        id: 'motivo',
        label: 'Descreva a ocorrencia',
        placeholder: 'O que aconteceu, quando e onde',
        style: 'paragraph',
        required: true,
        maxLength: 1000,
      },
      {
        id: 'provas',
        label: 'Provas disponiveis',
        placeholder: 'Links de prints, videos ou IDs de mensagem',
        style: 'paragraph',
        required: false,
        maxLength: 500,
      },
    ],
  },
  {
    id: 'cargos',
    label: 'Comprar cargos',
    description: 'Adquirir cargos pagos',
    emoji: null,
    staffRoleIds: [],
    openingMessage:
      'Informe o cargo desejado e a forma de pagamento. Um atendente concluira a compra.',
    questions: [
      {
        id: 'cargo',
        label: 'Qual cargo deseja adquirir?',
        placeholder: 'Nome do cargo',
        style: 'short',
        required: true,
        maxLength: 100,
      },
      {
        id: 'pagamento',
        label: 'Forma de pagamento',
        placeholder: 'Pix, cartao, saldo, etc.',
        style: 'short',
        required: true,
        maxLength: 100,
      },
      {
        id: 'observacoes',
        label: 'Observacoes',
        placeholder: 'Informacoes adicionais',
        style: 'paragraph',
        required: false,
        maxLength: 500,
      },
    ],
  },
  {
    id: 'parceria',
    label: 'Parceria',
    description: 'Solicitacoes de parceria',
    emoji: null,
    staffRoleIds: [],
    openingMessage:
      'Envie os dados da sua comunidade. A equipe avaliara a proposta e retornara neste canal.',
    questions: [
      {
        id: 'servidor',
        label: 'Nome e convite do servidor',
        placeholder: 'Nome + link de convite permanente',
        style: 'short',
        required: true,
        maxLength: 200,
      },
      {
        id: 'membros',
        label: 'Quantidade de membros',
        placeholder: 'Somente numeros',
        style: 'short',
        required: true,
        maxLength: 20,
      },
      {
        id: 'proposta',
        label: 'Proposta de parceria',
        placeholder: 'O que sera oferecido de cada lado',
        style: 'paragraph',
        required: true,
        maxLength: 1000,
      },
    ],
  },
];

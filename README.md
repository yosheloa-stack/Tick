# Tick

Sistema de tickets para Discord construído em JavaScript com [discord.js](https://discord.js.org) v14.
Publica um painel de atendimento com menu de categorias, coleta as informações do solicitante por
formulário, cria um canal privado por atendimento e arquiva a transcrição completa no fechamento.

## Recursos

- Painel de atendimento com menu de categorias configurável.
- Formulário (modal) por categoria, com perguntas próprias.
- Canal privado por ticket, com permissões aplicadas ao solicitante e aos cargos de staff.
- Controle de atendimento: assumir, adicionar e remover participantes, renomear e encerrar.
- Confirmação obrigatória antes do fechamento.
- Transcrição em HTML enviada ao canal de logs e, opcionalmente, ao solicitante por mensagem direta.
- Limite de tickets simultâneos por membro e proteção contra aberturas duplicadas.
- Registro de abertura e fechamento em canal de logs, com duração e responsável.
- Persistência local em arquivo JSON com escrita atômica.

## Requisitos

- Node.js 18.17 ou superior.
- Uma aplicação criada no [Discord Developer Portal](https://discord.com/developers/applications).

## Instalação

```bash
git clone <url-do-repositorio>
cd Tick
npm install
cp .env.example .env
```

## Credenciais

Preencha o arquivo `.env`:

| Variável        | Obrigatória | Descrição                                                                 |
| --------------- | ----------- | ------------------------------------------------------------------------- |
| `DISCORD_TOKEN` | Sim         | Token do bot (Developer Portal > Bot > Token).                            |
| `CLIENT_ID`     | Sim         | ID da aplicação (Developer Portal > General Information > Application ID).|
| `GUILD_ID`      | Não         | Servidor de registro dos comandos. Vazio registra globalmente.            |
| `LOG_LEVEL`     | Não         | `error`, `warn`, `info` (padrão) ou `debug`.                              |

## Configuração do servidor

Antes de iniciar, crie no servidor:

1. Uma categoria (canal do tipo categoria) para receber os canais de ticket.
2. Um canal de texto para os registros e transcrições.
3. Ao menos um cargo de staff com acesso aos atendimentos.

Copie os IDs (modo desenvolvedor ativado no Discord) e edite `config/tickets.js`:

| Campo                            | Descrição                                                            |
| -------------------------------- | -------------------------------------------------------------------- |
| `tickets.categoryId`             | Categoria onde os canais de ticket são criados.                      |
| `tickets.overflowCategoryId`     | Categoria reserva usada quando a principal atinge 50 canais.         |
| `tickets.logChannelId`           | Canal que recebe os registros e as transcrições.                     |
| `tickets.staffRoleIds`           | Cargos com acesso a todos os tickets e aos comandos de gerenciamento.|
| `tickets.maxOpenPerUser`         | Tickets simultâneos permitidos por membro.                           |
| `tickets.channelNamePattern`     | Padrão do nome do canal. Variáveis: `{number}`, `{user}`, `{category}`.|
| `tickets.deleteDelaySeconds`     | Intervalo entre a confirmação de fechamento e a exclusão do canal.   |
| `tickets.sendTranscriptToAuthor` | Envia a transcrição ao solicitante por mensagem direta.              |
| `tickets.transcriptMessageLimit` | Máximo de mensagens incluídas na transcrição.                        |
| `panel`                          | Título, descrição, imagens e texto do menu do painel.                |
| `appearance`                     | Cores dos embeds, texto do rodapé e crédito do desenvolvedor.        |
| `categories`                     | Categorias do menu e perguntas de cada formulário.                   |

Cada categoria aceita:

```js
{
  id: 'denuncias',            // identificador interno (a-z, 0-9, hífen)
  label: 'Denuncias',         // texto exibido no menu
  description: 'Reportar membros',
  emoji: null,                // emoji do item do menu
  staffRoleIds: [],           // cargos adicionais com acesso a esta categoria
  openingMessage: 'Texto exibido na abertura do canal.',
  questions: [                // até 5 campos por formulário
    {
      id: 'motivo',
      label: 'Descreva a ocorrencia',
      placeholder: 'O que aconteceu',
      style: 'paragraph',     // 'short' ou 'paragraph'
      required: true,
      maxLength: 1000,
    },
  ],
}
```

### Imagem do painel

O banner exibido abaixo do texto do painel e a miniatura do canto superior são definidos em
`config/tickets.js`, no bloco `panel`:

```js
export const panel = {
  imageUrl: 'https://cdn.discordapp.com/attachments/000/000/banner.png', // banner (null desativa)
  thumbnailUrl: null,                                                    // miniatura (null desativa)
};
```

O Discord aceita apenas URLs públicas. Para obter a de uma imagem própria, envie o arquivo em um
canal do servidor, clique com o botão direito na imagem, escolha **Copiar link** e cole o endereço
no campo correspondente. Depois de alterar, republique o painel com `/painel enviar` ou atualize o
existente com `/painel atualizar <id-da-mensagem>`.

A configuração é validada na inicialização: IDs inválidos, categorias duplicadas ou formulários
acima do limite interrompem o processo com a lista de erros encontrados.

## Permissões e intents

No Developer Portal, em **Bot > Privileged Gateway Intents**, ative **Message Content Intent**.
Ele é necessário para que o conteúdo das mensagens apareça nas transcrições.

Convite do bot com o escopo `bot applications.commands` e as permissões:

- Gerenciar Canais
- Gerenciar Cargos
- Ver Canais
- Enviar Mensagens
- Inserir Links
- Anexar Arquivos
- Ler o Histórico de Mensagens

Permissões ausentes são registradas no console durante a inicialização.

## Execução

```bash
npm run deploy   # registra os comandos de barra
npm start        # inicia o bot
```

Durante o desenvolvimento, `npm run dev` reinicia o processo a cada alteração e
`npm run deploy:clear` remove os comandos registrados.

Com `GUILD_ID` preenchido, os comandos ficam disponíveis imediatamente no servidor informado.
Sem `GUILD_ID`, o registro é global e a propagação pode levar até uma hora.

## Problemas comuns

| Mensagem                                                | Causa e solução                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ERR_MODULE_NOT_FOUND: Cannot find package 'discord.js'` | Dependências não instaladas. Execute `npm install` na raiz do projeto (a pasta que contém `package.json`). |
| `Cannot find module ... src\index.js`                   | Comando executado de dentro de `src`. Volte para a raiz e use `npm start`.                              |
| `Variavel de ambiente ausente: DISCORD_TOKEN`           | Arquivo `.env` inexistente ou incompleto. Copie `.env.example` para `.env` e preencha os valores.        |
| `Configuracao invalida`                                 | IDs ainda com o valor de exemplo em `config/tickets.js`. Substitua pelos IDs reais do seu servidor.     |
| `Permissoes ausentes em <servidor>`                     | O cargo do bot não tem as permissões listadas acima. Ajuste as permissões e reinicie.                 |

O diretório `node_modules/` não acompanha o download do repositório: após baixar ou clonar o
projeto, `npm install` é sempre o primeiro comando.

## Comandos

| Comando                        | Acesso            | Descrição                                              |
| ------------------------------ | ----------------- | ------------------------------------------------------ |
| `/painel enviar [canal]`       | Gerenciar Servidor| Publica o painel de atendimento.                       |
| `/painel atualizar <mensagem>` | Gerenciar Servidor| Atualiza um painel já publicado.                       |
| `/ticket assumir`              | Staff             | Assume o atendimento do canal atual.                   |
| `/ticket fechar [motivo]`      | Staff ou autor    | Encerra o ticket e arquiva a transcrição.              |
| `/ticket adicionar <membro>`   | Staff             | Concede acesso ao canal do ticket.                     |
| `/ticket remover <membro>`     | Staff             | Remove o acesso ao canal do ticket.                    |
| `/ticket renomear <nome>`      | Staff             | Renomeia o canal do ticket.                            |
| `/ticket transcricao`          | Staff             | Gera a transcrição sem encerrar o atendimento.         |
| `/ticket informacoes`          | Staff ou autor    | Exibe os dados registrados do ticket.                  |

Administradores do servidor são sempre tratados como staff.

## Fluxo de atendimento

1. O membro seleciona uma categoria no painel e preenche o formulário.
2. O bot cria o canal privado, publica o resumo com as respostas e fixa a mensagem de controle.
3. A equipe assume o atendimento pelo botão ou por `/ticket assumir`.
4. No encerramento, a ação é confirmada, a transcrição é enviada ao canal de logs e ao solicitante,
   e o canal é excluído após o intervalo configurado.

## Estrutura do projeto

```
config/tickets.js          configuração funcional (painel, categorias, limites)
scripts/deploy-commands.js registro dos comandos de barra na API do Discord
src/index.js               ponto de entrada e tratamento de sinais do processo
src/config/                carregamento e validação de configuração e variáveis de ambiente
src/core/                  cliente, registros de comandos/componentes/eventos e roteador
src/commands/              comandos de barra (subcomandos em src/commands/ticket/subcommands)
src/components/            botões, menus e formulários
src/events/                ouvintes do gateway
src/services/              regras de negócio e geração de transcrições
src/store/                 persistência em arquivo JSON
src/ui/                    construtores de embeds, menus, botões e formulários
src/utils/                 utilidades de formatação, permissões e respostas
data/                      base local de tickets (gerada em tempo de execução)
```

Convenções de carregamento automático:

- `src/commands`: cada arquivo exporta `data` (builder) e `execute`. Uma subpasta com `index.js`
  é tratada como um único comando, permitindo dividir subcomandos em arquivos internos.
- `src/components`: cada arquivo exporta `id` (prefixo do `customId`) e `execute`. Argumentos
  anexados ao `customId` (`ticket:open:denuncias`) chegam ao handler como lista.
- `src/events`: cada arquivo exporta `name`, `once` e `execute`.

## Persistência

Os tickets são gravados em `data/tickets.json`. As escritas são enfileiradas e aplicadas de forma
atômica (arquivo temporário seguido de renomeação), evitando perda de dados em encerramentos
inesperados. O diretório `data/` é ignorado pelo controle de versão; inclua-o na rotina de backup.

## Qualidade

```bash
npm run lint
```

## Créditos

Projeto desenvolvido por **YoshGGx**.

O crédito exibido no rodapé dos embeds e das transcrições é controlado por
`appearance.developerCredit`, em `config/tickets.js`.

## Licença

MIT. Consulte o arquivo [LICENSE](LICENSE).

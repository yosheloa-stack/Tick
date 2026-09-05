import { TicketError } from '../utils/TicketError.js';
import { isStaff } from '../utils/permissions.js';
import { replyError } from '../utils/interactions.js';

/**
 * Direciona cada interacao recebida para o handler responsavel e centraliza
 * o tratamento de erros e as verificacoes de acesso.
 */
export class InteractionRouter {
  #context;
  #logger;

  /**
   * @param {object} context
   */
  constructor(context) {
    this.#context = context;
    this.#logger = context.logger.child('router');
  }

  /**
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<void>}
   */
  async dispatch(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await this.#handleCommand(interaction);
        return;
      }

      if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
        await this.#handleComponent(interaction);
      }
    } catch (error) {
      await this.#handleError(interaction, error);
    }
  }

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async #handleCommand(interaction) {
    const command = this.#context.client.commands.get(interaction.commandName);

    if (!command) {
      this.#logger.warn(`Comando desconhecido recebido: /${interaction.commandName}`);
      await replyError(interaction, 'Este comando nao esta mais disponivel.');
      return;
    }

    if (command.guildOnly !== false && !interaction.inGuild()) {
      await replyError(interaction, 'Este comando so pode ser usado dentro de um servidor.');
      return;
    }

    if (command.staffOnly && !isStaff(interaction.member)) {
      await replyError(interaction, 'Voce nao possui permissao para usar este comando.');
      return;
    }

    this.#logger.debug(
      `/${interaction.commandName} executado por ${interaction.user.tag} (${interaction.user.id})`,
    );

    await command.execute(interaction, this.#context);
  }

  /**
   * @param {import('discord.js').MessageComponentInteraction|import('discord.js').ModalSubmitInteraction} interaction
   * @returns {Promise<void>}
   */
  async #handleComponent(interaction) {
    const resolved = this.#context.client.components.resolve(interaction.customId);

    if (!resolved) {
      this.#logger.warn(`Componente sem handler: ${interaction.customId}`);
      await replyError(
        interaction,
        'Esta acao expirou ou nao esta mais disponivel. Utilize o painel novamente.',
      );
      return;
    }

    const { handler, args } = resolved;

    if (handler.staffOnly && !isStaff(interaction.member)) {
      await replyError(interaction, 'Somente a equipe de atendimento pode utilizar esta acao.');
      return;
    }

    await handler.execute(interaction, this.#context, args);
  }

  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {unknown} error
   * @returns {Promise<void>}
   */
  async #handleError(interaction, error) {
    if (error instanceof TicketError) {
      await replyError(interaction, error.message).catch(() => undefined);
      return;
    }

    this.#logger.error('Erro ao processar interacao:', error);

    if (!interaction.isRepliable()) {
      return;
    }

    await replyError(
      interaction,
      'Ocorreu um erro inesperado ao processar a sua solicitacao. A equipe foi notificada.',
    ).catch(() => undefined);
  }
}

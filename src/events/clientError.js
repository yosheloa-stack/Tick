import { Events } from 'discord.js';

export default {
  name: Events.Error,
  once: false,
  /**
   * @param {object} context
   * @param {Error} error
   * @returns {void}
   */
  execute(context, error) {
    context.logger.error('Erro reportado pelo cliente do Discord:', error);
  },
};

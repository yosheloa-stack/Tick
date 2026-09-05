import { Events } from 'discord.js';

export default {
  name: Events.Warn,
  once: false,
  /**
   * @param {object} context
   * @param {string} message
   * @returns {void}
   */
  execute(context, message) {
    context.logger.warn(message);
  },
};

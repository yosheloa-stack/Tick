import { Events } from 'discord.js';
import { InteractionRouter } from '../core/InteractionRouter.js';

/** @type {InteractionRouter|null} */
let router = null;

export default {
  name: Events.InteractionCreate,
  once: false,
  /**
   * @param {object} context
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<void>}
   */
  async execute(context, interaction) {
    router ??= new InteractionRouter(context);
    await router.dispatch(interaction);
  },
};

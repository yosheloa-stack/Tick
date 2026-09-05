import { Events } from 'discord.js';

export default {
  name: Events.ChannelDelete,
  once: false,
  /**
   * Mantem o registro consistente quando um canal de ticket e excluido
   * manualmente, sem passar pelo fluxo de fechamento.
   *
   * @param {object} context
   * @param {import('discord.js').GuildChannel} channel
   * @returns {Promise<void>}
   */
  async execute(context, channel) {
    await context.services.tickets.handleChannelDeleted(channel.id);
  },
};

import { ActivityType, Events } from 'discord.js';
import { missingBotPermissions } from '../utils/permissions.js';

export default {
  name: Events.ClientReady,
  once: true,
  /**
   * @param {object} context
   * @param {import('discord.js').Client} client
   * @returns {Promise<void>}
   */
  async execute(context, client) {
    context.logger.info(`Conectado como ${client.user.tag} (${client.user.id}).`);

    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'a central de atendimento', type: ActivityType.Watching }],
    });

    for (const guild of client.guilds.cache.values()) {
      const missing = missingBotPermissions(guild);

      if (missing.length > 0) {
        context.logger.warn(
          `Permissoes ausentes em ${guild.name} (${guild.id}): ${missing.join(', ')}`,
        );
      }
    }

    const openTickets = client.guilds.cache.reduce(
      (total, guild) => total + context.repository.findOpen(guild.id).length,
      0,
    );

    context.logger.info(`${openTickets} ticket(s) em aberto.`);
  },
};

import process from 'node:process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REST, Routes } from 'discord.js';
import { CommandRegistry } from '../src/core/CommandRegistry.js';
import { createLogger } from '../src/core/logger.js';
import { config } from '../src/config/index.js';

const logger = createLogger('deploy');
const sourceRoot = join(dirname(dirname(fileURLToPath(import.meta.url))), 'src');
const shouldClear = process.argv.includes('--clear');

/**
 * Registra (ou remove) os comandos de barra na API do Discord.
 *
 * Com GUILD_ID definido, o registro e feito no servidor informado e entra em
 * vigor imediatamente. Sem GUILD_ID, o registro e global e pode levar ate
 * uma hora para propagar.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const registry = new CommandRegistry(logger);
  await registry.loadFrom(join(sourceRoot, 'commands'));

  const body = shouldClear ? [] : registry.toJSON();
  const rest = new REST({ version: '10' }).setToken(config.env.token);

  const route = config.env.guildId
    ? Routes.applicationGuildCommands(config.env.clientId, config.env.guildId)
    : Routes.applicationCommands(config.env.clientId);

  const result = await rest.put(route, { body });
  const scope = config.env.guildId ? `servidor ${config.env.guildId}` : 'escopo global';

  logger.info(`${result.length} comando(s) sincronizado(s) no ${scope}.`);
}

try {
  await main();
} catch (error) {
  logger.error('Falha ao sincronizar os comandos:', error);
  process.exit(1);
}

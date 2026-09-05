/**
 * Tick - sistema de tickets para Discord.
 *
 * @author YoshGGx
 * @license MIT
 */

import process from 'node:process';
import { TicketBot } from './core/TicketBot.js';
import { logger } from './core/logger.js';

const bot = new TicketBot();

process.on('unhandledRejection', (reason) => {
  logger.error('Promessa rejeitada sem tratamento:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Excecao nao tratada:', error);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await bot.shutdown().catch((error) => logger.error('Falha ao encerrar:', error));
    process.exit(0);
  });
}

try {
  await bot.start();
} catch (error) {
  logger.error('Falha ao iniciar o bot:', error);
  process.exit(1);
}

import process from 'node:process';
import { config as loadEnv } from 'dotenv';

loadEnv();

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

/**
 * Le uma variavel de ambiente obrigatoria.
 *
 * @param {string} key
 * @returns {string}
 */
function required(key) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Variavel de ambiente ausente: ${key}. Copie o arquivo .env.example para .env e preencha os valores.`,
    );
  }

  return value;
}

/**
 * Le uma variavel de ambiente opcional.
 *
 * @param {string} key
 * @param {string|null} fallback
 * @returns {string|null}
 */
function optional(key, fallback = null) {
  const value = process.env[key]?.trim();
  return value ? value : fallback;
}

export const env = Object.freeze({
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: optional('GUILD_ID'),
  logLevel: (() => {
    const level = optional('LOG_LEVEL', 'info').toLowerCase();
    return LOG_LEVELS.includes(level) ? level : 'info';
  })(),
  nodeEnv: optional('NODE_ENV', 'production'),
});

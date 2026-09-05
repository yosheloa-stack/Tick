import process from 'node:process';
import { env } from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const LABELS = {
  error: 'ERROR',
  warn: 'WARN ',
  info: 'INFO ',
  debug: 'DEBUG',
};

/**
 * Formata o horario no padrao ISO reduzido, usado como prefixo das linhas de log.
 *
 * @returns {string}
 */
function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Escreve uma linha de log se o nivel estiver habilitado.
 *
 * @param {keyof LEVELS} level
 * @param {string} scope
 * @param {unknown[]} args
 * @returns {void}
 */
function write(level, scope, args) {
  if (LEVELS[level] > LEVELS[env.logLevel]) {
    return;
  }

  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  const prefix = `${timestamp()} ${LABELS[level]} [${scope}]`;

  const body = args
    .map((value) => {
      if (value instanceof Error) {
        return value.stack ?? `${value.name}: ${value.message}`;
      }

      return typeof value === 'string' ? value : JSON.stringify(value);
    })
    .join(' ');

  stream.write(`${prefix} ${body}\n`);
}

/**
 * Cria um logger com escopo fixo.
 *
 * @param {string} scope
 * @returns {{error: Function, warn: Function, info: Function, debug: Function, child: Function}}
 */
export function createLogger(scope = 'app') {
  return {
    error: (...args) => write('error', scope, args),
    warn: (...args) => write('warn', scope, args),
    info: (...args) => write('info', scope, args),
    debug: (...args) => write('debug', scope, args),
    child: (childScope) => createLogger(`${scope}:${childScope}`),
  };
}

export const logger = createLogger('tick');

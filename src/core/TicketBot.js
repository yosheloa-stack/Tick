import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, GatewayIntentBits, Options } from 'discord.js';
import { config } from '../config/index.js';
import { TicketService } from '../services/TicketService.js';
import { TranscriptService } from '../services/TranscriptService.js';
import { TicketRepository } from '../store/TicketRepository.js';
import { CommandRegistry } from './CommandRegistry.js';
import { ComponentRegistry } from './ComponentRegistry.js';
import { loadModulesFrom } from './ModuleLoader.js';
import { createLogger } from './logger.js';

const SOURCE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PROJECT_ROOT = dirname(SOURCE_ROOT);

/**
 * Cliente do Discord com os registros, servicos e dependencias do bot.
 */
export class TicketBot extends Client {
  /** @type {CommandRegistry} */
  commands;
  /** @type {ComponentRegistry} */
  components;
  /** @type {{ tickets: TicketService, transcripts: TranscriptService }} */
  services;
  /** @type {TicketRepository} */
  repository;
  /** @type {object} */
  logger;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      allowedMentions: { parse: ['users', 'roles'] },
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: { interval: 3600, lifetime: 1800 },
      },
    });

    this.logger = createLogger('bot');
    this.commands = new CommandRegistry(this.logger.child('commands'));
    this.components = new ComponentRegistry(this.logger.child('components'));
    this.repository = new TicketRepository(join(PROJECT_ROOT, 'data', 'tickets.json'));

    const transcripts = new TranscriptService();

    this.services = {
      transcripts,
      tickets: new TicketService({
        client: this,
        repository: this.repository,
        transcripts,
        logger: this.logger.child('tickets'),
      }),
    };
  }

  /**
   * Contexto injetado nos handlers de comandos, componentes e eventos.
   *
   * @returns {{ client: TicketBot, config: typeof config, services: object, repository: TicketRepository, logger: object }}
   */
  get context() {
    return {
      client: this,
      config,
      services: this.services,
      repository: this.repository,
      logger: this.logger,
    };
  }

  /**
   * Carrega os modulos, conecta os eventos e autentica o bot.
   *
   * @returns {Promise<void>}
   */
  async start() {
    await this.repository.init();
    await this.commands.loadFrom(join(SOURCE_ROOT, 'commands'));
    await this.components.loadFrom(join(SOURCE_ROOT, 'components'));
    await this.#registerEvents(join(SOURCE_ROOT, 'events'));

    await this.login(config.env.token);
  }

  /**
   * Encerra a conexao com o gateway.
   *
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Encerrando conexao com o Discord.');
    await this.destroy();
  }

  /**
   * @param {string} directory
   * @returns {Promise<void>}
   */
  async #registerEvents(directory) {
    const modules = await loadModulesFrom(directory);

    for (const { path, module } of modules) {
      if (!module.name || typeof module.execute !== 'function') {
        throw new Error(`Evento invalido em ${path}: e necessario exportar "name" e "execute".`);
      }

      const listener = async (...args) => {
        try {
          await module.execute(this.context, ...args);
        } catch (error) {
          this.logger.error(`Falha no evento ${module.name}:`, error);
        }
      };

      if (module.once) {
        this.once(module.name, listener);
      } else {
        this.on(module.name, listener);
      }

      this.logger.debug(`Evento registrado: ${module.name}`);
    }

    this.logger.info(`${modules.length} evento(s) registrado(s).`);
  }
}

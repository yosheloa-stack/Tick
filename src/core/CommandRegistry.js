import { Collection } from 'discord.js';
import { loadModulesFrom } from './ModuleLoader.js';

/**
 * Registro dos comandos de barra disponiveis.
 */
export class CommandRegistry {
  #commands = new Collection();
  #logger;

  /**
   * @param {object} logger
   */
  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Carrega e valida todos os comandos de um diretorio.
   *
   * @param {string} directory
   * @returns {Promise<void>}
   */
  async loadFrom(directory) {
    const modules = await loadModulesFrom(directory);

    for (const { path, module } of modules) {
      if (!module.data || typeof module.execute !== 'function') {
        throw new Error(`Comando invalido em ${path}: e necessario exportar "data" e "execute".`);
      }

      const name = module.data.name;

      if (this.#commands.has(name)) {
        throw new Error(`Comando duplicado: /${name}`);
      }

      this.#commands.set(name, module);
      this.#logger.debug(`Comando carregado: /${name}`);
    }

    this.#logger.info(`${this.#commands.size} comando(s) carregado(s).`);
  }

  /**
   * @param {string} name
   * @returns {object|undefined}
   */
  get(name) {
    return this.#commands.get(name);
  }

  /**
   * @returns {Collection<string, object>}
   */
  get all() {
    return this.#commands;
  }

  /**
   * Payload pronto para registro na API do Discord.
   *
   * @returns {object[]}
   */
  toJSON() {
    return [...this.#commands.values()].map((command) => command.data.toJSON());
  }
}

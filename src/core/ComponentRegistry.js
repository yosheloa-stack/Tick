import { customIdPrefixes } from '../utils/customId.js';
import { loadModulesFrom } from './ModuleLoader.js';

/**
 * Registro dos componentes interativos (botoes, menus e formularios).
 *
 * A resolucao aceita argumentos anexados ao customId: um handler registrado
 * como "ticket:open" atende tambem "ticket:open:denuncias".
 */
export class ComponentRegistry {
  #handlers = new Map();
  #logger;

  /**
   * @param {object} logger
   */
  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * @param {string} directory
   * @returns {Promise<void>}
   */
  async loadFrom(directory) {
    const modules = await loadModulesFrom(directory);

    for (const { path, module } of modules) {
      if (!module.id || typeof module.execute !== 'function') {
        throw new Error(`Componente invalido em ${path}: e necessario exportar "id" e "execute".`);
      }

      if (this.#handlers.has(module.id)) {
        throw new Error(`Componente duplicado: ${module.id}`);
      }

      this.#handlers.set(module.id, module);
      this.#logger.debug(`Componente carregado: ${module.id}`);
    }

    this.#logger.info(`${this.#handlers.size} componente(s) carregado(s).`);
  }

  /**
   * Localiza o handler responsavel por um customId.
   *
   * @param {string} customId
   * @returns {{ handler: object, args: string[] }|null}
   */
  resolve(customId) {
    for (const prefix of customIdPrefixes(customId)) {
      const handler = this.#handlers.get(prefix);

      if (handler) {
        const args = customId.slice(prefix.length).split(':').filter(Boolean);
        return { handler, args };
      }
    }

    return null;
  }
}

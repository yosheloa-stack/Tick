import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Armazenamento simples em arquivo JSON.
 *
 * As escritas sao serializadas em fila e aplicadas de forma atomica
 * (arquivo temporario + rename), evitando corromper os dados em caso de
 * encerramento inesperado do processo.
 */
export class JsonStore {
  #filePath;
  #defaults;
  #data;
  #queue = Promise.resolve();

  /**
   * @param {string} filePath
   * @param {object} defaults
   */
  constructor(filePath, defaults = {}) {
    this.#filePath = filePath;
    this.#defaults = defaults;
    this.#data = structuredClone(defaults);
  }

  /**
   * Carrega o arquivo do disco. Cria a estrutura padrao se ele nao existir.
   *
   * @returns {Promise<void>}
   */
  async load() {
    try {
      const raw = await readFile(this.#filePath, 'utf8');
      this.#data = { ...structuredClone(this.#defaults), ...JSON.parse(raw) };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      this.#data = structuredClone(this.#defaults);
      await this.#persist();
    }
  }

  /**
   * Retorna os dados em memoria. Nao deve ser mutado diretamente.
   *
   * @returns {object}
   */
  get data() {
    return this.#data;
  }

  /**
   * Aplica uma mutacao e persiste o resultado.
   * As chamadas sao enfileiradas para evitar condicoes de corrida.
   *
   * @template T
   * @param {(data: object) => T} mutator
   * @returns {Promise<T>}
   */
  update(mutator) {
    const task = this.#queue.then(async () => {
      const result = mutator(this.#data);
      await this.#persist();
      return result;
    });

    this.#queue = task.then(
      () => undefined,
      () => undefined,
    );

    return task;
  }

  /**
   * Grava o estado atual no disco.
   *
   * @returns {Promise<void>}
   */
  async #persist() {
    const temporaryPath = `${this.#filePath}.tmp`;

    await mkdir(dirname(this.#filePath), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(this.#data, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.#filePath);
  }
}

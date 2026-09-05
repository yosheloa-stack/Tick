import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const INDEX_FILE = 'index.js';

/**
 * Importa um arquivo e valida a exportacao padrao.
 *
 * @param {string} fullPath
 * @returns {Promise<{ path: string, module: object }>}
 */
async function importModule(fullPath) {
  const imported = await import(pathToFileURL(fullPath).href);

  if (!imported.default) {
    throw new Error(`O modulo ${fullPath} nao possui uma exportacao padrao.`);
  }

  return { path: fullPath, module: imported.default };
}

/**
 * Importa recursivamente os modulos JavaScript de um diretorio.
 *
 * Convencao: uma subpasta que contenha `index.js` e tratada como um unico
 * modulo, e apenas esse arquivo e importado. Isso permite dividir um comando
 * em varios arquivos internos sem que eles sejam registrados isoladamente.
 *
 * @param {string} directory
 * @param {{ root?: boolean }} options
 * @returns {Promise<{ path: string, module: object }[]>}
 */
export async function loadModulesFrom(directory, { root = true } = {}) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  });

  if (!root && entries.some((entry) => entry.isFile() && entry.name === INDEX_FILE)) {
    return [await importModule(join(directory, INDEX_FILE))];
  }

  const modules = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      modules.push(...(await loadModulesFrom(fullPath, { root: false })));
      continue;
    }

    if (extname(entry.name) !== '.js') {
      continue;
    }

    modules.push(await importModule(fullPath));
  }

  return modules;
}

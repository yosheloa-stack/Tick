const SEPARATOR = ':';
const MAX_LENGTH = 100;

/**
 * Monta um customId a partir de segmentos, garantindo o limite imposto pelo Discord.
 *
 * @param {...string} segments
 * @returns {string}
 */
export function buildCustomId(...segments) {
  const customId = segments
    .filter((segment) => segment !== null && segment !== undefined && segment !== '')
    .join(SEPARATOR);

  if (customId.length > MAX_LENGTH) {
    throw new Error(`customId excede ${MAX_LENGTH} caracteres: ${customId}`);
  }

  return customId;
}

/**
 * Divide um customId em segmentos.
 *
 * @param {string} customId
 * @returns {string[]}
 */
export function splitCustomId(customId) {
  return customId.split(SEPARATOR);
}

/**
 * Gera os prefixos possiveis de um customId, do mais especifico ao mais generico.
 * Permite que um handler registrado como "ticket:close" atenda "ticket:close:123".
 *
 * @param {string} customId
 * @returns {string[]}
 */
export function customIdPrefixes(customId) {
  const segments = splitCustomId(customId);
  const prefixes = [];

  for (let size = segments.length; size > 0; size -= 1) {
    prefixes.push(segments.slice(0, size).join(SEPARATOR));
  }

  return prefixes;
}

/**
 * Formata o numero sequencial do ticket com zeros a esquerda.
 *
 * @param {number} value
 * @returns {string}
 */
export function ticketNumber(value) {
  return String(value).padStart(4, '0');
}

/**
 * Converte um texto em um trecho valido para nome de canal.
 *
 * @param {string} value
 * @returns {string}
 */
export function toChannelSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

/**
 * Formata uma data para o padrao brasileiro.
 *
 * @param {Date|number|string} value
 * @returns {string}
 */
export function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/**
 * Converte uma duracao em milissegundos para um texto legivel.
 *
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatDuration(milliseconds) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  parts.push(`${minutes}min`);

  return parts.join(' ');
}

/**
 * Escapa caracteres reservados do HTML.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Reduz um texto ao tamanho maximo aceito por um campo de embed.
 *
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(value, maxLength) {
  const text = String(value ?? '');
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

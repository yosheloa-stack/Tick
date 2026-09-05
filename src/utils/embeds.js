import { EmbedBuilder } from 'discord.js';
import { config } from '../config/index.js';

/**
 * Monta o texto do rodape combinando a identificacao do sistema
 * com o credito do desenvolvedor, quando configurado.
 *
 * @returns {string}
 */
function footerText() {
  const { footerText: label, developerCredit } = config.appearance;
  return developerCredit ? `${label} | ${developerCredit}` : label;
}

/**
 * Cria um embed com a identidade visual padrao do bot.
 *
 * @param {{ color?: number, title?: string, description?: string }} options
 * @returns {EmbedBuilder}
 */
export function baseEmbed({ color = config.appearance.primaryColor, title, description } = {}) {
  const embed = new EmbedBuilder().setColor(color).setFooter({ text: footerText() });

  if (title) {
    embed.setTitle(title);
  }

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Embed de sucesso.
 *
 * @param {string} description
 * @returns {EmbedBuilder}
 */
export function successEmbed(description) {
  return baseEmbed({ color: config.appearance.successColor, description });
}

/**
 * Embed de aviso.
 *
 * @param {string} description
 * @returns {EmbedBuilder}
 */
export function warningEmbed(description) {
  return baseEmbed({ color: config.appearance.warningColor, description });
}

/**
 * Embed de erro.
 *
 * @param {string} description
 * @returns {EmbedBuilder}
 */
export function errorEmbed(description) {
  return baseEmbed({ color: config.appearance.dangerColor, description });
}

import { time, userMention } from 'discord.js';
import { config } from '../config/index.js';
import { baseEmbed, warningEmbed } from '../utils/embeds.js';

/**
 * Nome legivel de uma regiao configurada.
 *
 * @param {string} value
 * @returns {string}
 */
function regionLabel(value) {
  return config.like.regions.find((region) => region.value === value)?.label ?? value.toUpperCase();
}

/**
 * Formata um numero recebido da API, mantendo o valor original quando nao for numerico.
 *
 * @param {unknown} value
 * @returns {string}
 */
function amount(value) {
  if (value === undefined || value === null || value === '') {
    return 'Nao informado';
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed.toLocaleString('pt-BR') : String(value);
}

/**
 * Embed do resultado de um envio bem-sucedido.
 *
 * @param {{ result: object, playerId: string, region: string, requestedBy: string, availableAt: Date }} params
 * @returns {import('discord.js').EmbedBuilder}
 */
export function buildLikeResultEmbed({ result, playerId, region, requestedBy, availableAt }) {
  const embed = baseEmbed({
    color: config.appearance.successColor,
    title: 'Likes enviados',
  }).addFields(
    { name: 'ID', value: `\`${playerId}\``, inline: true },
    { name: 'Regiao', value: regionLabel(region), inline: true },
    { name: 'Solicitado por', value: userMention(requestedBy), inline: true },
  );

  if (result.nickname) {
    embed.addFields({ name: 'Jogador', value: String(result.nickname), inline: true });
  }

  embed.addFields(
    { name: 'Likes antes', value: amount(result.likesBefore), inline: true },
    { name: 'Likes depois', value: amount(result.likesAfter), inline: true },
    { name: 'Enviados agora', value: amount(result.likesGiven), inline: true },
  );

  if (result.quota?.remaining !== undefined) {
    const quota = result.quota.limit !== undefined
      ? `${amount(result.quota.remaining)} de ${amount(result.quota.limit)}`
      : amount(result.quota.remaining);

    embed.addFields({ name: 'Cota restante da chave', value: quota, inline: true });
  }

  if (result.source) {
    embed.addFields({ name: 'Fonte', value: String(result.source), inline: true });
  }

  embed.addFields({ name: 'Proximo envio para este ID', value: time(availableAt, 'R') });

  if (result.receiptUrl) {
    embed.addFields({ name: 'Comprovante', value: `[Abrir comprovante](${result.receiptUrl})` });
  }

  return embed;
}

/**
 * Embed exibido quando o ID ainda esta em periodo de espera.
 *
 * @param {{ playerId: string, region: string, availableAt: Date, entry: object }} params
 * @returns {import('discord.js').EmbedBuilder}
 */
export function buildLikeCooldownEmbed({ playerId, region, availableAt, entry }) {
  return warningEmbed(
    `Este ID ja recebeu likes nas ultimas ${config.like.cooldownHours} horas.`,
  ).addFields(
    { name: 'ID', value: `\`${playerId}\``, inline: true },
    { name: 'Regiao', value: regionLabel(region), inline: true },
    { name: 'Ultimo envio', value: time(new Date(entry.sentAt), 'R'), inline: true },
    { name: 'Novo envio disponivel', value: time(availableAt, 'R') },
  );
}

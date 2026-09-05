import { MessageFlags } from 'discord.js';
import { errorEmbed, successEmbed, warningEmbed } from './embeds.js';

/**
 * Responde a interacao de forma efemera, cobrindo tambem os casos em que
 * a resposta ja foi adiada ou enviada.
 *
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {import('discord.js').InteractionReplyOptions} payload
 * @returns {Promise<void>}
 */
export async function respond(interaction, payload) {
  const options = { ...payload, flags: MessageFlags.Ephemeral };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(options);
    return;
  }

  await interaction.reply(options);
}

/**
 * Atalho para uma resposta efemera de sucesso.
 *
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {string} description
 * @returns {Promise<void>}
 */
export function replySuccess(interaction, description) {
  return respond(interaction, { embeds: [successEmbed(description)] });
}

/**
 * Atalho para uma resposta efemera de aviso.
 *
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {string} description
 * @returns {Promise<void>}
 */
export function replyWarning(interaction, description) {
  return respond(interaction, { embeds: [warningEmbed(description)] });
}

/**
 * Atalho para uma resposta efemera de erro.
 *
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {string} description
 * @returns {Promise<void>}
 */
export function replyError(interaction, description) {
  return respond(interaction, { embeds: [errorEmbed(description)] });
}

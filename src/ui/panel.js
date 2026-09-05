import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { config } from '../config/index.js';
import { CustomIds } from '../constants/customIds.js';
import { baseEmbed } from '../utils/embeds.js';

/**
 * Monta a mensagem do painel de atendimento publicada em um canal.
 *
 * @returns {{ embeds: import('discord.js').EmbedBuilder[], components: ActionRowBuilder[] }}
 */
export function buildPanelMessage() {
  const embed = baseEmbed({
    title: config.panel.title,
    description: config.panel.description,
  });

  if (config.panel.imageUrl) {
    embed.setImage(config.panel.imageUrl);
  }

  if (config.panel.thumbnailUrl) {
    embed.setThumbnail(config.panel.thumbnailUrl);
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(CustomIds.PANEL_SELECT)
    .setPlaceholder(config.panel.selectPlaceholder)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      config.categories.map((category) => ({
        label: category.label,
        description: category.description ?? undefined,
        value: category.id,
        emoji: category.emoji ?? undefined,
      })),
    );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu)],
  };
}

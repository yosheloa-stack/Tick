import { CustomIds } from '../../constants/customIds.js';
import { baseEmbed } from '../../utils/embeds.js';

export default {
  id: CustomIds.CLOSE_CANCEL,
  /**
   * Cancela a solicitacao de encerramento.
   *
   * @param {import('discord.js').ButtonInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    await interaction.update({
      embeds: [baseEmbed({ description: 'Encerramento cancelado. O ticket permanece aberto.' })],
      components: [],
    });
  },
};

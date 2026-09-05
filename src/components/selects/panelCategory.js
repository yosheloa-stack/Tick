import { config } from '../../config/index.js';
import { CustomIds } from '../../constants/customIds.js';
import { buildTicketModal } from '../../ui/modals.js';
import { TicketError } from '../../utils/TicketError.js';

export default {
  id: CustomIds.PANEL_SELECT,
  /**
   * Exibe o formulario correspondente a categoria escolhida no painel.
   *
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const [categoryId] = interaction.values;
    const category = config.getCategory(categoryId);

    if (!category) {
      throw new TicketError(
        'Esta categoria nao esta mais disponivel. Atualize a pagina e tente novamente.',
      );
    }

    await interaction.showModal(buildTicketModal(category));
  },
};

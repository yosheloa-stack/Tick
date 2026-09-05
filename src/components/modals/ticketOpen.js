import { MessageFlags, channelMention } from 'discord.js';
import { config } from '../../config/index.js';
import { CustomIds } from '../../constants/customIds.js';
import { TicketError } from '../../utils/TicketError.js';
import { successEmbed } from '../../utils/embeds.js';

export default {
  id: CustomIds.OPEN_MODAL,
  /**
   * Cria o ticket a partir das respostas do formulario.
   *
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   * @param {object} context
   * @param {string[]} args
   * @returns {Promise<void>}
   */
  async execute(interaction, context, [categoryId]) {
    const category = config.getCategory(categoryId);

    if (!category) {
      throw new TicketError('Esta categoria nao esta mais disponivel.');
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const answers = Object.fromEntries(
      (category.questions ?? []).map((question) => [
        question.id,
        interaction.fields.getTextInputValue(question.id)?.trim() ?? '',
      ]),
    );

    const { channel } = await context.services.tickets.open({
      guild: interaction.guild,
      member: interaction.member,
      category,
      answers,
    });

    await interaction.editReply({
      embeds: [successEmbed(`Atendimento aberto em ${channelMention(channel.id)}.`)],
    });
  },
};

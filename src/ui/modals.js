import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { CustomIds } from '../constants/customIds.js';
import { buildCustomId } from '../utils/customId.js';

const STYLES = {
  short: TextInputStyle.Short,
  paragraph: TextInputStyle.Paragraph,
};

/**
 * Monta o formulario exibido apos a escolha da categoria.
 *
 * @param {object} category
 * @returns {ModalBuilder}
 */
export function buildTicketModal(category) {
  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomIds.OPEN_MODAL, category.id))
    .setTitle(`Atendimento - ${category.label}`.slice(0, 45));

  const rows = (category.questions ?? []).map((question) => {
    const input = new TextInputBuilder()
      .setCustomId(question.id)
      .setLabel(question.label.slice(0, 45))
      .setStyle(STYLES[question.style] ?? TextInputStyle.Short)
      .setRequired(question.required ?? true);

    if (question.placeholder) {
      input.setPlaceholder(question.placeholder.slice(0, 100));
    }

    if (question.maxLength) {
      input.setMaxLength(Math.min(question.maxLength, 4000));
    }

    if (question.minLength) {
      input.setMinLength(question.minLength);
    }

    return new ActionRowBuilder().addComponents(input);
  });

  if (rows.length === 0) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('assunto')
          .setLabel('Descreva a sua solicitacao')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000),
      ),
    );
  }

  modal.addComponents(...rows);

  return modal;
}

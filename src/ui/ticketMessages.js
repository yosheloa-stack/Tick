import { ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } from 'discord.js';
import { config } from '../config/index.js';
import { CustomIds } from '../constants/customIds.js';
import { baseEmbed, warningEmbed } from '../utils/embeds.js';
import { formatDateTime, formatDuration, ticketNumber, truncate } from '../utils/format.js';

/**
 * Converte as respostas do formulario em campos de embed.
 *
 * @param {object} category
 * @param {Record<string, string>} answers
 * @returns {{ name: string, value: string }[]}
 */
function answerFields(category, answers) {
  const questions = category?.questions ?? [];

  return questions
    .filter((question) => answers?.[question.id])
    .map((question) => ({
      name: truncate(question.label, 256),
      value: truncate(answers[question.id], 1024),
    }));
}

/**
 * Mensagem inicial enviada dentro do canal do ticket.
 *
 * @param {{ ticket: object, category: object }} params
 * @returns {{ content: string, embeds: import('discord.js').EmbedBuilder[], components: ActionRowBuilder[] }}
 */
export function buildTicketOpeningMessage({ ticket, category }) {
  const embed = baseEmbed({
    title: `Ticket ${ticketNumber(ticket.number)} - ${category.label}`,
    description: category.openingMessage ?? 'Descreva a sua solicitacao com o maximo de detalhes.',
  })
    .addFields(
      { name: 'Solicitante', value: userMention(ticket.ownerId), inline: true },
      { name: 'Categoria', value: category.label, inline: true },
      { name: 'Aberto em', value: formatDateTime(ticket.createdAt), inline: true },
      ...answerFields(category, ticket.answers),
    );

  const mentions = [
    userMention(ticket.ownerId),
    ...[...new Set([...config.tickets.staffRoleIds, ...(category.staffRoleIds ?? [])])].map(
      (roleId) => `<@&${roleId}>`,
    ),
  ];

  return {
    content: mentions.join(' '),
    embeds: [embed],
    components: [buildControlRow(ticket)],
  };
}

/**
 * Linha de botoes de controle do ticket.
 *
 * @param {object} ticket
 * @returns {ActionRowBuilder}
 */
export function buildControlRow(ticket) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CustomIds.CLAIM)
      .setLabel(ticket.claimedBy ? 'Atendimento assumido' : 'Assumir atendimento')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(Boolean(ticket.claimedBy)),
    new ButtonBuilder()
      .setCustomId(CustomIds.TRANSCRIPT)
      .setLabel('Gerar transcricao')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CustomIds.CLOSE_REQUEST)
      .setLabel('Fechar ticket')
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Mensagem de confirmacao exibida antes do fechamento.
 *
 * @returns {{ embeds: import('discord.js').EmbedBuilder[], components: ActionRowBuilder[] }}
 */
export function buildCloseConfirmation() {
  return {
    embeds: [
      warningEmbed(
        'Confirme o fechamento do ticket. O canal sera excluido e a transcricao sera arquivada.',
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(CustomIds.CLOSE_CONFIRM)
          .setLabel('Confirmar fechamento')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(CustomIds.CLOSE_CANCEL)
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

/**
 * Embed de registro publicado no canal de logs na abertura.
 *
 * @param {{ ticket: object, category: object, channelId: string }} params
 * @returns {import('discord.js').EmbedBuilder}
 */
export function buildOpenLogEmbed({ ticket, category, channelId }) {
  return baseEmbed({ title: `Ticket ${ticketNumber(ticket.number)} aberto` }).addFields(
    { name: 'Solicitante', value: userMention(ticket.ownerId), inline: true },
    { name: 'Categoria', value: category.label, inline: true },
    { name: 'Canal', value: `<#${channelId}>`, inline: true },
  );
}

/**
 * Embed de registro publicado no canal de logs no fechamento.
 *
 * @param {{ ticket: object, category: object|null, channelName: string }} params
 * @returns {import('discord.js').EmbedBuilder}
 */
export function buildCloseLogEmbed({ ticket, category, channelName }) {
  const duration = formatDuration(
    new Date(ticket.closedAt ?? Date.now()).getTime() - new Date(ticket.createdAt).getTime(),
  );

  return baseEmbed({
    color: config.appearance.warningColor,
    title: `Ticket ${ticketNumber(ticket.number)} fechado`,
  }).addFields(
    { name: 'Solicitante', value: userMention(ticket.ownerId), inline: true },
    { name: 'Fechado por', value: userMention(ticket.closedBy), inline: true },
    { name: 'Categoria', value: category?.label ?? ticket.categoryId, inline: true },
    { name: 'Canal', value: channelName, inline: true },
    { name: 'Duracao', value: duration, inline: true },
    {
      name: 'Atendido por',
      value: ticket.claimedBy ? userMention(ticket.claimedBy) : 'Nao assumido',
      inline: true,
    },
    { name: 'Motivo', value: truncate(ticket.closeReason ?? 'Nao informado', 1024) },
  );
}

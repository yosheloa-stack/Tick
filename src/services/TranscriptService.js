import { AttachmentBuilder } from 'discord.js';
import { config } from '../config/index.js';
import { escapeHtml, formatDateTime, ticketNumber } from '../utils/format.js';

const FETCH_BATCH = 100;

/**
 * Geracao de transcricoes em HTML a partir do historico de um canal de ticket.
 */
export class TranscriptService {
  /**
   * Coleta as mensagens do canal em ordem cronologica.
   *
   * @param {import('discord.js').TextChannel} channel
   * @returns {Promise<import('discord.js').Message[]>}
   */
  async #collectMessages(channel) {
    const limit = config.tickets.transcriptMessageLimit;
    const messages = [];
    let before;

    while (messages.length < limit) {
      const batch = await channel.messages.fetch({
        limit: Math.min(FETCH_BATCH, limit - messages.length),
        ...(before ? { before } : {}),
      });

      if (batch.size === 0) {
        break;
      }

      messages.push(...batch.values());
      before = batch.last().id;

      if (batch.size < FETCH_BATCH) {
        break;
      }
    }

    return messages.reverse();
  }

  /**
   * Converte uma mensagem em um bloco HTML.
   *
   * @param {import('discord.js').Message} message
   * @returns {string}
   */
  #renderMessage(message) {
    const attachments = [...message.attachments.values()]
      .map(
        (attachment) =>
          `<a class="attachment" href="${escapeHtml(attachment.url)}">${escapeHtml(attachment.name ?? 'anexo')}</a>`,
      )
      .join('');

    const embeds = message.embeds
      .map((embed) => {
        const title = embed.title ? `<div class="embed-title">${escapeHtml(embed.title)}</div>` : '';
        const description = embed.description
          ? `<div class="embed-description">${escapeHtml(embed.description)}</div>`
          : '';
        const fields = embed.fields
          .map(
            (field) =>
              `<div class="embed-field"><span>${escapeHtml(field.name)}</span><p>${escapeHtml(field.value)}</p></div>`,
          )
          .join('');

        return `<div class="embed">${title}${description}${fields}</div>`;
      })
      .join('');

    const content = message.content
      ? `<div class="content">${escapeHtml(message.content).replaceAll('\n', '<br>')}</div>`
      : '';

    return [
      '<article class="message">',
      '<header>',
      `<span class="author">${escapeHtml(message.author.tag ?? message.author.username)}</span>`,
      `<span class="id">${escapeHtml(message.author.id)}</span>`,
      `<time>${escapeHtml(formatDateTime(message.createdTimestamp))}</time>`,
      '</header>',
      content,
      embeds,
      attachments ? `<div class="attachments">${attachments}</div>` : '',
      '</article>',
    ].join('');
  }

  /**
   * Gera o arquivo de transcricao pronto para envio.
   *
   * @param {{ channel: import('discord.js').TextChannel, ticket: object, category: object|null }} params
   * @returns {Promise<{ attachment: AttachmentBuilder, messageCount: number }>}
   */
  async generate({ channel, ticket, category }) {
    const messages = await this.#collectMessages(channel);
    const rendered = messages.map((message) => this.#renderMessage(message)).join('');
    const reference = ticketNumber(ticket.number);
    const credit = config.appearance.developerCredit
      ? ` ${escapeHtml(config.appearance.developerCredit)}.`
      : '';

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ticket ${reference}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px; background: #16171c; color: #e6e6ea; font: 14px/1.6 "Segoe UI", system-ui, sans-serif; }
  main { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .summary { border: 1px solid #2c2e36; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; background: #1c1d23; }
  .summary dl { display: grid; grid-template-columns: 160px 1fr; gap: 6px 16px; margin: 12px 0 0; }
  .summary dt { color: #9a9bab; }
  .summary dd { margin: 0; }
  .message { border-top: 1px solid #23252c; padding: 12px 0; }
  .message header { display: flex; align-items: baseline; gap: 10px; }
  .author { font-weight: 600; }
  .id, time { color: #7d7f8f; font-size: 12px; }
  .content { margin-top: 4px; white-space: normal; word-wrap: break-word; }
  .embed { border-left: 3px solid #7b2fff; background: #1c1d23; padding: 10px 14px; margin-top: 8px; border-radius: 4px; }
  .embed-title { font-weight: 600; margin-bottom: 4px; }
  .embed-field span { color: #9a9bab; font-size: 12px; display: block; margin-top: 8px; }
  .embed-field p { margin: 2px 0 0; }
  .attachments { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }
  .attachment { color: #9d7bff; text-decoration: none; border: 1px solid #2c2e36; border-radius: 4px; padding: 4px 8px; }
  footer { margin-top: 32px; color: #7d7f8f; font-size: 12px; }
</style>
</head>
<body>
<main>
  <section class="summary">
    <h1>Ticket ${reference}</h1>
    <dl>
      <dt>Categoria</dt><dd>${escapeHtml(category?.label ?? ticket.categoryId)}</dd>
      <dt>Solicitante</dt><dd>${escapeHtml(ticket.ownerId)}</dd>
      <dt>Canal</dt><dd>${escapeHtml(channel.name)}</dd>
      <dt>Aberto em</dt><dd>${escapeHtml(formatDateTime(ticket.createdAt))}</dd>
      <dt>Mensagens</dt><dd>${messages.length}</dd>
    </dl>
  </section>
  ${rendered}
  <footer>Transcricao gerada em ${escapeHtml(formatDateTime(Date.now()))}.${credit}</footer>
</main>
</body>
</html>`;

    const attachment = new AttachmentBuilder(Buffer.from(html, 'utf8'), {
      name: `ticket-${reference}.html`,
      description: `Transcricao do ticket ${reference}`,
    });

    return { attachment, messageCount: messages.length };
  }
}

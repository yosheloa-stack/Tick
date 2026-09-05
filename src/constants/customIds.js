/**
 * Identificadores dos componentes interativos.
 *
 * Formato: dominio:acao[:argumentos]
 * Os argumentos sao lidos pelos handlers atraves de `splitCustomId`.
 */
export const CustomIds = Object.freeze({
  PANEL_SELECT: 'ticket:panel',
  OPEN_MODAL: 'ticket:open',
  CLAIM: 'ticket:claim',
  TRANSCRIPT: 'ticket:transcript',
  CLOSE_REQUEST: 'ticket:close',
  CLOSE_CONFIRM: 'ticket:close-confirm',
  CLOSE_CANCEL: 'ticket:close-cancel',
});

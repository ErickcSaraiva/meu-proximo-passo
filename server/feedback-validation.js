import { CATEGORIES, STATUSES, MESSAGE_LIMIT, CONTACT_LIMIT } from '../dist/js/feedback-fields.js';

export const isCategory = value => typeof value === 'string' && Object.hasOwn(CATEGORIES, value);
export const isStatus = value => typeof value === 'string' && Object.hasOwn(STATUSES, value);
export const isUuid = value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function validateSubmission(body) {
  if (!isCategory(body?.category)) return { error: 'Escolha um tipo de mensagem.' };

  const { category, message, contact = '', requestId } = body;
  if (typeof message !== 'string' || message.length > MESSAGE_LIMIT ||
      !message.trim() || /[\0\p{Surrogate}]/u.test(message)) {
    return { error: `Escreva uma mensagem com até ${MESSAGE_LIMIT} caracteres.` };
  }

  if (typeof contact !== 'string' || contact.length > CONTACT_LIMIT ||
      (contact.trim() && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/i.test(contact.trim()))) {
    return { error: 'Informe um e-mail válido ou deixe o campo em branco.' };
  }

  if (requestId !== undefined && !isUuid(requestId)) {
    return { error: 'O identificador do envio é inválido.' };
  }

  return { category, message: message.trim(), contact: contact.trim() || null, requestId: requestId?.toLowerCase() };
}

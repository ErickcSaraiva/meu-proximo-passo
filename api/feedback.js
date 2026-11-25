import { createHmac, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { hasAdminSession } from '../server/admin-session.js';
import { getFeedbackStore } from '../server/feedback-store.js';
import { isSameOrigin, mediaType, readText } from '../server/request.js';
import { isCategory, isStatus, isUuid, validateSubmission } from '../server/feedback-validation.js';

const API_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-MPP-Feedback': '1'
};
const UNAVAILABLE = 'O canal de sugestões está temporariamente indisponível. Tente novamente mais tarde.';

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { ...API_HEADERS, ...headers } });
}

async function readJson(request) {
  const text = await readText(request, 16 * 1024);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getFilters(request) {
  const params = new URL(request.url).searchParams;
  const category = params.get('category') || null;
  const status = params.get('status') || null;
  const pageValue = params.get('page') ?? '1';
  if ((category && !isCategory(category)) || (status && !isStatus(status)) ||
      !/^[1-9]\d{0,5}$/.test(pageValue)) return null;
  return { category, status, page: Number(pageValue) };
}

function submissionSecret() {
  const secret = process.env.FEEDBACK_RATE_LIMIT_SECRET;
  return secret?.length >= 32 && secret !== process.env.ADMIN_SESSION_SECRET && secret !== process.env.ADMIN_PASSWORD
    ? secret : null;
}

function submissionQuota(request, secret) {
  // O proxy da Vercel preenche o cabeçalho nas publicações. O desenvolvimento local pode usar uma cota compartilhada.
  const ip = request.headers.get('x-vercel-forwarded-for')?.trim() ?? '';
  const client = isIP(ip) ? ip : 'shared';
  const hour = 60 * 60 * 1000;
  const start = Math.floor(Date.now() / hour) * hour;
  const windowStart = new Date(start).toISOString();
  const clientKey = createHmac('sha256', secret).update(windowStart).update('\0').update(client).digest('hex');
  return { windowStart, clientKey, retryAfter: Math.max(1, Math.ceil((start + hour - Date.now()) / 1000)) };
}

export function createFeedbackHandler(getStore = getFeedbackStore) {
  return {
    async fetch(request) {
      const { method } = request;
      if (method === 'HEAD') {
        const ready = getStore() && submissionSecret();
        return new Response(null, { status: ready ? 204 : 503, headers: API_HEADERS });
      }
      if (!['GET', 'POST', 'PATCH'].includes(method)) {
        return json({ error: 'Método não permitido.' }, 405, { Allow: 'HEAD, GET, POST, PATCH' });
      }
      if (method !== 'POST' && !hasAdminSession(request)) {
        return json({ error: 'Entre na área administrativa para continuar.' }, 401);
      }
      if (method !== 'GET') {
        if (!isSameOrigin(request)) return json({ error: 'Envie a solicitação pelo próprio site.' }, 403);
        if (mediaType(request) !== 'application/json') return json({ error: 'Formato de envio inválido.' }, 415);
      }

      try {
        if (method === 'POST') {
          const feedback = validateSubmission(await readJson(request));
          if (feedback.error) return json({ error: feedback.error }, 400);

          const secret = submissionSecret();
          const store = getStore();
          if (!secret || !store) return json({ error: UNAVAILABLE }, 503);
          const { windowStart, clientKey, retryAfter } = submissionQuota(request, secret);
          const { category, message, contact, requestId } = feedback;
          const result = await store.submit({ id: requestId ?? randomUUID(), category, message, contact, windowStart, clientKey });
          if (result === 'limited') {
            return json({ error: 'Muitos envios nesta rede. Tente novamente mais tarde.' }, 429, { 'Retry-After': String(retryAfter) });
          }
          if (result === 'conflict') return json({ error: 'O formulário mudou. Edite a mensagem e tente novamente.' }, 409);
          return json({ saved: true }, result === 'duplicate' ? 200 : 201);
        }

        if (method === 'GET') {
          const filters = getFilters(request);
          if (!filters) return json({ error: 'Confira os filtros escolhidos.' }, 400);
          const store = getStore();
          if (!store) return json({ error: UNAVAILABLE }, 503);
          return json(await store.list(filters));
        }

        const body = await readJson(request);
        if (!isUuid(body?.id) || !isStatus(body.status)) return json({ error: 'Escolha um status válido.' }, 400);
        const store = getStore();
        if (!store) return json({ error: UNAVAILABLE }, 503);
        const updated = await store.updateStatus(body.id, body.status);
        return updated ? json({ status: body.status }) : json({ error: 'Mensagem não encontrada.' }, 404);
      } catch {
        console.error(`Falha ao processar feedback (${method}).`);
        return json({ error: UNAVAILABLE }, 503);
      }
    }
  };
}

export default createFeedbackHandler();

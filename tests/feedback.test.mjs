import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import admin from '../api/admin.js';
import { createFeedbackHandler } from '../api/feedback.js';
import { MESSAGE_LIMIT, CONTACT_LIMIT } from '../dist/js/feedback-fields.js';
import { validateSubmission } from '../server/feedback-validation.js';

const origin = 'https://mpp.example';
const feedbackUrl = `${origin}/api/feedback`;
const submission = { category: 'formacao', message: 'Existe algum curso técnico noturno?' };

function request(method, { body, cookie, from = origin, query = '', headers = {} } = {}) {
  const declaredHeaders = { origin: from, ...headers };
  if (cookie) declaredHeaders.cookie = cookie;
  if (body !== undefined) declaredHeaders['content-type'] ??= 'application/json';
  return new Request(feedbackUrl + query, { method, headers: declaredHeaders, body });
}

test('valida categoria, mensagem, e-mail opcional e identificador', () => {
  assert.deepEqual(validateSubmission({ ...submission, message: '  mensagem  ' }), {
    category: 'formacao', contact: null, message: 'mensagem', requestId: undefined
  });
  assert.equal(validateSubmission({ ...submission, contact: ' visitante@example.org ' }).contact, 'visitante@example.org');
  assert.equal(validateSubmission({ ...submission, message: 'a'.repeat(MESSAGE_LIMIT) }).message.length, MESSAGE_LIMIT);
  for (const change of [
    { category: 'constructor' }, { category: ['formacao'] }, { message: '  ' }, { message: null },
    { message: 'a'.repeat(MESSAGE_LIMIT + 1) }, { message: 'texto\u0000' }, { message: 'texto\ud800' },
    { contact: 'telefone' }, { contact: null }, { contact: `${'a'.repeat(CONTACT_LIMIT)}@example.org` },
    { requestId: 'inválido' }
  ]) {
    assert.ok(validateSubmission({ ...submission, ...change }).error, JSON.stringify(change));
  }
});

test('recebe feedback público e autoriza consulta e atualização apenas com a sessão do painel', async t => {
  const env = {
    ADMIN_PASSWORD: 'senha-de-teste-da-area-de-feedback-administrativo',
    ADMIN_SESSION_SECRET: 'segredo-de-sessao-de-teste-da-area-de-feedback',
    FEEDBACK_RATE_LIMIT_SECRET: 'segredo-de-teste-do-limite-de-feedback'
  };
  const previousEnv = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  Object.assign(process.env, env);
  const calls = [];
  let submitResult = 'saved';
  const store = {
    async submit(data) { calls.push(['submit', data]); return submitResult; },
    async list(filters) { calls.push(['list', filters]); return { items: [], hasNext: false }; },
    async updateStatus(id, status) { calls.push(['update', id, status]); return status !== 'nova'; }
  };
  const api = createFeedbackHandler(() => store);
  const id = randomUUID();
  const body = JSON.stringify({ ...submission, requestId: id });
  const patch = JSON.stringify({ id, status: 'em_analise' });
  assert.equal((await api.fetch(request('HEAD'))).status, 204);
  assert.equal((await api.fetch(request('GET'))).status, 401);
  assert.equal((await api.fetch(request('PATCH', { body: patch }))).status, 401);
  assert.equal((await api.fetch(request('GET', { cookie: '__Host-mpp-admin=falso' }))).status, 401);
  assert.equal((await api.fetch(request('DELETE'))).status, 405);
  assert.equal((await api.fetch(request('POST', { body, from: 'https://outro.example' }))).status, 403);
  assert.equal((await api.fetch(request('POST', { body, headers: { 'content-type': 'text/plain' } }))).status, 415);
  assert.equal((await api.fetch(request('POST', { body: '{' }))).status, 400);
  assert.equal((await api.fetch(request('POST', { body: 'a'.repeat(16385) }))).status, 400);
  assert.equal((await api.fetch(request('POST', { body: JSON.stringify({ ...submission, message: '' }) }))).status, 400);
  assert.deepEqual(calls, []);

  const send = () => api.fetch(request('POST', { body, headers: { 'x-vercel-forwarded-for': '192.0.2.1' } }));
  const submitted = await send();
  assert.equal(submitted.status, 201);
  assert.deepEqual(await submitted.json(), { saved: true });
  assert.equal(submitted.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual({ ...calls[0][1], clientKey: undefined, windowStart: undefined }, {
    ...submission, id, contact: null, clientKey: undefined, windowStart: undefined
  });
  assert.match(calls[0][1].clientKey, /^[a-f0-9]{64}$/);
  submitResult = 'duplicate';
  assert.equal((await send()).status, 200);
  assert.equal(calls[1][1].clientKey, calls[0][1].clientKey);
  submitResult = 'limited';
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  submitResult = 'conflict';
  assert.equal((await send()).status, 409);

  const login = await admin.fetch(new Request(`${origin}/admin`, {
    method: 'POST', headers: { origin },
    body: new URLSearchParams({ action: 'login', username: 'administrador', password: env.ADMIN_PASSWORD })
  }));
  assert.equal(login.status, 303);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const dashboard = await admin.fetch(new Request(`${origin}/admin`, { headers: { cookie } }));
  assert.match(await dashboard.text(), /Feedback dos visitantes/);
  const list = await api.fetch(request('GET', { cookie, query: '?category=formacao&status=nova&page=2' }));
  assert.deepEqual(await list.json(), { items: [], hasNext: false });
  assert.deepEqual(calls.at(-1), ['list', { category: 'formacao', status: 'nova', page: 2 }]);
  assert.equal((await api.fetch(request('GET', { cookie, query: '?status=constructor' }))).status, 400);
  assert.equal((await api.fetch(request('GET', { cookie, query: '?page=-1' }))).status, 400);
  assert.equal((await api.fetch(request('PATCH', { cookie, body: patch, from: 'https://outro.example' }))).status, 403);
  assert.equal((await api.fetch(request('PATCH', { cookie, body: JSON.stringify({ id, status: 'invalido' }) }))).status, 400);
  const changed = await api.fetch(request('PATCH', { cookie, body: patch }));
  assert.deepEqual(await changed.json(), { status: 'em_analise' });
  assert.deepEqual(calls.at(-1), ['update', id, 'em_analise']);
  assert.equal((await api.fetch(request('PATCH', { cookie, body: JSON.stringify({ id, status: 'nova' }) }))).status, 404);
  assert.equal((await createFeedbackHandler(() => null).fetch(request('POST', { body }))).status, 503);

  process.env.ADMIN_SESSION_SECRET += '-rotacionado';
  assert.equal((await api.fetch(request('GET', { cookie }))).status, 401);
});

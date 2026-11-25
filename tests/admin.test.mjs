import assert from 'node:assert/strict';
import test from 'node:test';
import admin from '../api/admin.js';

const origin = 'https://meu-proximo-passo.example';
const password = 'senha-de-teste-que-tem-mais-de-32-caracteres';
const secret = 'chave-de-sessao-exclusiva-para-os-testes';

function get(cookie) {
  return admin.fetch(new Request(`${origin}/admin`, { headers: cookie ? { cookie } : {} }));
}

function post(form, { cookie, from = origin } = {}) {
  const headers = new Headers({ origin: from });
  if (cookie) headers.set('cookie', cookie);
  return admin.fetch(new Request(`${origin}/admin`, {
    method: 'POST', headers, body: new URLSearchParams(form)
  }));
}

test('a rota administrativa exige uma sessão válida e permite sair', async t => {
  t.mock.method(Date, 'now', () => 1_800_000_000_000);

  const previousPassword = process.env.ADMIN_PASSWORD;
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  t.after(() => {
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
  });

  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal((await get()).status, 503);
  process.env.ADMIN_PASSWORD = password;
  process.env.ADMIN_SESSION_SECRET = secret;

  const credentials = { action: 'login', username: 'administrador', password };
  const login = await get();
  assert.equal(login.status, 200);
  const loginPage = await login.text();
  assert.match(loginPage, /Área administrativa/);
  assert.doesNotMatch(loginPage, /Painel do administrador|Catálogo de Manaus/);

  const invalid = await post({ ...credentials, password: 'incorreta' });
  assert.equal(invalid.status, 401);
  assert.equal(invalid.headers.get('set-cookie'), null);
  assert.equal((await post(credentials, { from: 'https://outro.example' })).status, 403);

  const valid = await post(credentials);
  assert.equal(valid.status, 303);
  assert.equal(valid.headers.get('location'), '/admin');
  const setCookie = valid.headers.get('set-cookie');
  assert.match(setCookie, /Path=\/; Max-Age=3600; HttpOnly; Secure; SameSite=Strict/);
  const [cookie] = setCookie.split(';');

  const authorized = await get(cookie);
  assert.equal(authorized.headers.get('cache-control'), 'private, no-store');
  const dashboard = await authorized.text();
  assert.match(dashboard, /Painel do administrador/);
  assert.match(dashboard, /Ofertas de formação verificadas\s*<\/dt>\s*<dd>\d+<\/dd>/);
  assert.doesNotMatch(dashboard, /autocomplete="current-password"/);

  const tampered = cookie.replace(/\.(\w)/, (_, letter) => letter === 'a' ? '.b' : '.a');
  assert.match(await (await get(tampered)).text(), /Área administrativa/);

  process.env.ADMIN_PASSWORD = `${password}-nova`;
  assert.match(await (await get(cookie)).text(), /Área administrativa/);
  process.env.ADMIN_PASSWORD = password;

  const logout = await post({ action: 'logout' }, { cookie });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get('set-cookie'), /__Host-mpp-admin=; Path=\/; Max-Age=0/);
  assert.match(await (await get()).text(), /Área administrativa/);

  Date.now.mock.mockImplementation(() => 1_800_003_600_000);
  assert.match(await (await get(cookie)).text(), /Área administrativa/);
});

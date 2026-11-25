import catalog from '../dist/data/catalogo.json' with { type: 'json' };
import { getInstitutions } from '../dist/js/core.js';
import { adminCookie, adminCredentials, adminUsername, hasAdminSession, matches } from '../server/admin-session.js';
import { isSameOrigin, mediaType, readText } from '../server/request.js';

const responseHeaders = {
  'Cache-Control': 'private, no-store',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex'
};

function redirectWithCookie(credentials) {
  return new Response(null, {
    status: 303,
    headers: { ...responseHeaders, Location: '/admin', 'Set-Cookie': adminCookie(credentials) }
  });
}

function page(title, content, status = 200) {
  return new Response(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} | Meu Próximo Passo</title>
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/assets/styles.css">
    <link rel="stylesheet" href="/assets/admin.css">
  </head>
  <body>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="/">Meu Próximo Passo</a>
      </div>
    </header>
    <main class="container page-section admin-page">
      <h1>${title}</h1>
      ${content}
    </main>
  </body>
</html>`, { status, headers: { ...responseHeaders, 'Content-Type': 'text/html; charset=UTF-8' } });
}

function login(invalid = false) {
  return page('Área administrativa', `
      <p>Entre com a conta de administrador para acompanhar sugestões e consultar o catálogo.</p>
      ${invalid ? '<p class="admin-error" role="alert">Usuário ou senha inválidos.</p>' : ''}
      <form class="admin-form" method="post" action="/admin">
        <input type="hidden" name="action" value="login">
        <label for="username">Usuário</label>
        <input id="username" name="username" autocomplete="username" maxlength="64" required>
        <label for="password">Senha</label>
        <input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required>
        <button class="button" type="submit">Entrar</button>
      </form>`, invalid ? 401 : 200);
}

function dashboard() {
  const institutionCount = getInstitutions(catalog.offers).length;
  const offerCount = catalog.offers.filter(offer => offer.status === 'verificado').length;
  return page('Painel do administrador', `
      <section aria-labelledby="catalog-title">
        <h2 id="catalog-title">Catálogo de Manaus</h2>
        <dl class="admin-stats">
          <div><dt>Profissões</dt><dd>${catalog.professions.length}</dd></div>
          <div><dt>Ofertas de formação verificadas</dt><dd>${offerCount}</dd></div>
          <div><dt>Instituições com ofertas verificadas</dt><dd>${institutionCount}</dd></div>
        </dl>
      </section>
      <section class="admin-feedback" aria-labelledby="feedback-title">
        <h2 id="feedback-title" tabindex="-1">Feedback dos visitantes</h2>
        <form class="admin-filters" id="feedback-filters" hidden>
          <div class="admin-filter">
            <label for="feedback-filter-category">Tipo</label>
            <select id="feedback-filter-category" name="category"><option value="">Todos os tipos</option></select>
          </div>
          <div class="admin-filter">
            <label for="feedback-filter-status">Status</label>
            <select id="feedback-filter-status" name="status"><option value="">Todos os status</option></select>
          </div>
        </form>
        <p id="feedback-list-status" role="status" aria-atomic="true"></p>
        <p id="feedback-list-error" class="admin-error" role="alert" hidden></p>
        <p id="feedback-session" hidden><a href="/admin" class="text-link">Entrar novamente</a></p>
        <button id="feedback-retry" class="button button-secondary button-small" type="button" hidden>Tentar novamente</button>
        <div id="feedback-list"></div>
        <nav id="feedback-pagination" class="actions" aria-label="Páginas de feedback" hidden>
          <button class="button button-secondary button-small" type="button" id="feedback-prev">Anterior</button>
          <button class="button button-secondary button-small" type="button" id="feedback-next">Próxima</button>
        </nav>
        <noscript><p>Ative o JavaScript para carregar as mensagens e atualizar os status.</p></noscript>
      </section>
      <script type="module" src="/js/admin-feedback.js"></script>
      <form method="post" action="/admin">
        <input type="hidden" name="action" value="logout">
        <button class="button button-secondary" type="submit">Sair</button>
      </form>`);
}

export default {
  async fetch(request) {
    const credentials = adminCredentials();
    if (!credentials) {
      return page('Área administrativa', '<p>O acesso administrativo ainda está sendo configurado.</p>', 503);
    }

    if (request.method === 'GET') return hasAdminSession(request, credentials) ? dashboard() : login();
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { ...responseHeaders, Allow: 'GET, POST' } });
    }

    if (!isSameOrigin(request)) {
      return page('Acesso recusado', '<p>Volte à área administrativa para continuar.</p>', 403);
    }

    const body = mediaType(request) === 'application/x-www-form-urlencoded' ? await readText(request, 4096) : null;
    if (!body) {
      return page('Solicitação inválida', '<p>Abra a área administrativa e tente novamente.</p>', 400);
    }

    const form = new URLSearchParams(body);
    if (form.get('action') === 'logout') return redirectWithCookie();
    if (form.get('action') !== 'login') {
      return page('Solicitação inválida', '<p>Abra a área administrativa e tente novamente.</p>', 400);
    }
    if (form.get('username') !== adminUsername || !matches(form.get('password') ?? '', credentials.password)) {
      return login(true);
    }
    return redirectWithCookie(credentials);
  }
};

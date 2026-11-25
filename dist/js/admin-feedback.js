import { CATEGORIES, STATUSES } from './feedback-fields.js';

const endpoint = '/api/feedback';
const heading = document.querySelector('#feedback-title');
const filters = document.querySelector('#feedback-filters');
const list = document.querySelector('#feedback-list');
const notice = document.querySelector('#feedback-list-status');
const error = document.querySelector('#feedback-list-error');
const login = document.querySelector('#feedback-session');
const retry = document.querySelector('#feedback-retry');
const pagination = document.querySelector('#feedback-pagination');
const previous = document.querySelector('#feedback-prev');
const next = document.querySelector('#feedback-next');
const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Manaus', dateStyle: 'short', timeStyle: 'short'
});
let page = 1;
let pendingList;
let saving = false;
let sessionExpired = false;

function appendOptions(select, options) {
  for (const [value, label] of Object.entries(options)) select.add(new Option(label, value));
}

function cardFor(item) {
  const card = document.createElement('article');
  card.className = 'admin-message';
  const title = document.createElement('h3');
  title.textContent = CATEGORIES[item.category];
  const date = document.createElement('time');
  date.dateTime = item.createdAt;
  date.textContent = dateFormat.format(new Date(item.createdAt));
  const message = document.createElement('p');
  message.className = 'admin-message-text';
  message.textContent = item.message;
  card.append(title, date, message);

  if (item.contact) {
    const contact = document.createElement('p');
    contact.textContent = `Contato: ${item.contact}`;
    card.append(contact);
  }

  const form = document.createElement('form');
  form.className = 'admin-status-form';
  const label = document.createElement('label');
  label.textContent = 'Status';
  const select = document.createElement('select');
  select.id = `status-${item.id}`;
  label.htmlFor = select.id;
  appendOptions(select, STATUSES);
  select.value = item.status;
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button button-secondary button-small';
  submit.textContent = 'Salvar status';
  form.append(label, select, submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!saving) saveStatus(item, select, submit);
  });
  card.append(form);
  return card;
}

function showError(message) {
  notice.textContent = '';
  error.textContent = message;
  error.hidden = false;
}

function expireSession() {
  sessionExpired = true;
  filters.hidden = true;
  pagination.hidden = true;
  retry.hidden = true;
  list.replaceChildren();
  showError('Sua sessão expirou. Entre novamente para continuar.');
  login.hidden = false;
  login.querySelector('a').focus();
}

async function loadList({ focusId, moveFocus = false, saved = false } = {}) {
  pendingList?.abort();
  const controller = new AbortController();
  pendingList = controller;
  notice.textContent = saved ? 'Status salvo. Atualizando mensagens…' : 'Carregando mensagens…';
  error.hidden = true;
  retry.hidden = true;
  pagination.hidden = true;
  list.replaceChildren();
  list.setAttribute('aria-busy', 'true');

  const params = new URLSearchParams(new FormData(filters));
  params.set('page', page);
  try {
    const response = await fetch(`${endpoint}?${params}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
    });
    if (controller.signal.aborted) return;
    if (response.status === 401) {
      expireSession();
      return;
    }
    if (!response.ok) throw new Error();
    const { items, hasNext } = await response.json();
    if (controller.signal.aborted) return;
    if (!items.length && page > 1) {
      page--;
      await loadList({ focusId, moveFocus, saved });
      return;
    }
    list.replaceChildren(...items.map(cardFor));
    pagination.hidden = page === 1 && !hasNext;
    previous.disabled = page === 1;
    next.disabled = !hasNext;
    notice.textContent = [saved && 'Status atualizado.', items.length ? `Página ${page}.` : 'Nenhuma mensagem encontrada.']
      .filter(Boolean).join(' ');
    if (moveFocus) (document.getElementById(focusId) ?? heading).focus();
  } catch {
    if (controller.signal.aborted) return;
    showError(saved ? 'O status foi salvo, mas a lista não pôde ser atualizada.' : 'Não foi possível carregar as mensagens.');
    retry.hidden = false;
    if (moveFocus) retry.focus();
  } finally {
    if (pendingList === controller) list.removeAttribute('aria-busy');
  }
}

async function saveStatus(item, select, submit) {
  if (select.value === item.status) {
    notice.textContent = 'O status já estava salvo.';
    return;
  }
  saving = true;
  filters.inert = true;
  pagination.inert = true;
  submit.setAttribute('aria-disabled', 'true');
  notice.textContent = 'Salvando status…';
  error.hidden = true;
  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: select.value }),
      signal: AbortSignal.timeout(15000)
    });
    if (response.status === 401) {
      expireSession();
      return;
    }
    if (!response.ok) throw new Error();
    await loadList({ focusId: select.id, moveFocus: true, saved: true });
  } catch {
    showError('Não foi possível confirmar a alteração. Tente salvar novamente.');
  } finally {
    saving = false;
    if (!sessionExpired) filters.inert = false;
    pagination.inert = false;
    submit.removeAttribute('aria-disabled');
  }
}

appendOptions(filters.elements.category, CATEGORIES);
appendOptions(filters.elements.status, STATUSES);
filters.hidden = false;
filters.addEventListener('submit', event => event.preventDefault());
filters.addEventListener('change', () => { page = 1; loadList(); });
retry.addEventListener('click', () => loadList({ moveFocus: true }));
previous.addEventListener('click', () => { page--; loadList({ moveFocus: true }); });
next.addEventListener('click', () => { page++; loadList({ moveFocus: true }); });
loadList();

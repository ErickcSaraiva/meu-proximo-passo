import { CATEGORIES, MESSAGE_LIMIT, CONTACT_LIMIT } from './feedback-fields.js';

const endpoint = new URL('../api/feedback', import.meta.url);

export function feedbackPage() {
  const options = Object.entries(CATEGORIES).map(([value, label]) =>
    `<label class="feedback-category"><input type="radio" name="category" value="${value}" required> <span>${label}</span></label>`
  ).join('');
  return `<section class="container page-section narrow feedback-page">
    <div class="page-heading">
      <h1>Enviar sugestão</h1>
      <p>Indique um curso ou instituição, relate um problema ou conte o que podemos melhorar.</p>
    </div>
    <form id="feedback-form" class="feedback-form">
      <p id="feedback-privacy">Evite incluir documentos, senhas ou outras informações pessoais desnecessárias. <a class="text-link" href="#sobre">Sobre e privacidade</a></p>
      <fieldset disabled hidden>
        <legend class="sr-only">Dados da sugestão</legend>
        <fieldset class="feedback-categories">
          <legend>Tipo de mensagem</legend>
          ${options}
        </fieldset>
        <div class="feedback-field">
          <label for="feedback-message">Mensagem</label>
          <textarea id="feedback-message" name="message" rows="6" maxlength="${MESSAGE_LIMIT}" aria-describedby="feedback-message-help" required></textarea>
          <small id="feedback-message-help">Descreva o que você gostaria de encontrar ou o que aconteceu. Até ${MESSAGE_LIMIT.toLocaleString('pt-BR')} caracteres.</small>
        </div>
        <div class="feedback-field">
          <label for="feedback-contact">E-mail para contato <span class="muted">(opcional)</span></label>
          <input type="email" id="feedback-contact" name="contact" maxlength="${CONTACT_LIMIT}" autocomplete="email" aria-describedby="feedback-contact-help">
          <small id="feedback-contact-help">Informar seu e-mail permite um retorno, sem garantia de resposta.</small>
        </div>
        <button type="submit" class="button">Enviar mensagem</button>
      </fieldset>
      <p class="feedback-notice" data-notice role="status" aria-atomic="true">Verificando se o canal está disponível…</p>
      <p class="feedback-notice feedback-error" data-error role="alert"></p>
      <button type="button" class="button button-secondary button-small" data-retry hidden>Verificar disponibilidade novamente</button>
    </form>
  </section>`;
}

export function setupFeedbackForm(form) {
  const fields = form.querySelector('fieldset');
  const notice = form.querySelector('[data-notice]');
  const error = form.querySelector('[data-error]');
  const retry = form.querySelector('[data-retry]');
  const message = form.elements.message;
  let lastAttempt;

  async function checkAvailability() {
    if (retry.getAttribute('aria-disabled') === 'true') return;
    retry.setAttribute('aria-disabled', 'true');
    error.textContent = '';
    notice.textContent = 'Verificando se o canal está disponível…';
    try {
      const response = await fetch(endpoint, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      if (response.headers.get('X-MPP-Feedback') !== '1' && [200, 404, 405].includes(response.status)) {
        notice.textContent = 'O envio de sugestões está disponível na versão do site hospedada na Vercel.';
        retry.hidden = true;
        return;
      }
      if (!response.ok || response.headers.get('X-MPP-Feedback') !== '1') throw new Error();
      fields.disabled = false;
      fields.hidden = false;
      notice.textContent = '';
      if (document.activeElement === retry) form.querySelector('[name="category"]').focus();
      retry.hidden = true;
    } catch {
      notice.textContent = '';
      error.textContent = 'O canal de sugestões está indisponível no momento.';
      retry.hidden = false;
    } finally {
      retry.removeAttribute('aria-disabled');
    }
  }

  message.addEventListener('input', () => message.setCustomValidity(''));
  retry.addEventListener('click', checkAvailability);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fields.disabled) return;
    if (!message.value.trim()) {
      message.setCustomValidity('Escreva uma mensagem para continuar.');
      message.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const serialized = JSON.stringify(data);
    const focused = document.activeElement;
    fields.disabled = true;
    error.textContent = '';
    notice.textContent = 'Enviando mensagem…';
    try {
      if (lastAttempt?.serialized !== serialized) lastAttempt = { serialized, id: crypto.randomUUID() };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        referrerPolicy: 'same-origin',
        body: JSON.stringify({ ...data, requestId: lastAttempt.id }),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (!response.ok || result.saved !== true) {
        if (response.status === 409) lastAttempt = undefined;
        error.textContent = result.error || 'Não foi possível salvar a mensagem. Tente novamente.';
        notice.textContent = '';
        return;
      }
      form.reset();
      lastAttempt = undefined;
      notice.textContent = 'Sua mensagem foi salva. Obrigado por contribuir!';
    } catch {
      notice.textContent = '';
      error.textContent = 'Não foi possível confirmar o envio. Sua mensagem continua preenchida para você tentar novamente.';
    } finally {
      fields.disabled = false;
      if (document.activeElement === document.body && fields.contains(focused)) focused.focus();
    }
  });

  checkAvailability();
}

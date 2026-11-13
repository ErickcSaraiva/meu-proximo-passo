import { SOFTWARE_MISSION_STEPS } from './software-steps.js';
import {
  advanceSoftwareMission, createSoftwareMission, goBackInSoftwareMission,
  selectMissionAnswer, simulateReservation
} from './software.js';

export const SOFTWARE_PROFESSION_ID = 'desenvolvimento-software';
export const SOFTWARE_MISSION_LINK = `#desafio/${SOFTWARE_PROFESSION_ID}`;
const professionLink = `#profissao/${SOFTWARE_PROFESSION_ID}`;

function introCard(icon) {
  return `<form id="mission-form" class="question-card">
    <h1 class="question-title">Missão: criando uma solução para a escola</h1>
    <p>A escola precisa organizar as reservas do laboratório de informática. Você vai definir o que o sistema deve fazer e testar sua regra com pedidos fictícios.</p>
    <p>Você pode começar sem saber programar. São cinco etapas curtas, com espaço para voltar e experimentar outras respostas.</p>
    <p class="muted">A missão ajuda você a conhecer a profissão. Ela não mede sua capacidade.</p>
    <button class="button" type="submit">Começar missão ${icon('arrow')}</button>
  </form>`;
}

function stepActions(label, icon) {
  return `<div class="quiz-actions">
    <button class="button button-ghost" type="button" data-mission-action="back">${icon('back')} Voltar</button>
    <button class="button" type="submit"><span data-mission-submit-label>${label}</span> ${icon('arrow')}</button>
  </div>`;
}

function answerCard(step, answer, icon) {
  const choice = step.options.find(option => option.value === answer?.value);
  const reviewed = answer?.reviewed;
  const needsReview = step.expected && choice?.value !== step.expected;
  const feedbackTitle = step.expected ? (needsReview ? 'O que revisar' : 'Por que funciona') : 'Efeito da sua escolha';
  return `<form id="mission-form" class="question-card" novalidate>
    <h1 class="question-title" aria-describedby="mission-step-label">${step.title}</h1>
    <p>${step.scenario}</p>
    ${step.code ? `<pre class="mission-code"><code>${step.code}</code></pre>` : ''}
    <fieldset aria-describedby="mission-error">
      <legend class="mission-question">${step.question}</legend>
      <div class="answer-options">
        ${step.options.map(option => `<label class="answer-option">
          <input type="radio" name="mission-answer" value="${option.value}" ${choice === option ? 'checked' : ''} required>
          <span class="radio-decoration" aria-hidden="true"></span><strong>${option.label}</strong>
        </label>`).join('')}
      </div>
      <p class="form-error" id="mission-error" role="alert"></p>
    </fieldset>
    ${reviewed ? `<section class="mission-feedback" id="mission-feedback">
      <h2 id="mission-feedback-title" tabindex="-1" data-mission-feedback-heading aria-describedby="mission-feedback-text">${feedbackTitle}</h2>
      <p id="mission-feedback-text">${choice.feedback}</p>
      ${needsReview ? '<button class="text-button" type="button" data-mission-action="retry">Tentar outra resposta</button>' : ''}
    </section>` : ''}
    ${stepActions(reviewed ? 'Próxima etapa' : 'Conferir resposta', icon)}
  </form>`;
}

function testCase(result, title) {
  const { turma, horario, situacao } = result.second;
  return `<article class="mission-test-case">
    <h3>${title}</h3>
    <p><strong>${turma} · ${horario}</strong><br>${situacao}</p>
    <p>${result.explanation}</p>
  </article>`;
}

function simulationResult(rule) {
  const busy = simulateReservation(rule, '14h');
  const free = simulateReservation(rule, '15h');
  const summary = `${busy.first.turma}: reserva confirmada às ${busy.first.horario} nos dois testes.`;
  return `<section class="mission-simulation" aria-labelledby="mission-test-title">
    <h2 id="mission-test-title" tabindex="-1" data-mission-feedback-heading aria-describedby="mission-test-summary">Resultado da simulação</h2>
    <p id="mission-test-summary">${summary}</p>
    <div class="mission-test-grid">
      ${testCase(busy, 'Pedido às 14h · horário ocupado')}
      ${testCase(free, 'Pedido às 15h · horário livre')}
    </div>
  </section>`;
}

function simulationCard(mission, step, icon) {
  const rule = mission.answers.regra.value;
  const ruleStep = SOFTWARE_MISSION_STEPS.find(item => item.id === 'regra');
  const choice = ruleStep.options.find(option => option.value === rule);
  return `<form id="mission-form" class="question-card">
    <h1 class="question-title" aria-describedby="mission-step-label">${step.title}</h1>
    <p>Um teste confere o que o sistema faz em uma situação. Nos dois testes, a Turma A tem uma reserva às 14h e as 15h estão livres no início. A Turma B pede as 14h no primeiro teste e as 15h no segundo.</p>
    <p><strong>Sua regra para o horário ocupado</strong><br>${choice.label}</p>
    ${mission.tested ? simulationResult(rule) : ''}
    ${stepActions(mission.tested ? 'Ir para a reflexão' : 'Rodar simulação', icon)}
  </form>`;
}

function reflectionCard(icon) {
  return `<section class="question-card">
    <h1 class="question-title">Você teria curiosidade de resolver outros problemas assim?</h1>
    <p>Você organizou a ordem das ações, previu o que uma condição faria e testou o sistema em dois cenários. Quem desenvolve software faz esse tipo de trabalho para transformar necessidades em regras e conferir se elas funcionam na prática.</p>
    <p>Use a experiência para pensar no que despertou sua curiosidade. Uma atividade curta não mede sua capacidade nem define sua profissão.</p>
    <div class="actions">
      <a class="button" href="${professionLink}/cursos">Ver cursos e instituições ${icon('arrow')}</a>
      <button class="button button-secondary" type="button" data-mission-action="restart">Refazer missão ${icon('refresh')}</button>
    </div>
    <button class="text-button" type="button" data-mission-action="back">${icon('back')} Voltar à simulação</button>
  </section>`;
}

function missionPage(mission, icon) {
  const step = SOFTWARE_MISSION_STEPS[mission.index];
  const number = mission.index + 1;
  const total = SOFTWARE_MISSION_STEPS.length;
  const progress = step ? `<div class="quiz-topline" id="mission-step-label">Etapa ${number} de ${total}</div>
    <progress class="quiz-progress" max="${total}" value="${number}" aria-label="Progresso da missão" aria-valuetext="Etapa ${number} de ${total}">${number} de ${total}</progress>` : '';
  let card;
  if (mission.index === -1) card = introCard(icon);
  else if (!step) card = reflectionCard(icon);
  else if (step.options) card = answerCard(step, mission.answers[step.id], icon);
  else card = simulationCard(mission, step, icon);

  return `<section class="quiz-layout mission-layout container">
    <div class="quiz-intro mission-intro">
      <a class="text-link mission-back-link" href="${professionLink}">${icon('back')} Voltar à ficha da profissão</a>
      <span class="eyebrow">EXPERIMENTE UMA PROFISSÃO</span>
      <p class="mission-profession">Desenvolvimento de Software</p>
    </div>
    <div class="quiz-content">${progress}${card}</div>
  </section>`;
}

export function setupSoftwareMission(main, icon, render) {
  // Esta cópia vive na aba. As respostas do questionário ficam no estado do app.
  let mission = createSoftwareMission();

  main.addEventListener('submit', event => {
    const form = event.target;
    if (form.id !== 'mission-form') return;
    event.preventDefault();
    const picked = form.querySelector('input[name="mission-answer"]:checked');
    if (picked) mission = selectMissionAnswer(mission, picked.value);
    const next = advanceSoftwareMission(mission);
    if (next === mission) {
      form.querySelector('#mission-error').textContent = 'Escolha uma opção para continuar.';
      form.querySelector('input[name="mission-answer"]').focus();
      return;
    }

    const stayedOnStep = next.index === mission.index;
    mission = next;
    render(!stayedOnStep);
    if (stayedOnStep) main.querySelector('[data-mission-feedback-heading]').focus();
  });

  main.addEventListener('change', event => {
    const input = event.target;
    if (input.name !== 'mission-answer') return;
    const next = selectMissionAnswer(mission, input.value);
    if (next === mission) return;
    mission = next;
    // Não reconstruímos os rádios durante a seleção com as setas do teclado.
    const form = input.form;
    form.querySelector('#mission-error').textContent = '';
    form.querySelector('#mission-feedback')?.remove();
    form.querySelector('[data-mission-submit-label]').textContent = 'Conferir resposta';
  });

  main.addEventListener('click', event => {
    const action = event.target.closest('[data-mission-action]')?.dataset.missionAction;
    if (action === 'retry') {
      main.querySelector('input[name="mission-answer"]:checked').focus();
    } else if (action === 'back') {
      mission = goBackInSoftwareMission(mission);
      render();
    } else if (action === 'restart') {
      mission = createSoftwareMission();
      render();
    }
  });

  return () => missionPage(mission, icon);
}

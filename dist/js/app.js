import { AREAS, ANSWERS, QUESTIONS, EDUCATIONAL_NOTICE } from './questions.js';
import { isAnswer, isComplete, calculateResult, filterProfessions, validateCatalog } from './core.js';

// Tudo que vem do estudante existe somente neste objeto, durante esta aba.
// Não usamos cookies, armazenamento persistente nem requisições com respostas.
const state = {
  answers: {}, index: 0, editing: false, result: null,
  catalog: null, catalogError: false, query: '', area: 'todas'
};
const main = document.querySelector('main');
let firstRender = true;
let filterTimer;

const paths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  pen: '<path d="m15 4 5 5M4 20l5-1 12-12a2.2 2.2 0 0 0-5-3L4 16Z"/><path d="M13 20h8"/>',
  chart: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 16v-4m5 4V8m5 8v-6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m3 10v-2a6 6 0 0 0-2-4"/>',
  leaf: '<path d="M20 3C9 2 3 6 3 12a7 7 0 0 0 7 7c7 0 10-7 10-16ZM3 22 16 9"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
  book: '<path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  external: '<path d="M14 3h7v7m0-7L10 14m-1-9H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.2 6.2A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.8 5.8"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>'
};
function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function date(value) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}
function areaById(id) { return AREAS.find(a => a.id === id); }
function list(items) { return `<ul class="content-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`; }
function notice() { return `<aside class="educational-notice">${icon('info')}<p>${EDUCATIONAL_NOTICE}</p></aside>`; }
function buttonLink(href, text, secondary = false, symbol = 'arrow') {
  return `<a class="button ${secondary ? 'button-secondary' : ''}" href="${href}">${text} ${icon(symbol)}</a>`;
}
function catalogMessage() {
  return `<div class="empty-state" role="status">${icon('book')}<h2>O catálogo ainda não carregou.</h2><p>Confira sua conexão e tente novamente. Suas respostas continuam nesta aba.</p><button class="button button-secondary" data-action="retry-catalog">Tentar carregar o catálogo ${icon('refresh')}</button></div>`;
}

function illustration() {
  return `<div class="exploration-art" aria-hidden="true">
    <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
    <svg class="route-art" viewBox="0 0 520 440"><path d="M70 337C20 225 212 370 197 236S363 42 430 139s-129 148-101 231" fill="none" stroke="#78ae9d" stroke-width="2" stroke-dasharray="5 8"/><circle cx="70" cy="337" r="6" fill="#326e60"/><circle cx="430" cy="139" r="6" fill="#326e60"/><path d="m101 80 0 16m-8-8h16m314 271v16m-8-8h16" stroke="#94b5a6" stroke-width="2"/></svg>
    <div class="art-label">SEU MUNDO DE POSSIBILIDADES</div>
    <div class="floating-card float-tech"><span class="area-icon blue">${icon('code')}</span><span>Ideias que viram<br><strong>novas soluções.</strong></span></div>
    <div class="compass-disc"><div class="compass-ticks"></div><span class="north">N</span><svg viewBox="0 0 140 140"><path d="m92 29-12 53-52 30 28-54Z" fill="#e1f6d7"/><path d="m56 58 24 24-52 30Z" fill="#6cb798"/><circle cx="69" cy="70" r="7" fill="#164b4a"/></svg></div>
    <div class="floating-card float-health"><span class="area-icon rose">${icon('heart')}</span><span>Vontade de<br><strong>fazer a diferença.</strong></span></div>
    <div class="floating-card float-creative"><span class="area-icon orange">${icon('pen')}</span><span>Espaço para<br><strong>ser você.</strong></span></div>
    <div class="art-caption">Todo caminho começa com uma descoberta.</div>
  </div>`;
}

function homePage() {
  return `<section class="hero"><div class="container hero-grid"><div class="hero-copy">
    <span class="location-tag">${icon('pin')} Novos caminhos em Manaus</span>
    <h1>Seu futuro tem<br>mais de um <span class="accent-word">caminho<svg viewBox="0 0 315 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 11Q145-3 311 9" fill="none" stroke="#94cfb7" stroke-width="9" stroke-linecap="round"/></svg></span>.</h1>
    <p class="hero-description">Você não precisa ter todas as respostas agora.<br class="desktop-only"> Conheça seus interesses, descubra profissões e explore possibilidades para o seu próximo passo.</p>
    <div class="actions">${buttonLink('#questionario', 'Explorar meus interesses')}${buttonLink('#profissoes/todas', 'Conhecer profissões', true)}</div>
    <p class="quiet-note">${icon('lock')} Sem cadastro. Sem respostas certas. No seu ritmo.</p>
  </div>${illustration()}</div></section>
  <section class="steps-section container" aria-labelledby="steps-title"><div class="section-heading"><div><span class="eyebrow">CURIOSIDADE É UM BOM COMEÇO</span><h2 id="steps-title">Um passo de cada vez.</h2></div><p>Uma descoberta sobre você.<br>Muitas possibilidades pela frente.</p></div>
    <div class="steps-grid">
      <article class="step"><span class="step-number">01</span><div><h3>Responda do seu jeito</h3><p>18 perguntas sobre o que desperta sua curiosidade. Sem certo ou errado.</p><span class="small-tag">${icon('clock')} Cerca de 5 minutos</span></div></article>
      <article class="step"><span class="step-number">02</span><div><h3>Descubra suas áreas</h3><p>Veja quais temas se aproximam dos seus interesses neste momento.</p><span class="small-tag">${icon('compass')} 6 áreas para explorar</span></div></article>
      <article class="step"><span class="step-number">03</span><div><h3>Explore possibilidades</h3><p>Conheça profissões e caminhos de formação aqui em Manaus.</p><span class="small-tag">${icon('book')} Cursos e fontes oficiais</span></div></article>
    </div>
  </section>
  <section class="areas-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">UM MUNDO PARA CONHECER</span><h2>O que desperta sua curiosidade?</h2></div><a class="text-link" href="#profissoes/todas">Ver todas as profissões ${icon('arrow')}</a></div>
    <div class="areas-grid">${AREAS.map(area => `<a class="area-card ${area.color}" href="#profissoes/${area.id}"><span class="area-icon ${area.color}">${icon(area.icon)}</span><h3>${area.name}</h3><p>${area.description}</p><span class="area-link">Explorar área ${icon('arrow')}</span></a>`).join('')}</div>
  </div></section>
  <section class="container home-bottom"><div class="gentle-callout">${icon('spark')}<div><h2>Você pode mudar de ideia. E tudo bem.</h2><p>Seus interesses crescem com suas experiências. Use este espaço para abrir possibilidades.</p></div><a href="#sobre" class="text-link">Conheça a proposta ${icon('arrow')}</a></div>${notice()}</section>`;
}

function quizPage() {
  const question = QUESTIONS[state.index];
  const answered = QUESTIONS.filter(q => isAnswer(state.answers[q.id])).length;
  const picked = state.answers[question.id];
  return `<section class="quiz-layout container"><div class="quiz-intro"><span class="eyebrow">UM ENCONTRO COM SEUS INTERESSES</span><h2>Primeiro, vamos<br>falar de você.</h2><p>Pense no que chama sua atenção hoje. Você pode voltar e mudar qualquer resposta.</p><div class="quiz-tip">${icon('compass')}<p>Não há resposta certa.<br>Vale ser sincero com você.</p></div><p class="quiet-note">${icon('lock')} Suas respostas ficam só nesta aba.</p></div>
    <div class="quiz-content"><div class="quiz-topline"><span>Pergunta <strong>${state.index + 1}</strong> de ${QUESTIONS.length}</span><span>${answered} de 18 respondidas</span></div><progress class="quiz-progress" max="18" value="${answered}" aria-label="Perguntas respondidas">${answered} de 18</progress>
      <form id="quiz-form" class="question-card" novalidate><fieldset aria-describedby="question-help question-error"><legend><span class="eyebrow">QUANTO ISSO TEM A VER COM VOCÊ?</span><h1 tabindex="-1" class="question-title">${question.text}</h1></legend><p id="question-help" class="question-help">Escolha a opção que mais combina com você.</p>
        <div class="answer-options">${ANSWERS.map(answer => `<label class="answer-option"><input type="radio" name="answer" value="${answer.value}" ${picked === answer.value ? 'checked' : ''} required><span class="radio-decoration" aria-hidden="true"></span><span><strong>${answer.label}</strong><small>${answer.hint}</small></span></label>`).join('')}</div>
        <p class="form-error" id="question-error" role="alert"></p>
      </fieldset><div class="quiz-actions"><button type="button" class="button button-ghost" data-action="previous" ${state.index === 0 && !state.editing ? 'disabled' : ''}>${icon('back')} ${state.editing ? 'Voltar à revisão' : 'Voltar'}</button><button class="button" type="submit">${state.editing ? 'Salvar e voltar à revisão' : state.index === 17 ? 'Revisar respostas' : 'Próxima pergunta'} ${icon('arrow')}</button></div></form>
      <p class="quiz-footnote">${icon('info')} Uma atividade para descobrir possibilidades, sem definir seu futuro.</p>
    </div>
  </section>`;
}

function reviewPage() {
  return `<section class="container page-section narrow"><a class="text-link" href="#questionario">${icon('back')} Voltar ao questionário</a><div class="page-heading"><span class="eyebrow">ANTES DA PRÓXIMA DESCOBERTA</span><h1>Está tudo do seu jeito?</h1><p>Revise suas respostas. Você pode alterar qualquer uma antes de conhecer suas áreas.</p><span class="pill green">${icon('check')} 18 de 18 perguntas respondidas</span></div>
    <ol class="review-list">${QUESTIONS.map((q, i) => `<li><span class="review-number">${String(i + 1).padStart(2, '0')}</span><div><h2>${q.text}</h2><p>${ANSWERS.find(a => a.value === state.answers[q.id])?.label || 'Sem resposta'}</p></div><button class="button button-ghost button-small" data-edit="${i}" aria-label="Alterar resposta da pergunta ${i + 1}">Alterar ${icon('pen')}</button></li>`).join('')}</ol>
    <div class="review-finish"><p>Seu resultado é um ponto de partida para explorar.</p><button class="button" data-action="finish">Descobrir minhas áreas ${icon('arrow')}</button></div>${notice()}</section>`;
}

function scoreCard(area, emphasized = false) {
  return `<article class="score-card ${emphasized ? 'score-featured' : ''}"><div class="score-card-top"><span class="area-icon ${area.color}">${icon(area.icon)}</span><span class="score-value"><strong>${area.score}</strong> de ${area.max} pontos</span></div><h3>${area.name}</h3><p>${area.description}</p><progress class="score-progress ${area.color}" max="${area.max}" value="${area.score}" aria-label="${area.name}: ${area.score} de ${area.max} pontos">${area.score} de ${area.max}</progress><a class="text-link" href="#profissoes/${area.id}">Explorar esta área ${icon('arrow')}</a></article>`;
}

function resultPage() {
  const result = state.result;
  const highlightedIds = new Set(result.highlighted.map(a => a.id));
  const related = state.catalog?.professions.filter(p => highlightedIds.has(p.area)) || [];
  const tieText = result.ties.map(tie => `${tie.areas.map(id => areaById(id).name).join(', ')}: ${tie.score} ${tie.score === 1 ? 'ponto' : 'pontos'}`).join('; ');
  return `<section class="container page-section"><div class="result-header"><span class="pill green">${icon('compass')} Seu ponto de partida</span><h1>${result.allZero ? 'Ainda há muito para descobrir.' : 'Seus interesses abrem caminhos.'}</h1><p>${result.allZero ? 'Você marcou “Não me identifico” em todas as perguntas. Tudo bem: isso não diz que você não tem interesses. Talvez suas curiosidades estejam em outras experiências.' : 'Estas áreas tiveram as maiores pontuações nas suas respostas de hoje. Explore com curiosidade e sem pressa para escolher.'}</p></div>
    ${result.allZero ? `<div class="zero-result">${icon('spark')}<h2>Que tal começar por uma possibilidade?</h2><p>Conheça o dia a dia das profissões. Você pode encontrar um tema que ainda não tinha imaginado.</p>${buttonLink('#profissoes/todas', 'Explorar todas as profissões')}</div>` : `<div class="section-heading compact"><h2>${result.highlighted.length > 3 ? 'Áreas em destaque, incluindo empates' : 'Suas três áreas em destaque'}</h2><span class="muted">Até 6 pontos por área</span></div><div class="score-grid">${result.highlighted.map(area => scoreCard(area, true)).join('')}</div>
    ${result.ties.length ? `<aside class="tie-note">${icon('info')}<div><h3>Há áreas empatadas.</h3><p>${esc(tieText)}. Áreas com a mesma pontuação têm o mesmo destaque. ${result.highlighted.length > 3 ? 'O empate na terceira posição fez aparecerem mais de três áreas.' : ''} A ordem alfabética dentro de um empate serve apenas para organizar a leitura.</p></div></aside>` : ''}`}
    <details class="explanation" ${result.allZero ? 'open' : ''}><summary>Como o resultado foi calculado?</summary><p>Cada área tem 3 perguntas. “Não me identifico” vale 0; “Me identifico um pouco” vale 1; “Me identifico bastante” vale 2. Somamos os valores de cada área, de 0 a 6 pontos, sem pesos diferentes.</p><p>Destacamos as três maiores pontuações e todas as áreas empatadas na terceira posição. A pontuação descreve suas respostas; não mede capacidade, não é probabilidade de sucesso e não limita suas escolhas.</p></details>
    <details class="explanation" ${result.allZero ? 'open' : ''}><summary>Ver pontuação das seis áreas</summary><div class="all-scores">${result.scores.map(area => `<div class="score-row"><label for="score-${area.id}">${area.name}<span>${area.score} de ${area.max} pontos</span></label><progress id="score-${area.id}" class="score-progress ${area.color}" max="${area.max}" value="${area.score}">${area.score} de ${area.max}</progress></div>`).join('')}</div></details>
    ${!result.allZero ? `<section class="related-section"><div class="section-heading"><div><span class="eyebrow">DA CURIOSIDADE PARA A EXPLORAÇÃO</span><h2>Conheça quem trabalha com isso.</h2></div><a class="text-link" href="#profissoes/todas">Ver catálogo completo ${icon('arrow')}</a></div>${state.catalog ? `<div class="professions-grid">${related.map(professionCard).join('')}</div>` : catalogMessage()}</section>` : ''}
    <div class="result-actions"><button class="button button-secondary" data-action="restart">${icon('refresh')} Refazer questionário</button><a class="text-link" href="#revisao">Revisar minhas respostas ${icon('pen')}</a></div>${notice()}</section>`;
}

function professionCard(profession) {
  const area = areaById(profession.area);
  const offers = state.catalog.offers.filter(o => profession.offers.includes(o.id) && o.status === 'verificado');
  return `<article class="profession-card"><div class="profession-top"><span class="area-icon ${area.color}">${icon(area.icon)}</span><span class="category-label">${area.name}</span></div><h3><a href="#profissao/${profession.id}">${esc(profession.name)}</a></h3><p>${esc(profession.description)}</p><div class="profession-bottom"><span>${icon('pin')} ${offers.length ? 'Formação em Manaus' : 'Oferta local a confirmar'}</span><a class="card-arrow" href="#profissao/${profession.id}" aria-label="Conhecer ${esc(profession.name)}">${icon('arrow')}</a></div></article>`;
}

function catalogPage() {
  return `<section class="catalog-banner"><div class="container"><span class="eyebrow">POSSIBILIDADES PERTO DE VOCÊ</span><h1>Um mundo de profissões.<br>Um caminho que pode ser seu.</h1><p>Conheça o dia a dia de diferentes profissões e descubra onde começar a aprender em Manaus.</p><span class="pill white">${icon('book')} 18 profissões · 6 áreas de interesse</span></div></section><section class="container catalog-section">
    <div class="catalog-tools"><div class="search-field"><label for="profession-search">Buscar por nome da profissão</label><div class="input-wrap">${icon('search')}<input id="profession-search" type="search" placeholder="Ex.: designer, enfermeiro, técnico…" value="${esc(state.query)}" autocomplete="off" aria-controls="profession-results"></div></div><div class="area-select"><label for="area-filter">Área de interesse</label><select id="area-filter">${[{ id: 'todas', name: 'Todas as áreas' }, ...AREAS].map(area => `<option value="${area.id}" ${area.id === state.area ? 'selected' : ''}>${area.name}</option>`).join('')}</select></div></div>
    <div class="filter-chips" role="group" aria-label="Filtrar catálogo por área">${[{ id: 'todas', name: 'Todas', color: '', icon: 'compass' }, ...AREAS].map(area => `<button class="filter-chip" aria-pressed="${state.area === area.id}" data-area="${area.id}">${area.id === 'todas' ? '' : icon(area.icon)}${area.name}</button>`).join('')}</div>
    <div class="results-topline"><p id="result-count" role="status" aria-live="polite" aria-atomic="true"></p><button class="text-button" data-action="clear-filters">Limpar filtros</button></div><div id="profession-results"></div>
    <aside class="catalog-caution">${icon('info')}<div><strong>Existem diferentes jeitos de se formar.</strong><p>Algumas profissões exigem formação específica. Cursos relacionados não são necessariamente equivalentes. Antes de escolher, confira o grau do curso, suas habilitações e as informações atuais nos sites oficiais.</p><a class="text-link" href="#fontes">Entender as formações e consultar fontes ${icon('arrow')}</a></div></aside>
  </section>`;
}

function updateCatalogResults() {
  const target = document.getElementById('profession-results');
  if (!target) return;
  if (!state.catalog) {
    document.getElementById('result-count').textContent = state.catalogError ? 'Catálogo indisponível no momento' : 'Carregando catálogo…';
    target.innerHTML = state.catalogError ? catalogMessage() : '<p class="loading" role="status">Carregando possibilidades…</p>';
    return;
  }
  const professions = filterProfessions(state.catalog.professions, state.query, state.area);
  const count = document.getElementById('result-count');
  const context = state.area === 'todas' ? '' : ` em ${areaById(state.area).name}`;
  count.textContent = `${professions.length} ${professions.length === 1 ? 'profissão encontrada' : 'profissões encontradas'}${context}`;
  target.innerHTML = professions.length ? `<div class="professions-grid">${professions.map(professionCard).join('')}</div>` : `<div class="empty-state">${icon('search')}<h2>Ainda não encontramos esse caminho.</h2><p>Tente outro nome, confira a escrita ou explore todas as áreas. Há muitas possibilidades para conhecer.</p><button class="button button-secondary" data-action="clear-filters">Limpar busca e filtros ${icon('refresh')}</button></div>`;
  document.querySelectorAll('[data-area]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.area === state.area)));
  document.getElementById('area-filter').value = state.area;
}

function offerCard(offer) {
  const sources = offer.sources.map(id => state.catalog.sources.find(s => s.id === id));
  return `<article class="offer-card"><div class="offer-heading"><span class="institution-mark">${esc(offer.institution)}</span><span class="pill ${offer.status === 'verificado' ? 'green' : 'orange'}">${icon(offer.status === 'verificado' ? 'check' : 'info')}${offer.status === 'verificado' ? 'Identificado em fonte oficial' : 'Pendente de confirmação'}</span></div><h3>${esc(offer.course)}</h3><p class="course-type">${esc(offer.type)} ${offer.status === 'pendente' ? '· Oferta não confirmada' : offer.type === 'Técnico' ? '· Nível médio' : '· Ensino superior'}</p><p>${icon('pin')} ${esc(offer.campus)} · ${esc(offer.city)}, AM</p>${offer.note ? `<p class="offer-note">${esc(offer.note)}</p>` : ''}<div class="offer-sources">${sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ${icon('external')}<span class="sr-only"> (abre em nova aba)</span></a><small>Consultado em ${date(source.consultedAt)}</small>`).join('')}</div></article>`;
}

function professionPage(id) {
  if (!state.catalog) return `<section class="container page-section">${state.catalogError ? catalogMessage() : '<p class="loading" role="status">Carregando profissão…</p>'}</section>`;
  const profession = state.catalog.professions.find(p => p.id === id);
  if (!profession) return notFoundPage();
  const area = areaById(profession.area);
  const offers = state.catalog.offers.filter(offer => profession.offers.includes(offer.id));
  return `<section class="container page-section"><a class="text-link" href="#profissoes">${icon('back')} Voltar ao catálogo</a><div class="profession-heading"><span class="area-icon ${area.color}">${icon(area.icon)}</span><span class="eyebrow">${area.name}</span><h1>${esc(profession.name)}</h1><p>${esc(profession.description)}</p></div><div class="detail-grid"><div><section class="detail-block"><h2>Como é o dia a dia?</h2>${list(profession.activities)}</section><section class="detail-block"><h2>Onde pode trabalhar?</h2>${list(profession.environments)}</section><section class="detail-block"><h2>Caminhos de formação</h2><p>${esc(profession.training)}</p><h3>Cursos relacionados</h3>${list(profession.relatedCourses)}<p class="muted">Os exemplos mostram caminhos de estudo. A atuação depende da formação, das habilitações e dos requisitos profissionais aplicáveis.</p></section></div><aside class="try-card">${icon('spark')}<span class="eyebrow">UM PEQUENO EXPERIMENTO</span><h2>Que tal experimentar?</h2><p>${esc(profession.tryIt)}</p><span class="small-tag">Curiosidade também se aprende na prática.</span></aside></div>
    <section class="local-offers"><div class="section-heading"><div><span class="eyebrow">SEU PRÓXIMO PASSO PODE SER AQUI</span><h2>Onde estudar em Manaus</h2></div><span class="pill green">${icon('pin')} Manaus, Amazonas</span></div><p class="section-description">As ofertas identificadas têm referências de curso e localização nas fontes abaixo. Cartões marcados como pendentes ainda precisam de confirmação. Isso não significa que haja inscrições abertas. Consulte os sites oficiais para conferir ofertas e formas de ingresso atualizadas.</p><div class="offers-grid">${offers.length ? offers.map(offerCard).join('') : '<p>Não há oferta local verificada para este caminho. Consulte as instituições para confirmar.</p>'}</div></section>
    <aside class="catalog-caution">${icon('info')}<div><strong>Cursos relacionados têm objetivos e habilitações diferentes.</strong><p>Técnico, tecnólogo, bacharelado e licenciatura não são equivalentes. Algumas profissões exigem formação específica. Confira os requisitos no curso e nos órgãos profissionais.</p><a class="text-link" href="#fontes">Consultar fontes e pendências ${icon('arrow')}</a></div></aside>${notice()}</section>`;
}

function formationTypes() {
  return `<div class="formation-grid"><article><span class="eyebrow">NÍVEL MÉDIO</span><h3>Técnico</h3><p>Formação profissional técnica. Pode ser integrada ao ensino médio, concomitante ou subsequente, conforme o curso e o edital. Não é graduação.</p></article><article><span class="eyebrow">ENSINO SUPERIOR</span><h3>Tecnólogo</h3><p>Graduação tecnológica voltada a um campo de atuação. Quem a conclui recebe diploma de nível superior. Não é sinônimo de técnico.</p></article><article><span class="eyebrow">ENSINO SUPERIOR</span><h3>Bacharelado</h3><p>Graduação que desenvolve uma formação em determinado campo profissional ou científico. As habilitações variam conforme o curso.</p></article><article><span class="eyebrow">ENSINO SUPERIOR</span><h3>Licenciatura</h3><p>Graduação voltada à formação de professores para a educação básica, conforme sua área e habilitação. Tem objetivos próprios de formação.</p></article></div>`;
}

function sourcesPage() {
  return `<section class="container page-section"><div class="page-heading narrow"><span class="eyebrow">INFORMAÇÃO PARA ESCOLHER COM CALMA</span><h1>Fontes, cursos e instituições.</h1><p>Informações locais devem vir de quem oferece o curso. Aqui você pode conferir de onde veio cada referência e o que ainda precisa ser atualizado.</p></div><section><h2>Entenda os caminhos de formação</h2>${formationTypes()}</section><div class="sources-intro"><h2>Fontes oficiais consultadas</h2><p>Consultas realizadas em <strong>04/11/2026 e 05/11/2026</strong>. A data específica aparece em cada fonte. Verificamos a presença do curso e a localização em Manaus nas páginas e documentos indicados. A data de consulta não significa que o documento foi publicado ou atualizado nessa data.</p><p>Este é um recorte educativo de UFAM, IFAM, UEA e UNINORTE. Consulte os editais e projetos pedagógicos atuais antes de tomar decisões sobre matrícula.</p></div>
    ${state.catalog ? `<div class="source-list">${state.catalog.sources.map(source => `<article class="source-card"><div><span class="pill green">${esc(source.institution)}</span><span class="source-date">Consulta: ${date(source.consultedAt)}</span></div><h3><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ${icon('external')}<span class="sr-only"> (abre em nova aba)</span></a></h3><p><strong>O que verificamos:</strong> ${esc(source.confirms)}</p><p class="muted"><strong>Limite da informação:</strong> ${esc(source.limitation)}</p></article>`).join('')}</div><section class="pending-section"><span class="eyebrow">O QUE AINDA PRECISA SER CONFERIDO</span><h2>Transparência sobre as pendências</h2>${state.catalog.pending.map(item => `<article><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p></article>`).join('')}</section>` : catalogMessage()}
    <div class="actions">${buttonLink('#profissoes', 'Voltar às profissões', true)}</div></section>`;
}

function aboutPage() {
  return `<section class="container page-section narrow"><div class="page-heading"><span class="eyebrow">DESCOBRIR É UM PROCESSO</span><h1>Seu próximo passo começa com curiosidade.</h1><p>O Meu Próximo Passo é um espaço educativo para estudantes do ensino médio explorarem interesses, profissões e caminhos de formação em Manaus.</p></div><div class="detail-block"><h2>Você não precisa decidir tudo agora.</h2><p>O questionário aproxima você de seis áreas a partir de situações do dia a dia. Ele foi criado para esta atividade, não é um instrumento psicológico validado. Os exemplos ajudam a iniciar conversas e não avaliam sua capacidade.</p><p>As áreas são uma forma de organizar o catálogo. Uma profissão pode se relacionar com vários temas, e nenhum resultado impede você de conhecer as demais.</p></div>${notice()}
    <section class="privacy-card"><span class="area-icon green">${icon('lock')}</span><h2>Sua privacidade vem primeiro.</h2><p>Não pedimos nome, idade, escola, e-mail ou qualquer dado pessoal. Suas respostas são processadas no navegador e ficam apenas na memória desta aba. Ao recarregar ou fechar a página, elas são apagadas.</p><p>Não enviamos respostas a servidores. Não usamos cookies próprios, rastreadores, publicidade, ferramentas de análise ou armazenamento local. Para abrir a plataforma e o catálogo, o navegador solicita os arquivos estáticos ao serviço de hospedagem; esse serviço pode manter seus registros técnicos de acesso.</p><p>Links de instituições abrem sites externos, que têm suas próprias políticas de privacidade. Nenhuma resposta é acrescentada aos links.</p></section>
    <section class="workshop"><span class="eyebrow">PARA A OFICINA DA ESCOLA</span><h2>40 minutos para abrir possibilidades.</h2><ol class="workshop-list"><li><strong>5 min</strong><span>Acolhida: o que desperta sua curiosidade?</span></li><li><strong>10 min</strong><span>Questionário, revisão e leitura do resultado.</span></li><li><strong>15 min</strong><span>Exploração de profissões, cursos e fontes oficiais.</span></li><li><strong>10 min</strong><span>Conversa: o que você descobriu e o que gostaria de investigar?</span></li></ol><p>Ninguém precisa compartilhar seu resultado. Depois da oficina, a escola pode continuar usando a plataforma para outras conversas.</p></section>
    <details class="explanation"><summary>Como funciona o cálculo?</summary><p>As 18 perguntas se dividem em 6 áreas com 3 perguntas cada, misturadas na apresentação. Cada resposta vale 0, 1 ou 2. A soma de cada área vai de 0 a 6. Não há pesos ocultos.</p><p>São mostradas as três áreas com mais pontos, incluindo todas as empatadas no limite do terceiro lugar. Se todas as respostas forem zero, não destacamos áreas e convidamos você a explorar o catálogo.</p></details><div class="actions">${buttonLink('#questionario', 'Explorar meus interesses')}${buttonLink('#fontes', 'Ver fontes oficiais', true)}</div></section>`;
}

function notFoundPage() {
  return `<section class="container page-section empty-state">${icon('compass')}<h1>Vamos encontrar outro caminho?</h1><p>Esta página não foi encontrada. O catálogo está pronto para você explorar.</p>${buttonLink('#profissoes', 'Conhecer profissões')}</section>`;
}

function render(focus = true) {
  clearTimeout(filterTimer);
  const [routePart, param] = location.hash.replace(/^#/, '').split('/');
  const route = routePart || 'inicio';
  if ((route === 'revisao' || route === 'resultado') && !isComplete(state.answers)) {
    state.index = QUESTIONS.findIndex(q => !isAnswer(state.answers[q.id]));
    state.editing = false;
    location.replace('#questionario');
    return;
  }
  if (route === 'resultado' && !state.result) state.result = calculateResult(state.answers);
  if (route === 'profissoes' && param && (param === 'todas' || AREAS.some(a => a.id === param))) { state.area = param; state.query = ''; }
  const pages = { inicio: homePage, questionario: quizPage, revisao: reviewPage, resultado: resultPage, profissoes: catalogPage, profissao: () => professionPage(param), fontes: sourcesPage, sobre: aboutPage };
  const titles = { inicio: 'Explore seus caminhos', questionario: 'Meus interesses', revisao: 'Revisar respostas', resultado: 'Minhas áreas', profissoes: 'Profissões e cursos', profissao: 'Conhecer uma profissão', fontes: 'Fontes oficiais', sobre: 'Sobre e privacidade' };
  main.innerHTML = (pages[route] || notFoundPage)();
  document.title = `${titles[route] || 'Página não encontrada'} — Meu Próximo Passo`;
  document.querySelectorAll('[data-nav]').forEach(link => {
    const active = link.dataset.nav === route || link.dataset.nav === 'questionario' && ['revisao', 'resultado'].includes(route) || link.dataset.nav === 'profissoes' && route === 'profissao';
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (route === 'profissoes') updateCatalogResults();
  if (focus && !firstRender) {
    const heading = main.querySelector('h1') || main;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  firstRender = false;
}

async function loadCatalog() {
  state.catalogError = false;
  try {
    // URL relativa ao módulo: funciona na raiz e em subpastas do repositório.
    const response = await fetch(new URL('../data/catalogo.json', import.meta.url));
    if (!response.ok) throw new Error(`Falha ao carregar catálogo: ${response.status}`);
    state.catalog = validateCatalog(await response.json());
  } catch {
    state.catalogError = true;
  }
  const route = location.hash.replace(/^#/, '').split('/')[0];
  if (['profissoes', 'profissao', 'fontes', 'resultado'].includes(route)) {
    if (route === 'profissoes') updateCatalogResults(); else render(false);
  }
}

main.addEventListener('submit', event => {
  if (event.target.id !== 'quiz-form') return;
  event.preventDefault();
  const question = QUESTIONS[state.index];
  const selected = event.target.querySelector('input[name="answer"]:checked');
  if (!selected || !isAnswer(Number(selected.value))) {
    document.getElementById('question-error').textContent = 'Escolha uma resposta para continuar.';
    event.target.querySelector('input[name="answer"]').focus();
    return;
  }
  state.answers[question.id] = Number(selected.value);
  state.result = null;
  if (state.editing) { state.editing = false; location.hash = 'revisao'; }
  else if (state.index === QUESTIONS.length - 1) location.hash = 'revisao';
  else { state.index++; render(); }
});

main.addEventListener('change', event => {
  if (event.target.name === 'answer') {
    state.answers[QUESTIONS[state.index].id] = Number(event.target.value);
    state.result = null;
    document.getElementById('question-error').textContent = '';
    const answered = QUESTIONS.filter(q => isAnswer(state.answers[q.id])).length;
    main.querySelector('.quiz-progress').value = answered;
    main.querySelector('.quiz-topline > span:last-child').textContent = `${answered} de 18 respondidas`;
  }
  if (event.target.id === 'area-filter') {
    state.area = event.target.value;
    updateCatalogResults();
  }
});

main.addEventListener('input', event => {
  if (event.target.id !== 'profession-search') return;
  state.query = event.target.value;
  clearTimeout(filterTimer);
  filterTimer = setTimeout(updateCatalogResults, 120);
});

main.addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  if (edit) {
    state.index = Number(edit.dataset.edit); state.editing = true; location.hash = 'questionario'; return;
  }
  const area = event.target.closest('[data-area]');
  if (area) { state.area = area.dataset.area; updateCatalogResults(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'previous') {
    if (state.editing) { state.editing = false; location.hash = 'revisao'; }
    else if (state.index > 0) { state.index--; render(); }
  }
  if (action === 'finish' && isComplete(state.answers)) {
    state.result = calculateResult(state.answers); location.hash = 'resultado';
  }
  if (action === 'restart') {
    state.answers = {}; state.index = 0; state.result = null; state.editing = false; location.hash = 'questionario';
  }
  if (action === 'clear-filters') {
    state.query = ''; state.area = 'todas';
    clearTimeout(filterTimer);
    const input = document.getElementById('profession-search'); input.value = '';
    updateCatalogResults(); input.focus();
  }
  if (action === 'retry-catalog') loadCatalog();
});

// O link de acessibilidade não troca de tela nem reinicia o questionário.
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault(); main.focus(); main.scrollIntoView({ block: 'start' });
});
window.addEventListener('hashchange', () => render());
render(false);
loadCatalog();

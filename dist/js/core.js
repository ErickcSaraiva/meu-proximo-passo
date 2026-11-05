import { AREAS, QUESTIONS } from './questions.js';

export function isAnswer(value) {
  return Number.isInteger(value) && value >= 0 && value <= 2;
}

export function isComplete(answers) {
  return QUESTIONS.every(question => isAnswer(answers[question.id]));
}

/** Pontos inteiros: 3 perguntas × até 2 pontos = 6 pontos por área. */
export function calculateResult(answers) {
  if (!isComplete(answers)) throw new Error('Responda às 18 perguntas antes de finalizar.');
  const scores = AREAS.map(area => ({
    ...area,
    score: QUESTIONS.filter(q => q.area === area.id).reduce((sum, q) => sum + answers[q.id], 0),
    max: QUESTIONS.filter(q => q.area === area.id).length * 2
  })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'pt-BR'));
  // Empate na terceira posição: todos com a mesma pontuação entram no destaque.
  // Ordem alfabética serve apenas à leitura, nunca como critério de preferência.
  const cutoff = scores[2].score;
  const allZero = scores.every(area => area.score === 0);
  const highlighted = allZero ? [] : scores.filter(area => area.score >= cutoff);
  const ties = [...new Set(scores.map(area => area.score))]
    .map(score => ({ score, areas: scores.filter(area => area.score === score).map(area => area.id) }))
    .filter(group => group.areas.length > 1);
  return { scores, highlighted, allZero, ties, cutoff };
}

export function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function filterProfessions(professions, query = '', area = 'todas') {
  const normalized = normalizeText(query);
  return professions.filter(profession =>
    (area === 'todas' || profession.area === area) &&
    normalizeText(profession.name).includes(normalized)
  );
}

export function validateCatalog(data) {
  if (!data || !Array.isArray(data.professions) || !Array.isArray(data.sources) || !Array.isArray(data.offers)) {
    throw new Error('O catálogo está incompleto. Verifique o arquivo JSON.');
  }
  const unique = list => new Set(list.map(item => item.id)).size === list.length;
  if (![data.professions, data.sources, data.offers].every(unique)) throw new Error('IDs duplicados no catálogo.');
  const areaIds = new Set(AREAS.map(a => a.id));
  const offerIds = new Set(data.offers.map(o => o.id));
  const sourceIds = new Set(data.sources.map(s => s.id));
  for (const source of data.sources) {
    if (!source.id || !source.title || !source.consultedAt || !/^https:\/\//.test(source.url)) throw new Error('Fonte inválida.');
  }
  for (const offer of data.offers) {
    if (!offer.id || !offer.course || !offer.type || !offer.institution || !offer.campus || offer.city !== 'Manaus' || !offer.sources?.length || !offer.sources.every(id => sourceIds.has(id))) throw new Error('Oferta sem confirmação de curso, fonte ou localização em Manaus.');
    if (!['verificado', 'pendente'].includes(offer.status)) throw new Error('Status de oferta inválido.');
  }
  for (const profession of data.professions) {
    if (!areaIds.has(profession.area) || !profession.id || !profession.name || !profession.description || !profession.activities?.length || !profession.environments?.length || !profession.training || !profession.relatedCourses?.length || !profession.offers?.every(id => offerIds.has(id))) throw new Error('Profissão inválida ou relação inexistente.');
  }
  return data;
}

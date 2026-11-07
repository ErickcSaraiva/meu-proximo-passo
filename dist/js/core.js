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

/** A ordem alfabética organiza a leitura; não indica qualidade da instituição. */
export function getInstitutions(offers) {
  return [...new Set(offers.filter(offer => offer.status === 'verificado').map(offer => offer.institution))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Trabalhamos com palavras: "ti" não deve coincidir com "artista".
// Pontos em siglas são opcionais: T.I. e TI representam a mesma consulta.
function searchWords(value) {
  const text = normalizeText(value).replace(/\b(?:[a-z]\.\s*)+[a-z]\.?(?![a-z])/g, term => term.replace(/[.\s]/g, ''));
  return text.match(/[a-z0-9]+/g) || [];
}
const SEARCH_CONNECTORS = new Set(['a', 'as', 'o', 'os', 'de', 'da', 'das', 'do', 'dos', 'e', 'em', 'para', 'por', 'ou', 'com']);

export function filterProfessions(professions, query = '', area = 'todas', institution = 'todas', offers = []) {
  const terms = searchWords(query).filter(term => !SEARCH_CONNECTORS.has(term));
  if (normalizeText(query) && !terms.length) return [];
  const offersById = new Map(offers.map(offer => [offer.id, offer]));
  // Siglas curtas declaradas no catálogo exigem uma palavra inteira.
  const shortAliases = new Set([...professions, ...offers].flatMap(item => item.searchTerms || [])
    .map(alias => searchWords(alias)).filter(words => words.length === 1 && words[0].length <= 2).flat());
  return professions.filter(profession => {
    if (area !== 'todas' && profession.area !== area) return false;
    const linkedOffers = (profession.offers || []).map(id => offersById.get(id)).filter(Boolean);
    const scopedOffers = institution === 'todas' ? linkedOffers : linkedOffers.filter(offer => offer.institution === institution && offer.status === 'verificado');
    if (institution !== 'todas' && !scopedOffers.length) return false;
    if (!terms.length) return true;
    const feminineName = profession.name.replace(/o\(a\)/gi, 'a').replace(/\(a\)/gi, 'a');
    const fields = [
      profession.name.replace(/\([ao]\)/gi, ''), feminineName, ...(profession.searchTerms || []),
      // Com instituição selecionada, os nomes de curso vêm apenas de suas ofertas.
      ...(institution === 'todas' ? (profession.relatedCourses || []).map(course => course.split('—')[0]) : []),
      ...scopedOffers.flatMap(offer => [offer.course, ...(offer.searchTerms || [])])
    ];
    const words = fields.filter(Boolean).flatMap(searchWords);
    return terms.every(term => words.some(word => shortAliases.has(term) ? word === term : word.startsWith(term)));
  });
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
    if (offer.searchTerms !== undefined && (!Array.isArray(offer.searchTerms) || !offer.searchTerms.every(term => typeof term === 'string'))) throw new Error('Palavras-chave do curso inválidas.');
    if (!offer.id || !offer.course || !offer.type || !offer.institution || !offer.campus || offer.city !== 'Manaus' || !offer.sources?.length || !offer.sources.every(id => sourceIds.has(id))) throw new Error('Oferta sem confirmação de curso, fonte ou localização em Manaus.');
    if (!['verificado', 'pendente'].includes(offer.status)) throw new Error('Status de oferta inválido.');
    if (offer.historical && (!offer.referencePeriod || !offer.note)) throw new Error('Referência histórica sem período ou explicação.');
  }
  for (const profession of data.professions) {
    if (profession.searchTerms !== undefined && (!Array.isArray(profession.searchTerms) || !profession.searchTerms.every(term => typeof term === 'string'))) throw new Error('Palavras-chave da profissão inválidas.');
    if (!areaIds.has(profession.area) || !profession.id || !profession.name || !profession.description || !profession.activities?.length || !profession.environments?.length || !profession.training || !profession.relatedCourses?.length || !profession.offers?.every(id => offerIds.has(id))) throw new Error('Profissão inválida ou relação inexistente.');
  }
  return data;
}

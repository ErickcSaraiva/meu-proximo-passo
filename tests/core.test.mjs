import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS, QUESTIONS, ANSWERS } from '../dist/js/questions.js';
import { isAnswer, isComplete, calculateResult, filterProfessions, getInstitutions, validateCatalog } from '../dist/js/core.js';

const catalog = JSON.parse(readFileSync(new URL('../dist/data/catalogo.json', import.meta.url), 'utf8'));
const uniform = value => Object.fromEntries(QUESTIONS.map(q => [q.id, value]));
function fromScores(values) {
  const answers = {};
  AREAS.forEach((area, index) => {
    let remaining = values[index];
    QUESTIONS.filter(q => q.area === area.id).forEach(question => {
      answers[question.id] = Math.min(2, remaining);
      remaining -= answers[question.id];
    });
  });
  return answers;
}

test('18 perguntas únicas, três por área e ordem intercalada', () => {
  assert.equal(QUESTIONS.length, 18);
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, 18);
  assert.deepEqual(ANSWERS.map(a => a.value), [0, 1, 2]);
  for (const area of AREAS) assert.equal(QUESTIONS.filter(q => q.area === area.id).length, 3);
  for (let index = 1; index < QUESTIONS.length; index++) assert.notEqual(QUESTIONS[index].area, QUESTIONS[index - 1].area);
});

test('somente 0, 1 e 2 numéricos são respostas; zero é uma resposta válida', () => {
  for (const value of [0, 1, 2]) assert.equal(isAnswer(value), true);
  for (const value of [undefined, null, '0', 3, -1, NaN, 1.5]) assert.equal(isAnswer(value), false);
  assert.equal(isComplete(uniform(0)), true);
});

test('não finaliza com perguntas faltando ou valores inválidos', () => {
  const answers = uniform(2);
  delete answers.q18;
  assert.equal(isComplete(answers), false);
  assert.throws(() => calculateResult(answers));
  answers.q18 = '2';
  assert.throws(() => calculateResult(answers));
});

test('resultado zero não destaca áreas nem fabrica preferências', () => {
  const result = calculateResult(uniform(0));
  assert.equal(result.allZero, true);
  assert.equal(result.highlighted.length, 0);
  assert.equal(result.scores.length, 6);
  assert.ok(result.scores.every(a => a.score === 0 && a.max === 6));
});

test('todas as respostas máximas resultam em seis áreas empatadas com 6 de 6', () => {
  const result = calculateResult(uniform(2));
  assert.equal(result.allZero, false);
  assert.equal(result.highlighted.length, 6);
  assert.ok(result.scores.every(a => a.score === 6 && a.max === 6));
  assert.deepEqual(result.ties.map(t => t.score), [6]);
});

test('ordena somas reais e destaca três maiores sem empates', () => {
  const answers = fromScores([6, 5, 4, 3, 2, 1]);
  const result = calculateResult(answers);
  assert.deepEqual(result.scores.map(a => a.score), [6, 5, 4, 3, 2, 1]);
  assert.deepEqual(result.highlighted.map(a => a.id), ['tecnologia', 'saude', 'comunicacao']);
  assert.equal(result.ties.length, 0);
});

test('inclui quarta área empatada na terceira posição', () => {
  const result = calculateResult(fromScores([6, 5, 4, 4, 1, 0]));
  assert.equal(result.cutoff, 4);
  assert.equal(result.highlighted.length, 4);
  assert.deepEqual(new Set(result.highlighted.map(a => a.id)), new Set(['tecnologia', 'saude', 'comunicacao', 'negocios']));
});

test('empate no topo preserva igualdade e não elimina a terceira área', () => {
  const result = calculateResult(fromScores([6, 6, 4, 3, 2, 1]));
  assert.equal(result.highlighted.length, 3);
  assert.equal(result.ties[0].areas.length, 2);
  assert.equal(result.ties[0].score, 6);
});

test('empate em zero na terceira posição também é explícito', () => {
  const result = calculateResult(fromScores([2, 1, 0, 0, 0, 0]));
  assert.equal(result.highlighted.length, 6);
  assert.equal(result.ties.find(t => t.score === 0).areas.length, 4);
});

test('alterar uma resposta recalcula só sua área; não altera o objeto original', () => {
  const answers = uniform(1);
  const before = calculateResult(answers);
  answers.q01 = 2;
  const after = calculateResult(answers);
  assert.equal(before.scores.find(a => a.id === 'tecnologia').score, 3);
  assert.equal(after.scores.find(a => a.id === 'tecnologia').score, 4);
  assert.ok(after.scores.filter(a => a.id !== 'tecnologia').every(a => a.score === 3));
  assert.equal(answers.q01, 2);
});

test('busca ignora acentos, caixa e espaços externos', () => {
  assert.equal(filterProfessions(catalog.professions, '  TECNICO  ').length, 2);
  assert.equal(filterProfessions(catalog.professions, 'farmaceutico')[0].id, 'farmacia');
  assert.equal(filterProfessions(catalog.professions, 'DESIGNER')[0].id, 'design');
});

test('busca e área se combinam, filtros podem retornar zero e limpar retorna todas', () => {
  assert.equal(filterProfessions(catalog.professions, 'técnico', 'natureza').length, 1);
  assert.equal(filterProfessions(catalog.professions, 'designer', 'saude').length, 0);
  assert.equal(filterProfessions(catalog.professions, 'zzzinexistente').length, 0);
  assert.equal(filterProfessions(catalog.professions, '', 'todas').length, 23);
  for (const area of AREAS) assert.ok(filterProfessions(catalog.professions, '', area.id).length >= 3);
});

test('catálogo contém conteúdo completo, fontes e relações consistentes', () => {
  assert.equal(validateCatalog(catalog), catalog);
  assert.equal(catalog.professions.length, 23);
  assert.equal(catalog.offers.length, 88);
  assert.equal(catalog.sources.length, 51);
  assert.deepEqual(new Set(catalog.offers.filter(o => o.status === 'verificado').map(o => o.type)), new Set(['Técnico', 'Tecnólogo', 'Bacharelado', 'Licenciatura']));
  assert.ok(catalog.offers.every(o => o.city === 'Manaus'));
  assert.ok(catalog.sources.every(s => ['2026-11-04', '2026-11-05', '2026-11-07'].includes(s.consultedAt)));
  assert.ok(catalog.sources.every(s => /(^|\.)(?:(?:ufam|ifam|uea|fametro|faculdadesantateresa)\.edu\.br|(?:uninorte|universidadeniltonlins|programadebolsasniltonlins)\.com\.br|(?:estacio|unip)\.br)$/.test(new URL(s.url).hostname)));
});

test('cinco novas instituições têm referências locais ligadas a profissões', () => {
  const linkedIds = new Set(catalog.professions.flatMap(p => p.offers));
  for (const name of ['Estácio', 'Fametro', 'UNIP', 'Universidade Nilton Lins', 'Faculdade Santa Teresa']) {
    const offers = catalog.offers.filter(o => o.institution === name);
    assert.ok(offers.length > 0, name);
    assert.ok(offers.every(o => o.city === 'Manaus' && o.status === 'verificado' && linkedIds.has(o.id)), name);
  }
  assert.equal(catalog.offers.find(o => o.id === 'uninorte-engenharia-software').status, 'pendente');
});

test('instituições vêm do catálogo, sem duplicatas, em ordem alfabética', () => {
  const names = getInstitutions(catalog.offers);
  assert.equal(names.length, 9);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  assert.equal(getInstitutions([{ institution: 'A confirmar', status: 'pendente' }]).length, 0);
});

test('instituição combina com busca e área; referências históricas continuam identificáveis', () => {
  const filter = (query, area, name) => filterProfessions(catalog.professions, query, area, name, catalog.offers);
  assert.equal(filter('designer', 'comunicacao', 'Fametro')[0].id, 'design');
  assert.equal(filter('', 'saude', 'Fametro').length, 3);
  assert.equal(filter('designer', 'saude', 'Fametro').length, 0);
  assert.equal(filter('', 'natureza', 'UNIP').length, 0);
  assert.equal(filter('', 'todas', 'Não cadastrada').length, 0);
  assert.equal(filter('', 'todas', 'todas').length, 23);
  assert.equal(filter('biologo', 'natureza', 'Estácio')[0].id, 'biologia');
});

test('oferta pendente não basta para associar profissão a uma instituição no filtro', () => {
  const professions = [{ name: 'Exemplo', area: 'tecnologia', offers: ['pendente'] }];
  const offers = [{ id: 'pendente', institution: 'Instituição', status: 'pendente' }];
  assert.equal(filterProfessions(professions, '', 'todas', 'Instituição', offers).length, 0);
  offers[0].status = 'verificado';
  assert.equal(filterProfessions(professions, '', 'todas', 'Instituição', offers).length, 1);
});

test('UEA tem sete profissões relacionadas; Artes aparecem em comunicação e educação', () => {
  const filter = (query = '', area = 'todas') => filterProfessions(catalog.professions, query, area, 'UEA', catalog.offers);
  assert.deepEqual(new Set(filter().map(p => p.id)), new Set(['direito', 'desenvolvimento-software', 'musica', 'teatro', 'danca', 'ensino-artes', 'producao-audiovisual']));
  assert.equal(filter('', 'comunicacao').length, 4);
  assert.equal(filter('', 'sociedade').length, 2);
  assert.equal(filter('', 'tecnologia')[0].id, 'desenvolvimento-software');
  assert.equal(filter('', 'natureza').length, 0);
});

test('busca encontra música, teatro, dança e cinema pelos nomes e palavras-chave', () => {
  const filter = (query, area = 'todas') => filterProfessions(catalog.professions, query, area, 'UEA', catalog.offers);
  assert.deepEqual(new Set(filter('  MÚSICA ').map(p => p.id)), new Set(['musica', 'ensino-artes']));
  assert.equal(filter('teatro', 'comunicacao')[0].id, 'teatro');
  assert.equal(filter('danca', 'sociedade')[0].id, 'ensino-artes');
  assert.equal(filter('cinema')[0].id, 'producao-audiovisual');
  assert.equal(filter('instrumentista')[0].id, 'musica');
  assert.equal(filter('teatro', 'natureza').length, 0);
});

test('formações artísticas distinguem bacharelado, licenciatura e oferta especial', () => {
  const offersFor = id => {
    const profession = catalog.professions.find(p => p.id === id);
    return catalog.offers.filter(o => profession.offers.includes(o.id));
  };
  assert.equal(offersFor('ensino-artes').length, 5);
  assert.ok(offersFor('ensino-artes').every(o => o.type === 'Licenciatura'));
  for (const id of ['musica', 'teatro', 'danca']) assert.ok(offersFor(id).every(o => o.type === 'Bacharelado'));
  const audiovisual = offersFor('producao-audiovisual')[0];
  assert.equal(audiovisual.type, 'Bacharelado');
  assert.equal(audiovisual.historical, true);
  assert.ok(audiovisual.note.includes('entrada única'));
});

test('catálogo recusa palavras-chave inválidas que quebrariam a busca', () => {
  for (const value of ['música', [null], [5]]) {
    const broken = structuredClone(catalog);
    broken.professions[0].searchTerms = value;
    assert.throws(() => validateCatalog(broken));
  }
});

test('referência histórica exige período e explicação para não sugerir oferta atual', () => {
  const historical = catalog.offers.filter(o => o.historical);
  assert.ok(historical.length > 0);
  assert.ok(historical.every(o => o.referencePeriod && o.note.includes('histórica')));
  const broken = structuredClone(catalog);
  delete broken.offers.find(o => o.historical).referencePeriod;
  assert.throws(() => validateCatalog(broken));
});

test('recusa referência quebrada, IDs duplicados e curso de outra cidade', () => {
  const broken = structuredClone(catalog);
  broken.professions[0].offers.push('nao-existe');
  assert.throws(() => validateCatalog(broken));
  const otherCity = structuredClone(catalog);
  otherCity.offers[0].city = 'Parintins';
  assert.throws(() => validateCatalog(otherCity));
  const duplicate = structuredClone(catalog);
  duplicate.sources.push(duplicate.sources[0]);
  assert.throws(() => validateCatalog(duplicate));
});

test('URLs de arquivos de execução são relativas e não há persistência ou telemetria', () => {
  const index = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../dist/js/app.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../dist/assets/styles.css', import.meta.url), 'utf8');
  assert.ok(index.includes('lang="pt-BR"'));
  assert.equal(/(?:src|href)="\/(?!\/)/.test(index), false);
  assert.equal(/localStorage|sessionStorage|document\.cookie|sendBeacon|XMLHttpRequest/.test(app), false);
  assert.equal((app.match(/\bfetch\(/g) || []).length, 1);
  assert.ok(app.includes("new URL('../data/catalogo.json', import.meta.url)"));
  assert.equal(/@import|https?:\/\//.test(css), false);
  assert.ok(css.includes('prefers-reduced-motion'));
});

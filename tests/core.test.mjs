import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS, QUESTIONS, ANSWERS } from '../dist/js/questions.js';
import { isAnswer, isComplete, calculateResult, filterProfessions, validateCatalog } from '../dist/js/core.js';

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
  assert.equal(filterProfessions(catalog.professions, '', 'todas').length, 18);
  for (const area of AREAS) assert.equal(filterProfessions(catalog.professions, '', area.id).length, 3);
});

test('catálogo contém conteúdo completo, fontes e relações consistentes', () => {
  assert.equal(validateCatalog(catalog), catalog);
  assert.equal(catalog.professions.length, 18);
  assert.equal(catalog.offers.length, 32);
  assert.equal(catalog.sources.length, 27);
  assert.deepEqual(new Set(catalog.offers.filter(o => o.status === 'verificado').map(o => o.type)), new Set(['Técnico', 'Tecnólogo', 'Bacharelado', 'Licenciatura']));
  assert.ok(catalog.offers.every(o => o.city === 'Manaus'));
  assert.ok(catalog.sources.every(s => ['2026-11-04', '2026-11-05'].includes(s.consultedAt)));
  assert.ok(catalog.sources.every(s => /(^|\.)(?:(?:ufam|ifam|uea)\.edu\.br|uninorte\.com\.br)$/.test(new URL(s.url).hostname)));
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

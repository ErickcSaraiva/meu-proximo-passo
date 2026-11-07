import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterProfessions, validateCatalog } from '../dist/js/core.js';

const catalog = JSON.parse(readFileSync(new URL('../dist/data/catalogo.json', import.meta.url), 'utf8'));
const search = (query, area = 'todas', institution = 'todas') =>
  filterProfessions(catalog.professions, query, area, institution, catalog.offers).map(p => p.id);

test('regressão das fotos: TI encontra somente as duas profissões de informática', () => {
  for (const query of ['TI', 'ti', ' T.I. ', 'T. I.']) {
    assert.deepEqual(search(query), ['desenvolvimento-software', 'tecnico-informatica'], query);
  }
});

test('regressão das fotos: Enfermagem encontra a profissão Enfermeiro(a)', () => {
  for (const query of ['Enfermagem', 'ENFERMAGEM', 'enferm', 'enfermeira']) {
    assert.deepEqual(search(query), ['enfermagem'], query);
  }
});

test('regressão das fotos: Odontologia e Dentista encontram a mesma profissão', () => {
  for (const query of ['Odontologia', 'Dentista', 'cirurgião-dentista', 'cirurgiã dentista', 'odontológica', 'saúde bucal']) {
    assert.deepEqual(search(query), ['odontologia'], query);
  }
});

test('cursos e sinônimos encontram profissões com nomes diferentes', () => {
  for (const [query, id] of [['Fisioterapia', 'fisioterapia'], ['Farmácia', 'farmacia'], ['Contabilidade', 'contabilidade'], ['Serviço Social', 'servico-social'], ['Pedagogia', 'pedagogia'], ['Edificações', 'engenharia-civil'], ['Programação', 'desenvolvimento-software']]) {
    assert.deepEqual(search(query), [id], query);
  }
});

test('busca aceita palavras em outra ordem e conectivos em português', () => {
  assert.deepEqual(search('sistemas análise'), ['desenvolvimento-software']);
  assert.deepEqual(search('computacao ciencia'), ['desenvolvimento-software']);
  assert.deepEqual(search('tecnologia da informação'), ['desenvolvimento-software', 'tecnico-informatica']);
});

test('início de palavra funciona sem coincidências no meio de nomes', () => {
  assert.deepEqual(search('log'), ['logistica']);
  assert.deepEqual(search('fisio'), ['fisioterapia']);
  assert.deepEqual(search('lista'), []);
  assert.deepEqual(search('tico'), []);
});

test('siglas de curso respeitam as referências da instituição selecionada', () => {
  assert.deepEqual(search('ADS', 'todas', 'IFAM'), ['desenvolvimento-software']);
  assert.deepEqual(search('ADS', 'todas', 'UEA'), []);
  assert.deepEqual(search('CC', 'todas', 'UNIP'), ['desenvolvimento-software']);
  assert.deepEqual(search('CC', 'todas', 'Fametro'), []);
  assert.deepEqual(search('SI', 'todas', 'UEA'), ['desenvolvimento-software']);
  assert.deepEqual(search('SI', 'todas', 'UNIP'), []);
});

test('busca, área e instituição continuam sendo condições simultâneas', () => {
  assert.deepEqual(search('Enfermagem', 'saude', 'UEA'), ['enfermagem']);
  assert.deepEqual(search('Enfermagem', 'sociedade', 'UEA'), []);
  assert.deepEqual(search('TI', 'saude'), []);
  assert.deepEqual(search('Odontologia', 'saude', 'Fametro'), ['odontologia']);
  assert.deepEqual(search('Odontologia', 'saude', 'IFAM'), []);
});

test('curso genérico ou de outra instituição não vaza para o filtro selecionado', () => {
  const professions = [{ name: 'Especialista', area: 'tecnologia', relatedCourses: ['Alvo — bacharelado'], offers: ['a', 'b'] }];
  const offers = [{ id: 'a', course: 'Alfa', institution: 'A', status: 'verificado' }, { id: 'b', course: 'Beta', institution: 'B', status: 'verificado' }];
  assert.equal(filterProfessions(professions, 'Alvo', 'todas', 'todas', offers).length, 1);
  assert.equal(filterProfessions(professions, 'Alvo', 'todas', 'A', offers).length, 0);
  assert.equal(filterProfessions(professions, 'Beta', 'todas', 'A', offers).length, 0);
  assert.equal(filterProfessions(professions, 'Beta', 'todas', 'B', offers).length, 1);
});

test('curso pendente não vira correspondência confirmada por haver outro curso verificado', () => {
  const professions = [{ name: 'Especialista', area: 'tecnologia', offers: ['ok', 'pendente'] }];
  const offers = [{ id: 'ok', course: 'Alfa', institution: 'A', status: 'verificado' }, { id: 'pendente', course: 'Beta', institution: 'A', status: 'pendente' }];
  assert.equal(filterProfessions(professions, 'Beta', 'todas', 'A', offers).length, 0);
  assert.equal(filterProfessions(professions, 'Beta', 'todas', 'todas', offers).length, 1);
});

test('limpar a consulta restaura o catálogo; pontuação isolada não traz tudo', () => {
  assert.equal(search('').length, 24);
  assert.equal(search('   ').length, 24);
  for (const query of ['---', '???', 'de e']) assert.deepEqual(search(query), []);
});

test('formas femininas dos nomes continuam localizáveis', () => {
  for (const [query, id] of [['engenheira civil', 'engenharia-civil'], ['bióloga', 'biologia'], ['farmacêutica', 'farmacia'], ['administradora', 'administracao']]) {
    assert.deepEqual(search(query), [id], query);
  }
});

test('Odontologia tem referências identificadas em seis instituições de Manaus', () => {
  for (const institution of ['UFAM', 'UEA', 'Fametro', 'Universidade Nilton Lins', 'Faculdade Santa Teresa', 'UNINORTE']) {
    assert.deepEqual(search('Odontologia', 'saude', institution), ['odontologia']);
  }
  assert.deepEqual(search('Odontologia', 'saude', 'UNIP'), []);
});

test('catálogo recusa aliases de curso inválidos antes de carregar a busca', () => {
  for (const value of ['TI', [null], [3]]) {
    const broken = structuredClone(catalog);
    broken.offers[0].searchTerms = value;
    assert.throws(() => validateCatalog(broken));
  }
});

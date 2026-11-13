import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSoftwareMission, createSoftwareMission, goBackInSoftwareMission,
  selectMissionAnswer, simulateReservation
} from '../dist/js/challenges/software.js';
import { SOFTWARE_MISSION_STEPS } from '../dist/js/challenges/software-steps.js';

test('sugerir horário mantém a primeira reserva e não confirma a segunda automaticamente', () => {
  const result = simulateReservation('proximo-horario');
  assert.deepEqual(result.first, { turma: 'Turma A', horario: '14h', situacao: 'Reserva confirmada' });
  assert.deepEqual(result.second, { turma: 'Turma B', horario: '15h', situacao: 'Horário sugerido, aguardando confirmação' });
});

test('fila mantém a primeira reserva e a segunda turma espera pelo mesmo horário', () => {
  const result = simulateReservation('fila-espera');
  assert.deepEqual(result.first, { turma: 'Turma A', horario: '14h', situacao: 'Reserva confirmada' });
  assert.deepEqual(result.second, { turma: 'Turma B', horario: '14h', situacao: 'Na fila de espera' });
});

test('não simula regras ausentes ou desconhecidas', () => {
  for (const rule of [undefined, '', 'outra']) assert.equal(simulateReservation(rule), null);
});

test('horário livre é confirmado com qualquer regra de conflito, sem alterar a agenda inicial', () => {
  for (const rule of ['proximo-horario', 'fila-espera']) {
    const free = simulateReservation(rule, '15h');
    assert.equal(free.first.horario, '14h');
    assert.deepEqual(free.second, { turma: 'Turma B', horario: '15h', situacao: 'Reserva confirmada' });
    assert.notEqual(simulateReservation(rule, '14h').second.situacao, 'Reserva confirmada');
  }
  assert.equal(simulateReservation('fila-espera', '13h'), null);
});

test('conferir sem escolha mantém a etapa, inclusive após uma opção inválida', () => {
  const firstStep = advanceSoftwareMission(createSoftwareMission());
  assert.equal(advanceSoftwareMission(firstStep), firstStep);
  assert.equal(selectMissionAnswer(firstStep, 'outra'), firstStep);
});

test('conferir mostra feedback antes de avançar e permite rever a escolha', () => {
  const firstStep = advanceSoftwareMission(createSoftwareMission());
  const answered = selectMissionAnswer(firstStep, 'confirmar-primeiro');
  const reviewed = advanceSoftwareMission(answered);
  assert.equal(reviewed.index, firstStep.index);
  assert.equal(reviewed.answers.sequencia.reviewed, true);

  const secondStep = advanceSoftwareMission(reviewed);
  assert.equal(SOFTWARE_MISSION_STEPS[secondStep.index].id, 'condicao');
  const back = goBackInSoftwareMission(secondStep);
  assert.deepEqual(back.answers.sequencia, { value: 'confirmar-primeiro', reviewed: true });

  const retry = selectMissionAnswer(back, 'consultar-agenda');
  assert.equal(retry.answers.sequencia.reviewed, false);
  assert.equal(advanceSoftwareMission(retry).index, firstStep.index);
});

test('voltar à apresentação preserva uma opção selecionada antes de conferir', () => {
  const firstStep = advanceSoftwareMission(createSoftwareMission());
  const draft = selectMissionAnswer(firstStep, 'consultar-agenda');
  assert.deepEqual(advanceSoftwareMission(goBackInSoftwareMission(draft)), draft);
});

function reviewAndContinue(mission, value) {
  const answered = selectMissionAnswer(mission, value);
  const reviewed = advanceSoftwareMission(answered);
  return advanceSoftwareMission(reviewed);
}

test('trocar a regra exige rodar a simulação novamente antes de refletir', () => {
  let mission = advanceSoftwareMission(createSoftwareMission());
  mission = reviewAndContinue(mission, 'consultar-agenda');
  mission = reviewAndContinue(mission, 'informar-conflito');
  mission = reviewAndContinue(mission, 'dupla-reserva');
  mission = reviewAndContinue(mission, 'proximo-horario');
  assert.equal(SOFTWARE_MISSION_STEPS[mission.index].id, 'simulacao');
  assert.equal(mission.tested, false);

  const tested = advanceSoftwareMission(mission);
  assert.equal(tested.index, mission.index);
  assert.equal(tested.tested, true);
  assert.equal(advanceSoftwareMission(tested).index, SOFTWARE_MISSION_STEPS.length);

  const changed = reviewAndContinue(goBackInSoftwareMission(tested), 'fila-espera');
  assert.equal(changed.index, mission.index);
  assert.equal(changed.tested, false);
  assert.equal(changed.answers.regra.value, 'fila-espera');
  assert.equal(changed.answers.sequencia.value, 'consultar-agenda');
});

test('refazer começa na apresentação com escolhas e simulação independentes', () => {
  const firstStep = advanceSoftwareMission(createSoftwareMission());
  const draft = selectMissionAnswer(firstStep, 'consultar-agenda');
  const restart = createSoftwareMission();
  assert.deepEqual(restart, { index: -1, answers: {}, tested: false });
  assert.equal(draft.answers.sequencia.value, 'consultar-agenda');
});

import { SOFTWARE_MISSION_STEPS } from './software-steps.js';

const LAB_HOURS = ['14h', '15h'];

// Cada chamada parte da mesma agenda fictícia. Uma sugestão nunca ocupa a vaga.
export function simulateReservation(rule, requestedHour = '14h') {
  if (!LAB_HOURS.includes(requestedHour)) return null;
  if (rule !== 'proximo-horario' && rule !== 'fila-espera') return null;

  const first = { turma: 'Turma A', horario: '14h', situacao: 'Reserva confirmada' };
  if (requestedHour !== first.horario) {
    return {
      first,
      second: { turma: 'Turma B', horario: requestedHour, situacao: 'Reserva confirmada' },
      explanation: 'O horário está livre, então o sistema pode confirmar o pedido.'
    };
  }

  if (rule === 'proximo-horario') {
    const nextHour = LAB_HOURS.find(hour => hour !== first.horario);
    return {
      first,
      second: { turma: 'Turma B', horario: nextHour, situacao: 'Horário sugerido, aguardando confirmação' },
      explanation: `A Turma B recebe a sugestão fictícia das ${nextHour}. Ela precisa confirmar se pode usar o laboratório nesse horário.`
    };
  }

  return {
    first,
    second: { turma: 'Turma B', horario: requestedHour, situacao: 'Na fila de espera' },
    explanation: 'A Turma B poderá usar as 14h se uma vaga surgir. A fila não garante a reserva.'
  };
}

export function createSoftwareMission() {
  // A posição -1 é a apresentação. Depois da última etapa vem a reflexão.
  return { index: -1, answers: {}, tested: false };
}

export function selectMissionAnswer(mission, value) {
  const step = SOFTWARE_MISSION_STEPS[mission.index];
  if (!step?.options?.some(option => option.value === value)) return mission;
  if (mission.answers[step.id]?.value === value) return mission;

  return {
    ...mission,
    answers: { ...mission.answers, [step.id]: { value, reviewed: false } },
    // A simulação anterior deixa de valer quando a regra muda.
    tested: step.id === 'regra' ? false : mission.tested
  };
}

export function advanceSoftwareMission(mission) {
  if (mission.index === -1) return { ...mission, index: 0 };
  const step = SOFTWARE_MISSION_STEPS[mission.index];
  if (!step) return mission;

  if (step.options) {
    const answer = mission.answers[step.id];
    if (!answer) return mission;
    if (!answer.reviewed) {
      return {
        ...mission,
        answers: { ...mission.answers, [step.id]: { ...answer, reviewed: true } }
      };
    }
  } else if (!mission.tested) {
    return { ...mission, tested: true };
  }

  return { ...mission, index: mission.index + 1 };
}

export function goBackInSoftwareMission(mission) {
  if (mission.index === -1) return mission;
  return { ...mission, index: mission.index - 1 };
}

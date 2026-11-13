// O conteúdo de cada etapa fica junto das alternativas e de suas explicações.
export const SOFTWARE_MISSION_STEPS = [
  {
    id: 'sequencia',
    title: 'Organize a ordem das ações',
    scenario: 'Só uma turma pode usar o laboratório por horário. A Turma A já reservou às 14h e a Turma B pede o mesmo horário. Uma sequência é a ordem em que o sistema faz as coisas.',
    question: 'Qual sequência evita duas reservas para o mesmo horário?',
    expected: 'consultar-agenda',
    options: [
      {
        value: 'confirmar-primeiro',
        label: 'Confirmar o pedido e depois consultar a agenda.',
        feedback: 'Nesse caso, o sistema já teria confirmado a Turma B quando descobrisse o conflito. Consultar a agenda primeiro permite decidir antes de confirmar.'
      },
      {
        value: 'consultar-agenda',
        label: 'Consultar a agenda e confirmar o pedido se o horário estiver livre.',
        feedback: 'A agenda mostra que as 14h já estão ocupadas. Consultá-la primeiro impede que o sistema confirme a Turma B para o mesmo horário.'
      },
      {
        value: 'ordem-de-chegada',
        label: 'Confirmar os pedidos por ordem de chegada, sem consultar a agenda.',
        feedback: 'A ordem de chegada ajuda a organizar os pedidos, mas dois pedidos podem chegar para o mesmo horário. A agenda mostra se já existe uma reserva.'
      }
    ]
  },
  {
    id: 'condicao',
    title: 'Preveja o resultado da regra',
    scenario: 'A condição é a pergunta que o sistema verifica: “O horário está livre?”. A resposta indica qual ação ele deve executar.',
    code: 'SE o horário estiver livre:\n  confirmar a reserva\nSENÃO:\n  informar que o horário está ocupado',
    question: 'A Turma B pede as 14h, que já estão ocupadas. O que acontece?',
    expected: 'informar-conflito',
    options: [
      {
        value: 'confirmar-reserva',
        label: 'O sistema confirma a reserva da Turma B.',
        feedback: 'A confirmação acontece apenas quando a resposta para “O horário está livre?” é sim. Às 14h, o sistema segue a ação do SENÃO.'
      },
      {
        value: 'sugerir-automaticamente',
        label: 'O sistema sugere automaticamente as 15h.',
        feedback: 'Sugerir outro horário pode ser uma boa ideia, mas essa ação ainda não faz parte da regra. O SENÃO só manda informar que o horário está ocupado.'
      },
      {
        value: 'informar-conflito',
        label: 'O sistema informa que as 14h estão ocupadas.',
        feedback: 'Como já há reserva às 14h, a condição não é atendida. O sistema executa a ação do SENÃO e a reserva da Turma A continua confirmada.'
      }
    ]
  },
  {
    id: 'falha',
    title: 'Investigue uma falha',
    scenario: 'Em uma versão inicial do sistema, a regra abaixo funcionou quando uma turma pediu um horário livre. Agora imagine que duas turmas peçam as 14h, uma depois da outra.',
    code: 'PARA cada pedido de reserva:\n  confirmar a reserva',
    question: 'Que problema o segundo pedido revela nessa versão?',
    expected: 'dupla-reserva',
    options: [
      {
        value: 'dupla-reserva',
        label: 'O sistema confirma as duas turmas para as 14h.',
        feedback: 'A regra confirma cada pedido sem consultar a agenda. Um teste com horário livre não revela esse erro. Testar também um horário ocupado mostra a dupla reserva.'
      },
      {
        value: 'manter-primeira',
        label: 'O sistema confirma só a primeira turma.',
        feedback: 'Para isso, a regra teria de verificar se a primeira turma já reservou. Ao testar o segundo pedido, vemos que a versão inicial confirma esse pedido também.'
      },
      {
        value: 'mover-segunda',
        label: 'O sistema muda a segunda turma para as 15h.',
        feedback: 'A versão inicial não procura outro horário. Testar o segundo pedido mostra que ela repete a confirmação para as 14h.'
      }
    ]
  },
  {
    id: 'regra',
    title: 'Escolha como lidar com o conflito',
    scenario: 'A escola quer oferecer uma opção quando o horário já está ocupado. As duas regras abaixo podem ser úteis. Pense se, para a turma, é mais importante conseguir um horário logo ou esperar pelas 14h.',
    question: 'Qual regra você quer testar?',
    options: [
      {
        value: 'proximo-horario',
        label: 'Sugerir o próximo horário disponível.',
        feedback: 'O sistema sugere as 15h, o próximo horário livre na agenda fictícia. Isso ajuda quando a turma tem flexibilidade. A turma ainda precisa confirmar que pode ir às 15h.'
      },
      {
        value: 'fila-espera',
        label: 'Colocar a Turma B na fila de espera.',
        feedback: 'A turma mantém o pedido para as 14h. Isso ajuda quando mudar de horário é difícil. Uma vaga só poderá surgir se houver um cancelamento.'
      }
    ]
  },
  { id: 'simulacao', title: 'Teste sua regra em dois casos' }
];

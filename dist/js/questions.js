// A ordem intercala as seis áreas: três perguntas por área, sem pesos ocultos.
export const AREAS = [
  { id: 'tecnologia', name: 'Tecnologia e Exatas', short: 'Criar soluções', icon: 'code', color: 'blue', description: 'Lógica, números e ideias que viram soluções.' },
  { id: 'saude', name: 'Saúde e Cuidado', short: 'Cuidar de pessoas', icon: 'heart', color: 'rose', description: 'Bem-estar, escuta e cuidado com as pessoas.' },
  { id: 'comunicacao', name: 'Comunicação e Criatividade', short: 'Expressar ideias', icon: 'pen', color: 'orange', description: 'Histórias, imagens e novas formas de se expressar.' },
  { id: 'negocios', name: 'Negócios e Organização', short: 'Fazer acontecer', icon: 'chart', color: 'purple', description: 'Planejamento, projetos e trabalho em equipe.' },
  { id: 'sociedade', name: 'Sociedade e Educação', short: 'Transformar realidades', icon: 'people', color: 'teal', description: 'Aprendizado, direitos e vida em comunidade.' },
  { id: 'natureza', name: 'Natureza e Meio Ambiente', short: 'Explorar e preservar', icon: 'leaf', color: 'green', description: 'Seres vivos, sustentabilidade e o nosso planeta.' }
];

export const ANSWERS = [
  { value: 0, label: 'Não me identifico', hint: 'Isso não chama muito a minha atenção.' },
  { value: 1, label: 'Me identifico um pouco', hint: 'Tenho alguma curiosidade sobre isso.' },
  { value: 2, label: 'Me identifico bastante', hint: 'É algo que eu gostaria de explorar.' }
];

export const QUESTIONS = [
  { id: 'q01', area: 'tecnologia', text: 'Gosto de entender como aplicativos e aparelhos funcionam.' },
  { id: 'q02', area: 'saude', text: 'Tenho curiosidade sobre como o corpo humano funciona.' },
  { id: 'q03', area: 'comunicacao', text: 'Gosto de criar desenhos, textos, vídeos ou músicas.' },
  { id: 'q04', area: 'negocios', text: 'Gosto de organizar tarefas e planejar o que fazer primeiro.' },
  { id: 'q05', area: 'sociedade', text: 'Gosto de explicar um assunto para ajudar alguém a aprender.' },
  { id: 'q06', area: 'natureza', text: 'Tenho curiosidade sobre plantas, animais e os lugares onde vivem.' },
  { id: 'q07', area: 'comunicacao', text: 'Gosto de encontrar formas diferentes de contar uma história.' },
  { id: 'q08', area: 'natureza', text: 'Gostaria de participar de ações para cuidar do meio ambiente.' },
  { id: 'q09', area: 'tecnologia', text: 'Gosto de resolver desafios de lógica e problemas com números.' },
  { id: 'q10', area: 'sociedade', text: 'Tenho interesse em entender os desafios da minha comunidade.' },
  { id: 'q11', area: 'saude', text: 'Gostaria de aprender formas de cuidar da saúde das pessoas.' },
  { id: 'q12', area: 'negocios', text: 'Tenho curiosidade sobre como uma empresa ou projeto funciona.' },
  { id: 'q13', area: 'sociedade', text: 'Gosto de conversar sobre direitos, respeito e uma sociedade mais justa.' },
  { id: 'q14', area: 'negocios', text: 'Gosto de pensar em como usar melhor o tempo e os recursos de um grupo.' },
  { id: 'q15', area: 'natureza', text: 'Gostaria de investigar como reduzir lixo e preservar rios e florestas.' },
  { id: 'q16', area: 'saude', text: 'Tenho vontade de ajudar pessoas a recuperar seu bem-estar.' },
  { id: 'q17', area: 'comunicacao', text: 'Gostaria de transformar ideias em mensagens que chamem a atenção.' },
  { id: 'q18', area: 'tecnologia', text: 'Gostaria de construir ou melhorar uma solução usando tecnologia.' }
];

export const EDUCATIONAL_NOTICE = 'Este questionário é uma atividade educativa de exploração de interesses. Não é um teste psicológico ou diagnóstico vocacional e não define qual profissão você deve seguir.';

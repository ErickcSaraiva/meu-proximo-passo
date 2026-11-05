# Verificação da primeira versão

Verificação realizada em **04/11/2026**. Plataforma estática, versão 1.0.0.

## Resultado

**15 testes automáticos passaram**, sem falhas, usando `node --test tests/core.test.mjs`. Também foram realizados testes de interação no Chrome do ambiente, com navegação real pelos controles da aplicação.

| Verificação | Resultado observado |
| --- | --- |
| Página inicial sem fragmento na URL | Abre a página inicial corretamente. |
| Distribuição do questionário | 18 perguntas únicas; três por área; ordem intercalada. |
| Avançar sem responder | Permanece na pergunta, mostra “Escolha uma resposta para continuar.” e move o foco para a primeira opção. |
| Voltar uma pergunta | A resposta anterior continua selecionada. |
| Percorrer as 18 perguntas | O fluxo termina na revisão, sem finalizar o resultado automaticamente. |
| Revisar as respostas | As 18 perguntas e respectivas opções escolhidas aparecem na lista. |
| Editar na revisão | A primeira resposta foi alterada de 2 para 1; ao salvar, a revisão mostrou a nova escolha. A edição também permitiu retornar a 2. |
| Empate entre todas as áreas | Com 18 respostas de valor 2, as seis áreas aparecem com 6 de 6 pontos, com explicação do empate; as 18 profissões ficam relacionadas. |
| Empate na terceira posição | Teste automático com `[6, 5, 4, 4, 1, 0]` incluiu as quatro áreas de pontuação 4 ou maior. |
| Três maiores sem empate | Teste automático com `[6, 5, 4, 3, 2, 1]` destacou as três primeiras. |
| Pontuação zero | Fluxo completo com 18 respostas zero mostrou mensagem neutra, nenhuma área em destaque e convite ao catálogo; as seis pontuações aparecem como 0 de 6. |
| Refazer | Reinicia na primeira pergunta com todas as respostas vazias. |
| Busca sem acentos | `tecnico` encontrou as duas profissões com “Técnico(a)”. |
| Busca combinada com filtro | `tecnico` + Natureza e Meio Ambiente encontrou somente Técnico(a) em Meio Ambiente. |
| Busca sem resultados | `designer` + Natureza e Meio Ambiente mostrou o estado amigável e o botão de limpar. |
| Limpar filtros | Restaurou as 18 profissões. |
| Chips de área | Filtram as profissões e sincronizam o seletor; a seleção tem `aria-pressed`. |
| Link “Ver todas as profissões” | Após filtrar Saúde, voltar ao início e usar o link restaurou as 18 profissões. |
| Detalhes e ofertas | Designer mostrou Design na UFAM com as duas fontes; Logística mostrou o campus Manaus Distrito Industrial, grau tecnológico e data de consulta. |
| Caminho em subpasta | Cópia temporária em `/_qa/escola/oficina/` carregou módulos, estilos e JSON e mostrou as 18 profissões; arquivos temporários foram retirados da entrega. |
| Tela estreita | Layouts em quadros de 320, 375 e 768 pixels ficaram sem rolagem horizontal. O quadro de 320 pixels também foi usado para questionário, catálogo e detalhes. |
| Teclado | Espaço selecionou um rádio, seta para baixo mudou a opção para valor 1, Tab levou ao botão seguinte e Enter avançou para a segunda pergunta. |
| Foco visível | Confirmado no rádio e no botão seguinte durante a navegação por teclado. |
| Integridade do catálogo | 18 profissões, 20 ofertas, 10 fontes; todos os vínculos resolvem e todas as ofertas pertencem a Manaus. |
| Privacidade no código | Não há persistência de respostas ou chamadas de envio. A única chamada `fetch` lê o JSON local. |

## Reproduzir os testes automáticos

Na raiz do projeto, com Node.js 18 ou superior:

```bash
node --test tests/core.test.mjs
```

Não é preciso instalar pacotes. As funções testadas são as mesmas usadas pela interface, importadas de `core.js`, sem reimplementar o cálculo nos testes.

## Reproduzir a verificação manual

1. Execute o site conforme o README.
2. Entre em “Explorar meus interesses” e tente avançar sem responder.
3. Selecione uma opção, avance, volte e confirme a preservação da resposta.
4. Responda às 18 perguntas e altere uma na revisão.
5. Finalize, confira os valores e abra as explicações de cálculo e de pontuação das seis áreas.
6. Refaça com todas as opções “Me identifico bastante” e confira o empate de seis áreas.
7. Refaça com todas as opções “Não me identifico” e confira o convite neutro ao catálogo.
8. No catálogo, busque `tecnico`, filtre Natureza e depois troque a busca para `designer`; limpe e confirme a lista completa.
9. Abra uma profissão, leia suas formações e confira os links oficiais e a data de consulta.
10. Faça uma passagem usando Tab, setas, Espaço e Enter, incluindo o link “Pular para o conteúdo”.
11. Confira a interface em modo responsivo nas larguras 320, 375, 768 e 1280 pixels.
12. Publique uma cópia em subpasta e confirme que CSS, módulos e JSON não dependem da raiz do domínio.

## Limites desta verificação

- Os testes de layouts foram feitos em quadros com larguras controladas no navegador. Não substituem testes em aparelhos físicos, telas sensíveis ao toque, todos os navegadores ou todas as condições de rede.
- Não foi feita auditoria formal com leitores de tela nem certificação WCAG. A semântica, os rótulos e a navegação por teclado estão implementados; uma rodada com estudantes e tecnologias assistivas é recomendada para evoluções futuras.
- A publicação efetiva no repositório GitHub da escola depende de configurar o repositório e o Pages conforme o README. O carregamento em subpasta foi verificado localmente; não foi criado um repositório GitHub público da escola.
- A consulta às fontes confirma o conteúdo identificado nelas em 04/11/2026. Não confirma editais abertos ou atualização das informações pelas instituições. Pendências estão no catálogo, na interface e em `FONTES-E-PENDENCIAS.md`.

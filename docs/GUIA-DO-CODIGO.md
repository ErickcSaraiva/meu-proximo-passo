# Como compreender e apresentar o código

## 1. As três partes da plataforma

**HTML é a estrutura.** O `index.html` organiza cabeçalho, navegação, conteúdo principal e rodapé. O atributo `lang="pt-BR"` informa o idioma a navegadores e tecnologias assistivas. O JavaScript troca o conteúdo do elemento `main` conforme a tela.

**CSS é a apresentação.** `styles.css` define cores, tamanhos, espaçamentos e arranjos. As regras `@media` reorganizam a interface conforme a largura disponível. Por exemplo, os cartões que ficam em três colunas no computador passam para uma coluna no celular. `:focus-visible` destaca elementos operados por teclado.

**JavaScript é o comportamento.** `app.js` escuta cliques, mudanças dos campos e o envio do questionário. `core.js` concentra as regras de cálculo e filtragem, sem depender da tela. Isso permite testar essas regras diretamente.

## 2. Conteúdo separado da interface

O catálogo fica em `data/catalogo.json`. Uma profissão referencia ofertas por ID, e cada oferta referencia fontes por ID. Isso evita repetir a mesma referência e permite atualizar um curso em um único lugar.

| Relação | Exemplo |
| --- | --- |
| Profissão | `desenvolvimento-software` |
| Oferta relacionada | `ifam-ads` |
| Fonte da oferta | `ifam-tecnologos` e `ifam-ads` |

O nome do curso e o grau não são inferidos a partir do nome da profissão. São registrados na oferta, após consulta à fonte oficial. O status `verificado` significa que curso e município foram identificados naquela referência; não comprova inscrição aberta.

O arquivo `questions.js` guarda as perguntas em ordem misturada. Cada pergunta possui um `id`, uma `area` e um `text`. Os IDs permitem editar o texto sem perder sua relação com a área de cálculo.

## 3. Estado: a memória durante o uso

O objeto `state` em `app.js` guarda as informações temporárias:

```js
const state = {
  answers: {},
  index: 0,
  editing: false,
  result: null,
  catalog: null,
  catalogError: false,
  query: '',
  area: 'todas'
};
```

`answers` relaciona o ID da pergunta ao valor escolhido. Um exemplo é `{ q01: 2, q02: 0 }`. A primeira pergunta usa índice `0`, porque arrays em JavaScript começam nesse índice. O estudante vê `index + 1`.

Ao voltar, o programa consulta `state.answers` e marca novamente o rádio correspondente. Ao revisar, `editing` indica que o botão seguinte deve retornar à revisão, sem percorrer novamente as demais perguntas. Mudar uma resposta invalida o resultado anterior para que ele seja recalculado.

Esse objeto fica apenas em memória. Não existe gravação em arquivo ou envio para um servidor. Recarregar reinicia o aplicativo.

## 4. Validar antes de avançar

Uma resposta válida precisa ser um número inteiro entre 0 e 2. A função `isAnswer` aceita zero: usar apenas `if (!resposta)` seria um erro, porque JavaScript trata `0` como falso.

```js
export function isAnswer(value) {
  return Number.isInteger(value) && value >= 0 && value <= 2;
}
```

O formulário evita seu envio padrão com `event.preventDefault()`. Se não houver opção selecionada, mostra uma mensagem e move o foco para a primeira opção. Não há envio HTTP do formulário.

## 5. Somar os pontos

Cada área tem três perguntas e cada resposta vale até dois pontos. Portanto, cada área tem máximo seis.

```js
QUESTIONS
  .filter(question => question.area === area.id)
  .reduce((sum, question) => sum + answers[question.id], 0);
```

`filter` seleciona as perguntas daquela área. `reduce` começa em zero e acrescenta cada resposta. Por exemplo, em Saúde e Cuidado, `2 + 1 + 2 = 5`. A tela mostra **5 de 6 pontos**, com uma barra HTML `progress` acessível.

O resultado é uma descrição das respostas, sem probabilidades e sem previsão de sucesso profissional. Todas as áreas têm o mesmo peso.

## 6. Explicar os empates sem inventar precisão

Depois da soma, as seis áreas são ordenadas pela pontuação, da maior para a menor. O terceiro elemento do array usa índice `2`:

```js
const cutoff = scores[2].score;
const highlighted = scores.filter(area => area.score >= cutoff);
```

Em `[6, 5, 4, 4, 1, 0]`, o corte é 4. As quatro primeiras áreas aparecem, porque excluir uma das duas com 4 pontos criaria uma preferência que as respostas não demonstram. A ordem alfabética entre áreas empatadas só facilita a apresentação.

Em `[3, 3, 3, 3, 3, 3]`, todas aparecem empatadas. Em `[2, 1, 0, 0, 0, 0]`, todas aparecem porque o corte é zero; o texto explicita a igualdade e os valores de cada área. Esse comportamento preserva os empates, em vez de selecionar arbitrariamente uma das quatro áreas com zero.

O caso `[0, 0, 0, 0, 0, 0]` recebe tratamento específico: `allZero` é verdadeiro, `highlighted` fica vazio e aparece um convite neutro para explorar o catálogo. Isso não é interpretado como falta de capacidade.

## 7. Busca e filtros

`normalizeText` transforma o texto em minúsculas, remove acentos e espaços externos. Assim, `tecnico` encontra `Técnico(a)`. A busca procura no **nome da profissão**, conforme o rótulo do campo.

`filterProfessions` combina três condições: nome da profissão, área e instituição. Quando um seletor está em `todas`, essa condição não restringe a lista. Para filtrar por instituição, a função seleciona os IDs das referências identificadas daquela instituição e procura profissões ligadas a esses IDs. Referências pendentes, sozinhas, não bastam para entrar nesse filtro. Se não houver correspondência, o programa mostra uma mensagem e um botão para limpar os três campos.

`getInstitutions` extrai nomes únicos das referências identificadas e os ordena alfabeticamente em português. O seletor acompanha o JSON: ao adicionar uma instituição com uma referência identificada e ligada a uma profissão, ela passa a aparecer sem editar uma lista de nomes no HTML. Referências históricas são sinalizadas com período e explicação; o filtro não significa oferta de matrícula disponível hoje.

A atualização mantém o foco do campo de busca. A contagem usa `role="status"` e `aria-live="polite"`, para que tecnologias assistivas possam anunciar mudanças.

## 8. Por que funciona em subpastas

Os arquivos HTML usam caminhos como `./assets/styles.css`. O JSON é encontrado a partir da localização do módulo:

```js
fetch(new URL('../data/catalogo.json', import.meta.url));
```

Se o módulo estiver em `/repositorio/oficina/js/app.js`, o navegador resolve o JSON em `/repositorio/oficina/data/catalogo.json`. Nenhum caminho começa na raiz do domínio.

As telas usam fragmentos (`#inicio`, `#questionario`, `#profissoes`). O servidor sempre entrega o mesmo `index.html`; o navegador usa o fragmento para decidir qual conteúdo mostrar. Não precisamos de backend nem configuração especial de rotas no GitHub Pages.

## 9. Acessibilidade na prática

- Links navegam entre telas; botões executam ações.
- Campos têm rótulos, e as respostas usam rádios nativos agrupados por `fieldset` e `legend`.
- `Tab` percorre controles; setas mudam opções do grupo de rádios; `Espaço` seleciona; `Enter` aciona links e botões.
- Mudanças de tela movem o foco para o título; erros focam a opção que precisa de resposta.
- O foco visível ajuda a localizar o controle atual.
- Pontuações incluem texto numérico, além das cores e barras.
- Não há animações contínuas. Preferências por movimento reduzido são respeitadas.

## 10. Uma fala curta para apresentar

“Nossa plataforma ajuda estudantes a explorar interesses sem pedir dados pessoais. Usamos HTML para a estrutura, CSS para o visual e JavaScript para as interações. As 18 perguntas ficam misturadas, com três para cada uma das seis áreas. Cada escolha vale zero, um ou dois; somamos os valores e mostramos a pontuação de zero a seis. Empates são apresentados com transparência e o resultado não define uma profissão. O catálogo é um JSON local com profissões e cursos de Manaus, ligados a fontes oficiais e datas de consulta. Tudo funciona no navegador e pode ser publicado gratuitamente no GitHub Pages.”

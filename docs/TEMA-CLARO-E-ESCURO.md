# Tema claro e escuro

A atualização muda somente três arquivos de execução:

- `dist/index.html`: adiciona o botão e carrega os dois arquivos abaixo.
- `dist/assets/theme.css`: define cores e ajustes do cabeçalho para os dois temas.
- `dist/js/theme.js`: escuta o clique e troca o atributo `data-theme` do elemento HTML.

Quando o botão é acionado, o JavaScript define `data-theme="dark"` ou `data-theme="light"`. O CSS usa esse atributo para decidir quais regras aplicar. As variáveis como `--ink` (texto), `--paper` (fundo) e `--line` (bordas) recebem outros valores no escuro. Componentes com cores próprias também recebem ajustes.

O botão usa `aria-pressed` para informar se o tema escuro está ligado, aceita Enter e Espaço e mantém foco visível. Seu rótulo mostra o tema atual. Em telas pequenas, o botão redundante “Começar agora” do cabeçalho dá espaço ao seletor; o início e o questionário continuam acessíveis pelos demais links.

A troca não recria as telas e não altera as respostas. A escolha vale durante esta aba, inclusive ao navegar entre as telas. Recarregar volta ao tema claro. Não usamos armazenamento persistente nem enviamos preferências.

Validação: os 15 testes existentes passaram; a alternância foi verificada no navegador por clique, Enter e Espaço, preservando uma resposta já selecionada.

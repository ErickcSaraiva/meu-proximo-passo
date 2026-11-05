# Meu Próximo Passo

Plataforma educativa de exploração profissional para estudantes do ensino médio em Manaus. Primeira versão funcional em português do Brasil, feita com HTML, CSS e JavaScript, sem backend, banco de dados, cadastro, chaves de API ou dependências de execução.

Inclui 18 perguntas, revisão das respostas, resultado transparente com empates, 18 profissões, 32 referências de formação (31 identificadas e uma pendente) e 27 fontes oficiais da UFAM, do IFAM, da UEA e da UNINORTE consultadas em **04/11/2026 e 05/11/2026**. É um recorte inicial, não um catálogo completo de Manaus.

> Este questionário é uma atividade educativa de exploração de interesses. Não é um teste psicológico ou diagnóstico vocacional e não define qual profissão você deve seguir.

## Executar no seu computador

1. Extraia o ZIP e abra a pasta do projeto no VS Code.
2. Abra o terminal nessa pasta.
3. Execute com Python 3:

```bash
python3 -m http.server 5500 --directory dist
```

4. Acesse **http://localhost:5500** no navegador.
5. Para encerrar, use `Ctrl+C` no terminal.

No Windows, o comando pode ser `py -m http.server 5500 --directory dist`. Quem já usa a extensão Live Server pode abrir `dist/index.html` com ela. Node.js não é necessário para usar a plataforma. O servidor do Python só entrega arquivos estáticos; não recebe nem processa respostas.

Não abra o HTML com duplo clique (`file://`). Os módulos JavaScript e o carregamento do JSON precisam de um servidor HTTP. Nenhuma instalação de pacote ou `npm install` é necessária.

Para testar em um celular na mesma rede, use o IP local do computador, por exemplo `http://IP-DO-COMPUTADOR:5500`, com o servidor em execução. Depois de publicado no GitHub Pages, basta abrir o endereço do site.

## Publicar gratuitamente no GitHub Pages

### Opção mais simples: arquivos públicos na raiz do repositório

1. Crie um repositório no GitHub para a plataforma.
2. Copie **o conteúdo de `dist/`**, e não a pasta inteira, para a raiz desse repositório. Devem aparecer `index.html`, `assets/`, `data/`, `js/` e `.nojekyll`.
3. Envie esses arquivos para a branch `main`.
4. Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**.
5. Selecione `main` e a pasta **/(root)**; salve.
6. Aguarde o processamento e abra o endereço informado pelo próprio GitHub.

Exemplo de endereço de projeto: `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Não há arquivo `.env`, chave, servidor de aplicação ou comando de build para configurar.

### Manter o projeto completo no repositório

Também é possível enviar a estrutura completa, publicar `main` em **/(root)** e acessar a plataforma em:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/dist/
```

O `.nojekyll` na raiz do projeto desativa o processamento Jekyll. A cópia dentro de `dist/` atende à primeira opção. Use o endereço com `/dist/` ao compartilhar com a escola. O caminho não precisa estar na raiz do domínio.

### Publicar a plataforma dentro de outra subpasta

Você pode copiar o conteúdo de `dist/` para uma pasta como `oficina/` em um site existente. O endereço termina em `/oficina/` e a estrutura interna precisa ser preservada. HTML, CSS, módulos e JSON usam caminhos relativos; as telas usam fragmentos como `#questionario`, sem exigir redirecionamento do servidor.

As definições em `.openai/` servem à prévia entregue neste ambiente e não são necessárias no GitHub Pages. Não há login dentro do aplicativo. A prévia hospedada neste ambiente pode ter controle de acesso da própria hospedagem; para disponibilizar à escola sem conta, use a publicação estática no GitHub Pages.

## Estrutura do código

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| `dist/index.html` | Documento semântico em pt-BR, cabeçalho, navegação, rodapé e ponto de entrada da aplicação. |
| `dist/assets/styles.css` | Cores, componentes, foco visível, impressão e layouts responsivos. |
| `dist/assets/favicon.svg` | Ícone vetorial local, sem download externo. |
| `dist/js/questions.js` | Seis áreas, 18 perguntas, escala única e aviso educativo. |
| `dist/js/core.js` | Funções puras: validação das respostas, cálculo, busca, filtros e validação do catálogo. |
| `dist/js/app.js` | Estado em memória, telas, rotas por fragmento e eventos dos controles. |
| `dist/data/catalogo.json` | Profissões, cursos/ofertas, fontes, datas e pendências. |
| `docs/GUIA-DO-CODIGO.md` | Explicação didática e roteiro para apresentar o funcionamento. |
| `docs/FONTES-E-PENDENCIAS.md` | Lista legível das fontes oficiais e limites da verificação. |
| `docs/VERIFICACAO.md` | Resultados das verificações e roteiro de teste reproduzível. |
| `tests/core.test.mjs` | Testes automatizados com o executor nativo do Node.js. |

## Fluxo e cálculo

1. O estudante responde uma pergunta por vez, escolhendo 0, 1 ou 2.
2. O botão seguinte só avança após uma resposta válida; voltar preserva as escolhas.
3. Ao terminar, as 18 respostas aparecem para revisão. Cada uma pode ser editada.
4. O cálculo soma três respostas de cada área. O máximo é **3 × 2 = 6 pontos**.
5. O resultado destaca as três maiores pontuações e inclui todas as empatadas na terceira posição.
6. Se todas as respostas forem zero, nenhuma área recebe destaque e o catálogo é oferecido como início da exploração.

Por exemplo: respostas **2, 1 e 2** em Tecnologia e Exatas resultam em **5 de 6 pontos**. Isso não significa 83% de chance de sucesso; percentuais e probabilidades não são apresentados.

Em um resultado `[6, 5, 4, 4, 1, 0]`, quatro áreas aparecem em destaque, porque duas empataram em 4 pontos no limite da terceira posição. Se as seis áreas tiverem 3 pontos, as seis aparecem com o mesmo destaque. Dentro de empates, a ordem alfabética organiza a leitura e não indica preferência. Se o terceiro maior valor for zero, todas as áreas empatadas nesse valor aparecem, com a explicação do empate; zero não significa ausência de capacidade.

As relações entre área e profissão são uma organização editorial educativa. Não são indicação automática de profissão adequada. O estudante pode explorar todas as áreas a qualquer momento.

## Atualizar o catálogo

Edite **`dist/data/catalogo.json`**. Não é necessário alterar HTML para adicionar conteúdo. O arquivo tem quatro conjuntos principais:

- `sources`: fontes oficiais, com ID único, instituição, título, URL HTTPS, `consultedAt`, o que foi confirmado e limites.
- `offers`: nome do curso, tipo de formação, instituição, campus/unidade, `city`, status e referências para as fontes.
- `professions`: nome, área, descrição, atividades, ambientes, formação, cursos relacionados e IDs das ofertas.
- `pending`: informações que ainda precisam ser confirmadas.

Exemplo reduzido de uma oferta:

```json
{
  "id": "ifam-logistica",
  "course": "Logística",
  "type": "Tecnólogo",
  "institution": "IFAM",
  "campus": "Manaus Distrito Industrial",
  "city": "Manaus",
  "status": "verificado",
  "sources": ["ifam-logistica"]
}
```

Para adicionar uma profissão:

1. Pesquise o curso em fonte oficial e confirme o município da oferta.
2. Adicione a referência em `sources`, registrando a **data em que você consultou** a página em `AAAA-MM-DD`. Não substitua essa data pela publicação do documento.
3. Registre a oferta em `offers`, com um ID único e a fonte correspondente. Use `Técnico`, `Tecnólogo`, `Bacharelado` ou `Licenciatura` conforme a fonte.
4. Adicione a profissão em `professions` e relacione os IDs das ofertas. Áreas válidas: `tecnologia`, `saude`, `comunicacao`, `negocios`, `sociedade`, `natureza`.
5. Se a informação não estiver confirmada, registre a pendência; não a publique como `verificado`. Uma oferta `pendente` é exibida com aviso próprio e não ganha o selo de formação verificada no cartão do catálogo.
6. Atualize `updatedAt`, a documentação de fontes e, ao mudar as quantidades, os textos de contagem e testes correspondentes. Confirme que o JSON continua válido.
7. Execute os testes, abra a página e confira busca, filtros e detalhes da profissão.

O catálogo desta versão é limitado a Manaus; o validador rejeita ofertas com outro município. Para ampliar a cobertura geográfica, altere conscientemente o modelo, os rótulos de localização e os testes, evitando atribuir outros municípios a Manaus.

Não inclua vagas, preços, salários, notas de corte ou promessas de emprego sem pesquisa própria e contexto atualizado. A confirmação feita nesta entrega é de **curso, grau e localização na fonte**, não de turma ou inscrição atualmente disponível. Algumas fontes institucionais são antigas; isso está explicitado na plataforma e na lista de pendências.

## Privacidade e operação

- Respostas existem apenas no objeto `state.answers` em memória, nesta aba.
- Recarregar ou fechar a página apaga as respostas. Abrir o catálogo pelo menu preserva as respostas enquanto a aba continua aberta.
- A única chamada `fetch` do aplicativo carrega o JSON local e não contém respostas.
- Não há cookies próprios, `localStorage`, `sessionStorage`, rastreadores, análises, anúncios ou formulários pessoais.
- O provedor estático pode registrar acessos técnicos aos arquivos, como qualquer hospedagem. A plataforma não acrescenta respostas a esses acessos ou aos links externos.
- Os sites oficiais externos precisam de internet e têm políticas próprias.
- Não há serviço de cache offline. Em uma rede local sem internet, o site e o JSON podem ser servidos pelo computador da escola; links oficiais continuarão dependendo de internet.

## Testes

Com Node.js 18 ou mais recente, sem instalar pacotes:

```bash
node --test tests/core.test.mjs
```

Ou use `npm test`. Os testes verificam cálculo, validação, distribuição das perguntas, empates, resultado zero, alterações, busca com acentos, combinação de filtros, integridade das fontes e compatibilidade dos caminhos relativos.

O roteiro e os resultados de uso no navegador estão em `docs/VERIFICACAO.md`. Não há certificação formal de acessibilidade. As verificações de teclado e de layouts não substituem uma futura avaliação com leitores de tela e estudantes em dispositivos reais.

## Oficina escolar de 40 minutos

| Tempo | Atividade |
| --- | --- |
| 5 minutos | Acolhida e conversa sobre curiosidades, sem obrigação de escolher uma carreira. |
| 10 minutos | Questionário, revisão e leitura do resultado. |
| 15 minutos | Exploração de profissões, cursos e fontes oficiais. |
| 10 minutos | Conversa sobre descobertas e dúvidas para pesquisar depois. |

Não é necessário recolher ou projetar resultados individuais. A escola pode manter o endereço disponível após a oficina e revisar periodicamente as informações locais.

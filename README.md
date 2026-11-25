# Meu Próximo Passo

Plataforma educativa de exploração profissional para estudantes do ensino médio em Manaus. A área pública usa HTML, CSS e JavaScript e pode ser acessada sem cadastro. O canal de sugestões e o painel administrativo usam Vercel Functions em Node.js e PostgreSQL.

Inclui 18 perguntas, revisão das respostas, resultado transparente com empates, 24 profissões, 95 referências de formação (94 identificadas em fontes oficiais e uma pendente) e 57 fontes. O recorte reúne UFAM, IFAM, UEA, UNINORTE, Estácio, Fametro, UNIP, Universidade Nilton Lins e Faculdade Santa Teresa. Última ampliação em **07/11/2026**; as fontes anteriores mantêm as consultas de 04 e 05/11/2026. Não é um catálogo completo de Manaus, nem uma relação de inscrições abertas.

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

No Windows, o comando pode ser `py -m http.server 5500 --directory dist`. Quem já usa a extensão Live Server pode abrir `dist/index.html` com ela. Esse modo entrega o questionário, o catálogo e a missão guiada. Ao abrir **Enviar sugestão**, o visitante recebe uma indicação de que o envio está disponível na versão hospedada na Vercel.

Não abra o HTML com duplo clique (`file://`). Os módulos JavaScript e o carregamento do JSON precisam de um servidor HTTP. Nenhuma instalação de pacote ou `npm install` é necessária.

Para testar em um celular na mesma rede, use o IP local do computador, por exemplo `http://IP-DO-COMPUTADOR:5500`, com o servidor em execução. Depois de publicado no GitHub Pages, basta abrir o endereço do site.

## Executar o canal de sugestões e o painel

Use Node.js 24, npm, o cliente PostgreSQL `psql` e a CLI da Vercel. É possível usar PostgreSQL local ou um banco de desenvolvimento no Neon.

1. Execute `npm ci` e copie `.env.example` para `.env.local`.
2. Preencha as quatro variáveis abaixo em `.env.local`. Gere cada um dos três segredos com uma execução própria de `openssl rand -hex 32`.
3. Aplique a migration ao banco de desenvolvimento. No exemplo, `DATABASE_URL` já está exportada no terminal. Guarde a URL de conexão fora do repositório.

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f db/001_feedback.sql
```

4. Execute `vercel dev --local --listen 127.0.0.1:3000`. A CLI lê a configuração local e inicia o site e as funções.
5. Abra `http://127.0.0.1:3000/#sugestao` e envie uma mensagem de teste. Abra `http://127.0.0.1:3000/admin`, entre com o usuário `administrador` e a senha configurada, confira a mensagem e mude seu status. A sessão dura uma hora e **Sair** remove o cookie do navegador.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL. No Neon, use a URL com pooling na aplicação e mantenha a verificação TLS com `sslmode=verify-full`. A migration pode ser aplicada com a URL direta. |
| `ADMIN_PASSWORD` | Senha da conta `administrador`, entre 32 e 256 caracteres. |
| `ADMIN_SESSION_SECRET` | Chave de assinatura da sessão, com pelo menos 32 caracteres e diferente da senha. Trocar a chave ou a senha invalida sessões existentes. |
| `FEEDBACK_RATE_LIMIT_SECRET` | Chave de pelo menos 32 caracteres, distinta das anteriores, usada para derivar a chave temporária da cota de envio. |

O formulário aceita até cinco novas mensagens por IP a cada janela de uma hora do relógio. A cota fica no PostgreSQL e funciona entre instâncias da Vercel. A tabela de cotas guarda um código calculado a partir do IP e da hora, e envios posteriores limpam as janelas anteriores. Uma nova tentativa com a mesma mensagem e o mesmo identificador de envio reaproveita a confirmação anterior.

### Preparar a publicação na Vercel

1. Confirme que o projeto usa a raiz deste repositório. O `vercel.json` serve os arquivos de `dist/` e encaminha `/admin` à função correspondente.
2. Para validar uma prévia, use um banco PostgreSQL exclusivo de testes. Aplique a migration e cadastre as quatro variáveis no ambiente **Preview** da Vercel. Guarde senhas, chaves e URLs como segredos.
3. Quando a publicação estiver autorizada, verifique nessa prévia o envio público, o login, a alteração do status e as páginas existentes. Para produção, aplique a migration no banco correspondente e configure os segredos do ambiente **Production** antes de publicar.

Um push para a branch de produção do projeto conectado pode iniciar a publicação automaticamente. [Integração Git da Vercel](https://vercel.com/docs/git)

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

O GitHub Pages oferece o questionário, o catálogo e a missão guiada. O link **Enviar sugestão** mostra a informação de disponibilidade. O envio e o painel são servidos pela publicação da Vercel.

## Estrutura do código

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| `dist/index.html` | Documento semântico em pt-BR, cabeçalho, navegação, rodapé e ponto de entrada da aplicação. |
| `dist/assets/styles.css` | Cores, componentes, foco visível, impressão e layouts responsivos. |
| `dist/assets/favicon.svg` | Ícone vetorial local, sem download externo. |
| `dist/js/questions.js` | Seis áreas, 18 perguntas, escala única e aviso educativo. |
| `dist/js/core.js` | Funções puras: validação das respostas, cálculo, busca, filtros e validação do catálogo. |
| `dist/js/app.js` | Estado em memória, telas, rotas por fragmento e eventos dos controles. |
| `dist/js/feedback-form.js` e `dist/js/admin-feedback.js` | Formulário público e gestão de mensagens no painel. |
| `api/admin.js` e `api/feedback.js` | Login, página administrativa e API de feedback. |
| `server/` e `db/001_feedback.sql` | Sessão, validação, consultas parametrizadas e estrutura do PostgreSQL. |
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

- As respostas do questionário ficam na memória da aba e são apagadas ao recarregar ou fechar a página. Abrir o catálogo pelo menu preserva as respostas na aba.
- O formulário envia o tipo, a mensagem e, quando informado, o e-mail. O banco também registra um identificador de envio, data, hora e status. O administrador pode consultar os dados para acompanhar a mensagem e, quando possível, responder.
- O IP serve para calcular uma chave temporária de cota, guardada em tabela própria. A hospedagem pode manter registros técnicos de acesso. Os sites das instituições têm políticas próprias.
- O painel usa um cookie de sessão para manter o acesso do administrador autenticado.

## Testes

Com Node.js 24, instale as dependências e rode a suíte:

```bash
npm ci
npm test
```

Os testes cobrem questionário, catálogo, missão guiada, autenticação e regras da API de feedback. Para executar também a integração com o PostgreSQL, exporte `FEEDBACK_TEST_DATABASE_URL` com uma conexão direta a um banco descartável e use `npm test`. O teste aplica a migration em um esquema temporário, verifica persistência, ordenação, filtros, paginação, concorrência e status, e remove o esquema ao terminar.

O roteiro e os resultados de uso no navegador estão em `docs/VERIFICACAO.md`. Não há certificação formal de acessibilidade. As verificações de teclado e de layouts não substituem uma futura avaliação com leitores de tela e estudantes em dispositivos reais.

## Oficina escolar de 40 minutos

| Tempo | Atividade |
| --- | --- |
| 5 minutos | Acolhida e conversa sobre curiosidades, sem obrigação de escolher uma carreira. |
| 10 minutos | Questionário, revisão e leitura do resultado. |
| 15 minutos | Exploração de profissões, cursos e fontes oficiais. |
| 10 minutos | Conversa sobre descobertas e dúvidas para pesquisar depois. |

Não é necessário recolher ou projetar resultados individuais. A escola pode manter o endereço disponível após a oficina e revisar periodicamente as informações locais.

## Ampliação de instituições — versão 1.2.0

Foram acrescentadas 44 referências de formação e 16 fontes para cinco instituições. O filtro de instituição é criado a partir do JSON, em ordem alfabética; não há ranking nem parceria comercial. Cursos nacionais não foram associados automaticamente a Manaus.

Estácio/Chapada, Fametro/Sede Chapada e Santa Teresa/Vieiralves usam registros do PBU 2026 de 2025, acompanhados de páginas institucionais quando disponíveis. Os cartões sinalizam **Referência histórica**. A UNIP foi conferida nas colunas Manaus do manual 2027/1; Nilton Lins, no Campus Parque das Laranjeiras. Confirme oferta, modalidade e ingresso atuais diretamente com cada instituição.

A relação de fontes, critérios e aplicação desta atualização está em `docs/ATUALIZACAO-INSTITUICOES.md`. O campo opcional `historical: true` de uma oferta exige `referencePeriod` e `note`: não use apenas um selo para sugerir oferta atual. A graduação em Engenharia de Software da UNINORTE continua pendente de confirmação específica.

## Artes e ampliação da UEA — versão 1.3.0

Foram acrescentadas cinco profissões: Músico(a), Ator ou atriz, Artista da dança, Professor(a) de Artes e Produtor(a) audiovisual. A UEA passou de uma para sete profissões relacionadas, incluindo Sistemas de Informação ligado a desenvolvimento de software. São 12 novas referências e oito fontes oficiais, consultadas em 07/11/2026. A busca aceita palavras-chave editoriais como `música`, `teatro`, `dança` e `cinema`.

Os bacharelados e as licenciaturas da ESAT aparecem como caminhos distintos. O bacharelado em Produção Audiovisual tem aviso de referência histórica de oferta especial, com ingresso futuro a confirmar. A notícia sobre Prova de Habilidade Específica se refere ao processo 2026/acesso 2027; confira sempre o edital do período pretendido. As 18 perguntas e o cálculo continuam os mesmos.

Veja `docs/ATUALIZACAO-ARTES-UEA.md` para entender os vínculos, as fontes e a aplicação do pacote.

## Correção da busca — versão 1.3.1

A busca agora combina nomes de profissão, sinônimos, nomes de cursos e siglas cadastradas. `TI` encontra apenas desenvolvimento de software e Informática; `Enfermagem` encontra Enfermeiro(a); `Odontologia` e `Dentista` encontram a nova profissão de Dentista. Siglas curtas exigem palavra inteira, impedindo coincidências com trechos de `artista` ou `logística`. As palavras da consulta podem estar em outra ordem.

Com instituição selecionada, os nomes e as siglas dos cursos vêm apenas das referências identificadas daquela instituição. Assim, ADS + UEA não faz o curso de outra instituição aparecer. Os sinônimos gerais da profissão continuam pesquisáveis. Odontologia ganhou seis referências locais; Enfermagem ganhou uma referência da UEA. O recorte continua parcial e não confirma inscrições abertas.

Use `npm test` ou `node --test tests/*.test.mjs` para executar todos os testes. O arquivo `tests/search.test.mjs` cobre os casos das imagens enviadas, as combinações de filtros e os limites da busca. O guia de aplicação e a explicação do algoritmo estão em `docs/CORRECAO-BUSCA.md`.

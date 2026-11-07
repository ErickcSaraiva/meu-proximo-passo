# Ampliação de instituições em Manaus — versão 1.2.0

Consulta desta ampliação: **07/11/2026**. A atualização acrescenta **44 referências de formação**, distribuídas por cinco instituições, e **16 fontes oficiais**. O catálogo passa a 9 instituições, 18 profissões, 76 referências (75 identificadas em fontes oficiais e uma pendente) e 43 fontes. Uma referência significa um curso em determinada instituição/unidade, não um curso diferente em toda a cidade.

## Instituições incluídas

| Instituição | Novas referências | Cursos deste recorte |
| --- | ---: | --- |
| Estácio | 11 | Ciências da Computação; Engenharia Civil; Enfermagem; Fisioterapia; Farmácia; Administração; Ciências Contábeis; Logística; Pedagogia; Direito; Ciências Biológicas |
| Fametro | 14 | Análise e Desenvolvimento de Sistemas; Sistemas de Informação; Engenharia Civil; Enfermagem; Fisioterapia; Farmácia; Design Gráfico; Jornalismo; Administração; Ciências Contábeis; Logística; Pedagogia; Serviço Social; Direito |
| UNIP | 6 | Ciência da Computação; Análise e Desenvolvimento de Sistemas; Administração; Ciências Contábeis; Direito; Pedagogia |
| Universidade Nilton Lins | 10 | Engenharia Civil; Enfermagem; Fisioterapia; Farmácia; Jornalismo; Administração; Ciências Contábeis; Pedagogia; Serviço Social; Direito |
| Faculdade Santa Teresa | 3 | Administração; Ciências Contábeis; Direito |

O recorte contém apenas cursos relacionados às profissões já apresentadas. Não é uma lista de todos os cursos de cada instituição. As instituições aparecem em ordem alfabética no filtro, sem classificação de qualidade, preferência ou publicidade.

## Como conferimos as informações

- **Estácio:** unidade Constantino Nery/Chapada confirmada no portal institucional; cursos e graus cruzados com a seção Estácio/Chapada do PBU 2026, publicado em 17/09/2025. A publicação institucional de Computação em Manaus complementa a referência.
- **Fametro:** seção Sede/Chapada no mesmo documento. ADS, Sistemas de Informação, Administração e Design Gráfico contam também com páginas institucionais. FATEC e Fametro não foram tratadas como a mesma instituição.
- **UNIP:** apenas as colunas **Manaus**, nas páginas 8 e 9 do Manual do Candidato 2027/1. Cursos marcados somente em Brasília ou Goiânia não foram associados a Manaus.
- **Universidade Nilton Lins:** origem oficial do catálogo conferida por link no portal da universidade; cursos do Campus Parque das Laranjeiras cruzados com a página da unidade, a relação institucional PBU 2027/1 e a seção específica do edital PBU 2027, publicado em 10/09/2026. Outras unidades não foram automaticamente adicionadas.
- **Faculdade Santa Teresa:** páginas institucionais de Administração, Ciências Contábeis e Direito, cruzadas com a seção Vieiralves do documento PBU 2026. As outras cidades do portal não foram associadas a Manaus.

Os cartões de Estácio, Fametro e Santa Teresa exibem **Referência histórica — PBU 2026 · edital de 2025**, com a orientação de confirmar a oferta atual. O selo “Identificado em fonte oficial” descreve a presença na fonte, não uma matrícula disponível agora. Os editais reúnem várias instituições; o domínio que hospeda o PDF não define a instituição de todos os cursos.

Datas de consulta são as datas da leitura. Não foram alteradas as consultas anteriores de 04 e 05/11/2026. Preços, salários, vagas, condições de bolsas, notas de corte e garantias de emprego não foram incorporados.

## O que mudou no código

1. `dist/data/catalogo.json`: novas entradas em `sources` e `offers`; os IDs das ofertas foram ligados às profissões em `professions`. A área Tecnologia também passa a mostrar Sistemas de Informação como bacharelado relacionado.
2. `dist/js/core.js`: `getInstitutions(offers)` extrai nomes únicos de referências identificadas e os ordena alfabeticamente. `filterProfessions` combina nome, área e instituição. Uma referência pendente, sozinha, não faz uma profissão aparecer no filtro da instituição.
3. `dist/js/app.js`: seletor acessível “Instituição em Manaus”, contagem dos resultados, limpeza conjunta dos filtros e aviso de referência histórica. A página de fontes lê data e lista de instituições do JSON.
4. `dist/assets/styles.css`: apresentação do novo seletor e do aviso, usando as cores e os estados de foco já existentes. O tema claro/escuro continua em memória.
5. `tests/core.test.mjs`: cobertura do filtro combinado, instituição desconhecida, pendência, referências históricas e integridade dos vínculos.

Exemplo didático: ao escolher **Fametro + Saúde e Cuidado**, a função procura as referências identificadas da Fametro, cruza seus IDs com as profissões e mostra Enfermagem, Fisioterapia e Farmácia. Buscar “designer” ao mesmo tempo resulta em zero; o botão de limpar restaura as 18 profissões e os três campos.

O questionário continua com o mesmo cálculo: três perguntas por área, respostas 0/1/2, soma de 0 a 6, três maiores resultados incluindo os empates no limite. Não houve alteração nas perguntas ou nos pontos.

## Aplicar no computador e publicar

O ZIP de atualização contém arquivos relativos à raiz do projeto, sem uma pasta adicional por fora. Ele não contém `.git`, credenciais ou arquivos temporários de verificação.

1. Salve o ZIP em `~/Downloads/Atualizacao-Instituicoes-Manaus.zip`.
2. Abra o terminal e confira o estado do projeto:

```bash
cd ~/Downloads/meu-proximo-passo
git status --short
```

Se houver alterações suas ainda não salvas no Git, revise-as antes de substituir arquivos. Com a versão anterior já registrada no Git, aplique:

```bash
python3 -m zipfile -e ~/Downloads/Atualizacao-Instituicoes-Manaus.zip .
git diff --stat
node --test tests/core.test.mjs
python3 -m http.server 5500 --directory dist
```

O servidor ficará ocupando o terminal. Acesse `http://localhost:5500`, recarregue a página e confira as instituições no catálogo. Encerre o servidor com `Ctrl+C`.

Depois de conferir a versão local:

```bash
git add README.md package.json dist/assets/styles.css dist/data/catalogo.json dist/js/app.js dist/js/core.js tests/core.test.mjs docs/ATUALIZACAO-INSTITUICOES.md docs/FONTES-E-PENDENCIAS.md docs/GUIA-DO-CODIGO.md docs/VERIFICACAO.md
git diff --cached --stat
git commit -m "feat: ampliar instituicoes e filtrar catalogo em Manaus"
git push origin main
```

O commit registra a versão no seu Git; o push envia para o GitHub. Como o projeto já está conectado à Vercel, o envio para a branch de produção dispara o novo deploy. Confira o status na Vercel antes de apresentar o endereço público.

## Pendências

- Confirmar oferta, modalidade, turno, unidade efetiva de aulas e ingresso no período desejado em cada instituição; os registros históricos não confirmam disponibilidade atual.
- A graduação em Engenharia de Software da UNINORTE mantém o estado **pendente**. A especialização encontrada não confirma uma graduação.
- Outras instituições, unidades e cursos de Manaus podem ser acrescentados depois de cruzar nome, grau, município e fonte oficial. A ausência de um curso neste recorte não indica que ele não exista.
- Não foi realizada certificação de acessibilidade nem teste em celulares físicos. Veja as verificações executadas em `VERIFICACAO.md`.

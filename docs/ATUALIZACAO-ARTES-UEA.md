# Artes e ampliação da UEA — versão 1.3.0

Atualização preparada a partir do commit `1d9ae2a` do projeto no GitHub. Consulta das novas fontes: **07/11/2026**. O catálogo passa a **23 profissões, 88 referências de formação, 51 fontes e nove instituições**. São 12 novas referências da UEA, que passa de uma para sete profissões relacionadas; uma referência é um curso/grau em determinada instituição, não uma profissão diferente.

| Profissão no filtro UEA | Formação relacionada neste recorte | Unidade em Manaus |
| --- | --- | --- |
| Advogado(a) | Direito — bacharelado, já cadastrado | Escola de Direito |
| Desenvolvedor(a) de software | Sistemas de Informação — bacharelado | EST |
| Músico(a) | Música — Canto, Instrumento ou Regência — bacharelados | ESAT |
| Ator ou atriz | Teatro — bacharelado | ESAT |
| Artista da dança | Dança — bacharelado | ESAT |
| Professor(a) de Artes | Música — Canto, Instrumento ou Regência; Teatro; Dança — licenciaturas | ESAT |
| Produtor(a) audiovisual | Produção Audiovisual — bacharelado de oferta especial, referência histórica | ESAT |

O portal da ESAT confirma endereço na Avenida Leonardo Malcher, 1728, Praça 14 de Janeiro, Manaus. Outras unidades da UEA não foram associadas automaticamente à capital. Este é um recorte, não todos os cursos da UEA.

## Formação e ingresso

As licenciaturas se relacionam à formação docente nas linguagens específicas. Os bacharelados artísticos têm outra proposta; não há equivalência automática. A relação entre profissão e curso é uma organização educativa, não uma garantia de habilitação ou emprego. Confira os requisitos para a atividade pretendida.

A notícia institucional de 27/08/2026 registra Prova de Habilidade Específica em Dança, Música e Teatro no processo 2026/acesso 2027. Ela não confirma inscrições abertas nem determina as regras dos próximos anos. Os cartões orientam consultar o edital vigente.

Produção Audiovisual exige atenção: o portal lista uma formação tecnológica, enquanto as resoluções 064/2023 e 044/2024 documentam um bacharelado de oferta especial na ESAT. Foi incluída a referência de bacharelado com aviso histórico. O PPC de 2024 descreve entrada única, portanto não afirmamos oferta anual ou abertura de nova turma. Não inferimos que um grau substitui o outro.

## Como funciona no código

- `dist/data/catalogo.json`: cinco novas profissões, 12 ofertas, oito fontes e pendências. Sistemas de Informação foi ligado à profissão já existente de desenvolvimento de software.
- `searchTerms`: palavras-chave opcionais para encontrar Músico(a) ao buscar `música`, e Ator ou atriz ao buscar `teatro`. A busca continua se combinando com área e instituição.
- `dist/js/app.js`: o total de profissões é lido do JSON e atualizado após o carregamento, em vez de ficar fixo em 18.
- `tests/core.test.mjs`: verifica sete profissões da UEA, busca por linguagens artísticas, distinção dos graus, referência especial e as regras já existentes.

O questionário continua com 18 perguntas, três por área. A soma de cada área vai de 0 a 6, com os mesmos empates e resultado zero. Ampliar o catálogo aumenta as possibilidades de exploração; não altera a pontuação.

As fontes completas, seus links e limites estão em `FONTES-E-PENDENCIAS.md` e na página Fontes do aplicativo.

## Aplicar no computador

Salve `Atualizacao-Artes-UEA.zip` em Downloads. Na pasta do projeto, confira se há alterações suas antes de substituir arquivos:

```bash
cd ~/Downloads/meu-proximo-passo
git status --short
```

Com as alterações anteriores já registradas no Git, aplique e verifique:

```bash
python3 -m zipfile -e ~/Downloads/Atualizacao-Artes-UEA.zip .
node --test tests/core.test.mjs
git --no-pager diff --stat
python3 -m http.server 5500 --directory dist
```

Abra `http://localhost:5500`, recarregue e teste UEA + Comunicação e Criatividade. Busque `música`, abra Professor(a) de Artes e confira as licenciaturas; abra Produção Audiovisual e confira o aviso histórico. Encerre o servidor com `Ctrl+C`.

Depois da conferência local:

```bash
git add README.md package.json dist/data/catalogo.json dist/js/app.js dist/js/core.js tests/core.test.mjs docs/ATUALIZACAO-ARTES-UEA.md docs/GUIA-DO-CODIGO.md docs/FONTES-E-PENDENCIAS.md docs/VERIFICACAO.md
git commit -m "feat: ampliar artes e cursos da UEA no catalogo"
git push origin main
```

O push envia a versão ao GitHub e aciona o deploy automático da Vercel já conectada. Aplique apenas o ZIP desta atualização sobre a versão 1.2.0; não é necessário reaplicar o pacote anterior.

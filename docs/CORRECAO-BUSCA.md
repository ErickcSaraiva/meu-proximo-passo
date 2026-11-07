# Correção da busca — versão 1.3.1

Preparada sobre o commit `97d228f`, já publicado no GitHub. Consulta das novas fontes: **07/11/2026**. O projeto passa a 24 profissões, 95 referências de formação (94 identificadas em fontes oficiais e uma pendente), 57 fontes e nove instituições.

## O problema e a correção

| Consulta | Problema anterior | Resultado corrigido |
| --- | --- | --- |
| TI | Seis resultados por coincidência dentro de palavras; desenvolvimento de software não aparecia. | Desenvolvedor(a) de software e Técnico(a) em Informática. |
| Enfermagem | Buscava só o nome da profissão e palavras-chave; não encontrava Enfermeiro(a). | Enfermeiro(a), pelo curso relacionado. |
| Odontologia ou Dentista | A profissão ainda não estava cadastrada. | Dentista, com referências locais e fontes. |
| ADS + UEA | Sigla sem correspondência própria. | Zero neste recorte: não transfere o curso de outras instituições para a UEA. |

Os nomes das profissões, seus sinônimos e os cursos são pesquisáveis. A busca ignora acentos e caixa e permite palavras em outra ordem. Faz correspondências a partir do início de palavras, com siglas curtas declaradas exigindo palavra inteira. Não há busca aproximada por erros de escrita ou consulta externa à internet.

Com uma instituição selecionada, os nomes e as siglas de curso se limitam às ofertas identificadas daquela instituição. O nome e os sinônimos gerais da profissão continuam disponíveis. Isso distingue procurar uma profissão ligada a TI de afirmar que determinada instituição oferece um curso chamado ADS.

## Conteúdo acrescentado

Dentista fica em Saúde e Cuidado, com Odontologia — bacharelado relacionado a UFAM, UEA, Fametro, Universidade Nilton Lins, Faculdade Santa Teresa e UNINORTE. As referências da Fametro e Santa Teresa baseadas no documento de 2025 estão sinalizadas como históricas. A UEA ganhou Enfermagem na ESA, passando de sete para nove profissões relacionadas no recorte.

O cadastro não garante inscrição aberta, formação de turma, habilitação ou emprego. Confira sempre as condições atuais nos sites oficiais. Cursos técnicos de saúde bucal não são equivalentes ao bacharelado em Odontologia.

## Arquivos e testes

- `dist/js/core.js`: correspondência por palavras; siglas; combinação com área e instituição; validação de palavras-chave das ofertas.
- `dist/data/catalogo.json`: sinônimos de profissão, siglas nas ofertas, Dentista, seis referências de Odontologia e Enfermagem da UEA.
- `dist/js/app.js` e `dist/assets/styles.css`: rótulo, exemplos e explicação acessível do campo de busca.
- `tests/search.test.mjs`: regressões dos quatro exemplos enviados e verificações de cursos, siglas, formas femininas, filtros e pendências.
- `tests/core.test.mjs`: mantém os testes do questionário e atualiza a integridade do catálogo.

**38 testes passaram**. Execute todos com `npm test`; não é necessário instalar pacotes. As 18 perguntas, a escala 0/1/2, o máximo de seis pontos por área e as regras de empates continuam iguais.

## Aplicar no computador

Salve `Atualizacao-Correcao-Busca.zip` em Downloads. Confira alterações locais antes de substituir arquivos:

```bash
cd ~/Downloads/meu-proximo-passo
git status --short
```

Com as alterações anteriores já registradas no Git:

```bash
python3 -m zipfile -e ~/Downloads/Atualizacao-Correcao-Busca.zip .
npm test
git --no-pager diff --stat
python3 -m http.server 5500 --directory dist
```

Abra `http://localhost:5500` e confira TI, Enfermagem, Odontologia e Dentista. Combine com área e instituição e use Limpar filtros. O servidor ocupa o terminal; encerre com `Ctrl+C`.

Depois da conferência:

```bash
git add README.md package.json dist/ docs/ tests/
git commit -m "fix: corrigir busca por cursos e siglas no catalogo"
git push origin main
```

O push aciona o deploy automático na Vercel conectada. Aplique apenas este pacote sobre a versão 1.3.0; o ZIP contém arquivos relativos à raiz, sem `.git`, credenciais ou arquivos temporários de verificação.

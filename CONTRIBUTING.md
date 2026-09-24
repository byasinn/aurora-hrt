# Contribuindo com o Aurora

Obrigado pelo interesse! Algumas coisas importantes antes de mandar um PR.

## O que este repositório é (e não é)

Este é o código-fonte do Aurora. A instância em produção (aurorahrt.com.br) e o banco de dados com
usuários reais **não** são gerenciados por PR — são operados separadamente pelo mantenedor. Um PR
muda o código; só o mantenedor decide o que e quando vai pra produção.

## Antes de codar

Pra mudanças pequenas (bug fix, ajuste de UI), pode abrir o PR direto. Pra qualquer coisa maior
(nova feature, mudança de schema, refatoração grande), abre uma Issue primeiro descrevendo o que
pretende fazer — evita trabalho jogado fora se a direção não fizer sentido pro projeto.

## Rodando o projeto

Veja a seção "Rodando localmente" do [README](./README.md).

## Convenções do projeto

- **Migração de schema é sempre aditiva primeiro**: adiciona coluna/tabela nova, faz backfill se
  precisar, só depois de confirmar que tá tudo certo em produção remove a coluna antiga. Nunca um
  PR que adiciona E remove no mesmo passo.
- **Sem `any`, sem `// @ts-ignore`** a não ser que seja genuinely inevitável (e comentado o porquê).
- **Comentários só quando o "porquê" não é óbvio** — não descreva o que o código faz, os nomes já
  fazem isso.
- Testa `npm run build` (typecheck + build) antes de abrir o PR — é o mínimo que precisa passar.

## Dúvidas

Abre uma Issue com sua pergunta.

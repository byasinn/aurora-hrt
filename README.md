# Aurora

PWA de acompanhamento de terapia hormonal (HRT) para pessoas trans, evoluído para uma plataforma
social completa — em produção em [aurorahrt.com.br](https://aurorahrt.com.br).

## O que tem aqui

- **Saúde**: doses de medicação/hormônio (múltiplas por dia), humor, ciclo, medidas corporais,
  exames laboratoriais, notas diárias
- **Social**: posts, reposts, comentários, comunidades, mensagens diretas, perfis públicos com
  privacidade configurável, bloqueios
- **Gamificação**: pontos, troféus e títulos desbloqueáveis
- **Rotinas e treinos**: programas com histórico de execução
- **Explorar**: notícia do dia sorteada a partir de ingestão automática via RSS/Atom, sugestões de
  seguir por interesse
- **Confiança e segurança**: denúncias, log de moderação, moderação automática de imagem antes do
  upload, exportação/exclusão de dados
- PWA instalável, push notifications, 4 idiomas (PT/EN/ES/FR)

## Stack

- **Backend**: Cloudflare Workers + [Hono](https://hono.dev), TypeScript
- **Banco**: Neon Postgres (serverless) via [Drizzle ORM](https://orm.drizzle.team)
- **Storage**: Cloudflare R2
- **Frontend**: React + Vite + React Query + Tailwind + Framer Motion

## Rodando localmente

Precisa de conta (grátis, nos planos free) nos seguintes serviços antes de começar:

| Serviço | Pra quê | Obrigatório? |
|---|---|---|
| [Cloudflare](https://dash.cloudflare.com) | Workers + R2 (`wrangler login`) | sim |
| [Neon](https://neon.tech) | Postgres | sim |
| [Resend](https://resend.com) | Envio de email (confirmação, reset de senha) | sim |
| Google Cloud Console | Login com Google | opcional |
| [Sightengine](https://sightengine.com) | Moderação de imagem no upload | opcional (sem isso, upload não é bloqueado) |

```bash
npm install
cp .env.example .env    # preenche com suas credenciais
wrangler login
npm run db:push         # cria as tabelas no seu banco Neon
npm run dev              # sobe o Worker localmente (wrangler dev)
```

Rodar só o frontend com hot-reload mais rápido, sem o Worker: `npm run dev:vite`.

### Outros comandos úteis

```bash
npm run build             # typecheck + build de produção
npm run db:generate       # gera uma migration nova a partir de shared/schema.ts
npm run db:studio         # abre o Drizzle Studio pra inspecionar o banco
npm run lint               # oxlint
```

## Deploy

Este repositório é o código-fonte do Aurora — **não** dá acesso à instância em produção
(`aurorahrt.com.br`) nem ao banco de dados real. Rodar `npm run deploy` aqui publica no *seu*
Cloudflare (`wrangler login`), não no nosso. Veja [SECURITY.md](./SECURITY.md) se encontrou uma
vulnerabilidade na instância em produção.

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

[MIT](./LICENSE)

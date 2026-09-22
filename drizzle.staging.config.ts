import { defineConfig } from 'drizzle-kit'

// Mesmo schema/migrations do drizzle.config.ts — só aponta pro branch de staging do Neon em vez do
// banco de produção. STAGING_DATABASE_URL fica no .env local (nunca commitado), preenchida com a
// connection string do branch criado no painel do Neon.
export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.STAGING_DATABASE_URL || '',
  },
})

import { isRateLimited } from './rateLimit'
import type { getDb } from './db'

// O plano grátis do Resend só manda 100 emails/dia — no dia de pico (31/08) tivemos 198 cadastros
// num dia só, o que quase certamente já estourou esse limite silenciosamente (o código nem checava
// se o envio deu certo). Margem de segurança de 10 abaixo do limite real do Resend, deixando espaço
// pra outros emails do dia (reset de senha, reenvio) sem estourar o limite deles no meio do caminho.
const DAILY_EMAIL_CAP = 90
const DAY_MS = 24 * 60 * 60 * 1000

/** true = já batemos perto do limite diário do provedor de email — não tenta mandar mais hoje.
 * Cada chamada que devolve false já "reserva" a vaga (efeito colateral do isRateLimited). */
export async function emailQuotaExceeded(db: ReturnType<typeof getDb>): Promise<boolean> {
  return isRateLimited(db, 'email-daily-cap', DAY_MS, DAILY_EMAIL_CAP)
}

export const EMAIL_QUOTA_MESSAGE =
  'Muitos cadastros por email hoje — atingimos nosso limite diário de envio de confirmação. Tenta de novo amanhã, ou entra com "Continuar com Google" (esse não tem esse limite).'

import type { Env } from '../env'

/** true = confirmado que o Resend aceitou o envio. false = falhou (config ausente, erro do Resend,
 * limite estourado etc) — quem chama decide se isso muda a mensagem mostrada pra pessoa, já que
 * antes essa falha era só logada e o usuário nunca sabia que o email não saiu. */
export async function sendEmail(params: { to: string; subject: string; html: string }, env: Env): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY
  const from = env.EMAIL_FROM
  if (!apiKey || !from) {
    console.error('sendEmail: RESEND_API_KEY ou EMAIL_FROM não configurados, email não enviado', params.subject)
    return false
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('sendEmail: falha ao enviar via Resend', res.status, text)
    return false
  }
  return true
}

export function siteUrlFromRequest(req: Request): string {
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

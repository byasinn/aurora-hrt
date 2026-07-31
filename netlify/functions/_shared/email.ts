export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    console.error('sendEmail: RESEND_API_KEY ou EMAIL_FROM não configurados, email não enviado', params.subject)
    return
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
  }
}

export function siteUrlFromRequest(req: Request): string {
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

const STORAGE_KEY = 'transapp.faceIdCredentialId'

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function isFaceIdSupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function isFaceIdEnabled(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)
}

export function disableFaceId() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Registra um gate biométrico local (Face ID/Touch ID) neste dispositivo.
 * Isso NÃO substitui a senha do app no servidor — só protege o acesso local
 * ao app já desbloqueado (a senha continua sendo a autenticação real).
 */
export async function registerFaceId(): Promise<boolean> {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(16))

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Trans Track' },
      user: { id: userId, name: 'usuário', displayName: 'Usuário do app' },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!credential) return false
  localStorage.setItem(STORAGE_KEY, bufferToBase64url(credential.rawId))
  return true
}

export async function authenticateFaceId(): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return false

  const challenge = crypto.getRandomValues(new Uint8Array(32))
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: base64urlToBuffer(stored), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    return !!assertion
  } catch {
    return false
  }
}

// Bloqueio do app por senha numérica (PIN), alternativa ao Face ID pra quem não tem biometria ou
// prefere não usar. Fica só neste aparelho: guarda um hash com sal (PBKDF2), nunca o PIN.
// Esqueceu o PIN? Sai da conta e entra de novo com email e senha — isso apaga o bloqueio.

const STORAGE_KEY = 'transapp.appLockPin'
const ITERATIONS = 100_000

interface StoredPin {
  salt: string
  hash: string
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  return toHex(bits)
}

function read(): StoredPin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredPin) : null
  } catch {
    return null
  }
}

export const PIN_LENGTH = 4

export function isPinEnabled(): boolean {
  return read() != null
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const stored: StoredPin = { salt: toHex(salt), hash: await derive(pin, salt) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = read()
  if (!stored) return true
  return (await derive(pin, fromHex(stored.salt))) === stored.hash
}

export function clearPin() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada a limpar
  }
}

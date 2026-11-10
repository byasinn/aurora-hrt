import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Sons curtinhos sintetizados na hora com WebAudio — sem arquivo de áudio pra baixar, então não pesa
// no app nem no cache offline. Volume baixo de propósito: é um "tic" de confirmação, não música.

export type SoundName = 'tap' | 'toggle' | 'pop' | 'success' | 'coin' | 'error'

interface SoundState {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: 'transapp.sounds' },
  ),
)

const MASTER_VOLUME = 0.12

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  // Navegadores criam o contexto suspenso até um gesto da pessoa — todo play vem de um clique.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface Note {
  freq: number
  /** segundos depois do início do som */
  at?: number
  dur: number
  type?: OscillatorType
  gain?: number
  /** frequência final, pra deslizar o tom (dá o "bloop") */
  slideTo?: number
}

function play(notes: Note[]) {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  for (const n of notes) {
    const start = now + (n.at ?? 0)
    const end = start + n.dur
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.freq, start)
    if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, end)
    // ataque rápido + queda exponencial: evita o "clique" de ligar/desligar a onda de uma vez
    const peak = MASTER_VOLUME * (n.gain ?? 1)
    env.gain.setValueAtTime(0.0001, start)
    env.gain.exponentialRampToValueAtTime(peak, start + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(env).connect(ac.destination)
    osc.start(start)
    osc.stop(end + 0.02)
  }
}

const SOUNDS: Record<SoundName, Note[]> = {
  tap: [{ freq: 740, dur: 0.05, type: 'sine', gain: 0.5, slideTo: 620 }],
  toggle: [{ freq: 520, dur: 0.06, type: 'triangle', gain: 0.6, slideTo: 780 }],
  pop: [{ freq: 420, dur: 0.09, type: 'sine', gain: 0.9, slideTo: 1100 }],
  // arpejo maior (dó-mi-sol) — dose tomada, tarefa concluída
  success: [
    { freq: 1047, at: 0, dur: 0.12, type: 'triangle', gain: 0.7 },
    { freq: 1319, at: 0.07, dur: 0.12, type: 'triangle', gain: 0.7 },
    { freq: 1568, at: 0.14, dur: 0.22, type: 'triangle', gain: 0.7 },
  ],
  // duas notas em onda quadrada — o toque "8-bit" de ganhar Brilho / comprar na lojinha
  coin: [
    { freq: 988, at: 0, dur: 0.07, type: 'square', gain: 0.35 },
    { freq: 1319, at: 0.07, dur: 0.2, type: 'square', gain: 0.35 },
  ],
  error: [{ freq: 300, dur: 0.16, type: 'triangle', gain: 0.6, slideTo: 180 }],
}

export function playSound(name: SoundName) {
  if (!useSoundStore.getState().enabled) return
  try {
    play(SOUNDS[name])
  } catch {
    // som é enfeite — nunca deixa uma falha de áudio quebrar a ação
  }
}

// ---------- voz das vendedoras da lojinha ----------
// Fofinha, não robótica: cada "sílaba" é uma notinha redonda (triângulo + seno uma oitava acima,
// passando por um filtro suave que muda de brilho como se fosse a vogal) com uma entonação que sobe
// e desce — tipo bichinho de joguinho falando "uí-bá-pô". Três vozes, todas agudinhas.

export type VoicePitch = 'low' | 'mid' | 'high'

const VOICE_BASE: Record<VoicePitch, number> = { low: 340, mid: 430, high: 540 }
// tons da "melodia" da fala (relativos à voz), pra não ficar monótono nem desafinado
const STEPS = [1, 1.12, 1.25, 0.9, 1.06]

function syllable(ac: AudioContext, base: number) {
  const t0 = ac.currentTime
  const dur = 0.055 + Math.random() * 0.03
  const f0 = base * STEPS[Math.floor(Math.random() * STEPS.length)]

  const out = ac.createGain()
  out.gain.setValueAtTime(0.0001, t0)
  out.gain.exponentialRampToValueAtTime(MASTER_VOLUME * 0.9, t0 + 0.012)
  out.gain.setValueAtTime(MASTER_VOLUME * 0.9, t0 + dur * 0.55)
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  // a "vogal": filtro passa-baixa mais aberto (á, é) ou mais fechado (ô, u)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1400 + Math.random() * 1600
  lp.Q.value = 0.7
  lp.connect(out).connect(ac.destination)

  for (const [type, mult, gain] of [
    ['triangle', 1, 1],
    ['sine', 2, 0.35],
  ] as const) {
    const osc = ac.createOscillator()
    osc.type = type
    const f = f0 * mult
    // entonação: sobe um pouquinho e desce no fim (fica fofo em vez de bipe reto)
    osc.frequency.setValueAtTime(f * 0.94, t0)
    osc.frequency.linearRampToValueAtTime(f * 1.08, t0 + dur * 0.4)
    osc.frequency.linearRampToValueAtTime(f * 0.97, t0 + dur)
    const g = ac.createGain()
    g.gain.value = gain
    osc.connect(g).connect(lp)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }
}

/** Uma sílaba de "blablá" na voz da vendedora. */
export function playVoice(pitch: VoicePitch) {
  if (!useSoundStore.getState().enabled) return
  try {
    const ac = audio()
    if (ac) syllable(ac, VOICE_BASE[pitch])
  } catch {
    // som é enfeite
  }
}

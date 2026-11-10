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
// Não é bipe: cada "sílaba" é um chiadinho de consoante + uma vogal de verdade (onda dente-de-serra
// passando por dois filtros nos formantes de a/é/i/ó/u), com o tom variando um pouco — sai um
// "blablá" embolado, tipo bichinho de joguinho falando. Três vozes: grave, média e aguda.

export type VoicePitch = 'low' | 'mid' | 'high'

const VOICE_BASE: Record<VoicePitch, number> = { low: 150, mid: 225, high: 320 }
// formantes F1/F2 aproximados de a, é, i, ó, u
const VOWELS: [number, number][] = [
  [780, 1250],
  [520, 1900],
  [320, 2300],
  [520, 950],
  [340, 780],
]

let noise: AudioBuffer | null = null
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ac.sampleRate) return noise
  noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.05), ac.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

function syllable(ac: AudioContext, base: number) {
  const t0 = ac.currentTime
  const out = ac.createGain()
  out.gain.value = MASTER_VOLUME * 2.6
  out.connect(ac.destination)

  // consoante (b/k/t...): chiadinho curto antes da vogal, nem sempre
  let vowelAt = t0
  if (Math.random() < 0.65) {
    const src = ac.createBufferSource()
    src.buffer = noiseBuffer(ac)
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1500 + Math.random() * 2500
    bp.Q.value = 1.4
    const env = ac.createGain()
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.18, t0 + 0.004)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.02)
    src.connect(bp).connect(env).connect(out)
    src.start(t0)
    src.stop(t0 + 0.03)
    vowelAt = t0 + 0.012
  }

  // vogal
  const [f1, f2] = VOWELS[Math.floor(Math.random() * VOWELS.length)]
  const dur = 0.06 + Math.random() * 0.03
  const f0 = base * (0.9 + Math.random() * 0.28)
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f0, vowelAt)
  osc.frequency.linearRampToValueAtTime(f0 * (0.92 + Math.random() * 0.2), vowelAt + dur)
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, vowelAt)
  env.gain.exponentialRampToValueAtTime(1, vowelAt + 0.01)
  env.gain.setValueAtTime(1, vowelAt + dur * 0.6)
  env.gain.exponentialRampToValueAtTime(0.0001, vowelAt + dur)
  for (const [freq, q, g] of [
    [f1, 7, 1],
    [f2, 9, 0.55],
  ] as const) {
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = q
    const gain = ac.createGain()
    gain.gain.value = g
    osc.connect(bp).connect(gain).connect(env)
  }
  env.connect(out)
  osc.start(vowelAt)
  osc.stop(vowelAt + dur + 0.02)
}

/** Uma sílaba de "blablá" na voz da vendedora (grave, média ou aguda). */
export function playVoice(pitch: VoicePitch) {
  if (!useSoundStore.getState().enabled) return
  try {
    const ac = audio()
    if (ac) syllable(ac, VOICE_BASE[pitch])
  } catch {
    // som é enfeite
  }
}

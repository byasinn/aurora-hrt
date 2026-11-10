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

/** "Blá-blá" das vendedoras da lojinha: um bipe curtinho com o tom variando um pouco a cada sílaba
 * (cada personagem tem sua voz, mais grave ou mais aguda). */
export function playVoice(basePitch: number) {
  if (!useSoundStore.getState().enabled) return
  try {
    const f = basePitch * (0.85 + Math.random() * 0.4)
    play([{ freq: f, dur: 0.05, type: 'square', gain: 0.16, slideTo: f * 1.08 }])
  } catch {
    // som é enfeite
  }
}

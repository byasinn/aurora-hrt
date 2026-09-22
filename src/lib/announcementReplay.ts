import { create } from 'zustand'

/** Ponte simples entre a tela "Sobre" (botão "Ver de novo") e o AnnouncementModal, que fica montado
 * lá no Layout — sem isso não teria como uma tela distante mandar o modal reabrir. */
interface AnnouncementReplayState {
  replayVersion: string | null
  replay: (version: string) => void
  clear: () => void
}

export const useAnnouncementReplay = create<AnnouncementReplayState>((set) => ({
  replayVersion: null,
  replay: (version) => set({ replayVersion: version }),
  clear: () => set({ replayVersion: null }),
}))

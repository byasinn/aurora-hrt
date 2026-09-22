import { Heart } from 'lucide-react'

// Troca por sua página real assim que criar a conta (buymeacoffee.com/seu-usuario).
// Fica só aqui, não precisa mexer em mais nada pra atualizar o link.
const SUPPORT_URL = 'https://buymeacoffee.com/aurorahrt'

export default function SupportAppCard() {
  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flag-gradient flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[var(--accent-contrast)] [box-shadow:var(--shadow)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Heart size={18} fill="currentColor" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Quero ajudar o app</span>
        <span className="block text-xs opacity-90">
          Contribua com a hospedagem, o lançamento no iOS/Android e o futuro do Aurora
        </span>
      </span>
    </a>
  )
}

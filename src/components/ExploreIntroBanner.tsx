import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Newspaper, Users, X } from 'lucide-react'
import { Card } from './ui'

const STORAGE_KEY = 'aurora-explore-topics-intro-seen-v2'

/** Card de boas-vindas pra notícia do dia + sugestões de seguir, mostrado só uma vez na primeira
 * visita ao Explorar depois que essa função foi ao ar (chave própria no localStorage, separada do
 * popup geral de versão — é um aviso sobre uma função específica dessa tela). Chave "v2" porque o
 * texto mudou depois do feedback de que a versão com várias páginas de tópico ficou ruim. */
export default function ExploreIntroBanner() {
  const [dismissed, setDismissed] = useState(false)

  let alreadySeen = false
  try {
    alreadySeen = localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // sem localStorage — só não persiste, aparece de novo na próxima visita
  }

  function close() {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ok, sem persistência
    }
  }

  const open = !alreadySeen && !dismissed

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <Card className="relative space-y-2 border-2 [border-color:var(--accent)]">
            <button onClick={close} className="absolute right-3 top-3 cursor-pointer text-[var(--text-muted)]">
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 pr-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                <Newspaper size={16} />
              </span>
              <p className="font-semibold text-[var(--text)]">Novo no Explorar (em teste)</p>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Toda vez que você entra aqui tem uma notícia do dia, sorteada e trocando sempre. É uma função nova,
              ainda em teste — pode mudar bastante nas próximas atualizações.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[var(--accent)]">
              <Users size={13} /> Sugestões de quem seguir também aparecem logo abaixo
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

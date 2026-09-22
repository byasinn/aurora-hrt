import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Card } from '../../components/ui'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import SettingsSubHeader from './SettingsSubHeader'

export default function LanguageSettingsScreen() {
  const { i18n } = useTranslation()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Idioma" />

      <Card className="space-y-1">
        {SUPPORTED_LANGUAGES.map((l) => {
          const selected = i18n.resolvedLanguage === l.code
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => i18n.changeLanguage(l.code)}
              className={
                'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ' +
                (selected ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]/60')
              }
            >
              {l.label}
              {selected && <Check size={16} className="text-[var(--accent)]" />}
            </button>
          )
        })}
      </Card>
      <p className="text-xs text-[var(--text-muted)]">
        O app ainda está sendo traduzido aos poucos — algumas telas continuam em português enquanto isso.
      </p>
    </div>
  )
}

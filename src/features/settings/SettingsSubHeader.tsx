import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ScreenTitle } from '../../components/ui'

export default function SettingsSubHeader({ title }: { title: string }) {
  return (
    <>
      <Link to="/settings" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Configurações
      </Link>
      <ScreenTitle>{title}</ScreenTitle>
    </>
  )
}

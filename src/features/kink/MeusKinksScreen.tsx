import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Card, ScreenTitle } from '../../components/ui'
import KinkChips from '../../components/KinkChips'
import { useProfile, useUpdateProfile } from '../../api/profile'

export default function MeusKinksScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const kinks = (profile?.kinks as string[]) ?? []

  return (
    <div className="space-y-4">
      <Link to="/kink" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Kink
      </Link>
      <ScreenTitle>Meus kinks</ScreenTitle>
      <Card>
        <KinkChips kinks={kinks} onChange={(next) => updateProfile.mutate({ kinks: next })} />
      </Card>
    </div>
  )
}

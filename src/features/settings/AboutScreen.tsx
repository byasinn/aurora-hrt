import { Sparkles } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { useUpdateProfile } from '../../api/profile'
import { useLatestAnnouncement } from '../../api/announcements'
import { useAnnouncementReplay } from '../../lib/announcementReplay'
import SettingsSubHeader from './SettingsSubHeader'

export default function AboutScreen() {
  const updateProfile = useUpdateProfile()
  const { data: announcement } = useLatestAnnouncement(true)
  const replay = useAnnouncementReplay((s) => s.replay)

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Sobre" />

      <Card className="space-y-1">
        <p className="text-sm font-medium text-[var(--text)]">Aurora</p>
        <p className="text-xs text-[var(--text-muted)]">Versão {__APP_VERSION__}</p>
      </Card>

      {announcement && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]">
              <Sparkles size={13} /> Versão {announcement.version} — {announcement.title}
            </span>
          </div>
          <p className="whitespace-pre-line text-sm text-[var(--text-muted)]">{announcement.body}</p>
          <Button variant="secondary" className="w-full" onClick={() => replay(announcement.version)}>
            Ver de novo
          </Button>
        </Card>
      )}

      <Card className="space-y-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => updateProfile.mutate({ onboardingCompleted: false })}
        >
          Repetir configuração inicial
        </Button>
      </Card>
    </div>
  )
}

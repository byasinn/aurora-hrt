import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Pill, Calendar, Ruler, Trophy, FlaskConical, Lightbulb, Pencil, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { fileToResizedDataUrl } from '../../lib/image'

const QUICK_LINKS = [
  { to: '/', label: 'Remédios', icon: Pill },
  { to: '/calendar', label: 'Histórico', icon: Calendar },
  { to: '/measurements', label: 'Medidas', icon: Ruler },
  { to: '/achievements', label: 'Troféus', icon: Trophy },
  { to: '/labs', label: 'Exames', icon: FlaskConical },
  { to: '/tips', label: 'Dicas', icon: Lightbulb },
]

export default function ProfileScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      await updateProfile.mutateAsync({ avatarUrl: dataUrl })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="relative flex flex-col items-center gap-3 text-center">
        <Link to="/settings" className="absolute right-3 top-3 text-[var(--text-muted)]">
          <Settings size={20} />
        </Link>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative"
          disabled={uploading}
        >
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={88} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] text-[var(--accent-contrast)]">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div>
          <p className="font-semibold text-[var(--text)]">{profile?.displayName || 'Sem nome ainda'}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile?.pronouns || 'Adicione seus pronomes'}</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex flex-col items-center gap-1 py-3 text-center">
              <Icon size={20} className="text-[var(--accent)]" />
              <span className="text-[11px] font-medium text-[var(--text)]">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

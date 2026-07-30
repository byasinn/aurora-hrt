import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import PhotoWall from '../../components/PhotoWall'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { fileToResizedDataUrl } from '../../lib/image'

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
      <ScreenTitle>Perfil</ScreenTitle>

      <Card className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative"
          disabled={uploading}
        >
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={88} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] text-xs text-[var(--accent-contrast)]">
            {uploading ? '…' : '✏️'}
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
        <Link to="/calendar">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-xl">🗓️</span>
            <span className="text-[11px] font-medium text-[var(--text)]">Histórico</span>
          </Card>
        </Link>
        <Link to="/measurements">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-xl">📏</span>
            <span className="text-[11px] font-medium text-[var(--text)]">Medidas</span>
          </Card>
        </Link>
        <Link to="/achievements">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-xl">🏆</span>
            <span className="text-[11px] font-medium text-[var(--text)]">Troféus</span>
          </Card>
        </Link>
        <Link to="/labs">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-xl">🧪</span>
            <span className="text-[11px] font-medium text-[var(--text)]">Exames</span>
          </Card>
        </Link>
        <Link to="/tips">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-xl">💡</span>
            <span className="text-[11px] font-medium text-[var(--text)]">Dicas</span>
          </Card>
        </Link>
        <Link to="/feed">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-xl">🖼️</span>
            <span className="text-[11px] font-medium text-[var(--text)]">Feed</span>
          </Card>
        </Link>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--text-muted)]">Seus momentos</h2>
          <Link to="/feed" className="text-xs text-[var(--accent)]">
            Ver feed
          </Link>
        </div>
        <PhotoWall />
      </div>

      <Link to="/settings">
        <Card className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text)]">⚙️ Conta</span>
          <span className="text-[var(--text-muted)]">›</span>
        </Card>
      </Link>
    </div>
  )
}

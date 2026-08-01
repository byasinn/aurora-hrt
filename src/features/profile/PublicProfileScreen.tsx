import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Pencil, Check, Trophy, ArrowLeft, ChevronRight } from 'lucide-react'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useUnlockedAchievements } from '../../api/achievements'
import { useMoodEntries } from '../../api/moods'
import { useMedications } from '../../api/medications'
import { ACHIEVEMENTS } from '../../lib/achievementsEngine'
import { getAchievementIcon } from '../../lib/achievementIcons'
import { fileToResizedDataUrl, fileToFittedDataUrl } from '../../lib/image'
import PhotoWall from '../../components/PhotoWall'
import Avatar from '../../components/Avatar'

export default function PublicProfileScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: unlocked = [] } = useUnlockedAchievements()
  const { data: moodEntries = [] } = useMoodEntries()
  const { data: medications = [] } = useMedications()

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState(profile?.bio ?? '')

  const kinks = (profile?.kinks as string[]) ?? []

  const unlockedKeys = new Set(unlocked.map((u) => u.achievementKey))
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => unlockedKeys.has(a.key))

  const energies = moodEntries.map((m) => m.energyLevel).filter((v): v is number => v != null)
  const libidos = moodEntries.map((m) => m.libidoLevel).filter((v): v is number => v != null)
  const avgEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null
  const avgLibido = libidos.length ? libidos.reduce((a, b) => a + b, 0) / libidos.length : null
  const activeMedications = medications.filter((m) => m.active)
  const hrtDurationDays = profile?.transitionStartDate
    ? Math.floor((Date.now() - new Date(profile.transitionStartDate).getTime()) / 86_400_000)
    : null

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToResizedDataUrl(file)
    updateProfile.mutate({ avatarUrl: dataUrl })
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToFittedDataUrl(file, 1200, 0.8)
    updateProfile.mutate({ coverUrl: dataUrl })
  }

  function startEditBio() {
    setBioDraft(profile?.bio ?? '')
    setEditingBio(true)
  }

  function saveBio() {
    updateProfile.mutate({ bio: bioDraft || null })
    setEditingBio(false)
  }

  return (
    <div className="-mx-4 -mt-2">
      <div className="relative h-32 w-full bg-[var(--surface-2)]">
        <button type="button" onClick={() => coverInputRef.current?.click()} className="block h-full w-full">
          {profile?.coverUrl ? (
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flag-gradient h-full w-full" />
          )}
        </button>
        <Link
          to="/profile"
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="pointer-events-none absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white">
          <Camera size={14} />
        </span>
      </div>
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      <div className="px-4">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="relative -mt-10 block w-fit rounded-full ring-4 ring-[var(--bg)]"
        >
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={80} />
        </button>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="mt-2">
          <p className="text-lg font-semibold text-[var(--text)]">{profile?.displayName || 'Sem nome ainda'}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile?.pronouns}</p>
        </div>

        <div className="mt-2">
          {editingBio ? (
            <div className="flex items-start gap-2">
              <textarea
                autoFocus
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={2}
                placeholder="Escreva uma bio…"
                className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={saveBio}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button onClick={startEditBio} className="flex items-start gap-2 text-left">
              <p className="text-sm text-[var(--text)]">
                {profile?.bio || <span className="text-[var(--text-muted)]">Adicionar bio…</span>}
              </p>
              <Pencil size={12} className="mt-1 shrink-0 text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {profile?.nsfwMode && (
          <Link to="/kink" className="mt-3 flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-xs font-medium text-[var(--text-muted)]">Kinks</h2>
              <p className="text-sm text-[var(--text)]">
                {kinks.length > 0 ? kinks.join(', ') : 'Toque pra adicionar seus kinks'}
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
          </Link>
        )}

        {((profile?.shareAvgMood && avgEnergy !== null) ||
          (profile?.shareLibido && avgLibido !== null) ||
          (profile?.shareHrtDuration && hrtDurationDays !== null)) && (
          <div className="mt-3 flex flex-wrap gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            {profile?.shareAvgMood && avgEnergy !== null && (
              <div>
                <p className="text-lg font-semibold flag-gradient-text">{avgEnergy.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">energia média</p>
              </div>
            )}
            {profile?.shareLibido && avgLibido !== null && (
              <div>
                <p className="text-lg font-semibold flag-gradient-text">{avgLibido.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">libido média</p>
              </div>
            )}
            {profile?.shareHrtDuration && hrtDurationDays !== null && (
              <div>
                <p className="text-lg font-semibold flag-gradient-text">{Math.floor(hrtDurationDays / 30)}m</p>
                <p className="text-[11px] text-[var(--text-muted)]">em hormonioterapia</p>
              </div>
            )}
          </div>
        )}

        {profile?.shareMedications && activeMedications.length > 0 && (
          <div className="mt-3">
            <h2 className="mb-2 text-xs font-medium text-[var(--text-muted)]">O que toma (visível no perfil)</h2>
            <div className="space-y-1">
              {activeMedications.map((m) => (
                <p key={m.id} className="text-sm text-[var(--text)]">
                  {m.name} — {m.doseAmount}
                  {m.doseUnit} · {m.route}
                </p>
              ))}
            </div>
          </div>
        )}

        {unlockedAchievements.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Trophy size={14} className="text-[var(--accent)]" />
              <h2 className="text-xs font-medium text-[var(--text-muted)]">Troféus</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {unlockedAchievements.map((a) => {
                const Icon = getAchievementIcon(a.icon)
                return (
                  <div
                    key={a.key}
                    title={a.title}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xl"
                  >
                    {Icon ? <Icon size={20} className="text-[var(--accent)]" /> : a.icon}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h2 className="mb-2 text-xs font-medium text-[var(--text-muted)]">Posts</h2>
          <PhotoWall />
        </div>
      </div>
    </div>
  )
}

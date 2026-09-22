import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Pencil, Check, ArrowLeft, ChevronRight, Grid3x3, Rows3, Columns2, Plus, Link2 } from 'lucide-react'
import clsx from 'clsx'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { useMoodEntries } from '../../api/moods'
import { useMyFollowing, useMySocialStats } from '../../api/social'
import { useUnlockedTitles } from '../../api/titles'
import { usePointsStats } from '../points/usePointsStats'
import { currentTitle, resolveSpecialTitle, titleName } from '../../lib/titles'
import { getCollectibleIcon } from '../../lib/collectibleIcons'
import PhotoWall, { type CollageStyle } from '../../components/PhotoWall'
import Avatar from '../../components/Avatar'
import ImageCropper from '../../components/ImageCropper'
import VerifiedBadge from '../../components/VerifiedBadge'
import PostComposer from '../../components/PostComposer'
import type { ExternalLink } from '../../../shared/types'

const COLLAGE_OPTIONS: { key: CollageStyle; icon: typeof Grid3x3 }[] = [
  { key: 'grid', icon: Grid3x3 },
  { key: 'row', icon: Rows3 },
  { key: 'masonry', icon: Columns2 },
]

export default function PublicProfileScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: moodEntries = [] } = useMoodEntries()
  const { data: unlockedTitles = [] } = useUnlockedTitles()
  const { data: socialStats } = useMySocialStats()
  const { data: myFollowing } = useMyFollowing()
  const pointsStats = usePointsStats()

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState(profile?.bio ?? '')
  const [croppingAvatar, setCroppingAvatar] = useState<File | null>(null)
  const [croppingCover, setCroppingCover] = useState<File | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  const sfwTitle = currentTitle(pointsStats.brilho)
  const SfwTitleIcon = getCollectibleIcon(sfwTitle.icon)
  const specialTitleDef = resolveSpecialTitle(
    unlockedTitles.filter((t) => t.track === 'special').map((t) => t.titleKey),
  )
  const SpecialTitleIcon = specialTitleDef ? getCollectibleIcon(specialTitleDef.icon) : null

  const externalLinks = (profile?.externalLinks as ExternalLink[] | undefined) ?? []

  const energies = moodEntries.map((m) => m.energyLevel).filter((v): v is number => v != null)
  const libidos = moodEntries.map((m) => m.libidoLevel).filter((v): v is number => v != null)
  const avgEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null
  const avgLibido = libidos.length ? libidos.reduce((a, b) => a + b, 0) / libidos.length : null
  const hrtDurationDays = profile?.transitionStartDate
    ? Math.floor((Date.now() - new Date(profile.transitionStartDate).getTime()) / 86_400_000)
    : null

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCroppingAvatar(file)
    e.target.value = ''
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCroppingCover(file)
    e.target.value = ''
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
          className="relative z-10 -mt-10 block w-fit rounded-full ring-4 ring-[var(--bg)]"
        >
          <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={72} />
        </button>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="mt-2">
          <p className="flex items-center gap-1 text-lg font-semibold text-[var(--text)]">
            {profile?.displayName || 'Sem nome ainda'}
            {profile?.isVerified && <VerifiedBadge size={16} />}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {profile?.username && `@${profile.username}`}
            {profile?.pronouns && ` · ${profile.pronouns}`}
          </p>
        </div>

        {profile && (
          <div className="mt-2 flex gap-4 text-sm text-[var(--text-muted)]">
            <Link to={`/conexoes/${profile.userId}/seguidores`}>
              <strong className="text-[var(--text)]">{socialStats?.followerCount ?? 0}</strong> seguidores
            </Link>
            <Link to={`/conexoes/${profile.userId}/seguindo`}>
              <strong className="text-[var(--text)]">{myFollowing?.length ?? 0}</strong> seguindo
            </Link>
          </div>
        )}

        {specialTitleDef && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: 'var(--accent-3)', color: 'var(--accent-3)' }}
          >
            {SpecialTitleIcon && <SpecialTitleIcon size={12} />} {titleName(specialTitleDef, profile?.textStyle)}
          </span>
        )}

        <div className="mt-3">
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
            <button onClick={startEditBio} className="flex w-full items-start gap-2 text-left">
              <p className="flex-1 text-sm text-[var(--text)]">
                {profile?.bio || <span className="text-[var(--text-muted)]">Adicionar bio…</span>}
              </p>
              <Pencil size={12} className="mt-1 shrink-0 text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {externalLinks.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {externalLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[var(--accent)]"
              >
                <Link2 size={14} className="shrink-0" />
                <span className="truncate">{link.label}</span>
              </a>
            ))}
          </div>
        )}

        {((profile?.shareAvgMood && avgEnergy !== null) ||
          (profile?.shareLibido && avgLibido !== null) ||
          (profile?.shareHrtDuration && hrtDurationDays !== null)) && (
          <div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--border)] pt-3">
            {profile?.shareAvgMood && avgEnergy !== null && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{avgEnergy.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">energia média</p>
              </div>
            )}
            {profile?.shareLibido && avgLibido !== null && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{avgLibido.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">libido média</p>
              </div>
            )}
            {profile?.shareHrtDuration && hrtDurationDays !== null && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{Math.floor(hrtDurationDays / 30)}m</p>
                <p className="text-[11px] text-[var(--text-muted)]">de transição</p>
              </div>
            )}
          </div>
        )}

        <Link to="/perfil/mais-informacoes" className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text)]">Mais informações</span>
          <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
        </Link>

        <Link to="/pontos" className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {profile?.showTitlesSfw ? (
              <span className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text)]">
                {SfwTitleIcon && <SfwTitleIcon size={12} className="text-[var(--accent)]" />} {titleName(sfwTitle, profile?.textStyle)}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Ver pontos e títulos</span>
            )}
          </div>
          <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
        </Link>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium text-[var(--text-muted)]">Posts</h2>
            <div className="flex items-center gap-1">
              {COLLAGE_OPTIONS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => updateProfile.mutate({ postsCollageStyle: key })}
                  className={clsx(
                    'flex h-7 w-7 items-center justify-center rounded-lg border transition',
                    (profile?.postsCollageStyle ?? 'masonry') === key
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                      : 'border-[var(--border)] text-[var(--text-muted)]',
                  )}
                >
                  <Icon size={14} />
                </button>
              ))}
              <button
                onClick={() => setComposerOpen((o) => !o)}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]"
              >
                <motion.span animate={{ rotate: composerOpen ? 45 : 0 }} className="flex">
                  <Plus size={14} />
                </motion.span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {composerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-3 overflow-hidden"
              >
                <PostComposer onPosted={() => setComposerOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <PhotoWall style={(profile?.postsCollageStyle as CollageStyle) ?? 'masonry'} />
        </div>
      </div>

      {croppingAvatar && (
        <ImageCropper
          file={croppingAvatar}
          aspect={1}
          shape="circle"
          outputSize={320}
          onCancel={() => setCroppingAvatar(null)}
          onConfirm={(dataUrl) => {
            setCroppingAvatar(null)
            updateProfile.mutate({ avatarUrl: dataUrl })
          }}
        />
      )}
      {croppingCover && (
        <ImageCropper
          file={croppingCover}
          aspect={3}
          shape="rect"
          outputSize={1200}
          onCancel={() => setCroppingCover(null)}
          onConfirm={(dataUrl) => {
            setCroppingCover(null)
            updateProfile.mutate({ coverUrl: dataUrl })
          }}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Ban, Lock, Link2 } from 'lucide-react'
import Avatar from '../../components/Avatar'
import PhotoWall, { type CollageStyle } from '../../components/PhotoWall'
import VerifiedBadge from '../../components/VerifiedBadge'
import ReportButton from '../../components/ReportButton'
import { Button } from '../../components/ui'
import { useUserProfileByHandle, useFollow, useUnfollow } from '../../api/social'
import { useBlockUser } from '../../api/blocks'
import { useMe } from '../../api/auth'
import { SFW_TITLES, SPECIAL_TITLES, titleName } from '../../lib/titles'
import { ACHIEVEMENTS_SFW, TROPHIES_SFW } from '../../lib/collectiblesEngine'
import { getCollectibleIcon } from '../../lib/collectibleIcons'

export default function UserProfileScreen() {
  const { username } = useParams<{ username: string }>()
  const { data: profile, isLoading } = useUserProfileByHandle(username ?? null)
  const { data: me } = useMe(true)
  const follow = useFollow()
  const unfollow = useUnfollow()
  const blockUser = useBlockUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingBlock, setConfirmingBlock] = useState(false)

  if (isLoading || !profile) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  }

  // acessar o link do próprio perfil (/u/seu-username) não pode oferecer seguir/bloquear/denunciar
  // a si mesmo — o backend já rejeita essas três ações contra a própria conta, isso aqui é só pra
  // nem mostrar os botões nesse caso.
  const isOwn = me?.id === profile.userId

  const sfwTitleDef = profile.titleSfw ? SFW_TITLES.find((t) => t.key === profile.titleSfw) : null
  const specialTitleDef = profile.titleSpecial ? SPECIAL_TITLES.find((t) => t.key === profile.titleSpecial) : null
  const SfwTitleIcon = sfwTitleDef ? getCollectibleIcon(sfwTitleDef.icon) : null
  const SpecialTitleIcon = specialTitleDef ? getCollectibleIcon(specialTitleDef.icon) : null
  const achievementDefs = (profile.achievements ?? [])
    .map((key) => ACHIEVEMENTS_SFW.find((a) => a.key === key))
    .filter((a): a is (typeof ACHIEVEMENTS_SFW)[number] => !!a)
  const trophyDefs = (profile.trophies ?? [])
    .map((key) => TROPHIES_SFW.find((t) => t.key === key))
    .filter((t): t is (typeof TROPHIES_SFW)[number] => !!t)

  return (
    <div className="-mx-4 -mt-2">
      <div className="relative h-32 w-full bg-[var(--surface-2)]">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flag-gradient h-full w-full" />
        )}
        <Link
          to="/feed"
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="absolute right-3 top-3">
          {!isOwn && (
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
          >
            <MoreVertical size={16} />
          </button>
          )}
          {!isOwn && menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
              <ReportButton
                targetType="user"
                targetId={profile.userId}
                label="Denunciar"
                iconSize={14}
                onTriggerClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500"
              />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmingBlock(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500"
              >
                <Ban size={14} /> Bloquear
              </button>
            </div>
          )}
        </div>
      </div>

      {!isOwn && confirmingBlock && (
        <div className="mx-4 mt-3 space-y-2 rounded-2xl border border-red-500/30 bg-[var(--surface)] p-3">
          <p className="text-sm text-[var(--text)]">
            Bloquear {profile.displayName || 'essa pessoa'}? Vocês deixam de se seguir automaticamente, e ela não
            consegue mais ver seu perfil nem te mandar mensagem.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmingBlock(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 !bg-red-500 !text-white"
              disabled={blockUser.isPending}
              onClick={() => blockUser.mutate(profile.userId)}
            >
              {blockUser.isPending ? 'Bloqueando…' : 'Bloquear'}
            </Button>
          </div>
        </div>
      )}

      <div className="px-4">
        <div className="relative z-10 -mt-10 w-fit rounded-full ring-4 ring-[var(--bg)]">
          <Avatar src={profile.avatarUrl} icon={profile.avatarIcon} name={profile.displayName} size={72} />
        </div>

        <div className="mt-2">
          <p className="flex items-center gap-1 text-lg font-semibold text-[var(--text)]">
            {profile.displayName || 'Sem nome ainda'}
            {profile.isVerified && <VerifiedBadge size={16} />}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            @{profile.username}
            {profile.pronouns && ` · ${profile.pronouns}`}
          </p>
        </div>

        {specialTitleDef && (
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: 'var(--accent-3)', color: 'var(--accent-3)' }}
          >
            {SpecialTitleIcon && <SpecialTitleIcon size={12} />} {titleName(specialTitleDef, profile.textStyle)}
          </span>
        )}

        {sfwTitleDef && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text)]">
              {SfwTitleIcon && <SfwTitleIcon size={12} className="text-[var(--accent)]" />} {titleName(sfwTitleDef, profile.textStyle)}
            </span>
          </div>
        )}

        {profile.bio && (
          <div className="mt-3">
            <p className="text-sm text-[var(--text)]">{profile.bio}</p>
          </div>
        )}

        {profile.externalLinks.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {profile.externalLinks.map((link, i) => (
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

        <div className="mt-3 flex gap-4 text-sm text-[var(--text-muted)]">
          <Link to={`/conexoes/${profile.userId}/seguidores`}>
            <strong className="text-[var(--text)]">{profile.followerCount}</strong> seguidores
          </Link>
          <Link to={`/conexoes/${profile.userId}/seguindo`}>
            <strong className="text-[var(--text)]">{profile.followingCount}</strong> seguindo
          </Link>
        </div>

        {!isOwn && (
        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            variant={profile.isFollowedByMe || profile.followRequestPending ? 'secondary' : 'primary'}
            onClick={() => (profile.isFollowedByMe ? unfollow.mutate(profile.userId) : follow.mutate(profile.userId))}
            disabled={follow.isPending || unfollow.isPending || profile.followRequestPending}
          >
            {profile.isFollowedByMe
              ? 'Deixar de seguir'
              : profile.followRequestPending
                ? 'Solicitação enviada'
                : profile.isPrivate
                  ? 'Solicitar'
                  : 'Seguir'}
          </Button>
          <Link to={`/conversas/${profile.userId}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              Mensagem
            </Button>
          </Link>
        </div>
        )}

        {(achievementDefs.length > 0 || trophyDefs.length > 0) && (
          <div className="mt-3 space-y-2">
            {trophyDefs.length > 0 && (
              <div>
                <h2 className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Troféus</h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {trophyDefs.map((t) => {
                    const Icon = getCollectibleIcon(t.icon)
                    return (
                      <div
                        key={t.key}
                        title={`${t.title} — ${t.description}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
                      >
                        {Icon && <Icon size={18} className="text-[var(--accent)]" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {achievementDefs.length > 0 && (
              <div>
                <h2 className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Conquistas</h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {achievementDefs.map((a) => {
                    const Icon = getCollectibleIcon(a.icon)
                    return (
                      <div
                        key={a.key}
                        title={`${a.title} — ${a.description}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
                      >
                        {Icon && <Icon size={18} className="text-[var(--accent)]" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {(profile.avgMood != null || profile.avgLibido != null || profile.hrtDurationDays != null) && (
          <div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--border)] pt-3">
            {profile.avgMood != null && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{profile.avgMood.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">energia média</p>
              </div>
            )}
            {profile.avgLibido != null && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{profile.avgLibido.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">libido média</p>
              </div>
            )}
            {profile.hrtDurationDays != null && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {Math.floor(profile.hrtDurationDays / 30)}m
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">de transição</p>
              </div>
            )}
          </div>
        )}

        {profile.medications && profile.medications.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-xs font-medium text-[var(--text-muted)]">O que toma</h2>
            <div className="space-y-1">
              {profile.medications.map((m, i) => (
                <p key={i} className="text-sm text-[var(--text)]">
                  {m.name} — {m.doseAmount}
                  {m.doseUnit} · {m.route}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h2 className="mb-2 text-xs font-medium text-[var(--text-muted)]">Posts</h2>
          {profile.isFollowedByMe || profile.posts.length > 0 ? (
            <PhotoWall posts={profile.posts} style={profile.postsCollageStyle as CollageStyle} />
          ) : profile.isPrivate ? (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <Lock size={20} className="mb-1 text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text)]">Essa conta é privada</p>
              <p className="text-xs text-[var(--text-muted)]">
                {profile.followRequestPending
                  ? 'Sua solicitação está pendente de aprovação.'
                  : `Siga ${profile.displayName || 'essa pessoa'} pra ver os posts.`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Siga {profile.displayName || 'essa pessoa'} pra ver os posts.</p>
          )}
        </div>
      </div>
    </div>
  )
}

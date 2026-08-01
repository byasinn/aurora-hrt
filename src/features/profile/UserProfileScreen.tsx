import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import Avatar from '../../components/Avatar'
import PhotoWall from '../../components/PhotoWall'
import { Button } from '../../components/ui'
import { useUserProfile, useFollow, useUnfollow } from '../../api/social'
import { useProfile } from '../../api/profile'

export default function UserProfileScreen() {
  const { userId } = useParams<{ userId: string }>()
  const id = Number(userId)
  const { data: profile, isLoading } = useUserProfile(id)
  const { data: myProfile } = useProfile()
  const follow = useFollow()
  const unfollow = useUnfollow()
  const nsfwWarning = profile?.targetNsfwMode && !myProfile?.nsfwMode

  if (isLoading || !profile) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando…</p>
  }

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
      </div>

      <div className="px-4">
        <div className="relative -mt-10 w-fit rounded-full ring-4 ring-[var(--bg)]">
          <Avatar src={profile.avatarUrl} icon={profile.avatarIcon} name={profile.displayName} size={80} />
        </div>

        <div className="mt-2">
          <p className="text-lg font-semibold text-[var(--text)]">{profile.displayName || 'Sem nome ainda'}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile.pronouns}</p>
        </div>

        {profile.bio && <p className="mt-2 text-sm text-[var(--text)]">{profile.bio}</p>}

        <div className="mt-3 flex gap-4 text-sm text-[var(--text-muted)]">
          <span>
            <strong className="text-[var(--text)]">{profile.followerCount}</strong> seguidores
          </span>
          <span>
            <strong className="text-[var(--text)]">{profile.followingCount}</strong> seguindo
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            variant={profile.isFollowedByMe ? 'secondary' : 'primary'}
            onClick={() => (profile.isFollowedByMe ? unfollow.mutate(id) : follow.mutate(id))}
            disabled={follow.isPending || unfollow.isPending}
          >
            {profile.isFollowedByMe ? 'Deixar de seguir' : 'Seguir'}
          </Button>
          <Link to={`/conversas/${id}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              Mensagem
            </Button>
          </Link>
        </div>

        {nsfwWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-500">
              Esse perfil pode ter conteúdo NSFW. Fotos e alguns detalhes ficam escondidos até você ativar o modo
              NSFW nas <Link to="/settings" className="underline">Configurações</Link>.
            </p>
          </div>
        )}

        {profile.kinks && profile.kinks.length > 0 && (
          <div className="mt-3">
            <h2 className="mb-2 text-xs font-medium text-[var(--text-muted)]">Kinks</h2>
            <div className="flex flex-wrap gap-2">
              {profile.kinks.map((kink) => (
                <span
                  key={kink}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)]"
                >
                  {kink}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.avgMood != null || profile.avgLibido != null || profile.hrtDurationDays != null) && (
          <div className="mt-3 flex flex-wrap gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            {profile.avgMood != null && (
              <div>
                <p className="flag-gradient-text text-lg font-semibold">{profile.avgMood.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">energia média</p>
              </div>
            )}
            {profile.avgLibido != null && (
              <div>
                <p className="flag-gradient-text text-lg font-semibold">{profile.avgLibido.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">libido média</p>
              </div>
            )}
            {profile.hrtDurationDays != null && (
              <div>
                <p className="flag-gradient-text text-lg font-semibold">
                  {Math.floor(profile.hrtDurationDays / 30)}m
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">em hormonioterapia</p>
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
          {nsfwWarning ? (
            <p className="text-xs text-[var(--text-muted)]">Ative o modo NSFW pra ver os posts desse perfil.</p>
          ) : profile.isFollowedByMe || profile.posts.length > 0 ? (
            <PhotoWall posts={profile.posts} />
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Siga {profile.displayName || 'essa pessoa'} pra ver os posts.</p>
          )}
        </div>
      </div>
    </div>
  )
}

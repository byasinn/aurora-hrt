import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
import { Button, EmptyState } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useConnections, useFollow, useUnfollow, useRemoveFollower } from '../../api/social'
import { useMe } from '../../api/auth'

export default function ConnectionsScreen() {
  const { userId, type } = useParams<{ userId: string; type: string }>()
  const targetId = Number(userId)
  const kind = type === 'seguindo' ? 'following' : 'followers'
  const [query, setQuery] = useState('')
  const { data: rows, isLoading } = useConnections(targetId, kind, query)
  const { data: me } = useMe(true)
  const follow = useFollow()
  const unfollow = useUnfollow()
  const removeFollower = useRemoveFollower()
  const isOwnFollowersList = kind === 'followers' && me?.id === targetId

  const backTo = me?.id === targetId ? '/profile' : `/u/${targetId}`

  return (
    <div className="space-y-4">
      <Link to={backTo} className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Perfil
      </Link>
      <h1 className="text-xl font-semibold text-[var(--text)]">{kind === 'following' ? 'Seguindo' : 'Seguidores'}</h1>

      <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none"
        />
      </div>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {rows && rows.length === 0 && (
        <EmptyState>{kind === 'following' ? 'Não segue ninguém ainda.' : 'Nenhum seguidor ainda.'}</EmptyState>
      )}

      <div className="space-y-2">
        {rows?.map((r) => {
          const isSelf = r.userId === me?.id
          return (
            <div key={r.userId} className="flex items-center gap-3">
              <Link to={isSelf ? '/profile' : `/u/${r.username}`} className="flex flex-1 items-center gap-3 min-w-0">
                <Avatar src={r.avatarUrl} icon={r.avatarIcon} name={r.displayName} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text)]">{r.displayName || 'Sem nome'}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    @{r.username}
                    {r.pronouns && ` · ${r.pronouns}`}
                  </p>
                </div>
              </Link>
              {!isSelf && (
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant={r.isFollowedByMe ? 'secondary' : 'primary'}
                    onClick={() => (r.isFollowedByMe ? unfollow.mutate(r.userId) : follow.mutate(r.userId))}
                    disabled={follow.isPending || unfollow.isPending}
                  >
                    {r.isFollowedByMe ? 'Seguindo' : 'Seguir'}
                  </Button>
                  {isOwnFollowersList && (
                    <Button
                      variant="secondary"
                      onClick={() => removeFollower.mutate(r.userId)}
                      disabled={removeFollower.isPending}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

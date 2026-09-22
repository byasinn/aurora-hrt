import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import VerifiedBadge from '../../components/VerifiedBadge'
import { useCommunity, useCommunityMembers } from '../../api/community'

export default function CommunityMembersScreen() {
  const { id } = useParams<{ id: string }>()
  const communityId = Number(id)
  const { data: community } = useCommunity(communityId)
  const { data: members, isLoading } = useCommunityMembers(communityId, !!community?.isAdmin)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to={`/comunidade/${communityId}`} className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)]">
          <ArrowLeft size={18} />
        </Link>
        <ScreenTitle>Membros{community ? ` — ${community.name}` : ''}</ScreenTitle>
      </div>

      {!community?.isAdmin ? (
        <EmptyState>Só admin vê a lista de membros.</EmptyState>
      ) : (
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
          {members?.length === 0 && <EmptyState>Ninguém entrou nessa comunidade ainda.</EmptyState>}
          {members?.map((m) => (
            <Link key={m.userId} to={`/u/${m.username}`}>
              <Card className="flex items-center gap-3">
                <Avatar src={m.avatarUrl} icon={m.avatarIcon} name={m.displayName} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-medium text-[var(--text)]">
                    {m.displayName || 'Sem nome'}
                    {m.isVerified && <VerifiedBadge size={12} />}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">@{m.username}</p>
                </div>
                <p className="shrink-0 text-[11px] text-[var(--text-muted)]">
                  {new Date(m.joinedAt).toLocaleDateString('pt-BR')}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

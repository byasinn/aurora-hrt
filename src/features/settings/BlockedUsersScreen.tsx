import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Card, Button, EmptyState, ScreenTitle } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useBlockedUsers, useUnblockUser } from '../../api/blocks'

export default function BlockedUsersScreen() {
  const { data: blocked, isLoading } = useBlockedUsers()
  const unblock = useUnblockUser()

  return (
    <div className="space-y-4">
      <Link to="/settings/privacidade" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Privacidade
      </Link>
      <ScreenTitle>Contas bloqueadas</ScreenTitle>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}
      {blocked && blocked.length === 0 && <EmptyState>Você não bloqueou ninguém.</EmptyState>}

      <div className="space-y-2">
        {blocked?.map((u) => (
          <Card key={u.userId} className="flex items-center gap-3">
            <Avatar src={u.avatarUrl} icon={u.avatarIcon} name={u.displayName} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text)]">{u.displayName || 'Sem nome'}</p>
              {u.username && <p className="text-xs text-[var(--text-muted)]">@{u.username}</p>}
            </div>
            <Button variant="secondary" onClick={() => unblock.mutate(u.userId)} disabled={unblock.isPending}>
              Desbloquear
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

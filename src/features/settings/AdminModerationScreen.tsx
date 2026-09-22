import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Flag, Trash2, Ban } from 'lucide-react'
import clsx from 'clsx'
import { Card, Button, EmptyState, ScreenTitle } from '../../components/ui'
import { useReports, useUpdateReportStatus } from '../../api/reports'
import { useModerationLog } from '../../api/moderationLog'
import { useAdminUsers } from '../../api/admin'

const TARGET_LABELS: Record<string, string> = {
  user: 'Conta',
  post: 'Post',
  community_post: 'Post de comunidade',
  comment: 'Comentário',
  community_comment: 'Comentário de comunidade',
}

const ACTION_LABELS: Record<string, string> = {
  delete_post: 'Apagou post',
  delete_community_post: 'Apagou post de comunidade',
  delete_comment: 'Apagou comentário',
  delete_community_comment: 'Apagou comentário de comunidade',
}

type Tab = 'reports' | 'log' | 'banned'
const TABS: { key: Tab; label: string }[] = [
  { key: 'reports', label: 'Denúncias' },
  { key: 'log', label: 'Removidos' },
  { key: 'banned', label: 'Banidos' },
]

export default function AdminModerationScreen() {
  const [tab, setTab] = useState<Tab>('reports')
  const { data: reports, isLoading: reportsLoading } = useReports(tab === 'reports')
  const {
    data: logPages,
    isLoading: logLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useModerationLog(tab === 'log')
  const log = logPages?.pages.flatMap((p) => p.items)
  const { data: allUsers, isLoading: usersLoading } = useAdminUsers(tab === 'banned')
  const updateStatus = useUpdateReportStatus()

  const bannedUsers = (allUsers ?? []).filter((u) => u.banned)
  const pendingReports = (reports ?? []).filter((r) => r.status === 'pending')
  const otherReports = (reports ?? []).filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-4">
      <Link to="/settings/admin" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ChevronLeft size={16} /> Administração
      </Link>
      <ScreenTitle>Moderação</ScreenTitle>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition',
              tab === t.key
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <div className="space-y-3">
          {reportsLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
          {pendingReports.length === 0 && !reportsLoading && <EmptyState>Nenhuma denúncia pendente.</EmptyState>}
          {pendingReports.map((r) => (
            <Card key={r.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <Flag size={12} /> {TARGET_LABELS[r.targetType] ?? r.targetType}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-sm text-[var(--text)]">{r.targetPreview}</p>
              {r.reason && <p className="text-xs text-[var(--text-muted)]">Motivo: {r.reason}</p>}
              <p className="text-[11px] text-[var(--text-muted)]">Denunciado por {r.reporterEmail}</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 !py-1.5 !text-xs"
                  onClick={() => updateStatus.mutate({ id: r.id, status: 'dismissed' })}
                  disabled={updateStatus.isPending}
                >
                  Descartar
                </Button>
                <Button
                  className="flex-1 !py-1.5 !text-xs"
                  onClick={() => updateStatus.mutate({ id: r.id, status: 'reviewed' })}
                  disabled={updateStatus.isPending}
                >
                  Marcar revisada
                </Button>
              </div>
            </Card>
          ))}

          {otherReports.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-[var(--text-muted)]">Já revisadas</p>
              {otherReports.map((r) => (
                <Card key={r.id} className="space-y-1 opacity-60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">
                      {TARGET_LABELS[r.targetType] ?? r.targetType} · {r.status === 'dismissed' ? 'descartada' : 'revisada'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="truncate text-sm text-[var(--text)]">{r.targetPreview}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-2">
          {logLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
          {log?.length === 0 && !logLoading && <EmptyState>Nada removido por moderação ainda.</EmptyState>}
          {log?.map((entry) => {
            const snapshot = entry.snapshot as { text?: string | null }
            return (
              <Card key={entry.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text)]">
                    <Trash2 size={12} /> {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">{new Date(entry.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                {snapshot?.text && <p className="text-sm text-[var(--text)]">{snapshot.text}</p>}
                <p className="text-[11px] text-[var(--text-muted)]">
                  De {entry.targetEmail ?? 'conta desconhecida'} · removido por {entry.actorEmail}
                </p>
              </Card>
            )
          })}
          {hasNextPage && (
            <Button variant="secondary" className="w-full" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
              {isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
            </Button>
          )}
        </div>
      )}

      {tab === 'banned' && (
        <div className="space-y-2">
          {usersLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
          {bannedUsers.length === 0 && !usersLoading && <EmptyState>Nenhuma conta banida.</EmptyState>}
          {bannedUsers.map((u) => (
            <Card key={u.id} className="flex items-center gap-2">
              <Ban size={14} className="text-red-500" />
              <p className="flex-1 truncate text-sm text-[var(--text)]">{u.email}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

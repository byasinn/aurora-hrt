import { Link } from 'react-router-dom'
import { Shield, Ban, BadgeCheck, Trash2, Flag, Megaphone, Compass, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui'
import { useMe } from '../../api/auth'
import { useAdminUsers, useSetUserBanned, useSetUserAdmin, useSetUserVerified, useDeleteUser } from '../../api/admin'
import { useReports } from '../../api/reports'
import { toastError } from '../../lib/toast'
import SettingsSubHeader from './SettingsSubHeader'

export default function AdminSettingsScreen() {
  const { data: me } = useMe(true)
  const { data: allUsers, isLoading } = useAdminUsers(true)
  const { data: reports } = useReports(true)
  const setBanned = useSetUserBanned()
  const setAdmin = useSetUserAdmin()
  const setVerified = useSetUserVerified()
  const deleteUser = useDeleteUser()
  const pendingReports = (reports ?? []).filter((r) => r.status === 'pending').length

  function handleDeleteUser(id: number, email: string) {
    if (confirm(`Excluir a conta de ${email} pra sempre? Isso apaga posts, mensagens, tudo — não dá pra desfazer.`)) {
      deleteUser.mutate(id, { onError: (err) => toastError(err, 'Não foi possível excluir essa conta.') })
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Administração" />

      <Link to="/settings/admin/moderacao">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Flag size={18} />
          </span>
          <span className="flex-1">
            <span className="block font-medium text-[var(--text)]">Moderação</span>
            <span className="block text-xs text-[var(--text-muted)]">
              {pendingReports > 0 ? `${pendingReports} denúncia${pendingReports === 1 ? '' : 's'} pendente${pendingReports === 1 ? '' : 's'}` : 'Denúncias, removidos e banidos'}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" />
        </Card>
      </Link>

      <Link to="/settings/admin/avisos">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Megaphone size={18} />
          </span>
          <span className="flex-1">
            <span className="block font-medium text-[var(--text)]">Avisos de versão</span>
            <span className="block text-xs text-[var(--text-muted)]">Popup de "o que mudou" pra todo mundo</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" />
        </Card>
      </Link>

      <Link to="/settings/admin/topicos">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Compass size={18} />
          </span>
          <span className="flex-1">
            <span className="block font-medium text-[var(--text)]">Tópicos e fontes</span>
            <span className="block text-xs text-[var(--text-muted)]">Páginas do Explorar e feeds RSS/Atom</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" />
        </Card>
      </Link>

      <Card className="space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          Cadastro é aberto pra qualquer email — banir aqui é como você controla quem continua com acesso.
        </p>
        {isLoading && <p className="text-xs text-[var(--text-muted)]">Carregando…</p>}
        <div className="space-y-1">
          {allUsers?.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 py-1">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--text)]">
                  {u.email} {u.isAdmin && <span className="text-[10px] text-[var(--accent)]">admin</span>}{' '}
                  {u.isVerified && <BadgeCheck size={12} className="inline text-[var(--accent)]" />}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {u.emailVerified ? 'confirmado' : 'não confirmado'} {u.banned && '· banido'}
                </p>
              </div>
              {u.id !== me?.id && (
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <button
                    onClick={() => setVerified.mutate({ id: u.id, isVerified: !u.isVerified })}
                    disabled={setVerified.isPending}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--text)] disabled:opacity-50"
                  >
                    <BadgeCheck size={12} />
                    {u.isVerified ? 'Remover selo' : 'Verificar'}
                  </button>
                  <button
                    onClick={() => setAdmin.mutate({ id: u.id, isAdmin: !u.isAdmin })}
                    disabled={setAdmin.isPending}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--text)] disabled:opacity-50"
                  >
                    <Shield size={12} />
                    {u.isAdmin ? 'Remover admin' : 'Tornar admin'}
                  </button>
                  <button
                    onClick={() => setBanned.mutate({ id: u.id, banned: !u.banned })}
                    disabled={setBanned.isPending}
                    className={
                      'flex items-center gap-1 rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ' +
                      (u.banned ? 'border-[var(--border)] text-[var(--text)]' : 'border-red-500/40 text-red-500')
                    }
                  >
                    <Ban size={12} />
                    {u.banned ? 'Desbanir' : 'Banir'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    disabled={deleteUser.isPending}
                    className="flex items-center gap-1 rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

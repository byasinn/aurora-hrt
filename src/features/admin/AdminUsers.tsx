import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { BadgeCheck, Search as SearchIcon } from 'lucide-react'
import { Ban, Shield, Trash2, X } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { useMe } from '../../api/auth'
import { useAdminUserList, useAdminUser, useAddAdminNote, useBanUser, type AdminUserRow } from '../../api/adminPanel'
import { useSetUserAdmin, useSetUserVerified, useDeleteUser } from '../../api/admin'
import { useDeletePost } from '../../api/posts'
import { toastError } from '../../lib/toast'
import { genderLabel } from '../../../shared/genders'

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'banned', label: 'Banidas' },
  { key: 'admins', label: 'Admins' },
  { key: 'verified', label: 'Com selo' },
  { key: 'unverifiedEmail', label: 'Email não confirmado' },
]

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

function Flags({ u }: { u: Pick<AdminUserRow, 'isAdmin' | 'isVerified' | 'banned' | 'emailVerified'> }) {
  return (
    <span className="flex flex-wrap gap-1">
      {u.banned && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-500">banida</span>}
      {u.isAdmin && <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent)]">admin</span>}
      {u.isVerified && <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent)]">selo</span>}
      {!u.emailVerified && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">email pendente</span>}
    </span>
  )
}

function UserDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: me } = useMe(true)
  const { data, isLoading } = useAdminUser(id)
  const setAdmin = useSetUserAdmin()
  const setVerified = useSetUserVerified()
  const deleteUser = useDeleteUser()
  const ban = useBanUser()
  const addNote = useAddAdminNote()
  const deletePost = useDeletePost()
  const [note, setNote] = useState('')

  if (isLoading || !data) return <p className="p-4 text-sm text-[var(--text-muted)]">Carregando…</p>
  const { user, profile } = data
  const isMe = user.id === me?.id

  function toggleBan() {
    if (user.banned) {
      ban.mutate({ userId: user.id, banned: false }, { onError: (e) => toastError(e) })
      return
    }
    const reason = prompt(`Motivo do banimento de ${user.email} (fica só no painel):`)
    if (reason === null) return
    ban.mutate({ userId: user.id, banned: true, reason }, { onError: (e) => toastError(e) })
  }

  function remove() {
    if (!confirm(`Excluir a conta de ${user.email} pra sempre? Apaga posts, mensagens, tudo — não dá pra desfazer.`)) return
    deleteUser.mutate(user.id, { onSuccess: onClose, onError: (e) => toastError(e, 'Não foi possível excluir.') })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{profile?.displayName || 'Sem nome'}</p>
          <p className="truncate text-sm text-[var(--text-muted)]">
            {profile?.username ? `@${profile.username} · ` : ''}
            {user.email}
          </p>
          <div className="mt-1">
            <Flags u={{ ...user, isVerified: profile?.isVerified ?? false }} />
          </div>
        </div>
        <button onClick={onClose} aria-label="Fechar" className="p-1 text-[var(--text-muted)]">
          <X size={18} />
        </button>
      </div>

      {user.banned && (
        <Card className="border-red-500/40 text-sm">
          <p className="font-bold text-red-500">Banida em {fmtDateTime(user.bannedAt)}</p>
          <p className="text-[var(--text-muted)]">{user.banReason || 'Sem motivo anotado.'}</p>
        </Card>
      )}

      {!isMe && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setVerified.mutate({ id: user.id, isVerified: !profile?.isVerified })} disabled={setVerified.isPending}>
            <BadgeCheck size={15} className="mr-1 inline" />
            {profile?.isVerified ? 'Tirar selo' : 'Dar selo'}
          </Button>
          <Button variant="secondary" onClick={() => setAdmin.mutate({ id: user.id, isAdmin: !user.isAdmin })} disabled={setAdmin.isPending}>
            <Shield size={15} className="mr-1 inline" />
            {user.isAdmin ? 'Tirar admin' : 'Tornar admin'}
          </Button>
          <Button variant="secondary" onClick={toggleBan} disabled={ban.isPending} className={user.banned ? '' : '!text-red-500'}>
            <Ban size={15} className="mr-1 inline" />
            {user.banned ? 'Desbanir' : 'Banir'}
          </Button>
          <Button variant="secondary" onClick={remove} disabled={deleteUser.isPending} className="!text-red-500">
            <Trash2 size={15} className="mr-1 inline" />
            Excluir conta
          </Button>
        </div>
      )}

      <Card className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[
          ['Criada em', fmtDate(user.createdAt)],
          ['Último login', fmtDateTime(user.lastLoginAt)],
          ['Entra com', [user.hasPassword && 'senha', user.hasGoogle && 'Google'].filter(Boolean).join(' + ') || '—'],
          ['Posts', String(data.postsCount)],
          ['Pronomes', profile?.pronouns || '—'],
          ['Gênero', genderLabel(profile?.gender) ?? '—'],
          ['Início da transição', profile?.transitionStartDate ? fmtDate(profile.transitionStartDate) : '—'],
          ['Local', [profile?.city, profile?.country].filter(Boolean).join(', ') || '—'],
          ['Conta privada', profile?.isPrivate ? 'sim' : 'não'],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-[var(--text-muted)]">{k}</p>
            <p className="font-medium">{v}</p>
          </div>
        ))}
        {profile?.username && (
          <Link to={`/u/${profile.username}`} className="col-span-2 text-sm font-bold text-[var(--accent)]">
            Ver perfil público →
          </Link>
        )}
      </Card>

      {profile?.bio && <p className="user-text rounded-xl bg-[var(--surface-2)] p-3 text-sm">{profile.bio}</p>}

      <section className="space-y-2">
        <p className="font-bold">Notas internas</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) return
            addNote.mutate({ userId: user.id, body: note }, { onSuccess: () => setNote(''), onError: (err) => toastError(err) })
          }}
          className="flex gap-2"
        >
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: avisada por spam em 09/11"
            className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <Button type="submit" disabled={addNote.isPending || !note.trim()}>
            Anotar
          </Button>
        </form>
        {data.notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-[var(--border)] p-2.5 text-sm">
            <p className="user-text">{n.body}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {n.authorEmail ?? 'admin'} · {fmtDateTime(n.createdAt)}
            </p>
          </div>
        ))}
      </section>

      {data.reportsAgainst.length > 0 && (
        <section className="space-y-2">
          <p className="font-bold">Denúncias contra a conta ({data.reportsAgainst.length})</p>
          {data.reportsAgainst.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--border)] p-2.5 text-sm">
              <p className="user-text">{r.reason || 'Sem motivo'}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {r.status} · {fmtDateTime(r.createdAt)}
              </p>
            </div>
          ))}
        </section>
      )}

      {data.quarantine.length > 0 && (
        <section className="space-y-1">
          <p className="font-bold">Imagens barradas ({data.quarantine.length})</p>
          <Link to="/admin/quarentena" className="text-sm font-bold text-[var(--accent)]">
            Revisar na quarentena →
          </Link>
        </section>
      )}

      <section className="space-y-2">
        <p className="font-bold">Posts recentes</p>
        {data.recentPosts.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhum post.</p>}
        {data.recentPosts.map((p) => (
          <div key={p.id} className="flex items-start gap-2 rounded-xl border border-[var(--border)] p-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="user-text line-clamp-3 whitespace-pre-wrap">{p.text || '(só imagem)'}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {fmtDateTime(p.createdAt)} {p.images.length > 0 && `· ${p.images.length} imagem(ns)`}
              </p>
            </div>
            <button
              aria-label="Apagar post"
              onClick={() => confirm('Apagar esse post? Fica no registro de moderação.') && deletePost.mutate(p.id, { onError: (e) => toastError(e) })}
              className="shrink-0 p-1 text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}

export default function AdminUsers() {
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const { data, isFetching } = useAdminUserList({ q, filter, page })

  // busca enquanto digita, sem martelar o servidor a cada tecla
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(qInput)
      setPage(0)
    }, 300)
    return () => clearTimeout(id)
  }, [qInput])

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold">Usuários</h1>
          <p className="text-sm text-[var(--text-muted)]">{data ? `${data.total} conta(s)` : 'Carregando…'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
          <SearchIcon size={16} className="text-[var(--text-muted)]" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Buscar por email, @usuário ou nome" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
        </label>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key)
                setPage(0)
              }}
              className={clsx(
                'min-h-9 shrink-0 rounded-full border px-3 text-sm',
                filter === f.key ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]' : 'border-[var(--border)] text-[var(--text-muted)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className={clsx('overflow-hidden p-0', isFetching && 'opacity-70')}>
          {/* PC: tabela · celular: lista */}
          <table className="hidden w-full text-left text-sm lg:table">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2.5">Conta</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Criada</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelected(u.id)}
                  className={clsx('cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]', selected === u.id && 'bg-[var(--accent-soft)]')}
                >
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <Avatar src={u.avatarUrl} icon={u.avatarIcon} name={u.displayName ?? undefined} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{u.displayName || 'Sem nome'}</span>
                        <span className="block truncate text-xs text-[var(--text-muted)]">@{u.username}</span>
                      </span>
                    </span>
                  </td>
                  <td className="max-w-56 truncate px-4 py-2 text-[var(--text-muted)]">{u.email}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-[var(--text-muted)]">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-2">
                    <Flags u={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-[var(--border)] lg:hidden">
            {data?.items.map((u) => (
              <li key={u.id}>
                <button onClick={() => setSelected(u.id)} className="flex w-full items-center gap-3 p-3 text-left">
                  <Avatar src={u.avatarUrl} icon={u.avatarIcon} name={u.displayName ?? undefined} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{u.displayName || 'Sem nome'}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">{u.email}</span>
                    <Flags u={u} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {data?.items.length === 0 && <p className="p-6 text-center text-sm text-[var(--text-muted)]">Nenhuma conta encontrada.</p>}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-sm">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="font-bold text-[var(--accent)] disabled:opacity-40">
                ← Anterior
              </button>
              <span className="text-[var(--text-muted)]">
                {page + 1} de {pages}
              </span>
              <button disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="font-bold text-[var(--accent)] disabled:opacity-40">
                Próxima →
              </button>
            </div>
          )}
        </Card>

        {/* detalhe: coluna fixa no PC, tela cheia por cima no celular */}
        {selected != null && (
          <>
            <Card className="sticky top-8 hidden max-h-[calc(100dvh-4rem)] overflow-y-auto lg:block">
              <UserDetail id={selected} onClose={() => setSelected(null)} />
            </Card>
            <div className="fixed inset-0 z-30 overflow-y-auto bg-[var(--bg)] p-4 pt-[max(1rem,env(safe-area-inset-top))] lg:hidden">
              <UserDetail id={selected} onClose={() => setSelected(null)} />
            </div>
          </>
        )}
        {selected == null && (
          <Card className="hidden h-fit text-sm text-[var(--text-muted)] lg:block">Escolha uma conta na lista pra ver detalhes, notas e ações.</Card>
        )}
      </div>
    </div>
  )
}

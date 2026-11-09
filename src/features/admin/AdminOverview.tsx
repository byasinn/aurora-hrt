import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'
import { useAdminStats } from '../../api/adminPanel'

function Kpi({ label, value, hint, to, alert }: { label: string; value: number | string | undefined; hint?: string; to?: string; alert?: boolean }) {
  const body = (
    <Card className={alert ? 'border-red-500/50' : undefined}>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={alert ? 'mt-1 text-3xl font-extrabold text-red-500' : 'mt-1 text-3xl font-extrabold text-[var(--text)]'}>{value ?? '–'}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>}
    </Card>
  )
  return to ? (
    <Link to={to} className="block transition hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  )
}

/** Cadastros por dia nos últimos 30 dias (barras simples em SVG, sem biblioteca). */
function SignupsChart({ data }: { data: { day: string; value: number }[] }) {
  // preenche os dias sem cadastro com zero, pra barra não "pular" dia
  const days: { day: string; value: number }[] = []
  const byDay = new Map(data.map((d) => [d.day, d.value]))
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    days.push({ day: d, value: byDay.get(d) ?? 0 })
  }
  const max = Math.max(1, ...days.map((d) => d.value))
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]">
        {days.map((d) => (
          <div key={d.day} className="group relative flex-1" style={{ height: '100%' }}>
            <div className="absolute bottom-0 w-full rounded-t bg-[var(--accent)]" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0 }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] group-hover:block">
              {d.day.slice(8)}/{d.day.slice(5, 7)}: {d.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--text-muted)]">
        <span>
          {days[0].day.slice(8)}/{days[0].day.slice(5, 7)}
        </span>
        <span>hoje</span>
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const { data: s, isLoading } = useAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Visão geral</h1>
        <p className="text-sm text-[var(--text-muted)]">Atualiza sozinho a cada minuto.</p>
      </div>
      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando…</p>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Denúncias pendentes" value={s?.pendingReports} to="/admin/denuncias" alert={!!s?.pendingReports} />
        <Kpi label="Imagens barradas" value={s?.pendingQuarantine} hint="esperando revisão" to="/admin/quarentena" alert={!!s?.pendingQuarantine} />
        <Kpi label="Contas" value={s?.totalUsers} hint={s ? `${s.bannedUsers} banida(s)` : undefined} to="/admin/usuarios" />
        <Kpi label="Ativas hoje" value={s?.activeToday} hint="registraram humor ou dose em 24h" />
        <Kpi label="Novas (24h)" value={s?.newUsers.day} />
        <Kpi label="Novas (7 dias)" value={s?.newUsers.week} />
        <Kpi label="Novas (30 dias)" value={s?.newUsers.month} />
        <Kpi label="Posts (24h / 7d)" value={s ? `${s.posts.day} / ${s.posts.week}` : undefined} to="/admin/conteudo" />
      </section>

      {s && (
        <Card>
          <p className="mb-3 font-bold">Cadastros por dia (30 dias)</p>
          <SignupsChart data={s.signupsByDay} />
          <p className="mt-2 text-xs text-[var(--text-muted)]">{s.loginsWeek} conta(s) fizeram login nos últimos 7 dias.</p>
        </Card>
      )}
    </div>
  )
}

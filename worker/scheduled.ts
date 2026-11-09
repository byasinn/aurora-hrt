import { and, eq, gt, gte, inArray, lt } from 'drizzle-orm'
import { getDb } from './shared/db'
import { doseLogs, medications, profile, pushSubscriptions, rateLimitHits, sessions } from '../shared/schema'
import {
  dueMedicationsForDate,
  dateStrInTimezone,
  DOSE_FOLLOWUP_AFTER_MINUTES,
  DOSE_MISSED_AFTER_HOURS,
} from '../shared/scheduling'
import { wantsNotification } from '../shared/genders'
import { sendPushToSubscriptions, deleteExpiredSubscriptions, type PushPayload } from './shared/push'
import type { Env } from './env'

const WINDOW_MS = 15 * 60_000 // intervalo do cron (wrangler.toml [triggers])
const FOLLOWUP_AFTER_MS = DOSE_FOLLOWUP_AFTER_MINUTES * 60_000
const MISSED_AFTER_MS = DOSE_MISSED_AFTER_HOURS * 3_600_000
// Até onde o cron volta procurando dose sem registro pra marcar como perdida — cobre execuções
// puladas do cron, mas nunca reescreve histórico antigo (que pode ter sido preenchido à mão).
const MISSED_LOOKBACK_MS = 36 * 3_600_000
const REMINDER_TTL_SECONDS = 30 * 60
const INSERT_CHUNK = 500
const PUSH_CONCURRENCY = 20

type Medication = typeof medications.$inferSelect

interface PendingPush {
  userId: number
  payload: PushPayload
}

/**
 * Roda a cada 15min — lembretes de dose, o "Você tomou?" de quem não marcou e a marcação automática
 * de dose perdida.
 *
 * Tudo é carregado em lote (poucas consultas no total, não por usuário): cada consulta ao Neon pelo
 * driver HTTP conta como subrequest do Worker, e a versão antiga fazia 2 por pessoa com push ativo —
 * com algumas centenas de pessoas isso já estourava o limite por execução e os lembretes paravam
 * de sair sem erro nenhum aparente.
 */
export async function runScheduledReminders(env: Env): Promise<void> {
  const db = getDb(env)
  const now = new Date()

  await Promise.all([
    db.delete(rateLimitHits).where(lt(rateLimitHits.createdAt, new Date(now.getTime() - 24 * 3_600_000))),
    db.delete(sessions).where(lt(sessions.expiresAt, now)),
  ])

  // Só quem tem sessão válida — conta abandonada não precisa de lembrete nem de dose marcada como
  // perdida todo dia pra sempre.
  const activeUserRows = await db.selectDistinct({ userId: sessions.userId }).from(sessions).where(gt(sessions.expiresAt, now))
  const activeUserIds = activeUserRows.map((r) => r.userId)
  if (activeUserIds.length === 0) return

  const [meds, profiles, subs] = await Promise.all([
    db
      .select()
      .from(medications)
      .where(and(inArray(medications.userId, activeUserIds), eq(medications.active, true))),
    db
      .select({ userId: profile.userId, timezone: profile.timezone, notificationPrefs: profile.notificationPrefs })
      .from(profile)
      .where(inArray(profile.userId, activeUserIds)),
    db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, activeUserIds)),
  ])
  if (meds.length === 0) return

  const logs = await db
    .select({ medicationId: doseLogs.medicationId, scheduledFor: doseLogs.scheduledFor })
    .from(doseLogs)
    .where(
      and(
        inArray(
          doseLogs.medicationId,
          meds.map((m) => m.id),
        ),
        gte(doseLogs.scheduledFor, new Date(now.getTime() - MISSED_LOOKBACK_MS - 86_400_000)),
      ),
    )
  const loggedSlots = new Set(logs.map((l) => slotKey(l.medicationId, l.scheduledFor)))

  const timezoneByUser = new Map(profiles.map((p) => [p.userId, p.timezone]))
  const prefsByUser = new Map(profiles.map((p) => [p.userId, p.notificationPrefs]))
  const medsByUser = new Map<number, Medication[]>()
  for (const med of meds) {
    if (med.userId == null) continue
    const list = medsByUser.get(med.userId) ?? []
    list.push(med)
    medsByUser.set(med.userId, list)
  }

  const pushes: PendingPush[] = []
  const missedRows: (typeof doseLogs.$inferInsert)[] = []

  for (const [userId, userMeds] of medsByUser) {
    const timeZone = timezoneByUser.get(userId) ?? 'America/Sao_Paulo'
    // ontem também — o "perdida" das doses da noite cai depois da meia-noite
    const dates = new Set([dateStrInTimezone(now, timeZone), dateStrInTimezone(new Date(now.getTime() - 86_400_000), timeZone)])

    for (const dateStr of dates) {
      for (const { medication, scheduledFor } of dueMedicationsForDate(userMeds, dateStr, timeZone)) {
        if (loggedSlots.has(slotKey(medication.id, scheduledFor))) continue
        const elapsed = now.getTime() - scheduledFor.getTime()
        const dose = `${medication.name} — ${medication.doseAmount}${medication.doseUnit}`

        // o lembrete do remédio liga/desliga por remédio; as preferências de notificação valem pra todos
        const prefs = prefsByUser.get(userId)
        if (medication.remindersEnabled && wantsNotification(prefs, 'doseReminders') && elapsed >= 0 && elapsed < WINDOW_MS) {
          pushes.push({
            userId,
            payload: { title: 'Hora do medicamento', body: dose, url: '/', tag: `dose-${medication.id}` },
          })
        } else if (medication.remindersEnabled && wantsNotification(prefs, 'doseFollowup') && elapsed >= FOLLOWUP_AFTER_MS && elapsed < FOLLOWUP_AFTER_MS + WINDOW_MS) {
          pushes.push({
            userId,
            payload: {
              title: 'Você tomou?',
              body: `${dose} ainda não foi marcado hoje.`,
              url: '/',
              tag: `dose-${medication.id}`,
              actions: [
                { action: 'dose-taken', title: 'Tomei' },
                { action: 'dose-skipped', title: 'Pulei hoje' },
              ],
              data: { medicationId: medication.id, scheduledFor: scheduledFor.toISOString() },
            },
          })
        } else if (
          elapsed >= MISSED_AFTER_MS &&
          elapsed < MISSED_LOOKBACK_MS &&
          // remédio cadastrado hoje com horário que já tinha passado não conta como dose perdida
          scheduledFor.getTime() > medication.createdAt.getTime()
        ) {
          missedRows.push({ userId, medicationId: medication.id, scheduledFor, status: 'missed' })
        }
      }
    }
  }

  for (let i = 0; i < missedRows.length; i += INSERT_CHUNK) {
    await db.insert(doseLogs).values(missedRows.slice(i, i + INSERT_CHUNK))
  }

  const subsByUser = new Map<number, typeof subs>()
  for (const sub of subs) {
    if (sub.userId == null) continue
    const list = subsByUser.get(sub.userId) ?? []
    list.push(sub)
    subsByUser.set(sub.userId, list)
  }

  const deliverable = pushes.filter((p) => subsByUser.has(p.userId))
  const expired: number[] = []
  for (let i = 0; i < deliverable.length; i += PUSH_CONCURRENCY) {
    const batch = deliverable.slice(i, i + PUSH_CONCURRENCY)
    const results = await Promise.all(
      batch.map((p) => sendPushToSubscriptions(env, subsByUser.get(p.userId) ?? [], p.payload, REMINDER_TTL_SECONDS)),
    )
    expired.push(...results.flat())
  }
  await deleteExpiredSubscriptions(db, expired)

  console.log(
    `scheduled-reminders: ${deliverable.length} push(es), ${missedRows.length} dose(s) marcada(s) como perdida, ${medsByUser.size} usuário(s) com remédio ativo`,
  )
}

function slotKey(medicationId: number, scheduledFor: Date): string {
  return `${medicationId}:${new Date(scheduledFor).getTime()}`
}

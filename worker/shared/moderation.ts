import { moderationLog } from '../../shared/schema'
import type { getDb } from './db'

/** Registra uma ação de moderação (admin apagando conteúdo de outra conta) com um retrato do que foi removido. */
export async function logModerationAction(
  db: ReturnType<typeof getDb>,
  actorId: number,
  action: string,
  targetUserId: number | null,
  snapshot: Record<string, unknown>,
): Promise<void> {
  await db.insert(moderationLog).values({ actorId, action, targetUserId, snapshot })
}

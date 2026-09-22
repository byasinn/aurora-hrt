import { and, eq, or } from 'drizzle-orm'
import { blocks } from '../../shared/schema'
import type { getDb } from './db'

/** true se A bloqueou B OU B bloqueou A — qualquer direção impede interação. */
export async function hasBlockRelation(db: ReturnType<typeof getDb>, userA: number, userB: number): Promise<boolean> {
  const [row] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, userA), eq(blocks.blockedId, userB)),
        and(eq(blocks.blockerId, userB), eq(blocks.blockedId, userA)),
      ),
    )
    .limit(1)
  return !!row
}

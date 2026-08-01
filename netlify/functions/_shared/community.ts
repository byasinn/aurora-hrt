import { eq, and } from 'drizzle-orm'
import { communities, communityMembers } from '../../../shared/schema'
import type { getDb } from './db'

const DEFAULT_COMMUNITY_NAME = 'AuroraApp Irmãs'

/** V1: só existe uma comunidade — cria sob demanda na primeira vez que alguém a acessa. */
export async function getOrCreateDefaultCommunity(db: ReturnType<typeof getDb>) {
  const [existing] = await db.select().from(communities).limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(communities)
    .values({ name: DEFAULT_COMMUNITY_NAME, description: 'A comunidade da Aurora.', icon: 'heart' })
    .returning()
  return created
}

export async function isCommunityMember(
  db: ReturnType<typeof getDb>,
  communityId: number,
  userId: number,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1)
  return !!row
}

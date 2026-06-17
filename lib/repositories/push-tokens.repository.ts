/**
 * PushTokensRepository — PostgreSQL + Drizzle
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { pushTokens } from '@/lib/db/schema';

function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0,8), hex.slice(8,12), '4'+hex.slice(13,16),
    ((parseInt(hex[16],16)&0x3)|0x8).toString(16)+hex.slice(17,20), hex.slice(20,32)].join('-');
}

export const pushTokensRepository = {
  async upsert(data: { userId: string; token: string; platform: 'ios' | 'android' }): Promise<void> {
    const db       = getDb();
    const existing = await db
      .select({ id: pushTokens.id })
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, data.userId), eq(pushTokens.token, data.token)));

    if (!existing[0]) {
      await db.insert(pushTokens).values({
        id:       generateId(),
        userId:   data.userId,
        token:    data.token,
        platform: data.platform,
      });
    }
  },
};

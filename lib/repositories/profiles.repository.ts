/**
 * ProfilesRepository — PostgreSQL + Drizzle
 */

import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';

export const profilesRepository = {
  async findById(id: string) {
    const rows = await getDb().select().from(profiles).where(eq(profiles.id, id));
    return rows[0] ?? null;
  },

  async update(id: string, data: Partial<typeof profiles.$inferInsert>): Promise<void> {
    await getDb()
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, id));
  },
};

/**
 * ProviderServicesRepository — PostgreSQL + Drizzle
 */

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { providerServices } from '@/lib/db/schema';

export const providerServicesRepository = {
  async findByProviderId(providerId: string) {
    return getDb()
      .select()
      .from(providerServices)
      .where(eq(providerServices.providerId, providerId))
      .orderBy(desc(providerServices.createdAt));
  },

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    await getDb()
      .update(providerServices)
      .set({ status, updatedAt: new Date() })
      .where(eq(providerServices.id, id));
  },
};

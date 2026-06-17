/**
 * PublicServicesRepository — PostgreSQL + Drizzle
 */

import { eq, and, ilike } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { providerServices, providers, promotions, providerAvailability } from '@/lib/db/schema';

export const publicServicesRepository = {
  async findActive(search?: string) {
    const db = getDb();

    const rows = await db
      .select({
        id: providerServices.id, name: providerServices.name,
        description: providerServices.description, price: providerServices.price,
        capacity: providerServices.capacity, scheduleStart: providerServices.scheduleStart,
        scheduleEnd: providerServices.scheduleEnd, moduleType: providerServices.moduleType,
        photoUrls: providerServices.photoUrls, status: providerServices.status,
        providerId: providers.id, providerBusinessName: providers.businessName,
        providerStatus: providers.status,
      })
      .from(providerServices)
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .where(
        and(
          eq(providerServices.status, 'active'),
          eq(providers.status, 'approved'),
          search?.trim() ? ilike(providerServices.name, `%${search.trim()}%`) : undefined,
        ),
      );

    return Promise.all(
      rows.map(async (s) => {
        const promos = await db
          .select({ discountPercent: promotions.discountPercent, status: promotions.status })
          .from(promotions)
          .where(and(eq(promotions.serviceId, s.id), eq(promotions.status, 'active')));

        return {
          id: s.id, name: s.name, description: s.description, price: s.price,
          capacity: s.capacity, schedule_start: s.scheduleStart, schedule_end: s.scheduleEnd,
          module_type: s.moduleType, status: s.status,
          photo_urls: (() => { try { return JSON.parse(s.photoUrls ?? '[]'); } catch { return []; } })(),
          providers: { id: s.providerId, business_name: s.providerBusinessName, status: s.providerStatus },
          promotions: promos.map((p) => ({ discount_percent: p.discountPercent, status: p.status })),
        };
      }),
    );
  },

  async findById(id: string) {
    const db   = getDb();
    const rows = await db
      .select({
        id: providerServices.id, name: providerServices.name,
        description: providerServices.description, price: providerServices.price,
        capacity: providerServices.capacity, scheduleStart: providerServices.scheduleStart,
        scheduleEnd: providerServices.scheduleEnd, moduleType: providerServices.moduleType,
        photoUrls: providerServices.photoUrls, status: providerServices.status,
        providerId: providers.id, providerBusinessName: providers.businessName,
        providerStatus: providers.status,
      })
      .from(providerServices)
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .where(eq(providerServices.id, id));

    const row = rows[0];
    if (!row) return null;

    const [promos, blocked] = await Promise.all([
      db.select({ discountPercent: promotions.discountPercent, status: promotions.status })
        .from(promotions).where(eq(promotions.serviceId, id)),
      db.select({ blockedDate: providerAvailability.blockedDate })
        .from(providerAvailability).where(eq(providerAvailability.serviceId, id)),
    ]);

    return {
      id: row.id, name: row.name, description: row.description, price: row.price,
      capacity: row.capacity, schedule_start: row.scheduleStart, schedule_end: row.scheduleEnd,
      module_type: row.moduleType, status: row.status,
      photo_urls: (() => { try { return JSON.parse(row.photoUrls ?? '[]'); } catch { return []; } })(),
      providers: { id: row.providerId, business_name: row.providerBusinessName, status: row.providerStatus },
      provider_availability: blocked.map((b) => ({ blocked_date: b.blockedDate })),
      promotions: promos.map((p) => ({ discount_percent: p.discountPercent, status: p.status })),
    };
  },
};

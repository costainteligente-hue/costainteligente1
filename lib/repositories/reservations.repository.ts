/**
 * ReservationsRepository — PostgreSQL + Drizzle
 */

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { reservations, providerServices, providers, profiles } from '@/lib/db/schema';

function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0,8), hex.slice(8,12), '4'+hex.slice(13,16),
    ((parseInt(hex[16],16)&0x3)|0x8).toString(16)+hex.slice(17,20), hex.slice(20,32)].join('-');
}

export const reservationsRepository = {
  async findByClientId(clientId: string) {
    const db   = getDb();
    const rows = await db
      .select({
        id: reservations.id, clientId: reservations.clientId,
        serviceId: reservations.serviceId, providerId: reservations.providerId,
        reservationDate: reservations.reservationDate, partySize: reservations.partySize,
        status: reservations.status, rejectionReason: reservations.rejectionReason,
        proposedDate: reservations.proposedDate, paymentStatus: reservations.paymentStatus,
        amount: reservations.amount, createdAt: reservations.createdAt, updatedAt: reservations.updatedAt,
        serviceName: providerServices.name, serviceModuleType: providerServices.moduleType,
        providerBusinessName: providers.businessName,
      })
      .from(reservations)
      .innerJoin(providerServices, eq(reservations.serviceId, providerServices.id))
      .innerJoin(providers, eq(reservations.providerId, providers.id))
      .where(eq(reservations.clientId, clientId))
      .orderBy(desc(reservations.createdAt));

    return rows.map((r) => ({
      ...r,
      provider_services: { name: r.serviceName, module_type: r.serviceModuleType },
      providers:         { business_name: r.providerBusinessName },
    }));
  },

  async findByProviderId(providerId: string) {
    const db   = getDb();
    const rows = await db
      .select({
        id: reservations.id, clientId: reservations.clientId,
        serviceId: reservations.serviceId, providerId: reservations.providerId,
        reservationDate: reservations.reservationDate, partySize: reservations.partySize,
        status: reservations.status, rejectionReason: reservations.rejectionReason,
        proposedDate: reservations.proposedDate, paymentStatus: reservations.paymentStatus,
        amount: reservations.amount, createdAt: reservations.createdAt, updatedAt: reservations.updatedAt,
        serviceName: providerServices.name, clientFullName: profiles.fullName,
      })
      .from(reservations)
      .innerJoin(providerServices, eq(reservations.serviceId, providerServices.id))
      .innerJoin(profiles, eq(reservations.clientId, profiles.id))
      .where(eq(reservations.providerId, providerId))
      .orderBy(desc(reservations.createdAt));

    return rows.map((r) => ({
      ...r,
      provider_services: { name: r.serviceName },
      profiles:          { full_name: r.clientFullName },
    }));
  },

  async create(data: {
    clientId: string; serviceId: string; providerId: string;
    reservationDate: string; partySize: number; amount: number;
  }) {
    const db = getDb();
    const id = generateId();
    await db.insert(reservations).values({
      id, clientId: data.clientId, serviceId: data.serviceId,
      providerId: data.providerId, reservationDate: data.reservationDate,
      partySize: data.partySize, amount: data.amount,
      status: 'pending', paymentStatus: 'pending',
    });
    const rows = await db.select().from(reservations).where(eq(reservations.id, id));
    return rows[0];
  },

  async updateStatus(
    id: string,
    status: 'pending'|'confirmed'|'rejected'|'rescheduled'|'completed'|'cancelled',
    extra?: { rejectionReason?: string; proposedDate?: string },
  ) {
    await getDb()
      .update(reservations)
      .set({ status, rejectionReason: extra?.rejectionReason, proposedDate: extra?.proposedDate, updatedAt: new Date() })
      .where(eq(reservations.id, id));
  },
};

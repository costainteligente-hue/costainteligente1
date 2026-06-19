/**
 * AdminProvidersRepository — PostgreSQL + Drizzle
 * Lista y gestiona proveedores reales para el panel de admin
 */
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { providers, profiles, users } from '@/lib/db/schema';

export interface AdminProvider {
  id: string;
  businessName: string;
  serviceType: string;
  rfc: string;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  registeredAt: string;
  email: string;
  ownerName: string | null;
}

export const adminProvidersRepository = {
  async findAll(): Promise<AdminProvider[]> {
    const db = getDb();
    const rows = await db
      .select({
        id:              providers.id,
        businessName:    providers.businessName,
        serviceType:     providers.serviceType,
        rfc:             providers.rfc,
        phone:           providers.phone,
        address:         providers.address,
        status:          providers.status,
        rejectionReason: providers.rejectionReason,
        createdAt:       providers.createdAt,
        email:           users.email,
        ownerName:       profiles.fullName,
      })
      .from(providers)
      .innerJoin(profiles, eq(providers.userId, profiles.id))
      .innerJoin(users, eq(profiles.id, users.id))
      .orderBy(desc(providers.createdAt));

    return rows.map((r) => ({
      id:              r.id,
      businessName:    r.businessName,
      serviceType:     r.serviceType,
      rfc:             r.rfc,
      phone:           r.phone,
      address:         r.address,
      status:          r.status,
      rejectionReason: r.rejectionReason,
      email:           r.email,
      ownerName:       r.ownerName,
      registeredAt:    r.createdAt instanceof Date
        ? r.createdAt.toLocaleDateString('es-MX')
        : String(r.createdAt ?? ''),
    }));
  },

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ): Promise<void> {
    await getDb()
      .update(providers)
      .set({ status, rejectionReason: rejectionReason ?? null, updatedAt: new Date() })
      .where(eq(providers.id, id));
  },
};

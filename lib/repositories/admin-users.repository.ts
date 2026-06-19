/**
 * AdminUsersRepository — PostgreSQL + Drizzle
 * Lista todos los usuarios reales de la app (clientes + proveedores)
 */

import { eq, ilike, or, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { profiles, users } from '@/lib/db/schema';

export interface AdminUser {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: 'active' | 'suspended' | 'blocked';
  registeredAt: string;
}

export const adminUsersRepository = {
  async findAll(search?: string): Promise<AdminUser[]> {
    const db = getDb();

    const rows = await db
      .select({
        id:        profiles.id,
        fullName:  profiles.fullName,
        phone:     profiles.phone,
        role:      profiles.role,
        createdAt: profiles.createdAt,
        email:     users.email,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.id, users.id))
      .orderBy(desc(profiles.createdAt));

    let result = rows.map((r) => ({
      id:           r.id,
      fullName:     r.fullName,
      email:        r.email,
      phone:        r.phone,
      role:         r.role,
      status:       'active' as const,   // campo de suspensión: ampliar cuando exista en schema
      registeredAt: r.createdAt instanceof Date
        ? r.createdAt.toLocaleDateString('es-MX')
        : String(r.createdAt ?? ''),
    }));

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone?.includes(q),
      );
    }

    return result;
  },
};

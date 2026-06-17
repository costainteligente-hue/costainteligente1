/**
 * CommunityRepository — PostgreSQL + Drizzle
 */

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { communityPosts, profiles, species, fishingZones } from '@/lib/db/schema';

const PAGE_SIZE = 20;

export const communityRepository = {
  async findPaginated(offset = 0) {
    const db   = getDb();
    const rows = await db
      .select({
        id: communityPosts.id, userId: communityPosts.userId,
        speciesId: communityPosts.speciesId, zoneId: communityPosts.zoneId,
        photoUrls: communityPosts.photoUrls, weightKg: communityPosts.weightKg,
        catchDate: communityPosts.catchDate, createdAt: communityPosts.createdAt,
        authorFullName: profiles.fullName, authorAvatarUrl: profiles.avatarUrl,
        speciesName: species.name, zoneName: fishingZones.name,
      })
      .from(communityPosts)
      .innerJoin(profiles,      eq(communityPosts.userId,    profiles.id))
      .leftJoin(species,        eq(communityPosts.speciesId, species.id))
      .leftJoin(fishingZones,   eq(communityPosts.zoneId,    fishingZones.id))
      .orderBy(desc(communityPosts.catchDate))
      .limit(PAGE_SIZE)
      .offset(offset);

    return rows.map((r) => ({
      id: r.id, user_id: r.userId, species_id: r.speciesId, zone_id: r.zoneId,
      photo_urls: (() => { try { return JSON.parse(r.photoUrls ?? '[]'); } catch { return []; } })(),
      weight_kg: r.weightKg, catch_date: r.catchDate,
      created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      profiles:      { full_name: r.authorFullName, avatar_url: r.authorAvatarUrl },
      species:       r.speciesName ? { name: r.speciesName } : null,
      fishing_zones: r.zoneName   ? { name: r.zoneName   } : null,
    }));
  },

  async deleteById(postId: string): Promise<void> {
    await getDb().delete(communityPosts).where(eq(communityPosts.id, postId));
  },
};

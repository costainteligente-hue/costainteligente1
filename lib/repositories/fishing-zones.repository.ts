/**
 * FishingZonesRepository — PostgreSQL + Drizzle
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { fishingZones, zoneFish, species, zoneReviews, profiles } from '@/lib/db/schema';

function parseArr(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export const fishingZonesRepository = {
  async findAllActive(level?: 'principiante' | 'intermedio' | 'avanzado') {
    const db = getDb();
    const zones = await db
      .select()
      .from(fishingZones)
      .where(
        level
          ? and(eq(fishingZones.isActive, true), eq(fishingZones.level, level))
          : eq(fishingZones.isActive, true),
      );

    const result = await Promise.all(
      zones.map(async (zone) => {
        const fish = await db
          .select({
            speciesId:       zoneFish.speciesId,
            probability:     zoneFish.probability,
            speciesName:     species.name,
            speciesLocalName: species.localName,
          })
          .from(zoneFish)
          .innerJoin(species, eq(zoneFish.speciesId, species.id))
          .where(eq(zoneFish.zoneId, zone.id));

        return {
          ...zone,
          lures:     parseArr(zone.lures),
          baits:     parseArr(zone.baits),
          photoUrls: parseArr(zone.photoUrls),
          zone_fish: fish.map((f) => ({
            species_id:  f.speciesId,
            probability: f.probability,
            species:     { name: f.speciesName, local_name: f.speciesLocalName },
          })),
        };
      }),
    );

    return result.sort((a, b) => a.name.localeCompare(b.name));
  },

  async findById(zoneId: string) {
    const db = getDb();
    const zones = await db.select().from(fishingZones).where(eq(fishingZones.id, zoneId));
    const zone  = zones[0];
    if (!zone) return null;

    const [fish, reviews] = await Promise.all([
      db.select({
        speciesId:        zoneFish.speciesId,
        probability:      zoneFish.probability,
        speciesName:      species.name,
        speciesLocalName: species.localName,
        speciesImageUrl:  species.imageUrl,
      })
      .from(zoneFish)
      .innerJoin(species, eq(zoneFish.speciesId, species.id))
      .where(eq(zoneFish.zoneId, zoneId)),

      db.select({
        id:        zoneReviews.id,
        rating:    zoneReviews.rating,
        comment:   zoneReviews.comment,
        createdAt: zoneReviews.createdAt,
        fullName:  profiles.fullName,
      })
      .from(zoneReviews)
      .innerJoin(profiles, eq(zoneReviews.userId, profiles.id))
      .where(eq(zoneReviews.zoneId, zoneId)),
    ]);

    return {
      ...zone,
      lures:     parseArr(zone.lures),
      baits:     parseArr(zone.baits),
      photoUrls: parseArr(zone.photoUrls),
      zone_fish: fish.map((f) => ({
        species_id:  f.speciesId,
        probability: f.probability,
        species: { name: f.speciesName, local_name: f.speciesLocalName, image_url: f.speciesImageUrl },
      })),
      zone_reviews: reviews.map((r) => ({
        id:         r.id,
        rating:     r.rating,
        comment:    r.comment,
        created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        profiles:   { full_name: r.fullName },
      })),
    };
  },
};

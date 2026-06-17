/**
 * SeasonsRepository — PostgreSQL + Drizzle
 */

import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { monthlySeasons, species } from '@/lib/db/schema';

export const seasonsRepository = {
  async findByMonth(month: number) {
    const db   = getDb();
    const rows = await db
      .select({
        id: monthlySeasons.id, month: monthlySeasons.month,
        speciesId: monthlySeasons.speciesId, probability: monthlySeasons.probability,
        suggestedZoneIds: monthlySeasons.suggestedZoneIds,
        vedaStart: monthlySeasons.vedaStart, vedaEnd: monthlySeasons.vedaEnd,
        speciesName: species.name, speciesLocalName: species.localName, speciesImageUrl: species.imageUrl,
      })
      .from(monthlySeasons)
      .innerJoin(species, eq(monthlySeasons.speciesId, species.id))
      .where(eq(monthlySeasons.month, month));

    return rows.map((r) => ({
      id: r.id, month: r.month, species_id: r.speciesId, probability: r.probability,
      suggested_zone_ids: (() => { try { return JSON.parse(r.suggestedZoneIds ?? '[]'); } catch { return []; } })(),
      veda_start: r.vedaStart, veda_end: r.vedaEnd,
      species: { name: r.speciesName, local_name: r.speciesLocalName, image_url: r.speciesImageUrl },
    }));
  },
};

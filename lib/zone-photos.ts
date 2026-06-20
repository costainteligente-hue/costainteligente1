/**
 * zone-photos.ts — Costa Inteligente
 * Mapea cada zona/playa a sus imágenes locales en assets/images/zones/
 * Usar con require() para que el bundler de Expo las incluya en el build.
 */

export interface ZonePhoto {
  key: string;        // identificador interno
  zone: string;       // nombre de la zona/playa
  region: string;     // estado / municipio
  image: any;         // require() de la imagen
}

// ─── Zihuatanejo-Ixtapa ───────────────────────────────────────────────────────
export const ZONE_PHOTOS: ZonePhoto[] = [
  // Playa La Ropa
  { key: 'playa_la_ropa',       zone: 'Playa La Ropa',          region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/playa_la_ropa.jpg') },
  // Playa Las Gatas
  { key: 'playa_las_gatas',     zone: 'Playa Las Gatas',        region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/playa_las_gatas.jpg') },
  // Playa La Madera
  { key: 'playa_la_madera',     zone: 'Playa La Madera',        region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/playa_la_madera.jpg') },
  // Playa Principal / Muelle
  { key: 'playa_principal',     zone: 'Playa Principal',        region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/playa_principal.jpg') },
  { key: 'muelle_zihuatanejo',  zone: 'Muelle Zihuatanejo',     region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/muelle_zihuatanejo.jpg') },
  // Playa Larga
  { key: 'playa_larga',         zone: 'Playa Larga',            region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/playa_larga_blanca.jpg') },
  // Playa Contramar
  { key: 'playa_contramar',     zone: 'Playa Contramar',        region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/playa_contramar.jpg') },
  // Majahua / Chololo
  { key: 'playa_majahua',       zone: 'Playa Majahua',          region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/chololo_majahua.jpg') },
  // Ixtapa - Escolleras
  { key: 'escolleras_ixtapa',   zone: 'Escolleras Ixtapa',      region: 'Ixtapa',           image: require('@/assets/images/zones/zihuatanejo/escolleras_ixtapa.jpg') },
  // Ixtapa - Las Brisas
  { key: 'las_brisas_ixtapa',   zone: 'Playa Las Brisas',       region: 'Ixtapa',           image: require('@/assets/images/zones/zihuatanejo/las_brisas_ixtapa.jpg') },
  // Playa Linda (Embarcadero)
  { key: 'muelle_playa_linda',  zone: 'Playa Linda',            region: 'Ixtapa',           image: require('@/assets/images/zones/zihuatanejo/muelle_playa_linda.jpg') },
  // Camino Las Gatas
  { key: 'camino_las_gatas',    zone: 'Camino Las Gatas',       region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/camino_las_gatas.jpg') },
  // Paseo del Pescador
  { key: 'paseo_pescador',      zone: 'Paseo del Pescador',     region: 'Zihuatanejo',      image: require('@/assets/images/zones/zihuatanejo/paseo_del_pescador.jpg') },

  // ─── Troncones ──────────────────────────────────────────────────────────────
  { key: 'troncones_1',         zone: 'Troncones',              region: 'Troncones',        image: require('@/assets/images/zones/troncones/troncones-ixtapa-zihuatanejo.jpg') },
  { key: 'troncones_2',         zone: 'Troncones',              region: 'Troncones',        image: require('@/assets/images/zones/troncones/troncones2.jpg') },

  // ─── Petatlán ──────────────────────────────────────────────────────────────
  { key: 'barra_potosi',        zone: 'Barra de Potosí',        region: 'Petatlán',         image: require('@/assets/images/zones/petatlan/barra-de-potosi.jpg') },
  { key: 'playa_barrita',       zone: 'Playa La Barrita',       region: 'Petatlán',         image: require('@/assets/images/zones/petatlan/playa-la-barrita.jpg') },

  // ─── Bahía de Petacalco ────────────────────────────────────────────────────
  { key: 'petacalco_1',         zone: 'Bahía de Petacalco',     region: 'Petacalco',        image: require('@/assets/images/zones/petacalco/bahia-de-petacalco.webp') },

  // ─── Acapulco ─────────────────────────────────────────────────────────────
  { key: 'acapulco_1',          zone: 'Acapulco',               region: 'Acapulco',         image: require('@/assets/images/zones/acapulco/20170326-085209-largejpg.jpg') },
  { key: 'acapulco_pesca',      zone: 'Pesca Acapulco',         region: 'Acapulco',         image: require('@/assets/images/zones/acapulco/pescadores-acapulco-3.webp') },

  // ─── Lázaro Cárdenas ──────────────────────────────────────────────────────
  { key: 'caleta_campos_1',     zone: 'Caleta de Campos',       region: 'Lázaro Cárdenas', image: require('@/assets/images/zones/caleta-de-campos/caleta-de-campos-gallery-01-ofwp6n.jpg') },
  { key: 'caleta_campos_2',     zone: 'Caleta de Campos',       region: 'Lázaro Cárdenas', image: require('@/assets/images/zones/caleta-de-campos/caleta-de-campos-gallery-05-1puqzh.jpg') },
  { key: 'playa_azul_1',        zone: 'Playa Azul',             region: 'Lázaro Cárdenas', image: require('@/assets/images/zones/playa-azul/Playa-Azul-Michoacán-900x500.jpg') },
  { key: 'nexpa_1',             zone: 'Playa Nexpa',            region: 'Lázaro Cárdenas', image: require('@/assets/images/zones/nexpa/nexpa-beach.jpg') },
  { key: 'nexpa_2',             zone: 'Playa Nexpa',            region: 'Lázaro Cárdenas', image: require('@/assets/images/zones/nexpa/nexpa-gallery-03-rc0pis.jpg') },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve la primera foto de una zona por nombre (búsqueda parcial, case-insensitive) */
export function getZonePhoto(zoneName: string): any | null {
  const q = zoneName.toLowerCase().replace(/[áéíóúü]/g, (c) =>
    ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c),
  );
  const match = ZONE_PHOTOS.find((p) => {
    const z = p.zone.toLowerCase().replace(/[áéíóúü]/g, (c) =>
      ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c),
    );
    return z.includes(q) || q.includes(z.split(' ')[0]);
  });
  return match?.image ?? null;
}

/** Devuelve todas las fotos de una zona/región */
export function getZonePhotos(zoneName: string): any[] {
  const q = zoneName.toLowerCase().replace(/[áéíóúü]/g, (c) =>
    ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c),
  );
  return ZONE_PHOTOS
    .filter((p) => {
      const z = (p.zone + ' ' + p.region).toLowerCase().replace(/[áéíóúü]/g, (c) =>
        ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c),
      );
      return z.includes(q) || q.includes(z.split(' ')[0]);
    })
    .map((p) => p.image);
}

/**
 * Mapeo directo por id de zona del mapa (SEED_ZONES en map.tsx)
 * Clave = id de zona, valor = imagen local
 */
export const ZONE_ID_TO_PHOTO: Record<string, any> = {
  z1:  require('@/assets/images/zones/zihuatanejo/muelle_zihuatanejo.jpg'),      // Bajo de Chila (offshore)
  z2:  require('@/assets/images/zones/zihuatanejo/playa_la_ropa.jpg'),           // Playa La Ropa
  z3:  require('@/assets/images/zones/zihuatanejo/escolleras_ixtapa.jpg'),       // Punta Ixtapa
  z4:  require('@/assets/images/zones/zihuatanejo/playa_principal.jpg'),         // Bahía de Zihuatanejo
  z5:  require('@/assets/images/zones/petatlan/barra-de-potosi.jpg'),            // Morro de Petatlán
  z6:  require('@/assets/images/zones/zihuatanejo/playa_las_gatas.jpg'),         // Playa Las Gatas
  z7:  require('@/assets/images/zones/zihuatanejo/playa_larga_blanca.jpg'),      // Playa Larga
  z8:  require('@/assets/images/zones/zihuatanejo/las_brisas_ixtapa.jpg'),       // Playa Quieta
  z9:  require('@/assets/images/zones/zihuatanejo/escolleras_ixtapa.jpg'),       // Isla Ixtapa
  z10: require('@/assets/images/zones/zihuatanejo/muelle_playa_linda.jpg'),      // Playa Linda
  z11: require('@/assets/images/zones/zihuatanejo/chololo_majahua.jpg'),         // Playa Majahua
  z12: require('@/assets/images/zones/petatlan/barra-de-potosi-petatlan-guerrero-.jpg'), // Banco de Papanoa
  z13: require('@/assets/images/zones/petatlan/playa-la-barrita.jpg'),           // El Pericón
};

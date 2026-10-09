export interface Holiday {
  date: string;
  name: string;
}

/** Calendrier 2026 publié pour le Maroc. Les fêtes lunaires suivent l’annonce du ministère des Habous et peuvent bouger d’un jour. */
export const MOROCCO_2026: Holiday[] = [
  { date: '2026-01-01', name: 'Jour de l’an' },
  { date: '2026-01-11', name: 'Manifeste de l’Indépendance' },
  { date: '2026-01-14', name: 'Nouvel an amazigh' },
  { date: '2026-03-20', name: 'Aïd al-Fitr' },
  { date: '2026-03-21', name: 'Aïd al-Fitr, 2e jour' },
  { date: '2026-05-01', name: 'Fête du Travail' },
  { date: '2026-05-27', name: 'Aïd al-Adha' },
  { date: '2026-05-28', name: 'Aïd al-Adha, 2e jour' },
  { date: '2026-06-16', name: '1er Moharram' },
  { date: '2026-07-30', name: 'Fête du Trône' },
  { date: '2026-08-14', name: 'Oued Ed-Dahab' },
  { date: '2026-08-20', name: 'Révolution du Roi et du Peuple' },
  { date: '2026-08-21', name: 'Fête de la Jeunesse' },
  { date: '2026-08-25', name: 'Aïd al-Mawlid' },
  { date: '2026-10-31', name: 'Fête de l’Unité' },
  { date: '2026-11-06', name: 'Marche Verte' },
  { date: '2026-11-18', name: 'Fête de l’Indépendance' },
];

export function holidaysFor(year = new Date().getFullYear()) {
  if (year === 2026) return MOROCCO_2026;
  return [];
}

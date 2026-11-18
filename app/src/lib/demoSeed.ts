import { addDays, toDateKey } from '@/lib/date';
import type { Meal } from '@/types/models';

export interface DemoEntry {
  date: string;
  meal: Meal;
  foodId: string;
  grams: number;
}

type Portion = [Meal, string, number]; // meal, common food slug, grams

/** A varied, realistic week of Romanian meals (one list per day). */
const WEEK: Portion[][] = [
  [
    ['breakfast', 'iaurt-grecesc', 170], ['breakfast', 'fulgi-de-ovaz', 50], ['breakfast', 'banana', 120],
    ['lunch', 'ciorba-de-legume', 350], ['lunch', 'piept-de-pui', 150], ['lunch', 'orez-fiert', 150],
    ['dinner', 'somon', 150], ['dinner', 'salata-verde', 100], ['snack', 'mar', 180],
  ],
  [
    ['breakfast', 'omleta', 150], ['breakfast', 'paine-integrala', 60], ['breakfast', 'cafea-cu-lapte', 250],
    ['lunch', 'sarmale', 300], ['lunch', 'smantana', 40], ['lunch', 'mamaliga', 150],
    ['dinner', 'salata-de-vinete', 100], ['dinner', 'paine-alba', 50], ['snack', 'nuci', 30],
  ],
  [
    ['breakfast', 'branza-de-vaci', 150], ['breakfast', 'miere', 15], ['breakfast', 'para', 150],
    ['lunch', 'ciorba-de-perisoare', 350], ['lunch', 'paine-alba', 50],
    ['dinner', 'paste-fierte', 200], ['dinner', 'ton-in-apa', 80], ['dinner', 'rosii', 120],
    ['snack', 'covrig', 80],
  ],
  [
    ['breakfast', 'ou-fiert', 100], ['breakfast', 'paine-integrala', 60], ['breakfast', 'branza-telemea', 50],
    ['lunch', 'fasole-batuta', 200], ['lunch', 'salata-de-varza', 150], ['lunch', 'ceafa-de-porc', 150],
    ['dinner', 'iaurt-natural', 200], ['dinner', 'struguri', 150], ['snack', 'ciocolata-neagra', 25],
  ],
  [
    ['breakfast', 'clatite', 150], ['breakfast', 'dulceata', 30], ['breakfast', 'cafea-cu-lapte', 250],
    ['lunch', 'snitel-de-pui', 150], ['lunch', 'piure-de-cartofi', 200], ['lunch', 'castraveti', 100],
    ['dinner', 'pizza-margherita', 250], ['snack', 'portocala', 200],
  ],
  [
    ['breakfast', 'placinta-cu-branza', 150], ['breakfast', 'chefir', 250],
    ['lunch', 'mici', 200], ['lunch', 'cartofi-prajiti', 150], ['lunch', 'ardei-gras', 100],
    ['dinner', 'zacusca', 80], ['dinner', 'paine-alba', 60], ['snack', 'papanasi', 150],
  ],
  [
    ['breakfast', 'iaurt-grecesc', 170], ['breakfast', 'fulgi-de-ovaz', 40], ['breakfast', 'avocado', 70],
    ['lunch', 'ciorba-de-burta', 350], ['lunch', 'paine-alba', 50],
    ['dinner', 'piept-de-pui', 150], ['dinner', 'cartofi-fierti', 200], ['dinner', 'morcov', 100],
    ['snack', 'cozonac', 70],
  ],
];

/**
 * Demo log for the 7 days ending `today` (today included), using seeded common foods
 * (`common:<slug>`). Deterministic so the demo looks the same each time.
 */
export function demoEntries(today: Date): DemoEntry[] {
  return WEEK.flatMap((portions, i) => {
    const date = toDateKey(addDays(today, i - (WEEK.length - 1)));
    return portions.map(([meal, slug, grams]) => ({ date, meal, foodId: `common:${slug}`, grams }));
  });
}

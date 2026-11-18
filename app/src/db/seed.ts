import type { Food } from '@/types/models';

import { upsertFood } from './foodsRepo';
import type { Db } from './types';

type SeedRow = [
  slug: string,
  name: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  servingName: string,
  servingGrams: number,
];

/** Common foods in Romania. Values per 100 g (approximate, typical preparation). */
const ROWS: SeedRow[] = [
  // Mic dejun, lactate, ouă
  ['ou-fiert', 'Ou fiert', 155, 12.6, 1.1, 10.6, 'bucată', 50],
  ['omleta', 'Omletă', 154, 10.6, 0.6, 11.7, 'porție', 120],
  ['paine-alba', 'Pâine albă', 265, 8.9, 49, 3.2, 'felie', 30],
  ['paine-integrala', 'Pâine integrală', 247, 13, 41, 3.4, 'felie', 35],
  ['branza-telemea', 'Brânză telemea', 264, 17, 1.5, 21, 'porție', 30],
  ['branza-de-vaci', 'Brânză de vaci', 100, 14, 3.5, 4, 'porție', 100],
  ['cascaval', 'Cașcaval', 360, 25, 1, 28, 'felie', 20],
  ['iaurt-grecesc', 'Iaurt grecesc', 129, 5.4, 3.6, 10, 'bol', 150],
  ['iaurt-natural', 'Iaurt natural', 61, 3.5, 4.7, 3.3, 'porție', 140],
  ['lapte-1-5', 'Lapte 1,5%', 46, 3.4, 4.8, 1.5, 'cană', 250],
  ['chefir', 'Chefir', 50, 3.3, 4.4, 2, 'cană', 250],
  ['smantana', 'Smântână 20%', 205, 2.5, 3.5, 20, 'lingură', 15],
  ['unt', 'Unt', 717, 0.9, 0.1, 81, 'porție', 10],
  ['fulgi-de-ovaz', 'Fulgi de ovăz', 379, 13, 67, 6.5, 'porție', 40],
  ['miere', 'Miere', 304, 0.3, 82, 0, 'lingură', 21],
  ['dulceata', 'Dulceață', 250, 0.4, 62, 0.1, 'lingură', 20],
  ['sunca-presata', 'Șuncă presată', 120, 18, 2, 4.5, 'felie', 20],
  ['cafea-cu-lapte', 'Cafea cu lapte', 38, 2.7, 4, 1.3, 'cană', 250],
  // Fructe și legume
  ['banana', 'Banană', 89, 1.1, 22.8, 0.3, 'bucată', 120],
  ['mar', 'Măr', 52, 0.3, 13.8, 0.2, 'bucată', 180],
  ['para', 'Pară', 57, 0.4, 15, 0.1, 'bucată', 170],
  ['portocala', 'Portocală', 47, 0.9, 11.8, 0.1, 'bucată', 150],
  ['struguri', 'Struguri', 69, 0.7, 18, 0.2, 'bol', 150],
  ['avocado', 'Avocado', 160, 2, 8.5, 14.7, 'bucată', 150],
  ['rosii', 'Roșii', 18, 0.9, 3.9, 0.2, 'bucată', 120],
  ['castraveti', 'Castraveți', 15, 0.7, 3.6, 0.1, 'bucată', 150],
  ['ardei-gras', 'Ardei gras', 31, 1, 6, 0.3, 'bucată', 150],
  ['morcov', 'Morcov', 41, 0.9, 9.6, 0.2, 'bucată', 80],
  ['salata-verde', 'Salată verde', 15, 1.4, 2.9, 0.2, 'bol', 100],
  ['salata-de-varza', 'Salată de varză', 50, 1.3, 5.8, 2.5, 'porție', 150],
  ['masline', 'Măsline', 115, 0.8, 6, 10.7, 'porție', 30],
  ['nuci', 'Nuci', 654, 15, 14, 65, 'porție', 30],
  // Garnituri
  ['orez-fiert', 'Orez fiert', 130, 2.7, 28, 0.3, 'porție', 150],
  ['cartofi-fierti', 'Cartofi fierți', 87, 1.9, 20, 0.1, 'porție', 200],
  ['piure-de-cartofi', 'Piure de cartofi', 100, 2, 15, 3.5, 'porție', 200],
  ['cartofi-prajiti', 'Cartofi prăjiți', 312, 3.4, 41, 15, 'porție', 150],
  ['mamaliga', 'Mămăligă', 85, 2, 18.5, 0.5, 'porție', 200],
  ['paste-fierte', 'Paste fierte', 158, 5.8, 31, 0.9, 'porție', 200],
  // Feluri principale
  ['piept-de-pui', 'Piept de pui la grătar', 165, 31, 0, 3.6, 'porție', 150],
  ['snitel-de-pui', 'Șnițel de pui', 245, 22, 12, 12, 'bucată', 150],
  ['ceafa-de-porc', 'Ceafă de porc la grătar', 280, 25, 0, 20, 'porție', 150],
  ['somon', 'Somon la cuptor', 206, 22, 0, 13, 'porție', 150],
  ['ton-in-apa', 'Ton în apă', 116, 26, 0, 1, 'porție', 100],
  ['mici', 'Mici', 260, 15, 2, 21, 'bucată', 50],
  ['sarmale', 'Sarmale', 165, 8, 9, 11, 'bucată', 70],
  ['fasole-batuta', 'Fasole bătută', 140, 6, 15, 6, 'porție', 150],
  ['ciorba-de-legume', 'Ciorbă de legume', 30, 1, 5, 0.8, 'bol', 300],
  ['ciorba-de-perisoare', 'Ciorbă de perișoare', 55, 3.5, 4.5, 2.5, 'bol', 300],
  ['ciorba-de-burta', 'Ciorbă de burtă', 75, 5, 3, 5, 'bol', 300],
  ['pizza-margherita', 'Pizza margherita', 250, 11, 31, 9, 'felie', 110],
  // Zacuscă, salate, aperitive
  ['zacusca', 'Zacuscă', 110, 1.5, 8, 8, 'lingură', 20],
  ['salata-de-vinete', 'Salată de vinete', 150, 1.3, 6, 13, 'lingură', 20],
  ['ulei-floarea-soarelui', 'Ulei de floarea-soarelui', 884, 0, 0, 100, 'lingură', 14],
  // Patiserie și dulciuri
  ['covrig', 'Covrig', 300, 9, 60, 2.5, 'bucată', 90],
  ['placinta-cu-branza', 'Plăcintă cu brânză', 280, 9, 30, 14, 'bucată', 120],
  ['cozonac', 'Cozonac', 350, 7.5, 55, 11, 'felie', 60],
  ['clatite', 'Clătite', 230, 6.5, 30, 9, 'bucată', 60],
  ['papanasi', 'Papanași', 280, 9, 35, 12, 'porție', 200],
  ['ciocolata-neagra', 'Ciocolată neagră 70%', 598, 7.8, 46, 43, 'porție', 25],
];

export const COMMON_FOODS: Food[] = ROWS.map(
  ([slug, name, kcal, protein, carbs, fat, servingName, servingGrams]) => ({
    id: `common:${slug}`,
    name,
    per100g: { kcal, protein, carbs, fat },
    servingName,
    servingGrams,
    source: 'common',
  }),
);

/** Inserts the common foods when none are present. Returns true when it seeded. */
export async function seedCommonFoods(db: Db): Promise<boolean> {
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM foods WHERE source = 'common'",
    [],
  );
  if ((row?.n ?? 0) > 0) return false;

  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const food of COMMON_FOODS) {
      await upsertFood(db, food, now);
    }
  });
  return true;
}

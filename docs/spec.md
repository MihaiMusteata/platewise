# Platewise — product spec (MVP)

## Product
Calorie and macro tracker for iOS. Log food by search or barcode scan, see today's balance and weekly progress. Calm, non-judgmental tone: tracking is a tool, not a test. UI language: Romanian.

## Screens (reference markup in `design/screens/`)

| # | Screen | Reference | Route (suggested) |
|---|--------|-----------|-------------------|
| 1 | Onboarding 1 — About you | `Onb1.html` | `/onboarding/about` |
| 2 | Onboarding 2 — Goal | `Onb2.html` | `/onboarding/goal` |
| 3 | Onboarding 3 — Daily target | `Onb3.html` | `/onboarding/target` |
| 4 | Home (Acasă) — with data | `Main.html` | `/(tabs)/` |
| 5 | Home — empty day | `TodayEmpty.html` | same route, empty state |
| 6 | Home — swipe to delete + undo snackbar | `TodayDelete.html` | same route, interaction |
| 7 | Add food — search | `AddFood.html` | `/add` (modal) |
| 8 | Scan barcode | `Scan.html` | `/scan` (full-screen modal) |
| 9 | Product found (from scan) | `ProductFound.html` | `/product/[barcode]` |
| 10 | Log food (from search) | `LogFood.html` | `/food/[id]` |
| 11 | Scan — product not found | `ScanNotFound.html` | `/scan/not-found` |
| 12 | Add product from label | `AddProduct.html` | `/product/new` |
| 13 | Scan — camera permission off | `CameraOff.html` | state of `/scan` |
| 14 | Scan — offline | `Offline.html` | state of lookup |
| 15 | Progress (Progres) | `Progress.html` | `/(tabs)/progress` |
| 16 | Settings (Setări) | `Settings.html` | `/(tabs)/settings` |

Design references: `Palette.html` (colors and rationale), `System.html` (type scale, spacing, components).
Not designed yet: Paywall, Scan-limit reached, Planuri tab. Do not build them until designs exist.

## Flows
- First launch → Onboarding 1 → 2 → 3 → Home (empty). "Îmi setez singur ținta" on step 1 jumps to step 3.
- Tab bar center button and "Adaugă aliment" → Add food (search). Scan icon in search → Scan.
- Scan success → Product found → "Adaugă la <masă>" → Home. Scan not in database → Not found → Add product → Save and log → Home.
- Search result tap → Log food. Plus button on a result → quick add with default serving to the current meal.
- Home meal row → meal details (later). Swipe left on an entry → Delete, snackbar "Anulează" for 5 s.

## Business rules
- **Age gate:** user must confirm 18+ to continue onboarding.
- **Daily target:** Mifflin–St Jeor BMR × activity factor (sedentar 1.2, ușoară 1.375, moderată 1.55, intensă 1.725). Goal: slăbire −15 %, menținere 0, creștere +10 %, rounded to 50 kcal. Never below 1.200 kcal; the ± stepper changes by 50 kcal within 1.200–4.000.
- **Remaining** = target − food + exercise. Progress percentage = food / target, capped at 100 % visually.
- **Macro goals** (default split of target): protein 30 %, carbs 45 %, fat 25 % (4/4/9 kcal per g), rounded to whole grams.
- **Over goal** is shown neutrally (amber or plain text), never red, never shaming copy.
- **Weight tracking** is OFF by default (Settings toggle). Progress shows a gentle card when off.
- **Pause tracking** hides targets and totals but keeps logging.
- **Scan limit:** free plan 10 successful barcode lookups per calendar month; "not found" does not count. Manual search is unlimited. Logging is never blocked. Demo: counted on the device in the iOS Keychain (`expo-secure-store`); at the limit show a calm message, no paywall. Later: enforced server-side; paid plan "Plus": unlimited scans, backup & sync, export.
- **Food data:** Open Food Facts, called directly from the app (demo has no backend) behind the `FoodApi` interface, with header `User-Agent: Platewise/0.1 (musteatamihai2002@icloud.com)`. Found products are cached locally (SQLite `foods`, `source: 'off'`) so repeat lookups work offline. Show attribution "Date din Open Food Facts…" where product data appears. Values per 100 g; servings stored in grams.
- **Delete all my data:** wipes local DB and profile after confirmation.

## Demo scope
- No backend. Barcode lookup and online search go straight to Open Food Facts.
- All data stays on the device. "Backup și sincronizare" (Settings) is post-demo: show the row as unavailable/coming later, do not build sync.
- Paywall, Plus subscription and the Planuri tab are post-demo.

## Data model (local, SQLite)
```ts
type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface UserProfile {
  isAdult: boolean;
  age: number; heightCm: number; weightKg: number;
  sex: 'female' | 'male';
  activity: 'sedentary' | 'light' | 'moderate' | 'intense';
  goal: 'lose' | 'maintain' | 'gain';
  dailyTargetKcal: number;
  weightTracking: boolean; mealReminders: boolean; paused: boolean;
}

interface Food {
  id: string;                 // uuid, or `off:<barcode>`
  name: string; brand?: string; barcode?: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servingName?: string;       // "bol", "porție", "cană"
  servingGrams?: number;
  source: 'off' | 'custom' | 'common';
}

interface LogEntry {
  id: string; date: string;   // YYYY-MM-DD local
  meal: Meal; foodId: string;
  grams: number;              // computed values derived from Food.per100g × grams
  createdAt: string;
}
```

## Formatting
- Thousands separator dot, decimal comma: `2.000 kcal`, `72,4 kg`, `3,4 g`.
- Dates in Romanian: „Miercuri, 18 noiembrie”.

## Non-goals for MVP
Accounts, social features, recipes, Apple Health, widgets, Android.

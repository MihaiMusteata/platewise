# Platewise — task list

One task per agent session. Tick `[x]` when done and verified (`npm run typecheck && npm run lint && npm test`).

## Phase 0 — Foundation
- [x] **T0.1 Clean template + tooling.** Remove Expo template demo screens/assets. Move source to `app/src/`. Add scripts `typecheck` (`tsc --noEmit`), `lint` (`expo lint`), `test` (jest-expo + @testing-library/react-native). Path alias `@/` → `src/`. *Done when:* app starts with one blank screen and all three scripts pass.
- [x] **T0.2 Theme.** Copy `design/tokens.ts` to `app/src/theme/tokens.ts`, export from `@/theme`. Load Plus Jakarta Sans (500/600/700/800) via `@expo-google-fonts/plus-jakarta-sans` with splash until loaded. *Done when:* a test screen renders every `type` style correctly.
- [x] **T0.3 Helpers.** `formatNumber`, `formatDecimal`, Romanian date formatter, calorie/macro math (`calcTarget`, `macroGoals`, `remaining`). Unit tests for each. *Done when:* tests cover the rules in spec.md.
- [x] **T0.4 Core components.** Screen (safe area + padding 24), Button (primary/outline/text), Card, Chip, TextField (label + 56 input), SegmentedControl, Stepper, ProgressBar, MacroCard, FoodThumb, MealRow, Snackbar, IconButton. Icons: `lucide-react-native` (ask first) or inline SVG via `react-native-svg`. *Done when:* a hidden `/dev/components` screen shows all of them, matching `System.html`.
- [x] **T0.5 Navigation shell.** Expo Router tabs Acasă / Progres / center Log / Planuri / Setări with custom TabBar (center 56 green button, active underline) per `Main.html`. Modal stack for add/scan/product. *Done when:* every route opens a placeholder.

## Phase 1 — Onboarding
- [x] **T1.1 Profile store + persistence.** Zustand + persisted storage; `hasOnboarded` flag redirects first launch to onboarding.
- [x] **T1.2 Onboarding 1–3** per `Onb1/2/3.html`, with validation (18+ required, numeric ranges) and live target calculation.

## Phase 2 — Home
- [x] **T2.1 Local database.** expo-sqlite schema for `foods` and `log_entries`, repository functions, seed of ~50 common Romanian foods (`source: 'common'`).
- [x] **T2.2 Home with data** per `Main.html`: greeting, hero card, macro cards, meals list, floating "Adaugă aliment".
- [x] **T2.3 Empty state** per `TodayEmpty.html` and **swipe to delete + undo** per `TodayDelete.html`.

## Phase 3 — Adding food
- [x] **T3.1 Add food search** per `AddFood.html`: local search (common + my foods + recent), filter chips, Open Food Facts text search behind `FoodApi` when online.
- [x] **T3.2 Log food** per `LogFood.html`: grams/servings toggle, stepper, meal chips, live totals, save entry.

## Phase 4 — Barcode scanning
- [x] **T4.1 Scan screen** per `Scan.html` with `expo-camera` (EAN-13, EAN-8, UPC-A/E), torch, manual barcode entry. Camera permission text in `app.json`. Permission denied state per `CameraOff.html`.
- [x] **T4.2 Lookup + results**: Product found (`ProductFound.html`), Not found (`ScanNotFound.html`), Offline (`Offline.html`). Cache found products locally.
- [x] **T4.3 Add product from label** per `AddProduct.html`, saved as `source: 'custom'`, then logged.
- [x] **T4.4 Scan counter.** Count successful barcode lookups in the iOS Keychain via `expo-secure-store`, keyed by calendar month (local time). 10 successful lookups per month; "not found" and offline do not count. Show remaining scans on the scan screen. At the limit show a calm message (no paywall yet); manual search and logging stay available. *Done when:* counter logic is unit-tested (month rollover, not-found not counted, limit reached).

## Phase 5 — Progress & Settings
- [x] **T5.1 Progress** per `Progress.html`: week/month/year segments, calorie bar chart with goal line and tooltip, weekly goal card, macro donut (`react-native-svg`), weight-off card.
- [ ] **T5.2 Settings** per `Settings.html`: target/goal links to onboarding steps, toggles, export CSV (share sheet), delete all data with confirmation, links (privacy, support).

## Phase 6 — Demo
- [ ] **T6.1 Demo polish.** App icon, splash, app name "Platewise", camera permission text in `app.json`. Hidden dev section in Settings with a "demo seed data" toggle that fills/clears a sample week of log entries. *Done when:* a fresh install shows the Platewise name/icon and the toggle populates Home and Progress.
- [ ] **T6.2 EAS build + TestFlight.** Human-only (Apple team access, signing, App Store Connect). Agents do not attempt this.

## After demo
Not in the demo scope. The demo is serverless: Open Food Facts is called directly from the app and all data stays on the device.

### Backend (api/, .NET)
- [ ] **B1** Minimal API: `POST /api/scan` proxying Open Food Facts with cache; anonymous device identity; monthly counter; `402 SCAN_LIMIT`.
- [ ] **B2** App switches `FoodApi` barcode lookup to the backend; shows remaining scans.

### Monetization (needs designs first)
- [ ] **M1** Paywall + limit-reached screens (design pending).
- [ ] **M2** RevenueCat subscription "Plus", entitlement check, restore purchases.

### Release (store)
- [ ] **R1** `PrivacyInfo.xcprivacy`, privacy policy URL (icon/splash/name moved to T6.1).
- [ ] **R2** EAS build on the account holder's team, TestFlight, App Store listing.

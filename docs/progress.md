# Platewise demo — progress log

Running log for the autonomous demo build. If resumed: read this first, then continue from the first unticked task in `docs/tasks.md` (skip T6.2).

## Status — Demo complete (2026-11-19)
All tasks except T6.2 (human-only) are done on branch `demo`. Verify: `npm run typecheck && npm run lint && npm test` → clean, 0 lint warnings, 43 suites / 332 tests.

### What works
- First launch → onboarding (18+ gate, live Mifflin–St Jeor target, or "Îmi setez singur ținta") → Home.
- Home: today's totals, remaining / over goal (neutral), macro cards, meals with entries, swipe to delete + 5 s undo, empty-day state.
- Add food: offline search over ~59 common Romanian foods + my foods + recent; Open Food Facts text search when online; quick add; Log food with grams/servings, meal choice and live totals.
- Scan: camera (EAN-13/8, UPC-A/E), torch, manual entry, camera-off state; lookup with local cache → Product found / Not found → Add product from label / Offline / limit. 10 successful lookups per month counted in the Keychain; "not found" and offline never count.
- Progress: week/month/year chart with goal line and tooltip, weekly goal, macro donut, weight card.
- Settings: edit target/goal, weight tracking and pause toggles, CSV export via share sheet, delete all data, privacy screen, support mail. Hidden dev section (long-press "Setări" 1,5 s): demo week on/off, reset scans, components gallery.
- App name Platewise, icon, splash, Romanian camera permission text. All data stays on the device.

### How to test on the phone
1. Rebuild the dev client on the iPhone once (name/icon/scheme and native modules changed): `cd app && npx expo run:ios --device`, then `npx expo start`.
2. First launch: fill Despre tine (age, height, weight, sex) → Obiectiv → Ținta → "Începe monitorizarea". Or tick 18+ and tap "Îmi setez singur ținta".
3. Demo data: Setări → long-press the "Setări" title ~1,5 s → "Date demo" on → Acasă and Progres fill with a sample week.
4. Search: center + → type "branza" (local) or a brand name (Open Food Facts, needs internet) → tap a result → adjust → "Adaugă la …". The + on a row quick-adds with undo.
5. Scan: + → scan icon → point at a product barcode (e.g. any Coca-Cola, 5449000000996) → Product found → add. An unknown code → Not found → "Adaugă produsul" → fill label values → save. Airplane mode → Offline state. The pill shows remaining scans; Setări dev section resets them.
6. Delete: swipe an entry left on Acasă → Șterge → "Anulează" within 5 s.
7. Export: Setări → Exportă datele (CSV) → share sheet. Delete all: Setări → Șterge toate datele mele → confirm → back to onboarding.

### Known gaps and items for product review
- Copy without a design (needs review): scan counter pill and limit state, "Vezi opțiuni de sprijin" care text, Planuri "În curând", privacy screen text, Home info alert, Progress weight-on card.
- Design deviations: lucide icons and letter thumbnails instead of custom icons/photos; "Fă o poză" shutter removed (expo-camera can't read EAN from photos on iOS); static scan line; native Switch size; a few type weights (see task notes below).
- Open Food Facts legacy text search is often throttled; the app falls back to local results with a calm note.
- Onboarding skip path saves missing age/height/weight as 0 (treated as unknown in Settings).
- Meal reminders are a disabled "În curând" toggle (no notifications in the demo).
- The icon is a simple generated mark; replace with a designed icon before the store.
- Simulator-only verification for several error states (Not found, Offline, limit) is by unit/screen tests; Product found was verified live.

### T6.2 (human-only, not attempted)
EAS project setup (`eas init`), Apple Developer team access and signing, App Store Connect app record for `com.mihaimusteata.platewise` on the account holder's team (not the personal team), `eas build -p ios --profile production`, `eas submit` to TestFlight. Before that: R1 items (`PrivacyInfo.xcprivacy`, hosted privacy policy URL).

### After demo (from tasks.md)
B1/B2 backend scan proxy + server-side limit, M1/M2 paywall and RevenueCat "Plus", R1 privacy manifest and policy URL, R2 store release; plus Backup și sincronizare and the Planuri tab.

## Global decisions
- Work happens on branch `demo` (pushed to `origin/demo`); `main` stays at the pre-demo state until a human merges.
- Post-demo task IDs renamed to B1/B2 (backend), M1/M2 (monetization), R1/R2 (store release) so they don't clash with the new Phase 6 "Demo".
- R1 originally included icon/splash/name; those moved to T6.1.

## Log

### T0.1 — Clean template + tooling — done
- Removed Expo template screens, components, hooks, theme, demo images, reset-project script.
- Scripts: `typecheck` (tsc --noEmit), `lint` (expo lint, eslint.config.js ignores `ios/*`), `test` (jest, preset jest-expo).
- `tsconfig.json` has `"types": ["jest"]` (TypeScript 6 no longer auto-includes `@types/*`).
- RNTL 14: `render` is async — tests must `await render(...)`.
- Unused template deps (expo-glass-effect, expo-symbols, @expo/ui, …) left installed to avoid a dev-client rebuild.

### Docs: serverless demo scope — done
- tasks.md: added T4.4 (Keychain scan counter) and Phase 6 Demo (T6.1, T6.2 human-only); backend/monetization/release moved to "After demo".
- spec.md: direct Open Food Facts calls with User-Agent, local caching, on-device scan limit, "Demo scope" section (Backup și sincronizare is post-demo).

### T0.2 — Theme — done
- `app/src/theme/tokens.ts` copied from `design/tokens.ts`; `@/theme` re-exports it.
- Root layout loads Plus Jakarta Sans 500/600/700/800 via `@expo-google-fonts/plus-jakarta-sans`, keeps the splash until loaded (or font error), Stack background `colors.background`.
- Dev screen `/dev/typography` renders every `type` style; test checks all are rendered.
- `jest.setup.ts` mocks `react-native-safe-area-context` with the library's official mock.
- Decision: no screenshot gate for this task beyond the dev screen; checked on the simulator once the sim dev build exists (see below).

### T0.3 — Helpers — done
- `src/lib/format.ts`: `formatNumber` (rounded, dot thousands), `formatDecimal(value, digits = 1, trimZeros = false)`, `parseDecimal` (accepts "72,4" and "72.4").
- `src/lib/date.ts`: `formatDateLong` („Miercuri, 18 noiembrie”), `formatDayMonth`, `weekdayShort`, `toDateKey`/`fromDateKey`/`toMonthKey`, `addDays`. Implemented manually (no Intl dependency in Hermes).
- `src/lib/nutrition.ts`: `bmr`, `calcTarget`, `stepTarget`, `macroGoals`, `remaining`, `progress`, `nutrientsFor`, `sumNutrients`.
- `src/types/models.ts`: data model from spec.
- Decision: `calcTarget` clamps to 1.200–4.000 (spec says never below 1.200; the stepper range caps at 4.000, so the computed value uses the same range).
- Decision: macro grams use `Math.round` per macro (sum of kcal may differ from target by a few kcal).

### Dependencies — installed once up front
All pre-approved native deps installed together (expo-sqlite, zustand, expo-secure-store, react-native-svg, expo-linear-gradient, expo-camera, expo-haptics, expo-sharing, expo-file-system, expo-crypto, @shopify/flash-list, lucide-react-native) so the simulator dev client is rebuilt only once. `expo-camera` plugin added to app.json with the Romanian camera permission text (no microphone).

### Simulator workflow (for agents)
- Simulator dev build: `npx expo run:ios --device <iPhone 18 Pro sim id>` (after `npx expo prebuild --platform ios`; `ios/` is generated and git-ignored).
- Metro must run with `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start --dev-client` (not `CI=1`, which disables reloads). Then Expo MCP `automation_take_screenshot` / `automation_tap` work with `projectRoot=/Users/mihaimusteata/Projects/calorii/app`. `automation_scroll` currently rejects the local target.
- `simctl openurl app:///…` triggers an "Open in app?" system prompt that cannot be dismissed headlessly — don't use deep links for navigation; tap through the UI instead. A dev-only "start route" env override was tried and removed (it hung the JS thread on launch).

### T0.4 — Core components — done
- `src/components/`: AppText, Screen, Button, Card, Chip, TextField, SegmentedControl, Stepper, ProgressBar, MacroCard, FoodThumb, MealRow, Snackbar, IconButton (+ index). Hidden `/dev/components` screen; home has temporary dev links.
- `src/i18n/ro.ts` created. Icons: lucide-react-native (mocked in jest.setup.ts because Jest can't load its .mjs).
- Tokens added (mirrored in design/tokens.ts): colors.onBrand, macroTrack, snackbar, attention (amber #B4530B); radius.xs 4; size.snackbar/progressBar/progressBarHero; borderWidth; opacity; iconStroke; type.labelL, type.numberS; shadow.snackbar.
- Decision: form validation errors use amber `colors.attention`, not `danger` (danger is reserved for destructive actions; calm tone).
- Decision: Chip default `choice` variant follows LogFood meal chips (brand fill when selected); System.html mint chip is `variant="action"`.
- Differences: macro icons are lucide (Dumbbell, Wheat, Droplet) instead of custom SVGs; small LogFood MacroCard variant deferred to T3.2.
- Simulator check: /dev/components renders with Plus Jakarta Sans and token colors.

### T1.1 — Profile store + persistence — done
- `src/stores/profile.ts`: Zustand + `persist` (`platewise.profile`, v1) over `src/services/kvStorage.ts`, a synchronous adapter on `expo-sqlite/kv-store` (no AsyncStorage dependency needed). State: `hasOnboarded`, `profile`; actions `completeOnboarding`, `updateProfile`, `reset`.
- `src/app/index.tsx` redirects to `/onboarding/about` when not onboarded (placeholder route until T1.2).
- Tests: store persistence across "restarts" (isolated module reloads), home redirect via `expo-router/testing-library` `renderRouter`.

### T1.2 — Onboarding 1–3 — done
- Routes `onboarding/about|goal|target`; shared layout component `OnboardingStep` (step bars, H1, intro, bottom primary + secondary). New components: StepHeader, CheckboxRow, ChoiceCard (compact radio / tall goal option), SelectField (native ActionSheetIOS), HeroCard (expo-linear-gradient 135°). Button got a `link` variant (brand text, 48 high). `Screen` scroll now adjusts for the keyboard and dismisses it interactively.
- Logic in `src/lib/onboarding.ts` (checkAge 18–100 whole years, checkHeight 120–230, checkWeight 35–300, comma decimals; validateAbout, estimateTarget, draftTarget, buildProfile) and non-persisted `src/stores/onboarding.ts`.
- Tokens added (mirrored): colors.heroButton, heroDivider, textOnMint, stepInactive, radioRing; size.choiceCard, heroStepper, checkMark, radioDot; borderWidth.radio.
- Decision: "Continuă" is disabled until 18+ checked, all fields valid and a sex chosen; amber hints only for invalid/underage input, none for empty fields. Sex starts unselected, activity defaults to Ușoară, goal to Menținere.
- Decision: "Îmi setez singur ținta" requires the 18+ checkbox and no invalid field (empty fields allowed). Step 3 then starts at 2.000 kcal and shows a "starting value" note instead of "calculated from…". Saved profile keeps entered values; missing age/height/weight are stored as 0 (= not provided) and a missing sex as 'female'. Settings must treat 0 as unknown before recalculating a target.
- Decision: changing any estimate input (body data, activity, goal) drops a manual ± target.
- Decision (placeholder, needs product copy): "Vezi opțiuni de sprijin" opens a native alert with calm guidance text (ro.onboarding.target.careSheet).
- Step 3 shows no macro goals (the design doesn't).
- Open issue: on the skip path, missing age/height/weight are saved as 0 and a missing sex as 'female'; Settings must treat 0 as unknown before recalculating a target.
- Open issue: "Vezi opțiuni de sprijin" has no destination in the spec; placeholder alert copy needs product review.

### T0.5 — Navigation shell — done
- `(tabs)/_layout.tsx` with custom `TabBar` (Acasă, Progres, center Log button → `/add`, Planuri, Setări); onboarding guard lives in the tabs layout so every tab redirects.
- Root stack: `add` modal, `scan/index` fullScreenModal, card routes `scan/not-found`, `product/[barcode]`, `product/new`, `food/[id]`; `PlaceholderScreen` component.
- Tokens added (mirrored): colors.tabBarBorder, size.tabIndicatorWidth/Height, iconStroke.navActive, type.tabLabel/tabLabelActive, shadow.logButton.
- Decision: Planuri is a calm "În curând" placeholder (post-demo; copy needs product review).
- Open issue → T3/T4: screens pushed from the add/scan modals open as stacked sheets because they are root-stack cards; fix with a nested Stack inside the modal flow.
- Open issue: `Screen` adds the status-bar inset inside sheets; modal screens need a no-top-inset option.

### T2.1 — Local database — done (built in parallel, ahead of order)
- `src/db/`: `schema.ts` (PRAGMA user_version migrations, WAL, foreign keys), `index.ts` (`getDb()` memoized, migrates + seeds), `foodsRepo.ts`, `logRepo.ts`, `seed.ts` (59 common Romanian foods, ids `common:<slug>`), `types.ts` (`Db` interface, `LogEntryWithFood`, `DailyTotals`).
- Repos take `db` as first argument; tests use `src/db/testing/testDb.ts`, an adapter over Node's built-in `node:sqlite` (real SQL, no new dependency).
- Search: `search_name` column normalized in TS (lowercase, Romanian diacritics stripped), prefix matches first, LIKE wildcards escaped.
- `deleteAllData` wipes log + non-common foods and clears `last_used_at`.
- `src/lib/meals.ts` (`MEALS`, `totalsByMeal`), `src/lib/text.ts` (`normalizeForSearch`).

### T2.2 — Home with data — done
- `(tabs)/index.tsx` rebuilt per Main.html: time-of-day greeting + Romanian date, hero (food / target, remaining, progress capped at 100 %), macro cards, four meal rows, floating "Adaugă aliment" (`Fab`). Data via `useLogStore.load()` on focus.
- `src/lib/home.ts` (`greetingFor`, `daySummary`), `src/lib/meals.ts` (`defaultMealFor`, `mealFoodNames`).
- Tokens added (mirrored): colors.heroTrack, avatar; size.heroBadge, iconL, infoIcon; borderWidth.avatar; type.sectionTitle, heroUnit; shadow.fab; decor.homeBlob.
- Decisions: greeting by time (before 05:00 counts as evening); remaining shown as "x kcal rămase", over goal "x kcal peste țintă" in the same neutral text; exercise not tracked (0); paused → calm paused hero without numbers, macro cards without goals; meal row → `/add?meal=<meal>`; FAB → `/add?meal=defaultMealFor(now)`; "Vezi toate" omitted (no destination); info button shows an explanatory alert (placeholder copy); avatar opens Settings; dev links removed from Home.
- Visual differences: lucide icons approximate custom meal/macro icons; background blob is a pill, not an ellipse.

### T2.3 — Empty state + swipe to delete — done
- Empty day per TodayEmpty.html ("O zi nouă" hero, Scanează → `/scan`, Caută aliment → `/add?meal=…`, empty meal rows with "Adaugă" pills). No FAB on an empty day.
- Each meal summary row is followed by its entries as `SwipeableEntryRow` (ReanimatedSwipeable, 96-wide danger "Șterge" action, VoiceOver `delete` action, light haptic). `useUndoSnackbar` hook: one snackbar, 5 s, a new delete replaces the previous one; "Anulează" restores the entry. FAB hidden while the snackbar shows.
- Root layout wrapped in `GestureHandlerRootView`; jest.setup adds RNGH jestSetup and a View mock for ReanimatedSwipeable (Reanimated 4's mock fails under Jest).
- Tokens added (mirrored): colors.heroBadgeSoft, heroOutline; thumbs.neutral; size.iconXS, swipeAction.
- Decisions: TodayDelete.html swipes a meal-style row but names a single food; spec says swipe on an entry → entries are listed under their meal and only entries swipe. Snackbar copy "Șters: <food>" (gender-neutral). MacroCard value line now single-line with shrink-to-fit (3-digit grams wrapped).
- Visual differences: snack row label "Gustare" (design "Gustări"); lucide icons.

### T3.1 — Add food search — done
- Routes restructured so flows stay inside their modal: `add/` (modal: `index`, `food/[id]`) and `scan/` (fullScreenModal: `index`, `product/[barcode]`, `not-found`, `new-product`). `Screen`/`PlaceholderScreen` have `topInset` (off inside sheets).
- `add/index.tsx` per AddFood.html with `useFoodSearch` hook + pure `lib/search.ts` (merge/dedupe), components `SearchField`, `FoodResultRow`. `services/foodApi.ts` (Open Food Facts client, User-Agent `Platewise/0.1 (musteatamihai2002@icloud.com)`) committed here.
- Decisions: chip Toate = recent when the query is empty ("Sugestii" with 12 common foods when nothing is recent), all local sources + OFF (≥ 2 chars, 400 ms debounce) when typing; Recente/Alimentele mele are local only. OFF results go in a separate "Din Open Food Facts" section with ODbL attribution and are cached (`upsertFood`) when tapped. Quick add (+) stays on the screen: plus → check, 5 s "Adăugat: <aliment>" snackbar with undo. "Nu găsești? Creează un aliment" → `/scan/new-product`. No autofocus.
- foodApi: a 200 with a non-JSON body (OFF throttling page) is `error`, not "nothing found".
- Open issue: OFF legacy text search (`/cgi/search.pl`) is often throttled ("temporarily unavailable"); the app shows a calm note and keeps local results. Post-demo: consider search.openfoodfacts.org or the backend proxy.
- Visual differences: letter thumbnails instead of food icons; outline-button icon 24 instead of 20.

### T3.2 — Log food — done
- `add/food/[id].tsx` per LogFood.html: grams/servings segmented control, stepper, live kcal + compact macro cards, meal chips, save → `useLogStore.add` then `router.dismissTo('/')` with a light haptic. OFF attribution for `source: 'off'`.
- `src/lib/portion.ts` (ranges, clamping, servings ↔ grams, default amount, Romanian serving plurals).
- Components: `MacroCard variant="compact"`, `FoodThumb size="l"`. Tokens added (mirrored): size.thumbLarge, progressBarSmall; type.footnote.
- Decisions: default 1 serving when the food has one, else 100 g; no serving size → grams only (toggle hidden); grams 5–2000 step 10, servings 0,5–20 step 0,5; stepper only (no typed amount — design has no input); "Editează" omitted (no destination); macro bars fill toward profile macro goals, hidden when paused; missing food → calm "Nu am găsit alimentul".
- Visual differences: unselected meal chips weight 600 vs 700; letter thumbnail instead of food icon.

### T4.1 — Scan screen — done
- `scan/index.tsx` per Scan.html: `CameraView` (EAN-13/8, UPC-A/E) with `useCameraPermissions`, torch, scan frame + static line, manual entry sheet (`ManualBarcodeSheet`), CameraOff.html state (`CameraOffState`, "Deschide Setările" → `Linking.openSettings()`, manual entry still available). First scan only (lock resets on refocus), success haptic → `/scan/product/<code>`; camera runs only while focused.
- `src/lib/barcode.ts`: normalize (UPC-A → 13 digits with leading 0, UPC-E expanded only when reported as UPC-E), GTIN check-digit validation, manual entry checks.
- Tokens added (mirrored): colors.scrim, size.stateBadge/stateIcon, layout.textMaxWidth, `scan` geometry group (includes design values 144/40 that are off the 8-pt grid — taken from Scan.html frame geometry), shadow.scanLine.
- Decision: "Fă o poză" shutter omitted — expo-camera can only read QR from photos on iOS, so it could not read EAN codes; hint copy changed to "Se scanează singur. Sau introdu numărul." (needs product review).
- Decision: scan line is static (no animation).
- Visual differences: CameraOff has extra bottom padding (safe area); outline button background transparent instead of white; manual sheet leaves some space above the keyboard.

### T4.2 + T4.4 — Lookup results and scan counter — done (one commit, they share the lookup service)
- `services/barcodeLookup.ts`: product already on the device → returned without network and without using a scan; at the limit → no network call; otherwise OFF lookup, found products cached (`upsertFood`) and counted. Not found / offline / error never count.
- `services/scanCounter.ts`: 10 successful lookups per calendar month in the iOS Keychain (`expo-secure-store`, AFTER_FIRST_UNLOCK, key `platewise.scanCounter`, `{month, count}`); new month starts at 0.
- `scan/product/[barcode].tsx`: loading → Product found (ProductFound.html; shares `LogFoodForm` with Log food) / replace to `scan/not-found` (copy from ScanNotFound.html) / Offline.html state with retry and up to 3 recent foods / error (Offline layout, "Căutarea nu răspunde acum") / calm limit state ("Ai folosit scanările lunii", next reset date, "Caută manual", "Închide"; no paywall, no red).
- Scan screen shows "N scanări rămase luna aceasta" (Romanian plurals in `lib/scanLimit.ts`), refreshed on focus; at 0 a calm message + "Caută manual", camera stays usable (cached products still resolve).
- New shared components: `LogFoodForm`, `FlowHeader`, `StateView` (CameraOff/NotFound/Offline/limit). Tokens added (mirrored): size.thumbProduct 72, size.codePill 40.
- Decisions: "Caută în alimentele mele" opens search filtered to Alimentele mele; "Editează" and package size omitted on Product found (no destination/data); subtitle "brand · 1 porție = X g · Cod …".
- Needs product review: limit-state copy and the scan counter pill (no design).
- Simulator: scan screen counter verified (10 remaining) and Product found verified live with 5449000000996 (Coca-Cola, 145 kcal / 330 g). Not found, Offline and limit states verified by tests only (MCP automation hung during the subagent's run).

### T4.3 — Add product from label — done
- `scan/new-product.tsx` per AddProduct.html: name, brand | serving (g), kcal | protein, carbs | fat (decimal-pad, comma decimals). Reached from Not found (with barcode) and from search "Nu găsești? Creează un aliment" (with meal, no barcode).
- `src/lib/productForm.ts`: validation (name 1–80, brand ≤ 80, kcal 0–900, macros 0–100 and sum ≤ 100, serving 1–2000), amber non-blocking hint when kcal differs from 4/4/9 × macros by > 20 % and > 30 kcal; `buildCustomFood` (randomUUID id, `source: 'custom'`).
- Save: `upsertFood` → log one serving (or 100 g) to the meal param or current meal → `dismissTo('/')`. Custom foods with a barcode resolve on later scans without network or using a scan (test added).
- Decisions: no serving-name field (design has none; serving is "porție"); barcode read-only in the subtitle; macros optional (empty = 0); "Trimite la Open Food Facts" checkbox omitted (no submit path/credentials); empty required fields show no message, button stays disabled.
- Simulator: screen verified visually (via Alimentele mele → create). Metro's watchman subscription had dropped; restarted with `watchman watch-del-all` + `expo start --clear`.

### T5.1 — Progress — done
- `(tabs)/progress.tsx` per Progress.html: Săptămână/Lună/An (`SegmentedControl size="l"`), `CalorieChart` (react-native-svg bars, axis "1k/2k/3k", dashed goal line, highlighted current bar, tap tooltip "1.842 kcal"), "Medie: X kcal" over logged days, weekly goal card (always the current week, capped at 100 %), `MacroDonut` with legend, weight card. Refreshes on focus and on log `revision`; stale loads ignored.
- Geometry in `src/lib/chartGeometry.ts` (tested). Tokens added (mirrored): colors.weeklyTrack; size.segmentL, progressBarWeekly, legendDot, rowBadge; `chart` group (month bar gap 2 is deliberately off-grid for thin bars); shadow.segment.
- Decisions: month labels on day 1, every 5th day and today; year bars = monthly average, labels "ian/feb/…"; paused → goal line and weekly card replaced by a calm note; weight tracking on → "Greutatea ta: X kg" from profile + "history later" note (needs product review); "Filtre" button omitted (no destination); empty data → grey ring + calm note.
- Visual differences: donut centre text 20/28 vs 18; tooltip/current label weight 700 vs 800; tooltip can overlap a neighbouring tall bar.
- Open issue: two `addEntry` calls running concurrently can collide on `withTransactionAsync` (seen when a temporary seed ran twice). Fixed after T5.1: `useLogStore` runs all writes through a serial queue (test: 5 concurrent adds).

### T5.2 — Settings — done
- `(tabs)/settings.tsx` per Settings.html with `SettingsSection`/`SettingsRow`. Target/goal rows open the onboarding screens in edit mode (`?edit=1`: draft prefilled from profile, no step bars, "Salvează"/"Renunță", `updateProfile` + back).
- Export CSV: `services/exportCsv.ts` (allEntries → `buildLogCsv` → cache file `platewise-jurnal-YYYY-MM-DD.csv` via expo-file-system → `Sharing.shareAsync`); empty log → calm alert.
- Delete all my data: destructive confirmation → `clearAll()` + profile reset + onboarding draft reset → `/onboarding/about`. Scan counter (Keychain) intentionally kept.
- `app/privacy.tsx`: in-app privacy text (data stays on device; OFF only receives barcodes/search text; no account, no tracking). Support → mailto.
- Tokens added (mirrored): colors.switchTrackOff; size.listRow 56, badge 24; type.badge.
- Decisions: goal edit recalculates the target only when age/height/weight are all known (skip path saved 0s → target kept with a calm note); re-selecting the current goal no longer drops a manual target; Pause is a Switch (design shows a chevron); meal reminders disabled "În curând" (no notifications in demo); Backup și sincronizare and Restaurează achizițiile muted with "În curând" pill (post-demo); unit rows informational; "Sprijin și linii de ajutor" opens calm care guidance with "Scrie-ne" mailto; no app version row (not in design).
- Open: hosted privacy policy URL still needed (R1).
- Simulator: top three sections, weight toggle, target edit + back, CSV share sheet, privacy screen verified. Lower section (badges, delete row) verified by tests only (scroll unavailable). Native Switch 51×31 vs design 56×32.

### T6.1 — Demo polish — done
- app.json: name "Platewise", slug/scheme "platewise", `userInterfaceStyle: "light"` (no dark theme exists), iOS icon `assets/images/icon.png` (Icon Composer `expo.icon` removed), splash on brand green `#0E5A3A` with the Platewise mark, Android adaptive icons + favicon regenerated. Camera permission text was already set (T4.1 prep).
- Icon: simple mark drawn with PIL (white plate ring + lime leaf on the hero gradient), generator script kept out of the repo. Replace with a designed icon before the store release.
- Hidden dev section at the bottom of Settings, toggled by long-pressing the "Setări" title for 1,5 s: "Date demo" switch (seeds/clears a sample week via `services/demoData.ts`; only the demo entries are removed — ids stored in kv), "Resetează scanările lunii", link to /dev/components.
- Native rebuild done (`expo prebuild --clean` + `run:ios`); the dev client URL scheme is now `exp+platewise://`. The physical iPhone's dev build must be rebuilt (`npx expo run:ios --device`) to pick up the new name, icon and scheme.
- Simulator: fresh install → onboarding (skip path) → empty Home → demo data toggle → Progress shows the week. Home-screen icon and name verified.

### Fix — web bundle could not resolve `wa-sqlite.wasm` (after demo)
- Symptom: `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm` from `expo-sqlite/web/worker.ts` whenever Metro bundled for web (pressing `w`, or the Expo MCP server).
- Fix per expo-sqlite "Web setup" docs: new `app/metro.config.js` adds `wasm` to `resolver.assetExts` and sets COEP `credentialless` / COOP `same-origin` headers (needed for SharedArrayBuffer).
- `app.json` web output changed from `server` to `single`: the app is iOS-only, and server rendering tried to start expo-sqlite's devtools in Node ("window is not defined").
- Verified: web index + web bundle return 200, iOS bundle builds, no errors in the Metro log; no native rebuild needed.

### Fix — black camera preview on the iPhone (after demo)
- Reported on device: permission granted, controls visible, preview black. Not reproducible on the simulator (no camera).
- Change in `scan/index.tsx`: the `CameraView` mounts only after the full-screen modal's `transitionEnd` (600 ms fallback), is remounted when the permission status changes (`key={permission.status}`), and logs `onMountError` as `[scan] camera mount error: …` in the Metro terminal.
- Pending: confirmation on the iPhone.

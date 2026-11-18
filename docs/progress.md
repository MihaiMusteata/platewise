# Platewise demo — progress log

Running log for the autonomous demo build. If resumed: read this first, then continue from the first unticked task in `docs/tasks.md` (skip T6.2).

## Status
In progress.

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

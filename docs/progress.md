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

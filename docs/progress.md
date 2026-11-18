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

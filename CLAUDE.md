# Platewise — iOS calorie tracker

Expo (React Native) app for iOS, built mostly by AI agents. Read this file, `docs/spec.md` and `docs/tasks.md` before any task.

## Repo layout
```
app/            Expo app (SDK 58, Expo Router, TypeScript strict)
api/            .NET Web API (later: scan proxy, scan limits, subscriptions)
design/
  tokens.ts     single source of truth for colors, type, spacing, radii, sizes
  screens/      reference markup for every screen (exact values in inline styles)
  png/          screenshots of the screens (if present) — compare visually
docs/
  spec.md       product spec: screens, flows, business rules, data model
  tasks.md      ordered task list with acceptance criteria
```

## Commands (run from `app/`)
- Dev server: `npx expo start` (dev build already installed on the iPhone)
- Native rebuild (only after adding a native dependency): `npx expo run:ios --device`
- Add dependencies ONLY with `npx expo install <pkg>` (keeps versions SDK-compatible)
- Verify before saying a task is done: `npm run typecheck && npm run lint && npm test`

## Hard rules
1. **Design tokens only.** Never hard-code a color, font size, spacing, radius or size in a component. Import from `@/theme` (which re-exports `design/tokens.ts`). If a value is missing, add it to tokens first and say so.
2. **8-pt grid.** Spacing values: 4, 8, 12, 16, 24, 32, 48, 64. Screen side padding 24. Card padding 16. Gap between sections 24.
3. **Type scale (ratio 1.25):** 12/16, 14/20, 16/24, 20/28, 24/32, 32/40, 40/40, 48/48 (size/lineHeight). Font: Plus Jakarta Sans (500 body, 600 labels, 700 titles & buttons, 800 display & H1). Use `fontVariant: ['tabular-nums']` for numbers.
4. **Touch targets ≥ 48.** Primary button 56 high (pill), chip 48, text input 56 (radius 16), icon button 48, icons 20 or 24.
5. **Match the reference screen.** Each screen has `design/screens/<Name>.html`. Read its markup and reproduce layout, copy and values faithfully. After UI work, take a simulator screenshot and compare.
6. **UI copy is Romanian (source) and English.** Copy lives in `app/src/i18n/ro.ts` (Romanian source) and `app/src/i18n/en.ts` (English); both must be updated together (same keys, checked by typecheck). Screens read it via `import { strings } from '@/i18n'`. No emoji in UI. Tone is calm and never shaming (no red for "over goal", no guilt language).
7. **Numbers follow the active language:** Romanian `2.000` / `72,4`, English `2,000` / `72.4`. Always use the shared `formatNumber` / `formatDecimal` helpers (and `@/lib/date` for dates); never format by hand.
8. **Never edit `app/ios/` by hand.** It is generated (Continuous Native Generation). Native config goes in `app.json` / config plugins.
9. **No new libraries without asking** in the chat first. Prefer Expo modules.
10. **No secrets in Git.** Keys go in `.env` (git-ignored) or EAS secrets.

## Architecture
- Routing: Expo Router, file-based, in `app/src/app/`. Tabs: Acasă, Progres, (center Log button), Planuri, Setări.
- State: Zustand stores in `app/src/stores/`. Persistence: `expo-sqlite` for the food log, key-value storage for settings/profile.
- Offline-first: the log, search in "My foods" and "Recent" work offline. Only barcode lookup and online search need network.
- Data access behind interfaces in `app/src/services/` (e.g. `FoodApi`), so the Open Food Facts client can later be swapped for our .NET proxy without touching screens.
- Components: reusable UI in `app/src/components/` (Button, Card, Chip, TextField, ProgressBar, MacroCard, MealRow, TabBar, Screen). Screens compose components; no styling logic duplicated across screens.

## How to work
- One task from `docs/tasks.md` per session. Start in plan mode, list the files you will touch, then implement.
- Keep changes small and focused. Write or update tests for logic (calorie math, formatting, limits).
- When done: run the verify command, summarize what changed, and tick the task in `docs/tasks.md`.
- If the spec is ambiguous, ask — do not invent product rules.

## Identity
- Bundle ID (personal dev team, temporary): `com.mihaimusteata.platewise.dev`
- Bundle ID (App Store, team of the account holder): `com.mihaimusteata.platewise` — do not register it on the personal team.

# CLAUDE.md — Silver-Stock-Saga

Codebase context for AI assistants working on this repository.

---

## Project Overview

**Silver-Stock-Saga** is a browser-based Super Smash Bros. Melee (SSBM) esports team management simulator. Players manage a roster of competitive Melee players, assign weekly activities, enter tournaments, and watch their team climb rankings — all simulated on the client side with no backend.

- Purely client-side (React + TypeScript + Vite)
- State persisted to browser `localStorage` via Zustand
- No backend, database, or environment variables required

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | 19.2.4 | UI framework |
| TypeScript | ~5.9.3 | Type safety (strict mode) |
| Vite | 8.0.0 | Build tool + dev server |
| Tailwind CSS | 4.2.2 | Utility-first styling via `@tailwindcss/vite` |
| Zustand | 5.0.12 | State management with `persist` middleware |
| ESLint | 9.39.4 | Linting (flat config format) |

---

## Repository Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Screen router (reads active screen from store)
├── index.css                 # Global styles: Tailwind + custom CSS variables / fonts
├── components/               # Reusable UI components
│   ├── Nav.tsx
│   ├── Dashboard.tsx
│   ├── PlayerCard.tsx
│   ├── ActivityPicker.tsx
│   ├── StatBar.tsx
│   └── TournamentReport.tsx
├── screens/                  # Full-page views (one per nav tab)
│   ├── Dashboard.tsx
│   ├── Roster.tsx
│   ├── Schedule.tsx
│   ├── Rankings.tsx
│   └── Placeholder.tsx       # Used for unfinished screens (Training, Finances)
├── store/
│   └── gameStore.ts          # Central Zustand store — all game state lives here
├── types/
│   └── index.ts              # All TypeScript interfaces and type unions
├── data/                     # Static game data (hardcoded, no fetching)
│   ├── players.ts            # Starting roster definitions
│   ├── tournaments.ts        # Season tournament schedule
│   ├── characters.ts         # Character metadata (tier, stat affinities)
│   └── movedata.ts           # Per-character move data
└── engine/                   # Simulation logic (pure functions, no React)
    ├── tournamentSimulator.ts # Runs full tournament bracket
    ├── setSimulator.ts        # Simulates individual head-to-head sets
    ├── rating.ts              # EPR (Effective Performance Rating) calculation
    ├── ranking.ts             # Ranking points system with exponential decay
    ├── matchups.ts            # Character matchup advantage table
    ├── neutral.ts             # Neutral game framework
    └── npcs.ts               # NPC opponent pools by tournament tier
```

---

## Development Workflows

### Dev server
```bash
npm run dev        # Start Vite dev server with HMR
```

### Build
```bash
npm run build      # Type-check (tsc -b) then Vite production build
```

### Lint
```bash
npm run lint       # ESLint with flat config
```

### Preview production build
```bash
npm run preview
```

### No test runner is configured
There is no Jest, Vitest, or other test framework. Do not try to run `npm test`.

---

## Core Architecture

### State Management

All game state lives in `src/store/gameStore.ts` (Zustand store with `persist`).

- **Persistence key:** `'silver-stock-saga-save'` (localStorage)
- Access state in components via `useGameStore()` — never pass state as props through multiple levels
- Key store actions: `setScreen`, `setPlayerActivity`, `registerForTournament`, `advanceWeek`, `resetGame`

### The Weekly Game Loop (`advanceWeek`)

1. Apply weekly activity effects to each player's stats (train/rest/local/prep)
2. Run all tournaments scheduled for that week via `simulateTournament()`
3. Apply results: fatigue, wins/losses, reputation, prize earnings
4. Recalculate global rankings
5. Deduct salaries, add prize money to team balance

### Simulation Engine (pure functions, no side effects)

The `engine/` directory contains the simulation logic:

- `tournamentSimulator.ts` → orchestrates bracket; calls `setSimulator`
- `setSimulator.ts` → simulates a head-to-head set using stats + matchup data
- `rating.ts` → computes **EPR** (Effective Performance Rating, 0–200 scale)
- `ranking.ts` → assigns ranking points; applies exponential decay (~half-life 10 weeks)
- `matchups.ts` → character matchup advantage table (asymmetric; mirrored on lookup)

Engine functions are stateless — pass them data, get results back. Do not add React imports or state calls inside `engine/`.

---

## Domain Language (SSBM Context)

| Term | Meaning |
|------|---------|
| **EPR** | Effective Performance Rating — composite player strength (0–200) |
| **Form** | Current peak condition (0–100); decays with fatigue |
| **Fatigue** | Physical/mental wear (0–100); degrades performance and form |
| **Execution** | Technical skill stat (0–100) |
| **Neutral** | Neutral-game skill stat (0–100) |
| **Mental** | Mental fortitude stat (0–100) |
| **Adaptability** | In-set adjustment stat (0–100) |
| **Weekly Activity** | `train` / `rest` / `local` / `prep` — chosen per player per week |
| **Tournament Tier** | `local` → `regional` → `major` → `supermajor` |
| **Set Narrative** | `dominant`, `comfortable`, `close`, `upset`, `reverse_sweep` |
| **Character Tier** | `S`, `A`, `B`, `C` — affects stat weighting in EPR |

**Playable characters:** Fox, Falco, Marth, Sheik, Jigglypuff, Peach, Captain Falcon, Ice Climbers, Pikachu, Samus, Luigi, Young Link, Dr. Mario, Ganondorf, Donkey Kong.

---

## Code Conventions

### File naming
- **Components / Screens:** PascalCase (`PlayerCard.tsx`, `Roster.tsx`)
- **Store / Engine / Data:** camelCase (`gameStore.ts`, `setSimulator.ts`)

### TypeScript
- Strict mode — no `any`, no unused locals/params, no implicit returns
- **All shared types go in `src/types/index.ts`** — do not define types inline in component files
- Use type unions for domain concepts: `Character`, `WeekActivity`, `Screen`, `TournamentTier`

### Styling
- Tailwind utility classes applied directly in JSX — no CSS modules
- Custom design tokens defined as CSS variables in `src/index.css`:
  - `--color-cream` — neutral background (#faf4e8)
  - `--color-slate-blue` — primary accent
  - `--color-warm-brown` — text/borders
  - `--color-gold` — highlights / wins
  - `--color-muted-red` / `--color-muted-green` — loss/win indicators
- Font: **DM Sans**

### Components
- Functional components only
- Access all state via `useGameStore()` — keep components flat, avoid prop-drilling
- Keep simulation logic out of components; put it in `engine/`

### Engine functions
- Pure functions only — no React, no store access, no side effects
- Inputs: raw data/stats. Outputs: results/reports.

---

## Screens & Navigation

Screens are switched by setting `gameState.activeScreen` in the store. `App.tsx` renders the correct screen.

| Screen | Status | Description |
|--------|--------|-------------|
| `dashboard` | Done | Team overview, upcoming tournaments, quick stats |
| `roster` | Done | Player cards with stat display and activity picker |
| `schedule` | Done | Tournament calendar with registration |
| `rankings` | Done | Global player power rankings |
| `training` | Placeholder | Not yet implemented |
| `finances` | Placeholder | Not yet implemented |

`Placeholder.tsx` is used for unfinished screens — replace it with actual screen content when implementing new screens.

---

## Type System Reference

All types live in `src/types/index.ts`. Key interfaces:

| Type | Description |
|------|-------------|
| `Player` | Full player record: stats, form, fatigue, salary, activity, wins/losses, reputation |
| `PlayerStats` | The four core stats: `execution`, `neutral`, `mental`, `adaptability` (each 0–100) |
| `Team` | Org record: `balance`, `reputation`, `week` |
| `Tournament` | Event definition: tier, week, entrants, prizePool, entryFee, registeredPlayers, results |
| `TournamentReport` | Post-event summary: per-player results + set history, used for the UI report modal |
| `PlayerTournamentResult` | Per-player result with `setHistory: SetResult[]` and `repGained` |
| `SetResult` | Single set outcome: scores, narrative, opponent tag/character, isBo5, round label |
| `RankingEntry` | Ranked standing: decayed points total, rank, trend (`up`/`down`/`stable`), recentResults |
| `RankingResult` | One result record inside a `RankingEntry`: placement, basePoints, earnedAtWeek |
| `NPC` | Simulated opponent: tag, character, rating (raw EPR-scale number) |
| `GameState` | Root state shape stored in the Zustand store |

**Union types:**
- `Screen` — `'dashboard' | 'roster' | 'schedule' | 'rankings' | 'training' | 'finances'`
- `WeekActivity` — `'train' | 'rest' | 'local' | 'prep'`
- `TournamentTier` — `'local' | 'regional' | 'major' | 'supermajor'`
- `SetNarrative` — `'dominant' | 'comfortable' | 'close' | 'upset' | 'reverse_sweep'`
- `CombatOption` — `'attack' | 'shield' | 'grab' | 'dodge'`
- `Character` — 15 string literals (Fox … Donkey Kong)

---

## Weekly Activity Effects

Applied in `advanceWeek()` inside `gameStore.ts` before tournaments run:

| Activity | Fatigue | Form | Stats |
|----------|---------|------|-------|
| `train` | +15 | −5 | Weakest stat +2 |
| `rest` | −25 | +8 | — |
| `local` | +8 | +3 | — |
| `prep` | +5 | +5 | — (but +5% EPR bonus during tourney) |

After the switch, every player's `weekActivity` resets to `'train'` as the default for the next week.

---

## EPR Calculation (`engine/rating.ts`)

`calcEPR(player)` returns a value in **0–200**. Steps in order:

1. **Stat affinity adjustment** — add character-specific affinity bonuses from `characters.ts` to raw stats (clamped 0–100)
2. **Weighted sum** — multiply adjusted stats by character-specific `STAT_WEIGHTS` (sum to 1.0); result is 0–100
3. **Execution floor penalty** — Fox < 60, Falco < 65, Ice Climbers < 70 each take `1.5× deficit` subtracted from base
4. **Tier bonus** — S: +8, A: +4, B: 0, C: −6
5. **Form multiplier** — `0.80 + (form/100) × 0.40` → range 0.80–1.20
6. **Fatigue penalty** — `1 − (fatigue/100) × 0.25` → up to −25%
7. **Prep bonus** — ×1.05 if `weekActivity === 'prep'`
8. **Scale to 0–200** — multiply by `200/136` (136 is the theoretical max before scaling)

Win probability uses Elo-style formula: `1 / (1 + 10^((adjustedB − epA) / 80))` where `adjustedB = epB − matchupAdv`.

---

## Ranking Points Reference (`engine/ranking.ts`)

Points by tier and placement:

| Placement | local | regional | major | supermajor |
|-----------|-------|----------|-------|------------|
| 1st | 15 | 75 | 300 | 800 |
| 2nd | 9 | 45 | 180 | 480 |
| 3rd | 6 | 30 | 120 | 320 |
| 4th | 3 | 18 | 75 | 200 |
| Top 8 | 1 | 9 | 40 | 100 |
| Top 16 | — | 4 | 20 | 50 |
| Top 32 | — | — | 8 | 20 |

**Decay:** `basePoints × 0.933^weeksAgo` — half-life ≈ 10 weeks.

**Seeding advantage:** Top seeds face opponents scaled at ~65% of field average rating (rank 1), grading up to no protection for unranked players.

---

## NPC Opponent Pools (`engine/npcs.ts`)

Each tier draws from a cumulative pool:

| Tier | Pool composition | Rating range |
|------|-----------------|--------------|
| `local` | LOCAL only | ~30–62 |
| `regional` | LOCAL + REGIONAL | ~30–98 |
| `major` | REGIONAL + MAJOR | ~68–130 |
| `supermajor` | MAJOR + SUPERMAJOR extras | ~102–160 |

Opponent selection uses a Gaussian-weighted draw (`σ ≈ 30`) centred on the player's EPR — players face appropriate-strength opponents rather than a flat random pick.

---

## What Not To Do

- Do not add a backend, API calls, or environment variables — this is intentionally client-only
- Do not import React or Zustand inside `engine/` — keep it pure
- Do not define new TypeScript types outside `src/types/index.ts`
- Do not create CSS modules or styled-components — use Tailwind utilities
- Do not run `npm test` — no test runner is set up
- Do not use `any` — TypeScript strict mode will reject it at build time
- Do not store simulation logic inside components or the store — put it in `engine/`

---

## Git Conventions

Commit message pattern observed in history:
```
feat: short description of the feature added
```

Use the `feat:` prefix for new features. Follow standard conventional commits for other types (`fix:`, `refactor:`, `docs:`, etc.).

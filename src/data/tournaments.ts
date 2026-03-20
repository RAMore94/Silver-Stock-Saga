import type { Tournament, TournamentTier } from '../types'

// ── Venues ───────────────────────────────────────────────────────────────────

interface Venue { city: string; state: string }

const V = {
  oakland:      { city: 'Oakland',       state: 'CA' },
  losAngeles:   { city: 'Los Angeles',   state: 'CA' },
  newYork:      { city: 'New York',      state: 'NY' },
  newark:       { city: 'Newark',        state: 'NJ' },
  chicago:      { city: 'Chicago',       state: 'IL' },
  houston:      { city: 'Houston',       state: 'TX' },
  austin:       { city: 'Austin',        state: 'TX' },
  atlanta:      { city: 'Atlanta',       state: 'GA' },
  orlando:      { city: 'Orlando',       state: 'FL' },
  detroit:      { city: 'Detroit',       state: 'MI' },
  boston:        { city: 'Boston',        state: 'MA' },
  seattle:      { city: 'Seattle',       state: 'WA' },
  portland:     { city: 'Portland',      state: 'OR' },
  lasVegas:     { city: 'Las Vegas',     state: 'NV' },
  minneapolis:  { city: 'Minneapolis',   state: 'MN' },
  bloomington:  { city: 'Bloomington',   state: 'IN' },
  phoenix:      { city: 'Phoenix',       state: 'AZ' },
  denver:       { city: 'Denver',        state: 'CO' },
  philadelphia: { city: 'Philadelphia',  state: 'PA' },
  richmond:     { city: 'Richmond',      state: 'VA' },
} as const

function loc(v: Venue): string { return `${v.city}, ${v.state}` }

// ── Event templates ──────────────────────────────────────────────────────────

interface EventDef {
  name: string
  tier: TournamentTier
  week: number
  location: string
  entrants: number
  prizePool: number
  entryFee: number
}

// 4 supermajors — the biggest events of the year, roughly quarterly
const SUPERMAJORS: EventDef[] = [
  { name: 'Genesis XII',       tier: 'supermajor', week: 8,  location: loc(V.oakland),     entrants: 1024, prizePool: 75000, entryFee: 75 },
  { name: 'Apex 2024',         tier: 'supermajor', week: 21, location: loc(V.newark),      entrants: 1024, prizePool: 60000, entryFee: 70 },
  { name: 'The Big House XI',  tier: 'supermajor', week: 34, location: loc(V.detroit),     entrants: 1200, prizePool: 80000, entryFee: 80 },
  { name: 'Shine 2024',        tier: 'supermajor', week: 47, location: loc(V.boston),       entrants: 1024, prizePool: 65000, entryFee: 70 },
]

// 8 majors — one headline event per month (outside supermajor months)
const MAJORS: EventDef[] = [
  { name: 'Catalyst',          tier: 'major', week: 4,  location: loc(V.losAngeles),   entrants: 512,  prizePool: 20000, entryFee: 60 },
  { name: 'Frostbite',         tier: 'major', week: 12, location: loc(V.minneapolis),  entrants: 512,  prizePool: 18000, entryFee: 55 },
  { name: 'Full Bloom',        tier: 'major', week: 16, location: loc(V.bloomington),  entrants: 512,  prizePool: 15000, entryFee: 50 },
  { name: 'Riptide',           tier: 'major', week: 25, location: loc(V.atlanta),      entrants: 640,  prizePool: 22000, entryFee: 60 },
  { name: 'Smash Factor',      tier: 'major', week: 29, location: loc(V.houston),      entrants: 512,  prizePool: 18000, entryFee: 55 },
  { name: 'Nightclub',         tier: 'major', week: 38, location: loc(V.chicago),      entrants: 512,  prizePool: 20000, entryFee: 55 },
  { name: 'Mainstage',         tier: 'major', week: 42, location: loc(V.losAngeles),   entrants: 640,  prizePool: 22000, entryFee: 60 },
  { name: 'Summit',            tier: 'major', week: 50, location: loc(V.lasVegas),     entrants: 512,  prizePool: 25000, entryFee: 60 },
]

// ~18 regionals — scattered across the calendar, various cities
const REGIONALS: EventDef[] = [
  { name: 'Pacific Rising',        tier: 'regional', week: 2,  location: loc(V.losAngeles),   entrants: 192, prizePool: 3200,  entryFee: 30 },
  { name: 'Emerald City Classic',  tier: 'regional', week: 6,  location: loc(V.seattle),      entrants: 160, prizePool: 2800,  entryFee: 25 },
  { name: 'Triforce Tournament',   tier: 'regional', week: 10, location: loc(V.newYork),      entrants: 224, prizePool: 4000,  entryFee: 30 },
  { name: 'Heartland Havoc',       tier: 'regional', week: 14, location: loc(V.chicago),      entrants: 192, prizePool: 3500,  entryFee: 30 },
  { name: 'Lone Star Throwdown',   tier: 'regional', week: 18, location: loc(V.austin),       entrants: 160, prizePool: 2800,  entryFee: 25 },
  { name: 'Liberty Bell Brawl',    tier: 'regional', week: 19, location: loc(V.philadelphia), entrants: 128, prizePool: 2400,  entryFee: 25 },
  { name: 'Summer Stockade',       tier: 'regional', week: 23, location: loc(V.orlando),      entrants: 256, prizePool: 5000,  entryFee: 35 },
  { name: 'Mountain Melee',        tier: 'regional', week: 27, location: loc(V.denver),       entrants: 128, prizePool: 2400,  entryFee: 25 },
  { name: 'Desert Heat',           tier: 'regional', week: 31, location: loc(V.phoenix),      entrants: 192, prizePool: 3200,  entryFee: 30 },
  { name: 'Rose City Ruckus',      tier: 'regional', week: 32, location: loc(V.portland),     entrants: 128, prizePool: 2200,  entryFee: 25 },
  { name: 'Capital Clash',         tier: 'regional', week: 36, location: loc(V.richmond),     entrants: 160, prizePool: 3000,  entryFee: 30 },
  { name: 'Great Lakes Open',      tier: 'regional', week: 40, location: loc(V.detroit),      entrants: 192, prizePool: 3500,  entryFee: 30 },
  { name: 'Autumn Assault',        tier: 'regional', week: 44, location: loc(V.chicago),      entrants: 224, prizePool: 4000,  entryFee: 30 },
  { name: 'Gulf Coast Gauntlet',   tier: 'regional', week: 46, location: loc(V.houston),      entrants: 128, prizePool: 2400,  entryFee: 25 },
  { name: 'Northeast Championship',tier: 'regional', week: 49, location: loc(V.newYork),      entrants: 256, prizePool: 5000,  entryFee: 35 },
  { name: 'Winter Wavedash',       tier: 'regional', week: 52, location: loc(V.seattle),      entrants: 160, prizePool: 2800,  entryFee: 25 },
]

// ── Local series ─────────────────────────────────────────────────────────────
// Three recurring weekly series at different venues.
// Each runs roughly every 4 weeks, giving ~13 editions per year.

interface LocalSeries {
  name: string
  location: string
  baseEntrants: number
  entryFee: number
  weeks: number[]
}

const LOCAL_SERIES: LocalSeries[] = [
  {
    name: 'Westside Wednesday',
    location: loc(V.losAngeles),
    baseEntrants: 40,
    entryFee: 5,
    weeks: [1, 5, 9, 13, 17, 22, 26, 30, 35, 39, 43, 48, 51],
  },
  {
    name: 'Tristate Throwdown',
    location: loc(V.newYork),
    baseEntrants: 48,
    entryFee: 5,
    weeks: [3, 7, 11, 15, 20, 24, 28, 33, 37, 41, 45, 48],
  },
  {
    name: 'Crossroads Clash',
    location: loc(V.chicago),
    baseEntrants: 36,
    entryFee: 5,
    weeks: [2, 6, 10, 14, 19, 23, 27, 32, 36, 40, 44, 49],
  },
]

// ── Calendar builder ─────────────────────────────────────────────────────────

function buildCalendar(): Tournament[] {
  const events: Tournament[] = []
  let nextId = 1

  // Fixed events (supermajors, majors, regionals)
  for (const def of [...SUPERMAJORS, ...MAJORS, ...REGIONALS]) {
    events.push({
      id: `t${nextId++}`,
      name: def.name,
      tier: def.tier,
      week: def.week,
      location: def.location,
      entrants: def.entrants,
      prizePool: def.prizePool,
      entryFee: def.entryFee,
      registeredPlayers: [],
    })
  }

  // Generate locals from recurring series
  for (const series of LOCAL_SERIES) {
    let edition = 1
    for (const week of series.weeks) {
      // Slight entrant variation — busier some weeks, quieter others
      const entrantVariation = ((week * 7) % 5) * 4 - 8  // deterministic ±range
      const entrants = Math.max(16, series.baseEntrants + entrantVariation)
      events.push({
        id: `t${nextId++}`,
        name: `${series.name} #${edition++}`,
        tier: 'local' as const,
        week,
        location: series.location,
        entrants,
        prizePool: entrants * series.entryFee,
        entryFee: series.entryFee,
        registeredPlayers: [],
      })
    }
  }

  return events.sort((a, b) => a.week - b.week)
}

export const INITIAL_TOURNAMENTS = buildCalendar()

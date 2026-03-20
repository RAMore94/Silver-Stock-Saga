import type { Tournament, TournamentTier, TournamentRegion } from '../types'

// ── Venues ───────────────────────────────────────────────────────────────────
//
// US regional breakdown:
//   west      — California (CA), Nevada (NV)             [Oakland, LA, Las Vegas]
//   northwest — Washington (WA), Oregon (OR)             [Seattle, Portland]
//   midwest   — Illinois (IL), Michigan (MI),
//               Minnesota (MN), Indiana (IN)             [Chicago, Detroit, Minneapolis, Bloomington]
//   northeast — New York (NY), New Jersey (NJ),
//               Massachusetts (MA), Pennsylvania (PA)    [NYC, Newark, Boston, Philadelphia]
//   south     — Georgia (GA), Texas (TX),
//               Florida (FL), Virginia (VA)              [Atlanta, Houston, Austin, Orlando, Richmond]
//   southwest — Arizona (AZ), Colorado (CO)              [Phoenix, Denver]

interface Venue { city: string; state: string; region: TournamentRegion }

const V = {
  oakland:      { city: 'Oakland',       state: 'CA', region: 'west'      },
  losAngeles:   { city: 'Los Angeles',   state: 'CA', region: 'west'      },
  newYork:      { city: 'New York',      state: 'NY', region: 'northeast' },
  newark:       { city: 'Newark',        state: 'NJ', region: 'northeast' },
  chicago:      { city: 'Chicago',       state: 'IL', region: 'midwest'   },
  houston:      { city: 'Houston',       state: 'TX', region: 'south'     },
  austin:       { city: 'Austin',        state: 'TX', region: 'south'     },
  atlanta:      { city: 'Atlanta',       state: 'GA', region: 'south'     },
  orlando:      { city: 'Orlando',       state: 'FL', region: 'south'     },
  detroit:      { city: 'Detroit',       state: 'MI', region: 'midwest'   },
  boston:       { city: 'Boston',        state: 'MA', region: 'northeast' },
  seattle:      { city: 'Seattle',       state: 'WA', region: 'northwest' },
  portland:     { city: 'Portland',      state: 'OR', region: 'northwest' },
  lasVegas:     { city: 'Las Vegas',     state: 'NV', region: 'west'      },
  minneapolis:  { city: 'Minneapolis',   state: 'MN', region: 'midwest'   },
  bloomington:  { city: 'Bloomington',   state: 'IN', region: 'midwest'   },
  phoenix:      { city: 'Phoenix',       state: 'AZ', region: 'southwest' },
  denver:       { city: 'Denver',        state: 'CO', region: 'southwest' },
  philadelphia: { city: 'Philadelphia',  state: 'PA', region: 'northeast' },
  richmond:     { city: 'Richmond',      state: 'VA', region: 'south'     },
} as const

function loc(v: Venue): string { return `${v.city}, ${v.state}` }

// ── Event templates ──────────────────────────────────────────────────────────

interface EventDef {
  name: string
  tier: TournamentTier
  region: TournamentRegion
  week: number
  location: string
  entrants: number
  prizePool: number
  entryFee: number
}

// Helper: build an EventDef from a venue (pulls region automatically)
function ev(
  name: string,
  tier: TournamentTier,
  week: number,
  venue: Venue,
  entrants: number,
  prizePool: number,
  entryFee: number,
): EventDef {
  return { name, tier, region: venue.region, week, location: loc(venue), entrants, prizePool, entryFee }
}

// 4 supermajors — the biggest events of the year, roughly quarterly
const SUPERMAJORS: EventDef[] = [
  ev('Genesis XII',      'supermajor', 8,  V.oakland,    1024, 75000, 75),
  ev('Apex 2024',        'supermajor', 21, V.newark,     1024, 60000, 70),
  ev('The Big House XI', 'supermajor', 34, V.detroit,    1200, 80000, 80),
  ev('Shine 2024',       'supermajor', 47, V.boston,     1024, 65000, 70),
]

// 8 majors — one headline event per month (outside supermajor months)
const MAJORS: EventDef[] = [
  ev('Catalyst',    'major', 4,  V.losAngeles,  512, 20000, 60),
  ev('Frostbite',   'major', 12, V.minneapolis, 512, 18000, 55),
  ev('Full Bloom',  'major', 16, V.bloomington, 512, 15000, 50),
  ev('Riptide',     'major', 25, V.atlanta,     640, 22000, 60),
  ev('Smash Factor','major', 29, V.houston,     512, 18000, 55),
  ev('Nightclub',   'major', 38, V.chicago,     512, 20000, 55),
  ev('Mainstage',   'major', 42, V.losAngeles,  640, 22000, 60),
  ev('Summit',      'major', 50, V.lasVegas,    512, 25000, 60),
]

// 16 regionals — scattered across the calendar, one per active scene per quarter
const REGIONALS: EventDef[] = [
  ev('Pacific Rising',         'regional', 2,  V.losAngeles,   192, 3200, 30),
  ev('Emerald City Classic',   'regional', 6,  V.seattle,      160, 2800, 25),
  ev('Triforce Tournament',    'regional', 10, V.newYork,      224, 4000, 30),
  ev('Heartland Havoc',        'regional', 14, V.chicago,      192, 3500, 30),
  ev('Lone Star Throwdown',    'regional', 18, V.austin,       160, 2800, 25),
  ev('Liberty Bell Brawl',     'regional', 19, V.philadelphia, 128, 2400, 25),
  ev('Summer Stockade',        'regional', 23, V.orlando,      256, 5000, 35),
  ev('Mountain Melee',         'regional', 27, V.denver,       128, 2400, 25),
  ev('Desert Heat',            'regional', 31, V.phoenix,      192, 3200, 30),
  ev('Rose City Ruckus',       'regional', 32, V.portland,     128, 2200, 25),
  ev('Capital Clash',          'regional', 36, V.richmond,     160, 3000, 30),
  ev('Great Lakes Open',       'regional', 40, V.detroit,      192, 3500, 30),
  ev('Autumn Assault',         'regional', 44, V.chicago,      224, 4000, 30),
  ev('Gulf Coast Gauntlet',    'regional', 46, V.houston,      128, 2400, 25),
  ev('Northeast Championship', 'regional', 49, V.newYork,      256, 5000, 35),
  ev('Winter Wavedash',        'regional', 52, V.seattle,      160, 2800, 25),
]

// ── Local series ─────────────────────────────────────────────────────────────
// Three recurring weekly series at different venues.
// Each runs roughly every 4 weeks, giving ~13 editions per year.

interface LocalSeries {
  name: string
  venue: Venue
  baseEntrants: number
  entryFee: number
  weeks: number[]
}

const LOCAL_SERIES: LocalSeries[] = [
  {
    name: 'Westside Wednesday',
    venue: V.losAngeles,
    baseEntrants: 40,
    entryFee: 5,
    weeks: [1, 5, 9, 13, 17, 22, 26, 30, 35, 39, 43, 48, 51],
  },
  {
    name: 'Tristate Throwdown',
    venue: V.newYork,
    baseEntrants: 48,
    entryFee: 5,
    weeks: [3, 7, 11, 15, 20, 24, 28, 33, 37, 41, 45, 48],
  },
  {
    name: 'Crossroads Clash',
    venue: V.chicago,
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
      region: def.region,
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
        region: series.venue.region,
        week,
        location: loc(series.venue),
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

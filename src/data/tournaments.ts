import type { Tournament, TournamentTier, TournamentRegion, Country, VenueLocation } from '../types'

// ── Venue hierarchy ────────────────────────────────────────────────────────────
//
//  Country → Region → Province/State → City
//
//  United States (US)
//  ├── west           — CA, NV              Oakland, Los Angeles, Las Vegas
//  ├── northwest      — WA, OR              Seattle, Portland
//  ├── midwest        — IL, MI, MN, IN      Chicago, Detroit, Minneapolis, Bloomington
//  ├── northeast      — NY, NJ, MA, PA      New York, Newark, Boston, Philadelphia
//  ├── south          — GA, TX, FL, VA      Atlanta, Houston, Austin, Orlando, Richmond
//  └── southwest      — AZ, CO              Phoenix, Denver
//
//  Canada (CA)
//  ├── western_canada — BC, AB              Vancouver, Calgary
//  └── eastern_canada — ON, QC              Toronto, Montreal

interface Coords { lat: number; lng: number }
interface Venue {
  country: Country
  region: TournamentRegion
  state: string   // state or province abbreviation
  city: string
  coords: Coords
}

function vl(v: Venue): VenueLocation {
  return { country: v.country, region: v.region, state: v.state, city: v.city, coords: v.coords }
}

// ── Venues ────────────────────────────────────────────────────────────────────
// Approximate city-center coordinates (lat/lng) for future Map screen.
const V = {
  // West (CA / NV)
  oakland:      { country: 'US', region: 'west',           state: 'CA', city: 'Oakland',      coords: { lat: 37.8,  lng: -122.3 } },
  losAngeles:   { country: 'US', region: 'west',           state: 'CA', city: 'Los Angeles',  coords: { lat: 34.1,  lng: -118.2 } },
  lasVegas:     { country: 'US', region: 'west',           state: 'NV', city: 'Las Vegas',    coords: { lat: 36.2,  lng: -115.1 } },
  // Northwest (WA / OR)
  seattle:      { country: 'US', region: 'northwest',      state: 'WA', city: 'Seattle',      coords: { lat: 47.6,  lng: -122.3 } },
  portland:     { country: 'US', region: 'northwest',      state: 'OR', city: 'Portland',     coords: { lat: 45.5,  lng: -122.7 } },
  // Midwest (IL / MI / MN / IN)
  chicago:      { country: 'US', region: 'midwest',        state: 'IL', city: 'Chicago',      coords: { lat: 41.9,  lng:  -87.6 } },
  detroit:      { country: 'US', region: 'midwest',        state: 'MI', city: 'Detroit',      coords: { lat: 42.3,  lng:  -83.0 } },
  minneapolis:  { country: 'US', region: 'midwest',        state: 'MN', city: 'Minneapolis',  coords: { lat: 44.9,  lng:  -93.2 } },
  bloomington:  { country: 'US', region: 'midwest',        state: 'IN', city: 'Bloomington',  coords: { lat: 40.5,  lng:  -88.9 } },
  // Northeast (NY / NJ / MA / PA)
  newYork:      { country: 'US', region: 'northeast',      state: 'NY', city: 'New York',     coords: { lat: 40.7,  lng:  -74.0 } },
  newark:       { country: 'US', region: 'northeast',      state: 'NJ', city: 'Newark',       coords: { lat: 40.7,  lng:  -74.2 } },
  boston:       { country: 'US', region: 'northeast',      state: 'MA', city: 'Boston',       coords: { lat: 42.4,  lng:  -71.1 } },
  philadelphia: { country: 'US', region: 'northeast',      state: 'PA', city: 'Philadelphia', coords: { lat: 39.9,  lng:  -75.2 } },
  // South (GA / TX / FL / VA)
  atlanta:      { country: 'US', region: 'south',          state: 'GA', city: 'Atlanta',      coords: { lat: 33.7,  lng:  -84.4 } },
  houston:      { country: 'US', region: 'south',          state: 'TX', city: 'Houston',      coords: { lat: 29.7,  lng:  -95.4 } },
  austin:       { country: 'US', region: 'south',          state: 'TX', city: 'Austin',       coords: { lat: 30.3,  lng:  -97.7 } },
  orlando:      { country: 'US', region: 'south',          state: 'FL', city: 'Orlando',      coords: { lat: 28.5,  lng:  -81.4 } },
  richmond:     { country: 'US', region: 'south',          state: 'VA', city: 'Richmond',     coords: { lat: 37.5,  lng:  -77.4 } },
  // Southwest (AZ / CO)
  phoenix:      { country: 'US', region: 'southwest',      state: 'AZ', city: 'Phoenix',      coords: { lat: 33.4,  lng: -112.1 } },
  denver:       { country: 'US', region: 'southwest',      state: 'CO', city: 'Denver',       coords: { lat: 39.7,  lng: -104.9 } },
  // Western Canada (BC / AB)
  vancouver:    { country: 'CA', region: 'western_canada', state: 'BC', city: 'Vancouver',    coords: { lat: 49.2,  lng: -123.1 } },
  calgary:      { country: 'CA', region: 'western_canada', state: 'AB', city: 'Calgary',      coords: { lat: 51.0,  lng: -114.1 } },
  // Eastern Canada (ON / QC)
  toronto:      { country: 'CA', region: 'eastern_canada', state: 'ON', city: 'Toronto',      coords: { lat: 43.7,  lng:  -79.4 } },
  montreal:     { country: 'CA', region: 'eastern_canada', state: 'QC', city: 'Montreal',     coords: { lat: 45.5,  lng:  -73.6 } },
} satisfies Record<string, Venue>

// ── Event templates ──────────────────────────────────────────────────────────

interface EventDef {
  name: string
  tier: TournamentTier
  region: TournamentRegion
  week: number
  location: VenueLocation
  entrants: number
  prizePool: number
  entryFee: number
}

function ev(
  name: string,
  tier: TournamentTier,
  week: number,
  venue: Venue,
  entrants: number,
  prizePool: number,
  entryFee: number,
): EventDef {
  return { name, tier, region: venue.region, week, location: vl(venue), entrants, prizePool, entryFee }
}

// ── Supermajors ───────────────────────────────────────────────────────────────
// 4 US flagship events, roughly quarterly

const SUPERMAJORS: EventDef[] = [
  ev('Genesis XII',      'supermajor', 8,  V.oakland,  1024, 75000, 75),
  ev('Apex 2024',        'supermajor', 21, V.newark,   1024, 60000, 70),
  ev('The Big House XI', 'supermajor', 34, V.detroit,  1200, 80000, 80),
  ev('Shine 2024',       'supermajor', 47, V.boston,   1024, 65000, 70),
]

// ── Majors ────────────────────────────────────────────────────────────────────
// 8 US + 1 Canadian major

const MAJORS: EventDef[] = [
  ev('Catalyst',         'major',  4,  V.losAngeles,  512, 20000, 60),
  ev('Frostbite',        'major', 12,  V.minneapolis, 512, 18000, 55),
  ev('Full Bloom',       'major', 16,  V.bloomington, 512, 15000, 50),
  ev('Northern Lights',  'major', 33,  V.toronto,     512, 18000, 55),  // Canadian major
  ev('Riptide',          'major', 25,  V.atlanta,     640, 22000, 60),
  ev('Smash Factor',     'major', 29,  V.houston,     512, 18000, 55),
  ev('Nightclub',        'major', 38,  V.chicago,     512, 20000, 55),
  ev('Mainstage',        'major', 42,  V.losAngeles,  640, 22000, 60),
  ev('Summit',           'major', 50,  V.lasVegas,    512, 25000, 60),
]

// ── Regionals ─────────────────────────────────────────────────────────────────
// 16 US + 4 Canadian regionals

const REGIONALS: EventDef[] = [
  // US regionals
  ev('Pacific Rising',          'regional',  2,  V.losAngeles,   192, 3200, 30),
  ev('Emerald City Classic',    'regional',  6,  V.seattle,      160, 2800, 25),
  ev('Triforce Tournament',     'regional', 10,  V.newYork,      224, 4000, 30),
  ev('Heartland Havoc',         'regional', 14,  V.chicago,      192, 3500, 30),
  ev('Lone Star Throwdown',     'regional', 18,  V.austin,       160, 2800, 25),
  ev('Liberty Bell Brawl',      'regional', 19,  V.philadelphia, 128, 2400, 25),
  ev('Summer Stockade',         'regional', 23,  V.orlando,      256, 5000, 35),
  ev('Mountain Melee',          'regional', 27,  V.denver,       128, 2400, 25),
  ev('Desert Heat',             'regional', 31,  V.phoenix,      192, 3200, 30),
  ev('Rose City Ruckus',        'regional', 32,  V.portland,     128, 2200, 25),
  ev('Capital Clash',           'regional', 36,  V.richmond,     160, 3000, 30),
  ev('Great Lakes Open',        'regional', 40,  V.detroit,      192, 3500, 30),
  ev('Autumn Assault',          'regional', 44,  V.chicago,      224, 4000, 30),
  ev('Gulf Coast Gauntlet',     'regional', 46,  V.houston,      128, 2400, 25),
  ev('Northeast Championship',  'regional', 49,  V.newYork,      256, 5000, 35),
  ev('Winter Wavedash',         'regional', 52,  V.seattle,      160, 2800, 25),
  // Canadian regionals
  ev('Cascadia Cup',            'regional',  5,  V.vancouver,    128, 2200, 25),  // Western Canada — spring
  ev('Prairie Thunder',         'regional', 22,  V.calgary,      96,  1800, 20),  // Western Canada — summer
  ev('Great White North Open',  'regional', 37,  V.toronto,      160, 3000, 30),  // Eastern Canada — fall
  ev('La Belle Province',       'regional', 45,  V.montreal,     128, 2400, 25),  // Eastern Canada — fall
]

// ── Local series ─────────────────────────────────────────────────────────────
// Recurring weekly events; each series runs roughly every 3–4 weeks.

interface LocalSeries {
  name: string
  venue: Venue
  baseEntrants: number
  entryFee: number
  weeks: number[]
}

const LOCAL_SERIES: LocalSeries[] = [
  // US series
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
  // Canadian series
  {
    name: 'Pacific Brawl Night',
    venue: V.vancouver,
    baseEntrants: 28,
    entryFee: 5,
    weeks: [3, 8, 13, 18, 24, 29, 34, 39, 44, 50],
  },
  {
    name: 'Toronto Tilt',
    venue: V.toronto,
    baseEntrants: 32,
    entryFee: 5,
    weeks: [4, 9, 15, 21, 26, 31, 36, 41, 46, 51],
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
      const entrantVariation = ((week * 7) % 5) * 4 - 8  // deterministic ±range
      const entrants = Math.max(16, series.baseEntrants + entrantVariation)
      events.push({
        id: `t${nextId++}`,
        name: `${series.name} #${edition++}`,
        tier: 'local' as const,
        region: series.venue.region,
        week,
        location: vl(series.venue),
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

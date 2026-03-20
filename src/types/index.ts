export type Character =
  | 'Fox'
  | 'Falco'
  | 'Marth'
  | 'Sheik'
  | 'Jigglypuff'
  | 'Peach'
  | 'Captain Falcon'
  | 'Ice Climbers'
  | 'Samus'
  | 'Pikachu'
  | 'Luigi'
  | 'Young Link'
  | 'Dr. Mario'
  | 'Ganondorf'
  | 'Donkey Kong'

export type WeekActivity = 'train' | 'rest' | 'local' | 'prep'

export interface PlayerStats {
  execution: number   // technical skill: L-cancels, waveshines, combos (0–100)
  neutral: number     // footsies, spacing, reads (0–100)
  mental: number      // tilt resistance, pressure handling (0–100)
  adaptability: number // mid-set adjustment (0–100)
}

export interface Player {
  id: string
  name: string
  tag: string          // player handle e.g. "Mango", "Armada"
  character: Character
  stats: PlayerStats
  form: number         // current peak condition 0–100 (fluctuates)
  fatigue: number      // 0–100, high = worse performance
  salary: number       // weekly cost in dollars
  weekActivity: WeekActivity
  wins: number
  losses: number
  reputation: number   // 0–100, grows with results
}

export type TournamentTier = 'local' | 'regional' | 'major' | 'supermajor'

// Broad scene circuits — US regions + Canadian regions
export type TournamentRegion =
  | 'west'
  | 'northwest'
  | 'midwest'
  | 'northeast'
  | 'south'
  | 'southwest'
  | 'western_canada'
  | 'eastern_canada'

export type Country = 'US' | 'CA'

// Structured location — full Country → Region → Province/State → City hierarchy
export interface VenueLocation {
  country: Country
  region: TournamentRegion
  state: string   // state or province abbreviation (e.g. "CA", "ON", "BC")
  city: string
  coords: { lat: number; lng: number }  // approximate city center — used by future Map screen
}

export interface Tournament {
  id: string
  name: string
  tier: TournamentTier
  region: TournamentRegion
  week: number         // which game week it occurs
  location: VenueLocation
  entrants: number     // estimated field size
  prizePool: number    // total prize pool in dollars
  entryFee: number     // per player
  registeredPlayers: string[] // player ids
  results?: TournamentResult[]
}

export interface TournamentResult {
  playerId: string
  placement: number
  prizeEarned: number
  setsWon: number
  setsLost: number
}

export type SetNarrative = 'dominant' | 'comfortable' | 'close' | 'upset' | 'reverse_sweep'

export interface SetResult {
  win: boolean
  playerScore: number
  opponentScore: number
  narrative: SetNarrative
  opponentTag: string
  opponentCharacter: Character
  opponentSeed: number   // bracket seed of the opponent (1 = strongest)
  isBo5: boolean
  round: string
}

export interface PlayerTournamentResult {
  playerId: string
  placement: number
  prizeEarned: number
  setsWon: number
  setsLost: number
  setHistory: SetResult[]
  repGained: number
}

export interface TournamentReport {
  tournamentId: string
  tournamentName: string
  tier: TournamentTier
  playerResults: PlayerTournamentResult[]
}

export interface NPC {
  tag: string
  character: Character
  rating: number
}

export interface Team {
  id: string
  name: string
  tag: string          // team abbreviation
  balance: number      // current bank balance
  reputation: number   // overall org reputation
  week: number         // current game week (1-indexed)
}

// ── Finances ledger ───────────────────────────────────────────────────────────

export type LedgerEntryType = 'salary' | 'prize' | 'entry_fee' | 'refund' | 'sponsor'

// ── Free agency ───────────────────────────────────────────────────────────────

export interface FreeAgent {
  id: string
  name: string
  tag: string
  character: Character
  stats: PlayerStats
  form: number         // 0–100
  fatigue: number      // 0–100
  salaryAsk: number    // weekly salary demand in dollars
  reputation: number   // 0–100
}

// ── Sponsorships ─────────────────────────────────────────────────────────────

export type SponsorTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Sponsor {
  id: string
  name: string
  tier: SponsorTier
  repRequired: number   // minimum team.reputation to unlock
  weeklyIncome: number
  description: string   // flavor + mechanical bonus description
  color: string         // brand accent hex
}

export interface LedgerEntry {
  week: number
  type: LedgerEntryType
  amount: number       // positive = income, negative = expense
  description: string  // e.g. "Prize — Cipher 1st @ Genesis XII"
}

export interface GameState {
  team: Team
  players: Player[]
  freeAgents: FreeAgent[]
  activeSponsors: string[]     // up to 2 active sponsor IDs
  tournaments: Tournament[]
  pastResults: TournamentResult[]
  rankings: RankingEntry[]
  pendingReport: TournamentReport | null
  screen: Screen
  ledger: LedgerEntry[]
}

export type Screen =
  | 'dashboard' | 'roster' | 'training' | 'finances'
  | 'schedule' | 'rankings'
  | 'map' | 'scouting' | 'market' | 'sponsorships' | 'history'

// ── Ranking system ────────────────────────────────────────────────────────────

// A single tournament result recorded for ranking purposes
export interface RankingResult {
  tournamentId: string
  tournamentName: string
  tier: TournamentTier
  placement: number
  basePoints: number   // points before decay
  earnedAtWeek: number
}

// A player's current standing in the scene ranking
export interface RankingEntry {
  playerId: string
  tag: string
  character: Character
  points: number         // current total (sum of decayed results)
  rank: number           // 1-indexed position
  trend: 'up' | 'down' | 'stable'  // vs previous calculation
  recentResults: RankingResult[]
}

// ── Movement / stage positioning ─────────────────────────────────────────────

// Simplified stage zones — where a player is relative to the blast zone
export type StagePosition = 'center' | 'edge' | 'offstage'

// What a player does during a movement tick before engagement
export type MovementOption = 'approach' | 'retreat' | 'platform' | 'camp'

// ── Attack / Shield / Grab triangle framework ─────────────────────────────────

// The three fundamental combat options in SSBM neutral + dodge
export type CombatOption = 'attack' | 'shield' | 'grab' | 'dodge'

// Tracks how often an opponent chooses each option (for adaptability reads)
export interface OptionTendencies {
  attack: number    // frequency 0–1
  shield: number
  grab: number
  dodge: number
}

// Outcome of a single neutral exchange
export type ExchangeResult = 'player_wins' | 'opponent_wins' | 'neutral'

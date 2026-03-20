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

// Broad US regional circuits — used for scene filtering and rep tracking
export type TournamentRegion = 'west' | 'northwest' | 'midwest' | 'northeast' | 'south' | 'southwest'

export interface Tournament {
  id: string
  name: string
  tier: TournamentTier
  region: TournamentRegion
  week: number         // which game week it occurs
  location: string     // "City, ST" format (e.g. "Oakland, CA")
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

export interface GameState {
  team: Team
  players: Player[]
  tournaments: Tournament[]
  pastResults: TournamentResult[]
  rankings: RankingEntry[]
  pendingReport: TournamentReport | null
  screen: Screen
}

export type Screen = 'dashboard' | 'roster' | 'schedule' | 'rankings' | 'training' | 'finances'

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

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

export interface Tournament {
  id: string
  name: string
  tier: TournamentTier
  week: number         // which game week it occurs
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
  pendingReport: TournamentReport | null
  screen: Screen
}

export type Screen = 'dashboard' | 'roster' | 'schedule' | 'training' | 'finances'

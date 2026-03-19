import type {
  Tournament,
  Player,
  TournamentReport,
  PlayerTournamentResult,
  RankingEntry,
} from '../types'
import { calcEPR } from './rating'
import { simulateSet } from './setSimulator'
import { getNPCPool, drawOpponent } from './npcs'
import { seedingAdvantage } from './ranking'

// Prize distribution ratios by placement bracket.
// Reflects standard SSBM double-elimination payout structure.
const PRIZE_RATIOS: { upTo: number; ratio: number }[] = [
  { upTo: 1,  ratio: 0.33 },
  { upTo: 2,  ratio: 0.18 },
  { upTo: 3,  ratio: 0.11 },
  { upTo: 4,  ratio: 0.07 },
  { upTo: 6,  ratio: 0.04 },
  { upTo: 8,  ratio: 0.025 },
  { upTo: 12, ratio: 0.01 },
  { upTo: 16, ratio: 0.005 },
]

function getPrize(placement: number, prizePool: number): number {
  for (const bracket of PRIZE_RATIOS) {
    if (placement <= bracket.upTo) {
      return Math.floor(prizePool * bracket.ratio)
    }
  }
  return 0
}

// Map a placement to reputation gained.
// Tier multiplier rewards deep runs at bigger events.
const TIER_REP_MULT: Record<string, number> = {
  local: 0.5,
  regional: 1.0,
  major: 2.0,
  supermajor: 3.5,
}

function getRepGained(placement: number, entrants: number, tier: string): number {
  // Percentile from top — placing top 1% at a supermajor is massive
  const percentile = 1 - (placement - 1) / entrants
  const rawRep = percentile * 15 * (TIER_REP_MULT[tier] ?? 1.0)
  return Math.round(Math.max(0, rawRep))
}

// Round name labels for set history display
function roundName(roundIndex: number, totalRounds: number, side: 'winners' | 'losers'): string {
  if (side === 'winners') {
    if (roundIndex === totalRounds - 1) return 'Grand Finals'
    if (roundIndex === totalRounds - 2) return 'Winners Finals'
    if (roundIndex === totalRounds - 3) return 'Winners Semis'
    return `Winners Round ${roundIndex + 1}`
  } else {
    if (roundIndex === totalRounds - 1) return 'Grand Finals'
    if (roundIndex === totalRounds - 2) return 'Losers Finals'
    if (roundIndex === totalRounds - 3) return 'Losers Semis'
    return `Losers Round ${roundIndex + 1}`
  }
}

// Approximate placement from wins/losses in double-elim.
// Standard SSBM placements: 1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49...
function calcPlacement(winnersWins: number, losersWins: number, bracketSize: number): number {
  const totalRounds = Math.log2(bracketSize)

  if (winnersWins + losersWins >= totalRounds * 2 - 1) return 1 // approximation for GF winner
  if (winnersWins + losersWins >= totalRounds * 2 - 2) return 2

  // Work backwards from how many total wins before double-elimination
  const totalWins = winnersWins + losersWins
  if (totalWins >= totalRounds + 2) return 3
  if (totalWins >= totalRounds + 1) return 4
  if (totalWins >= totalRounds)     return 5
  if (totalWins >= totalRounds - 1) return 7
  if (totalWins >= totalRounds - 2) return 9
  if (totalWins >= totalRounds - 3) return 13
  if (totalWins >= totalRounds - 4) return 17
  if (totalWins >= totalRounds - 5) return 25
  if (totalWins >= totalRounds - 6) return 33
  if (totalWins >= 1)               return Math.ceil(bracketSize * 0.66)
  return bracketSize  // lost first match without winning anything
}

// How much fatigue a tournament adds (on top of normal week activity effects)
const TOURNAMENT_FATIGUE: Record<string, number> = {
  local: 18,
  regional: 28,
  major: 38,
  supermajor: 50,
}

/**
 * Simulates a player's full run through a double-elimination tournament.
 * Returns placement, set history, prize, and rep gained.
 *
 * @param seedMult - bracket seeding advantage (0.65–1.0 from seedingAdvantage())
 *   A top seed faces weaker opponents in early rounds, reflecting bracket protection.
 */
function simulatePlayerRun(
  player: Player,
  tournament: Tournament,
  bracketSize: number,
  seedMult: number,
): PlayerTournamentResult {
  const epr = calcEPR(player)
  const totalRounds = Math.log2(bracketSize)
  const npcPool = getNPCPool(tournament.tier)
  const isBo5Threshold = Math.ceil(totalRounds) - 2  // top 8 rounds are Bo5

  const setHistory: ReturnType<typeof simulateSet>[] = []
  let winnersWins = 0
  let losersWins = 0
  let inLosers = false
  let eliminated = false

  // Average field EPR for this tier (calibrates opponent strength by round)
  const fieldStrengthMap: Record<string, number> = {
    local: 55, regional: 80, major: 110, supermajor: 140,
  }
  const avgFieldEPR = fieldStrengthMap[tournament.tier] ?? 80

  while (!eliminated) {
    const currentRound = inLosers ? losersWins : winnersWins

    // Opponent gets stronger in later rounds; early rounds softened for seeded players
    const roundProgressRatio = currentRound / totalRounds
    // seedMult applies only in first half of bracket — deep runs face top seeds regardless
    const earlyRoundFactor = roundProgressRatio < 0.5 ? seedMult : 1.0
    const opponentTargetRating = avgFieldEPR * (0.7 + roundProgressRatio * 0.7) * earlyRoundFactor
    const opponent = drawOpponent(npcPool, opponentTargetRating)

    const isBo5 = currentRound >= isBo5Threshold
    const side: 'winners' | 'losers' = inLosers ? 'losers' : 'winners'

    const result = simulateSet({
      playerEPR: epr,
      playerStats: player.stats,
      playerCharacter: player.character,
      opponentEPR: opponent.rating,
      opponentAdaptability: 50,  // NPC adaptability — baseline
      opponentCharacter: opponent.character,
      opponentTag: opponent.tag,
      isBo5,
      round: roundName(currentRound, totalRounds, side),
    })

    setHistory.push(result)

    if (result.win) {
      if (inLosers) losersWins++
      else winnersWins++
    } else {
      if (inLosers) {
        eliminated = true
      } else {
        inLosers = true
      }
    }

    // Safety cap — shouldn't run more than ~20 sets in a real bracket
    if (setHistory.length >= 20) break
  }

  const setsWon = setHistory.filter((s) => s.win).length
  const setsLost = setHistory.filter((s) => !s.win).length
  const placement = calcPlacement(winnersWins, losersWins, bracketSize)
  const prizeEarned = getPrize(placement, tournament.prizePool)
  const repGained = getRepGained(placement, tournament.entrants, tournament.tier)

  return {
    playerId: player.id,
    placement,
    prizeEarned,
    setsWon,
    setsLost,
    setHistory,
    repGained,
  }
}

/**
 * Simulates a full tournament for all registered players.
 * Returns a TournamentReport with results for each player.
 *
 * Also returns the per-player fatigue cost so the store can apply it,
 * and flat TournamentResult records to write back onto the tournament object
 * (required for ranking calculations).
 *
 * @param rankings - current ranking table; used to determine bracket seeding
 */
export interface SimulationOutput {
  report: TournamentReport
  fatigueCosts: Record<string, number>   // playerId → fatigue added
  tournamentResults: import('../types').TournamentResult[]  // for tournament.results
}

export function simulateTournament(
  tournament: Tournament,
  players: Player[],
  rankings: RankingEntry[],
): SimulationOutput {
  const registeredPlayers = players.filter((p) =>
    tournament.registeredPlayers.includes(p.id)
  )

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(tournament.entrants)))

  const playerResults: PlayerTournamentResult[] = registeredPlayers.map((p) => {
    const rankEntry = rankings.find((r) => r.playerId === p.id)
    const seedMult = seedingAdvantage(rankEntry?.rank, rankings.length)
    return simulatePlayerRun(p, tournament, bracketSize, seedMult)
  })

  const fatigueCosts: Record<string, number> = {}
  registeredPlayers.forEach((p) => {
    fatigueCosts[p.id] = TOURNAMENT_FATIGUE[tournament.tier] ?? 20
  })

  const tournamentResults = playerResults.map((r) => ({
    playerId: r.playerId,
    placement: r.placement,
    prizeEarned: r.prizeEarned,
    setsWon: r.setsWon,
    setsLost: r.setsLost,
  }))

  return {
    report: {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      tier: tournament.tier,
      playerResults,
    },
    fatigueCosts,
    tournamentResults,
  }
}

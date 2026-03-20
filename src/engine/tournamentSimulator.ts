import type {
  Tournament,
  Player,
  TournamentReport,
  PlayerTournamentResult,
  RankingEntry,
  NPC,
} from '../types'
import { calcEPR } from './rating'
import { simulateSet } from './setSimulator'
import { getNPCPool, drawOpponent } from './npcs'

// ── Prize distribution ───────────────────────────────────────────────────────

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
    if (placement <= bracket.upTo) return Math.floor(prizePool * bracket.ratio)
  }
  return 0
}

// ── Reputation ───────────────────────────────────────────────────────────────

const TIER_REP_MULT: Record<string, number> = {
  local: 0.5, regional: 1.0, major: 2.0, supermajor: 3.5,
}

function getRepGained(placement: number, entrants: number, tier: string): number {
  const percentile = 1 - (placement - 1) / entrants
  return Math.round(Math.max(0, percentile * 15 * (TIER_REP_MULT[tier] ?? 1.0)))
}

// ── Round naming ─────────────────────────────────────────────────────────────

function roundName(roundIndex: number, totalRounds: number, side: 'winners' | 'losers'): string {
  if (side === 'winners') {
    if (roundIndex === totalRounds - 1) return 'Grand Finals'
    if (roundIndex === totalRounds - 2) return 'Winners Finals'
    if (roundIndex === totalRounds - 3) return 'Winners Semis'
    if (roundIndex === totalRounds - 4) return 'Winners Quarters'
    return `Winners Round ${roundIndex + 1}`
  }
  if (roundIndex === totalRounds - 1) return 'Grand Finals'
  if (roundIndex === totalRounds - 2) return 'Losers Finals'
  if (roundIndex === totalRounds - 3) return 'Losers Semis'
  if (roundIndex === totalRounds - 4) return 'Losers Quarters'
  return `Losers Round ${roundIndex + 1}`
}

// ── Placement ────────────────────────────────────────────────────────────────

function calcPlacement(winnersWins: number, losersWins: number, bracketSize: number): number {
  const totalRounds = Math.log2(bracketSize)
  const totalWins = winnersWins + losersWins

  if (totalWins >= totalRounds * 2 - 1) return 1
  if (totalWins >= totalRounds * 2 - 2) return 2
  if (totalWins >= totalRounds + 2) return 3
  if (totalWins >= totalRounds + 1) return 4
  if (totalWins >= totalRounds)     return 5
  if (totalWins >= totalRounds - 1) return 7
  if (totalWins >= totalRounds - 2) return 9
  if (totalWins >= totalRounds - 3) return 13
  if (totalWins >= totalRounds - 4) return 17
  if (totalWins >= totalRounds - 5) return 25
  if (totalWins >= totalRounds - 6) return 33
  if (totalWins >= 1) return Math.ceil(bracketSize * 0.66)
  return bracketSize
}

// ── Tournament fatigue ───────────────────────────────────────────────────────

const TOURNAMENT_FATIGUE: Record<string, number> = {
  local: 18, regional: 28, major: 38, supermajor: 50,
}

// ── Bracket field generation ─────────────────────────────────────────────────
//
// Pre-generates the full NPC field for a tournament, sorted by rating.
// Seed 1 = highest rating. This field is used to select bracket-appropriate
// opponents each round instead of drawing randomly per round.

const FIELD_STRENGTH: Record<string, number> = {
  local: 55, regional: 80, major: 110, supermajor: 140,
}

interface SeededNPC extends NPC {
  seed: number
}

function generateBracketField(pool: NPC[], bracketSize: number, avgFieldEPR: number): SeededNPC[] {
  const field: NPC[] = []
  for (let i = 0; i < bracketSize; i++) {
    // Spread targets across the field: top seeds near avgFieldEPR * 1.6, bottom near avgFieldEPR * 0.4
    const percentile = (bracketSize - i) / bracketSize
    const targetRating = avgFieldEPR * (0.4 + percentile * 1.2)
    field.push(drawOpponent(pool, targetRating))
  }

  // Sort descending — seed 1 is the strongest NPC
  field.sort((a, b) => b.rating - a.rating)

  return field.map((npc, idx) => ({ ...npc, seed: idx + 1 }))
}

/**
 * Determines the player's bracket seed based on their EPR relative to the field.
 * A higher-ranked player gets a better seed (lower number).
 */
function calcPlayerSeed(
  playerEPR: number,
  bracketField: SeededNPC[],
  rankEntry: RankingEntry | undefined,
): number {
  // Ranking bonus: established players get a modest seeding boost
  const rankBonus = rankEntry ? Math.max(0, 20 - rankEntry.rank) * 0.8 : 0
  const effective = playerEPR + rankBonus
  const seed = bracketField.filter(npc => npc.rating > effective).length + 1
  return Math.max(1, Math.min(bracketField.length, seed))
}

// ── Bracket opponent selection ───────────────────────────────────────────────
//
// Standard bracket fold: in each round, top seeds face bottom seeds.
//   Round 0: seed K faces seed (N+1-K)
//   Round R: seed K faces seed (N/2^R + 1 - K) within the reduced pool
// In losers bracket, opponents are mid-range seeds that get stronger each round.

function getSeededOpponent(
  bracketField: SeededNPC[],
  playerSeed: number,
  round: number,
  bracketSize: number,
  inLosers: boolean,
): SeededNPC {
  let oppSeed: number

  if (!inLosers) {
    // Winners bracket: standard fold — top seed meets bottom, progressively harder
    const poolAtRound = Math.ceil(bracketSize / Math.pow(2, round))
    oppSeed = Math.max(1, poolAtRound + 1 - playerSeed)
  } else {
    // Losers bracket: face progressively stronger opponents
    // Early losers rounds face fellow losers (mid-seeds); deeper rounds face winners dropouts
    const depth = round + 1
    oppSeed = Math.max(1, Math.ceil(bracketSize / Math.pow(2, depth)) + playerSeed)
  }

  // Clamp to valid bracket position
  const idx = Math.min(bracketField.length - 1, Math.max(0, oppSeed - 1))
  return bracketField[idx]
}

// ── Player bracket run ───────────────────────────────────────────────────────

function simulatePlayerRun(
  player: Player,
  tournament: Tournament,
  bracketSize: number,
  bracketField: SeededNPC[],
  playerSeed: number,
): PlayerTournamentResult {
  const epr = calcEPR(player)
  const totalRounds = Math.log2(bracketSize)
  const isBo5Threshold = Math.ceil(totalRounds) - 2  // top-8 rounds are Bo5

  const setHistory: ReturnType<typeof simulateSet>[] = []
  let winnersWins = 0
  let losersWins = 0
  let inLosers = false
  let eliminated = false

  while (!eliminated) {
    const currentRound = inLosers ? losersWins : winnersWins

    const opponent = getSeededOpponent(bracketField, playerSeed, currentRound, bracketSize, inLosers)

    const isBo5 = currentRound >= isBo5Threshold
    const side: 'winners' | 'losers' = inLosers ? 'losers' : 'winners'

    const result = simulateSet({
      playerEPR: epr,
      playerStats: player.stats,
      playerCharacter: player.character,
      opponentEPR: opponent.rating,
      opponentAdaptability: 50,
      opponentCharacter: opponent.character,
      opponentTag: opponent.tag,
      opponentSeed: opponent.seed,
      isBo5,
      round: roundName(currentRound, totalRounds, side),
    })

    setHistory.push(result)

    if (result.win) {
      if (inLosers) losersWins++
      else winnersWins++
    } else {
      if (inLosers) eliminated = true
      else inLosers = true
    }

    // Safety cap
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

// ── Public API ───────────────────────────────────────────────────────────────

export interface SimulationOutput {
  report: TournamentReport
  fatigueCosts: Record<string, number>
  tournamentResults: import('../types').TournamentResult[]
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
  const avgFieldEPR = FIELD_STRENGTH[tournament.tier] ?? 80
  const npcPool = getNPCPool(tournament.tier)

  // Pre-generate the full bracket field once — all players share this bracket
  const bracketField = generateBracketField(npcPool, bracketSize, avgFieldEPR)

  const playerResults: PlayerTournamentResult[] = registeredPlayers.map((p) => {
    const rankEntry = rankings.find((r) => r.playerId === p.id)
    const playerSeed = calcPlayerSeed(calcEPR(p), bracketField, rankEntry)
    return simulatePlayerRun(p, tournament, bracketSize, bracketField, playerSeed)
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

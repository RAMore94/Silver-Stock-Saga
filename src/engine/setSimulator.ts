import type { Character, SetResult, SetNarrative } from '../types'
import { calcWinProbability } from './rating'
import { getMatchupAdvantage } from './matchups'

/**
 * Ice Climbers handoff mechanic.
 * Handoffs are the modern replacement for wobbling — they can chain into
 * near-0-deaths at the ledge but give the opponent a directional mixup
 * during the throw. High execution = reliable chain. Opponent adaptability
 * determines escape probability on the directional guess.
 *
 * Returns a game-win probability modifier (+/- applied to base winProb).
 */
function calcICsHandoffModifier(
  icExecution: number,
  opponentAdaptability: number
): number {
  // Probability a handoff attempt is executed cleanly
  const handoffReliability = Math.max(0, (icExecution - 50) / 50) // 0 at exec=50, 1.0 at exec=100

  // Opponent escape probability on the directional mixup (50/50 base, reduced by ICs execution)
  // Higher opponent adaptability = better guess on the directional
  const escapeChance = 0.5 - handoffReliability * 0.3 + (opponentAdaptability / 100) * 0.15
  const convertChance = Math.max(0.1, Math.min(0.9, 1 - escapeChance))

  // Expected value: successful handoff = big swing (+0.25 game-win prob boost)
  // Failed handoff (escaped) = small penalty (-0.08, now ICs are offstage chasing)
  const ev = handoffReliability * (convertChance * 0.25 - (1 - convertChance) * 0.08)

  return ev  // typically +0.0 to +0.18 bonus to win probability
}

/**
 * Simulate a single game (not a full set) between two players.
 * Returns true if player A wins.
 *
 * mentalA affects variance: lower mental = more swing around the base probability.
 */
function simulateGame(
  winProb: number,
  mentalA: number,
  isICsPlayer: boolean,
  icExecution: number,
  opponentAdaptability: number
): boolean {
  let effectiveProb = winProb

  // Mental variance: low mental adds noise, high mental plays to their true level
  const mentalVariance = (1 - mentalA / 100) * 0.15
  const noise = (Math.random() - 0.5) * 2 * mentalVariance
  effectiveProb = Math.max(0.02, Math.min(0.98, effectiveProb + noise))

  // ICs handoff modifier
  if (isICsPlayer) {
    const handoffMod = calcICsHandoffModifier(icExecution, opponentAdaptability)
    effectiveProb = Math.min(0.98, effectiveProb + handoffMod)
  }

  return Math.random() < effectiveProb
}

/**
 * Derive a narrative tag from the set result and rating context.
 */
function deriveNarrative(
  playerScore: number,
  opponentScore: number,
  epDiff: number,   // player EPR - opponent EPR (positive = player stronger)
  wasDown: boolean  // player fell behind 0-2 in Bo5
): SetNarrative {
  const won = playerScore > opponentScore
  const gamesPlayed = playerScore + opponentScore
  const maxGames = Math.max(playerScore, opponentScore) === 2 ? 3 : 5

  if (!won && epDiff > 12) return 'upset'          // player was the favorite but lost
  if (won && wasDown && maxGames === 5) return 'reverse_sweep'  // came back from 0-2
  if (gamesPlayed === maxGames) return 'close'      // went to last game
  if (won && epDiff > 15 && playerScore > 0 && opponentScore === 0) return 'dominant'
  if (won) return 'comfortable'
  return 'close'
}

export interface SimSetParams {
  playerEPR: number
  playerMental: number
  playerCharacter: Character
  playerExecution: number
  opponentEPR: number
  opponentAdaptability: number
  opponentCharacter: Character
  opponentTag: string
  isBo5: boolean
  round: string
}

/**
 * Simulates a full set (Bo3 or Bo5) and returns the result.
 */
export function simulateSet(params: SimSetParams): SetResult {
  const {
    playerEPR, playerMental, playerCharacter, playerExecution,
    opponentEPR, opponentAdaptability, opponentCharacter, opponentTag,
    isBo5, round,
  } = params

  const matchupAdv = getMatchupAdvantage(playerCharacter, opponentCharacter)
  const baseWinProb = calcWinProbability(playerEPR, opponentEPR, matchupAdv)
  const isICs = playerCharacter === 'Ice Climbers'
  const targetScore = isBo5 ? 3 : 2
  const epDiff = playerEPR - opponentEPR

  let playerScore = 0
  let opponentScore = 0
  let wasDown02 = false

  while (playerScore < targetScore && opponentScore < targetScore) {
    // Track if player fell behind 0-2 in Bo5 for reverse sweep detection
    if (isBo5 && playerScore === 0 && opponentScore === 2) wasDown02 = true

    // Adaptability mid-set adjustment: as sets go longer, adaptability shifts probability
    // Opponent also adapts — modeled as slight regression toward 50% over games
    const gamesPlayed = playerScore + opponentScore
    const adaptShift = gamesPlayed > 1 ? (opponentAdaptability - 50) / 100 * 0.03 : 0
    const adjustedProb = Math.max(0.02, Math.min(0.98, baseWinProb - adaptShift))

    const won = simulateGame(adjustedProb, playerMental, isICs, playerExecution, opponentAdaptability)
    if (won) playerScore++
    else opponentScore++
  }

  const win = playerScore === targetScore
  const narrative = deriveNarrative(playerScore, opponentScore, epDiff, wasDown02)

  return {
    win,
    playerScore,
    opponentScore,
    narrative,
    opponentTag,
    opponentCharacter,
    isBo5,
    round,
  }
}

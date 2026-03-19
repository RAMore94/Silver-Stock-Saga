import type { Character, PlayerStats, SetResult, SetNarrative, StagePosition } from '../types'
import { getCharacterMeta } from '../data/characters'
import { getMoveProfile } from '../data/movedata'
import { getMatchupAdvantage } from './matchups'
import {
  CHARACTER_TENDENCIES,
  selectOption,
  selectMovementOption,
  resolveMovement,
  resolveOptions,
} from './neutral'

// ── Damage / kill helpers ─────────────────────────────────────────────────────

/**
 * How much % damage is dealt when a player wins a combat exchange.
 * Grab wins lead to positioning damage more than raw %; OOS punishes are smaller.
 */
function calcDamageDealt(character: Character, option: 'attack' | 'shield' | 'grab' | 'dodge'): number {
  const moves = getMoveProfile(character)
  switch (option) {
    case 'attack': return moves.avgDamagePerHit * (1 + moves.comboConvert * 0.5)
    case 'grab':   return moves.avgDamagePerHit * 0.8 + 6   // grab → follow-up, good damage
    case 'shield': return moves.avgDamagePerHit * 0.6        // OOS punish, smaller conversion
    case 'dodge':  return moves.avgDamagePerHit * 0.4        // punish whiffed dodge, small hit
  }
}

/**
 * Whether a character is killed at the given percent + position.
 *
 * Kill threshold is based on SSBM weight: heavier characters survive longer.
 * Position matters — being at the edge or offstage dramatically lowers the threshold.
 * There is a probabilistic "kill window" below the hard threshold to model early kills.
 *
 * Weight reference: Jigglypuff=60, Fox=75, Sheik=78, Marth=87, Falcon=104, DK=117
 */
function isKilled(percent: number, weight: number, position: StagePosition): boolean {
  // Base threshold: 85 is the average weight (centre of field)
  // +0.4% survivability per weight unit above average
  const base = 90 + (weight - 85) * 0.4
  const posMod = position === 'edge' ? -20 : position === 'offstage' ? -45 : 0
  const threshold = base + posMod

  // Guaranteed kill well above threshold
  if (percent >= threshold + 10) return true
  // Impossible kill well below window
  if (percent < threshold - 15) return false
  // Probabilistic kill window: linearly increasing from 0% to 100% over 25%
  return Math.random() < (percent - (threshold - 15)) / 25
}

/**
 * Moves a stage position one step in the given direction.
 *   +1 → toward centre   (offstage → edge → center)
 *   -1 → toward edge     (center → edge → offstage)
 */
function applyDelta(pos: StagePosition, delta: -1 | 0 | 1): StagePosition {
  if (delta === 0) return pos
  if (delta === 1) return pos === 'offstage' ? 'edge' : 'center'
  return pos === 'center' ? 'edge' : 'offstage'
}

// ── ICs handoff ───────────────────────────────────────────────────────────────

/**
 * Ice Climbers handoff mechanic.
 * Returns a bonus damage multiplier applied to ICs grab exchanges.
 * High execution = reliable chain; high opponent adaptability = better escape guess.
 */
function calcICsHandoffBonus(icExecution: number, opponentAdaptability: number): number {
  const reliability = Math.max(0, (icExecution - 50) / 50)
  const escapeChance = 0.5 - reliability * 0.3 + (opponentAdaptability / 100) * 0.15
  const convertChance = Math.max(0.1, Math.min(0.9, 1 - escapeChance))
  // Successful handoff ≈ near-0-death; multiply grab damage by up to 2.5×
  return reliability * convertChance * 1.5
}

// ── NPC stat inference ────────────────────────────────────────────────────────

/**
 * Infers a rough stat profile for an NPC from their EPR rating.
 * Used so NPCs can participate in the full movement + option selection system.
 */
function inferNPCStats(epr: number, adaptability: number): PlayerStats {
  const norm = Math.min(1, Math.max(0, (epr - 30) / 130))
  return {
    execution:    Math.round(norm * 70 + 25),
    neutral:      Math.round(norm * 70 + 25),
    mental:       Math.round(norm * 60 + 30),
    adaptability,
  }
}

// ── Game simulation ───────────────────────────────────────────────────────────

interface GameParams {
  playerCharacter:      Character
  playerStats:          PlayerStats
  opponentCharacter:    Character
  opponentEPR:          number
  opponentAdaptability: number
  isICsPlayer:          boolean
}

/**
 * Simulates a single game (one stock each) using the movement + combat framework.
 *
 * Each round:
 *   1. Both players pick a movement option (approach / retreat / platform / camp)
 *   2. Movement is resolved — positions update, engagement check happens
 *   3. If engaged: both pick a combat option (attack / shield / grab / dodge)
 *   4. Exchange is resolved — winner deals damage based on their character's output
 *   5. Kill check: does the hit send the opponent off stage given their % and weight?
 *
 * Returns true if the player wins the game.
 */
function simulateGame(params: GameParams): boolean {
  const { playerCharacter, playerStats, opponentCharacter, opponentEPR, opponentAdaptability, isICsPlayer } = params

  const playerWeight   = getCharacterMeta(playerCharacter).weight
  const opponentWeight = getCharacterMeta(opponentCharacter).weight
  const opponentStats  = inferNPCStats(opponentEPR, opponentAdaptability)
  const matchupAdv     = getMatchupAdvantage(playerCharacter, opponentCharacter)

  // Matchup advantage shifts the opponent's effective weight — a favourable matchup
  // means the player "converts" better, modelled as ±5 on opponent's kill threshold
  const opponentEffectiveWeight = opponentWeight - matchupAdv * 0.4

  let playerPercent   = 0
  let opponentPercent = 0
  let playerPos:   StagePosition = 'center'
  let opponentPos: StagePosition = 'center'

  // Option tendency trackers — updated as patterns are observed during the game
  const playerTend   = { ...CHARACTER_TENDENCIES[playerCharacter] }
  const opponentTend = { ...CHARACTER_TENDENCIES[opponentCharacter] }

  const MAX_ROUNDS = 40  // safety cap — games resolve well before this in practice

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const playerIsWinning   = playerPercent <= opponentPercent  // lower % = ahead
    const opponentIsWinning = !playerIsWinning

    // ── Movement phase ──────────────────────────────────────────────────────
    const playerMove = selectMovementOption(
      playerCharacter, playerPos, playerStats.neutral, playerIsWinning, playerStats.adaptability,
    )
    const opponentMove = selectMovementOption(
      opponentCharacter, opponentPos, opponentStats.neutral, opponentIsWinning, opponentAdaptability,
    )

    const movement = resolveMovement(playerMove, opponentMove, playerStats.neutral, opponentStats.neutral)

    playerPos   = applyDelta(playerPos,   movement.playerPositionDelta)
    opponentPos = applyDelta(opponentPos, movement.opponentPositionDelta)

    if (!movement.engaged) continue

    // ── Combat exchange ─────────────────────────────────────────────────────
    const playerPressure   = Math.min(1, playerPercent / 120 + movement.pressureShift)
    const opponentPressure = Math.min(1, opponentPercent / 120)

    const playerCombat   = selectOption(playerStats,   playerCharacter,   opponentTend, playerPressure)
    const opponentCombat = selectOption(opponentStats, opponentCharacter, playerTend,   opponentPressure)

    const outcome = resolveOptions(playerCombat, opponentCombat)

    if (outcome === 'player_wins') {
      let dmg = calcDamageDealt(playerCharacter, playerCombat)

      // ICs grab → apply handoff bonus
      if (isICsPlayer && playerCombat === 'grab') {
        dmg *= 1 + calcICsHandoffBonus(playerStats.execution, opponentAdaptability)
      }

      opponentPercent += dmg
      // Reduce opponent's tendency to repeat the option that just lost
      opponentTend[opponentCombat] = Math.max(
        0.05, opponentTend[opponentCombat] - (playerStats.adaptability / 100) * 0.05
      )

      // At high % a won exchange may launch opponent toward the blast zone
      if (opponentPercent > 55 && opponentPos === 'center' && Math.random() < 0.28) {
        opponentPos = 'edge'
      }

      if (isKilled(opponentPercent, opponentEffectiveWeight, opponentPos)) return true

    } else if (outcome === 'opponent_wins') {
      const dmg = calcDamageDealt(opponentCharacter, opponentCombat)
      playerPercent += dmg
      playerTend[playerCombat] = Math.max(
        0.05, playerTend[playerCombat] - (opponentAdaptability / 100) * 0.05
      )

      if (playerPercent > 55 && playerPos === 'center' && Math.random() < 0.28) {
        playerPos = 'edge'
      }

      if (isKilled(playerPercent, playerWeight, playerPos)) return false
    }
    // neutral outcome: no damage, no position shift from the exchange itself
  }

  // Timeout: lower percent is ahead (more stocks remaining in full-stock logic)
  return playerPercent <= opponentPercent
}

// ── Narrative derivation ──────────────────────────────────────────────────────

function deriveNarrative(
  playerScore: number,
  opponentScore: number,
  epDiff: number,
  wasDown02: boolean,
): SetNarrative {
  const won = playerScore > opponentScore
  const gamesPlayed = playerScore + opponentScore
  const maxGames = Math.max(playerScore, opponentScore) === 2 ? 3 : 5

  if (!won && epDiff > 12) return 'upset'
  if (won && wasDown02 && maxGames === 5) return 'reverse_sweep'
  if (gamesPlayed === maxGames) return 'close'
  if (won && epDiff > 15 && opponentScore === 0) return 'dominant'
  if (won) return 'comfortable'
  return 'close'
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface SimSetParams {
  playerEPR:            number
  playerStats:          PlayerStats
  playerCharacter:      Character
  opponentEPR:          number
  opponentAdaptability: number
  opponentCharacter:    Character
  opponentTag:          string
  isBo5:                boolean
  round:                string
}

/**
 * Simulates a full set (Bo3 or Bo5) and returns the result.
 *
 * Each game uses the movement + combat framework. Adaptability between games
 * is implicitly handled — the per-game option tendency tracking means a player
 * who loses repeatedly to the same option will start countering it.
 */
export function simulateSet(params: SimSetParams): SetResult {
  const {
    playerEPR, playerStats, playerCharacter,
    opponentEPR, opponentAdaptability, opponentCharacter,
    opponentTag, isBo5, round,
  } = params

  const targetScore = isBo5 ? 3 : 2
  const epDiff = playerEPR - opponentEPR
  const isICs = playerCharacter === 'Ice Climbers'

  const gameParams: GameParams = {
    playerCharacter,
    playerStats,
    opponentCharacter,
    opponentEPR,
    opponentAdaptability,
    isICsPlayer: isICs,
  }

  let playerScore   = 0
  let opponentScore = 0
  let wasDown02     = false

  while (playerScore < targetScore && opponentScore < targetScore) {
    if (isBo5 && playerScore === 0 && opponentScore === 2) wasDown02 = true

    const won = simulateGame(gameParams)
    if (won) playerScore++
    else     opponentScore++
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

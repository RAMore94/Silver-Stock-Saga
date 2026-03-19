/**
 * Attack / Shield / Grab framework for SSBM match simulation.
 *
 * In SSBM, every neutral interaction resolves around three core options:
 *   Attack  — an aggressive hit (SHFFL, dash attack, aerial)
 *   Shield  — blocking to absorb an incoming attack
 *   Grab    — a throw that bypasses shield entirely
 *   Dodge   — spotdodge/roll/airdodge to avoid commitment
 *
 * The rock-paper-scissors resolution:
 *   Attack > Grab   (hits opponent out of grab startup, or spaces it out)
 *   Shield > Attack (blocks the hit, creates OOS punish opportunity)
 *   Grab   > Shield (passes through shield)
 *   Dodge is non-linear: beats Attack (if timed), loses to Grab (punishable on whiff),
 *   roughly neutral vs Shield.
 *
 * This module defines:
 *   - The option resolution table
 *   - Character-specific option tendencies (baseline distributions)
 *   - Option selection logic influenced by stats + opponent history (adaptability reads)
 *   - A neutral phase simulator that returns an exchange advantage
 *
 * NOTE: The full exchange loop (simulateNeutralPhase) is the intended replacement
 * for the single-roll game simulation in setSimulator.ts. The framework is in place;
 * finer tuning of values and the exchange loop belong in future iterations.
 */

import type { Character, CombatOption, OptionTendencies, ExchangeResult, PlayerStats } from '../types'
import { characterAttackValue } from '../data/movedata'

// ── Resolution table ──────────────────────────────────────────────────────────

/**
 * Resolves a single exchange between two simultaneous option choices.
 * Returns the outcome from player A's perspective.
 */
export function resolveOptions(optionA: CombatOption, optionB: CombatOption): ExchangeResult {
  if (optionA === optionB) return 'neutral'

  // Core triangle
  if (optionA === 'attack' && optionB === 'grab')   return 'player_wins'   // A hits B out of grab
  if (optionA === 'shield' && optionB === 'attack')  return 'player_wins'   // A blocks, OOS punish
  if (optionA === 'grab'   && optionB === 'shield')  return 'player_wins'   // A grabs through shield

  if (optionA === 'grab'   && optionB === 'attack')  return 'opponent_wins' // B hits A out of grab
  if (optionA === 'attack' && optionB === 'shield')  return 'opponent_wins' // B blocks, OOS punish
  if (optionA === 'shield' && optionB === 'grab')    return 'opponent_wins' // B grabs through shield

  // Dodge interactions — dodge beats attack (if timed), loses to grab (punishable),
  // neutral vs shield (both stalling)
  if (optionA === 'dodge'  && optionB === 'attack')  return 'player_wins'
  if (optionA === 'dodge'  && optionB === 'grab')    return 'opponent_wins'
  if (optionA === 'attack' && optionB === 'dodge')   return 'opponent_wins'
  if (optionA === 'grab'   && optionB === 'dodge')   return 'player_wins'

  return 'neutral'
}

// ── Character option tendencies ───────────────────────────────────────────────
// Baseline option frequency distributions per character.
// Reflects how each character approaches neutral in competitive SSBM:
//   - Fox/Falco/Captain Falcon: aggression-first, low shield
//   - Sheik/ICs: grab-oriented, looking for chaingrabs/handoffs
//   - Jigglypuff/Peach: float-centric, high dodge/positioning
//   - Marth: balanced with tilt toward attack (tipper spacing)

export const CHARACTER_TENDENCIES: Record<Character, OptionTendencies> = {
  // S tier — Fox/Falco attack-first; Sheik/ICs grab-hunting; Puff float-dominant
  Fox:              { attack: 0.50, shield: 0.15, grab: 0.20, dodge: 0.15 },
  Falco:            { attack: 0.48, shield: 0.18, grab: 0.20, dodge: 0.14 },
  Marth:            { attack: 0.40, shield: 0.22, grab: 0.20, dodge: 0.18 },
  Sheik:            { attack: 0.30, shield: 0.22, grab: 0.35, dodge: 0.13 },
  Jigglypuff:       { attack: 0.35, shield: 0.15, grab: 0.10, dodge: 0.40 },
  // A tier
  Peach:            { attack: 0.32, shield: 0.20, grab: 0.18, dodge: 0.30 },
  'Captain Falcon': { attack: 0.55, shield: 0.15, grab: 0.20, dodge: 0.10 },
  'Ice Climbers':   { attack: 0.20, shield: 0.18, grab: 0.50, dodge: 0.12 },
  // B tier
  Pikachu:          { attack: 0.42, shield: 0.20, grab: 0.22, dodge: 0.16 },
  Samus:            { attack: 0.35, shield: 0.28, grab: 0.18, dodge: 0.19 },
  Luigi:            { attack: 0.38, shield: 0.20, grab: 0.28, dodge: 0.14 },
  'Young Link':     { attack: 0.42, shield: 0.22, grab: 0.18, dodge: 0.18 },
  // C tier
  'Dr. Mario':      { attack: 0.40, shield: 0.22, grab: 0.22, dodge: 0.16 },
  Ganondorf:        { attack: 0.45, shield: 0.25, grab: 0.20, dodge: 0.10 },
  // DK: patient punish-focused; cargo throw means he heavily values grabs;
  // high shield reflects that his large hurtbox demands defensive respect
  'Donkey Kong':    { attack: 0.38, shield: 0.27, grab: 0.25, dodge: 0.10 },
}

// ── Exchange value ────────────────────────────────────────────────────────────
// Base value when each option wins an exchange.
// Attack value is CHARACTER-SPECIFIC — use getAttackExchangeValue() instead of
// indexing this directly for attacks. The base 1.0 here is overridden per character
// by characterAttackValue() from movedata.ts.

export const EXCHANGE_VALUE: Record<CombatOption, number> = {
  grab:   1.4,  // ICs/Sheik grab = huge; even normal grabs give back position
  attack: 1.0,  // base — overridden per character via getAttackExchangeValue()
  shield: 0.8,  // OOS punish — strong but limited options for some chars
  dodge:  0.6,  // punish off dodge — often smaller conversion
}

/**
 * Returns the character-specific attack exchange value, driven by the move data.
 * Ganondorf attacking wins are worth ~1.8× (massive damage, early kills);
 * Sheik attacking wins are ~0.9× (lower individual damage, combo-reliant).
 */
export function getAttackExchangeValue(character: Character): number {
  return characterAttackValue(character)
}

// ── Option selection ──────────────────────────────────────────────────────────

/**
 * Selects an option for a player in a single neutral exchange.
 *
 * Factors:
 *   - Base: character's natural tendency distribution
 *   - Neutral stat: shifts distribution toward the theoretically optimal counter
 *     to the opponent's most common option (exploitation)
 *   - Adaptability: how aggressively the player shifts distribution mid-game
 *     in response to observed opponent tendencies
 *   - Mental/pressure: under pressure, options regress toward raw tendency
 *     (player "defaults" to muscle memory under stress)
 *
 * TODO: deeper integration with a full opponent model once we accumulate
 * per-exchange history within a set.
 */
export function selectOption(
  stats: PlayerStats,
  character: Character,
  opponentTendencies: OptionTendencies,
  pressure: number,  // 0–1, how stressed the player is (losing set, low stock)
): CombatOption {
  const baseTend = CHARACTER_TENDENCIES[character]

  // Optimal counter to opponent's most common option (if they attack a lot → shield more)
  const optimalCounter = counterOption(opponentTendencies)

  // Adaptability drives how far we shift toward the counter
  const adaptShift = (stats.adaptability / 100) * (1 - pressure * (1 - stats.mental / 100))

  // Build adjusted distribution
  const adjusted: OptionTendencies = {
    attack: baseTend.attack,
    shield: baseTend.shield,
    grab: baseTend.grab,
    dodge: baseTend.dodge,
  }

  // Shift weight toward the optimal counter option
  const shiftAmount = adaptShift * 0.2  // up to +20% on the counter option
  adjusted[optimalCounter] = Math.min(0.7, adjusted[optimalCounter] + shiftAmount)

  // Re-normalize
  const total = adjusted.attack + adjusted.shield + adjusted.grab + adjusted.dodge
  const normalized = {
    attack: adjusted.attack / total,
    shield: adjusted.shield / total,
    grab: adjusted.grab / total,
    dodge: adjusted.dodge / total,
  }

  // Weighted random draw
  return weightedDraw(normalized)
}

function counterOption(opp: OptionTendencies): CombatOption {
  const maxOpt = (Object.entries(opp) as [CombatOption, number][])
    .sort(([, a], [, b]) => b - a)[0][0]
  // The option that beats the opponent's most common option
  const counters: Record<CombatOption, CombatOption> = {
    attack: 'shield',
    shield: 'grab',
    grab: 'attack',
    dodge: 'grab',  // grab punishes whiffed dodge
  }
  return counters[maxOpt]
}

function weightedDraw(tendencies: OptionTendencies): CombatOption {
  let rand = Math.random()
  if ((rand -= tendencies.attack) <= 0) return 'attack'
  if ((rand -= tendencies.shield) <= 0) return 'shield'
  if ((rand -= tendencies.grab)   <= 0) return 'grab'
  return 'dodge'
}

// ── Neutral phase simulation ──────────────────────────────────────────────────

export interface NeutralPhaseParams {
  playerStats: PlayerStats
  playerCharacter: Character
  opponentStats: Pick<PlayerStats, 'neutral' | 'adaptability' | 'mental'>
  opponentCharacter: Character
  exchanges?: number     // how many exchanges to simulate (default 8)
  pressure?: number      // player's pressure level, 0–1 (default 0)
}

export interface NeutralPhaseResult {
  playerAdvantage: number  // net score: positive = player ahead, negative = opponent ahead
  playerTendencies: OptionTendencies   // what the player actually did this phase
  opponentTendencies: OptionTendencies // what the opponent actually did
}

/**
 * Simulates a neutral phase (multiple exchanges) and returns an advantage score.
 * The advantage score (+/−) feeds into the broader game win probability.
 *
 * This is the primary hook for future deep integration — right now option selection
 * uses the stat/tendency framework above; later iterations can add per-exchange
 * momentum, stage control, stock disadvantage pressure, and sub-option layers
 * (jump, platform movement, mixup windows).
 */
export function simulateNeutralPhase(params: NeutralPhaseParams): NeutralPhaseResult {
  const {
    playerStats,
    playerCharacter,
    opponentStats,
    opponentCharacter,
    exchanges = 8,
    pressure = 0,
  } = params

  // Neutral stat influences reads — higher neutral = better option selection
  // manifested as a more "in sync" tendency (closer to optimal counter)
  const playerBaseRead = (playerStats.neutral / 100) * 0.5
  const opponentBaseRead = (opponentStats.neutral / 100) * 0.5

  // Tracked tendencies — start at character baseline, updated each exchange
  const playerTend: OptionTendencies = { ...CHARACTER_TENDENCIES[playerCharacter] }
  const opponentTend: OptionTendencies = { ...CHARACTER_TENDENCIES[opponentCharacter] }

  let playerScore = 0
  let opponentScore = 0

  for (let i = 0; i < exchanges; i++) {
    const opponentPressure = Math.max(0, (opponentScore - playerScore) * 0.1)
    const playerOption = selectOption(playerStats, playerCharacter, opponentTend, pressure)
    const opponentOption = selectOption(
      { ...opponentStats, execution: 70 } as PlayerStats,
      opponentCharacter,
      playerTend,
      opponentPressure,
    )

    const outcome = resolveOptions(playerOption, opponentOption)

    if (outcome === 'player_wins') {
      const value = playerOption === 'attack'
        ? getAttackExchangeValue(playerCharacter)
        : EXCHANGE_VALUE[playerOption]
      playerScore += value
      // Update opponent tendency tracking — adaptability makes this faster
      opponentTend[opponentOption] = Math.max(
        0.05,
        opponentTend[opponentOption] - playerStats.adaptability / 100 * 0.04
      )
    } else if (outcome === 'opponent_wins') {
      const value = opponentOption === 'attack'
        ? getAttackExchangeValue(opponentCharacter)
        : EXCHANGE_VALUE[opponentOption]
      opponentScore += value
      playerTend[playerOption] = Math.max(
        0.05,
        playerTend[playerOption] - opponentStats.adaptability / 100 * 0.04
      )
    }
    // neutral: no score, no tendency update (reads were inconclusive)

    // Neutral stat improves option read quality via a small course correction
    // after observing what the opponent just chose
    if (playerBaseRead > 0.3) {
      // Experienced players spot patterns faster
      opponentTend[opponentOption] = Math.min(0.7, opponentTend[opponentOption] + 0.01)
    }
    if (opponentBaseRead > 0.3) {
      playerTend[playerOption] = Math.min(0.7, playerTend[playerOption] + 0.01)
    }
  }

  return {
    playerAdvantage: playerScore - opponentScore,
    playerTendencies: playerTend,
    opponentTendencies: opponentTend,
  }
}

/**
 * Converts a neutral phase advantage into a game-win probability modifier.
 * A +2.0 advantage across 8 exchanges ≈ +0.15 probability boost.
 * Clamped so a strong neutral phase alone can't guarantee victory.
 */
export function neutralAdvantageToWinMod(advantage: number): number {
  return Math.max(-0.20, Math.min(0.20, advantage * 0.07))
}

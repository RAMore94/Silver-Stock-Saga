import type { Character, Player } from '../types'
import { getCharacterMeta } from '../data/characters'

// Per-character stat weight profiles (must sum to 1.0)
// Reflects how each character actually wins in SSBM competitive play.
const STAT_WEIGHTS: Record<string, { execution: number; neutral: number; mental: number; adaptability: number }> = {
  // Execution-floor characters — low execution is severely punishing
  Fox:            { execution: 0.35, neutral: 0.25, mental: 0.20, adaptability: 0.20 },
  Falco:          { execution: 0.33, neutral: 0.27, mental: 0.20, adaptability: 0.20 },
  'Ice Climbers': { execution: 0.38, neutral: 0.22, mental: 0.20, adaptability: 0.20 },
  // Neutral-focused characters — footsies and spacing are the win condition
  Marth:          { execution: 0.18, neutral: 0.37, mental: 0.25, adaptability: 0.20 },
  Sheik:          { execution: 0.20, neutral: 0.32, mental: 0.28, adaptability: 0.20 },
  // Mental/adaptability characters — winning through reads, patience, punish
  Jigglypuff:     { execution: 0.12, neutral: 0.25, mental: 0.38, adaptability: 0.25 },
  Peach:          { execution: 0.18, neutral: 0.27, mental: 0.30, adaptability: 0.25 },
  // DK — punish-focused; mental matters most (patience to wait for Giant Punch/grab windows);
  // neutral is relevant for bair spacing; execution is low-requirement
  'Donkey Kong':  { execution: 0.15, neutral: 0.28, mental: 0.32, adaptability: 0.25 },
  // Default — balanced weighting for A/B/C tier chars
  default:        { execution: 0.25, neutral: 0.25, mental: 0.25, adaptability: 0.25 },
}

// Minimum execution before severe penalty kicks in.
// Reflects the execution floor in real SSBM: below this, you're dropping
// L-cancels, waveshines, and tech chases at a punishing rate.
const EXECUTION_FLOORS: Partial<Record<Character, number>> = {
  Fox: 60,
  Falco: 65,
  'Ice Climbers': 70,
}

// Character tier base bonus added to EPR.
const TIER_BONUS: Record<string, number> = { S: 8, A: 4, B: 0, C: -6 }

/**
 * Calculates a player's Effective Performance Rating (EPR) on a 0–200 scale.
 *
 * Steps:
 * 1. Weighted stat sum using character-specific profile (0–100)
 * 2. Apply character stat affinities (adds character meta to the raw stats)
 * 3. Execution floor penalty for Fox/Falco/ICs
 * 4. Character tier bonus
 * 5. Form multiplier (0.80–1.20)
 * 6. Fatigue penalty (reduces up to 25%)
 * 7. Prep activity bonus (+5%)
 */
export function calcEPR(player: Player): number {
  const meta = getCharacterMeta(player.character)
  const weights = STAT_WEIGHTS[player.character] ?? STAT_WEIGHTS.default

  // Apply character affinities to raw stats (clamped 0–100)
  const adjStats = {
    execution: Math.min(100, Math.max(0, player.stats.execution + meta.affinities.execution)),
    neutral: Math.min(100, Math.max(0, player.stats.neutral + meta.affinities.neutral)),
    mental: Math.min(100, Math.max(0, player.stats.mental + meta.affinities.mental)),
    adaptability: Math.min(100, Math.max(0, player.stats.adaptability + meta.affinities.adaptability)),
  }

  // Weighted stat base (0–100)
  let base =
    adjStats.execution * weights.execution +
    adjStats.neutral * weights.neutral +
    adjStats.mental * weights.mental +
    adjStats.adaptability * weights.adaptability

  // Execution floor penalty — for chars that need frame-perfect inputs
  const floor = EXECUTION_FLOORS[player.character]
  if (floor !== undefined && player.stats.execution < floor) {
    const deficit = floor - player.stats.execution
    base -= deficit * 1.5  // 1.5× penalty per point below floor
  }

  // Tier bonus
  base += TIER_BONUS[meta.tier] ?? 0

  // Scale to ~0–120 range before multipliers (base is 0–108 with tier)
  // Form multiplier: 0.80 at form=0, 1.20 at form=100
  const formMult = 0.80 + (player.form / 100) * 0.40

  // Fatigue penalty: up to -25% at fatigue=100
  const fatigueMult = 1 - (player.fatigue / 100) * 0.25

  // Prep activity gives a focus bonus
  const prepBonus = player.weekActivity === 'prep' ? 1.05 : 1.0

  let epr = base * formMult * fatigueMult * prepBonus

  // Scale to 0–200 range (base max ~108 * 1.20 * 1.0 * 1.05 ≈ 136; scale up)
  epr = epr * (200 / 136)

  return Math.max(0, Math.min(200, epr))
}

/**
 * Win probability for player A vs player B given a matchup advantage.
 * matchupAdv: positive = A is favored by the matchup, negative = B is favored.
 * Returns a value in (0, 1).
 */
export function calcWinProbability(epA: number, epB: number, matchupAdv: number): number {
  // Matchup advantage shifts B's effective rating
  const adjustedB = epB - matchupAdv
  // Elo-style formula — divisor 80 gives a comfortable spread
  return 1 / (1 + Math.pow(10, (adjustedB - epA) / 80))
}

import type { Character } from '../types'

// Matchup advantage table from character A's perspective vs character B.
// Positive = A is favored. Range: -20 (heavily disfavored) to +20 (heavily favored).
// Asymmetric: if A vs B = +10, B vs A = -10 (enforced by getMatchupAdvantage).
// Only top/relevant matchups defined; undefined = 0 (neutral).
const MATCHUP_TABLE: Partial<Record<Character, Partial<Record<Character, number>>>> = {
  Fox: {
    Falco: 5,            // Fox slightly favored — recovery and mobility edge
    Marth: -5,           // Marth slightly favored — tipper edgeguard
    Sheik: -10,          // Sheik notably favored — chaingrab on spacies
    Jigglypuff: -5,      // Puff slightly favored — rest punishes Fox's approaches
    Peach: 5,            // Fox slight edge
    'Captain Falcon': 15, // Fox heavily favored — superior options across the board
    'Ice Climbers': 5,   // Fox slight edge — speed limits IC grab attempts
  },
  Falco: {
    Fox: -5,
    Marth: -15,          // Marth heavily favored — range nullifies laser, tipper covers recovery
    Sheik: 0,            // Even — both have strong combo games
    Jigglypuff: 10,      // Falco favored — chaingrab sequences prevent rest
    Peach: 5,
    'Captain Falcon': 10,
    'Ice Climbers': -5,  // ICs can grab-convert Falco effectively
  },
  Marth: {
    Fox: 5,
    Falco: 15,
    Sheik: -5,           // Sheik slightly favored — guaranteed conversions vs Marth
    Jigglypuff: 0,       // Classic even matchup, very skill-dependent
    Peach: 0,            // Sword vs float — highly contested, effectively even
    'Captain Falcon': 10,
    'Ice Climbers': -8,  // ICs' desyncs challenge Marth's spacing and punish windows
  },
  Sheik: {
    Fox: 10,
    Falco: 0,
    Marth: 5,
    Jigglypuff: -12,     // Puff notably favored — rest punishes Sheik's approach patterns
    Peach: -5,           // Peach slightly favored
    'Captain Falcon': 20, // Sheik massively favored — guaranteed chaingrab to 0-death
    'Ice Climbers': -5,
  },
  Jigglypuff: {
    Fox: 5,
    Falco: -10,
    Marth: 0,
    Sheik: 12,
    Peach: -5,           // Peach slightly favored — Peach's float and turnips control Puff
    'Captain Falcon': 5,
    'Ice Climbers': -8,  // ICs can chain throw Puff and handoff near ledge near-reliably
  },
  Peach: {
    Fox: -5,
    Falco: -5,
    Marth: 0,
    Sheik: 5,
    Jigglypuff: 5,
    'Captain Falcon': 10,
    'Ice Climbers': 0,
  },
  'Captain Falcon': {
    Fox: -15,
    Falco: -10,
    Marth: -10,
    Sheik: -20,
    Jigglypuff: -5,
    Peach: -10,
    'Ice Climbers': -5,  // ICs handoffs work on Falcon's large hurtbox
  },
  'Ice Climbers': {
    Fox: -5,
    Falco: 5,
    Marth: 8,
    Sheik: 5,
    Jigglypuff: 8,
    Peach: 0,
    'Captain Falcon': 5,
  },
}

/**
 * Returns the matchup advantage for attacker vs defender.
 * Positive = attacker favored. Negative = defender favored.
 * Falls back to symmetric lookup, then 0 if neither defined.
 */
export function getMatchupAdvantage(attacker: Character, defender: Character): number {
  const direct = MATCHUP_TABLE[attacker]?.[defender]
  if (direct !== undefined) return direct

  // Try reverse lookup (symmetric)
  const reverse = MATCHUP_TABLE[defender]?.[attacker]
  if (reverse !== undefined) return -reverse

  return 0
}

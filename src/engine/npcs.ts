import type { NPC, TournamentTier } from '../types'

// NPC opponent pool. Tags are styled after real regional SSBM handles —
// abbreviated, often a mix of initials/nicknames/wordplay.
// Organized by rough rating tier that matches tournament field strength.

const LOCAL_NPCS: NPC[] = [
  { tag: 'KDog',   character: 'Fox',             rating: 38 },
  { tag: 'Haze',   character: 'Falco',           rating: 42 },
  { tag: 'Wrench', character: 'Marth',           rating: 35 },
  { tag: 'Glib',   character: 'Captain Falcon',  rating: 30 },
  { tag: 'Slink',  character: 'Sheik',           rating: 44 },
  { tag: 'Torque', character: 'Fox',             rating: 48 },
  { tag: 'Moth',   character: 'Jigglypuff',      rating: 52 },
  { tag: 'Rekt',   character: 'Falco',           rating: 55 },
  { tag: 'Comet',  character: 'Marth',           rating: 58 },
  { tag: 'Glint',  character: 'Peach',           rating: 50 },
  { tag: 'Dusk',   character: 'Fox',             rating: 62 },
  { tag: 'Pebble', character: 'Ice Climbers',    rating: 45 },
  { tag: 'Vex',    character: 'Pikachu',         rating: 40 },
  { tag: 'Jolt',   character: 'Captain Falcon',  rating: 55 },
  { tag: 'Nape',   character: 'Sheik',           rating: 60 },
]

const REGIONAL_NPCS: NPC[] = [
  { tag: 'SFAT',   character: 'Fox',             rating: 85 },
  { tag: 'Kira',   character: 'Sheik',           rating: 78 },
  { tag: 'Flux',   character: 'Falco',           rating: 80 },
  { tag: 'Tempo',  character: 'Marth',           rating: 75 },
  { tag: 'Rize',   character: 'Jigglypuff',      rating: 72 },
  { tag: 'Crane',  character: 'Fox',             rating: 90 },
  { tag: 'Blaze',  character: 'Captain Falcon',  rating: 68 },
  { tag: 'Soleil', character: 'Peach',           rating: 82 },
  { tag: 'Grit',   character: 'Ice Climbers',    rating: 77 },
  { tag: 'Pivot',  character: 'Falco',           rating: 88 },
  { tag: 'Zenith', character: 'Marth',           rating: 93 },
  { tag: 'Crest',  character: 'Sheik',           rating: 70 },
  { tag: 'Lumin',  character: 'Fox',             rating: 95 },
  { tag: 'Axiom',  character: 'Jigglypuff',      rating: 86 },
  { tag: 'Praxis', character: 'Falco',           rating: 98 },
]

const MAJOR_NPCS: NPC[] = [
  { tag: 'Clutch',    character: 'Fox',           rating: 115 },
  { tag: 'Apex',      character: 'Marth',         rating: 120 },
  { tag: 'Westborne', character: 'Fox',           rating: 108 },
  { tag: 'Rime',      character: 'Sheik',         rating: 112 },
  { tag: 'Nadir',     character: 'Jigglypuff',    rating: 105 },
  { tag: 'Drift',     character: 'Falco',         rating: 118 },
  { tag: 'Sentinel',  character: 'Ice Climbers',  rating: 110 },
  { tag: 'Gavel',     character: 'Marth',         rating: 125 },
  { tag: 'Strobe',    character: 'Fox',           rating: 128 },
  { tag: 'Vesper',    character: 'Peach',         rating: 102 },
  { tag: 'Kairos',    character: 'Falco',         rating: 122 },
  { tag: 'Nullify',   character: 'Sheik',         rating: 116 },
  { tag: 'Vortex',    character: 'Fox',           rating: 130 },
  { tag: 'Crux',      character: 'Jigglypuff',    rating: 119 },
]

const SUPERMAJOR_NPCS: NPC[] = [
  ...MAJOR_NPCS,
  { tag: 'Epoch',   character: 'Fox',          rating: 148 },
  { tag: 'Vertex',  character: 'Marth',        rating: 155 },
  { tag: 'Cipher',  character: 'Falco',        rating: 145 },  // high-end national contender
  { tag: 'Solace',  character: 'Jigglypuff',   rating: 158 },
  { tag: 'Breach',  character: 'Sheik',        rating: 152 },
  { tag: 'Pillar',  character: 'Fox',          rating: 160 },
]

const NPC_POOLS: Record<TournamentTier, NPC[]> = {
  local: LOCAL_NPCS,
  regional: [...LOCAL_NPCS, ...REGIONAL_NPCS],
  major: [...REGIONAL_NPCS, ...MAJOR_NPCS],
  supermajor: SUPERMAJOR_NPCS,
}

/**
 * Returns the NPC pool for a given tournament tier.
 */
export function getNPCPool(tier: TournamentTier): NPC[] {
  return NPC_POOLS[tier]
}

/**
 * Draws a random NPC from the pool with a rating near the target rating.
 * Uses a weighted draw — closer to targetRating = more likely to be drawn.
 * This simulates getting matched against appropriate-strength opponents.
 */
export function drawOpponent(pool: NPC[], targetRating: number): NPC {
  // Weight inversely by distance from target (Gaussian-style)
  const weights = pool.map((npc) => {
    const dist = Math.abs(npc.rating - targetRating)
    return Math.exp(-dist / 30)  // sigma ~30 rating points
  })

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * totalWeight
  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

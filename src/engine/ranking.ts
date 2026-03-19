import type {
  TournamentTier,
  RankingEntry,
  RankingResult,
  Player,
  Tournament,
} from '../types'

// ── Point table ───────────────────────────────────────────────────────────────
// Modeled after real SSBM Power Ranking systems — points scale dramatically
// by tier because national results matter far more than locals.

const TIER_POINT_TABLES: Record<TournamentTier, { upTo: number; points: number }[]> = {
  local: [
    { upTo: 1, points: 15 },
    { upTo: 2, points: 9  },
    { upTo: 3, points: 6  },
    { upTo: 4, points: 3  },
    { upTo: 8, points: 1  },
  ],
  regional: [
    { upTo: 1,  points: 75  },
    { upTo: 2,  points: 45  },
    { upTo: 3,  points: 30  },
    { upTo: 4,  points: 18  },
    { upTo: 8,  points: 9   },
    { upTo: 16, points: 4   },
  ],
  major: [
    { upTo: 1,  points: 300 },
    { upTo: 2,  points: 180 },
    { upTo: 3,  points: 120 },
    { upTo: 4,  points: 75  },
    { upTo: 8,  points: 40  },
    { upTo: 16, points: 20  },
    { upTo: 32, points: 8   },
  ],
  supermajor: [
    { upTo: 1,  points: 800 },
    { upTo: 2,  points: 480 },
    { upTo: 3,  points: 320 },
    { upTo: 4,  points: 200 },
    { upTo: 8,  points: 100 },
    { upTo: 16, points: 50  },
    { upTo: 32, points: 20  },
  ],
}

/**
 * Base ranking points for a given placement at a tier.
 */
export function calcBasePoints(placement: number, tier: TournamentTier): number {
  const table = TIER_POINT_TABLES[tier]
  for (const row of table) {
    if (placement <= row.upTo) return row.points
  }
  return 0
}

/**
 * Decays ranking points based on how many weeks ago the result was earned.
 * Half-life ≈ 10 weeks (0.933^10 ≈ 0.5), matching regional SSBM PR windows
 * where results from 2+ months ago carry little weight.
 */
export function decayPoints(basePoints: number, weeksAgo: number): number {
  return basePoints * Math.pow(0.933, weeksAgo)
}

/**
 * Computes the full ranking table from all completed tournaments.
 * Results are read from `tournament.results` (written by the store on simulation).
 *
 * @param players       - current roster (tag/character for display)
 * @param tournaments   - full tournament list, including completed ones with results
 * @param currentWeek   - used to calculate weeks elapsed for decay
 * @param prevRankings  - previous ranking snapshot, used for trend arrows
 */
export function computeRankings(
  players: Player[],
  tournaments: Tournament[],
  currentWeek: number,
  prevRankings: RankingEntry[],
): RankingEntry[] {
  // Build result history per player by scanning all completed tournaments
  const playerResultMap = new Map<string, RankingResult[]>()
  for (const player of players) playerResultMap.set(player.id, [])

  for (const t of tournaments) {
    if (!t.results || t.results.length === 0) continue
    for (const r of t.results) {
      if (!playerResultMap.has(r.playerId)) continue
      const basePoints = calcBasePoints(r.placement, t.tier)
      playerResultMap.get(r.playerId)!.push({
        tournamentId: t.id,
        tournamentName: t.name,
        tier: t.tier,
        placement: r.placement,
        basePoints,
        earnedAtWeek: t.week,
      })
    }
  }

  // Compute decayed point totals and sort by recent results desc (for display)
  const entries: Omit<RankingEntry, 'rank' | 'trend'>[] = players.map((player) => {
    const results = playerResultMap.get(player.id) ?? []
    const sorted = [...results].sort((a, b) => b.earnedAtWeek - a.earnedAtWeek)
    const points = sorted.reduce((sum, r) => {
      const weeksAgo = Math.max(0, currentWeek - r.earnedAtWeek)
      return sum + decayPoints(r.basePoints, weeksAgo)
    }, 0)
    return {
      playerId: player.id,
      tag: player.tag,
      character: player.character,
      points,
      recentResults: sorted,
    }
  })

  entries.sort((a, b) => b.points - a.points)

  const prevRankMap = new Map(prevRankings.map((r) => [r.playerId, r.rank]))

  return entries.map((entry, i) => {
    const rank = i + 1
    const prevRank = prevRankMap.get(entry.playerId)
    const trend: RankingEntry['trend'] =
      prevRank === undefined ? 'stable'
      : rank < prevRank ? 'up'
      : rank > prevRank ? 'down'
      : 'stable'
    return { ...entry, rank, trend }
  })
}

/**
 * Converts a player's rank into a bracket seeding advantage multiplier.
 * Applied to opponent target rating in early rounds of the tournament sim:
 *   - Top seed (rank 1): early opponents are ~35% weaker than field average
 *   - Unranked: no protection, full field difficulty from round 1
 *
 * This reflects real SSBM bracket seeding — top seeds are placed apart in the
 * bracket and shouldn't meet each other until late rounds.
 */
export function seedingAdvantage(rank: number | undefined, totalRanked: number): number {
  if (rank === undefined || totalRanked === 0) return 1.0
  const percentile = 1 - (rank - 1) / totalRanked  // 1.0 at rank=1, ~0 at bottom
  return 1.0 - percentile * 0.35  // 0.65 for #1 seed, 1.0 for unranked
}

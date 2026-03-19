import { useGameStore } from '../store/gameStore'

const TIER_COLORS = {
  local: '#a8c8e8',
  regional: '#c9a84c',
  major: '#c97070',
  supermajor: '#805080',
}

const TIER_LABELS = {
  local: 'Local',
  regional: 'Regional',
  major: 'Major',
  supermajor: 'Supermajor',
}

function placementLabel(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')   return <span className="text-xs text-[#7aaa7a]">↑</span>
  if (trend === 'down') return <span className="text-xs text-[#c97070]">↓</span>
  return <span className="text-xs text-[#c8b89a]">—</span>
}

export function Rankings() {
  const { rankings, team } = useGameStore()

  const hasResults = rankings.some((r) => r.recentResults.length > 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Scene</div>
        <h1 className="text-2xl font-semibold text-[#3d2b1f]">Power Rankings</h1>
        <p className="text-xs text-[#8a6a55] mt-1">
          Points decay over time — recent results count more. Updated each week.
        </p>
      </div>

      {!hasResults ? (
        <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] px-6 py-10 text-center">
          <div className="text-sm text-[#8a6a55]">No tournament results yet.</div>
          <div className="text-xs text-[#c8b89a] mt-1">Register players for tournaments and advance the week to start building ranking history.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rankings.map((entry) => (
            <div
              key={entry.playerId}
              className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden"
            >
              {/* Player header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  <div className="text-lg font-bold text-[#3d2b1f]">#{entry.rank}</div>
                </div>

                <TrendBadge trend={entry.trend} />

                {/* Tag + character */}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#3d2b1f]">{entry.tag}</div>
                  <div className="text-xs text-[#8a6a55]">{entry.character}</div>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-[#3d2b1f]">
                    {entry.points.toFixed(0)}
                  </div>
                  <div className="text-xs text-[#8a6a55]">pts</div>
                </div>
              </div>

              {/* Recent results */}
              {entry.recentResults.length > 0 && (
                <div className="border-t border-[#e8d8bc] px-5 py-3 flex flex-wrap gap-2">
                  {entry.recentResults.slice(0, 6).map((r, i) => {
                    const tierColor = TIER_COLORS[r.tier]
                    const weeksAgo = team.week - r.earnedAtWeek
                    const decayFactor = Math.pow(0.933, weeksAgo)
                    const currentPts = r.basePoints * decayFactor
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-[#f2e8d5] rounded-lg px-2.5 py-1.5"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: tierColor }}
                        />
                        <span className="text-xs text-[#3d2b1f] font-medium">{placementLabel(r.placement)}</span>
                        <span
                          className="text-xs"
                          style={{ color: tierColor }}
                        >
                          {TIER_LABELS[r.tier]}
                        </span>
                        <span className="text-xs text-[#8a6a55]">
                          +{currentPts.toFixed(0)}
                        </span>
                        {weeksAgo > 0 && (
                          <span className="text-xs text-[#c8b89a]">{weeksAgo}wk ago</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-[#c8b89a] px-1">
        Points halve every ~10 weeks. A 1st at a Major outweighs months of local results.
      </div>
    </div>
  )
}

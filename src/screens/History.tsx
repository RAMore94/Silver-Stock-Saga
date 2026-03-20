import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

type Tab = 'overview' | 'players' | 'archive'

const TIER_COLORS = {
  local:       '#b0a090',
  regional:    '#5b9e8a',
  major:       '#6b9bd2',
  supermajor:  '#d4a832',
}

const TIER_LABELS = {
  local:      'Local',
  regional:   'Regional',
  major:      'Major',
  supermajor: 'Supermajor',
}

function placementLabel(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

export function History() {
  const { team, players, tournaments, ledger } = useGameStore()
  const [tab, setTab] = useState<Tab>('overview')

  const completedTournaments = tournaments.filter((t) => t.results && t.results.length > 0)
  const myPlayerIds = new Set(players.map((p) => p.id))

  // Financial aggregates from ledger
  const totalPrize    = ledger.filter((e) => e.type === 'prize').reduce((s, e) => s + e.amount, 0)
  const totalSalary   = ledger.filter((e) => e.type === 'salary').reduce((s, e) => s + Math.abs(e.amount), 0)
  const totalEntryFee = ledger.filter((e) => e.type === 'entry_fee').reduce((s, e) => s + Math.abs(e.amount), 0)
  const totalSponsor  = ledger.filter((e) => e.type === 'sponsor').reduce((s, e) => s + e.amount, 0)
  const netCashflow   = totalPrize + totalSponsor - totalSalary - totalEntryFee

  // Career stats per player
  const careerStats = players.map((player) => {
    const results = completedTournaments.flatMap((t) =>
      (t.results ?? []).filter((r) => r.playerId === player.id)
    )
    const totalPrizePlayer = results.reduce((s, r) => s + r.prizeEarned, 0)
    const appearances      = results.length
    const bestPlacement    = results.length > 0 ? Math.min(...results.map((r) => r.placement)) : null
    const avgPlacement     = results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.placement, 0) / results.length)
      : null
    return { player, totalPrize: totalPrizePlayer, appearances, bestPlacement, avgPlacement }
  })

  // Tournament archive — sorted newest-first
  const archiveRows = [...completedTournaments]
    .sort((a, b) => b.week - a.week)
    .map((t) => {
      const myResults = (t.results ?? []).filter((r) => myPlayerIds.has(r.playerId))
      return { tournament: t, myResults }
    })
    .filter((row) => row.myResults.length > 0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Season Overview' },
    { id: 'players',  label: 'Player Records' },
    { id: 'archive',  label: 'Tournament Archive' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d2b1f]">Season History</h1>
        <p className="text-sm text-[#8a6a55] mt-1">Week {team.week} of 52</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#f2e8d5] rounded-xl p-1 w-fit">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === id
                ? 'bg-[#faf4e8] text-[#3d2b1f] shadow-sm'
                : 'text-[#8a6a55] hover:text-[#3d2b1f]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Season Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Season progress */}
          <div className="bg-[#faf4e8] rounded-xl p-5 border border-[#e8d8bc]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#3d2b1f]">Season Progress</span>
              <span className="text-sm text-[#8a6a55]">Week {team.week} / 52</span>
            </div>
            <div className="h-2 bg-[#f2e8d5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4a832] rounded-full transition-all"
                style={{ width: `${Math.round((team.week / 52) * 100)}%` }}
              />
            </div>
          </div>

          {/* Financial P&L */}
          <div>
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-3">Financial Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Prize Earnings',  value: totalPrize,    color: '#7aaa7a' },
                { label: 'Sponsor Income',  value: totalSponsor,  color: '#6b9bd2' },
                { label: 'Salaries Paid',   value: -totalSalary,  color: '#c97070' },
                { label: 'Entry Fees',      value: -totalEntryFee, color: '#c97070' },
                { label: 'Net Cashflow',    value: netCashflow,   color: netCashflow >= 0 ? '#7aaa7a' : '#c97070' },
                { label: 'Current Balance', value: team.balance,  color: '#3d2b1f' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#faf4e8] rounded-xl p-4 border border-[#e8d8bc]">
                  <div className="text-xs text-[#8a6a55] mb-1">{label}</div>
                  <div className="text-lg font-bold" style={{ color }}>
                    {value >= 0 ? '+' : ''}${Math.abs(value).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combined W/L */}
          {players.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-3">Team Record</h2>
              <div className="bg-[#faf4e8] rounded-xl p-5 border border-[#e8d8bc]">
                {(() => {
                  const totalW = players.reduce((s, p) => s + p.wins, 0)
                  const totalL = players.reduce((s, p) => s + p.losses, 0)
                  const total  = totalW + totalL
                  const pct    = total > 0 ? Math.round((totalW / total) * 100) : 0
                  return (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#7aaa7a]">{totalW}</div>
                        <div className="text-xs text-[#8a6a55]">Wins</div>
                      </div>
                      <div className="text-2xl text-[#c8b89a]">—</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#c97070]">{totalL}</div>
                        <div className="text-xs text-[#8a6a55]">Losses</div>
                      </div>
                      <div className="ml-4 text-sm text-[#8a6a55]">{pct}% win rate</div>
                      <div className="ml-4 text-sm text-[#8a6a55]">{completedTournaments.length} tournaments completed</div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {completedTournaments.length === 0 && (
            <div className="text-center py-16 text-[#8a6a55]">
              <div className="text-4xl mb-3">📅</div>
              <div className="font-medium">No history yet</div>
              <div className="text-sm mt-1">Advance a week and compete in tournaments to start building your record.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Player Records ── */}
      {tab === 'players' && (
        <div className="space-y-3">
          {careerStats.map(({ player, totalPrize: playerPrize, appearances, bestPlacement, avgPlacement }) => (
            <div key={player.id} className="bg-[#faf4e8] rounded-xl p-5 border border-[#e8d8bc]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3d2b1f] text-lg">{player.tag}</span>
                    <span className="text-xs text-[#8a6a55]">{player.name}</span>
                  </div>
                  <div className="text-sm text-[#8a6a55]">{player.character}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#7aaa7a]">${playerPrize.toLocaleString()}</div>
                  <div className="text-xs text-[#8a6a55]">career earnings</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'W-L Record',      value: `${player.wins}W – ${player.losses}L` },
                  { label: 'Tournaments',     value: appearances.toString() },
                  { label: 'Best Placement',  value: bestPlacement !== null ? placementLabel(bestPlacement) : '—' },
                  { label: 'Avg Placement',   value: avgPlacement  !== null ? placementLabel(avgPlacement)  : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#f2e8d5] rounded-lg p-3">
                    <div className="text-xs text-[#8a6a55]">{label}</div>
                    <div className="text-sm font-semibold text-[#3d2b1f] mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="text-center py-16 text-[#8a6a55]">No players on roster.</div>
          )}
        </div>
      )}

      {/* ── Tournament Archive ── */}
      {tab === 'archive' && (
        <div>
          {archiveRows.length === 0 ? (
            <div className="text-center py-16 text-[#8a6a55]">
              <div className="text-4xl mb-3">🏆</div>
              <div className="font-medium">No results yet</div>
              <div className="text-sm mt-1">Register players for tournaments and advance the week to compete.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {archiveRows.map(({ tournament, myResults }) => (
                <div key={tournament.id} className="bg-[#faf4e8] rounded-xl p-5 border border-[#e8d8bc]">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: TIER_COLORS[tournament.tier] }}
                    >
                      {TIER_LABELS[tournament.tier]}
                    </span>
                    <span className="font-semibold text-[#3d2b1f]">{tournament.name}</span>
                    <span className="text-xs text-[#8a6a55] ml-auto">Week {tournament.week}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {myResults.map((result) => {
                      const player = players.find((p) => p.id === result.playerId)
                      return (
                        <div
                          key={result.playerId}
                          className="flex items-center gap-2 bg-[#f2e8d5] rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-[#3d2b1f]">{player?.tag ?? result.playerId}</span>
                          <span className="text-[#8a6a55]">{placementLabel(result.placement)}</span>
                          {result.prizeEarned > 0 && (
                            <span className="text-[#7aaa7a] font-medium">+${result.prizeEarned.toLocaleString()}</span>
                          )}
                          <span className="text-xs text-[#b0a090]">{result.setsWon}W–{result.setsLost}L</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useGameStore } from '../store/gameStore'

const TIER_LABELS = {
  local: 'Local',
  regional: 'Regional',
  major: 'Major',
  supermajor: 'Supermajor',
}

const TIER_COLORS = {
  local: '#a8c8e8',
  regional: '#c9a84c',
  major: '#c97070',
  supermajor: '#805080',
}

export function Dashboard() {
  const { team, players, tournaments, advanceWeek, setScreen, pendingReport, dismissReport } = useGameStore()

  const upcoming = tournaments
    .filter((t) => t.week >= team.week)
    .sort((a, b) => a.week - b.week)
    .slice(0, 3)

  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0)
  const avgForm = Math.round(players.reduce((sum, p) => sum + p.form, 0) / players.length)
  const burnedOut = players.filter((p) => p.fatigue >= 60).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Pending tournament results banner */}
      {pendingReport && (
        <button
          onClick={dismissReport}
          className="w-full text-left bg-[#3d2b1f] text-[#faf4e8] rounded-2xl px-5 py-4 flex items-center gap-3 hover:bg-[#4a3628] transition-colors cursor-pointer"
        >
          <span className="text-lg">🏆</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">{pendingReport.tournamentName} — Results In</div>
            <div className="text-xs text-[#c8b89a] mt-0.5">
              {pendingReport.playerResults.map((r) => {
                const p = players.find((pl) => pl.id === r.playerId)
                return `${p?.tag ?? r.playerId} placed ${r.placement === 1 ? '1st' : r.placement === 2 ? '2nd' : r.placement === 3 ? '3rd' : `${r.placement}th`}`
              }).join(' · ')}
            </div>
          </div>
          <span className="text-xs text-[#c8b89a]">View →</span>
        </button>
      )}

      {/* Page title */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Week {team.week}</div>
          <h1 className="text-2xl font-semibold text-[#3d2b1f]">{team.name}</h1>
        </div>
        <button
          onClick={advanceWeek}
          className="px-5 py-2.5 bg-[#3d2b1f] text-[#faf4e8] rounded-xl text-sm font-medium hover:bg-[#4a3628] transition-colors cursor-pointer"
        >
          Advance Week →
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Balance', value: `$${team.balance.toLocaleString()}` },
          { label: 'Weekly Burn', value: `$${totalSalary.toLocaleString()}` },
          { label: 'Avg. Form', value: `${avgForm}` },
          { label: 'Burnt Out', value: `${burnedOut} / ${players.length}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#faf4e8] rounded-2xl p-5 border border-[#e8d8bc]">
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-2">{stat.label}</div>
            <div className="text-2xl font-semibold text-[#3d2b1f]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Roster snapshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d2b1f] uppercase tracking-wider">Roster</h2>
          <button
            onClick={() => setScreen('roster')}
            className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] transition-colors cursor-pointer"
          >
            Manage →
          </button>
        </div>
        <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
          {players.map((player, i) => {
            const fatigueColor = player.fatigue < 30 ? '#7aaa7a' : player.fatigue < 60 ? '#c9a84c' : '#c97070'
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 px-5 py-4 ${i < players.length - 1 ? 'border-b border-[#e8d8bc]' : ''}`}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#3d2b1f]">{player.tag}</div>
                  <div className="text-xs text-[#8a6a55]">{player.character}</div>
                </div>
                <div className="text-xs text-[#8a6a55] capitalize">{player.weekActivity}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8a6a55]">Form</span>
                  <div className="w-20 h-1.5 bg-[#e8d8bc] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#c9a84c] rounded-full"
                      style={{ width: `${player.form}%` }}
                    />
                  </div>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: fatigueColor }}
                  title={`Fatigue: ${player.fatigue}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming tournaments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d2b1f] uppercase tracking-wider">Upcoming Events</h2>
          <button
            onClick={() => setScreen('schedule')}
            className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] transition-colors cursor-pointer"
          >
            Full Schedule →
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <div className="text-sm text-[#8a6a55]">No upcoming events.</div>
          ) : (
            upcoming.map((t) => (
              <div
                key={t.id}
                className="bg-[#faf4e8] rounded-xl px-5 py-4 border border-[#e8d8bc] flex items-center gap-4"
              >
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ backgroundColor: TIER_COLORS[t.tier] }}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#3d2b1f]">{t.name}</div>
                  <div className="text-xs text-[#8a6a55] mt-0.5">
                    Week {t.week} · {t.entrants} entrants · ${t.prizePool.toLocaleString()} prize pool
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: TIER_COLORS[t.tier], backgroundColor: `${TIER_COLORS[t.tier]}22` }}
                >
                  {TIER_LABELS[t.tier]}
                </span>
                <div className="text-xs text-[#8a6a55]">
                  in {t.week - team.week} week{t.week - team.week !== 1 ? 's' : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

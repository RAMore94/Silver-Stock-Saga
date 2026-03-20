import { useGameStore } from '../store/gameStore'

const TIER_COLORS = {
  local:      '#a8c8e8',
  regional:   '#c9a84c',
  major:      '#c97070',
  supermajor: '#805080',
}

const TIER_LABELS = {
  local:      'Local',
  regional:   'Regional',
  major:      'Major',
  supermajor: 'Supermajor',
}

const SEASON_LENGTH = 52

export function Dashboard() {
  const {
    team, players, tournaments,
    advanceWeek, setScreen, pendingReport, dismissReport,
  } = useGameStore()

  const upcoming = tournaments
    .filter((t) => t.week >= team.week)
    .sort((a, b) => a.week - b.week)
    .slice(0, 4)

  const thisWeekTournaments = tournaments.filter((t) => t.week === team.week + 1)
  const thisWeekRegistered = thisWeekTournaments.filter((t) => t.registeredPlayers.length > 0)
  const registeredPlayerIds = [...new Set(thisWeekRegistered.flatMap((t) => t.registeredPlayers))]
  const registeredTags = registeredPlayerIds
    .map((id) => players.find((p) => p.id === id)?.tag ?? id)

  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0)
  const avgForm = Math.round(players.reduce((sum, p) => sum + p.form, 0) / players.length)
  const burnedOut = players.filter((p) => p.fatigue >= 65).length

  const seasonPct = Math.min(100, Math.round((team.week / SEASON_LENGTH) * 100))

  return (
    <>
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 pb-28">

      {/* Pending tournament results banner */}
      {pendingReport && (
        <button
          onClick={dismissReport}
          className="w-full text-left bg-[#3d2b1f] text-[#faf4e8] rounded-2xl px-5 py-4 flex items-center gap-3 hover:bg-[#4a3628] transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] text-sm font-bold shrink-0">!</div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{pendingReport.tournamentName} — Results In</div>
            <div className="text-xs text-[#c8b89a] mt-0.5">
              {pendingReport.playerResults.map((r) => {
                const p = players.find((pl) => pl.id === r.playerId)
                const ord = r.placement === 1 ? '1st' : r.placement === 2 ? '2nd' : r.placement === 3 ? '3rd' : `${r.placement}th`
                return `${p?.tag ?? r.playerId} — ${ord}`
              }).join(' · ')}
            </div>
          </div>
          <span className="text-xs text-[#c8b89a]">View →</span>
        </button>
      )}

      {/* Page header + season progress */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">
              Week {team.week} of {SEASON_LENGTH}
            </div>
            <h1 className="text-2xl font-semibold text-[#3d2b1f]">{team.name}</h1>
          </div>
          <div className="text-right text-xs text-[#8a6a55]">
            <div className="font-medium text-[#3d2b1f] text-sm">Rep {team.reputation}</div>
            <div>Team reputation</div>
          </div>
        </div>

        {/* Season progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[#e8d8bc] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c9a84c] rounded-full transition-all"
              style={{ width: `${seasonPct}%` }}
            />
          </div>
          <div className="text-xs text-[#8a6a55] shrink-0">{seasonPct}%</div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Balance',      value: `$${team.balance.toLocaleString()}` },
          { label: 'Weekly Burn',  value: `$${totalSalary.toLocaleString()}` },
          { label: 'Avg. Form',    value: `${avgForm}` },
          { label: 'Burnt Out',    value: `${burnedOut} / ${players.length}`,
            highlight: burnedOut > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#faf4e8] rounded-2xl p-5 border border-[#e8d8bc]"
          >
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-2">{stat.label}</div>
            <div
              className="text-2xl font-semibold"
              style={{ color: stat.highlight ? '#c97070' : '#3d2b1f' }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* This-week preview */}
      {thisWeekRegistered.length > 0 && (
        <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] px-5 py-4 flex items-start gap-4">
          <div className="flex-1">
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Next Week</div>
            <div className="text-sm font-semibold text-[#3d2b1f]">
              {thisWeekRegistered.length} tournament{thisWeekRegistered.length > 1 ? 's' : ''} — {registeredTags.join(', ')} competing
            </div>
            <div className="text-xs text-[#8a6a55] mt-0.5">
              {thisWeekRegistered.map((t) => t.name).join(' · ')}
            </div>
          </div>
          <button
            onClick={() => setScreen('schedule')}
            className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] transition-colors cursor-pointer shrink-0 self-center"
          >
            Review →
          </button>
        </div>
      )}

      {/* Roster snapshot */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#3d2b1f] uppercase tracking-wider">Roster</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setScreen('training')}
              className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] transition-colors cursor-pointer"
            >
              Training →
            </button>
            <button
              onClick={() => setScreen('roster')}
              className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] transition-colors cursor-pointer"
            >
              Manage →
            </button>
          </div>
        </div>
        <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
          {players.map((player, i) => {
            const fatigueColor = player.fatigue < 35 ? '#7aaa7a' : player.fatigue < 65 ? '#c9a84c' : '#c97070'
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 px-5 py-3.5 ${i < players.length - 1 ? 'border-b border-[#e8d8bc]' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#3d2b1f]">{player.tag}</div>
                  <div className="text-xs text-[#8a6a55]">{player.character} · {player.wins}W–{player.losses}L</div>
                </div>
                <div className="text-xs text-[#8a6a55] capitalize hidden sm:block">{player.weekActivity}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8a6a55]">Form</span>
                  <div className="w-16 h-1.5 bg-[#e8d8bc] rounded-full overflow-hidden">
                    <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${player.form}%` }} />
                  </div>
                  <span className="text-xs text-[#8a6a55] w-6">{player.form}</span>
                </div>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#3d2b1f] uppercase tracking-wider">Upcoming</h2>
          <button
            onClick={() => setScreen('schedule')}
            className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] transition-colors cursor-pointer"
          >
            Full Calendar →
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {upcoming.length === 0 ? (
            <div className="text-sm text-[#8a6a55]">Season complete.</div>
          ) : (
            upcoming.map((t) => {
              const weeksAway = t.week - team.week
              const registered = t.registeredPlayers
                .map((id) => players.find((p) => p.id === id)?.tag ?? id)
              return (
                <div
                  key={t.id}
                  className="bg-[#faf4e8] rounded-xl px-5 py-3.5 border border-[#e8d8bc] flex items-center gap-4"
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: TIER_COLORS[t.tier] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-semibold text-[#3d2b1f]">{t.name}</div>
                      {registered.length > 0 && (
                        <div className="flex gap-1">
                          {registered.map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[#3d2b1f]/10 text-[#3d2b1f]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[#8a6a55] mt-0.5">
                      {t.location.city}, {t.location.state} · {t.entrants} entrants · ${t.prizePool.toLocaleString()}
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: TIER_COLORS[t.tier], backgroundColor: `${TIER_COLORS[t.tier]}22` }}
                  >
                    {TIER_LABELS[t.tier]}
                  </span>
                  <div className="text-xs text-[#8a6a55] shrink-0 hidden sm:block">
                    {weeksAway === 0 ? 'This week' : `${weeksAway} wk${weeksAway > 1 ? 's' : ''}`}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>

    {/* Sticky Advance Week footer */}
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#f2e8d5]/95 backdrop-blur border-t border-[#e8d8bc]">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="text-xs text-[#8a6a55]">
          {thisWeekRegistered.length > 0
            ? `${registeredTags.join(', ')} competing next week`
            : 'No players registered for next week'}
        </div>
        <button
          onClick={advanceWeek}
          className="px-5 py-2 bg-[#3d2b1f] text-[#faf4e8] rounded-xl text-sm font-medium hover:bg-[#4a3628] transition-colors cursor-pointer shrink-0"
        >
          Advance Week →
        </button>
      </div>
    </div>
    </>
  )
}

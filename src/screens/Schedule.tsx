import { useGameStore } from '../store/gameStore'
import type { Tournament } from '../types'

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

// Map weeks to months (52-week season starting in January)
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_WEEK_RANGES: [number, number][] = [
  [1, 4], [5, 8], [9, 13], [14, 17], [18, 21], [22, 26],
  [27, 30], [31, 35], [36, 39], [40, 43], [44, 48], [49, 52],
]

function getMonth(week: number): number {
  for (let i = 0; i < MONTH_WEEK_RANGES.length; i++) {
    if (week >= MONTH_WEEK_RANGES[i][0] && week <= MONTH_WEEK_RANGES[i][1]) return i
  }
  return 11
}

function groupByMonth(tournaments: Tournament[]): Map<number, Tournament[]> {
  const groups = new Map<number, Tournament[]>()
  for (const t of tournaments) {
    const month = getMonth(t.week)
    const list = groups.get(month) ?? []
    list.push(t)
    groups.set(month, list)
  }
  return groups
}

function TournamentRow({ t, team, players, registerForTournament, unregisterFromTournament }: {
  t: Tournament
  team: { week: number }
  players: { id: string; tag: string }[]
  registerForTournament: (tid: string, pid: string) => void
  unregisterFromTournament: (tid: string, pid: string) => void
}) {
  const isPast = t.week < team.week
  const isCurrent = t.week === team.week
  const weeksAway = t.week - team.week
  const canRegister = !isPast && !isCurrent

  return (
    <div
      className={`bg-[#faf4e8] rounded-2xl px-5 py-4 border border-[#e8d8bc] flex items-start gap-4 ${isPast ? 'opacity-40' : ''}`}
    >
      {/* Week indicator */}
      <div className="text-center w-10 shrink-0">
        <div className="text-xs text-[#8a6a55] uppercase tracking-wide">Wk</div>
        <div className="text-lg font-semibold text-[#3d2b1f]">{t.week}</div>
      </div>

      {/* Tier stripe */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: TIER_COLORS[t.tier] }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-semibold text-[#3d2b1f]">{t.name}</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: TIER_COLORS[t.tier], backgroundColor: `${TIER_COLORS[t.tier]}22` }}
          >
            {TIER_LABELS[t.tier]}
          </span>
          {isCurrent && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#3d2b1f] text-[#faf4e8]">
              This Week
            </span>
          )}
        </div>

        {/* Location + details */}
        <div className="text-xs text-[#8a6a55] flex flex-wrap gap-x-4 gap-y-0.5">
          <span className="font-medium">{t.location}</span>
          <span>{t.entrants} entrants</span>
          <span>${t.prizePool.toLocaleString()} pool</span>
          <span>${t.entryFee}/player</span>
        </div>

        {/* Per-player registration controls */}
        {canRegister && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {players.map((p) => {
              const isRegistered = t.registeredPlayers.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() =>
                    isRegistered
                      ? unregisterFromTournament(t.id, p.id)
                      : registerForTournament(t.id, p.id)
                  }
                  className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                    isRegistered
                      ? 'bg-[#3d2b1f] text-[#faf4e8] border-[#3d2b1f]'
                      : 'bg-transparent text-[#8a6a55] border-[#c8b89a] hover:border-[#3d2b1f] hover:text-[#3d2b1f]'
                  }`}
                >
                  {isRegistered ? `\u2713 ${p.tag}` : `+ ${p.tag} ($${t.entryFee})`}
                </button>
              )
            })}
          </div>
        )}

        {/* Show registered players on current/past tournaments */}
        {!canRegister && t.registeredPlayers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {t.registeredPlayers.map((pid) => {
              const p = players.find((pl) => pl.id === pid)
              return (
                <span
                  key={pid}
                  className="text-xs px-3 py-1 rounded-full bg-[#3d2b1f] text-[#faf4e8]"
                >
                  {p?.tag ?? pid}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Weeks away indicator */}
      {!isPast && !isCurrent && (
        <div className="text-xs text-[#8a6a55] shrink-0 self-center whitespace-nowrap">
          in {weeksAway} wk{weeksAway !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export function Schedule() {
  const { tournaments, team, players, registerForTournament, unregisterFromTournament } = useGameStore()

  const sorted = [...tournaments].sort((a, b) => a.week - b.week)
  const monthGroups = groupByMonth(sorted)
  const currentMonth = getMonth(team.week)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Schedule</div>
        <h1 className="text-2xl font-semibold text-[#3d2b1f]">Tournament Calendar</h1>
        <p className="text-xs text-[#8a6a55] mt-1">
          Week {team.week} &middot; {MONTH_NAMES[currentMonth]}
        </p>
      </div>

      {Array.from(monthGroups.entries())
        .sort(([a], [b]) => a - b)
        .map(([monthIdx, monthTournaments]) => {
          const [startWk, endWk] = MONTH_WEEK_RANGES[monthIdx]
          const isPastMonth = endWk < team.week
          const isCurrentMonth = monthIdx === currentMonth

          return (
            <div key={monthIdx}>
              {/* Month header */}
              <div className={`flex items-center gap-3 mb-3 ${isPastMonth ? 'opacity-40' : ''}`}>
                <h2 className="text-sm font-semibold text-[#3d2b1f]">{MONTH_NAMES[monthIdx]}</h2>
                <div className="text-xs text-[#8a6a55]">Weeks {startWk}\u2013{endWk}</div>
                {isCurrentMonth && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#3d2b1f]/10 text-[#3d2b1f]">
                    Current
                  </span>
                )}
                <div className="flex-1 border-b border-[#e8d8bc]" />
                <div className="text-xs text-[#8a6a55]">
                  {monthTournaments.length} event{monthTournaments.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {monthTournaments.map((t) => (
                  <TournamentRow
                    key={t.id}
                    t={t}
                    team={team}
                    players={players}
                    registerForTournament={registerForTournament}
                    unregisterFromTournament={unregisterFromTournament}
                  />
                ))}
              </div>
            </div>
          )
        })}
    </div>
  )
}

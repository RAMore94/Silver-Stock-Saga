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

export function Schedule() {
  const { tournaments, team, players, registerForTournament, unregisterFromTournament } = useGameStore()

  const sorted = [...tournaments].sort((a, b) => a.week - b.week)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Schedule</div>
        <h1 className="text-2xl font-semibold text-[#3d2b1f]">Tournament Calendar</h1>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((t) => {
          const isPast = t.week < team.week
          const isCurrent = t.week === team.week
          const weeksAway = t.week - team.week
          const canRegister = !isPast && !isCurrent

          return (
            <div
              key={t.id}
              className={`bg-[#faf4e8] rounded-2xl px-6 py-5 border border-[#e8d8bc] flex items-start gap-5 ${isPast ? 'opacity-50' : ''}`}
            >
              {/* Week indicator */}
              <div className="text-center w-12 shrink-0">
                <div className="text-xs text-[#8a6a55] uppercase tracking-wide">Wk</div>
                <div className="text-xl font-semibold text-[#3d2b1f]">{t.week}</div>
              </div>

              {/* Tier stripe */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: TIER_COLORS[t.tier] }}
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-[#3d2b1f]">{t.name}</span>
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
                <div className="text-xs text-[#8a6a55] flex gap-4">
                  <span>{t.entrants} entrants</span>
                  <span>${t.prizePool.toLocaleString()} prize pool</span>
                  <span>${t.entryFee} entry/player</span>
                </div>

                {/* Per-player registration controls */}
                {canRegister && (
                  <div className="flex flex-wrap gap-2 mt-3">
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
                          {isRegistered ? `✓ ${p.tag}` : `+ ${p.tag} ($${t.entryFee})`}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Show registered players on current/past tournaments */}
                {!canRegister && t.registeredPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
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
                <div className="text-xs text-[#8a6a55] shrink-0 self-center">
                  in {weeksAway} wk{weeksAway !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

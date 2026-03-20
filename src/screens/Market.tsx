import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getCharacterMeta } from '../data/characters'
import { StatBar } from '../components/StatBar'

const MAX_ROSTER = 5

export function Market() {
  const { players, freeAgents, team, signFreeAgent, releasePlayer } = useGameStore()
  const [confirmRelease, setConfirmRelease] = useState<string | null>(null)

  const weeklyBurn = players.reduce((s, p) => s + p.salary, 0)
  const runway     = weeklyBurn > 0 ? Math.floor(team.balance / weeklyBurn) : Infinity
  const runwayColor = runway < 4 ? '#c97070' : runway < 8 ? '#d4a832' : '#7aaa7a'

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d2b1f]">Player Market</h1>
        <p className="text-sm text-[#8a6a55] mt-1">Sign and release players. Max roster size: {MAX_ROSTER}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Current Roster ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide">
              Your Roster ({players.length}/{MAX_ROSTER})
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#8a6a55]">
              <span>Burn: <span className="font-semibold text-[#3d2b1f]">${weeklyBurn.toLocaleString()}/wk</span></span>
              <span>Runway: <span className="font-semibold" style={{ color: runwayColor }}>
                {runway === Infinity ? '∞' : `${runway}w`}
              </span></span>
            </div>
          </div>

          <div className="space-y-3">
            {players.map((player) => {
              const meta       = getCharacterMeta(player.character)
              const isConfirm  = confirmRelease === player.id
              const isLastOne  = players.length <= 1
              return (
                <div key={player.id} className="bg-[#faf4e8] rounded-xl p-4 border border-[#e8d8bc]">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: meta.color }} />
                      <div>
                        <div className="font-bold text-[#3d2b1f]">{player.tag}</div>
                        <div className="text-xs text-[#8a6a55]">{player.character}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#3d2b1f]">${player.salary.toLocaleString()}/wk</div>
                      <div className="text-xs text-[#8a6a55]">{player.wins}W–{player.losses}L · Rep {player.reputation}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1 mb-3">
                    {(Object.entries(player.stats) as [string, number][]).map(([stat, val]) => (
                      <StatBar key={stat} label={stat} value={val} color="blue" />
                    ))}
                  </div>

                  {/* Release button */}
                  {!isConfirm ? (
                    <button
                      onClick={() => setConfirmRelease(player.id)}
                      disabled={isLastOne}
                      className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isLastOne
                          ? 'bg-[#f2e8d5] text-[#c8b89a] cursor-not-allowed'
                          : 'bg-[#f2e8d5] text-[#c97070] hover:bg-[#f0dede] cursor-pointer'
                      }`}
                    >
                      {isLastOne ? 'Cannot release last player' : 'Release Player'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          releasePlayer(player.id)
                          setConfirmRelease(null)
                        }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[#c97070] text-white hover:bg-[#b85e5e] cursor-pointer transition-all"
                      >
                        Confirm Release
                      </button>
                      <button
                        onClick={() => setConfirmRelease(null)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[#f2e8d5] text-[#8a6a55] hover:bg-[#e8d8bc] cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Free Agents ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide">
              Free Agents ({freeAgents.length} available)
            </h2>
            <span className="text-xs text-[#8a6a55]">
              Balance: <span className="font-semibold text-[#3d2b1f]">${team.balance.toLocaleString()}</span>
            </span>
          </div>

          {freeAgents.length === 0 ? (
            <div className="text-center py-16 text-[#8a6a55] bg-[#faf4e8] rounded-xl border border-[#e8d8bc]">
              <div className="text-3xl mb-2">🏷️</div>
              <div className="font-medium">No free agents available</div>
              <div className="text-sm mt-1">All available players have been signed.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {freeAgents.map((agent) => {
                const meta      = getCharacterMeta(agent.character)
                const rosterFull = players.length >= MAX_ROSTER
                const cantAfford = team.balance < agent.salaryAsk * 4
                const disabled   = rosterFull || cantAfford
                const reason     = rosterFull
                  ? 'Roster full (5/5)'
                  : cantAfford
                  ? `Needs $${(agent.salaryAsk * 4).toLocaleString()} (4wk buffer)`
                  : null

                return (
                  <div key={agent.id} className="bg-[#faf4e8] rounded-xl p-4 border border-[#e8d8bc]">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: meta.color }} />
                        <div>
                          <div className="font-bold text-[#3d2b1f]">{agent.tag}</div>
                          <div className="text-xs text-[#8a6a55]">{agent.character}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#3d2b1f]">${agent.salaryAsk.toLocaleString()}/wk</div>
                        <div className="text-xs text-[#8a6a55]">Rep {agent.reputation}</div>
                      </div>
                    </div>

                    {/* Form/Fatigue */}
                    <div className="flex gap-3 mb-3 text-xs text-[#8a6a55]">
                      <span>Form <span className="font-semibold text-[#3d2b1f]">{agent.form}</span></span>
                      <span>Fatigue <span className="font-semibold text-[#3d2b1f]">{agent.fatigue}</span></span>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1 mb-3">
                      {(Object.entries(agent.stats) as [string, number][]).map(([stat, val]) => (
                        <StatBar key={stat} label={stat} value={val} color="blue" />
                      ))}
                    </div>

                    {/* Sign button */}
                    <button
                      onClick={() => signFreeAgent(agent.id)}
                      disabled={disabled}
                      title={reason ?? undefined}
                      className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all ${
                        disabled
                          ? 'bg-[#f2e8d5] text-[#c8b89a] cursor-not-allowed'
                          : 'bg-[#a8c8e8] text-[#3d2b1f] hover:bg-[#90b8d8] cursor-pointer'
                      }`}
                    >
                      {reason ?? `Sign — $${agent.salaryAsk.toLocaleString()}/wk`}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import type { Player } from '../types'
import { getCharacterMeta } from '../data/characters'
import { StatBar } from './StatBar'
import { ActivityPicker } from './ActivityPicker'
import { useGameStore } from '../store/gameStore'

interface PlayerCardProps {
  player: Player
}

function FatigueIndicator({ value }: { value: number }) {
  const level = value < 30 ? 'Fresh' : value < 60 ? 'Tired' : 'Burnt Out'
  const color = value < 30 ? '#7aaa7a' : value < 60 ? '#c9a84c' : '#c97070'
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}22` }}>
      {level}
    </span>
  )
}

export function PlayerCard({ player }: PlayerCardProps) {
  const setPlayerActivity = useGameStore((s) => s.setPlayerActivity)
  const meta = getCharacterMeta(player.character)

  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0

  return (
    <div className="bg-[#faf4e8] rounded-2xl p-5 shadow-sm border border-[#e8d8bc] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[#3d2b1f]">{player.tag}</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: meta.color, backgroundColor: `${meta.color}22` }}
            >
              {player.character}
            </span>
          </div>
          <div className="text-xs text-[#8a6a55] mt-0.5">{player.name}</div>
        </div>
        <FatigueIndicator value={player.fatigue} />
      </div>

      {/* Form bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#8a6a55] w-24 shrink-0 font-medium uppercase tracking-wide">Form</span>
        <div className="flex-1 h-2 bg-[#e8d8bc] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#c9a84c] transition-all duration-500"
            style={{ width: `${player.form}%` }}
          />
        </div>
        <span className="text-xs text-[#6b5040] w-6 text-right tabular-nums">{player.form}</span>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2">
        <StatBar label="Execution" value={player.stats.execution} />
        <StatBar label="Neutral" value={player.stats.neutral} />
        <StatBar label="Mental" value={player.stats.mental} />
        <StatBar label="Adaptability" value={player.stats.adaptability} />
      </div>

      {/* Record */}
      <div className="flex items-center gap-4 text-xs text-[#8a6a55]">
        <span>
          <span className="text-[#7aaa7a] font-semibold">{player.wins}W</span>
          {' / '}
          <span className="text-[#c97070] font-semibold">{player.losses}L</span>
        </span>
        <span>{winRate}% WR</span>
        <span className="ml-auto text-[#6b5040]">Rep {player.reputation}</span>
      </div>

      {/* Weekly Activity */}
      <div>
        <div className="text-xs text-[#8a6a55] font-medium uppercase tracking-wide mb-2">This Week</div>
        <ActivityPicker
          value={player.weekActivity}
          onChange={(activity) => setPlayerActivity(player.id, activity)}
        />
      </div>

      {/* Salary */}
      <div className="text-xs text-[#8a6a55] border-t border-[#e8d8bc] pt-3">
        Salary: <span className="text-[#3d2b1f] font-medium">${player.salary.toLocaleString()}/wk</span>
      </div>
    </div>
  )
}

import { useGameStore } from '../store/gameStore'
import { PlayerCard } from '../components/PlayerCard'

export function Roster() {
  const { players, team } = useGameStore()

  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0)
  const weeksRunway = Math.floor(team.balance / totalSalary)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Roster</div>
          <h1 className="text-2xl font-semibold text-[#3d2b1f]">{players.length} Players</h1>
        </div>
        <div className="text-right text-sm text-[#8a6a55]">
          <div>
            Total salary:{' '}
            <span className="font-semibold text-[#3d2b1f]">${totalSalary.toLocaleString()}/wk</span>
          </div>
          <div>
            Runway:{' '}
            <span className="font-semibold text-[#3d2b1f]">{weeksRunway} weeks</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}

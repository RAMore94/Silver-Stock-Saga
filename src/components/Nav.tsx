import type { Screen } from '../types'
import { useGameStore } from '../store/gameStore'

const NAV_ITEMS: { screen: Screen; label: string }[] = [
  { screen: 'dashboard', label: 'Dashboard' },
  { screen: 'roster', label: 'Roster' },
  { screen: 'schedule', label: 'Schedule' },
  { screen: 'rankings', label: 'Rankings' },
  { screen: 'training', label: 'Training' },
  { screen: 'finances', label: 'Finances' },
]

export function Nav() {
  const { screen, setScreen, team } = useGameStore()

  return (
    <header className="bg-[#faf4e8] border-b border-[#e8d8bc] sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo / org name */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#a8c8e8] flex items-center justify-center">
            <span className="text-xs font-bold text-[#3d2b1f]">{team.tag}</span>
          </div>
          <span className="font-semibold text-[#3d2b1f] text-sm">{team.name}</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${screen === item.screen
                  ? 'bg-[#a8c8e8] text-[#3d2b1f]'
                  : 'text-[#8a6a55] hover:text-[#3d2b1f] hover:bg-[#f2e8d5]'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Week + balance */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#8a6a55]">Week <span className="font-semibold text-[#3d2b1f]">{team.week}</span></span>
          <span className="text-[#8a6a55]">
            <span className="font-semibold text-[#3d2b1f]">${team.balance.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

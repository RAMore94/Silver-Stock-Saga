import type { Screen } from '../types'
import { useGameStore } from '../store/gameStore'

const ROW1: { id: Screen; label: string }[] = [
  { id: 'dashboard',    label: 'Dashboard'  },
  { id: 'roster',       label: 'Roster'     },
  { id: 'training',     label: 'Training'   },
  { id: 'finances',     label: 'Finances'   },
  { id: 'schedule',     label: 'Schedule'   },
  { id: 'rankings',     label: 'Rankings'   },
]

const ROW2: { id: Screen; label: string }[] = [
  { id: 'scouting',     label: 'Scouting'   },
  { id: 'market',       label: 'Market'     },
  { id: 'sponsorships', label: 'Sponsors'   },
  { id: 'history',      label: 'History'    },
  { id: 'map',          label: 'Map'        },
]

export function Nav() {
  const { screen, setScreen, team } = useGameStore()

  function NavBtn({ id, label }: { id: Screen; label: string }) {
    return (
      <button
        key={id}
        onClick={() => setScreen(id)}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap
          ${screen === id
            ? 'bg-[#a8c8e8] text-[#3d2b1f]'
            : 'text-[#8a6a55] hover:text-[#3d2b1f] hover:bg-[#f2e8d5]'
          }
        `}
      >
        {label}
      </button>
    )
  }

  return (
    <header className="bg-[#faf4e8] border-b border-[#e8d8bc] sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top row: logo + core nav + stats */}
        <div className="flex items-center justify-between h-12 gap-4">
          {/* Logo / org name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#3d2b1f] flex items-center justify-center">
              <span className="text-xs font-bold text-[#c9a84c]">{team.tag}</span>
            </div>
            <span className="font-semibold text-[#3d2b1f] text-sm hidden sm:block">{team.name}</span>
          </div>

          {/* Core nav */}
          <nav className="flex items-center gap-0.5 overflow-x-auto flex-1">
            {ROW1.map(({ id, label }) => <NavBtn key={id} id={id} label={label} />)}
          </nav>

          {/* Status: rep · week · balance */}
          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="hidden md:block text-[#8a6a55]">
              Rep <span className="font-semibold text-[#3d2b1f]">{team.reputation}</span>
            </span>
            <span className="text-[#8a6a55]">
              Wk <span className="font-semibold text-[#3d2b1f]">{team.week}</span>
            </span>
            <span className="text-[#8a6a55]">
              <span className="font-semibold text-[#3d2b1f]">${team.balance.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Second row: strategy screens */}
        <div className="flex items-center gap-0.5 pb-1.5 border-t border-[#f2e8d5] pt-1">
          {ROW2.map(({ id, label }) => <NavBtn key={id} id={id} label={label} />)}
        </div>
      </div>
    </header>
  )
}

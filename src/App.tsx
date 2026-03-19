import { Nav } from './components/Nav'
import { Dashboard } from './screens/Dashboard'
import { Roster } from './screens/Roster'
import { Schedule } from './screens/Schedule'
import { Rankings } from './screens/Rankings'
import { Placeholder } from './screens/Placeholder'
import { TournamentReportModal } from './components/TournamentReport'
import { useGameStore } from './store/gameStore'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  return (
    <div className="min-h-screen bg-[#f2e8d5]">
      <Nav />
      <main>
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'roster' && <Roster />}
        {screen === 'schedule' && <Schedule />}
        {screen === 'rankings' && <Rankings />}
        {screen === 'training' && (
          <Placeholder
            title="Training Hub"
            description="Allocate focused training blocks, run drills, and review character-specific practice sessions."
          />
        )}
        {screen === 'finances' && (
          <Placeholder
            title="Finances"
            description="Track income, sponsorship deals, prize earnings, and manage player contracts."
          />
        )}
      </main>
      <TournamentReportModal />
    </div>
  )
}

import { Nav } from './components/Nav'
import { Dashboard } from './screens/Dashboard'
import { Roster } from './screens/Roster'
import { Schedule } from './screens/Schedule'
import { Rankings } from './screens/Rankings'
import { Training } from './screens/Training'
import { Finances } from './screens/Finances'
import { History } from './screens/History'
import { Scouting } from './screens/Scouting'
import { WorldMap } from './screens/Map'
import { Market } from './screens/Market'
import { Sponsorships } from './screens/Sponsorships'
import { TournamentReportModal } from './components/TournamentReport'
import { useGameStore } from './store/gameStore'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  return (
    <div className="min-h-screen bg-[#f2e8d5]">
      <Nav />
      <main>
        {screen === 'dashboard'    && <Dashboard />}
        {screen === 'roster'       && <Roster />}
        {screen === 'training'     && <Training />}
        {screen === 'finances'     && <Finances />}
        {screen === 'schedule'     && <Schedule />}
        {screen === 'rankings'     && <Rankings />}
        {screen === 'history'      && <History />}
        {screen === 'scouting'     && <Scouting />}
        {screen === 'map'          && <WorldMap />}
        {screen === 'market'       && <Market />}
        {screen === 'sponsorships' && <Sponsorships />}
      </main>
      <TournamentReportModal />
    </div>
  )
}

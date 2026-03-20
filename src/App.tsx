import { Nav } from './components/Nav'
import { Dashboard } from './screens/Dashboard'
import { Roster } from './screens/Roster'
import { Schedule } from './screens/Schedule'
import { Rankings } from './screens/Rankings'
import { Training } from './screens/Training'
import { Finances } from './screens/Finances'
import { Placeholder } from './screens/Placeholder'
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
        {screen === 'map'          && <Placeholder title="World Map"     description="Explore tournament locations across North America on an interactive map." />}
        {screen === 'scouting'     && <Placeholder title="Scouting"      description="Research opponents, scout rival teams, and build intel on the competition." />}
        {screen === 'market'       && <Placeholder title="Player Market" description="Sign and release players. Browse the free agent pool and negotiate contracts." />}
        {screen === 'sponsorships' && <Placeholder title="Sponsorships"  description="Manage brand deals, unlock sponsor tiers, and grow team revenue." />}
        {screen === 'history'      && <Placeholder title="Season History" description="Full season stats, week-by-week recaps, and career records for every player." />}
      </main>
      <TournamentReportModal />
    </div>
  )
}

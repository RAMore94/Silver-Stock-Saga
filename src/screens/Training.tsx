import { useGameStore } from '../store/gameStore'
import { StatBar } from '../components/StatBar'
import { ActivityPicker } from '../components/ActivityPicker'
import { getCharacterMeta } from '../data/characters'
import type { Player, WeekActivity } from '../types'

// ── Activity effect definitions ───────────────────────────────────────────────

function getActivityPreview(player: Player, activity: WeekActivity): string[] {
  const lines: string[] = []
  switch (activity) {
    case 'train': {
      const weakStat = (Object.entries(player.stats) as [string, number][])
        .sort(([, a], [, b]) => a - b)[0][0]
      const label = weakStat.charAt(0).toUpperCase() + weakStat.slice(1)
      lines.push(`${label} +2`)
      lines.push('Fatigue +15')
      lines.push('Form −5')
      break
    }
    case 'rest':
      lines.push('Fatigue −25')
      lines.push('Form +8')
      break
    case 'local':
      lines.push('Fatigue +8')
      lines.push('Form +3')
      lines.push('Light match reps')
      break
    case 'prep':
      lines.push('Fatigue +5')
      lines.push('Form +5')
      lines.push('+5% EPR in tournament this week')
      break
  }
  return lines
}

function conditionLabel(fatigue: number): { label: string; color: string } {
  if (fatigue < 35) return { label: 'Fresh', color: '#7aaa7a' }
  if (fatigue < 65) return { label: 'Tired', color: '#c9a84c' }
  return { label: 'Burnt Out', color: '#c97070' }
}

function recommendedActivity(player: Player): WeekActivity {
  if (player.fatigue >= 65) return 'rest'
  if (player.fatigue >= 45) return 'local'
  return 'train'
}

// ── Top-level stats summary bar ───────────────────────────────────────────────

function ReadinessSummary({ players }: { players: Player[] }) {
  const fresh = players.filter((p) => p.fatigue < 35).length
  const tired = players.filter((p) => p.fatigue >= 35 && p.fatigue < 65).length
  const burnt = players.filter((p) => p.fatigue >= 65).length

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {fresh > 0 && (
        <span style={{ color: '#7aaa7a' }} className="font-medium">
          {fresh} Fresh
        </span>
      )}
      {tired > 0 && (
        <span style={{ color: '#c9a84c' }} className="font-medium">
          {tired} Tired
        </span>
      )}
      {burnt > 0 && (
        <span style={{ color: '#c97070' }} className="font-medium">
          {burnt} Burnt Out — rest recommended
        </span>
      )}
    </div>
  )
}

// ── Per-player training card ──────────────────────────────────────────────────

function TrainingCard({ player, onActivityChange }: {
  player: Player
  onActivityChange: (activity: WeekActivity) => void
}) {
  const meta = getCharacterMeta(player.character)
  const condition = conditionLabel(player.fatigue)
  const preview = getActivityPreview(player, player.weekActivity)
  const rec = recommendedActivity(player)

  // Top affinity stat for hint
  const topAffinity = (Object.entries(meta.affinities) as [string, number][])
    .sort(([, a], [, b]) => b - a)[0]
  const topAffinityLabel = topAffinity[0].charAt(0).toUpperCase() + topAffinity[0].slice(1)

  const fatigueColor =
    player.fatigue < 35 ? '#7aaa7a' :
    player.fatigue < 65 ? '#c9a84c' : '#c97070'

  return (
    <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e8d8bc]">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#3d2b1f]">{player.tag}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: meta.color, backgroundColor: `${meta.color}22` }}
            >
              {player.character}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: condition.color, backgroundColor: `${condition.color}22` }}
            >
              {condition.label}
            </span>
          </div>
          <div className="text-xs text-[#8a6a55] mt-0.5">{player.name}</div>
        </div>
        <div className="text-right text-xs text-[#8a6a55]">
          <div>{player.wins}W – {player.losses}L</div>
          <div>Rep {player.reputation}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#e8d8bc]">

        {/* Condition panel */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium">Condition</div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8a6a55]">Form</span>
              <span className="text-xs font-medium text-[#c9a84c]">{player.form}</span>
            </div>
            <div className="w-full h-2 bg-[#e8d8bc] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${player.form}%`, backgroundColor: '#c9a84c' }}
              />
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[#8a6a55]">Fatigue</span>
              <span className="text-xs font-medium" style={{ color: fatigueColor }}>{player.fatigue}</span>
            </div>
            <div className="w-full h-2 bg-[#e8d8bc] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${player.fatigue}%`, backgroundColor: fatigueColor }}
              />
            </div>
          </div>

          {/* Character affinity hint */}
          <div className="mt-1 text-xs text-[#8a6a55] bg-[#f2e8d5] rounded-lg px-3 py-2">
            <span style={{ color: meta.color }} className="font-medium">{player.character}</span>
            {' '}benefits most from{' '}
            <span className="font-medium text-[#3d2b1f]">{topAffinityLabel}</span>
            {topAffinity[1] > 0 ? ` (+${topAffinity[1]} affinity)` : ''}
          </div>
        </div>

        {/* Stats panel */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium">Stats</div>
          <div className="flex flex-col gap-2">
            <StatBar label="Execution"    value={player.stats.execution}    color="blue" />
            <StatBar label="Neutral"      value={player.stats.neutral}      color="blue" />
            <StatBar label="Mental"       value={player.stats.mental}       color="blue" />
            <StatBar label="Adaptability" value={player.stats.adaptability} color="blue" />
          </div>
        </div>

        {/* Activity panel */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium">This Week</div>
            {rec !== player.weekActivity && (
              <button
                onClick={() => onActivityChange(rec)}
                className="text-xs text-[#8a6a55] underline cursor-pointer"
              >
                Rec: {rec}
              </button>
            )}
          </div>

          <ActivityPicker
            value={player.weekActivity}
            onChange={onActivityChange}
          />

          {/* Effect preview */}
          <div className="bg-[#f2e8d5] rounded-lg px-3 py-2">
            <div className="text-xs text-[#8a6a55] font-medium mb-1">This week:</div>
            {preview.map((line) => (
              <div key={line} className="text-xs text-[#3d2b1f]">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function Training() {
  const { players, team, setPlayerActivity } = useGameStore()

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Training</div>
          <h1 className="text-2xl font-semibold text-[#3d2b1f]">Weekly Prep</h1>
          <p className="text-xs text-[#8a6a55] mt-1">Week {team.week} — assign activities before advancing</p>
        </div>
        <ReadinessSummary players={players} />
      </div>

      {/* Player cards */}
      <div className="flex flex-col gap-4">
        {players.map((player) => (
          <TrainingCard
            key={player.id}
            player={player}
            onActivityChange={(activity) => setPlayerActivity(player.id, activity)}
          />
        ))}
      </div>

      {/* Activity legend */}
      <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] px-5 py-4">
        <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-3">Activity Reference</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { name: 'Train',       effect: 'Weakest stat +2 · Fatigue +15 · Form −5' },
            { name: 'Rest',        effect: 'Fatigue −25 · Form +8' },
            { name: 'Local Scene', effect: 'Fatigue +8 · Form +3 · Match reps' },
            { name: 'Prep',        effect: 'Fatigue +5 · Form +5 · +5% EPR vs this week\'s tournament' },
          ] as const).map((a) => (
            <div key={a.name} className="bg-[#f2e8d5] rounded-xl px-3 py-2">
              <div className="text-xs font-semibold text-[#3d2b1f] mb-0.5">{a.name}</div>
              <div className="text-xs text-[#8a6a55]">{a.effect}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useGameStore } from '../store/gameStore'
import type { PlayerTournamentResult, SetResult } from '../types'

const TIER_COLORS = {
  local: '#a8c8e8',
  regional: '#c9a84c',
  major: '#c97070',
  supermajor: '#805080',
}

const NARRATIVE_LABELS = {
  dominant: 'Dominant',
  comfortable: 'Win',
  close: 'Close',
  upset: 'Upset',
  reverse_sweep: 'Reverse Sweep!',
}

const NARRATIVE_COLORS = {
  dominant: '#7aaa7a',
  comfortable: '#7aaa7a',
  close: '#c9a84c',
  upset: '#c97070',
  reverse_sweep: '#805080',
}

function placementLabel(placement: number): string {
  if (placement === 1) return '1st'
  if (placement === 2) return '2nd'
  if (placement === 3) return '3rd'
  return `${placement}th`
}

function placementColor(placement: number): string {
  if (placement === 1) return '#c9a84c'   // gold
  if (placement === 2) return '#a8a8b8'   // silver
  if (placement === 3) return '#c97050'   // bronze
  return '#8a6a55'
}

function SetRow({ set }: { set: SetResult }) {
  const resultColor = set.win ? '#7aaa7a' : '#c97070'
  const score = `${set.playerScore}–${set.opponentScore}`

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#e8d8bc] last:border-0">
      {/* Win/loss indicator */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: resultColor }}
      />

      {/* Round name */}
      <div className="text-xs text-[#8a6a55] w-36 shrink-0">{set.round}</div>

      {/* Opponent */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-[#8a6a55] font-mono">#{set.opponentSeed}</span>
        <span className="text-sm font-medium text-[#3d2b1f]">{set.opponentTag}</span>
        <span className="text-xs text-[#8a6a55]">({set.opponentCharacter})</span>
        {set.isBo5 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-[#e8d8bc] text-[#8a6a55]">Bo5</span>
        )}
      </div>

      {/* Score */}
      <div className="text-sm font-mono font-semibold text-[#3d2b1f] w-10 text-right">
        {score}
      </div>

      {/* Narrative tag */}
      <div
        className="text-xs font-medium px-2 py-0.5 rounded-full w-28 text-center shrink-0"
        style={{
          color: NARRATIVE_COLORS[set.narrative],
          backgroundColor: `${NARRATIVE_COLORS[set.narrative]}22`,
        }}
      >
        {NARRATIVE_LABELS[set.narrative]}
      </div>
    </div>
  )
}

function PlayerResultCard({
  result,
  playerTag,
  playerCharacter,
}: {
  result: PlayerTournamentResult
  playerTag: string
  playerCharacter: string
}) {
  const color = placementColor(result.placement)

  return (
    <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
      {/* Player header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-[#e8d8bc]">
        <div
          className="text-2xl font-bold w-16 shrink-0"
          style={{ color }}
        >
          {placementLabel(result.placement)}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-[#3d2b1f]">{playerTag}</div>
          <div className="text-xs text-[#8a6a55]">{playerCharacter}</div>
        </div>
        <div className="text-right">
          {result.prizeEarned > 0 ? (
            <div className="text-sm font-semibold text-[#7aaa7a]">
              +${result.prizeEarned.toLocaleString()}
            </div>
          ) : (
            <div className="text-sm text-[#8a6a55]">No payout</div>
          )}
          {result.repGained > 0 && (
            <div className="text-xs text-[#8a6a55]">+{result.repGained} rep</div>
          )}
        </div>
        <div className="text-xs text-[#8a6a55] text-right shrink-0">
          <div>{result.setsWon}W – {result.setsLost}L</div>
        </div>
      </div>

      {/* Set history */}
      {result.setHistory.length > 0 && (
        <div className="px-5">
          {result.setHistory.map((set, i) => (
            <SetRow key={i} set={set} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TournamentReportModal() {
  const { pendingReport, dismissReport, players } = useGameStore()

  if (!pendingReport) return null

  const tierColor = TIER_COLORS[pendingReport.tier]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#3d2b1f]/40"
        onClick={dismissReport}
      />

      {/* Modal */}
      <div className="relative bg-[#fdf8ef] rounded-3xl border border-[#e8d8bc] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e8d8bc] flex items-center gap-3">
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: tierColor }}
          />
          <div className="flex-1">
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-0.5">
              Tournament Results
            </div>
            <h2 className="text-lg font-semibold text-[#3d2b1f]">{pendingReport.tournamentName}</h2>
          </div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
            style={{ color: tierColor, backgroundColor: `${tierColor}22` }}
          >
            {pendingReport.tier}
          </span>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {pendingReport.playerResults.map((result) => {
            const player = players.find((p) => p.id === result.playerId)
            return (
              <PlayerResultCard
                key={result.playerId}
                result={result}
                playerTag={player?.tag ?? result.playerId}
                playerCharacter={player?.character ?? ''}
              />
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e8d8bc] flex justify-end">
          <button
            onClick={dismissReport}
            className="px-5 py-2.5 bg-[#3d2b1f] text-[#faf4e8] rounded-xl text-sm font-medium hover:bg-[#4a3628] transition-colors cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

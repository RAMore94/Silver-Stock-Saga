import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getNPCPool } from '../engine/npcs'
import { getMatchupAdvantage } from '../engine/matchups'
import { getCharacterMeta, CHARACTERS } from '../data/characters'
import type { TournamentTier, Character } from '../types'

const TIERS: TournamentTier[] = ['local', 'regional', 'major', 'supermajor']
const TIER_LABELS: Record<TournamentTier, string> = {
  local: 'Local',
  regional: 'Regional',
  major: 'Major',
  supermajor: 'Supermajor',
}
const TIER_COLORS: Record<TournamentTier, string> = {
  local:      '#b0a090',
  regional:   '#5b9e8a',
  major:      '#6b9bd2',
  supermajor: '#d4a832',
}

function ratingLabel(rating: number): string {
  if (rating >= 140) return 'Elite'
  if (rating >= 110) return 'Top Threat'
  if (rating >= 80)  return 'Contender'
  if (rating >= 55)  return 'Mid-Field'
  return 'Entry-Level'
}
function ratingColor(rating: number): string {
  if (rating >= 140) return '#c97050'
  if (rating >= 110) return '#d4a832'
  if (rating >= 80)  return '#6b9bd2'
  if (rating >= 55)  return '#5b9e8a'
  return '#b0a090'
}

export function Scouting() {
  const { players } = useGameStore()
  const [selectedTier, setSelectedTier]           = useState<TournamentTier>('regional')
  const [selectedPlayerId, setSelectedPlayerId]   = useState<string>(players[0]?.id ?? '')

  const pool = getNPCPool(selectedTier)
  // Deduplicate by tag (same NPC can appear in multiple tier pools)
  const uniquePool = pool.filter((npc, i, arr) => arr.findIndex((n) => n.tag === npc.tag) === i)
  const sorted     = [...uniquePool].sort((a, b) => b.rating - a.rating)

  const topThreats  = sorted.filter((n) => n.rating >= 110)
  const midField    = sorted.filter((n) => n.rating >= 55 && n.rating < 110)
  const entryLevel  = sorted.filter((n) => n.rating < 55)

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)
  const myCharacter    = selectedPlayer?.character

  // All characters that appear in the matchup table (the ones that matter)
  const relevantChars: Character[] = [
    'Fox', 'Falco', 'Marth', 'Sheik', 'Jigglypuff', 'Peach',
    'Captain Falcon', 'Ice Climbers', 'Donkey Kong',
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d2b1f]">Scouting</h1>
        <p className="text-sm text-[#8a6a55] mt-1">Opponent intelligence and matchup analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: NPC Pool by Tier ── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-2">Opponent Pool</h2>
            <div className="flex gap-1 bg-[#f2e8d5] rounded-xl p-1">
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedTier === tier
                      ? 'bg-[#faf4e8] text-[#3d2b1f] shadow-sm'
                      : 'text-[#8a6a55] hover:text-[#3d2b1f]'
                  }`}
                >
                  {TIER_LABELS[tier]}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped NPC list */}
          {[
            { label: 'Top Threats',  list: topThreats,  show: topThreats.length > 0 },
            { label: 'Contenders',   list: midField,    show: midField.length > 0 },
            { label: 'Entry-Level',  list: entryLevel,  show: entryLevel.length > 0 },
          ].map(({ label, list, show }) =>
            show ? (
              <div key={label}>
                <div className="text-xs font-semibold text-[#8a6a55] uppercase tracking-wide mb-2">{label}</div>
                <div className="space-y-1.5">
                  {list.map((npc) => {
                    const meta = getCharacterMeta(npc.character)
                    return (
                      <div
                        key={npc.tag}
                        className="bg-[#faf4e8] rounded-lg px-3 py-2.5 border border-[#e8d8bc] flex items-center gap-3"
                      >
                        {/* Character color dot */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="font-semibold text-[#3d2b1f] text-sm w-20 shrink-0">{npc.tag}</span>
                        <span className="text-xs text-[#8a6a55] flex-1">{npc.character}</span>
                        {/* Rating bar */}
                        <div className="w-20 h-1.5 bg-[#f2e8d5] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((npc.rating / 165) * 100)}%`,
                              backgroundColor: ratingColor(npc.rating),
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-medium w-20 text-right shrink-0"
                          style={{ color: ratingColor(npc.rating) }}
                        >
                          {ratingLabel(npc.rating)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* ── Right: Matchup Chart ── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-2">Matchup Analysis</h2>
            {players.length > 1 && (
              <div className="flex gap-1 bg-[#f2e8d5] rounded-xl p-1 mb-4">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedPlayerId === p.id
                        ? 'bg-[#faf4e8] text-[#3d2b1f] shadow-sm'
                        : 'text-[#8a6a55] hover:text-[#3d2b1f]'
                    }`}
                  >
                    {p.tag}
                  </button>
                ))}
              </div>
            )}

            {selectedPlayer && myCharacter && (
              <div className="bg-[#faf4e8] rounded-xl border border-[#e8d8bc] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#e8d8bc] flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getCharacterMeta(myCharacter).color }}
                  />
                  <span className="font-semibold text-[#3d2b1f]">{selectedPlayer.tag}</span>
                  <span className="text-sm text-[#8a6a55]">playing {myCharacter}</span>
                </div>

                {/* Matchup rows */}
                <div className="divide-y divide-[#f2e8d5]">
                  {relevantChars
                    .filter((c) => c !== myCharacter)
                    .map((opponent) => {
                      const adv   = getMatchupAdvantage(myCharacter, opponent)
                      const meta  = getCharacterMeta(opponent)
                      const label = adv > 10 ? 'Heavily Favored' : adv > 4 ? 'Favored' : adv >= -4 ? 'Even' : adv >= -10 ? 'Disadvantaged' : 'Heavily Disfavored'
                      const color = adv > 4 ? '#7aaa7a' : adv >= -4 ? '#8a9ab0' : '#c97070'
                      return (
                        <div key={opponent} className="px-4 py-2.5 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                          <span className="text-sm text-[#3d2b1f] flex-1">{opponent}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium w-28 text-right" style={{ color }}>{label}</span>
                            <span
                              className="text-xs font-bold w-8 text-right"
                              style={{ color }}
                            >
                              {adv > 0 ? `+${adv}` : adv}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>

                {/* Footer note */}
                <div className="px-4 py-2.5 border-t border-[#e8d8bc] text-xs text-[#b0a090]">
                  Each matchup point shifts win probability by ~1.25%. Range: −20 to +20.
                </div>
              </div>
            )}

            {players.length === 0 && (
              <div className="text-center py-10 text-[#8a6a55] text-sm">No players on roster.</div>
            )}
          </div>

          {/* Character tier reference */}
          <div>
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-2">Character Tiers</h2>
            <div className="bg-[#faf4e8] rounded-xl border border-[#e8d8bc] overflow-hidden">
              {(['S', 'A', 'B', 'C'] as const).map((tier) => {
                const chars = CHARACTERS.filter((c) => c.tier === tier)
                return (
                  <div key={tier} className="px-4 py-2.5 border-b border-[#f2e8d5] last:border-0 flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8a6a55] w-4">{tier}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {chars.map((c) => (
                        <span
                          key={c.name}
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tournament tier intel */}
          <div>
            <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-2">Field Strength by Tier</h2>
            <div className="bg-[#faf4e8] rounded-xl border border-[#e8d8bc] overflow-hidden">
              {TIERS.map((tier) => {
                const pool = getNPCPool(tier)
                const unique = pool.filter((n, i, arr) => arr.findIndex((x) => x.tag === n.tag) === i)
                const avg = Math.round(unique.reduce((s, n) => s + n.rating, 0) / unique.length)
                const max = Math.max(...unique.map((n) => n.rating))
                return (
                  <div key={tier} className="px-4 py-2.5 border-b border-[#f2e8d5] last:border-0 flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white w-24 text-center shrink-0"
                      style={{ backgroundColor: TIER_COLORS[tier] }}
                    >
                      {TIER_LABELS[tier]}
                    </span>
                    <span className="text-xs text-[#8a6a55] flex-1">{unique.length} unique opponents</span>
                    <span className="text-xs text-[#8a6a55]">Avg <span className="text-[#3d2b1f] font-medium">{avg}</span></span>
                    <span className="text-xs text-[#8a6a55]">Top <span className="text-[#3d2b1f] font-medium">{max}</span></span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

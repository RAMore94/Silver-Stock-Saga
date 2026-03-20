import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Tournament, TournamentTier, TournamentRegion } from '../types'

const TIER_COLORS: Record<TournamentTier, string> = {
  local:      '#b0a090',
  regional:   '#5b9e8a',
  major:      '#6b9bd2',
  supermajor: '#d4a832',
}
const TIER_LABELS: Record<TournamentTier, string> = {
  local: 'Local', regional: 'Regional', major: 'Major', supermajor: 'Supermajor',
}
const REGION_LABELS: Record<TournamentRegion, string> = {
  west: 'West Coast', northwest: 'Northwest', midwest: 'Midwest',
  northeast: 'Northeast', south: 'South', southwest: 'Southwest',
  western_canada: 'Western Canada', eastern_canada: 'Eastern Canada',
}

// Map viewport dimensions
const MAP_W = 700
const MAP_H = 420

// Bounding box for North America
const LAT_MAX = 55.0
const LAT_MIN = 24.5
const LNG_MIN = -127.5
const LNG_MAX = -62.0

function toXY(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H
  return { x, y }
}

interface CityGroup {
  city: string
  lat: number
  lng: number
  tournaments: Tournament[]
  highestTier: TournamentTier
}

const TIER_ORDER: TournamentTier[] = ['supermajor', 'major', 'regional', 'local']
function highestTier(tiers: TournamentTier[]): TournamentTier {
  for (const t of TIER_ORDER) {
    if (tiers.includes(t)) return t
  }
  return 'local'
}

// Pin size by tier
function pinSize(tier: TournamentTier): number {
  if (tier === 'supermajor') return 14
  if (tier === 'major')      return 11
  if (tier === 'regional')   return 8
  return 6
}

export function WorldMap() {
  const { tournaments, team } = useGameStore()
  const [selectedCity, setSelectedCity]       = useState<string | null>(null)
  const [tierFilter, setTierFilter]           = useState<TournamentTier | 'all'>('all')
  const [hoveredCity, setHoveredCity]         = useState<string | null>(null)

  // Group tournaments by city
  const cityMap = new Map<string, CityGroup>()
  for (const t of tournaments) {
    const key = `${t.location.city},${t.location.state}`
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: `${t.location.city}, ${t.location.state}`,
        lat: t.location.coords.lat,
        lng: t.location.coords.lng,
        tournaments: [],
        highestTier: 'local',
      })
    }
    cityMap.get(key)!.tournaments.push(t)
  }
  // Set highest tier per city
  for (const group of cityMap.values()) {
    group.highestTier = highestTier(group.tournaments.map((t) => t.tier))
  }

  const cities = Array.from(cityMap.values())
  const filtered = tierFilter === 'all' ? cities : cities.filter((c) => c.tournaments.some((t) => t.tier === tierFilter))

  // Sidebar: selected city tournaments or all upcoming
  const sidebarTournaments = selectedCity
    ? cityMap.get(selectedCity)?.tournaments ?? []
    : tournaments.filter((t) => t.week >= team.week).sort((a, b) => a.week - b.week).slice(0, 12)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#3d2b1f]">World Map</h1>
        <p className="text-sm text-[#8a6a55] mt-1">Tournament locations across North America</p>
      </div>

      <div className="flex gap-5">

        {/* ── Map ── */}
        <div className="flex-1 min-w-0">
          {/* Tier filter */}
          <div className="flex gap-1 mb-3 bg-[#f2e8d5] rounded-xl p-1 w-fit">
            {(['all', ...TIER_ORDER] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tierFilter === t
                    ? 'bg-[#faf4e8] text-[#3d2b1f] shadow-sm'
                    : 'text-[#8a6a55] hover:text-[#3d2b1f]'
                }`}
              >
                {t === 'all' ? 'All' : TIER_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Map container */}
          <div
            className="relative rounded-xl overflow-hidden border border-[#e8d8bc]"
            style={{ width: MAP_W, height: MAP_H, backgroundColor: '#e8f0e0' }}
          >
            {/* Ocean/water background */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #d0e8f8 0%, #c8e0f0 100%)' }} />

            {/* Land mass suggestion — rough interior fill */}
            <div
              className="absolute"
              style={{
                left: 30, top: 20, right: 30, bottom: 30,
                backgroundColor: '#dce8c8',
                borderRadius: '40% 35% 30% 45% / 30% 40% 45% 35%',
                opacity: 0.7,
              }}
            />

            {/* US–Canada border hint (approx lat 49°) */}
            {(() => {
              const borderY = toXY(49.0, -90).y
              return (
                <div
                  className="absolute w-full"
                  style={{ top: borderY, height: 1, backgroundColor: '#b8c8a8', opacity: 0.5 }}
                />
              )
            })()}

            {/* Region labels */}
            {[
              { label: 'West Coast', lat: 38, lng: -122 },
              { label: 'Midwest',    lat: 41, lng: -90 },
              { label: 'Northeast',  lat: 44, lng: -73 },
              { label: 'South',      lat: 30, lng: -90 },
              { label: 'Canada',     lat: 52, lng: -95 },
            ].map(({ label, lat, lng }) => {
              const { x, y } = toXY(lat, lng)
              return (
                <div
                  key={label}
                  className="absolute text-xs font-medium pointer-events-none select-none"
                  style={{ left: x, top: y, transform: 'translate(-50%, -50%)', color: '#8a9a7a', opacity: 0.6 }}
                >
                  {label}
                </div>
              )
            })}

            {/* Tournament pins */}
            {filtered.map((group) => {
              const { x, y } = toXY(group.lat, group.lng)
              const size = pinSize(group.highestTier)
              const isSelected = selectedCity === `${group.city}`
              const isHovered  = hoveredCity   === `${group.city}`
              return (
                <div
                  key={group.city}
                  className="absolute cursor-pointer"
                  style={{
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected || isHovered ? 20 : 10,
                  }}
                  onClick={() => setSelectedCity(isSelected ? null : group.city)}
                  onMouseEnter={() => setHoveredCity(group.city)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* Halo for selected */}
                  {isSelected && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: size + 8,
                        height: size + 8,
                        left: -(size + 8) / 2,
                        top: -(size + 8) / 2,
                        backgroundColor: TIER_COLORS[group.highestTier],
                        opacity: 0.25,
                      }}
                    />
                  )}
                  {/* Pin dot */}
                  <div
                    className="rounded-full border-2 border-white shadow-sm"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: TIER_COLORS[group.highestTier],
                      boxShadow: isHovered ? `0 0 6px ${TIER_COLORS[group.highestTier]}88` : undefined,
                    }}
                  />
                  {/* City label on hover/select */}
                  {(isHovered || isSelected) && (
                    <div
                      className="absolute whitespace-nowrap text-xs font-semibold pointer-events-none"
                      style={{
                        bottom: size + 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#faf4e8',
                        border: '1px solid #e8d8bc',
                        borderRadius: 6,
                        padding: '2px 6px',
                        color: '#3d2b1f',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      {group.city}
                      <span className="ml-1.5 text-[10px] font-normal" style={{ color: TIER_COLORS[group.highestTier] }}>
                        {group.tournaments.length} event{group.tournaments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 flex-wrap">
            {TIER_ORDER.map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[t] }} />
                <span className="text-xs text-[#8a6a55]">{TIER_LABELS[t]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-64 shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[#8a6a55]">
              {selectedCity ? selectedCity.split(',')[0] : 'Upcoming Events'}
            </h2>
            {selectedCity && (
              <button
                onClick={() => setSelectedCity(null)}
                className="text-xs text-[#8a6a55] hover:text-[#3d2b1f] cursor-pointer"
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {sidebarTournaments.map((t) => {
              const hasMyPlayers = t.registeredPlayers.length > 0
              const isPast       = t.week < team.week
              return (
                <div
                  key={t.id}
                  className={`bg-[#faf4e8] rounded-lg p-3 border border-[#e8d8bc] ${isPast ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TIER_COLORS[t.tier] }} />
                    <span className="text-xs font-semibold text-[#3d2b1f] leading-tight">{t.name}</span>
                  </div>
                  <div className="text-xs text-[#8a6a55]">
                    {REGION_LABELS[t.region]} · Wk {t.week}
                  </div>
                  <div className="text-xs text-[#8a6a55] mt-0.5">
                    ${t.prizePool.toLocaleString()} pool · {t.entrants} entrants
                  </div>
                  {hasMyPlayers && !isPast && (
                    <div className="mt-1 text-xs font-medium text-[#6b9bd2]">
                      {t.registeredPlayers.length} player{t.registeredPlayers.length !== 1 ? 's' : ''} registered
                    </div>
                  )}
                </div>
              )
            })}
            {sidebarTournaments.length === 0 && (
              <div className="text-xs text-[#8a6a55] text-center py-6">No events to show.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

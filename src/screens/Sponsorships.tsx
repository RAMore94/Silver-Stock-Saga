import { useGameStore } from '../store/gameStore'
import { SPONSORS } from '../data/sponsors'
import type { SponsorTier } from '../types'

const TIER_ORDER: SponsorTier[] = ['bronze', 'silver', 'gold', 'platinum']
const TIER_LABELS: Record<SponsorTier, string> = {
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
}
const TIER_BG: Record<SponsorTier, string> = {
  bronze: '#c49a38', silver: '#9aacbc', gold: '#c9a020', platinum: '#7090c0',
}

const MAX_SPONSORS = 2

export function Sponsorships() {
  const { team, activeSponsors, ledger, signSponsor, dropSponsor } = useGameStore()

  const totalWeeklyIncome = activeSponsors.reduce((sum, id) => {
    const s = SPONSORS.find((sp) => sp.id === id)
    return sum + (s?.weeklyIncome ?? 0)
  }, 0)
  const seasonSponsorIncome = ledger
    .filter((e) => e.type === 'sponsor')
    .reduce((s, e) => s + e.amount, 0)

  const activeSponsorObjects = activeSponsors
    .map((id) => SPONSORS.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d2b1f]">Sponsorships</h1>
        <p className="text-sm text-[#8a6a55] mt-1">Manage brand deals and grow team revenue</p>
      </div>

      {/* ── Active Sponsors ── */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide">
            Active Sponsors ({activeSponsors.length}/{MAX_SPONSORS})
          </h2>
          <div className="text-xs text-[#8a6a55]">
            Weekly income: <span className="font-semibold text-[#7aaa7a]">${totalWeeklyIncome.toLocaleString()}</span>
            {' · '}
            Season total: <span className="font-semibold text-[#3d2b1f]">${seasonSponsorIncome.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeSponsorObjects.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-[#faf4e8] rounded-xl p-5 border-2"
              style={{ borderColor: sponsor.color + '55' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sponsor.color }} />
                    <span className="font-bold text-[#3d2b1f]">{sponsor.name}</span>
                  </div>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: TIER_BG[sponsor.tier] }}
                  >
                    {TIER_LABELS[sponsor.tier]}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#7aaa7a]">${sponsor.weeklyIncome.toLocaleString()}</div>
                  <div className="text-xs text-[#8a6a55]">per week</div>
                </div>
              </div>
              <p className="text-sm text-[#8a6a55] mb-4 leading-relaxed">{sponsor.description}</p>
              <button
                onClick={() => dropSponsor(sponsor.id)}
                className="w-full py-1.5 rounded-lg text-xs font-medium bg-[#f2e8d5] text-[#c97070] hover:bg-[#f0dede] cursor-pointer transition-all"
              >
                Drop Sponsor
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: MAX_SPONSORS - activeSponsorObjects.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-[#f2e8d5] rounded-xl p-5 border-2 border-dashed border-[#e8d8bc] flex items-center justify-center"
            >
              <div className="text-center text-[#b0a090]">
                <div className="text-2xl mb-1">+</div>
                <div className="text-xs">Sponsor slot available</div>
                <div className="text-xs mt-0.5">Sign a sponsor below</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Available Sponsors ── */}
      <div>
        <h2 className="text-sm font-semibold text-[#8a6a55] uppercase tracking-wide mb-3">Available Sponsors</h2>

        {TIER_ORDER.map((tier) => {
          const sponsorsInTier = SPONSORS.filter((s) => s.tier === tier)
          return (
            <div key={tier} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_BG[tier] }} />
                <span className="text-sm font-semibold text-[#3d2b1f]">{TIER_LABELS[tier]} Tier</span>
                <span className="text-xs text-[#8a6a55]">— Rep {sponsorsInTier[0]?.repRequired}+ required</span>
              </div>

              <div className="space-y-2">
                {sponsorsInTier.map((sponsor) => {
                  const isActive        = activeSponsors.includes(sponsor.id)
                  const slotsFull       = activeSponsors.length >= MAX_SPONSORS && !isActive
                  const repLocked       = team.reputation < sponsor.repRequired
                  const canSign         = !isActive && !slotsFull && !repLocked

                  return (
                    <div
                      key={sponsor.id}
                      className={`bg-[#faf4e8] rounded-xl p-4 border border-[#e8d8bc] flex items-center gap-4 ${repLocked ? 'opacity-50' : ''}`}
                    >
                      {/* Color dot */}
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sponsor.color }} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#3d2b1f] text-sm">{sponsor.name}</span>
                          {repLocked && (
                            <span className="text-xs text-[#b0a090]">🔒 Rep {sponsor.repRequired} required</span>
                          )}
                        </div>
                        <div className="text-xs text-[#8a6a55] mt-0.5 truncate">{sponsor.description}</div>
                      </div>

                      {/* Income */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[#7aaa7a]">${sponsor.weeklyIncome.toLocaleString()}</div>
                        <div className="text-xs text-[#8a6a55]">/ week</div>
                      </div>

                      {/* Action */}
                      {isActive ? (
                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e8f0e0] text-[#5b9e5b] shrink-0 w-20 text-center">
                          Active
                        </div>
                      ) : (
                        <button
                          onClick={() => signSponsor(sponsor.id)}
                          disabled={!canSign}
                          title={
                            repLocked  ? `Requires team reputation ${sponsor.repRequired}` :
                            slotsFull  ? 'Sponsor slots full (2/2)' :
                            undefined
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 w-20 ${
                            canSign
                              ? 'bg-[#a8c8e8] text-[#3d2b1f] hover:bg-[#90b8d8] cursor-pointer'
                              : 'bg-[#f2e8d5] text-[#c8b89a] cursor-not-allowed'
                          }`}
                        >
                          {repLocked ? `Rep ${sponsor.repRequired}` : slotsFull ? 'Slots full' : 'Sign'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rep info footer */}
      <div className="mt-4 p-4 bg-[#f2e8d5] rounded-xl border border-[#e8d8bc]">
        <div className="text-xs text-[#8a6a55]">
          Your team reputation: <span className="font-bold text-[#3d2b1f]">{team.reputation}</span>
          {' · '}Reputation grows by placing well in tournaments. Higher reputation unlocks premium sponsor deals.
        </div>
      </div>
    </div>
  )
}

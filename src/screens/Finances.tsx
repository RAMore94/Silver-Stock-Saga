import { useGameStore } from '../store/gameStore'
import type { LedgerEntry } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toLocaleString()
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

const LEDGER_COLORS: Record<LedgerEntry['type'], string> = {
  prize:     '#7aaa7a',
  refund:    '#7aaa7a',
  entry_fee: '#c97070',
  salary:    '#c97070',
}

const LEDGER_LABELS: Record<LedgerEntry['type'], string> = {
  prize:     'Prize',
  refund:    'Refund',
  entry_fee: 'Entry Fee',
  salary:    'Salary',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] px-5 py-4">
      <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">{label}</div>
      <div className="text-2xl font-semibold text-[#3d2b1f]">{value}</div>
      {sub && <div className="text-xs text-[#8a6a55] mt-0.5">{sub}</div>}
    </div>
  )
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const color = LEDGER_COLORS[entry.type]
  const isIncome = entry.amount > 0
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#e8d8bc] last:border-0">
      <div className="shrink-0">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}22` }}
        >
          {LEDGER_LABELS[entry.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0 text-xs text-[#8a6a55] truncate">{entry.description}</div>
      <div className="text-xs text-[#8a6a55] shrink-0">Wk {entry.week}</div>
      <div
        className="text-sm font-semibold shrink-0 w-20 text-right"
        style={{ color: isIncome ? '#7aaa7a' : '#c97070' }}
      >
        {formatAmount(entry.amount)}
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function Finances() {
  const { team, players, tournaments, ledger, pastResults } = useGameStore()

  const weeklyBurn = players.reduce((sum, p) => sum + p.salary, 0)
  const runway = weeklyBurn > 0 ? Math.floor(team.balance / weeklyBurn) : 999

  // Upcoming committed entry fees (registered but not-yet-played tournaments)
  const committedFees = tournaments
    .filter((t) => t.week > team.week)
    .reduce((sum, t) => {
      const registered = t.registeredPlayers.length
      return sum + registered * t.entryFee
    }, 0)

  // Total prize earned per player (from pastResults)
  const prizeByPlayer = players.map((p) => {
    const total = pastResults
      .filter((r) => r.playerId === p.id)
      .reduce((sum, r) => sum + r.prizeEarned, 0)
    return { player: p, total }
  }).sort((a, b) => b.total - a.total)

  const totalPrizes = prizeByPlayer.reduce((sum, p) => sum + p.total, 0)

  // Ledger newest-first
  const sortedLedger = [...ledger].reverse()

  // Running balance for ledger display
  const balanceAtStart = team.balance - ledger.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-1">Finances</div>
        <h1 className="text-2xl font-semibold text-[#3d2b1f]">Team Finances</h1>
        <p className="text-xs text-[#8a6a55] mt-1">Week {team.week} — fiscal overview</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Balance"
          value={`$${team.balance.toLocaleString()}`}
        />
        <StatCard
          label="Weekly Burn"
          value={`$${weeklyBurn.toLocaleString()}`}
          sub="salaries per week"
        />
        <StatCard
          label="Runway"
          value={runway >= 99 ? '99+ wks' : `${runway} wks`}
          sub="at current burn rate"
        />
        <StatCard
          label="Committed Fees"
          value={committedFees > 0 ? `$${committedFees.toLocaleString()}` : '—'}
          sub="upcoming entry fees"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary breakdown */}
        <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8d8bc]">
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium">Roster Salaries</div>
          </div>
          <div className="divide-y divide-[#e8d8bc]">
            {players.map((p) => {
              const pct = weeklyBurn > 0 ? Math.round((p.salary / weeklyBurn) * 100) : 0
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#3d2b1f]">{p.tag}</div>
                    <div className="text-xs text-[#8a6a55]">{p.character}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-[#e8d8bc] rounded-full overflow-hidden">
                      <div className="h-full bg-[#a8c8e8] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-sm font-semibold text-[#3d2b1f] w-20 text-right">
                      ${p.salary.toLocaleString()}/wk
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-3 px-5 py-3 bg-[#f2e8d5]">
              <div className="flex-1 text-xs font-semibold text-[#8a6a55] uppercase tracking-wider">Total</div>
              <div className="text-sm font-semibold text-[#3d2b1f]">
                ${weeklyBurn.toLocaleString()}/wk
              </div>
            </div>
          </div>
        </div>

        {/* Prize earnings */}
        <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8d8bc]">
            <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium">Prize Earnings</div>
          </div>
          {totalPrizes === 0 ? (
            <div className="px-5 py-6 text-xs text-[#8a6a55] text-center">
              No prizes earned yet — register players for tournaments.
            </div>
          ) : (
            <div className="divide-y divide-[#e8d8bc]">
              {prizeByPlayer.map(({ player, total }) => {
                const pct = totalPrizes > 0 ? Math.round((total / totalPrizes) * 100) : 0
                return (
                  <div key={player.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#3d2b1f]">{player.tag}</div>
                      <div className="text-xs text-[#8a6a55]">{player.character}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-[#e8d8bc] rounded-full overflow-hidden">
                        <div className="h-full bg-[#7aaa7a] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-sm font-semibold text-[#7aaa7a] w-20 text-right">
                        ${total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center gap-3 px-5 py-3 bg-[#f2e8d5]">
                <div className="flex-1 text-xs font-semibold text-[#8a6a55] uppercase tracking-wider">Total</div>
                <div className="text-sm font-semibold text-[#7aaa7a]">
                  ${totalPrizes.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8d8bc]">
          <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium">Transaction Ledger</div>
          <div className="text-xs text-[#8a6a55]">
            Starting balance: ${balanceAtStart.toLocaleString()}
          </div>
        </div>

        {sortedLedger.length === 0 ? (
          <div className="px-5 py-8 text-xs text-[#8a6a55] text-center">
            No transactions yet — advance a week or register for a tournament.
          </div>
        ) : (
          <div className="px-5 max-h-96 overflow-y-auto">
            {sortedLedger.map((entry, i) => (
              <LedgerRow key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

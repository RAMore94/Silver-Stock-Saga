interface StatBarProps {
  label: string
  value: number
  max?: number
  color?: 'blue' | 'gold' | 'green' | 'red'
}

const colorMap = {
  blue: 'bg-[#a8c8e8]',
  gold: 'bg-[#c9a84c]',
  green: 'bg-[#7aaa7a]',
  red: 'bg-[#c97070]',
}

export function StatBar({ label, value, max = 100, color = 'blue' }: StatBarProps) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#8a6a55] w-24 shrink-0 font-medium uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-[#e8d8bc] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#6b5040] w-6 text-right tabular-nums">{value}</span>
    </div>
  )
}

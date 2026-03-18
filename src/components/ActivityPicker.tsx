import type { WeekActivity } from '../types'

interface ActivityPickerProps {
  value: WeekActivity
  onChange: (activity: WeekActivity) => void
}

const ACTIVITIES: { value: WeekActivity; label: string; description: string }[] = [
  { value: 'train', label: 'Train', description: 'Improve stats, costs fatigue' },
  { value: 'rest', label: 'Rest', description: 'Recover fatigue, boost form' },
  { value: 'local', label: 'Local Scene', description: 'Low-stakes sets, earn rep' },
  { value: 'prep', label: 'Prep', description: 'Peak focus before a tournament' },
]

export function ActivityPicker({ value, onChange }: ActivityPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ACTIVITIES.map((act) => {
        const active = value === act.value
        return (
          <button
            key={act.value}
            onClick={() => onChange(act.value)}
            title={act.description}
            className={`
              px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
              ${active
                ? 'bg-[#a8c8e8] text-[#3d2b1f] shadow-sm'
                : 'bg-[#f2e8d5] text-[#8a6a55] hover:bg-[#e8d8bc]'
              }
            `}
          >
            {act.label}
          </button>
        )
      })}
    </div>
  )
}

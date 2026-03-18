interface PlaceholderProps {
  title: string
  description: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-[#faf4e8] rounded-2xl border border-[#e8d8bc] p-12 text-center">
        <div className="text-xs text-[#8a6a55] uppercase tracking-wider font-medium mb-2">Coming Soon</div>
        <h1 className="text-2xl font-semibold text-[#3d2b1f] mb-3">{title}</h1>
        <p className="text-sm text-[#8a6a55] max-w-sm mx-auto">{description}</p>
      </div>
    </div>
  )
}

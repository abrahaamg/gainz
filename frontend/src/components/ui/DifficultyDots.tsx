export default function DifficultyDots({ level }: { level: string }) {
  const n = (level === 'beginner' || level === 'easy') ? 1
    : (level === 'intermediate' || level === 'medium') ? 2
    : 3

  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= n
              ? n === 1 ? 'bg-emerald-400' : n === 2 ? 'bg-amber-400' : 'bg-red-400'
              : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}

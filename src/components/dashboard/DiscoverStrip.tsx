import Link from 'next/link'
import type { DiscoverableQuest } from '@/actions/library-discover'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

const MOVE_COLORS: Record<string, string> = {
  wakeUp: 'text-violet-400 border-violet-800/50 bg-violet-950/10',
  cleanUp: 'text-blue-400 border-blue-800/50 bg-blue-950/10',
  growUp: 'text-emerald-400 border-emerald-800/50 bg-emerald-950/10',
  showUp: 'text-amber-400 border-amber-800/50 bg-amber-950/10',
}

type Props = {
  moveType: string
  quests: DiscoverableQuest[]
}

export function DiscoverStrip({ moveType, quests }: Props) {
  if (quests.length === 0) return null

  const moveLabel = MOVE_LABELS[moveType] ?? moveType
  const borderColor = MOVE_COLORS[moveType] ?? 'text-zinc-400 border-zinc-800 bg-zinc-950/10'

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
        From the library · {moveLabel}
      </p>
      <div className="space-y-2">
        {quests.map((q) => (
          <Link
            key={q.id}
            href={`/quest/${q.id}/unpack`}
            className={`block rounded-xl border px-4 py-3 transition-all hover:border-opacity-80 hover:brightness-110 ${borderColor}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 leading-snug line-clamp-2">
                  {q.title}
                </p>
                {q.bookTitle && (
                  <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
                    {q.bookTitle}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-zinc-600 text-sm mt-0.5">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

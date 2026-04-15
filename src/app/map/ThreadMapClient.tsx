'use client'

import Link from 'next/link'
import type { ThreadMapData } from '@/actions/thread-map'

const MOVE_ICONS: Record<string, string> = {
  wakeUp: '👁',
  cleanUp: '🧹',
  growUp: '📈',
  showUp: '⚡',
}

function getMoveIcon(moveType: string | null): string {
  if (!moveType) return '•'
  const key = moveType.replace(/-/g, '').toLowerCase()
  return MOVE_ICONS[key] ?? '•'
}

export function ThreadMapClient({
  data,
  threadId,
}: {
  data: ThreadMapData
  threadId: string
}) {
  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex items-start gap-4 min-w-max pb-4">
          {data.nodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-2 shrink-0">
              <Link
                href={`/?focusQuest=${node.questId}`}
                className={`
                  block w-48 p-4 rounded-xl border-2 transition-colors text-left
                  ${node.isCurrent ? 'border-purple-500 bg-purple-900/30' : ''}
                  ${node.isCompleted ? 'border-green-700/60 bg-green-900/20' : ''}
                  ${!node.isCurrent && !node.isCompleted ? 'border-zinc-700 bg-zinc-900' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getMoveIcon(node.moveType)}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {node.position} / {data.totalQuests}
                  </span>
                </div>
                <div className="font-medium text-white line-clamp-2 text-sm">
                  {node.title}
                </div>
                <div className="flex gap-1 mt-2">
                  {node.isCompleted && (
                    <span className="text-[10px] bg-green-800/50 text-green-400 px-1.5 py-0.5 rounded">
                      Done
                    </span>
                  )}
                  {node.isCurrent && (
                    <span className="text-[10px] bg-purple-800/50 text-purple-400 px-1.5 py-0.5 rounded">
                      You are here
                    </span>
                  )}
                </div>
              </Link>
              {i < data.nodes.length - 1 && (
                <div className="w-6 h-0.5 bg-zinc-700 shrink-0" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-sm text-zinc-500">
        <span>
          {data.isComplete ? data.totalQuests : Math.max(0, data.currentPosition - 1)} of {data.totalQuests} completed
          {data.isComplete && ' • Thread complete'}
        </span>
        <Link
          href="/"
          className="text-purple-400 hover:text-purple-300"
        >
          ← Dashboard
        </Link>
      </div>
    </div>
  )
}

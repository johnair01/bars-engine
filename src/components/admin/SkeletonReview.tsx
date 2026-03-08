'use client'

import type { SerializableQuestPacket, GameMasterFace } from '@/lib/quest-grammar/types'
import { FACE_META } from '@/lib/quest-grammar/types'

const BEAT_LABELS: Record<string, string> = {
  lens_choice: 'Lens choice',
  orientation: 'Orientation',
  rising_engagement: 'Rising Engagement',
  tension: 'Tension',
  integration: 'Integration',
  transcendence: 'Transcendence',
  consequence: 'Consequence',
  urgency: 'Urgency',
  coalition: 'Coalition',
  vision: 'Vision',
  communicate: 'Communicate',
  obstacles: 'Obstacles',
  wins: 'Wins',
  build_on: 'Build On',
  anchor: 'Anchor',
}

interface SkeletonReviewProps {
  packet: SerializableQuestPacket
  feedback: string
  onFeedbackChange: (value: string) => void
  onRegenerate: (feedback: string) => void
  onAccept: () => void
  onReset: () => void
  isRegenerating: boolean
  accepted: boolean
  onGenerateFlavor: () => void
  isGeneratingFlavor: boolean
}

export function SkeletonReview({
  packet,
  feedback,
  onFeedbackChange,
  onRegenerate,
  onAccept,
  onReset,
  isRegenerating,
  accepted,
  onGenerateFlavor,
  isGeneratingFlavor,
}: SkeletonReviewProps) {
  const spineNodes = packet.nodes.filter((n) => !n.depth)
  const depthNodes = packet.nodes.filter((n) => n.depth === 1)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Quest Structure (Skeleton)</h3>
      <p className="text-xs text-zinc-500">
        Review the structure. Add feedback if you want changes. Accept when ready, then generate flavor.
      </p>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
        <span>
          <span className="text-zinc-500">Channel:</span>{' '}
          <span className="text-white">{packet.signature.primaryChannel}</span>
        </span>
        <span>
          <span className="text-zinc-500">Move:</span>{' '}
          <span className="text-white">{packet.signature.moveType ?? '—'}</span>
        </span>
        <span>
          <span className="text-zinc-500">Nodes:</span>{' '}
          <span className="text-white">{packet.nodes.length}</span>
        </span>
      </div>

      <div className="space-y-1">
        {spineNodes.map((node, i) => {
          const beatLabel = node.id === 'lens_choice' ? 'Lens choice' : (BEAT_LABELS[node.beatType] ?? node.beatType)
          const branches = depthNodes.filter((d) =>
            d.id.startsWith(`depth_${i}_`)
          )
          return (
            <div
              key={node.id}
              className="border border-zinc-800 rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-3 px-3 py-2 text-left">
                <span className="text-zinc-500 text-xs font-mono w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white">
                  {beatLabel}
                </span>
                <span className="text-xs text-zinc-500">
                  {node.id}
                  {branches.length > 0 && ` (+${branches.length} depth)`}
                </span>
              </div>
              {branches.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {branches.map((d) => {
                    const face = d.gameMasterFace as GameMasterFace | undefined
                    const meta = face ? FACE_META[face] : null
                    return (
                      <span
                        key={d.id}
                        className={`text-xs px-2 py-1 rounded border ${meta?.color ?? 'text-zinc-400'}`}
                      >
                        {meta?.label ?? face ?? d.id}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!accepted ? (
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="e.g. Add branch at tension. Lens choice should come first."
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[80px] text-sm"
              disabled={isRegenerating}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onRegenerate(feedback)}
              disabled={isRegenerating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isRegenerating ? 'Regenerating…' : 'Regenerate Skeleton'}
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={isRegenerating}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Accept Structure
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isRegenerating}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <p className="text-sm text-green-400 font-medium">
            Structure accepted. Generate flavor to fill in prose.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onGenerateFlavor}
              disabled={isGeneratingFlavor}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isGeneratingFlavor ? 'Generating…' : 'Generate Flavor'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

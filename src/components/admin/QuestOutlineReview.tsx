'use client'

import { useState } from 'react'
import type {
  SerializableQuestPacket,
  QuestNode,
  GameMasterFace,
  PersonalMoveType,
  NodeChoiceOverride,
} from '@/lib/quest-grammar/types'
import { FACE_META, GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

const WAVE_LABELS: Record<PersonalMoveType, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

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

interface QuestOutlineReviewProps {
  packet: SerializableQuestPacket
  onRegenerate: (feedback: string) => void
  onAccept: () => void
  onReset: () => void
  isRegenerating: boolean
  accepted: boolean
  generationCount: number
  /** When provided, enables per-node choice config editing. Updates are applied to packet and passed back. */
  onPacketChange?: (updated: SerializableQuestPacket) => void
  /** Render slot for post-accept actions (publish, export, etc.) */
  children?: React.ReactNode
}

const ALL_WAVE_MOVES: PersonalMoveType[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

function applyNodeOverride(
  packet: SerializableQuestPacket,
  nodeId: string,
  override: Partial<NodeChoiceOverride>
): SerializableQuestPacket {
  const nodes = packet.nodes.map((n) => {
    if (n.id !== nodeId) return n
    const next: QuestNode = { ...n }
    if (override.choiceType !== undefined) next.choiceType = override.choiceType
    if (override.enabledFaces !== undefined) next.enabledFaces = override.enabledFaces
    if (override.enabledHorizontal !== undefined) next.enabledHorizontal = override.enabledHorizontal
    if (override.obstacleActions !== undefined) next.obstacleActions = override.obstacleActions
    return next
  })
  return { ...packet, nodes }
}

export function QuestOutlineReview({
  packet,
  onRegenerate,
  onAccept,
  onReset,
  isRegenerating,
  accepted,
  generationCount,
  onPacketChange,
  children,
}: QuestOutlineReviewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState('')
  const [altitudeMapExpanded, setAltitudeMapExpanded] = useState(false)

  const sig = packet.signature
  const fromState = sig.dissatisfiedLabels[0] ?? 'stuck'
  const toState = sig.satisfiedLabels[0] ?? 'free'

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const expandAll = () => setExpandedNodes(new Set(packet.nodes.map((n) => n.id)))
  const collapseAll = () => setExpandedNodes(new Set())

  const spineNodes = packet.nodes.filter((n) => !n.depth)
  const depthNodes = packet.nodes.filter((n) => n.depth === 1)
  const depthByGap = new Map<number, typeof depthNodes>()
  for (const d of depthNodes) {
    const m = d.id.match(/^depth_(\d+)_/)
    const gap = m ? parseInt(m[1]!, 10) : 0
    if (!depthByGap.has(gap)) depthByGap.set(gap, [])
    depthByGap.get(gap)!.push(d)
  }
  const hasAltitudeMap = depthNodes.length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          Quest Outline
          <span className="ml-2 text-xs font-normal text-zinc-500">
            Generation #{generationCount}
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Expand all
          </button>
          <span className="text-zinc-700">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Signature bar */}
      <div className="flex flex-wrap gap-3 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
        <span>
          <span className="text-zinc-500">Channel:</span>{' '}
          <span className="text-white">{sig.primaryChannel}</span>
        </span>
        <span>
          <span className="text-zinc-500">Move:</span>{' '}
          <span className="text-white">{sig.moveType ?? '—'}</span>
        </span>
        <span>
          <span className="text-zinc-500">Arc:</span>{' '}
          <span className="text-red-400">{fromState}</span>
          <span className="text-zinc-600 mx-1">→</span>
          <span className="text-green-400">{toState}</span>
        </span>
        <span>
          <span className="text-zinc-500">Segment:</span>{' '}
          <span className="text-white">{packet.segmentVariant}</span>
        </span>
        <span>
          <span className="text-zinc-500">Nodes:</span>{' '}
          <span className="text-white">{packet.nodes.length}</span>
        </span>
      </div>

      {/* Altitude Map — collapsible, hidden by default */}
      {hasAltitudeMap && (
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
          <button
            type="button"
            onClick={() => setAltitudeMapExpanded((v) => !v)}
            className="w-full px-3 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-300 text-left flex items-center justify-between"
          >
            <span>Altitude Map — Face paths between spine beats</span>
            <span className="text-zinc-600">{altitudeMapExpanded ? '▼' : '▶'}</span>
          </button>
          {altitudeMapExpanded && (
          <div className="p-3 space-y-3">
            {spineNodes.slice(0, -1).map((spine, gapIndex) => {
              const branches = depthByGap.get(gapIndex) ?? []
              const nextBeat = BEAT_LABELS[spineNodes[gapIndex + 1]?.beatType ?? ''] ?? spineNodes[gapIndex + 1]?.beatType
              return (
                <div key={gapIndex} className="flex items-start gap-4">
                  <div className="shrink-0 w-28 text-xs">
                    <span className="text-zinc-500">{BEAT_LABELS[spine.beatType] ?? spine.beatType}</span>
                    <span className="text-zinc-600 mx-1">→</span>
                    <span className="text-zinc-400">{nextBeat}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {branches.map((d) => {
                      const face = d.gameMasterFace as GameMasterFace | undefined
                      const meta = face ? FACE_META[face] : null
                      const firstLine = d.text.split('\n')[0]?.slice(0, 50) ?? ''
                      return (
                        <div
                          key={d.id}
                          className={`px-2 py-1.5 rounded text-xs border border-current/30 bg-black/20 ${meta?.color ?? 'text-zinc-400'}`}
                        >
                          <span className="font-medium">{meta?.label ?? face ?? d.id}</span>
                          <span className="text-zinc-500 ml-1">· {meta?.role ?? ''}</span>
                          {firstLine && (
                            <p className="mt-1 text-zinc-500 truncate max-w-[200px]" title={d.text}>
                              {firstLine}…
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </div>
      )}

      {/* Node outline */}
      <div className="space-y-1">
        {packet.nodes.map((node, i) => {
          const isExpanded = expandedNodes.has(node.id)
          const movement = sig.movementPerNode[i]
          const beatLabel = node.id === 'lens_choice' ? 'Lens choice' : (BEAT_LABELS[node.beatType] ?? node.beatType)

          return (
            <div key={node.id} className="border border-zinc-800 rounded-lg overflow-hidden">
              {/* Collapsed row */}
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-zinc-500 text-xs font-mono w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white flex-1">
                  {beatLabel}
                </span>
                {node.isActionNode && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-900/50 text-amber-400 rounded">
                    ACTION
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {movement ?? 'translate'}
                </span>
                <span className="text-xs text-zinc-500">
                  {node.wordCountEstimate}w
                </span>
                <span className="text-zinc-600 text-xs">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-3 border-t border-zinc-800/50">
                  <div className="pt-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {node.text}
                  </div>
                  {node.choices.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-zinc-500 font-medium">Choices:</p>
                      {node.choices.map((c, ci) => (
                        <div key={ci} className="text-xs text-zinc-400 flex items-center gap-2">
                          <span className="text-zinc-600">→</span>
                          <span>{c.text}</span>
                          <span className="text-zinc-600">({c.targetId})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Per-node choice config (spine only, has choices, not final) */}
                  {onPacketChange &&
                    !node.depth &&
                    node.id !== 'lens_choice' &&
                    node.choices.length > 0 &&
                    node.beatType !== 'consequence' &&
                    node.beatType !== 'anchor' && (
                      <div className="mt-4 pt-3 border-t border-zinc-800/50 space-y-3">
                        <p className="text-xs font-medium text-zinc-400">Choice type</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`choice-${node.id}`}
                              checked={(node.choiceType ?? 'altitudinal') === 'altitudinal'}
                              onChange={() =>
                                onPacketChange(
                                  applyNodeOverride(packet, node.id, {
                                    choiceType: 'altitudinal',
                                    enabledHorizontal: undefined,
                                  })
                                )
                              }
                              className="text-purple-500"
                            />
                            <span className="text-xs text-zinc-300">Altitudinal (6 faces)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`choice-${node.id}`}
                              checked={node.choiceType === 'horizontal'}
                              onChange={() =>
                                onPacketChange(
                                  applyNodeOverride(packet, node.id, {
                                    choiceType: 'horizontal',
                                    enabledFaces: undefined,
                                  })
                                )
                              }
                              className="text-purple-500"
                            />
                            <span className="text-xs text-zinc-300">Horizontal (4 WAVE moves)</span>
                          </label>
                        </div>
                        {(node.choiceType ?? 'altitudinal') === 'altitudinal' && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Enabled faces</p>
                            <div className="flex flex-wrap gap-2">
                              {GAME_MASTER_FACES.map((face) => {
                                const enabled = node.enabledFaces?.length
                                  ? node.enabledFaces.includes(face)
                                  : true
                                return (
                                  <label
                                    key={face}
                                    className="flex items-center gap-1.5 cursor-pointer text-xs"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      onChange={() => {
                                        const current = node.enabledFaces ?? GAME_MASTER_FACES
                                        const next = enabled
                                          ? current.filter((f) => f !== face)
                                          : [...current, face]
                                        onPacketChange(
                                          applyNodeOverride(packet, node.id, {
                                            enabledFaces: next.length ? next : undefined,
                                          })
                                        )
                                      }}
                                      className="rounded border-zinc-600 text-purple-500"
                                    />
                                    <span className={FACE_META[face]?.color ?? 'text-zinc-400'}>
                                      {FACE_META[face]?.label ?? face}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {node.choiceType === 'horizontal' && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Enabled WAVE moves</p>
                            <div className="flex flex-wrap gap-2">
                              {ALL_WAVE_MOVES.map((wave) => {
                                const enabled = node.enabledHorizontal?.length
                                  ? node.enabledHorizontal.includes(wave)
                                  : true
                                return (
                                  <label
                                    key={wave}
                                    className="flex items-center gap-1.5 cursor-pointer text-xs"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      onChange={() => {
                                        const current = node.enabledHorizontal ?? ALL_WAVE_MOVES
                                        const next = enabled
                                          ? current.filter((w) => w !== wave)
                                          : [...current, wave]
                                        onPacketChange(
                                          applyNodeOverride(packet, node.id, {
                                            enabledHorizontal: next.length ? next : undefined,
                                          })
                                        )
                                      }}
                                      className="rounded border-zinc-600 text-purple-500"
                                    />
                                    <span className="text-zinc-400">{WAVE_LABELS[wave]}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {node.branchDepth !== undefined && node.branchDepth >= 2 && (
                          <p className="text-xs text-amber-400">
                            At depth {node.branchDepth}. Adding more branches may exceed the 3-layer limit.
                          </p>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Shadow voices */}
      {sig.shadowVoices.length > 0 && (
        <div className="text-xs text-zinc-500">
          <span className="text-zinc-600">Shadow voices:</span>{' '}
          {sig.shadowVoices.join(' · ')}
        </div>
      )}

      {/* Feedback + actions */}
      {!accepted ? (
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Tone is too corporate in the tension beat. Make the shadow voices sharper. The integration feels rushed."
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
              {isRegenerating ? 'Regenerating…' : feedback.trim() ? 'Regenerate with Feedback' : 'Regenerate'}
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={isRegenerating}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Accept Outline
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
            Outline accepted (Generation #{generationCount})
          </p>
          {children}
        </div>
      )}
    </div>
  )
}

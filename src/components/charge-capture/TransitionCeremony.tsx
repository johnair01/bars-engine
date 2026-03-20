'use client'

import { useCallback, useEffect } from 'react'

/** IE-18 / spec: future AppConfig candidate */
export const TRANSITION_CEREMONY_MS = 2500

const SCENE_LABELS: Record<string, string> = {
  transcend: 'Transcend',
  generate: 'Generate',
  control: 'Control',
}

type Props = {
  sceneType: string
  kotterStage: number
  onComplete: () => void
}

/**
 * Full-screen pause after charge explore: scene type + Kotter context (no AI).
 * Spec: .specify/specs/individuation-engine/spec.md
 */
export function TransitionCeremony({ sceneType, kotterStage, onComplete }: Props) {
  const finish = useCallback(() => {
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const t = window.setTimeout(finish, TRANSITION_CEREMONY_MS)
    return () => window.clearTimeout(t)
  }, [finish])

  const label = SCENE_LABELS[sceneType] ?? sceneType

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Transition ceremony"
      onClick={finish}
    >
      <div
        className="max-w-md text-center space-y-6 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Where this charge is moving</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{label}</h2>
        <p className="text-sm text-zinc-400">Campaign context · Kotter stage {kotterStage}</p>
        <p className="text-xs text-zinc-600">
          Tap anywhere to continue · auto-advances in {Math.round(TRANSITION_CEREMONY_MS / 1000)}s
        </p>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

/**
 * Scene Atlas — align shell with /bars, /hand, wiki: dark canvas, readable zinc text.
 * @see .specify/specs/creator-scene-grid-deck/DEFT_IMPROVEMENT_PLAN.md
 */
export default function CreatorSceneDeckLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-200">
      {children}
    </div>
  )
}

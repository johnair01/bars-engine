/**
 * /superpower — the Superpower discovery intake (Mobility Quest campaign).
 * Server component shell; the quiz + reveal run client-side and are fully
 * deterministic (no database, no AI). `?ref=<campaignRef>` is forwarded to the
 * scoring action for future per-campaign persistence (Phase 4).
 *
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *       .specify/specs/superpower-quiz-design/spec.md
 */
import type { Metadata } from 'next'
import { SuperpowerQuiz } from '@/components/superpowers/SuperpowerQuiz'

export const metadata: Metadata = {
  title: 'Discover Your Allyship Superpower',
  description:
    'A short, honest quiz to discover which of seven allyship superpowers you bring — a lens, not a verdict.',
}

export default async function SuperpowerPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mx-auto mb-8 max-w-xl space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Discover Your Allyship Superpower</h1>
        <p className="text-sm opacity-80">
          Twelve quick choices reveal how you ally — with yourself and with the world. There are
          seven superpowers; you carry more than one. This is a lens for your next move, not a box.
          No sign-up, no email — your result shows the moment you finish.
        </p>
      </header>

      <SuperpowerQuiz campaignRef={ref} />
    </main>
  )
}

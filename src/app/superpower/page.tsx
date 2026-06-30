/**
 * /superpower — the Superpower discovery intake (Mobility Quest campaign),
 * redesigned per design_handoff_superpower_route to match the dark "OS that
 * contains cards" language. Server shell + header; the quiz + reveal run
 * client-side and are fully deterministic (no database, no AI). `?ref=` is
 * forwarded to the scoring action for future per-campaign persistence (Phase 4).
 *
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *       .specify/specs/superpower-quiz-design/spec.md
 */
import type { Metadata } from 'next'
import { SuperpowerQuiz } from '@/components/superpowers/SuperpowerQuiz'
import { QUIZ_GOLD } from '@/lib/superpowers/reveal-presentation'

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
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(125% 85% at 50% -10%, #15110c 0%, var(--bars-bg-base) 60%)',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'var(--bars-font-display)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460, minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 20px 56px', boxSizing: 'border-box' }}>
        <header style={{ padding: '30px 0 8px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.28em', color: QUIZ_GOLD }}>
            Superpower · Discovery Intake
          </span>
          <h1 style={{ margin: 0, fontFamily: 'var(--bars-font-display)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.04, fontSize: 30, color: 'var(--bars-text-primary)', textWrap: 'balance' as never }}>
            Discover Your Allyship Superpower
          </h1>
          <p style={{ margin: 0, fontFamily: 'var(--bars-font-body)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', maxWidth: 380, textWrap: 'pretty' as never }}>
            Twelve quick choices reveal how you ally — with yourself and with the world. There are seven superpowers; you carry more than one. A lens for your next move, not a box.
          </p>
        </header>

        <SuperpowerQuiz campaignRef={ref} />
      </div>
    </div>
  )
}

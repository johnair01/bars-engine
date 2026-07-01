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
    <main
      className="flex min-h-screen justify-center"
      style={{
        background:
          'radial-gradient(125% 85% at 50% -10%, #15110c 0%, var(--bars-bg-base) 60%)',
        fontFamily: 'var(--bars-font-display)',
      }}
    >
      <div className="flex w-full max-w-[460px] flex-col px-5 pb-14">
        <header className="flex flex-col gap-[11px] pb-2 pt-[30px]">
          <span
            className="text-[10px] uppercase"
            style={{
              fontFamily: 'var(--bars-font-mono)',
              letterSpacing: '.28em',
              color: 'var(--bars-gold)',
            }}
          >
            Superpower · Discovery Intake
          </span>
          <h1
            className="text-[30px] font-bold"
            style={{
              fontFamily: 'var(--bars-font-display)',
              letterSpacing: '-.02em',
              lineHeight: 1.04,
              color: 'var(--bars-text-primary)',
              textWrap: 'balance',
            }}
          >
            Discover Your Allyship Superpower
          </h1>
          <p
            className="max-w-[380px] text-[13.5px]"
            style={{
              fontFamily: 'var(--bars-font-body)',
              lineHeight: 1.55,
              color: 'var(--bars-text-secondary)',
            }}
          >
            Twelve quick choices reveal how you ally — with yourself and with the world. There are
            seven superpowers; you carry more than one. A lens for your next move, not a box. No
            sign-up, no email — your result shows the moment you finish.
          </p>
        </header>

        <SuperpowerQuiz campaignRef={ref} />
      </div>
    </main>
  )
}

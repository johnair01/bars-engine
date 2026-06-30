import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import {
  domainLabel,
  getTheCrossingSupportRole,
  parseContribution,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'
const ACTION_PURPLE = '#7c3aed'
const ACTION_PURPLE_LITE = '#8b5cf6'

export const metadata: Metadata = { title: 'Move saved | The Crossing' }

export default async function TheCrossingSavedPage(props: {
  params: Promise<{ roleId: string }>
  searchParams: Promise<{ bar?: string }>
}) {
  const { roleId } = await props.params
  const { bar: barId } = await props.searchParams
  const role = getTheCrossingSupportRole(roleId)
  if (!role) notFound()

  // Prefer the persisted contribution; fall back to the role defaults.
  let summary = role.tinyMove
  if (barId) {
    const barRow = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, contextLines: true, createdAt: true },
    })
    if (barRow) {
      const contribution = parseContribution(barRow)
      summary = contribution.summary || summary
    }
  }

  const tokens = ELEMENT_TOKENS[role.element]
  const deckCode = role.starterCardIds[0] ?? role.label

  return (
    <main
      className="min-h-screen px-5 py-10 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[560px] space-y-8 text-center">
        {/* Green check disc */}
        <div className="flex justify-center">
          <span
            className="grid h-16 w-16 place-items-center rounded-full text-3xl text-[#04130c]"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}
            aria-hidden
          >
            ✓
          </span>
        </div>

        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
          Your move is saved.
        </h1>

        {/* Mini BAR card */}
        <div
          className="rounded-2xl border p-5 text-left"
          style={{
            borderColor: tokens.frame,
            background: `radial-gradient(135% 130% at 90% -14%, ${tokens.gradFrom}, ${tokens.gradTo} 72%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: tokens.gem }}>
              {deckCode}
            </span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{ background: 'rgba(212,160,23,.16)', color: '#e0a93b' }}
            >
              New move
            </span>
          </div>
          <p className="mt-3 text-[15px] font-semibold leading-snug text-[#f4f2ec]">{summary}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09e98]">
            {role.label} · {domainLabel(role.primaryDomain)}
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href={`/login?returnTo=${encodeURIComponent('/campaign/the-crossing')}`}
            className="block rounded-[11px] px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
          >
            Create your BARS Engine account to track this →
          </Link>
          <Link
            href="/campaign/the-crossing/steward"
            className="block rounded-[11px] border px-4 py-3 text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
            style={{ borderColor: 'rgba(124,58,237,.42)' }}
          >
            See where it lands · Steward view →
          </Link>
          <Link
            href="/campaign/the-crossing#paths"
            className="block py-1 text-xs font-semibold text-[#a09e98] transition-colors hover:text-[#f4f2ec]"
          >
            ← Back to The Crossing · pick another path
          </Link>
        </div>
      </div>
    </main>
  )
}

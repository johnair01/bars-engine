import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  domainLabel,
  getTheCrossingSupportRole,
  theCrossingVenmoUrl,
  THE_CROSSING_SUPPORT_ROLES,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { DeckCardForRole } from '@/components/the-crossing/DeckCardForRole'
import { DeckPurchaseCTA } from '@/components/launch/DeckPurchaseCTA'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'
const ACTION_PURPLE = '#7c3aed'
const ACTION_PURPLE_LITE = '#8b5cf6'

/** Pre-render all six role pages. */
export function generateStaticParams() {
  return THE_CROSSING_SUPPORT_ROLES.map((role) => ({ roleId: role.id }))
}

export async function generateMetadata(props: {
  params: Promise<{ roleId: string }>
}): Promise<Metadata> {
  const { roleId } = await props.params
  const role = getTheCrossingSupportRole(roleId)
  if (!role) return { title: 'Role not found | The Crossing' }
  return {
    title: `${role.label} · The Crossing | BARs`,
    description: `${role.tinyMove} ${role.impact}`,
  }
}

export default async function TheCrossingRolePage(props: {
  params: Promise<{ roleId: string }>
}) {
  const { roleId } = await props.params
  const role = getTheCrossingSupportRole(roleId)
  if (!role) notFound()

  const tokens = ELEMENT_TOKENS[role.element]
  const moveHref = `/campaign/the-crossing/move/${role.id}`

  return (
    <main
      className="min-h-screen px-5 py-6 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[680px] space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-[#a09e98]">
          <Link href="/campaign/the-crossing#paths" className="transition-colors hover:text-[#f4f2ec]">
            ← The Crossing
          </Link>
          <span style={{ color: tokens.gem }}>{domainLabel(role.primaryDomain)}</span>
        </div>

        {/* Header card — element-tinted, faded sigil */}
        <header
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{
            borderColor: tokens.frame,
            background: `radial-gradient(135% 130% at 90% -14%, ${tokens.gradFrom}, ${tokens.gradTo} 72%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-6 right-2 text-[140px] leading-none opacity-10"
            style={{ color: tokens.gem }}
          >
            {tokens.sigil}
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: tokens.gem }}>
            {domainLabel(role.primaryDomain)} · Path
          </p>
          <h1 className="mt-2 text-[42px] font-bold leading-[1.04] tracking-[-0.02em]">
            {role.label}
          </h1>
          <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-[#d6d4cd]">
            {role.description}
          </p>
        </header>

        {/* Do this now */}
        <section className="rounded-2xl border border-white/[0.07] p-5" style={{ background: '#121210' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">Do this now</p>
          <p className="mt-2 text-[19px] font-semibold leading-snug">{role.tinyMove}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {role.isDonor ? (
              <a
                href={theCrossingVenmoUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-[11px] px-4 py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${tokens.glow}, ${tokens.frame})` }}
              >
                Send Venmo →
              </a>
            ) : (
              <Link
                href={moveHref}
                className="flex-1 rounded-[11px] px-4 py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${tokens.glow}, ${tokens.frame})` }}
              >
                {role.ctaLabel} →
              </Link>
            )}
            <Link
              href={moveHref}
              className="flex-1 rounded-[11px] border border-white/15 px-4 py-3 text-center text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
            >
              Save this move →
            </Link>
          </div>
        </section>

        {/* Why it matters */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-[-0.01em]">Why it matters</h2>
          <p className="text-[15px] leading-relaxed text-[#d6d4cd]">{role.impact}</p>
          <p
            className="border-l-2 pl-4 text-[13px] italic leading-relaxed text-[#a09e98]"
            style={{ borderColor: tokens.frame }}
          >
            {role.boundary}
          </p>
        </section>

        {/* Moves you can make */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-[-0.01em]">Moves you can make</h2>
          <ul className="space-y-2">
            {role.examples.map((example) => (
              <li key={example} className="flex gap-3 text-[14px] leading-snug text-[#d6d4cd]">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ background: tokens.gem }} />
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Moves from the Allyship Deck */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-[-0.01em]">Moves from the Allyship Deck</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {role.starterCardIds.map((code) => (
              <DeckCardForRole key={code} code={code} element={role.element} role={role} />
            ))}
          </div>
        </section>

        {/* Buy the full deck — these two moves are a taste of all 120 */}
        <DeckPurchaseCTA
          element={role.element}
          blurb="These two moves are from the 120-move Allyship Deck — the consultable heart of the whole game. Get the deck and you have a move for every moment."
        />

        {/* Account upsell (purple — action/account channel) */}
        <section
          className="rounded-2xl border p-5"
          style={{ borderColor: 'rgba(124,58,237,.42)', background: 'rgba(124,58,237,.08)' }}
        >
          <p className="text-sm font-semibold text-white">Save this contribution</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#cfcdc6]">
            This is the whole game in miniature: care becomes a move, a move becomes evidence you can
            follow. Create your BARS Engine account to track what happens to your move — or just make
            it now, no account needed.
          </p>
          <Link
            href={`/login?returnTo=${encodeURIComponent(moveHref)}`}
            className="mt-3 inline-flex rounded-[11px] px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
          >
            Create your BARS Engine account →
          </Link>
        </section>

        {/* Superpower fallback */}
        <section className="rounded-2xl border border-white/[0.07] p-5" style={{ background: '#121210' }}>
          <p className="text-sm text-[#cfcdc6]">Not sure this is your role?</p>
          <Link href="/superpower" className="mt-1 inline-flex text-sm font-semibold" style={{ color: ACTION_PURPLE_LITE }}>
            Take the Superpower Quiz →
          </Link>
        </section>

        <Link
          href="/campaign/the-crossing#paths"
          className="inline-flex text-xs font-semibold text-[#a09e98] transition-colors hover:text-[#f4f2ec]"
        >
          ← Back to The Crossing · pick another path
        </Link>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  domainLabel,
  theCrossingVenmoUrl,
  THE_CROSSING_PARENT_CAMPAIGN_REF,
  THE_CROSSING_SUPPORT_ROLES,
  type AllyshipDomain,
  type TheCrossingSupportRole,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { DeckCardForRole } from '@/components/the-crossing/DeckCardForRole'
import { DeckPurchaseCTA } from '@/components/launch/DeckPurchaseCTA'
import { getMoveCardById } from '@/lib/allyship-deck/assemble'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'
const ACTION_PURPLE = '#7c3aed'
const ACTION_PURPLE_LITE = '#8b5cf6'
const EASE = 'cubic-bezier(0.16,1,0.3,1)'

/** Domain gate order + plain-language blurb (organizing layer for the roles). */
const GATES: { domain: AllyshipDomain; blurb: string }[] = [
  { domain: 'GATHERING_RESOURCES', blurb: 'Bring what the campaign needs into reach — cars, money, people.' },
  { domain: 'SKILLFUL_ORGANIZING', blurb: 'Use what you know to make a good decision happen faster.' },
  { domain: 'RAISE_AWARENESS', blurb: 'Extend the ask past Wendell’s immediate reach.' },
  { domain: 'DIRECT_ACTION', blurb: 'Keep the person — and the momentum — in motion.' },
]

const HOW_TO_PLAY = [
  'Pick the path that fits your real capacity.',
  'Each path gives you one small, concrete move.',
  'Your move becomes a BAR the campaign can follow up on.',
]

function moveHref(role: TheCrossingSupportRole) {
  return `/campaign/the-crossing/move/${role.id}`
}
function roleHref(role: TheCrossingSupportRole) {
  return `/campaign/the-crossing/role/${role.id}`
}

export function TheCrossingLanding() {
  const [openRoleId, setOpenRoleId] = useState<string | null>(null)

  return (
    <main
      className="min-h-screen px-5 py-6 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[680px]">
        {/* Chrome bar */}
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#a09e98]">
          <span style={{ color: ACTION_PURPLE_LITE }}>The Crossing</span>
          <Link href="/awaken" className="transition-colors hover:text-[#f4f2ec]">
            Book-launch weekend →
          </Link>
        </div>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <header className="mt-10 space-y-4">
          <Link
            href={`/campaign/${THE_CROSSING_PARENT_CAMPAIGN_REF}`}
            className="inline-flex font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: ACTION_PURPLE_LITE }}
          >
            ◇ Part of the Allyship Launch · Barn Raising
          </Link>
          <h1 className="text-[44px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[54px]">
            The Crossing
          </h1>
          <p className="text-[20px] leading-snug text-[#e8e6e0]">
            Wendell needs a reliable car to keep showing up.
          </p>
          <p className="max-w-[34rem] text-[15px] leading-relaxed text-[#cfcdc6]">
            Every kind of help moves this forward. Choose the path that fits what you can actually
            offer.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#paths"
              className="rounded-[11px] px-[22px] py-[13px] text-sm font-semibold text-white transition-transform active:scale-[0.97]"
              style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
            >
              Choose Your Move →
            </a>
            <Link
              href={`/campaign/${THE_CROSSING_PARENT_CAMPAIGN_REF}`}
              className="rounded-[11px] border px-[22px] py-[13px] text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
              style={{ borderColor: 'rgba(124,58,237,.42)' }}
            >
              Read the full story
            </Link>
          </div>
        </header>

        {/* ── How To Play ────────────────────────────────────────────────── */}
        <section className="mt-12 grid gap-3 sm:grid-cols-3">
          {HOW_TO_PLAY.map((step, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.07] p-4"
              style={{ background: '#121210' }}
            >
              <span
                className="font-mono text-xs"
                style={{ color: ACTION_PURPLE_LITE }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 text-[13px] leading-snug text-[#d6d4cd]">{step}</p>
            </div>
          ))}
        </section>

        {/* ── Choose a path ──────────────────────────────────────────────── */}
        <section id="paths" className="mt-14 space-y-10 scroll-mt-6">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">Choose a path</h2>

          {GATES.map(({ domain, blurb }) => {
            const roles = THE_CROSSING_SUPPORT_ROLES.filter((r) => r.primaryDomain === domain)
            if (roles.length === 0) return null
            const element = roles[0]!.element
            const tokens = ELEMENT_TOKENS[element]
            return (
              <div key={domain} className="space-y-3">
                {/* Gate header */}
                <div className="flex items-baseline gap-3">
                  <span aria-hidden className="text-[23px] leading-none" style={{ color: tokens.gem }}>
                    {tokens.sigil}
                  </span>
                  <div>
                    <p
                      className="font-mono text-[12px] uppercase tracking-[0.18em]"
                      style={{ color: tokens.gem }}
                    >
                      {domainLabel(domain)}
                    </p>
                    <p className="text-[12.5px] text-[#a09e98]">{blurb}</p>
                  </div>
                </div>

                {/* Role cards */}
                <div className="space-y-[10px]">
                  {roles.map((role) => (
                    <RoleAccordion
                      key={role.id}
                      role={role}
                      open={openRoleId === role.id}
                      onToggle={() =>
                        setOpenRoleId((cur) => (cur === role.id ? null : role.id))
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        {/* ── Superpower fallback ────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl border border-white/[0.07] p-5" style={{ background: '#121210' }}>
          <p className="text-sm text-[#cfcdc6]">Not sure this is your role?</p>
          <Link
            href="/superpower"
            className="mt-1 inline-flex text-sm font-semibold"
            style={{ color: ACTION_PURPLE_LITE }}
          >
            Take the Superpower Quiz →
          </Link>
        </section>

        {/* ── Buy the full deck ──────────────────────────────────────────── */}
        <div className="mt-14">
          <DeckPurchaseCTA blurb="Every path here is one move from the 120-move Allyship Deck. Get the whole deck and you carry a move for every moment — not just this campaign." />
        </div>

        {/* ── /awaken cross-link (water) ─────────────────────────────────── */}
        <Link
          href="/awaken"
          className="mt-4 flex items-center justify-between rounded-2xl border p-5 transition-colors"
          style={{ borderColor: `${ELEMENT_TOKENS.water.frame}`, background: '#0c1622' }}
        >
          <span className="flex items-center gap-3">
            <span aria-hidden className="text-[20px]" style={{ color: ELEMENT_TOKENS.water.gem }}>
              {ELEMENT_TOKENS.water.sigil}
            </span>
            <span className="text-sm text-[#d6d4cd]">
              Here for the book launch? The July 17–19 gatherings live on{' '}
              <span className="font-semibold text-white">/awaken</span>.
            </span>
          </span>
          <span className="text-sm" style={{ color: ELEMENT_TOKENS.water.gem }}>
            →
          </span>
        </Link>

        <p className="mt-10 text-[12.5px] leading-relaxed text-[#6b6965]">
          An early BARS Engine experience in the wild: care becomes a role, a role becomes a move,
          and a move becomes evidence the campaign can follow up on.
        </p>
      </div>
    </main>
  )
}

function RoleAccordion({
  role,
  open,
  onToggle,
}: {
  role: TheCrossingSupportRole
  open: boolean
  onToggle: () => void
}) {
  const tokens = ELEMENT_TOKENS[role.element]
  const starter = role.starterCardIds[0]

  return (
    <div
      className="overflow-hidden rounded-[15px] border"
      style={{
        borderColor: tokens.frame,
        background: `radial-gradient(135% 130% at 90% -14%, ${tokens.gradFrom}, ${tokens.gradTo} 72%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
      }}
    >
      {/* Card button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-transform active:scale-[0.99]"
      >
        <span
          aria-hidden
          className="grid h-[44px] w-[44px] flex-none place-items-center rounded-xl text-xl"
          style={{ background: `${tokens.gem}1f`, color: tokens.gem, border: `1px solid ${tokens.gem}3d` }}
        >
          {tokens.sigil}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-bold leading-tight text-[#f4f2ec]">
            {role.label}
          </span>
          <span className="block truncate text-[13px] text-[#a09e98]">{role.tinyMove}</span>
        </span>
        <span
          className="flex flex-none items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em]"
          style={{ color: tokens.gem }}
        >
          {role.exploreVerb === 'Give' ? 'Give' : 'Explore'}
          <span className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>›</span>
        </span>
      </button>

      {/* Accordion panel — CSS grid-rows animation, reduced-motion safe */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        style={{ transitionTimingFunction: EASE }}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-white/[0.07] p-4">
            <p className="text-sm leading-relaxed text-[#d6d4cd]">{role.description}</p>

            {/* Tiny move / Creates / Why grid */}
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b6965]">
                  Tiny move
                </dt>
                <dd className="mt-1 text-[13px] text-[#d6d4cd]">{role.tinyMove}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b6965]">
                  Creates
                </dt>
                <dd className="mt-1 text-[13px] text-[#d6d4cd]">{role.artifact}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b6965]">
                  Why it matters
                </dt>
                <dd className="mt-1 text-[13px] text-[#d6d4cd]">{role.impact}</dd>
              </div>
            </dl>

            {/* Deck-move chips — real card titles, sourced from the canonical deck */}
            <div className="flex flex-wrap gap-2">
              {role.starterCardIds.map((code) => {
                const card = getMoveCardById(code)
                return (
                  <span
                    key={code}
                    className="rounded-md px-2 py-1 text-[11px] font-medium"
                    style={{ background: `${tokens.gem}14`, color: tokens.gem }}
                  >
                    {card?.title ?? code}
                  </span>
                )
              })}
            </div>

            {/* Embedded starter deck card */}
            {starter ? <DeckCardForRole code={starter} element={role.element} role={role} /> : null}

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
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
                  href={moveHref(role)}
                  className="flex-1 rounded-[11px] px-4 py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                  style={{ background: `linear-gradient(135deg, ${tokens.glow}, ${tokens.frame})` }}
                >
                  {role.ctaLabel} →
                </Link>
              )}
              <Link
                href={role.isDonor ? moveHref(role) : roleHref(role)}
                className="flex-1 rounded-[11px] border border-white/15 px-4 py-3 text-center text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
              >
                {role.isDonor ? 'Offer another resource →' : 'Read the role →'}
              </Link>
            </div>
            <Link
              href={moveHref(role)}
              className="inline-flex text-xs font-semibold"
              style={{ color: ACTION_PURPLE_LITE }}
            >
              Save this move →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

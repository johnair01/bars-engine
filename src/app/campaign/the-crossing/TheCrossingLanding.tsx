'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  domainLabel,
  theCrossingVenmoUrl,
  THE_CROSSING_PARENT_CAMPAIGN_REF,
  THE_CROSSING_SUPPORT_ROLES,
  type TheCrossingSupportRole,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { DeckCardForRole } from '@/components/the-crossing/DeckCardForRole'
import { DeckPurchaseCTA } from '@/components/launch/DeckPurchaseCTA'
import { getMoveCardById } from '@/lib/allyship-deck/assemble'
import type { TheCrossingPageContent } from '@/lib/the-crossing-page-content'
import { saveTheCrossingPageContent } from '@/actions/the-crossing-page-admin'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'
const ACTION_PURPLE = '#7c3aed'
const ACTION_PURPLE_LITE = '#8b5cf6'
const EASE = 'cubic-bezier(0.16,1,0.3,1)'

function moveHref(role: TheCrossingSupportRole) {
  return `/campaign/the-crossing/move/${role.id}`
}
function roleHref(role: TheCrossingSupportRole) {
  return `/campaign/the-crossing/role/${role.id}`
}

export function TheCrossingLanding({
  content,
  isAdmin = false,
}: {
  content: TheCrossingPageContent
  isAdmin?: boolean
}) {
  const [openRoleId, setOpenRoleId] = useState<string | null>(null)

  return (
    <main
      className="min-h-screen px-5 py-6 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[680px]">
        {/* Chrome bar */}
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#a09e98]">
          <span style={{ color: ACTION_PURPLE_LITE }}>{content.chrome.label}</span>
          <Link href={content.awaken.href} className="transition-colors hover:text-[#f4f2ec]">
            {content.chrome.awakenLink}
          </Link>
        </div>

        {isAdmin && <TheCrossingAdminEditor content={content} />}

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <header className="mt-10 space-y-4">
          <Link
            href={`/campaign/${THE_CROSSING_PARENT_CAMPAIGN_REF}`}
            className="inline-flex font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: ACTION_PURPLE_LITE }}
          >
            {content.hero.parentLabel}
          </Link>
          <h1 className="text-[44px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[54px]">
            {content.hero.title}
          </h1>
          <p className="text-[20px] leading-snug text-[#e8e6e0]">
            {content.hero.subtitle}
          </p>
          <p className="max-w-[34rem] text-[15px] leading-relaxed text-[#cfcdc6]">
            {content.hero.body}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#paths"
              className="rounded-[11px] px-[22px] py-[13px] text-sm font-semibold text-white transition-transform active:scale-[0.97]"
              style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
            >
              {content.hero.primaryCta}
            </a>
            <Link
              href={`/campaign/${THE_CROSSING_PARENT_CAMPAIGN_REF}`}
              className="rounded-[11px] border px-[22px] py-[13px] text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
              style={{ borderColor: 'rgba(124,58,237,.42)' }}
            >
              {content.hero.secondaryCta}
            </Link>
          </div>
        </header>

        {/* ── How To Play ────────────────────────────────────────────────── */}
        <section className="mt-12 grid gap-3 sm:grid-cols-3">
          {content.howToPlay.map((step, i) => (
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
          <h2 className="text-2xl font-bold tracking-[-0.02em]">{content.paths.title}</h2>

          {content.paths.gates.map(({ domain, blurb }) => {
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
          <p className="text-sm text-[#cfcdc6]">{content.unsure.body}</p>
          <Link
            href={content.unsure.href}
            className="mt-1 inline-flex text-sm font-semibold"
            style={{ color: ACTION_PURPLE_LITE }}
          >
            {content.unsure.cta}
          </Link>
        </section>

        {/* ── Buy the full deck ──────────────────────────────────────────── */}
        <div className="mt-14">
          <DeckPurchaseCTA blurb={content.deck.blurb} />
        </div>

        {/* ── /awaken cross-link (water) ─────────────────────────────────── */}
        <Link
          href={content.awaken.href}
          className="mt-4 flex items-center justify-between rounded-2xl border p-5 transition-colors"
          style={{ borderColor: `${ELEMENT_TOKENS.water.frame}`, background: '#0c1622' }}
        >
          <span className="flex items-center gap-3">
            <span aria-hidden className="text-[20px]" style={{ color: ELEMENT_TOKENS.water.gem }}>
              {ELEMENT_TOKENS.water.sigil}
            </span>
            <span className="text-sm text-[#d6d4cd]">
              {content.awaken.body}
            </span>
          </span>
          <span className="text-sm" style={{ color: ELEMENT_TOKENS.water.gem }}>
            {content.awaken.cta}
          </span>
        </Link>

        <p className="mt-10 text-[12.5px] leading-relaxed text-[#6b6965]">
          {content.footer}
        </p>
      </div>
    </main>
  )
}

function TheCrossingAdminEditor({ content }: { content: TheCrossingPageContent }) {
  const [state, formAction, pending] = useActionState(saveTheCrossingPageContent, null)

  return (
    <details className="mt-6 rounded-2xl border border-white/[0.08] bg-[#121210] p-4">
      <summary className="cursor-pointer text-sm font-bold" style={{ color: ACTION_PURPLE_LITE }}>
        Edit The Crossing page copy
      </summary>
      <form action={formAction} className="mt-4 space-y-4">
        <Field name="chrome.label" label="Top label" defaultValue={content.chrome.label} />
        <Field name="chrome.awakenLink" label="Awaken link label" defaultValue={content.chrome.awakenLink} />
        <Field name="hero.parentLabel" label="Parent label" defaultValue={content.hero.parentLabel} />
        <Field name="hero.title" label="Hero title" defaultValue={content.hero.title} />
        <Field name="hero.subtitle" label="Hero subtitle" defaultValue={content.hero.subtitle} />
        <Textarea name="hero.body" label="Hero body" defaultValue={content.hero.body} />
        <Field name="hero.primaryCta" label="Primary button" defaultValue={content.hero.primaryCta} />
        <Field name="hero.secondaryCta" label="Secondary button" defaultValue={content.hero.secondaryCta} />
        <Textarea name="howToPlay" label="How to play steps" defaultValue={content.howToPlay.join('\n')} />
        <Field name="paths.title" label="Paths title" defaultValue={content.paths.title} />
        {content.paths.gates.map((gate) => (
          <Textarea
            key={gate.domain}
            name={`paths.gates.${gate.domain}.blurb`}
            label={`${domainLabel(gate.domain)} blurb`}
            defaultValue={gate.blurb}
          />
        ))}
        <Field name="unsure.body" label="Unsure prompt" defaultValue={content.unsure.body} />
        <Field name="unsure.cta" label="Unsure CTA" defaultValue={content.unsure.cta} />
        <Field name="unsure.href" label="Unsure link" defaultValue={content.unsure.href} />
        <Textarea name="deck.blurb" label="Deck CTA blurb" defaultValue={content.deck.blurb} />
        <Textarea name="awaken.body" label="Awaken cross-link body" defaultValue={content.awaken.body} />
        <Field name="awaken.href" label="Awaken link" defaultValue={content.awaken.href} />
        <Field name="awaken.cta" label="Awaken CTA symbol" defaultValue={content.awaken.cta} />
        <Textarea name="footer" label="Footer note" defaultValue={content.footer} />

        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-300">Saved.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-[11px] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
        >
          {pending ? 'Saving…' : 'Save The Crossing page'}
        </button>
      </form>
    </details>
  )
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-xs font-semibold text-[#a09e98]">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-[10px] border border-white/[0.09] bg-black/40 px-3 py-2 text-sm text-[#f4f2ec] outline-none focus:border-[#8b5cf6]"
      />
    </label>
  )
}

function Textarea({
  name,
  label,
  defaultValue,
}: {
  name: string
  label: string
  defaultValue: string
}) {
  return (
    <label className="block text-xs font-semibold text-[#a09e98]">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="mt-1 w-full rounded-[10px] border border-white/[0.09] bg-black/40 px-3 py-2 text-sm text-[#f4f2ec] outline-none focus:border-[#8b5cf6]"
      />
    </label>
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

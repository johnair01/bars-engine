'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  AWAKEN_CROSSING_HREF,
  type AwakenMoveContent,
  type AwakenPageContent,
} from '@/lib/awaken/content'
import { saveAwakenPageContent } from '@/actions/awaken-page-admin'

export function AwakenFlow({
  content,
  isAdmin = false,
}: {
  content: AwakenPageContent
  isAdmin?: boolean
}) {
  const [active, setActive] = useState('wake')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <ProgressRail active={active} content={content} />

      <div className="mx-auto max-w-2xl px-5 pb-32">
        {isAdmin && <AwakenAdminEditor content={content} />}
        <WakeUp content={content} onInView={() => setActive('wake')} />
        <ShowUp content={content} onInView={() => setActive('show')} />
      </div>
    </div>
  )
}

/* ─────────────────────────────── Progress rail ─────────────────────────── */

function ProgressRail({ active, content }: { active: string; content: AwakenPageContent }) {
  const steps = [
    { id: 'wake', label: content.steps.wake },
    { id: 'show', label: content.steps.show },
  ]

  return (
    <div className="sticky top-14 z-20 border-b border-zinc-900 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-3">
        {steps.map((s, i) => {
          const on = s.id === active
          return (
            <a key={s.id} href={`#${s.id}`} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  on
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-black'
                    : 'border border-zinc-700 text-zinc-500'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-xs font-semibold ${on ? 'text-white' : 'text-zinc-500'}`}>
                {s.label}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────── Act I — Wake up ───────────────────────── */

function WakeUp({ content, onInView }: { content: AwakenPageContent; onInView: () => void }) {
  return (
    <section id="wake" onMouseEnter={onInView} className="pt-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-green-400">
        {content.wake.eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
        <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {content.wake.title}
        </span>
      </h1>

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-zinc-300">
        {content.wake.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {content.wake.stats.map((stat) => (
          <Stat key={stat.key} k={stat.label} v={stat.value} />
        ))}
      </div>

      <a
        href="#show"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-500 hover:to-emerald-500"
      >
        {content.wake.cta}
      </a>
    </section>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{k}</div>
      <div className="mt-1 text-sm font-bold text-white">{v}</div>
    </div>
  )
}

/* ─────────────────────────────── Act II — Show up ──────────────────────── */

function ShowUp({ content, onInView }: { content: AwakenPageContent; onInView: () => void }) {
  return (
    <section id="show" onMouseEnter={onInView} className="pt-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-green-400">
        {content.show.eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">{content.show.title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{content.show.subtitle}</p>

      <div className="mt-8 space-y-6">
        {/* Move 1 — Fuel the car fund → the Crossing campaign */}
        <LinkMoveCard content={content.moves.donate} accent="emerald" />
        {/* Move 2 — Attend a launch event */}
        <EventsCard content={content} />
        {/* Move 3 — Purchase the deck */}
        <LinkMoveCard content={content.moves.deck} accent="teal" />
        {/* Move 4 — Pre-order the book */}
        <LinkMoveCard content={content.moves.book} accent="amber" />
        {/* Chapter One — coming soon, funnels to the book */}
        <LinkMoveCard content={content.moves.chapter} accent="indigo" />
      </div>

      <SecondaryLinks content={content} />
      <ClosingCrossing />
    </section>
  )
}

/* ── Link move card: a card whose primary action is a single link (donate,
   deck, book, chapter). External URLs open in a new tab. ── */

function LinkMoveCard({ content, accent }: { content: AwakenMoveContent; accent: string }) {
  const href = content.href && content.href.trim() ? content.href : '#'
  const external = href.startsWith('http')
  const btn =
    'mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 font-bold text-white transition-all hover:from-green-500 hover:to-emerald-500'

  return (
    <Card accent={accent} badge={content.badge} title={content.title}>
      <p className="text-sm leading-relaxed text-zinc-300">{content.body}</p>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={btn}>
          {content.cta}
        </a>
      ) : (
        <Link href={href} className={btn}>
          {content.cta}
        </Link>
      )}
    </Card>
  )
}

/* ── Move 2: Events (RSVP on Partiful) ── */

function EventsCard({ content }: { content: AwakenPageContent }) {
  return (
    <Card accent="green" badge={content.moves.events.badge} title={content.moves.events.title}>
      <p className="text-sm leading-relaxed text-zinc-300">{content.moves.events.body}</p>

      <div className="mt-4 space-y-2">
        {content.events.map((ev) => (
          <div key={ev.key} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{ev.title}</span>
              <span className="text-[11px] font-semibold text-green-400">{ev.when}</span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">{ev.blurb}</p>
            <p className="mt-0.5 text-[11px] text-zinc-600">{ev.where}</p>
            <a
              href={ev.partifulUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-bold text-white transition-all hover:from-green-500 hover:to-emerald-500"
            >
              RSVP on Partiful →
            </a>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ── Secondary links: products + non-profit ── */

function SecondaryLinks({ content }: { content: AwakenPageContent }) {
  return (
    <div className="mt-12 border-t border-zinc-900 pt-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
        {content.secondary.eyebrow}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href={content.secondary.products.href}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600"
        >
          <div className="font-bold text-white">{content.secondary.products.title}</div>
          <div className="mt-1 text-xs text-zinc-400">{content.secondary.products.body}</div>
        </Link>
        <Link
          href={content.secondary.nonprofit.href}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600"
        >
          <div className="font-bold text-white">{content.secondary.nonprofit.title}</div>
          <div className="mt-1 text-xs text-zinc-400">{content.secondary.nonprofit.body}</div>
        </Link>
      </div>
    </div>
  )
}

/* ── Closing reinforcement: the Crossing lives at the bottom too, and lands
   on the same car-fund campaign as Move 1. ── */

function ClosingCrossing() {
  return (
    <div className="mt-12 border-t border-zinc-900 pt-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-green-400">
        Help right now
      </p>
      <h3 className="mt-2 text-xl font-bold text-white">The Crossing</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Every kind of help moves the campaign. Fuel the car fund or pick another move that fits what
        you can offer.
      </p>
      <Link
        href={AWAKEN_CROSSING_HREF}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 font-bold text-white transition-all hover:from-green-500 hover:to-emerald-500"
      >
        Enter the Crossing →
      </Link>
    </div>
  )
}

/* ─────────────────────────────── Admin editor ──────────────────────────── */

function AwakenAdminEditor({ content }: { content: AwakenPageContent }) {
  const [state, formAction, pending] = useActionState(saveAwakenPageContent, null)

  return (
    <details className="mt-6 rounded-2xl border border-green-800/50 bg-green-950/30 p-4">
      <summary className="cursor-pointer text-sm font-bold text-green-200">
        Edit awaken page copy
      </summary>
      <form action={formAction} className="mt-4 space-y-5">
        <Field name="steps.wake" label="Step 1 label" defaultValue={content.steps.wake} />
        <Field name="steps.show" label="Step 2 label" defaultValue={content.steps.show} />
        <Field name="wake.eyebrow" label="Wake eyebrow" defaultValue={content.wake.eyebrow} />
        <Field name="wake.title" label="Wake title" defaultValue={content.wake.title} />
        <Textarea
          name="wake.paragraphs"
          label="Wake paragraphs"
          defaultValue={content.wake.paragraphs.join('\n\n')}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {content.wake.stats.map((stat, index) => (
            <div key={stat.key} className="rounded-xl border border-zinc-800 p-3">
              <Field name={`wake.stats.${index}.label`} label="Stat label" defaultValue={stat.label} />
              <Field name={`wake.stats.${index}.value`} label="Stat value" defaultValue={stat.value} />
            </div>
          ))}
        </div>
        <Field name="wake.cta" label="Wake CTA" defaultValue={content.wake.cta} />
        <Field name="show.eyebrow" label="Show eyebrow" defaultValue={content.show.eyebrow} />
        <Field name="show.title" label="Show title" defaultValue={content.show.title} />
        <Field name="show.subtitle" label="Show subtitle" defaultValue={content.show.subtitle} />

        <MoveFields prefix="moves.donate" label="Donate card" content={content.moves.donate} />
        <MoveFields
          prefix="moves.events"
          label="Events card"
          content={content.moves.events}
          showHref={false}
        />
        <MoveFields prefix="moves.deck" label="Deck card" content={content.moves.deck} />
        <MoveFields prefix="moves.book" label="Book card" content={content.moves.book} />
        <MoveFields prefix="moves.chapter" label="Chapter card" content={content.moves.chapter} />

        {content.events.map((event, index) => (
          <div key={event.key} className="rounded-xl border border-zinc-800 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Event {index + 1}
            </p>
            <Field name={`events.${index}.title`} label="Title" defaultValue={event.title} />
            <Field name={`events.${index}.when`} label="When" defaultValue={event.when} />
            <Field name={`events.${index}.where`} label="Where" defaultValue={event.where} />
            <Textarea name={`events.${index}.blurb`} label="Blurb" defaultValue={event.blurb} />
            <Field
              name={`events.${index}.partifulUrl`}
              label="Partiful URL"
              defaultValue={event.partifulUrl}
            />
          </div>
        ))}

        <Field name="secondary.eyebrow" label="Secondary eyebrow" defaultValue={content.secondary.eyebrow} />
        <Field name="secondary.products.title" label="Products title" defaultValue={content.secondary.products.title} />
        <Field name="secondary.products.body" label="Products body" defaultValue={content.secondary.products.body} />
        <Field name="secondary.products.href" label="Products link" defaultValue={content.secondary.products.href} />
        <Field name="secondary.nonprofit.title" label="Non-profit title" defaultValue={content.secondary.nonprofit.title} />
        <Field name="secondary.nonprofit.body" label="Non-profit body" defaultValue={content.secondary.nonprofit.body} />
        <Field name="secondary.nonprofit.href" label="Non-profit link" defaultValue={content.secondary.nonprofit.href} />

        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-300">Saved.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save awaken page'}
        </button>
      </form>
    </details>
  )
}

function MoveFields({
  prefix,
  label,
  content,
  showHref = true,
}: {
  prefix: string
  label: string
  content: AwakenMoveContent
  showHref?: boolean
}) {
  return (
    <div className="rounded-xl border border-zinc-800 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <Field name={`${prefix}.badge`} label="Badge" defaultValue={content.badge} />
      <Field name={`${prefix}.title`} label="Title" defaultValue={content.title} />
      <Textarea name={`${prefix}.body`} label="Body" defaultValue={content.body} />
      <Field name={`${prefix}.cta`} label="CTA" defaultValue={content.cta} />
      {showHref && <Field name={`${prefix}.href`} label="Link" defaultValue={content.href ?? ''} />}
    </div>
  )
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-xs font-semibold text-zinc-400">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-green-500"
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
    <label className="block text-xs font-semibold text-zinc-400">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-green-500"
      />
    </label>
  )
}

/* ─────────────────────────────── Shared card ───────────────────────────── */

const ACCENT: Record<string, string> = {
  emerald: 'from-green-500/15 to-emerald-500/5 border-green-800/50',
  teal: 'from-teal-500/15 to-cyan-500/5 border-teal-800/50',
  green: 'from-green-500/15 to-emerald-500/5 border-green-800/50',
  amber: 'from-amber-500/15 to-orange-500/5 border-amber-800/50',
  indigo: 'from-indigo-500/15 to-blue-500/5 border-indigo-800/50',
}

function Card({
  accent,
  badge,
  title,
  children,
}: {
  accent: keyof typeof ACCENT | string
  badge: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${ACCENT[accent] ?? ACCENT.green}`}>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {badge}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-bold text-white">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

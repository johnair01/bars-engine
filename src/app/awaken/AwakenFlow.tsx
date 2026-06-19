'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AWAKEN_EVENTS,
  AWAKEN_DONATE_HREF,
  AWAKEN_PRODUCTS_HREF,
  AWAKEN_NONPROFIT_HREF,
  AWAKEN_CHAPTER_FILE_HREF,
} from '@/lib/awaken/content'

type Status = 'idle' | 'loading' | 'done' | 'error'

const STEPS = [
  { id: 'wake', label: 'Wake up' },
  { id: 'show', label: 'Show up' },
]

export function AwakenFlow() {
  const [active, setActive] = useState('wake')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <ProgressRail active={active} />

      <div className="mx-auto max-w-2xl px-5 pb-32">
        <WakeUp onInView={() => setActive('wake')} />
        <ShowUp onInView={() => setActive('show')} />
      </div>
    </div>
  )
}

/* ─────────────────────────────── Progress rail ─────────────────────────── */

function ProgressRail({ active }: { active: string }) {
  return (
    <div className="sticky top-14 z-20 border-b border-zinc-900 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-3">
        {STEPS.map((s, i) => {
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

function WakeUp({ onInView }: { onInView: () => void }) {
  return (
    <section id="wake" onMouseEnter={onInView} className="pt-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-green-400">
        Act I · The current state of things
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
        <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Wake up.
        </span>
      </h1>

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-zinc-300">
        <p>
          Right now, a real thing is happening. Not an abstraction — a person, a community, and a
          car that needs to keep running so the work can keep moving.
        </p>
        <p>
          The car fund isn&apos;t charity. It&apos;s fuel. It&apos;s what turns intention into
          showing up — to the events, to the people, to the next chapter of a story that&apos;s
          already in motion.
        </p>
        <p>
          Here&apos;s where we are today, and three honest ways you can step in. Read it, then
          choose how you want to show up.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat k="Weekend" v="Jul 17–19" />
        <Stat k="Events" v="3 nights" />
        <Stat k="The ask" v="Show up" />
      </div>

      <a
        href="#show"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-500 hover:to-emerald-500"
      >
        I&apos;m awake — show me how to help ↓
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

function ShowUp({ onInView }: { onInView: () => void }) {
  return (
    <section id="show" onMouseEnter={onInView} className="pt-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-green-400">
        Act II · Show up
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Pick your move.</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Any one of these moves the needle. Do one. Do all three.
      </p>

      <div className="mt-8 space-y-6">
        <DonateCard />
        <ChapterCard />
        <EventsCard />
      </div>

      <SecondaryLinks />
    </section>
  )
}

/* ── Move 1: Donate ── */

function DonateCard() {
  return (
    <Card accent="emerald" badge="Move 1" title="Fuel the car fund">
      <p className="text-sm leading-relaxed text-zinc-300">
        A direct contribution keeps the wheels turning. Every dollar is fuel for showing up.
      </p>
      <Link
        href={AWAKEN_DONATE_HREF}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 font-bold text-white transition-all hover:from-green-500 hover:to-emerald-500"
      >
        Donate to the car fund →
      </Link>
    </Card>
  )
}

/* ── Move 2: Chapter One ── */

function ChapterCard() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/awaken/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'chapter', email }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.')
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <Card accent="teal" badge="Move 2" title="Read Chapter One">
      <p className="text-sm leading-relaxed text-zinc-300">
        Start the story for free. Drop your email and we&apos;ll send the first chapter straight to
        your inbox.
      </p>

      {status === 'done' ? (
        <div className="mt-4 rounded-xl border border-teal-700/50 bg-teal-950/30 p-4">
          <p className="text-sm font-semibold text-teal-300">You&apos;re in. ✨</p>
          <p className="mt-1 text-xs text-zinc-400">
            Chapter One is on its way to your inbox.
          </p>
          <a
            href={AWAKEN_CHAPTER_FILE_HREF}
            className="mt-3 inline-flex items-center text-sm font-bold text-teal-300 underline-offset-2 hover:underline"
          >
            Or download it now →
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-teal-500"
          />
          {status === 'error' && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 font-bold text-white transition-all hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60"
          >
            {status === 'loading' ? 'Sending…' : 'Send me Chapter One →'}
          </button>
        </form>
      )}
    </Card>
  )
}

/* ── Move 3: Events (RSVP on Partiful + optional list capture) ── */

function EventsCard() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/awaken/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'event',
          email,
          name,
          // List signup is for the whole weekend; confirmation carries all three.
          events: AWAKEN_EVENTS.map((ev) => ev.key),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.')
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <Card accent="green" badge="Move 3" title="Be there · Jul 17–19">
      <p className="text-sm leading-relaxed text-zinc-300">
        Three gatherings the weekend of July 18th. RSVP on Partiful for the ones you&apos;ll make.
      </p>

      <div className="mt-4 space-y-2">
        {AWAKEN_EVENTS.map((ev) => (
          <div
            key={ev.key}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
          >
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

      <div className="mt-5 border-t border-zinc-800 pt-4">
        {status === 'done' ? (
          <div className="rounded-xl border border-green-700/50 bg-green-950/30 p-4">
            <p className="text-sm font-semibold text-green-300">You&apos;re on the list. 🎉</p>
            <p className="mt-1 text-xs text-zinc-400">
              Check your inbox — we sent the weekend details and every RSVP link.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm font-semibold text-white">
              Want reminders + the weekend details by email?
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-green-500"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-green-500"
            />
            {status === 'error' && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white transition-all hover:bg-zinc-700 disabled:opacity-60"
            >
              {status === 'loading' ? 'Adding you…' : 'Keep me posted →'}
            </button>
          </form>
        )}
      </div>
    </Card>
  )
}

/* ── Secondary links: products + non-profit ── */

function SecondaryLinks() {
  return (
    <div className="mt-12 border-t border-zinc-900 pt-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
        Go deeper
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href={AWAKEN_PRODUCTS_HREF}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600"
        >
          <div className="font-bold text-white">Explore the book, deck &amp; game</div>
          <div className="mt-1 text-xs text-zinc-400">
            Browse everything you can buy and support →
          </div>
        </Link>
        <Link
          href={AWAKEN_NONPROFIT_HREF}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600"
        >
          <div className="font-bold text-white">About the non-profit</div>
          <div className="mt-1 text-xs text-zinc-400">
            Learn where this is headed (coming soon) →
          </div>
        </Link>
      </div>
    </div>
  )
}

/* ─────────────────────────────── Shared card ───────────────────────────── */

const ACCENT: Record<string, string> = {
  emerald: 'from-green-500/15 to-emerald-500/5 border-green-800/50',
  teal: 'from-teal-500/15 to-cyan-500/5 border-teal-800/50',
  green: 'from-green-500/15 to-emerald-500/5 border-green-800/50',
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

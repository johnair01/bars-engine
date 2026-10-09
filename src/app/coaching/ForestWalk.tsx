'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import {
  BOOK_HREF,
  DOORS,
  EMPTY_MAP,
  FEELINGS,
  PLACES,
  TEXTURES,
  composeMap,
  keptSentence,
} from '@/lib/coaching/coaching-map'
import type { MapState } from '@/lib/coaching/coaching-map'

import { ThreeTwoOneDemo } from './ThreeTwoOneDemo'

/**
 * The forest walk: the coaching page as a space the visitor enters
 * (Wendell, 2026-10-09: "I want it to feel like they are entering a space. The
 * forest. The center of which is what they've been looking for the whole time").
 * The design is content/coaching-game/6FACE_PASS2_2026-10-09.md.
 *
 * Four screens on the way in, each with one act: the edge (step in), where it
 * sits in the body, what it is like, and the clearing (which feeling, and the
 * visitor's own words). The centre gives their words back, with Wendell beside
 * them and one door. The prices sit one tap behind that door, all four at once
 * (cg-money), and "I know what I need" on the edge goes straight there (cg-skip).
 *
 * Everything stays in component state: no account, no request, no AI
 * (cg-browser-only). Motion runs only for visitors who have not asked for
 * reduced motion, and each new screen moves focus to its heading (WCAG 2.3.3
 * and 2.4.3, the Protector's report in that pass).
 */

type Screen = 'edge' | 'where' | 'like' | 'clearing' | 'centre'

/** How far in each screen is, from 0 at the edge to 4 at the centre. Drives the scene. */
const DEPTH: Record<Screen, number> = { edge: 0, where: 1, like: 2, clearing: 3, centre: 4 }

const TIERS = [
  { price: '$250', href: 'https://calendly.com/wendell-britt/coaching-250' },
  { price: '$150', href: 'https://calendly.com/wendell-britt/coaching-150' },
  { price: '$75', href: 'https://calendly.com/wendell-britt/coaching-75' },
  { price: 'Pay what feels right', href: 'https://calendly.com/wendell-britt/pay-what-feels-right' },
] as const

/**
 * The practices, unchanged from the page they came from. They now sit in a fold at
 * the centre, so nobody reads them on the way in (the Skeptic's report: attention
 * falls off below the first screen).
 */
const TOOLS = [
  {
    name: 'The 3-2-1',
    body: 'Take something with charge on it, a person or a part of you. Describe it, talk to it, then speak as it. What you were spending energy pushing away comes back as something you can use.',
  },
  {
    name: 'Interviewing your parts',
    body: 'Seven parts take the controls when nobody is steering: the Protector, the Controller, the Skeptic, the Fixer, the Emotional Body, the Victim and the Damaged Self. We interview each one like an employee. What is your job? How are the hours? How is the pay? Who do you work for? The aim is to get each one working for you.',
  },
  {
    name: 'Emotional Alchemy',
    body: 'My map of five emotional energies, what each one is for, and how each moves when it is stuck and when it is flowing. We use it to read what is live in you in a session, and to turn it into fuel for the next move.',
  },
] as const

const chip =
  'rounded-full border border-emerald-200/25 bg-black/40 px-4 py-2 text-base text-emerald-50 backdrop-blur-sm transition-colors hover:border-amber-200/70 focus-visible:border-amber-200 focus-visible:outline-none'
const quiet = 'text-sm text-emerald-100/70 underline underline-offset-4 hover:text-emerald-50'
const go_on =
  'rounded-full bg-amber-200 px-6 py-3 text-base font-semibold text-[#14110a] transition-colors hover:bg-amber-100 disabled:bg-white/10 disabled:text-white/40'

export function ForestWalk() {
  const [screen, setScreen] = useState<Screen>('edge')
  const [map, setMap] = useState<MapState>(EMPTY_MAP)
  const [booking, setBooking] = useState(false)
  const [path, setPath] = useState<'clean' | null>(null)
  const [copied, setCopied] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  const go = (next: Screen) => {
    moved.current = true
    setScreen(next)
  }

  const openBooking = () => {
    moved.current = true
    setScreen('centre')
    setBooking(true)
  }

  // A link to /coaching#book, from anywhere on the site or the 3-2-1, opens the centre with the prices showing.
  useEffect(() => {
    const check = () => {
      if (window.location.hash !== BOOK_HREF) return
      moved.current = true
      setScreen('centre')
      setBooking(true)
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  // Each new screen takes focus at its heading, so a keyboard or screen-reader visitor keeps their place.
  useEffect(() => {
    if (!moved.current) return
    heading.current?.focus({ preventScroll: true })
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('forest')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [screen])

  useEffect(() => {
    if (booking) document.getElementById('book')?.scrollIntoView({ block: 'nearest' })
  }, [booking])

  const edit = <K extends keyof MapState>(key: K, patch: Partial<MapState[K]>) =>
    setMap((m) => ({ ...m, [key]: { ...m[key], ...patch } }))

  async function copyWords() {
    try {
      await navigator.clipboard.writeText(composeMap(map))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const feeling = FEELINGS.find((f) => f.name === map.open.feeling)
  const carried = (['wake', 'open', 'clean'] as const).map((id) => keptSentence(id, map)).filter(Boolean) as string[]
  const depth = DEPTH[screen]

  const H = (children: ReactNode) => (
    <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold leading-snug text-emerald-50 outline-none sm:text-3xl">
      {children}
    </h2>
  )

  return (
    <section
      id="forest"
      aria-label="A walk into the forest"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#040a07] text-emerald-50"
    >
      <style>{`@keyframes forest-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }`}</style>
      <ForestScene depth={depth} />

      <div
        key={screen}
        className={`relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10 motion-safe:animate-[forest-in_700ms_ease-out] sm:px-6 ${
          screen === 'centre' ? 'justify-start' : 'justify-center'
        }`}
      >
        {screen === 'edge' && (
          <div className="space-y-7 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200/70">
              Coaching with Wendell Britt
            </p>
            {H(<>Whatever brought you here came with you.</>)}
            <p className="text-base leading-relaxed text-emerald-100/80">
              Walk in a little way with it. Three small steps take a few minutes, and at the centre is the help that
              fits. What you write stays in this tab, with no account and no AI.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button type="button" onClick={() => go('where')} className={go_on}>
                Step in
              </button>
              <button type="button" onClick={openBooking} className={quiet}>
                I know what I need
              </button>
            </div>
          </div>
        )}

        {screen === 'where' && (
          <div className="space-y-6">
            {H(<>Take one slow breath. Think of what has been stuck. Where do you feel it?</>)}
            <div className="flex flex-wrap gap-2.5">
              {PLACES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    edit('wake', { place: p })
                    go('like')
                  }}
                  className={chip}
                >
                  {p}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go('clearing')} className={quiet}>
              I can&rsquo;t tell yet
            </button>
          </div>
        )}

        {screen === 'like' && (
          <div className="space-y-6">
            {H(<>What is it like, there in your {map.wake.place}?</>)}
            <div className="flex flex-wrap gap-2.5">
              {TEXTURES.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => {
                    edit('wake', { texture: x })
                    go('clearing')
                  }}
                  className={chip}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'clearing' && (
          <div className="space-y-6">
            {H(<>Which feeling is loudest in you right now?</>)}
            <div className="flex flex-wrap gap-2.5">
              {FEELINGS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  aria-pressed={map.open.feeling === f.name}
                  onClick={() => edit('open', { feeling: f.name })}
                  className={`${chip} ${map.open.feeling === f.name ? 'border-amber-200/80 bg-amber-200/15' : ''}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            {feeling && (
              <label className="block space-y-2">
                <span className="block text-base leading-relaxed text-amber-50">{feeling.job}</span>
                <span className="block text-base font-medium text-emerald-50">{feeling.question}</span>
                <input
                  className="w-full rounded-xl border border-emerald-200/25 bg-black/50 px-4 py-3 text-base text-emerald-50 placeholder:text-emerald-100/40 focus:border-amber-200 focus:outline-none"
                  value={map.open.answer}
                  placeholder="A few words is enough."
                  onChange={(e) => edit('open', { answer: e.target.value })}
                />
              </label>
            )}
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => go('centre')} disabled={!keptSentence('open', map)} className={go_on}>
                Carry it in
              </button>
              <button type="button" onClick={() => go('centre')} className={quiet}>
                Walk on without saying
              </button>
            </div>
          </div>
        )}

        {screen === 'centre' && (
          <div className="space-y-8 pt-6">
            {carried.length > 0 ? (
              <div className="space-y-3 text-center">
                {H(<>This is what you carried in.</>)}
                {carried.map((s) => (
                  <p key={s} className="font-serif text-xl leading-relaxed text-amber-50 sm:text-2xl">
                    {s}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center">
                {H(<>You are at the centre.</>)}
              </div>
            )}

            <figure className="flex items-start gap-4 rounded-2xl border border-amber-100/15 bg-black/45 p-5 backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mastering-allyship/wendell.jpg"
                alt="Wendell Britt"
                width={72}
                height={96}
                className="h-24 w-[72px] shrink-0 rounded-xl object-cover"
              />
              <figcaption className="space-y-2 text-base leading-relaxed text-emerald-50/90">
                <p>
                  Most of us know what we want and keep stalling on it. Usually a part of us is doing that on purpose,
                  and it has a reason. I coach people to meet that part, hear what it is protecting, and put its
                  strength to work on what they actually want.
                </p>
                <p className="text-sm text-emerald-100/60">Wendell Britt</p>
              </figcaption>
            </figure>

            <div id="book" className="scroll-mt-6 space-y-4">
              {!booking ? (
                <div className="text-center">
                  <button type="button" onClick={() => setBooking(true)} className={go_on}>
                    Sit down with me
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-amber-100/20 bg-black/55 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-amber-50">One session with me, at four prices</h3>
                  <p className="text-sm leading-relaxed text-emerald-100/75">
                    You get the same session at every tier, so pick the one that fits what you can pay today. Each
                    opens Calendly in a new tab.
                    {carried.length > 0 && ' Paste what you carried in into the notes box, and we start from there.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {TIERS.map((tier) => (
                      <a
                        key={tier.href}
                        href={tier.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-20 flex-col justify-between rounded-xl border border-emerald-200/20 bg-black/40 p-4 transition-colors hover:border-amber-200/70"
                      >
                        <span className="text-lg font-bold text-amber-200">{tier.price}</span>
                        <span className="mt-2 text-sm font-semibold text-emerald-100">Book &rarr;</span>
                      </a>
                    ))}
                  </div>
                  {carried.length > 0 && (
                    <button type="button" onClick={copyWords} className={quiet}>
                      {copied ? 'Copied' : 'Copy what I carried in'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <details className="group rounded-2xl border border-emerald-200/15 bg-black/40 p-5 backdrop-blur-sm">
              <summary className="cursor-pointer text-base font-semibold text-emerald-50">Other paths from here</summary>
              <ul className="mt-4 space-y-3">
                <li>
                  <button type="button" onClick={() => setPath(path === 'clean' ? null : 'clean')} className="text-left">
                    <span className="block text-sm font-semibold text-amber-100">Face what has charge on it &rarr;</span>
                    <span className="block text-sm leading-relaxed text-emerald-100/65">
                      Free, right here. The 3-2-1, the practice I use in sessions.
                    </span>
                  </button>
                </li>
                {path === 'clean' && (
                  <li id="try-321" className="scroll-mt-6">
                    <ThreeTwoOneDemo bookHref={BOOK_HREF} anchorId="try-321" onOwn={(own) => edit('clean', own)} />
                  </li>
                )}
                {[...DOORS.wake, ...DOORS.open, ...DOORS.grow, ...DOORS.show].map((door) => (
                  <li key={door.href}>
                    <a href={door.href} className="block">
                      <span className="block text-sm font-semibold text-amber-100">{door.label} &rarr;</span>
                      <span className="block text-sm leading-relaxed text-emerald-100/65">{door.detail}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <details className="rounded-2xl border border-emerald-200/15 bg-black/40 p-5 backdrop-blur-sm">
              <summary className="cursor-pointer text-base font-semibold text-emerald-50">What we work with</summary>
              <div className="mt-4 space-y-4">
                {TOOLS.map((tool) => (
                  <div key={tool.name}>
                    <h3 className="text-sm font-semibold text-amber-100">{tool.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-100/70">{tool.body}</p>
                  </div>
                ))}
              </div>
            </details>

            <div className="text-center">
              <button type="button" onClick={() => go('edge')} className={quiet}>
                Walk back to the edge
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-xl space-y-2 px-4 pb-6 text-center text-xs leading-relaxed text-emerald-100/55 sm:px-6">
        <p>
          If you are in crisis, call or text <a href="tel:988" className="underline underline-offset-2">988</a> in the
          United States, or your local emergency number. Coaching suits people steady enough to look at what is in the
          way.
        </p>
        <p>
          The parts work draws on Voice Dialogue and the Big Mind process. The 3-2-1 comes from Ken Wilber&rsquo;s
          Integral Life Practice.
        </p>
      </footer>
    </section>
  )
}

/**
 * The forest itself: three rows of pines and a light far off between them. As the
 * visitor walks in, the near rows grow and part to the sides and the light widens,
 * until at the centre it fills the clearing. Static shapes and CSS only, no images
 * or sound, so it loads on a slow phone (the Protector's report). The art is a
 * design choice (Claude, 2026-10-09), made to be replaced if Wendell wants his own.
 */
function ForestScene({ depth }: { depth: number }) {
  const rows = [
    { seed: 3, count: 16, base: 520, h: 170, color: '#24503d', scale: 1 + depth * 0.08, spread: 1 + depth * 0.06, fade: 1 },
    { seed: 7, count: 9, base: 600, h: 260, color: '#11301f', scale: 1 + depth * 0.2, spread: 1 + depth * 0.16, fade: depth > 3 ? 0.7 : 1 },
    { seed: 11, count: 6, base: 720, h: 470, color: '#030806', scale: 1 + depth * 0.38, spread: 1 + depth * 0.32, fade: depth > 3 ? 0.55 : 1 },
  ]
  const light = 70 + depth * 60

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <radialGradient id="forest-light" cx="50%" cy="58%" r="50%">
            <stop offset="0%" stopColor="#fde9b4" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#d9b46a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#040a07" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="forest-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020605" />
            <stop offset="55%" stopColor="#0f2620" />
            <stop offset="75%" stopColor="#1c3a30" />
            <stop offset="100%" stopColor="#0a1a13" />
          </linearGradient>
        </defs>
        <rect width="400" height="720" fill="url(#forest-sky)" />
        <circle
          cx="200"
          cy="420"
          r={light}
          fill="url(#forest-light)"
          className="motion-safe:transition-all motion-safe:duration-1000"
        />
        {rows.map((row, i) => (
          <g
            key={i}
            fill={row.color}
            opacity={row.fade}
            style={{ transform: `scale(${row.scale})`, transformOrigin: '200px 420px' }}
            className="motion-safe:transition-all motion-safe:duration-1000 motion-safe:ease-out"
          >
            {pines(row.seed, row.count, row.h).map((p, j) => {
              // Trees part to the sides as the visitor walks in, leaving the path to the light open.
              const x = 200 + (p.x - 200) * row.spread
              return <path key={j} d={pine(x, row.base, p.h, p.h * 0.36)} />
            })}
          </g>
        ))}
        <rect y="600" width="400" height="120" fill="#030805" opacity="0.8" />
      </svg>
    </div>
  )
}

/** Tree positions for one row, the same on every render, with a gap left at the middle for the path. */
function pines(seed: number, count: number, h: number) {
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const out: { x: number; h: number }[] = []
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const offset = 40 + rand() * 190
    out.push({ x: 200 + side * offset, h: h * (0.75 + rand() * 0.5) })
  }
  return out
}

/** One pine: three stacked triangles, widening downward, and a trunk. */
function pine(x: number, base: number, h: number, w: number) {
  const tiers = [0, 1, 2].map((i) => {
    const bottom = base - h * 0.15 - (2 - i) * h * 0.22
    const apex = bottom - h * 0.45
    const half = (w / 2) * (0.55 + i * 0.22)
    return `M${x},${apex} L${x - half},${bottom} L${x + half},${bottom} Z`
  })
  const t = w * 0.05
  const trunk = `M${x - t},${base} L${x - t},${base - h * 0.16} L${x + t},${base - h * 0.16} L${x + t},${base} Z`
  return [...tiers, trunk].join(' ')
}

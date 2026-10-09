'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

import { BOOK_HREF, DOORS } from '@/lib/coaching/coaching-map'
import {
  BELIEFS,
  BODY_REGIONS,
  CHANNEL_LIGHT,
  DISSATISFACTIONS,
  EMPTY_WALK,
  EXPERIENCES,
  SATISFACTIONS,
  composeWalk,
  jobsFor,
  recommend,
  toggle,
} from '@/lib/coaching/unpacking-walk'
import type { BodyRegion, Walk } from '@/lib/coaching/unpacking-walk'

import { ThreeTwoOneDemo } from './ThreeTwoOneDemo'

/**
 * The forest walk: the coaching page as a space the visitor enters (Wendell, 2026-10-09:
 * "I want it to feel like they are entering a space. The forest. The center of which is
 * what they've been looking for the whole time"), walked as the six unpacking questions
 * (Wendell, the same evening: "what I want is for this to be a gamified version of the 6
 * unpacking questions"). The design is content/coaching-game/6FACE_PASS3_2026-10-09.md,
 * which follows passes 1 and 2.
 *
 * One question per screen. The feeling the visitor chooses to walk toward (question 2)
 * becomes the forest's light. Question 4 is answered on a body, as Wendell asked ("I want
 * them to choose on the body instead of choosing one of the buttons"). The centre gives
 * back what they carried in, with Wendell beside it, and leads with the offer that fits
 * (recommend(), position cf-routing). Every question can be passed through without answering.
 *
 * Everything stays in component state: no account, no request, no AI (cg-browser-only).
 * Motion runs only for visitors who have not asked for reduced motion, and each new
 * screen moves focus to its heading (cf-protections).
 */

type Screen = 'edge' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'centre'

const ORDER: Screen[] = ['edge', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'centre']

const TIERS = [
  { price: '$250', href: 'https://calendly.com/wendell-britt/coaching-250' },
  { price: '$150', href: 'https://calendly.com/wendell-britt/coaching-150' },
  { price: '$75', href: 'https://calendly.com/wendell-britt/coaching-75' },
  { price: 'Pay what feels right', href: 'https://calendly.com/wendell-britt/pay-what-feels-right' },
] as const

/** The practices, unchanged from the page they came from, in a fold at the centre. */
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

const card = (on: boolean) =>
  `block w-full rounded-2xl border px-4 py-3 text-left backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    on ? 'border-amber-200/80 bg-amber-200/15' : 'border-emerald-200/20 bg-black/45 hover:border-amber-200/60'
  }`
const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-base backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    on ? 'border-amber-200/80 bg-amber-200/20 text-amber-50' : 'border-emerald-200/25 bg-black/45 text-emerald-50 hover:border-amber-200/60'
  }`
const field =
  'w-full rounded-xl border border-emerald-200/25 bg-black/55 px-4 py-3 text-base leading-relaxed text-emerald-50 placeholder:text-emerald-100/40 focus:border-amber-200 focus:outline-none'
const quiet = 'text-sm text-emerald-100/70 underline underline-offset-4 hover:text-emerald-50'
const go_on =
  'rounded-full bg-amber-200 px-6 py-3 text-base font-semibold text-[#14110a] transition-colors hover:bg-amber-100'

export function ForestWalk() {
  const [screen, setScreen] = useState<Screen>('edge')
  const [walk, setWalk] = useState<Walk>(EMPTY_WALK)
  const [booking, setBooking] = useState(false)
  const [practice, setPractice] = useState(false)
  const [copied, setCopied] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  const go = (next: Screen) => {
    moved.current = true
    setScreen(next)
  }
  const step = ORDER.indexOf(screen)
  const next = () => go(ORDER[step + 1])
  const back = () => go(ORDER[step - 1])

  const set = (patch: Partial<Walk>) => setWalk((w) => ({ ...w, ...patch }))

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

  async function copyWalk() {
    try {
      await navigator.clipboard.writeText(composeWalk(walk))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const toward = SATISFACTIONS.filter((s) => walk.toward.includes(s.channel))
  const glow = toward.length ? CHANNEL_LIGHT[toward[0].channel] : '#fde9b4'
  const offers = recommend(walk)
  const record = composeWalk(walk).split('\n').slice(2)

  const H = (children: ReactNode) => (
    <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold leading-snug text-emerald-50 outline-none sm:text-3xl">
      {children}
    </h2>
  )

  const frame = { toward, glow, hRef: heading, onNext: next, onBack: back }

  return (
    <section
      id="forest"
      aria-label="A walk into the forest"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#040a07] text-emerald-50"
    >
      <style>{`@keyframes forest-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }`}</style>
      <ForestScene depth={(step * 4) / (ORDER.length - 1)} glow={glow} />

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
              Walk in with it. Six questions take a few minutes, and at the centre is the help that fits. What
              you write stays in this tab, with no account and no AI.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button type="button" onClick={next} className={go_on}>
                Step in
              </button>
              <button type="button" onClick={openBooking} className={quiet}>
                I know what I need
              </button>
            </div>
          </div>
        )}

        {screen === 'q1' && (
          <Question {...frame} n={1} title="What experience do you want to create?" ready={!!walk.experience || !!walk.experienceOwn.trim()}>
            <div className="space-y-2.5">
              {EXPERIENCES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={walk.experience === e.id}
                  onClick={() => set({ experience: walk.experience === e.id ? '' : e.id })}
                  className={card(walk.experience === e.id)}
                >
                  <span className="text-base text-emerald-50">{e.text}</span>
                </button>
              ))}
            </div>
            <label className="block space-y-2">
              <span className="block text-sm text-emerald-100/70">Or in your own words</span>
              <input
                className={field}
                value={walk.experienceOwn}
                placeholder="What I want to create is..."
                onChange={(e) => set({ experienceOwn: e.target.value, experience: '' })}
              />
            </label>
          </Question>
        )}

        {screen === 'q2' && (
          <Question
            {...frame}
            n={2}
            title="What will that give you?"
            hint="Choose the feeling you want to walk toward. It becomes your light in the forest. You can choose more than one."
            ready={walk.toward.length > 0}
          >
            <div className="space-y-2.5">
              {SATISFACTIONS.map((s) => {
                const on = walk.toward.includes(s.channel)
                return (
                  <button
                    key={s.channel}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ toward: toggle(walk.toward, s.channel) })}
                    className={card(on)}
                  >
                    <span className="flex items-center gap-2 text-base font-semibold capitalize text-emerald-50">
                      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CHANNEL_LIGHT[s.channel] }} />
                      {s.state}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-emerald-100/75">{s.means}</span>
                  </button>
                )
              })}
            </div>
          </Question>
        )}

        {screen === 'q3' && (
          <Question
            {...frame}
            n={3}
            title="Compared to what you want to create, what is life like right now?"
            hint="Say it as it is. A sentence or two is enough."
            ready={!!walk.now.trim()}
          >
            <textarea
              className={`${field} min-h-28`}
              value={walk.now}
              placeholder="Right now..."
              onChange={(e) => set({ now: e.target.value })}
            />
          </Question>
        )}

        {screen === 'q4' && (
          <Question
            {...frame}
            n={4}
            title="How does it feel to live here?"
            hint="Touch where you feel it on the body, then choose the words that fit. You can choose more than one of each."
            ready={walk.feels.length > 0 || walk.where.length > 0}
          >
            <BodyFigure picked={walk.where} onPick={(r) => set({ where: toggle(walk.where, r) })} />
            <div className="flex flex-wrap gap-2.5">
              {DISSATISFACTIONS.map((d) => (
                <button
                  key={d.state}
                  type="button"
                  aria-pressed={walk.feels.includes(d.state)}
                  onClick={() => set({ feels: toggle(walk.feels, d.state) })}
                  className={chip(walk.feels.includes(d.state))}
                >
                  {d.state}
                </button>
              ))}
            </div>
          </Question>
        )}

        {screen === 'q5' && (
          <Question
            {...frame}
            n={5}
            title="What would have to be true for someone to feel this way?"
            hint={
              jobsFor(walk).length > 0
                ? 'Every feeling has a job. Here is the job of each one under what you chose.'
                : 'Answer as if it were about someone else.'
            }
            ready={!!walk.truth.trim()}
          >
            {jobsFor(walk).length > 0 && (
              <ul className="space-y-2.5">
                {jobsFor(walk).map((j) => (
                  <li key={j.channel} className="rounded-2xl border border-emerald-200/20 bg-black/45 px-4 py-3 backdrop-blur-sm">
                    <p className="text-base leading-relaxed text-amber-50">{j.job}</p>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-100/75">{j.question}</p>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              className={`${field} min-h-24`}
              value={walk.truth}
              placeholder="For someone to feel this way, it would have to be true that..."
              onChange={(e) => set({ truth: e.target.value })}
            />
          </Question>
        )}

        {screen === 'q6' && (
          <Question
            {...frame}
            n={6}
            title="What reservations do you have about creating it?"
            hint="These are the voices that most often stop people. Choose any you hear."
            ready={walk.reservations.length > 0}
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              {BELIEFS.map((b) => {
                const on = walk.reservations.includes(b.belief)
                return (
                  <button
                    key={b.belief}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ reservations: toggle(walk.reservations, b.belief) })}
                    className={card(on)}
                  >
                    <span className="block text-base font-semibold text-emerald-50">{b.belief}</span>
                    <span className="mt-0.5 block text-sm italic leading-relaxed text-emerald-100/70">&ldquo;{b.sounds}&rdquo;</span>
                  </button>
                )
              })}
            </div>
          </Question>
        )}

        {screen === 'centre' && (
          <div className="space-y-8 pt-6">
            {record.length > 0 ? (
              <div className="space-y-3">
                <div className="text-center">{H(<>This is what you carried in.</>)}</div>
                <dl className="space-y-2.5 rounded-2xl border border-amber-100/15 bg-black/45 p-5 backdrop-blur-sm">
                  {record.map((line) => {
                    const [k, ...v] = line.split(': ')
                    return (
                      <div key={k}>
                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">{k}</dt>
                        <dd className="font-serif text-lg leading-relaxed text-amber-50">{v.join(': ')}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            ) : (
              <div className="text-center">{H(<>You are at the centre.</>)}</div>
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

            <div className="space-y-3">
              <h3 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">What fits</h3>
              {offers.map((o, i) => (
                <div
                  key={o.id}
                  className={`rounded-2xl border p-5 backdrop-blur-sm ${
                    i === 0 ? 'border-amber-200/50 bg-black/60' : 'border-emerald-200/15 bg-black/45'
                  }`}
                >
                  <h4 className={`font-semibold text-amber-50 ${i === 0 ? 'text-xl' : 'text-base'}`}>{o.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-100/75">{o.why}</p>
                  <div className="mt-3">
                    {o.id === 'coaching' ? (
                      <button type="button" onClick={() => setBooking(true)} className={i === 0 ? go_on : quiet}>
                        {o.cta}
                      </button>
                    ) : (
                      <a href={o.href} className={i === 0 ? `inline-block ${go_on}` : quiet}>
                        {o.cta}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div id="book" className="scroll-mt-6">
              {booking && (
                <div className="space-y-4 rounded-2xl border border-amber-100/20 bg-black/60 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-amber-50">One session with me, at four prices</h3>
                  <p className="text-sm leading-relaxed text-emerald-100/75">
                    You get the same session at every tier, so pick the one that fits what you can pay today. Each
                    opens Calendly in a new tab.
                    {record.length > 0 && ' Paste what you carried in into the notes box, and we start from there.'}
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
                </div>
              )}
            </div>

            {record.length > 0 && (
              <div className="text-center">
                <button type="button" onClick={copyWalk} className={quiet}>
                  {copied ? 'Copied' : 'Copy what I carried in'}
                </button>
              </div>
            )}

            <details className="rounded-2xl border border-emerald-200/15 bg-black/40 p-5 backdrop-blur-sm">
              <summary className="cursor-pointer text-base font-semibold text-emerald-50">Free practices to start with</summary>
              <ul className="mt-4 space-y-3">
                <li>
                  <button type="button" onClick={() => setPractice(!practice)} className="text-left">
                    <span className="block text-sm font-semibold text-amber-100">Face what has charge on it &rarr;</span>
                    <span className="block text-sm leading-relaxed text-emerald-100/65">
                      The 3-2-1, the practice I use in sessions, right here.
                    </span>
                  </button>
                </li>
                {practice && (
                  <li id="try-321" className="scroll-mt-6">
                    <ThreeTwoOneDemo bookHref={BOOK_HREF} anchorId="try-321" />
                  </li>
                )}
                {[...DOORS.wake, ...DOORS.open, ...DOORS.grow].map((door) => (
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

type Frame = {
  toward: ReadonlyArray<{ state: string }>
  glow: string
  hRef: RefObject<HTMLHeadingElement | null>
  onNext: () => void
  onBack: () => void
}

/** The frame every question shares: where you are in the walk, the question, and the way on. */
function Question({
  n,
  title,
  hint,
  children,
  ready,
  toward,
  glow,
  hRef,
  onNext,
  onBack,
}: Frame & { n: number; title: ReactNode; hint?: ReactNode; children: ReactNode; ready: boolean }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
          {n} of 6
          {toward.length > 0 && n > 2 && (
            <span className="ml-3 normal-case tracking-normal" style={{ color: glow }}>
              walking toward {toward.map((s) => s.state).join(' and ')}
            </span>
          )}
        </p>
        <h2 ref={hRef} tabIndex={-1} className="text-2xl font-semibold leading-snug text-emerald-50 outline-none sm:text-3xl">
          {title}
        </h2>
        {hint && <p className="text-base leading-relaxed text-emerald-100/75">{hint}</p>}
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-5 pt-1">
        <button type="button" onClick={onNext} className={go_on}>
          {ready ? 'Walk on' : 'Walk on without answering'}
        </button>
        <button type="button" onClick={onBack} className={quiet}>
          Back
        </button>
      </div>
    </div>
  )
}

/**
 * Question 4 is answered on a body (Wendell, 2026-10-09: "I want them to choose on the body
 * instead of choosing one of the buttons"). A flat figure drawn in SVG rather than the
 * ontology game's 3D figure, so it loads on a slow phone (cf-protections). Each region is a
 * button a keyboard can reach, and the visitor can touch more than one.
 */
function BodyFigure({ picked, onPick }: { picked: BodyRegion[]; onPick: (r: BodyRegion) => void }) {
  const shapes: Record<BodyRegion, ReactNode> = {
    head: <ellipse cx="100" cy="38" rx="24" ry="28" />,
    throat: <rect x="82" y="62" width="36" height="24" rx="8" />,
    chest: <path d="M62 86 Q100 78 138 86 L134 140 Q100 146 66 140 Z" />,
    belly: <path d="M66 142 Q100 148 134 142 L130 196 Q100 204 70 196 Z" />,
    'arms and hands': (
      <>
        <path d="M58 88 L40 96 L26 180 L22 232 L38 236 L46 184 L62 120 Z" />
        <path d="M142 88 L160 96 L174 180 L178 232 L162 236 L154 184 L138 120 Z" />
      </>
    ),
    'legs and feet': (
      <>
        <path d="M70 198 Q84 204 98 204 L96 300 L94 372 L66 376 L68 300 Z" />
        <path d="M130 198 Q116 204 102 204 L104 300 L106 372 L134 376 L132 300 Z" />
      </>
    ),
  }
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
      <svg viewBox="0 0 200 384" className="h-72 w-auto shrink-0" role="group" aria-label="A body. Touch where you feel it.">
        {BODY_REGIONS.map((r) => {
          const on = picked.includes(r)
          return (
            <g
              key={r}
              role="button"
              tabIndex={0}
              aria-label={r}
              aria-pressed={on}
              onClick={() => onPick(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPick(r)
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>*]:stroke-amber-200"
              fill={on ? 'rgba(253,233,180,0.75)' : 'rgba(220,240,230,0.14)'}
              stroke={on ? '#fde9b4' : 'rgba(220,240,230,0.35)'}
              strokeWidth="1.5"
            >
              {shapes[r]}
            </g>
          )
        })}
      </svg>
      <p className="min-h-6 text-center text-base text-amber-50 sm:text-left" aria-live="polite">
        {picked.length ? `In my ${picked.join(', ')}` : 'Touch the body where it sits.'}
      </p>
    </div>
  )
}

/**
 * The forest itself: three rows of pines and a light far off between them. As the
 * visitor walks in, the near rows grow and part to the sides and the light widens,
 * until at the centre it fills the clearing. Static shapes and CSS only, no images
 * or sound, so it loads on a slow phone (the Protector's report). The art is a
 * design choice (Claude, 2026-10-09), made to be replaced if Wendell wants his own.
 * The light takes the colour of the feeling the visitor chose to walk toward (question 2).
 */
function ForestScene({ depth, glow }: { depth: number; glow: string }) {
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
            <stop offset="0%" stopColor={glow} stopOpacity="0.95" />
            <stop offset="35%" stopColor={glow} stopOpacity="0.3" />
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

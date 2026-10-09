'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { BOOK_HREF, DOORS, FEELINGS, PLACES, STATIONS, TEXTURES } from '@/lib/coaching/coaching-map'
import type { StationId } from '@/lib/coaching/coaching-map'
import {
  EMPTY_FOUND,
  FACES,
  FROM_GAME_HASH,
  LIFE_DOMAINS,
  composeFound,
  foundLines,
  readFromGame,
  strategy,
} from '@/lib/coaching/forest-path'
import type { Found } from '@/lib/coaching/forest-path'
import { EMPTY_WORDS, NAMING, YOUR_WORDS_HASH, canSend, wordsMailto } from '@/lib/coaching/your-words'
import type { YourWords } from '@/lib/coaching/your-words'

import { ThreeTwoOneDemo } from './ThreeTwoOneDemo'

/**
 * The forest walk: the coaching page as a space the visitor enters
 * (Wendell, 2026-10-09: "I want it to feel like they are entering a space. The
 * forest. The center of which is what they've been looking for the whole time").
 * Pass 2 (content/coaching-game/6FACE_PASS2_2026-10-09.md) made the forest; pass 3
 * (6FACE_PASS3_2026-10-09.md) gives it two ways in, from his board answers of
 * 20:42 that day.
 *
 * A visitor who knows what they are working on names it in their own words and
 * where in their life it sits, then takes a short tour of how Wendell works
 * (cf-fast-lane, cf-tour). A visitor who does not walks in: where it sits in the
 * body, what it is like, which feeling is loudest and its job, the belief in the
 * way, the life domain, and the level of help, as one of six faces (cf-forest).
 * The ontology game can do the finding instead and hand its result back through
 * /coaching#from-game (cf-game-handoff). The walk follows the five moves, with
 * choosing a face as Grow Up and booking as Show Up (cf-paths), and the moves as
 * practices open up only once the visitor has asked to book.
 *
 * The centre gives back what they found, offers a strategy, shows Wendell, and has
 * one door; the prices sit one tap behind it, all four at once (cf-one-door,
 * cg-money). /coaching#book opens them directly.
 *
 * Everything stays in component state: no account, no request, no AI
 * (cg-browser-only). Motion runs only for visitors who have not asked for
 * reduced motion, and each new screen moves focus to its heading (cf-protections).
 */

type Screen = 'edge' | 'name' | 'tour' | 'where' | 'like' | 'clearing' | 'belief' | 'domain' | 'face' | 'centre'

/** How far in each screen is, from 0 at the edge to 4 at the centre. Drives the scene. */
const DEPTH: Record<Screen, number> = {
  edge: 0,
  name: 1.5,
  tour: 3,
  where: 1,
  like: 1.5,
  clearing: 2,
  belief: 2.5,
  domain: 3,
  face: 3.5,
  centre: 4,
}

/** The move each screen belongs to, shown small above its heading (cf-moves-shape). */
const MOVE: Record<Screen, string> = {
  edge: 'Coaching with Wendell Britt',
  name: 'Wake up · name it',
  tour: 'Open up · how I work',
  where: 'Wake up · what is here',
  like: 'Wake up · what is here',
  clearing: 'Open up · it has a job',
  belief: 'Clean up · what is in the way',
  domain: 'Clean up · where it lives',
  face: 'Grow up · the help you need',
  centre: 'Show up · sit down with me',
}

const TIERS = [
  { price: '$250', href: 'https://calendly.com/wendell-britt/coaching-250' },
  { price: '$150', href: 'https://calendly.com/wendell-britt/coaching-150' },
  { price: '$75', href: 'https://calendly.com/wendell-britt/coaching-75' },
  { price: 'Pay what feels right', href: 'https://calendly.com/wendell-britt/pay-what-feels-right' },
] as const

/**
 * Words from past clients for the tour. Empty until someone sends theirs through
 * "Have you worked with me?" and agrees to be quoted (cf-your-words); the tour
 * shows nothing in their place, and invents nothing (cf-tour).
 */
const TESTIMONIALS: ReadonlyArray<{ words: string; name: string }> = []

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

/** What each move is for once a call is booked (cf-paths: "more useful for people AFTER they have booked"). */
const BEFORE_WE_MEET: Record<StationId, string> = {
  wake: 'When it shows up before our call, notice where it sits in your body.',
  open: 'Let the feeling tell you what it is for.',
  clean: 'If a person or a part of you has charge on it, try the 3-2-1.',
  grow: 'Pick one small practice and keep it daily.',
  show: 'Bring the move that has to be yours. We start there.',
}

const chip =
  'rounded-full border border-emerald-200/25 bg-black/40 px-4 py-2 text-base text-emerald-50 backdrop-blur-sm transition-colors hover:border-amber-200/70 focus-visible:border-amber-200 focus-visible:outline-none'
const chipOn = 'border-amber-200/80 bg-amber-200/15'
const quiet = 'text-sm text-emerald-100/70 underline underline-offset-4 hover:text-emerald-50'
const go_on =
  'rounded-full bg-amber-200 px-6 py-3 text-base font-semibold text-[#14110a] transition-colors hover:bg-amber-100 disabled:bg-white/10 disabled:text-white/40'
const field =
  'w-full rounded-xl border border-emerald-200/25 bg-black/50 px-4 py-3 text-base text-emerald-50 placeholder:text-emerald-100/40 focus:border-amber-200 focus:outline-none'

export function ForestWalk() {
  const [screen, setScreen] = useState<Screen>('edge')
  const [found, setFound] = useState<Found>(EMPTY_FOUND)
  const [booking, setBooking] = useState(false)
  const [tryClean, setTryClean] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wordsOpen, setWordsOpen] = useState(false)
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

  const set = (patch: Partial<Found>) => setFound((f) => ({ ...f, ...patch }))

  // /coaching#book, from anywhere on the site or the 3-2-1, opens the centre with the prices showing.
  // /coaching#your-words, the link Wendell sends past clients, opens it with the testimonial ask showing.
  // /coaching#from-game?channel=…&face=…, from the ontology game's last screen, carries its result in
  // and picks up the walk at the belief (cf-game-handoff).
  useEffect(() => {
    const check = () => {
      const hash = window.location.hash
      if (hash === YOUR_WORDS_HASH) {
        setScreen('centre')
        setWordsOpen(true)
        return
      }
      if (hash.startsWith(FROM_GAME_HASH)) {
        const game = readFromGame(hash)
        if (game) setFound((f) => ({ ...f, ...game }))
        moved.current = true
        setScreen('belief')
        return
      }
      if (hash !== BOOK_HREF) return
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

  useEffect(() => {
    if (wordsOpen && window.location.hash === YOUR_WORDS_HASH) document.getElementById('your-words')?.scrollIntoView({ block: 'start' })
  }, [wordsOpen, screen])

  async function copyFound() {
    try {
      await navigator.clipboard.writeText(composeFound(found))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const feeling = FEELINGS.find((f) => f.name === found.feeling)
  const carried = foundLines(found)
  const depth = DEPTH[screen]

  const H = (children: ReactNode) => (
    <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold leading-snug text-emerald-50 outline-none sm:text-3xl">
      {children}
    </h2>
  )
  const move = <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200/70">{MOVE[screen]}</p>

  const faceCards = (toCentre: boolean) => (
    <div className="grid gap-2.5">
      {FACES.map((f) => (
        <button
          key={f.colour}
          type="button"
          aria-pressed={found.face === f.colour}
          onClick={() => {
            set({ face: f.colour })
            if (toCentre) go('centre')
          }}
          className={`rounded-2xl border border-emerald-200/20 bg-black/45 p-4 text-left backdrop-blur-sm transition-colors hover:border-amber-200/70 ${
            found.face === f.colour ? chipOn : ''
          }`}
        >
          <span className="block text-base text-emerald-50">&ldquo;{f.sounds}&rdquo;</span>
          <span className="mt-1 block text-sm text-amber-100/80">
            {f.plain}, the {f.face}
          </span>
        </button>
      ))}
    </div>
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
          screen === 'centre' || screen === 'tour' || screen === 'face' ? 'justify-start' : 'justify-center'
        }`}
      >
        {screen === 'edge' && (
          <div className="space-y-7 text-center">
            {move}
            {H(<>Whatever brought you here came with you.</>)}
            <p className="text-base leading-relaxed text-emerald-100/80">
              At the centre of this forest is the help that fits it. If you know what you are working on, tell me. If
              not, walk in a little way and find it. What you write stays in this tab, with no account and no AI.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button type="button" onClick={() => go('where')} className={go_on}>
                Help me find it
              </button>
              <button type="button" onClick={() => go('name')} className={`${chip} px-6 py-3`}>
                I know what I&rsquo;m working on
              </button>
              <a href="/ontology-game" className={`${quiet} mt-2`}>
                Or find it in the ontology game, and bring it back here
              </a>
            </div>
          </div>
        )}

        {screen === 'name' && (
          <div className="space-y-6">
            {move}
            {H(<>What do you want help with?</>)}
            <label className="block space-y-2">
              <span className="block text-base leading-relaxed text-emerald-100/80">
                Say it your way. A sentence or two is enough, and it is what we start from.
              </span>
              <textarea
                rows={3}
                className={field}
                value={found.need}
                onChange={(e) => set({ need: e.target.value })}
              />
            </label>
            <fieldset className="space-y-3">
              <legend className="text-base text-emerald-50">Where in your life is it?</legend>
              <div className="flex flex-wrap gap-2.5">
                {LIFE_DOMAINS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={found.domain === d}
                    onClick={() => set({ domain: found.domain === d ? '' : d })}
                    className={`${chip} ${found.domain === d ? chipOn : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => go('tour')} disabled={!found.need.trim()} className={go_on}>
                Show me how you work
              </button>
              <button type="button" onClick={openBooking} className={quiet}>
                Take me to the prices
              </button>
            </div>
          </div>
        )}

        {screen === 'tour' && (
          <div className="space-y-6 pt-6">
            {move}
            {H(<>How I work</>)}
            <p className="text-base leading-relaxed text-emerald-100/85">
              Wherever you are stuck, a feeling is doing a job. I use Emotional Alchemy, my map of five emotional
              energies, to find which one and put it to work for you.
            </p>
            <p className="text-base leading-relaxed text-emerald-100/85">
              I coach at six levels, from what you feel in your body to the whole system you live in. If one of these
              sounds like you, pick it.
            </p>
            {faceCards(false)}
            {TESTIMONIALS.length > 0 && (
              <div className="space-y-3">
                {TESTIMONIALS.map((q) => (
                  <blockquote key={q.words} className="rounded-2xl border border-amber-100/15 bg-black/45 p-4">
                    <p className="font-serif text-lg leading-relaxed text-amber-50">&ldquo;{q.words}&rdquo;</p>
                    <footer className="mt-2 text-sm text-emerald-100/60">{q.name}</footer>
                  </blockquote>
                ))}
              </div>
            )}
            <div className="text-center">
              <button type="button" onClick={() => go('centre')} className={go_on}>
                Walk to the centre
              </button>
            </div>
          </div>
        )}

        {screen === 'where' && (
          <div className="space-y-6">
            {move}
            {H(<>Take one slow breath. Think of what has been stuck. Where do you feel it?</>)}
            <div className="flex flex-wrap gap-2.5">
              {PLACES.map((p) => (
                <button key={p} type="button" onClick={() => go('like')} className={chip}>
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
            {move}
            {H(<>What is it like, there?</>)}
            <div className="flex flex-wrap gap-2.5">
              {TEXTURES.map((x) => (
                <button key={x} type="button" onClick={() => go('clearing')} className={chip}>
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'clearing' && (
          <div className="space-y-6">
            {move}
            {H(<>Which feeling is loudest in you right now?</>)}
            <div className="flex flex-wrap gap-2.5">
              {FEELINGS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  aria-pressed={found.feeling === f.name}
                  onClick={() => set({ feeling: f.name })}
                  className={`${chip} ${found.feeling === f.name ? chipOn : ''}`}
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
                  className={field}
                  value={found.answer}
                  placeholder="A few words is enough."
                  onChange={(e) => set({ answer: e.target.value })}
                />
              </label>
            )}
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => go('belief')} disabled={!feeling} className={go_on}>
                Walk on
              </button>
              <button type="button" onClick={() => go('belief')} className={quiet}>
                Walk on without saying
              </button>
            </div>
          </div>
        )}

        {screen === 'belief' && (
          <div className="space-y-6">
            {move}
            {found.fromGame && (feeling || found.face) && (
              <p className="text-sm leading-relaxed text-emerald-100/75">
                You brought{' '}
                {[feeling?.name.toLowerCase(), found.face && `the ${FACES.find((f) => f.colour === found.face)?.plain} face`]
                  .filter(Boolean)
                  .join(' and ')}{' '}
                from the game. The belief you held stays in the game, so write it here if you want it with you.
              </p>
            )}
            {H(<>When you try to move on this, what does a part of you say?</>)}
            <label className="block space-y-2">
              <span className="block text-base leading-relaxed text-emerald-100/80">
                It often sounds like a rule. &ldquo;If I try, I&rsquo;ll be found out.&rdquo; &ldquo;I&rsquo;m not ready
                yet.&rdquo;
              </span>
              <input className={field} value={found.belief} onChange={(e) => set({ belief: e.target.value })} />
            </label>
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => go('domain')} disabled={!found.belief.trim()} className={go_on}>
                Walk on
              </button>
              <button type="button" onClick={() => go('domain')} className={quiet}>
                I can&rsquo;t tell yet
              </button>
            </div>
          </div>
        )}

        {screen === 'domain' && (
          <div className="space-y-6">
            {move}
            {H(<>Where in your life does it show up most?</>)}
            <div className="flex flex-wrap gap-2.5">
              {LIFE_DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={found.domain === d}
                  onClick={() => {
                    set({ domain: d })
                    go('face')
                  }}
                  className={`${chip} ${found.domain === d ? chipOn : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go('face')} className={quiet}>
              Everywhere, or I can&rsquo;t say
            </button>
          </div>
        )}

        {screen === 'face' && (
          <div className="space-y-6 pt-6">
            {move}
            {H(<>Which of these sounds most like what you need?</>)}
            {faceCards(true)}
            <button type="button" onClick={() => go('centre')} className={quiet}>
              {found.face ? 'Keep this one and walk to the centre' : 'I’m not sure'}
            </button>
          </div>
        )}

        {screen === 'centre' && (
          <div className="space-y-8 pt-6">
            <div className="space-y-4 text-center">
              {move}
              {H(carried.length > 0 ? <>This is what you carried in.</> : <>You are at the centre.</>)}
            </div>
            {carried.length > 0 && (
              <dl className="space-y-3">
                {carried.map((l) => (
                  <div key={l.label}>
                    <dt className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">{l.label}</dt>
                    <dd className="font-serif text-xl leading-relaxed text-amber-50">{l.text}</dd>
                  </div>
                ))}
              </dl>
            )}

            {carried.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-amber-100/15 bg-black/45 p-5 backdrop-blur-sm">
                <h3 className="text-base font-semibold text-amber-50">How we would work on it</h3>
                {strategy(found).map((line) => (
                  <p key={line} className="text-base leading-relaxed text-emerald-50/90">
                    {line}
                  </p>
                ))}
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
                    <button type="button" onClick={copyFound} className={quiet}>
                      {copied ? 'Copied' : 'Copy what I carried in'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {booking && (
              <details id="before-we-meet" className="rounded-2xl border border-emerald-200/15 bg-black/40 p-5 backdrop-blur-sm">
                <summary className="cursor-pointer text-base font-semibold text-emerald-50">Before we meet: five moves</summary>
                <ol className="mt-4 space-y-4">
                  {STATIONS.map((s) => (
                    <li key={s.id} className="space-y-1">
                      <span className="block text-sm font-semibold text-amber-100">{s.move}</span>
                      <span className="block text-sm leading-relaxed text-emerald-100/75">{BEFORE_WE_MEET[s.id]}</span>
                      {s.id === 'clean' && (
                        <>
                          <button type="button" onClick={() => setTryClean(!tryClean)} className={quiet}>
                            {tryClean ? 'Close the 3-2-1' : 'Try the 3-2-1 here, free'}
                          </button>
                          {tryClean && (
                            <div id="try-321" className="scroll-mt-6 pt-2">
                              <ThreeTwoOneDemo bookHref={BOOK_HREF} anchorId="try-321" />
                            </div>
                          )}
                        </>
                      )}
                      {DOORS[s.id].map((door) => (
                        <a key={door.href} href={door.href} className="block pt-1">
                          <span className="block text-sm text-amber-100/90 underline underline-offset-4">{door.label}</span>
                          <span className="block text-xs leading-relaxed text-emerald-100/60">{door.detail}</span>
                        </a>
                      ))}
                    </li>
                  ))}
                </ol>
              </details>
            )}

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

            <YourWordsFold open={wordsOpen} onOpen={setWordsOpen} />

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

/**
 * "Have you worked with me?": the testimonial ask at the centre (cf-your-words).
 * It writes an email from the visitor to Wendell and stores nothing.
 */
function YourWordsFold({ open, onOpen }: { open: boolean; onOpen: (open: boolean) => void }) {
  const [words, setWords] = useState<YourWords>(EMPTY_WORDS)
  return (
    <details
      id="your-words"
      open={open}
      onToggle={(e) => onOpen(e.currentTarget.open)}
      className="scroll-mt-20 rounded-2xl border border-emerald-200/15 bg-black/40 p-5 backdrop-blur-sm"
    >
      <summary className="cursor-pointer text-base font-semibold text-emerald-50">Have you worked with me?</summary>
      <div className="mt-4 space-y-4">
        <p className="text-sm leading-relaxed text-emerald-100/75">
          I&rsquo;d love to hear what it was like. A few lines in your own words helps the next person decide
          whether to sit down with me. You choose whether I can quote you, and how you&rsquo;re named.
        </p>
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-emerald-50">What did you come in with?</span>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-emerald-200/25 bg-black/50 px-4 py-3 text-base text-emerald-50 placeholder:text-emerald-100/40 focus:border-amber-200 focus:outline-none"
            value={words.before}
            placeholder="Optional."
            onChange={(e) => setWords((w) => ({ ...w, before: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-emerald-50">What changed?</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-emerald-200/25 bg-black/50 px-4 py-3 text-base text-emerald-50 placeholder:text-emerald-100/40 focus:border-amber-200 focus:outline-none"
            value={words.changed}
            onChange={(e) => setWords((w) => ({ ...w, changed: e.target.value }))}
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-emerald-50">If I quote you, how should I name you?</legend>
          {NAMING.map((n) => (
            <label key={n.id} className="flex items-center gap-3 text-sm text-emerald-100/85">
              <input
                type="radio"
                name="naming"
                checked={words.naming === n.id}
                onChange={() => setWords((w) => ({ ...w, naming: n.id }))}
                className="accent-amber-200"
              />
              {n.label}
            </label>
          ))}
        </fieldset>
        {(words.naming === 'full' || words.naming === 'first') && (
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-emerald-50">Your name, as you&rsquo;d like it shown</span>
            <input
              className="w-full rounded-xl border border-emerald-200/25 bg-black/50 px-4 py-3 text-base text-emerald-50 placeholder:text-emerald-100/40 focus:border-amber-200 focus:outline-none"
              value={words.name}
              onChange={(e) => setWords((w) => ({ ...w, name: e.target.value }))}
            />
          </label>
        )}
        {canSend(words) ? (
          <a href={wordsMailto(words)} className={`${go_on} inline-block`}>
            Send it to me
          </a>
        ) : (
          <p className="text-sm text-emerald-100/55">Write what changed and pick how you&rsquo;re named, and a send button appears.</p>
        )}
        <p className="text-xs leading-relaxed text-emerald-100/55">
          This opens an email from you to me with your words in it, so you see exactly what I get. Nothing is
          saved on this page.
        </p>
      </div>
    </details>
  )
}

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

import {
  BOOK_HREF,
  DOORS,
  EMPTY_MAP,
  FEELINGS,
  PLACES,
  SITUATIONS,
  STATIONS,
  TEXTURES,
  composeMap,
  keptSentence,
} from '@/lib/coaching/coaching-map'
import type { MapState, StationId } from '@/lib/coaching/coaching-map'

import { ThreeTwoOneDemo } from './ThreeTwoOneDemo'

/**
 * The coaching map: the game a visitor plays through to reach the service that
 * fits. A first screen sorts by situation, five stations follow Wendell's five
 * moves, and the map at the end holds what the visitor kept and the way to book.
 *
 * Everything lives in component state, as in the 3-2-1 demo: no account, no
 * request, no AI, and closing the tab clears it (cg-browser-only). The copy
 * button is the one way the record leaves the page.
 */

type Screen = 'start' | StationId | 'map'

const ANCHOR = 'play'

const field =
  'w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none'
const primary =
  'rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500'
const quiet = 'text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-200'
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${
    on ? 'border-violet-400 bg-violet-600/30 text-white' : 'border-zinc-700 bg-black/30 text-zinc-300 hover:border-violet-400'
  }`

export function CoachingMap() {
  const [screen, setScreen] = useState<Screen>('start')
  const [map, setMap] = useState<MapState>(EMPTY_MAP)
  const [copied, setCopied] = useState(false)

  const go = (next: Screen) => {
    setScreen(next)
    document.getElementById(ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const edit = <K extends keyof MapState>(key: K, patch: Partial<MapState[K]>) =>
    setMap((m) => ({ ...m, [key]: { ...m[key], ...patch } }))

  async function copyRecord() {
    try {
      await navigator.clipboard.writeText(composeMap(map))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const keptCount = STATIONS.filter((s) => keptSentence(s.id, map)).length

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 sm:p-7">
      {screen !== 'start' && (
        <nav aria-label="The five moves" className="mb-6 flex flex-wrap gap-2">
          {STATIONS.map((s) => {
            const kept = !!keptSentence(s.id, map)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                aria-current={screen === s.id ? 'step' : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  screen === s.id
                    ? 'border-violet-300 text-white'
                    : kept
                      ? 'border-amber-500/60 text-amber-200'
                      : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {kept ? '● ' : '○ '}
                {s.move}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => go('map')}
            aria-current={screen === 'map' ? 'step' : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              screen === 'map' ? 'border-violet-300 text-white' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            My map
          </button>
        </nav>
      )}

      {screen === 'start' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Which of these is closest to where you are?</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              Pick one to start. Each stop takes a few minutes and gives you a sentence to keep.
              What you write stays in this browser tab, with no account and no AI, and it is gone
              when you close the tab.
            </p>
          </div>
          <div className="grid gap-3">
            {SITUATIONS.map((s) => (
              <button
                key={s.station}
                type="button"
                onClick={() => go(s.station)}
                className="rounded-xl border border-zinc-700 bg-black/30 p-4 text-left text-zinc-100 transition-colors hover:border-violet-400"
              >
                {s.text}
              </button>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Already know you want a session?{' '}
            <a href={BOOK_HREF} className="font-semibold text-zinc-200 underline underline-offset-4">
              Skip to booking
            </a>
            . If it is too much right now,{' '}
            <a href="#before-you-start" className="font-semibold text-zinc-200 underline underline-offset-4">
              read this first
            </a>
            .
          </p>
        </div>
      )}

      {screen === 'wake' && (
        <StationFrame id="wake" map={map} go={go}>
          <p className="text-sm leading-relaxed text-zinc-400">
            Think of what keeps stopping you. Take one slow breath and let it be there.
            Where do you feel it?
          </p>
          <div className="flex flex-wrap gap-2">
            {PLACES.map((p) => (
              <button key={p} type="button" onClick={() => edit('wake', { place: p })} className={chip(map.wake.place === p)}>
                {p}
              </button>
            ))}
          </div>
          {map.wake.place && (
            <>
              <p className="text-sm leading-relaxed text-zinc-400">What is it like?</p>
              <div className="flex flex-wrap gap-2">
                {TEXTURES.map((x) => (
                  <button key={x} type="button" onClick={() => edit('wake', { texture: x })} className={chip(map.wake.texture === x)}>
                    {x}
                  </button>
                ))}
              </div>
            </>
          )}
        </StationFrame>
      )}

      {screen === 'open' && (
        <StationFrame id="open" map={map} go={go}>
          <p className="text-sm leading-relaxed text-zinc-400">
            Every feeling has a job. Which one is loudest in you right now?
          </p>
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map((f) => (
              <button key={f.name} type="button" onClick={() => edit('open', { feeling: f.name })} className={chip(map.open.feeling === f.name)}>
                {f.name}
              </button>
            ))}
          </div>
          {(() => {
            const f = FEELINGS.find((x) => x.name === map.open.feeling)
            if (!f) return null
            return (
              <label className="block space-y-1.5">
                <span className="block text-sm leading-relaxed text-zinc-300">{f.job}</span>
                <span className="block text-sm font-semibold text-zinc-200">{f.question}</span>
                <input
                  className={field}
                  value={map.open.answer}
                  placeholder="A few words is enough."
                  onChange={(e) => edit('open', { answer: e.target.value })}
                />
              </label>
            )
          })()}
        </StationFrame>
      )}

      {screen === 'clean' && (
        <StationFrame id="clean" map={map} go={go}>
          <p className="text-sm leading-relaxed text-zinc-400">
            This is the 3-2-1, the same practice I use in sessions. You describe what has
            charge, talk to it, then speak as it. What you take back at the end goes on your map.
          </p>
          <div id="try-321" className="scroll-mt-24">
            <ThreeTwoOneDemo bookHref={BOOK_HREF} anchorId="try-321" onOwn={(own) => edit('clean', own)} />
          </div>
        </StationFrame>
      )}

      {screen === 'grow' && (
        <StationFrame id="grow" map={map} go={go}>
          <p className="text-sm leading-relaxed text-zinc-400">
            A move you make once fades. A move you practise becomes part of you. What would you
            practise for ten minutes a day, for thirty days?
          </p>
          <input
            className={field}
            value={map.grow.practice}
            placeholder="e.g. saying what I want before I explain why"
            onChange={(e) => edit('grow', { practice: e.target.value })}
          />
        </StationFrame>
      )}

      {screen === 'show' && (
        <StationFrame id="show" map={map} go={go}>
          <p className="text-sm leading-relaxed text-zinc-400">
            Some moves nobody else can make for you. Name one, and the day you will make it by.
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-zinc-200">The move that has to be mine</span>
            <input
              className={field}
              value={map.show.move}
              placeholder="e.g. ask Dana to co-host the launch"
              onChange={(e) => edit('show', { move: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-zinc-200">By when</span>
            <input
              className={field}
              value={map.show.when}
              placeholder="e.g. Friday"
              onChange={(e) => edit('show', { when: e.target.value })}
            />
          </label>
        </StationFrame>
      )}

      {screen === 'map' && (
        <div className="space-y-5">
          <h3 className="text-xl font-bold">Your map</h3>
          <ul className="space-y-3">
            {STATIONS.map((s) => {
              const kept = keptSentence(s.id, map)
              return (
                <li key={s.id} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                  <span className={`text-sm font-bold ${kept ? 'text-amber-200' : 'text-zinc-500'}`}>{s.move}</span>
                  {kept ? (
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">{kept}</p>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">
                      Not played yet.{' '}
                      <button type="button" onClick={() => go(s.id)} className={quiet}>
                        Go there
                      </button>
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
          {keptCount > 0 ? (
            <>
              <p className="text-sm leading-relaxed text-zinc-400">
                Copy your map and keep it where you will see it this week. If you book a session,
                paste it into the notes box when you book, and we start from there.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button type="button" onClick={copyRecord} className={primary}>
                  {copied ? 'Copied' : 'Copy my map'}
                </button>
                <a href={BOOK_HREF} className="text-sm font-semibold text-violet-200 underline underline-offset-4">
                  Bring it to a session
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-400">
              Your map fills in as you play.{' '}
              <button type="button" onClick={() => go('start')} className={quiet}>
                Pick where to start
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StationFrame({
  id,
  map,
  go,
  children,
}: {
  id: StationId
  map: MapState
  go: (next: Screen) => void
  children: ReactNode
}) {
  const index = STATIONS.findIndex((s) => s.id === id)
  const station = STATIONS[index]
  const next = STATIONS.slice(index + 1).find((s) => !keptSentence(s.id, map))
  const kept = keptSentence(id, map)

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-violet-300">{station.move}</p>
        <h3 className="text-xl font-bold">{station.plain}</h3>
      </div>
      {children}
      {kept && (
        <div className="space-y-4 rounded-xl border border-amber-600/40 bg-amber-950/20 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Keep this</p>
            <p className="mt-1 text-base leading-relaxed text-zinc-100">{kept}</p>
          </div>
          <div className="space-y-3">
            {DOORS[id].map((door) => (
              <a key={door.href} href={door.href} className="block rounded-lg border border-zinc-700 bg-black/30 p-3 hover:border-violet-400">
                <span className="block text-sm font-semibold text-violet-200">{door.label} &rarr;</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-zinc-400">{door.detail}</span>
              </a>
            ))}
            <a href={BOOK_HREF} className="block rounded-lg border border-zinc-700 bg-black/30 p-3 hover:border-violet-400">
              <span className="block text-sm font-semibold text-violet-200">Bring it to a session with me &rarr;</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-zinc-400">
                One session, at the price that fits what you can pay today.
              </span>
            </a>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {next ? (
          <button type="button" onClick={() => go(next.id)} className={primary}>
            Next: {next.move}
          </button>
        ) : null}
        <button type="button" onClick={() => go('map')} className={next ? quiet : primary}>
          See my map
        </button>
      </div>
    </div>
  )
}

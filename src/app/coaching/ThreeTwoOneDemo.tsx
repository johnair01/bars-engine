'use client'

import { useState } from 'react'

import { ThreeTwoOnePasses } from '@/components/clean-up/ThreeTwoOnePasses'
import type { ThreadMessage } from '@/components/clean-up/ThreeTwoOnePasses'
import { EMPTY_PASS, NAME_PLACEHOLDER, OWN_IT, SUBJECTS, composeSummary } from '@/lib/coaching/three-two-one'
import type { Subject, ThreeTwoOnePass } from '@/lib/coaching/three-two-one'

/**
 * The working 3-2-1 on the coaching page.
 *
 * The three passes are the Clean Up check's own interface
 * (`ThreeTwoOnePasses`), including its back-and-forth thread. This wrapper adds
 * a first screen for choosing what to work, a landing for what comes back,
 * and a record to copy.
 *
 * Everything lives in component state and stays in the visitor's browser: no
 * account, no request, no AI. Closing the tab clears it. That keeps the demo
 * usable by someone who has only been sent a link, and it fits the
 * community's preference for a first-class non-AI path (CLAUDE.md, Community
 * Context). The copy button is the one way a pass leaves the page, and the
 * client presses it.
 */

type Screen = 'choose' | 'work' | 'own' | 'record'

const field =
  'w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none'
const primary =
  'rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500'
const quiet = 'text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-200'

export function ThreeTwoOneDemo({
  bookHref,
  anchorId = 'try-321',
  onOwn,
}: {
  bookHref: string
  /** The element to scroll back to on each screen change. */
  anchorId?: string
  /** Called with what the client takes back, when they reach the record. The coaching map keeps it. */
  onOwn?: (own: ThreeTwoOnePass['ownIt']) => void
}) {
  const [screen, setScreen] = useState<Screen>('choose')
  const [pass, setPass] = useState<ThreeTwoOnePass>(EMPTY_PASS)
  const [copied, setCopied] = useState(false)

  const go = (next: Screen) => {
    setScreen(next)
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const set = <K extends keyof ThreeTwoOnePass>(key: K) => (value: ThreeTwoOnePass[K]) =>
    setPass((p) => ({ ...p, [key]: value }))

  function chooseSubject(subject: Subject) {
    setPass((p) => ({ ...p, subject }))
    go('work')
  }

  async function copyRecord() {
    try {
      await navigator.clipboard.writeText(composeSummary(pass))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  function restart() {
    setPass(EMPTY_PASS)
    setCopied(false)
    go('choose')
  }

  const worked = pass.faceCharge.trim() || pass.thread.length > 0 || pass.beVoice.trim()

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 sm:p-7">
      {screen === 'choose' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Bring one thing with charge on it.</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              About ten minutes. What you write stays in this browser tab and disappears when you
              close it.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => chooseSubject(s.key)}
                className="rounded-xl border border-zinc-700 bg-black/30 p-4 text-left transition-colors hover:border-violet-400"
              >
                <span className="block font-semibold text-zinc-100">{s.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-zinc-400">{s.detail}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'work' && (
        <div>
          <h3 className="text-xl font-bold">Three passes. Same charge, three positions.</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">Write badly and quickly.</p>
          <ThreeTwoOnePasses
            faceCharge={pass.faceCharge}
            setFaceCharge={set('faceCharge')}
            maskName={pass.maskName}
            setMaskName={set('maskName')}
            thread={pass.thread}
            setThread={(update: (current: ThreadMessage[]) => ThreadMessage[]) =>
              setPass((p) => ({ ...p, thread: update(p.thread) }))
            }
            beVoice={pass.beVoice}
            setBeVoice={set('beVoice')}
            beShift={pass.beShift}
            setBeShift={set('beShift')}
            namePlaceholder={NAME_PLACEHOLDER}
          />
          <Nav onBack={() => go('choose')} onNext={() => go('own')} canNext={!!worked} hint="Write something in at least one pass." />
        </div>
      )}

      {screen === 'own' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{OWN_IT.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">{OWN_IT.instruction}</p>
          </div>
          {(['quality', 'move'] as const).map((key, i) => (
            <label key={key} className="block space-y-1.5">
              <span className="text-sm font-semibold text-zinc-200">{OWN_IT[key].label}</span>
              <input
                className={field}
                autoFocus={i === 0}
                value={pass.ownIt[key]}
                placeholder={OWN_IT[key].placeholder}
                onChange={(e) => setPass((p) => ({ ...p, ownIt: { ...p.ownIt, [key]: e.target.value } }))}
              />
            </label>
          ))}
          <Nav
            onBack={() => go('work')}
            onNext={() => {
              onOwn?.(pass.ownIt)
              go('record')
            }}
            canNext
            nextLabel="See my 3-2-1"
          />
        </div>
      )}

      {screen === 'record' && (
        <div className="space-y-5">
          <h3 className="text-xl font-bold">Here is your pass.</h3>
          <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-black/40 p-4 font-sans text-sm leading-relaxed text-zinc-300">
            {composeSummary(pass)}
          </pre>
          <p className="text-sm leading-relaxed text-zinc-400">
            Copy it somewhere you will see it again, then run the move. If the charge comes back
            later, run the 3-2-1 again on whatever shows up: there is usually another layer.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={copyRecord} className={primary}>
              {copied ? 'Copied' : 'Copy my 3-2-1'}
            </button>
            <a href={bookHref} className="text-sm font-semibold text-violet-200 underline underline-offset-4">
              Bring it to a session
            </a>
            <button type="button" onClick={restart} className={quiet}>
              Start a new one
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Nav({
  onBack,
  onNext,
  canNext,
  hint,
  nextLabel = 'Continue',
}: {
  onBack: () => void
  onNext: () => void
  canNext: boolean
  hint?: string
  nextLabel?: string
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <button type="button" onClick={onNext} disabled={!canNext} className={primary}>
        {nextLabel}
      </button>
      <button type="button" onClick={onBack} className={quiet}>
        Back
      </button>
      {!canNext && hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  )
}

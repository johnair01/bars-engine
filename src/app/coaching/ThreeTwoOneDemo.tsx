'use client'

import { useState } from 'react'

import {
  BE_IT,
  EMPTY_PASS,
  FACE_IT,
  OWN_IT,
  SUBJECTS,
  TALK_TO_IT,
  composeSummary,
  threadHasBothVoices,
} from '@/lib/coaching/three-two-one'
import type { Subject, ThreadLine, ThreeTwoOnePass } from '@/lib/coaching/three-two-one'

/**
 * The working 3-2-1 on the coaching page.
 *
 * Everything lives in component state and stays in the visitor's browser: no
 * account, no request, no AI. Closing the tab clears it. That keeps the demo
 * usable by someone who has only been sent a link, and it fits the
 * community's preference for a first-class non-AI path (CLAUDE.md, Community
 * Context). The copy button is the one way a pass leaves the page, and the
 * client presses it.
 */

type Screen = 'choose' | 'face' | 'talk' | 'be' | 'own' | 'record'
const ORDER: Screen[] = ['choose', 'face', 'talk', 'be', 'own', 'record']

const field =
  'w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none'
const primary =
  'rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500'
const quiet = 'text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-200'

export function ThreeTwoOneDemo({ bookHref }: { bookHref: string }) {
  const [screen, setScreen] = useState<Screen>('choose')
  const [pass, setPass] = useState<ThreeTwoOnePass>(EMPTY_PASS)
  const [copied, setCopied] = useState(false)

  const index = ORDER.indexOf(screen)
  const go = (next: Screen) => {
    setScreen(next)
    document.getElementById('try-321')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const back = () => go(ORDER[Math.max(0, index - 1)])

  function chooseSubject(subject: Subject) {
    setPass((p) => ({ ...p, subject }))
    go('face')
  }

  function addLine(from: ThreadLine['from'], text = '') {
    setPass((p) => ({ ...p, thread: [...p.thread, { from, text }] }))
  }

  function editLine(i: number, text: string) {
    setPass((p) => ({ ...p, thread: p.thread.map((line, j) => (j === i ? { ...line, text } : line)) }))
  }

  function removeLine(i: number) {
    setPass((p) => ({ ...p, thread: p.thread.filter((_, j) => j !== i) }))
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

  const subject = pass.subject ?? 'person'
  const lastFrom = pass.thread.at(-1)?.from

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 sm:p-7">
      {screen !== 'choose' && screen !== 'record' && (
        <div className="mb-6 flex items-center gap-2" aria-label={`Step ${index} of 4`}>
          {ORDER.slice(1, 5).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i + 1 < index ? 'bg-violet-500' : i + 1 === index ? 'bg-violet-300' : 'bg-zinc-800'}`}
            />
          ))}
        </div>
      )}

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

      {screen === 'face' && (
        <Phase number={FACE_IT.number} title={FACE_IT.title} instruction={FACE_IT.instruction}>
          <textarea
            className={field}
            rows={6}
            autoFocus
            value={pass.faceIt}
            placeholder={FACE_IT.placeholder[subject]}
            onChange={(e) => setPass((p) => ({ ...p, faceIt: e.target.value }))}
          />
          <Nav onBack={back} onNext={() => go('talk')} canNext={pass.faceIt.trim().length > 0} />
        </Phase>
      )}

      {screen === 'talk' && (
        <Phase number={TALK_TO_IT.number} title={TALK_TO_IT.title} instruction={TALK_TO_IT.instruction}>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Questions to ask it</p>
            <div className="flex flex-wrap gap-2">
              {TALK_TO_IT.questions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => addLine('me', q)}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:border-violet-400"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <ol className="space-y-3">
            {pass.thread.map((line, i) => (
              <li key={i} className={line.from === 'it' ? 'pl-6 sm:pl-10' : 'pr-6 sm:pr-10'}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={line.from === 'me' ? 'font-semibold text-zinc-300' : 'font-semibold text-violet-300'}>
                    {line.from === 'me' ? 'Me' : 'It'}
                  </span>
                  <button type="button" onClick={() => removeLine(i)} className="text-zinc-600 hover:text-zinc-300">
                    Remove
                  </button>
                </div>
                <textarea
                  className={`${field} ${line.from === 'it' ? 'border-violet-500/40' : ''}`}
                  rows={2}
                  autoFocus={i === pass.thread.length - 1}
                  value={line.text}
                  placeholder={line.from === 'me' ? TALK_TO_IT.mePlaceholder : TALK_TO_IT.itPlaceholder}
                  onChange={(e) => editLine(i, e.target.value)}
                />
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addLine('me')}
              className={`rounded-lg border px-4 py-2 text-sm ${lastFrom === 'it' || !lastFrom ? 'border-zinc-500 text-zinc-100' : 'border-zinc-800 text-zinc-400'}`}
            >
              + Say it as me
            </button>
            <button
              type="button"
              onClick={() => addLine('it')}
              className={`rounded-lg border px-4 py-2 text-sm ${lastFrom === 'me' ? 'border-violet-400 text-violet-200' : 'border-zinc-800 text-zinc-400'}`}
            >
              + Answer as it
            </button>
          </div>

          <Nav onBack={back} onNext={() => go('be')} canNext={threadHasBothVoices(pass.thread)} hint="Write at least one line in each seat." />
        </Phase>
      )}

      {screen === 'be' && (
        <Phase number={BE_IT.number} title={BE_IT.title} instruction={BE_IT.instruction}>
          {BE_IT.fields.map((f, i) => (
            <label key={f.key} className="block space-y-1.5">
              <span className="text-sm font-semibold text-violet-200">{f.label}</span>
              <textarea
                className={field}
                rows={3}
                autoFocus={i === 0}
                value={pass.beIt[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setPass((p) => ({ ...p, beIt: { ...p.beIt, [f.key]: e.target.value } }))}
              />
            </label>
          ))}
          <Nav onBack={back} onNext={() => go('own')} canNext={pass.beIt.iAm.trim().length > 0} hint="Start with “I am…”." />
        </Phase>
      )}

      {screen === 'own' && (
        <Phase title={OWN_IT.title} instruction={OWN_IT.instruction}>
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
          <Nav onBack={back} onNext={() => go('record')} canNext nextLabel="See my 3-2-1" />
        </Phase>
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

function Phase({
  number,
  title,
  instruction,
  children,
}: {
  number?: string
  title: string
  instruction: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="flex items-baseline gap-3 text-xl font-bold">
          {number && <span className="font-mono text-3xl text-violet-300">{number}</span>}
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-400">{instruction}</p>
      </div>
      {children}
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
    <div className="flex flex-wrap items-center gap-4 pt-1">
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

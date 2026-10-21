'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { HostedCampaignFields } from '@/lib/hosted-campaigns/campaigns'
import {
  BOOK_WENDELL_URL,
  PLATFORMS,
  STUCK_CHOICES,
  STUCK_PROMPTS,
  buildDraft,
  stepProgress,
  stepsFor,
  type IntakePlatform,
  type IntakeStep,
  type StuckChoice,
} from '@/lib/hosted-campaigns/intake'
import { pressStuck, saveHostedIntake, shareStuckReflection } from '@/actions/hosted-campaign'

const box = {
  background: 'var(--bars-surface-inset)',
  border: '1px solid var(--bars-line)',
  color: 'var(--bars-text-primary)',
} as const
const card = { background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' } as const
const gold = 'var(--bars-earth-gem)'
const muted = 'var(--bars-text-secondary)'

const DEMO_KEY = (slug: string) => `campaign-intake-preview:${slug}`

/** Keep the address bar on the step she is on, so a link opens right here. */
function syncUrl(platform: IntakePlatform, stepId: string | null, draft: boolean) {
  const url = new URL(window.location.href)
  url.searchParams.set('platform', platform)
  if (stepId && !draft) url.searchParams.set('step', stepId)
  else url.searchParams.delete('step')
  if (draft) url.searchParams.set('view', 'draft')
  else url.searchParams.delete('view')
  window.history.replaceState(null, '', url)
}

export function IntakeFlow({
  slug,
  token,
  demo,
  fields,
  initialAnswers,
  initialPlatform,
  initialStepId,
  initialDraft,
}: {
  slug: string
  token: string
  demo: boolean
  fields: HostedCampaignFields
  initialAnswers: Record<string, string>
  initialPlatform: IntakePlatform
  initialStepId: string | null
  initialDraft: boolean
}) {
  const [platform, setPlatform] = useState(initialPlatform)
  const steps = useMemo(() => stepsFor(platform), [platform])
  const [index, setIndex] = useState(() => Math.max(0, steps.findIndex((s) => s.id === initialStepId)))
  const [draft, setDraft] = useState(initialDraft)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Preview answers live in this browser only.
    if (!demo || typeof window === 'undefined') return initialAnswers
    try {
      const saved = window.localStorage.getItem(DEMO_KEY(slug))
      return saved ? (JSON.parse(saved) as Record<string, string>) : initialAnswers
    } catch {
      return initialAnswers
    }
  })
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const step = steps[Math.min(index, steps.length - 1)]
  useEffect(() => syncUrl(platform, step?.id ?? null, draft), [platform, step, draft])

  const save = (then?: () => void) => {
    if (!dirty) return then?.()
    start(async () => {
      if (demo) {
        try {
          window.localStorage.setItem(DEMO_KEY(slug), JSON.stringify(answers))
        } catch {}
      }
      const res = await saveHostedIntake(slug, token, answers)
      if (res.ok) {
        setDirty(false)
        setStatus(demo ? 'Kept in this browser (preview).' : 'Saved.')
        then?.()
      } else setStatus(res.error)
    })
  }

  const go = (nextPlatform: IntakePlatform, nextIndex: number, nextDraft = false) =>
    save(() => {
      setPlatform(nextPlatform)
      setIndex(nextIndex)
      setDraft(nextDraft)
      window.scrollTo({ top: 0 })
    })

  const other = platform === 'gofundme' ? 'patreon' : 'gofundme'
  const name = PLATFORMS.find((p) => p.key === platform)!.name

  return (
    <>
      <header className="flex flex-col gap-3">
        {demo && (
          <p className="rounded-md px-3 py-2 text-sm" style={{ ...card, color: gold }}>
            Preview: answers stay in this browser. STUCK? emails go to Wendell marked &ldquo;Preview test&rdquo;.
          </p>
        )}
        <a href={`/campaigns/${slug}/edit/${token}`} className="self-start text-sm underline" style={{ color: muted }}>
          Back to your campaign page
        </a>
        <h1 style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-3xl)' }}>Build your fundraising pages</h1>
        <p style={{ color: muted }}>
          One step at a time. Each step carries what GoFundMe or Patreon says works. Answer what you can, skip what you
          can&apos;t yet, and press STUCK? the moment a step feels heavy. At the end you get a draft of each page to copy in,
          or Wendell can build it from your answers.
        </p>
        <nav className="flex gap-2" aria-label="Platform">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => go(p.key, 0)}
              className="rounded-md px-3 py-2 text-sm font-semibold"
              style={p.key === platform ? { background: gold, color: 'var(--bars-bg-base)' } : card}
            >
              {p.name}
            </button>
          ))}
        </nav>
        <ol className="flex flex-wrap gap-1.5" aria-label="Steps">
          {steps.map((s, i) => {
            const { done, total } = stepProgress(s, answers)
            const here = !draft && i === index
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(platform, i)}
                  className="rounded-full px-2.5 py-1 text-xs"
                  style={{ ...card, borderColor: here ? gold : 'var(--bars-line)', color: done === total ? gold : 'var(--bars-text-primary)' }}
                  aria-current={here ? 'step' : undefined}
                >
                  {i + 1}. {s.title} {done > 0 && `(${done}/${total})`}
                </button>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => go(platform, index, true)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ ...card, borderColor: draft ? gold : 'var(--bars-line)' }}
            >
              Your {name} draft
            </button>
          </li>
        </ol>
      </header>

      {draft ? (
        <Draft platform={platform} answers={answers} fields={fields} onOther={() => go(other, 0)} otherName={PLATFORMS.find((p) => p.key === other)!.name} />
      ) : (
        step && (
          <StepCard
            key={step.id}
            step={step}
            number={index + 1}
            answers={answers}
            onChange={(k, v) => {
              setAnswers((a) => ({ ...a, [k]: v }))
              setDirty(true)
            }}
            slug={slug}
            token={token}
          />
        )
      )}

      {!draft && (
        <div
          className="sticky bottom-0 flex flex-wrap items-center gap-3 py-3"
          style={{ background: 'var(--bars-bg-base)', borderTop: '1px solid var(--bars-line)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <button type="button" disabled={pending || index === 0} onClick={() => go(platform, index - 1)} className="rounded-md px-4 py-2 text-sm disabled:opacity-40" style={card}>
            Back
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => (index < steps.length - 1 ? go(platform, index + 1) : go(platform, index, true))}
            className="rounded-md px-4 py-2 font-semibold disabled:opacity-60"
            style={{ background: gold, color: 'var(--bars-bg-base)' }}
          >
            {pending ? 'Saving' : index < steps.length - 1 ? 'Save and next' : `Save and see your ${name} draft`}
          </button>
          <span className="text-sm" role="status" style={{ color: muted }}>
            {dirty ? 'Not saved yet.' : status}
          </span>
        </div>
      )}
    </>
  )
}

function StepCard({
  step,
  number,
  answers,
  onChange,
  slug,
  token,
}: {
  step: IntakeStep
  number: number
  answers: Record<string, string>
  onChange: (key: string, value: string) => void
  slug: string
  token: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-xl)' }}>
          {number}. {step.title}
        </h2>
        <Stuck step={step} slug={slug} token={token} />
      </div>
      <p className="rounded-md px-3 py-2 text-sm" style={{ ...card, color: muted }}>
        <span className="font-semibold" style={{ color: gold }}>What works: </span>
        {step.why}
      </p>
      {step.questions.map((x) => (
        <label key={x.key} className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">{x.ask}</span>
          {x.long ? (
            <textarea rows={4} value={answers[x.key] ?? ''} onChange={(e) => onChange(x.key, e.target.value)} className="rounded-md px-3 py-2" style={box} />
          ) : (
            <input type="text" value={answers[x.key] ?? ''} onChange={(e) => onChange(x.key, e.target.value)} className="rounded-md px-3 py-2" style={box} />
          )}
        </label>
      ))}
    </section>
  )
}

/** STUCK?: pick a way through. The pick itself tells Wendell. */
function Stuck({ step, slug, token }: { step: IntakeStep; slug: string; token: string }) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<StuckChoice | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const pick = (c: StuckChoice) => {
    setChoice(c)
    setMsg(null)
    start(async () => {
      const res = await pressStuck(slug, token, step.id, c)
      if (!res.ok) {
        setMsg(res.error)
        return
      }
      setEventId(res.eventId)
      setMsg(res.emailed ? 'Wendell has been told which step you are on.' : 'Saved. (Email is not set up on this server, so Wendell was not emailed.)')
    })
  }

  const share = () => {
    if (!eventId || !choice || choice === 'book') return
    const text = STUCK_PROMPTS[choice]
      .map((p) => (notes[p.key]?.trim() ? `${p.label}\n${notes[p.key].trim()}` : ''))
      .filter(Boolean)
      .join('\n\n')
    start(async () => {
      const res = await shareStuckReflection(slug, token, eventId, step.id, text)
      setMsg(res.ok ? (res.emailed ? 'Sent to Wendell.' : 'Saved, but email is not set up on this server.') : res.error)
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid var(--bars-fire-gem)', color: 'var(--bars-fire-gem)' }}>
        STUCK?
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center p-3 sm:items-center" style={{ background: 'rgba(0,0,0,0.55)' }} role="dialog" aria-label="Stuck on this step">
      <div className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-3 overflow-y-auto rounded-lg p-4" style={{ background: 'var(--bars-bg-base)', border: '1px solid var(--bars-line)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Stuck on &ldquo;{step.title}&rdquo;? Pick a way through.</h3>
          <button type="button" onClick={() => setOpen(false)} className="text-sm underline" style={{ color: muted }}>
            Close
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {STUCK_CHOICES.map((c) => {
            const style = { ...card, borderColor: choice === c.key ? gold : 'var(--bars-line)' }
            const inner = (
              <>
                <span className="font-semibold">{c.label}</span>
                <span className="block" style={{ color: muted }}>{c.blurb}</span>
              </>
            )
            // The calendar opens from the tap itself, so no popup blocker stops it.
            return c.key === 'book' ? (
              <a key={c.key} href={BOOK_WENDELL_URL} target="_blank" rel="noopener noreferrer" onClick={() => pick(c.key)} className="rounded-md px-3 py-2 text-sm" style={style}>
                {inner}
              </a>
            ) : (
              <button key={c.key} type="button" disabled={pending} onClick={() => pick(c.key)} className="rounded-md px-3 py-2 text-left text-sm disabled:opacity-60" style={style}>
                {inner}
              </button>
            )
          })}
        </div>
        {choice && choice !== 'book' && (
          <div className="flex flex-col gap-3">
            {STUCK_PROMPTS[choice].map((p) => (
              <label key={p.key} className="flex flex-col gap-1 text-sm">
                <span>{p.label}</span>
                <textarea rows={2} value={notes[p.key] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [p.key]: e.target.value }))} className="rounded-md px-3 py-2" style={box} />
              </label>
            ))}
            <p className="text-xs" style={{ color: muted }}>What you write here stays with you unless you send it.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold" style={{ background: gold, color: 'var(--bars-bg-base)' }}>
                Back to the step
              </button>
              <button type="button" disabled={pending || !eventId || !Object.values(notes).some((v) => v.trim())} onClick={share} className="rounded-md px-3 py-2 text-sm disabled:opacity-50" style={card}>
                Send this to Wendell
              </button>
            </div>
          </div>
        )}
        {choice === 'book' && <p className="text-sm">His calendar opened in a new tab. Pick any time that works.</p>}
        {msg && (
          <p className="text-sm" role="status" style={{ color: gold }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}

function Draft({
  platform,
  answers,
  fields,
  onOther,
  otherName,
}: {
  platform: IntakePlatform
  answers: Record<string, string>
  fields: HostedCampaignFields
  onOther: () => void
  otherName: string
}) {
  const sections = buildDraft(platform, answers, fields)
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => setCopied(key), () => setCopied(null))
  }
  const all = sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n---\n\n')
  return (
    <section className="flex flex-col gap-4">
      <p style={{ color: muted }}>
        Built from your answers, in the order the {platform === 'gofundme' ? 'GoFundMe' : 'Patreon'} form asks for them. Anything in
        [brackets] is still open. Copy a section into the form, or let Wendell build the page from this.
      </p>
      <button type="button" onClick={() => copy('all', all)} className="self-start rounded-md px-3 py-2 text-sm font-semibold" style={{ background: gold, color: 'var(--bars-bg-base)' }}>
        {copied === 'all' ? 'Copied' : 'Copy the whole draft'}
      </button>
      {sections.map((s) => (
        <article key={s.heading} className="flex flex-col gap-2 rounded-lg p-3" style={card}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{s.heading}</h3>
            <button type="button" onClick={() => copy(s.heading, s.body)} className="text-xs underline" style={{ color: muted }}>
              {copied === s.heading ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{s.body}</p>
        </article>
      ))}
      <button type="button" onClick={onOther} className="self-start text-sm underline" style={{ color: gold }}>
        Now the {otherName} steps
      </button>
    </section>
  )
}

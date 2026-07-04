'use client'

/**
 * LeadWorkspace — the per-lead workspace (decision A/B). Set goals, curate matched
 * quests, edit actions + invite message, copy the warm link, and publish to the
 * collective. Spec: campaign-lead-forge Phase 6 handoff.
 */
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  addLeadQuest,
  publishLeadToCollective,
  removeLeadQuest,
  reorderLeadQuests,
  setLeadActions,
  setLeadGoals,
  setLeadMessage,
  transitionLead,
  unpublishLead,
  type LeadDetail,
} from '@/actions/campaign-leads'
import { LEAD_STATUS_META, LEAD_TRANSITIONS, type LeadStatus } from '@/lib/campaign-leads/types'
import { getDomainLabel } from '@/lib/allyship-domains'

type Quest = { id: string; title: string; domain: string | null }
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const PURPLE = '#8b5cf6'
const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[14px] text-[#f4f2ec] placeholder:text-[#6b6862] focus:border-[#8b5cf6] focus:outline-none'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-[#a09e98]'

function SaveChip({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  const map = {
    saving: { t: 'Saving…', c: '#a09e98' },
    saved: { t: 'Saved ✓', c: '#46b06f' },
    error: { t: 'Couldn’t save — retry', c: '#e0533d' },
  } as const
  const m = map[state]
  return <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: m.c }}>{m.t}</span>
}

export function LeadWorkspace({
  lead,
  basePath,
  questPool,
}: {
  lead: LeadDetail
  basePath: string
  questPool: Quest[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [collective, setCollective] = useState(lead.collective)
  const [quests, setQuests] = useState<Quest[]>(lead.quests)
  const [goals, setGoals] = useState(lead.goals ?? '')
  const [actionsText, setActionsText] = useState(lead.actions.join('\n'))
  const [message, setMessage] = useState(lead.message ?? '')

  const [goalsSave, setGoalsSave] = useState<SaveState>('idle')
  const [actionsSave, setActionsSave] = useState<SaveState>('idle')
  const [messageSave, setMessageSave] = useState<SaveState>('idle')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Relative path — SSR-safe, no window read at render (avoids a hydration mismatch).
  // The absolute URL for the clipboard is built at copy-time from window.location.
  const warmPath = lead.inviteToken ? `/invite/${lead.inviteToken}/welcome` : ''

  const orderedPool = useMemo(() => {
    const chosen = new Set(quests.map((q) => q.id))
    const avail = questPool.filter((q) => !chosen.has(q.id))
    if (!lead.domain) return avail
    return [...avail.filter((q) => q.domain === lead.domain), ...avail.filter((q) => q.domain !== lead.domain)]
  }, [questPool, quests, lead.domain])

  /** Run a mutation; on failure surface the error and undo the optimistic change. */
  function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    opts?: { onOk?: () => void; setSave?: (s: SaveState) => void; revert?: () => void },
  ) {
    setErr(null)
    opts?.setSave?.('saving')
    startTransition(async () => {
      const res = await fn()
      if (res.ok) {
        opts?.setSave?.('saved')
        opts?.onOk?.()
        if (opts?.setSave) setTimeout(() => opts.setSave!('idle'), 1400)
      } else {
        opts?.setSave?.('error')
        setErr(res.error ?? 'Something went wrong.')
        opts?.revert?.()
      }
    })
  }

  // ── quests (optimistic; reverted on failure) ──
  function addQuest(q: Quest) {
    const prev = quests
    setQuests([...prev, q])
    setPickerOpen(false)
    run(() => addLeadQuest(lead.id, q.id), { revert: () => setQuests(prev) })
  }
  function removeQuest(id: string) {
    const prev = quests
    setQuests(prev.filter((q) => q.id !== id))
    run(() => removeLeadQuest(lead.id, id), { revert: () => setQuests(prev) })
  }
  function moveQuest(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= quests.length) return
    const prev = quests
    const next = [...quests]
    ;[next[idx], next[j]] = [next[j]!, next[idx]!]
    setQuests(next)
    run(() => reorderLeadQuests(lead.id, next.map((q) => q.id)), { revert: () => setQuests(prev) })
  }

  // ── status ──
  function transition(to: LeadStatus) {
    const prev = status
    setStatus(to)
    run(() => transitionLead(lead.id, to), { onOk: () => router.refresh(), revert: () => setStatus(prev) })
  }

  // ── publish ──
  function togglePublish() {
    const prev = collective
    const next = !collective
    setCollective(next)
    run(() => (next ? publishLeadToCollective(lead.id) : unpublishLead(lead.id)), {
      onOk: () => router.refresh(),
      revert: () => setCollective(prev),
    })
  }

  async function copyLink() {
    if (!warmPath) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${warmPath}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* link is visible for manual copy */
    }
  }

  const meta = LEAD_STATUS_META[status]
  const nextStates = LEAD_TRANSITIONS[status]

  return (
    <main
      className="min-h-screen px-4 pb-24 pt-8 sm:px-6"
      style={{ background: 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href={basePath} className="text-[13px] text-[#a09e98]">‹ Your list</Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `${meta.color}22`, color: meta.color }}>
              {meta.label}
            </span>
            {nextStates.map((to) => (
              <button
                key={to}
                onClick={() => transition(to)}
                className="rounded-lg border px-2 py-1 text-[11px] font-semibold"
                style={{ borderColor: `${LEAD_STATUS_META[to].color}55`, color: LEAD_STATUS_META[to].color }}
              >
                → {LEAD_STATUS_META[to].label}
              </button>
            ))}
          </div>
        </div>

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full text-[16px] font-bold" style={{ background: '#46b06f', color: '#12100b' }}>
              {(lead.name?.trim()?.[0] ?? '✦').toUpperCase()}
            </span>
            <div>
              <h1 className="text-[22px] font-bold text-[#f4f2ec]">{lead.name || 'Unnamed lead'}</h1>
              <p className="text-[12px] text-[#a09e98]">
                {[lead.domain ? getDomainLabel(lead.domain) : null, lead.channel, lead.contact].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {warmPath && (
              <a href={warmPath} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-[#f4f2ec]">
                Preview as invitee ↗
              </a>
            )}
            <button onClick={copyLink} disabled={!warmPath} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40" style={{ background: PURPLE }}>
              {copied ? 'Copied ✓' : 'Copy warm link'}
            </button>
          </div>
        </header>

        {err && <p className="text-[13px] text-red-400">{err}</p>}

        {/* Goals */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Your goals for {lead.name?.split(' ')[0] || 'them'}</span>
            <SaveChip state={goalsSave} />
          </div>
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            onBlur={() => run(() => setLeadGoals(lead.id, goals), { setSave: setGoalsSave })}
            placeholder="What do you want them to accomplish? Write it like you’d say it to them."
          />
        </section>

        {/* Matched quests */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Matched quests · {quests.length}</span>
          </div>
          {quests.length === 0 ? (
            <p className="rounded-xl border border-white/[0.07] p-4 text-[13px] text-[#6b6862]">
              No quests matched yet. Add a few so they know exactly how they’re helping.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {quests.map((q, i) => (
                <li key={q.id} className="flex items-center gap-2 rounded-xl border p-3 text-[14px]" style={{ borderColor: 'rgba(139,92,246,0.28)', background: 'rgba(139,92,246,0.06)', color: '#e8e4f6' }}>
                  <span className="flex flex-col leading-none text-[#6b6862]">
                    <button onClick={() => moveQuest(i, -1)} disabled={i === 0} className="disabled:opacity-30" aria-label="Move up">▲</button>
                    <button onClick={() => moveQuest(i, 1)} disabled={i === quests.length - 1} className="disabled:opacity-30" aria-label="Move down">▼</button>
                  </span>
                  <span className="flex-1">✦ {q.title}</span>
                  {q.domain && <span className="text-[10px] uppercase text-[#6b6862]">{getDomainLabel(q.domain)}</span>}
                  <button onClick={() => removeQuest(q.id)} className="text-[#a09e98]" aria-label="Remove quest">×</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPickerOpen((o) => !o)} className="rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-[#f4f2ec]">
              {pickerOpen ? 'Close' : '+ Add from campaign quests'}
            </button>
            <Link
              href={`${basePath.replace(/\/leads$/, '/quests')}/new?forLead=${lead.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-[#c4b5fd]"
            >
              ✦ Author new…
            </Link>
          </div>
          {pickerOpen && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
              {orderedPool.length === 0 ? (
                <p className="px-1 py-2 text-[12px] text-[#6b6862]">No more quests in the pool.</p>
              ) : (
                orderedPool.map((q) => (
                  <button key={q.id} onClick={() => addQuest(q)} className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[#e6e4de] hover:bg-white/[0.04]">
                    <span className="text-[#8b5cf6]">＋</span>
                    <span>{q.title}{q.domain && <span className="ml-2 text-[11px] text-[#6b6862]">{getDomainLabel(q.domain)}</span>}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Actions they should take · one per line</span>
            <SaveChip state={actionsSave} />
          </div>
          <textarea
            className={`${inputCls} min-h-[64px]`}
            value={actionsText}
            onChange={(e) => setActionsText(e.target.value)}
            onBlur={() => run(() => setLeadActions(lead.id, actionsText.split('\n')), { setSave: setActionsSave })}
            placeholder={'DM three friends about the launch\nBring a plus-one to the party'}
          />
        </section>

        {/* Message */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Personal invite message</span>
            <SaveChip state={messageSave} />
          </div>
          <textarea
            className={`${inputCls} min-h-[64px]`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => run(() => setLeadMessage(lead.id, message), { setSave: setMessageSave })}
            placeholder="A note that greets them when they open the link."
          />
        </section>

        {/* Publish */}
        <section
          className="flex items-center justify-between gap-3 rounded-2xl border p-4"
          style={{ background: 'rgba(111,120,207,0.06)', borderColor: 'rgba(111,120,207,0.3)' }}
        >
          <div style={{ maxWidth: '74%' }}>
            <p className="text-[15px] font-bold text-[#f4f2ec]">Publish to the collective</p>
            <p className="mt-0.5 text-[12px] text-[#b4afa3]">
              Let other stewards of this campaign invite {lead.name?.split(' ')[0] || 'them'} too. They
              stay yours; others get a copy to adopt. Your notes never travel.
            </p>
          </div>
          <button
            onClick={togglePublish}
            role="switch"
            aria-checked={collective}
            aria-label="Publish to the collective"
            className="relative h-6 w-11 flex-none rounded-full transition-colors"
            style={{ background: collective ? 'rgba(111,120,207,0.9)' : 'rgba(255,255,255,0.16)' }}
          >
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: collective ? '22px' : '2px' }} />
          </button>
        </section>
      </div>
    </main>
  )
}

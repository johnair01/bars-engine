'use client'

/**
 * QuestComposer — aim the three lenses, watch the seed compose, AI-draft (decision C
 * default) or assemble deterministically, edit, save to the campaign pool.
 * Spec: campaign-lead-forge Phase 7.
 */
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { draftAlignedQuest, saveAlignedQuest } from '@/actions/quest-studio'
import { addLeadQuest } from '@/actions/campaign-leads'
import { composeAlignmentSeed, assembleAlignedQuest } from '@/lib/campaign-leads/quest-alignment'
import { ALLYSHIP_DOMAINS, getDomainLabel, type AllyshipDomainKey } from '@/lib/allyship-domains'
import { ALLYSHIP_MYTHS } from '@/lib/allyship-myths/myths'
import { SUPERPOWERS, type Superpower, type SuperpowerOrientation } from '@/lib/superpowers/types'
import { GAME_MASTER_FACES, FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'

const PURPLE = '#8b5cf6'
const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[14px] text-[#f4f2ec] placeholder:text-[#6b6862] focus:border-[#8b5cf6] focus:outline-none'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-[#a09e98]'

export function QuestComposer({
  campaignRef,
  basePath,
  kotterStage,
  forLead,
}: {
  campaignRef: string
  basePath: string
  kotterStage: number
  forLead: string | null
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [domain, setDomain] = useState<AllyshipDomainKey | ''>('')
  const [mythId, setMythId] = useState('')
  const [superpower, setSuperpower] = useState<Superpower | ''>('')
  const [orientation, setOrientation] = useState<SuperpowerOrientation>('external')
  const [gmFace, setGmFace] = useState<GameMasterFace | ''>('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [alignedAction, setAlignedAction] = useState('')
  const [drafted, setDrafted] = useState(false)
  const [aiUsed, setAiUsed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<'ai' | 'assemble' | 'save' | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const seed = useMemo(
    () =>
      composeAlignmentSeed({
        domain: domain || null,
        mythId: mythId || null,
        superpower: superpower || null,
        orientation: superpower ? orientation : null,
        gmFace: gmFace || null,
        kotterStage,
      }),
    [domain, mythId, superpower, orientation, gmFace, kotterStage],
  )

  function applyDraft(d: { title: string; description: string; alignedAction: string }, ai: boolean | null) {
    setTitle(d.title)
    setDescription(d.description)
    setAlignedAction(d.alignedAction)
    setDrafted(true)
    setAiUsed(ai)
  }

  function assembleLocal() {
    setErr(null)
    applyDraft(assembleAlignedQuest(seed), false)
  }

  function draftAi() {
    setErr(null)
    setBusy('ai')
    startTransition(async () => {
      const res = await draftAlignedQuest({
        campaignRef,
        domain: domain || null,
        mythId: mythId || null,
        superpower: superpower || null,
        orientation: superpower ? orientation : null,
        gmFace: gmFace || null,
      })
      setBusy(null)
      if (res.ok) applyDraft(res.draft, res.aiUsed)
      else setErr(res.error)
    })
  }

  function save() {
    setErr(null)
    setBusy('save')
    startTransition(async () => {
      const res = await saveAlignedQuest({
        campaignRef,
        title: title.trim(),
        description: description.trim(),
        alignedAction: alignedAction.trim() || undefined,
        domain: domain || null,
        mythId: mythId || null,
        superpower: superpower || null,
        gmFace: gmFace || null,
      })
      if (!res.ok) {
        setBusy(null)
        setErr(res.error)
        return
      }
      if (forLead) {
        const attach = await addLeadQuest(forLead, res.questId)
        setBusy(null)
        if (attach.ok) {
          router.push(`${basePath.replace(/\/quests$/, '/leads')}/${forLead}`)
        } else {
          // The quest saved to the pool but couldn't be attached — say so; don't
          // bounce to the lead as if it worked.
          setErr(`Quest saved, but couldn’t add it to the lead (${attach.error}). Add it from the lead’s workspace.`)
        }
        return
      }
      setBusy(null)
      setSavedId(res.questId)
    })
  }

  if (savedId) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6">
        <p className="text-[15px] font-semibold text-emerald-300">Quest saved to the campaign.</p>
        <p className="mt-1 text-[13px] text-[#a09e98]">It’s now in the pool — pick it on any lead’s workspace.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => { setSavedId(null); setDrafted(false); setTitle(''); setDescription(''); setAlignedAction('') }} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white" style={{ background: PURPLE }}>
            + Author another
          </button>
          <Link href={basePath} className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-semibold text-[#f4f2ec]">
            View the library →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Lenses */}
      <section className="flex flex-col gap-3">
        <span className={labelCls}>Aim your lenses</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Domain</span>
            <select className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value as AllyshipDomainKey | '')}>
              <option value="">— none —</option>
              {ALLYSHIP_DOMAINS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Allyship myth</span>
            <select className={inputCls} value={mythId} onChange={(e) => setMythId(e.target.value)}>
              <option value="">— none —</option>
              {ALLYSHIP_MYTHS.map((m) => <option key={m.id} value={m.id}>{m.myth}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Superpower</span>
            <select className={inputCls} value={superpower} onChange={(e) => setSuperpower(e.target.value as Superpower | '')}>
              <option value="">— none —</option>
              {SUPERPOWERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Orientation {superpower ? '' : '(pick a superpower)'}</span>
            <select className={inputCls} value={orientation} onChange={(e) => setOrientation(e.target.value as SuperpowerOrientation)} disabled={!superpower}>
              <option value="external">external — world-facing</option>
              <option value="internal">internal — self-allyship</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelCls}>Game-Master face · opening move from Kotter stage {kotterStage}</span>
            <select className={inputCls} value={gmFace} onChange={(e) => setGmFace(e.target.value as GameMasterFace | '')}>
              <option value="">— none —</option>
              {GAME_MASTER_FACES.map((f) => <option key={f} value={f}>{FACE_META[f].label} — {FACE_META[f].mission}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Composed seed */}
      <section className="rounded-xl border border-dashed border-white/15 p-4" style={{ background: 'rgba(212,160,23,0.04)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#d4a017' }}>Composed seed · deterministic</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-[#b4afa3]">
          {seed.domain && <li><b className="text-[#e6e4de]">Domain →</b> {getDomainLabel(seed.domain)}</li>}
          {seed.mythReframe && <li><b className="text-[#e6e4de]">Reframe →</b> {seed.mythReframe}</li>}
          {seed.superpowerPrompt && <li><b className="text-[#e6e4de]">Superpower prompt →</b> {seed.superpowerPrompt}</li>}
          {seed.faceMoveTitle && <li><b style={{ color: '#e05a3d' }}>Face opening move →</b> {seed.faceMoveTitle}{seed.faceMoveAction ? ` — ${seed.faceMoveAction}` : ''}</li>}
          {!seed.domain && !seed.mythReframe && !seed.superpowerPrompt && !seed.faceMoveTitle && (
            <li className="text-[#6b6862]">Pick at least one lens to compose a seed.</li>
          )}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <button onClick={draftAi} disabled={busy !== null} className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: PURPLE }}>
          {busy === 'ai' ? 'Drafting…' : '✦ Draft with AI'}
        </button>
        <button onClick={assembleLocal} disabled={busy !== null} className="rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-semibold text-[#f4f2ec] disabled:opacity-50">
          Assemble without AI
        </button>
      </div>

      {err && <p className="text-[13px] text-red-400">{err}</p>}

      {/* Editable draft */}
      {drafted && (
        <section className="flex flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#b6a3f5' }}>Draft · editable</span>
            {aiUsed !== null && (
              <span className="text-[10px] uppercase tracking-wide text-[#6b6862]">{aiUsed ? 'AI-drafted' : 'assembled (no AI)'}</span>
            )}
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Title</span>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Description</span>
            <textarea className={`${inputCls} min-h-[96px]`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Aligned action</span>
            <input className={inputCls} value={alignedAction} onChange={(e) => setAlignedAction(e.target.value)} />
          </label>
          <button onClick={save} disabled={busy !== null || title.trim().length < 3 || description.trim().length < 1} className="mt-1 self-start rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: PURPLE }}>
            {busy === 'save' ? 'Saving…' : forLead ? 'Save & add to lead →' : 'Save to campaign'}
          </button>
        </section>
      )}
    </div>
  )
}

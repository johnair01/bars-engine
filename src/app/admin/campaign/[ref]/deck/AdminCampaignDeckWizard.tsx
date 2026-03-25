'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getWizardNode,
  finalizeIntake,
  defaultDraftIntake,
  serializeDeckIntake,
  parseDeckIntakeV1,
  materializeDeckFromIntake,
  type CampaignIntent,
  type DeckWizardStepId,
  type UrgencyTone,
} from '@/lib/admin-campaign-deck-intake'
import {
  applyDeckIntakeV1,
  activateStarterDeckCards,
  drawCampaignPeriodAsAdmin,
  type CampaignDeckAdminState,
} from '@/actions/admin-campaign-deck'
import { OWNER_GOAL_LINE_MAX_LEN } from '@/lib/campaign-deck-quests'
import { getGmFaceStageMovesForStage } from '@/lib/gm-face-stage-moves'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'

type ClientStep = DeckWizardStepId | 'done'

function BoldBody({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <div className="text-sm text-zinc-300 leading-relaxed space-y-3 whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\*\*([^*]+)\*\*$/)
        if (m) {
          return (
            <strong key={i} className="text-zinc-100 font-semibold">
              {m[1]}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}

function intentLabel(i: CampaignIntent): string {
  switch (i) {
    case 'GATHERING_RESOURCES':
      return 'Gather resources'
    case 'RAISE_AWARENESS':
      return 'Raise awareness'
    case 'DIRECT_ACTION':
      return 'Direct action'
    case 'SKILLFUL_ORGANIZING':
      return 'Skillful organizing'
    case 'MIXED':
      return 'Mixed domains'
  }
}

function toneLabel(t: UrgencyTone): string {
  switch (t) {
    case 'soft':
      return 'Soft'
    case 'sharp':
      return 'Sharp'
    case 'ceremonial':
      return 'Ceremonial'
  }
}

export function AdminCampaignDeckWizard({
  campaignRef,
  initial,
}: {
  campaignRef: string
  initial: CampaignDeckAdminState
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<ClientStep>('welcome')
  const [draftIntent, setDraftIntent] = useState<CampaignIntent>(
    () => defaultDraftIntake().campaignIntent,
  )
  const [draftTone, setDraftTone] = useState<UrgencyTone>(() => defaultDraftIntake().urgencyTone)
  const [draftDonation, setDraftDonation] = useState(() => defaultDraftIntake().includeDonationSpoke)
  const [draftOwnerGoalLine, setDraftOwnerGoalLine] = useState('')
  const [draftGmFaceMoveId, setDraftGmFaceMoveId] = useState<string>('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const draftIntake = useMemo(
    () =>
      finalizeIntake({
        campaignIntent: draftIntent,
        urgencyTone: draftTone,
        includeDonationSpoke: draftDonation,
        ownerGoalLine: draftOwnerGoalLine,
        gmFaceMoveId: draftGmFaceMoveId.trim() || null,
      }),
    [draftIntent, draftTone, draftDonation, draftOwnerGoalLine, draftGmFaceMoveId],
  )

  const stage1FaceMoves = useMemo(() => getGmFaceStageMovesForStage(1), [])

  const previewSpecs = useMemo(() => materializeDeckFromIntake(draftIntake), [draftIntake])

  function applyChoice(
    patch: Partial<Pick<typeof draftIntake, 'campaignIntent' | 'urgencyTone' | 'includeDonationSpoke'>>,
    next: DeckWizardStepId,
  ) {
    if (patch.campaignIntent != null) setDraftIntent(patch.campaignIntent)
    if (patch.urgencyTone != null) setDraftTone(patch.urgencyTone)
    if (patch.includeDonationSpoke != null) setDraftDonation(patch.includeDonationSpoke)
    setStep(next)
    setActionError(null)
  }

  function handleGenerateDraft() {
    setActionError(null)
    startTransition(async () => {
      const res = await applyDeckIntakeV1(campaignRef, draftIntake)
      if ('error' in res) {
        setActionError(res.error)
        return
      }
      setStep('done')
      router.refresh()
    })
  }

  function handleActivate() {
    setActionError(null)
    startTransition(async () => {
      const res = await activateStarterDeckCards(campaignRef)
      if ('error' in res) {
        setActionError(res.error)
        return
      }
      router.refresh()
    })
  }

  function handleDrawPeriod() {
    setActionError(null)
    startTransition(async () => {
      const res = await drawCampaignPeriodAsAdmin(campaignRef)
      if ('error' in res) {
        setActionError(res.error)
        return
      }
      router.refresh()
    })
  }

  function handleImportJson() {
    setImportError(null)
    try {
      const raw = JSON.parse(importText) as unknown
      const parsed = parseDeckIntakeV1(raw)
      if (!parsed) {
        setImportError('Not valid DeckIntakeV1 (check v, intent, tone, donation flag).')
        return
      }
      setDraftIntent(parsed.campaignIntent)
      setDraftTone(parsed.urgencyTone)
      setDraftDonation(parsed.includeDonationSpoke)
      setDraftOwnerGoalLine(parsed.ownerGoalLine ?? '')
      setDraftGmFaceMoveId(parsed.gmFaceMoveId ?? '')
      setStep('review')
    } catch {
      setImportError('Invalid JSON.')
    }
  }

  if (step === 'done') {
    const intakeJson =
      initial.instance?.deckAuthoringIntake != null
        ? JSON.stringify(initial.instance.deckAuthoringIntake, null, 2)
        : serializeDeckIntake({ ...draftIntake, appliedAt: new Date().toISOString() })

    return (
      <div className="rounded-2xl border border-purple-800/50 bg-zinc-950/80 p-6 space-y-6 max-w-2xl">
        <h2 className="text-lg font-bold text-white">Deck drafted</h2>
        <p className="text-sm text-zinc-400">
          Eight cards (hexagrams 1–8) and matching <strong className="text-zinc-200">Raise the urgency</strong>{' '}
          quests are in <strong className="text-zinc-200">draft</strong> (cards). Activate the cards, then draw a
          period so portals appear on the hub.
        </p>
        {actionError && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {actionError}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleActivate}
            className="px-4 py-2 rounded-lg bg-emerald-900/40 border border-emerald-700/50 text-emerald-200 text-sm font-medium hover:bg-emerald-900/60 disabled:opacity-50"
          >
            Activate starter cards (1–8)
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDrawPeriod}
            className="px-4 py-2 rounded-lg bg-purple-900/40 border border-purple-700/50 text-purple-200 text-sm font-medium hover:bg-purple-900/60 disabled:opacity-50"
          >
            Draw new period (8 portals)
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Reproducible intake JSON</p>
          <pre className="text-xs text-zinc-400 bg-black/60 border border-zinc-800 rounded-lg p-3 overflow-x-auto max-h-48">
            {intakeJson}
          </pre>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(intakeJson)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Copy to clipboard
          </button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
            className="text-amber-400/90 hover:text-amber-300"
          >
            Open campaign hub →
          </Link>
          <Link href={`/admin/campaign/${encodeURIComponent(campaignRef)}/author`} className="text-zinc-500 hover:text-zinc-300">
            Campaign author →
          </Link>
          <button
            type="button"
            onClick={() => {
              setStep('welcome')
              setActionError(null)
              setDraftOwnerGoalLine('')
              setDraftGmFaceMoveId('')
            }}
            className="text-zinc-500 hover:text-zinc-300"
          >
            Run wizard again
          </button>
        </div>
      </div>
    )
  }

  if (step === 'owner_goal') {
    const ogNode = getWizardNode('owner_goal')!
    return (
      <div className="rounded-2xl border border-purple-800/50 bg-zinc-950/80 p-6 space-y-6 max-w-2xl">
        <p className="text-[10px] uppercase tracking-widest text-purple-400/80">CYOA · Campaign deck</p>
        <h2 className="text-xl font-bold text-white tracking-tight">{ogNode.title}</h2>
        <BoldBody text={ogNode.body} />
        <textarea
          value={draftOwnerGoalLine}
          onChange={(e) => setDraftOwnerGoalLine(e.target.value.slice(0, OWNER_GOAL_LINE_MAX_LEN))}
          rows={4}
          maxLength={OWNER_GOAL_LINE_MAX_LEN}
          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200"
          placeholder="Optional: one sentence from the campaign owner…"
        />
        <p className="text-xs text-zinc-500 tabular-nums">
          {draftOwnerGoalLine.length}/{OWNER_GOAL_LINE_MAX_LEN}
        </p>
        {actionError && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {actionError}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setDraftOwnerGoalLine('')
              setStep('review')
              setActionError(null)
            }}
            className="text-left px-4 py-3 rounded-xl border border-zinc-700/80 bg-zinc-900/50 text-zinc-300 text-sm hover:border-zinc-500 disabled:opacity-50"
          >
            Skip — use templates only
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setStep('review')
              setActionError(null)
            }}
            className="text-left px-4 py-3 rounded-xl border border-purple-800/50 bg-zinc-900/50 text-zinc-200 text-sm hover:border-purple-500 hover:bg-purple-950/20 disabled:opacity-50"
          >
            Continue →
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setStep('donation')
              setActionError(null)
            }}
            className="text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/50 text-zinc-500 text-sm hover:text-zinc-300 disabled:opacity-50"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  if (step === 'import') {
    return (
      <div className="rounded-2xl border border-purple-800/50 bg-zinc-950/80 p-6 space-y-4 max-w-2xl">
        <h2 className="text-lg font-bold text-white">Import intake JSON</h2>
        <BoldBody text={getWizardNode('import')?.body ?? ''} />
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          className="w-full bg-black/60 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 font-mono"
          placeholder='{"v":1,"campaignIntent":"GATHERING_RESOURCES","urgencyTone":"soft","includeDonationSpoke":true}'
        />
        {importError && <p className="text-sm text-red-400">{importError}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStep('welcome')
              setImportError(null)
            }}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleImportJson}
            className="px-4 py-2 rounded-lg bg-purple-900/40 border border-purple-700/50 text-purple-200 text-sm font-medium"
          >
            Parse & review →
          </button>
        </div>
      </div>
    )
  }

  const node =
    getWizardNode(step as DeckWizardStepId) ?? getWizardNode('welcome')!

  const isReview = step === 'review'

  return (
    <div className="rounded-2xl border border-purple-800/50 bg-zinc-950/80 p-6 space-y-6 max-w-2xl">
      <p className="text-[10px] uppercase tracking-widest text-purple-400/80">CYOA · Campaign deck</p>
      <h2 className="text-xl font-bold text-white tracking-tight">{node.title}</h2>
      {isReview ? (
        <div className="space-y-4 text-sm text-zinc-300">
          <p>
            You are about to write these choices into the database as{' '}
            <strong className="text-zinc-100">eight draft cards</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Intent: {intentLabel(draftIntent)}</li>
            <li>Urgency tone: {toneLabel(draftTone)}</li>
            <li>Donation spoke: {draftDonation ? 'Yes (hexagram 8)' : 'No'}</li>
            {draftIntake.ownerGoalLine ? (
              <li>Owner line: {draftIntake.ownerGoalLine}</li>
            ) : (
              <li>Owner line: (templates only)</li>
            )}
            <li>
              GM face move (stage 1 urgency):{' '}
              {draftGmFaceMoveId.trim() ? (
                <code className="text-zinc-300">{draftGmFaceMoveId.trim()}</code>
              ) : (
                <span className="text-zinc-500">template default</span>
              )}
            </li>
          </ul>
          <div className="space-y-2 border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/30">
            <p className="text-xs text-zinc-500">
              Optional: one <strong className="text-zinc-400">K1_*</strong> move seeds all eight “Raise the urgency”
              quests (hexagram copy still varies per card).
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDraftGmFaceMoveId('')}
                className={`text-[10px] px-2 py-1 rounded border ${!draftGmFaceMoveId.trim() ? 'border-amber-600/50 bg-amber-950/30 text-amber-200' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
              >
                None
              </button>
              {stage1FaceMoves.map((m) => {
                const meta = FACE_META[m.face as GameMasterFace]
                const on = draftGmFaceMoveId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    title={m.title}
                    onClick={() => setDraftGmFaceMoveId(on ? '' : m.id)}
                    className={`text-[10px] px-2 py-1 rounded border max-w-[10rem] truncate ${on ? 'border-amber-600/50 bg-amber-950/30 text-amber-100' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                  >
                    <span className={meta?.color ?? ''}>{meta?.label ?? m.face}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer text-zinc-400">Preview card themes</summary>
            <ul className="mt-2 space-y-1 font-mono text-zinc-500">
              {previewSpecs.map((s) => (
                <li key={s.hexagramId}>
                  {s.hexagramId}: {s.theme} · {s.domain ?? '—'}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        <BoldBody text={node.body} />
      )}
      {actionError && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{actionError}</p>
      )}
      <div className="flex flex-col gap-2">
        {!isReview &&
          node.choices.map((c, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isPending}
              onClick={() => applyChoice(c.patch, c.next)}
              className="text-left px-4 py-3 rounded-xl border border-purple-800/50 bg-zinc-900/50 text-zinc-200 text-sm hover:border-purple-500 hover:bg-purple-950/20 transition-colors disabled:opacity-50"
            >
              {c.label}
            </button>
          ))}
        {isReview && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={handleGenerateDraft}
              className="text-left px-4 py-3 rounded-xl border border-purple-700/60 bg-purple-950/30 text-purple-100 text-sm hover:border-purple-500 hover:bg-purple-900/30 transition-colors disabled:opacity-50 font-medium"
            >
              Generate draft deck (hexagrams 1–8) →
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setStep('owner_goal')
                setActionError(null)
              }}
              className="text-left px-4 py-3 rounded-xl border border-zinc-700/80 bg-zinc-900/40 text-zinc-400 text-sm hover:border-zinc-500 disabled:opacity-50"
            >
              ← Go back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

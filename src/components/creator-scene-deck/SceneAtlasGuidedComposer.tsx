'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { SceneGridCardView } from '@/lib/creator-scene-grid-deck/load-deck-view'
import { createCustomBar } from '@/actions/create-bar'
import {
  loadSceneAtlasGuidedDraft,
  saveSceneAtlasGuidedDraft,
} from '@/actions/scene-atlas-guided-draft'
import {
  buildGuidedSceneAtlasDescription,
  sceneAtlasDefaultTags,
  sceneAtlasGuidedTitle,
} from '@/lib/creator-scene-grid-deck/bar-template'

const ANSWER_STEPS = 5
const REVIEW_STEP = 6

type Props = {
  instanceId: string
  instanceSlug: string
  card: SceneGridCardView
  onSuccess: () => void
  onBack: () => void
}

export function SceneAtlasGuidedComposer({ instanceId, instanceSlug, card, onSuccess, onBack }: Props) {
  const [step, setStep] = useState(1)
  const [intention, setIntention] = useState('')
  const [doneLooks, setDoneLooks] = useState('')
  const [careNote, setCareNote] = useState('')
  const [stakeholders, setStakeholders] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewDescription, setReviewDescription] = useState('')
  const [tags, setTags] = useState(() => sceneAtlasDefaultTags(card.suit).join(', '))
  const [draftLoaded, setDraftLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [state, formAction, pending] = useActionState(createCustomBar, null)

  const answersPayload = {
    intention,
    done_looks: doneLooks,
    care_note: careNote,
    stakeholders,
    next_action: nextAction,
  }

  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void saveSceneAtlasGuidedDraft(instanceId, card.id, {
        currentStep: step,
        answers: answersPayload,
        reviewTitle,
        reviewDescription,
        tagsLine: tags,
      })
    }, 500)
  }

  useEffect(() => {
    if (state?.success) onSuccess()
  }, [state?.success, onSuccess])

  useEffect(() => {
    let cancelled = false
    setDraftLoaded(false)
    setStep(1)
    setIntention('')
    setDoneLooks('')
    setCareNote('')
    setStakeholders('')
    setNextAction('')
    setReviewTitle('')
    setReviewDescription('')
    setTags(sceneAtlasDefaultTags(card.suit).join(', '))

    ;(async () => {
      const r = await loadSceneAtlasGuidedDraft(instanceId, card.id)
      if (cancelled) return
      if (!r.ok || !r.draft) {
        setDraftLoaded(true)
        return
      }
      const d = r.draft
      setIntention(d.answers.intention ?? '')
      setDoneLooks(d.answers.done_looks ?? '')
      setCareNote(d.answers.care_note ?? '')
      setStakeholders(d.answers.stakeholders ?? '')
      setNextAction(d.answers.next_action ?? '')
      if (d.reviewTitle) setReviewTitle(d.reviewTitle)
      if (d.reviewDescription) setReviewDescription(d.reviewDescription)
      if (d.tagsLine) setTags(d.tagsLine)
      setStep(Math.min(Math.max(d.currentStep, 1), REVIEW_STEP))
      setDraftLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [instanceId, card.id, card.suit])

  useEffect(() => {
    if (!draftLoaded) return
    scheduleSave()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced bundle
  }, [
    draftLoaded,
    step,
    intention,
    doneLooks,
    careNote,
    stakeholders,
    nextAction,
    reviewTitle,
    reviewDescription,
    tags,
    instanceId,
    card.id,
  ])

  const goReview = () => {
    const title = sceneAtlasGuidedTitle(intention, card.displayTitle)
    const description = buildGuidedSceneAtlasDescription(card, {
      intention,
      doneLooks,
      careNote,
      stakeholders,
      nextAction,
    })
    setReviewTitle(title)
    setReviewDescription(description)
    setStep(REVIEW_STEP)
    void saveSceneAtlasGuidedDraft(instanceId, card.id, {
      currentStep: REVIEW_STEP,
      answers: answersPayload,
      reviewTitle: title,
      reviewDescription: description,
      tagsLine: tags,
    })
  }

  const canNext =
    step === 1
      ? intention.trim().length >= 3
      : step === 2
        ? doneLooks.trim().length >= 3
        : step >= 3 && step <= ANSWER_STEPS

  const answerStepLabel = step <= ANSWER_STEPS ? Math.min(step, ANSWER_STEPS) : ANSWER_STEPS

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (step <= 1 ? onBack() : setStep((s) => Math.max(1, s - 1)))}
          className="text-xs text-zinc-500 hover:text-zinc-300 min-h-11 px-1"
        >
          ← {step <= 1 ? 'Choose another path' : 'Back'}
        </button>
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 text-right">
          {step === REVIEW_STEP ? (
            <>Guided · review</>
          ) : (
            <>
              Guided · step {answerStepLabel} / {ANSWER_STEPS}
            </>
          )}
          {!draftLoaded ? (
            <span className="block text-zinc-700 normal-case tracking-normal">Loading draft…</span>
          ) : (
            <span className="block text-zinc-700 normal-case tracking-normal">Draft saves as you go</span>
          )}
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-200">What are you holding or wanting in this cell?</p>
          <p className="text-xs text-zinc-500">A few honest lines — this becomes the heart of your BAR.</p>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            rows={5}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 min-h-[7rem]"
            placeholder="e.g. I want clarity on how to open this scene safely…"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-200">What would &ldquo;enough&rdquo; or &ldquo;done&rdquo; look like?</p>
          <p className="text-xs text-zinc-500">Observable is better than perfect.</p>
          <textarea
            value={doneLooks}
            onChange={(e) => setDoneLooks(e.target.value)}
            rows={5}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 min-h-[7rem]"
            placeholder="e.g. I’ve named the constraint and one next step…"
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-200">Boundary, care, or logistics? (optional)</p>
          <p className="text-xs text-zinc-500">Skip if nothing extra belongs here.</p>
          <textarea
            value={careNote}
            onChange={(e) => setCareNote(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 min-h-[6rem]"
            placeholder="Consent, time box, budget, ‘won’t do’…"
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-200">Who benefits or holds risk? (optional)</p>
          <p className="text-xs text-zinc-500">Partners, crew, future-you — name who this touches.</p>
          <textarea
            value={stakeholders}
            onChange={(e) => setStakeholders(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 min-h-[6rem]"
            placeholder="e.g. My co-star needs clarity on aftercare; I’m carrying budget risk…"
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-200">One concrete next step (optional)</p>
          <p className="text-xs text-zinc-500">Small enough to do without heroics.</p>
          <textarea
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 min-h-[6rem]"
            placeholder="e.g. Message X before Friday; block 20m on calendar…"
          />
        </div>
      )}

      {step >= 1 && step <= ANSWER_STEPS && (
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => (step === ANSWER_STEPS ? goReview() : canNext ? setStep((s) => s + 1) : undefined)}
            disabled={!canNext && step < ANSWER_STEPS}
            className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium disabled:opacity-40 disabled:pointer-events-none min-h-11"
          >
            {step === ANSWER_STEPS ? 'Review BAR' : 'Continue'}
          </button>
        </div>
      )}

      {step === REVIEW_STEP && (
        <form action={formAction} className="space-y-4 pt-2 border-t border-zinc-800">
          <input type="hidden" name="sceneGridInstanceId" value={instanceId} />
          <input type="hidden" name="sceneGridCardId" value={card.id} />
          <input type="hidden" name="sceneGridInstanceSlug" value={instanceSlug} />
          <input type="hidden" name="sceneGridSuit" value={card.suit} />
          <input type="hidden" name="sceneGridRank" value={String(card.rank)} />
          <input type="hidden" name="visibility" value="private" />
          <input type="hidden" name="inputType" value="textarea" />
          <input type="hidden" name="inputLabel" value="Reflection" />
          <input type="hidden" name="applyFirstAidLens" value="false" />

          <p className="text-sm text-zinc-300">Edit if you like — then save to this card.</p>

          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-500">Title</label>
            <input
              name="title"
              required
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-white min-h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-500">Description</label>
            <textarea
              name="description"
              required
              value={reviewDescription}
              onChange={(e) => setReviewDescription(e.target.value)}
              rows={12}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 font-mono text-xs leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-500">Tags</label>
            <input
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 min-h-11"
            />
          </div>

          {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
          {state && typeof state === 'object' && 'warning' in state && (state as { warning?: string | null }).warning ? (
            <p className="text-sm text-amber-300">{(state as { warning?: string | null }).warning}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(ANSWER_STEPS)}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 min-h-11"
            >
              ← Edit answers
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 min-h-11"
            >
              {pending ? 'Saving…' : 'Create & place on card'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

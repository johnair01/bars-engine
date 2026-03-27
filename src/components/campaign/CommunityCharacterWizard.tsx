'use client'
/**
 * CommunityCharacterWizard — campaign owner onboarding quest.
 *
 * 7 questions → deterministic prompt corpus → saved to Instance.
 * Framing is tuned to the owner's archetype + nation.
 *
 * Placement: /admin/campaign/[ref]/community-character
 */
import { useState } from 'react'
import { COMMUNITY_CHARACTER_PASSAGES, MIRROR_PASSAGE_TITLE, MIRROR_PASSAGE_SUBTEXT } from '@/lib/community-character/quest-passages'
import { buildCorpus } from '@/lib/community-character/build-corpus'
import { saveCommunityCharacterCorpus } from '@/actions/community-character'
import type { QuestAnswer, PassageContext, CommunityCharacterCorpus } from '@/lib/community-character/types'
import type { ElementKey } from '@/lib/ui/card-tokens'

type WizardStep =
  | { kind: 'question'; index: number }
  | { kind: 'mirror'; corpus: CommunityCharacterCorpus }
  | { kind: 'done' }

const ELEMENT_COLORS: Record<ElementKey, { border: string; text: string; bg: string; button: string }> = {
  wood:   { border: 'border-emerald-700/60', text: 'text-emerald-300', bg: 'bg-emerald-950/20', button: 'bg-emerald-800/70 hover:bg-emerald-700/80 text-emerald-50' },
  fire:   { border: 'border-red-700/60',     text: 'text-red-300',     bg: 'bg-red-950/20',     button: 'bg-red-800/70 hover:bg-red-700/80 text-red-50'         },
  water:  { border: 'border-blue-700/60',    text: 'text-blue-300',    bg: 'bg-blue-950/20',    button: 'bg-blue-800/70 hover:bg-blue-700/80 text-blue-50'       },
  metal:  { border: 'border-zinc-500/60',    text: 'text-zinc-300',    bg: 'bg-zinc-800/20',    button: 'bg-zinc-700/70 hover:bg-zinc-600/80 text-zinc-50'       },
  earth:  { border: 'border-amber-700/60',   text: 'text-amber-300',   bg: 'bg-amber-950/20',   button: 'bg-amber-800/70 hover:bg-amber-700/80 text-amber-50'    },
}

interface Props {
  instanceId: string
  archetypeKey: string
  archetypeLabel: string
  nationKey: string
  element: ElementKey
  /** If the corpus already exists, prefill for re-authoring. */
  existingCorpus?: CommunityCharacterCorpus | null
}

export function CommunityCharacterWizard({
  instanceId,
  archetypeKey,
  archetypeLabel,
  nationKey,
  element,
  existingCorpus,
}: Props) {
  const colors = ELEMENT_COLORS[element] ?? ELEMENT_COLORS.wood
  const ctx: PassageContext = { archetypeKey, archetypeLabel, nationKey, element }

  const [step, setStep] = useState<WizardStep>({ kind: 'question', index: 0 })
  const [answers, setAnswers] = useState<QuestAnswer[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(
    existingCorpus?.questCompletedAt ?? null,
  )

  function handleChoice(choiceId: string, choiceLabel: string, promptIds: string[]) {
    if (step.kind !== 'question') return
    const passage = COMMUNITY_CHARACTER_PASSAGES[step.index]
    const newAnswers = [
      ...answers.filter((a) => a.questionId !== passage.id),
      { questionId: passage.id, choiceId, choiceLabel, promptIds },
    ]
    setAnswers(newAnswers)

    const nextIndex = step.index + 1
    if (nextIndex < COMMUNITY_CHARACTER_PASSAGES.length) {
      setStep({ kind: 'question', index: nextIndex })
    } else {
      const corpus = buildCorpus(newAnswers, archetypeKey, nationKey)
      setStep({ kind: 'mirror', corpus })
    }
  }

  async function handleSave() {
    if (step.kind !== 'mirror') return
    setSaving(true)
    setSaveError(null)
    const result = await saveCommunityCharacterCorpus(instanceId, step.corpus)
    setSaving(false)
    if ('error' in result) {
      setSaveError(result.error)
    } else {
      setSavedAt(step.corpus.questCompletedAt)
      setStep({ kind: 'done' })
    }
  }

  function handleRestart() {
    setAnswers([])
    setSaveError(null)
    setStep({ kind: 'question', index: 0 })
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (step.kind === 'done') {
    return (
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 space-y-4`}>
        <p className={`text-[10px] uppercase tracking-widest ${colors.text}`}>
          Community character
        </p>
        <p className="text-sm text-zinc-200">
          Corpus saved.{' '}
          {savedAt && (
            <span className="text-zinc-500">
              Last authored {new Date(savedAt).toLocaleDateString()}
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Every invite bingo card created for events in this campaign will draw from your
          community character prompts.
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
        >
          Re-author corpus
        </button>
      </div>
    )
  }

  // ── Mirror screen ───────────────────────────────────────────────────────────
  if (step.kind === 'mirror') {
    const { corpus } = step
    return (
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 space-y-5`}>
        <div>
          <p className={`text-[10px] uppercase tracking-widest ${colors.text} mb-1`}>
            Community character
          </p>
          <h2 className="text-base font-semibold text-zinc-100">{MIRROR_PASSAGE_TITLE}</h2>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{MIRROR_PASSAGE_SUBTEXT}</p>
        </div>

        <ul className="space-y-2">
          {corpus.prompts.map((p) => (
            <li key={p.id} className="flex items-start gap-3">
              <span className={`mt-0.5 text-[10px] uppercase tracking-widest ${colors.text} shrink-0 w-20`}>
                {p.communityType}
              </span>
              <span className="text-sm text-zinc-200 leading-snug">{p.text}</span>
            </li>
          ))}
        </ul>

        {saveError && (
          <p className="text-xs text-red-400">{saveError}</p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${colors.button} transition-colors disabled:opacity-40`}
          >
            {saving ? 'Saving…' : 'Save corpus →'}
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  // ── Question screen ─────────────────────────────────────────────────────────
  const passage = COMMUNITY_CHARACTER_PASSAGES[step.index]
  const total = COMMUNITY_CHARACTER_PASSAGES.length
  const progressPct = Math.round((step.index / total) * 100)

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 space-y-5`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={`text-[10px] uppercase tracking-widest ${colors.text}`}>
          Community character — {step.index + 1} / {total}
        </p>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
          {archetypeLabel} · {nationKey}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.button.split(' ')[0]} transition-all duration-300`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Subtext (archetype framing) */}
      {passage.subtext && (
        <p className={`text-xs ${colors.text} italic`}>
          {passage.subtext(ctx)}
        </p>
      )}

      {/* Question */}
      <p className="text-sm text-zinc-100 leading-relaxed font-medium">
        {passage.questionText(ctx)}
      </p>

      {/* Choices */}
      <div className="space-y-2">
        {passage.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => handleChoice(choice.id, choice.label, choice.promptIds)}
            className={`w-full text-left rounded-lg border ${colors.border} bg-black/20 hover:bg-black/40 px-4 py-3 text-sm text-zinc-200 leading-snug transition-colors`}
          >
            {choice.label}
          </button>
        ))}
      </div>

      {/* Back link */}
      {step.index > 0 && (
        <button
          type="button"
          onClick={() => {
            setAnswers((prev) => prev.slice(0, -1))
            setStep({ kind: 'question', index: step.index - 1 })
          }}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Back
        </button>
      )}
    </div>
  )
}

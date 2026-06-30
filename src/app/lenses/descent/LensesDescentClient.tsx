'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveLensGoalDescent } from '@/actions/lens-goals'
import { getLensDomain } from '@/lib/lenses/domains'
import { getPromptSeeds } from '@/lib/lenses/prompt-seeds'
import { createClientOptionKey, optionText } from '@/lib/lenses/workshop-options'
import type { LensAlignmentType, LensDescentParentDTO, LensesDescentState, LensWorkshopOption } from '@/lib/lenses/types'

type Phase = 'write' | 'options' | 'keep'

const MAX_OPTIONS = 10
const MAX_KEPT = 5

function cadenceLabel(cadence: string) {
  switch (cadence) {
    case 'quarter':
      return 'Quarter'
    case 'month':
      return 'Month'
    case 'week':
      return 'Week'
    default:
      return cadence
  }
}

function promptForParent(parent: LensDescentParentDTO) {
  switch (parent.nextCadence) {
    case 'quarter':
      return 'Given this yearly goal, what could you actually move in the next 90 days?'
    case 'month':
      return 'Given this quarter goal, what could you move this month?'
    case 'week':
      return 'Given this month goal, what small moves could actually happen this week?'
    default:
      return 'What would move this forward?'
  }
}

function draftForParent(initialState: LensesDescentState, parent: LensDescentParentDTO | undefined) {
  if (!parent?.nextCadence) return null
  return initialState.drafts.find((draft) => draft.parentGoalId === parent.id && draft.cadence === parent.nextCadence) ?? null
}

export function LensesDescentClient({ initialState }: { initialState: LensesDescentState }) {
  const router = useRouter()
  const firstOpenParent = initialState.parents.find((parent) => parent.childCount === 0) ?? initialState.parents[0]
  const firstDraft = draftForParent(initialState, firstOpenParent)
  const [selectedParentId, setSelectedParentId] = useState(firstOpenParent.id)
  const [phase, setPhase] = useState<Phase>('write')
  const [freewrite, setFreewrite] = useState(firstDraft?.freewrite ?? '')
  const [options, setOptions] = useState<LensWorkshopOption[]>(firstDraft?.options ?? [])
  const [keptIndexes, setKeptIndexes] = useState<number[]>(firstDraft?.keptOrder ?? [])
  const [alignmentType, setAlignmentType] = useState<LensAlignmentType>('progress')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const parent = initialState.parents.find((item) => item.id === selectedParentId) ?? firstOpenParent
  const selectedDraft = draftForParent(initialState, parent)
  const completedCount = initialState.parents.filter((item) => item.childCount > 0).length
  const seeds = useMemo(
    () => getPromptSeeds({ domain: parent.domain }).map((seed) => seed.replace(/^A year of /, '').replace(/^A /, '')),
    [parent.domain],
  )

  function resetForParent(parentId: string) {
    const nextParent = initialState.parents.find((item) => item.id === parentId)
    const draft = draftForParent(initialState, nextParent)
    setSelectedParentId(parentId)
    setPhase('write')
    setFreewrite(draft?.freewrite ?? '')
    setOptions(draft?.options ?? [])
    setKeptIndexes(draft?.keptOrder ?? [])
    setAlignmentType('progress')
    setMessage(null)
  }

  function addOption(value = '') {
    if (options.length >= MAX_OPTIONS) return
    setOptions((current) => [...current, { tempKey: createClientOptionKey(), text: value }])
  }

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, text: value } : item)))
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setKeptIndexes((current) =>
      current
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item)),
    )
  }

  function toggleKeep(index: number) {
    if (keptIndexes.includes(index)) {
      setKeptIndexes((current) => current.filter((item) => item !== index))
      return
    }
    if (keptIndexes.length >= MAX_KEPT) return
    setKeptIndexes((current) => [...current, index])
  }

  function advance() {
    if (phase === 'write') {
      if (options.length === 0) {
        setOptions(
          freewrite
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, MAX_OPTIONS)
            .map((line) => ({ tempKey: createClientOptionKey(), text: line })),
        )
      }
      setPhase('options')
      return
    }
    if (phase === 'options') {
      setPhase('keep')
      return
    }
    save('locked')
  }

  function save(status: 'locked' | 'parked' | 'skipped') {
    const cadence = parent.nextCadence
    if (!cadence) return
    setMessage(null)
    startTransition(async () => {
      const result = await saveLensGoalDescent({
        parentGoalId: parent.id,
        cadence,
        freewrite,
        options,
        keptIndexes,
        status,
        alignmentType,
      })
      if ('error' in result && result.error) {
        setMessage(result.error)
        return
      }
      if ('options' in result && result.options) setOptions(result.options)
      setMessage(`${cadenceLabel(cadence)} goals saved for "${parent.title}".`)
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-6 text-[#e8e6e0]">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#a855f7]">Lenses descent</p>
            <h1 className="mt-2 text-2xl font-black">Walk the year downward.</h1>
            <p className="mt-2 text-sm leading-6 text-[#a09e98]">
              Descend one parent goal at a time. This keeps the ritual humane while covering every active lens.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1a1a18] p-4">
            <div className="flex items-center justify-between text-xs text-[#a09e98]">
              <span>Progress</span>
              <span>{completedCount}/{initialState.parents.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#7c3aed]"
                style={{ width: `${Math.round((completedCount / initialState.parents.length) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {initialState.parents.map((item) => {
              const itemDomain = getLensDomain(item.domain)
              const selected = item.id === parent.id
              return (
                <button
                  key={item.id}
                  onClick={() => resetForParent(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected ? 'border-[#7c3aed] bg-[#7c3aed]/20' : 'border-white/10 bg-[#1a1a18]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#d8b4fe]">
                      {itemDomain.glyph} {itemDomain.label}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#a09e98]">
                      {item.status === 'parked' ? 'parked' : item.childCount > 0 ? 'descended' : draftForParent(initialState, item)?.status === 'parked' ? 'resume' : cadenceLabel(item.nextCadence ?? '')}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[#e8e6e0]">{item.title}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-[#111110] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="mb-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#a855f7]">
                {cadenceLabel(parent.nextCadence ?? '')} pass
              </p>
              <div className="grid grid-cols-3 rounded-lg bg-black/30 p-1 text-xs">
                {(['write', 'options', 'keep'] as Phase[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setPhase(item)}
                    className={`rounded-md px-3 py-2 capitalize ${phase === item ? 'bg-[#7c3aed] text-white' : 'text-[#6b6965]'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8b4fe]">
                Moving toward - {parent.cadence}
              </p>
              <h2 className="mt-2 text-xl font-black">{parent.title}</h2>
              {selectedDraft?.status === 'parked' && (
                <p className="mt-2 text-xs leading-5 text-[#d8b4fe]">
                  This pass is parked. Resume when the next-level goals feel ready to name.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 rounded-lg bg-black/30 p-1 text-xs">
              {(['progress', 'maintenance', 'recovery'] as LensAlignmentType[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setAlignmentType(item)}
                  className={`rounded-md px-3 py-2 capitalize ${alignmentType === item ? 'bg-[#7c3aed] text-white' : 'text-[#a09e98]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {phase === 'write' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black">Free-write the next level.</h2>
                <p className="mt-2 text-sm leading-6 text-[#a09e98]">{promptForParent(parent)}</p>
              </div>
              <textarea
                value={freewrite}
                onChange={(event) => setFreewrite(event.target.value)}
                placeholder="Messy is fine. What would genuinely move this forward?"
                className="min-h-72 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 outline-none focus:border-[#7c3aed]"
              />
              <p className="text-center text-xs text-[#6b6965]">No floor to clear. The page keeps no score.</p>
            </div>
          )}

          {phase === 'options' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black">Make options.</h2>
                <p className="mt-2 text-sm leading-6 text-[#a09e98]">Create up to ten possible next-level goals.</p>
              </div>
              <div className="space-y-2">
                {seeds.map((seed) => (
                  <button
                    key={seed}
                    onClick={() => addOption(seed)}
                    className="block w-full rounded-lg border border-dashed border-[#7c3aed]/40 p-3 text-left text-xs leading-5 text-[#d8b4fe]"
                  >
                    + {seed}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
                    <span className="w-6 text-center font-mono text-xs text-[#6b6965]">{String(index + 1).padStart(2, '0')}</span>
                    <input
                      value={optionText(option)}
                      onChange={(event) => updateOption(index, event.target.value)}
                      placeholder="A next-level goal..."
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <button className="px-2 text-[#6b6965]" onClick={() => removeOption(index)}>x</button>
                  </div>
                ))}
              </div>
              <button
                disabled={options.length >= MAX_OPTIONS}
                className="w-full rounded-lg border border-dashed border-white/15 py-3 text-sm text-[#a09e98] disabled:opacity-40"
                onClick={() => addOption()}
              >
                + Add an option ({options.length}/{MAX_OPTIONS})
              </button>
            </div>
          )}

          {phase === 'keep' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black">Keep five.</h2>
                <p className="mt-2 text-sm leading-6 text-[#a09e98]">Choose what actually belongs at this level.</p>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#a855f7]">{keptIndexes.length}/{MAX_KEPT} kept</p>
              <div className="space-y-3">
                {options.map((option, index) => {
                  const order = keptIndexes.indexOf(index)
                  const kept = order >= 0
                  return (
                    <button
                      key={index}
                      onClick={() => toggleKeep(index)}
                      disabled={!kept && keptIndexes.length >= MAX_KEPT}
                      className={`w-full rounded-xl border p-4 text-left text-sm leading-6 transition disabled:opacity-40 ${
                        kept ? 'border-[#7c3aed] bg-[#7c3aed]/20 text-white' : 'border-white/10 bg-[#1a1a18] text-[#a09e98]'
                      }`}
                    >
                      <span className="mr-2 font-mono text-xs">{kept ? order + 1 : '○'}</span>
                      {optionText(option) || 'Untitled option'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {message && <p className="mt-5 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-[#d8b4fe]">{message}</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="min-h-12 flex-1 rounded-lg bg-[#7c3aed] px-5 font-bold text-white disabled:opacity-40"
              disabled={isPending || (phase === 'keep' && keptIndexes.length === 0)}
              onClick={advance}
            >
              {phase === 'write' ? 'Make options' : phase === 'options' ? 'Choose which to keep' : isPending ? 'Saving...' : `Save ${cadenceLabel(parent.nextCadence ?? '')}`}
            </button>
            <button
              className="min-h-12 rounded-lg border border-white/10 px-5 font-bold text-[#d8b4fe]"
              disabled={isPending}
              onClick={() => save('parked')}
            >
              Park this pass
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { saveYearLensFrame } from '@/actions/lens-goals'
import { LENS_DOMAINS, LENS_FEELINGS, type LensDomainKey } from '@/lib/lenses/domains'
import { getPromptSeeds } from '@/lib/lenses/prompt-seeds'
import { createClientOptionKey, optionText } from '@/lib/lenses/workshop-options'
import type { LensesOnboardingState, LensWorkshopStatus, LensWorkshopUnit } from '@/lib/lenses/types'

type Screen = 'entry' | 'vague' | 'workshop' | 'review'
type Phase = 'write' | 'options' | 'keep'

const MAX_OPTIONS = 10
const MAX_KEPT = 5

function emptyUnits(initialState: LensesOnboardingState): LensWorkshopUnit[] {
  return LENS_DOMAINS.map((domain) => {
    const draft = initialState.drafts.find((item) => item.domain === domain.key)
    const domainGoals = initialState.goals
      .filter((goal) => goal.domain === domain.key && (goal.status === 'active' || goal.status === 'parked'))
      .sort((a, b) => a.keepOrder - b.keepOrder)
    const goalTitles = domainGoals
      .map((goal) => ({ stableKey: goal.stableKey, text: goal.title }))
    const options = draft?.options.length ? draft.options : goalTitles
    const keptIndexes = draft?.keptOrder.length
      ? draft.keptOrder
      : domainGoals.some((goal) => goal.status === 'parked')
        ? []
        : goalTitles.map((_, index) => index)
    const status = draft?.status === 'parked' || domainGoals.some((goal) => goal.status === 'parked')
      ? 'parked'
      : 'draft'

    return {
      domain: domain.key,
      freewrite: draft?.freewrite ?? '',
      options,
      keptIndexes,
      status: status as LensWorkshopStatus,
    }
  })
}

function domainMeta(key: LensDomainKey) {
  return LENS_DOMAINS.find((domain) => domain.key === key) ?? LENS_DOMAINS[0]
}

function compactSuperpowerLabel(state: LensesOnboardingState) {
  if (!state.superpower) return 'No quiz result yet'
  return state.superpower
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

export function LensesOnboardingClient({ initialState }: { initialState: LensesOnboardingState }) {
  const [screen, setScreen] = useState<Screen>('entry')
  const [phase, setPhase] = useState<Phase>('write')
  const [domainIndex, setDomainIndex] = useState(0)
  const [vagueMovement, setVagueMovement] = useState(initialState.drafts[0]?.vagueMovement ?? '')
  const [feelings, setFeelings] = useState<string[]>(initialState.drafts[0]?.feelings.length ? initialState.drafts[0].feelings : ['settled', 'connected'])
  const [units, setUnits] = useState< LensWorkshopUnit[] >(() => emptyUnits(initialState))
  const [timerSeconds, setTimerSeconds] = useState(600)
  const [timerRunning, setTimerRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeUnit = units[domainIndex]
  const activeDomain = domainMeta(activeUnit.domain)
  const keptCount = activeUnit.keptIndexes.length
  const currentSeeds = useMemo(
    () =>
      getPromptSeeds({
        domain: activeUnit.domain,
        superpower: initialState.superpower,
        orientation: initialState.superpowerOrientation,
      }),
    [activeUnit.domain, initialState.superpower, initialState.superpowerOrientation],
  )

  useEffect(() => {
    if (screen !== 'workshop' || phase !== 'write' || !timerRunning || timerSeconds <= 0) return
    const id = window.setInterval(() => setTimerSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(id)
  }, [phase, screen, timerRunning, timerSeconds])

  function updateUnit(patch: Partial<LensWorkshopUnit>) {
    setUnits((current) =>
      current.map((unit, index) => (index === domainIndex ? { ...unit, ...patch } : unit)),
    )
  }

  function updateOption(optionIndex: number, value: string) {
    const next = [...activeUnit.options]
    next[optionIndex] = { ...next[optionIndex], text: value }
    updateUnit({ options: next })
  }

  function addOption(value = '') {
    if (activeUnit.options.length >= MAX_OPTIONS) return
    updateUnit({ options: [...activeUnit.options, { tempKey: createClientOptionKey(), text: value }] })
  }

  function removeOption(optionIndex: number) {
    const nextOptions = activeUnit.options.filter((_, index) => index !== optionIndex)
    const nextKept = activeUnit.keptIndexes
      .filter((index) => index !== optionIndex)
      .map((index) => (index > optionIndex ? index - 1 : index))
    updateUnit({ options: nextOptions, keptIndexes: nextKept })
  }

  function toggleKept(optionIndex: number) {
    if (activeUnit.keptIndexes.includes(optionIndex)) {
      updateUnit({ keptIndexes: activeUnit.keptIndexes.filter((index) => index !== optionIndex) })
      return
    }
    if (activeUnit.keptIndexes.length >= MAX_KEPT) return
    updateUnit({ keptIndexes: [...activeUnit.keptIndexes, optionIndex] })
  }

  function nextWorkshopStep() {
    setMessage(null)
    if (phase === 'write') {
      const text = activeUnit.freewrite.trim()
      const nextOptions = activeUnit.options.length
        ? activeUnit.options
        : text
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, MAX_OPTIONS)
            .map((line) => ({ tempKey: createClientOptionKey(), text: line }))
      updateUnit({ options: nextOptions })
      setPhase('options')
      return
    }
    if (phase === 'options') {
      setPhase('keep')
      return
    }
    if (domainIndex < LENS_DOMAINS.length - 1) {
      setDomainIndex(domainIndex + 1)
      setPhase('write')
      setTimerSeconds(600)
      setTimerRunning(false)
      return
    }
    setScreen('review')
  }

  function parkActiveDomain() {
    updateUnit({ status: 'parked', keptIndexes: [] })
    if (domainIndex < LENS_DOMAINS.length - 1) {
      setDomainIndex(domainIndex + 1)
      setPhase('write')
      setTimerSeconds(600)
      setTimerRunning(false)
    } else {
      setScreen('review')
    }
  }

  function resumeDomain(index: number) {
    setUnits((current) =>
      current.map((unit, unitIndex) =>
        unitIndex === index
          ? {
              ...unit,
              status: 'draft',
              keptIndexes: unit.keptIndexes.length ? unit.keptIndexes : unit.options.map((_, optionIndex) => optionIndex).slice(0, MAX_KEPT),
            }
          : unit,
      ),
    )
    setDomainIndex(index)
    setPhase('keep')
    setScreen('workshop')
  }

  function saveFrame() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveYearLensFrame({ vagueMovement, feelings, units })
      if ('error' in result && result.error) {
        setMessage(result.error)
        return
      }
      if ('units' in result && result.units) setUnits(result.units)
      setMessage('Year frame saved. It is yours to revisit.')
    })
  }

  const timerLabel = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-6 text-[#e8e6e0]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col">
        <header className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#a855f7]">Lenses</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">
              {screen === 'workshop' ? `Lens ${domainIndex + 1} / 5` : screen}
            </p>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {LENS_DOMAINS.map((domain, index) => (
              <div
                key={domain.key}
                className={`h-1 rounded-full ${index <= domainIndex && screen !== 'entry' ? 'bg-[#7c3aed] shadow-[0_0_14px_rgba(168,85,247,0.7)]' : 'bg-white/10'}`}
              />
            ))}
          </div>
        </header>

        {screen === 'entry' && (
          <section className="flex flex-1 flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-black leading-tight">Let&apos;s imagine the year you&apos;re moving toward.</h1>
                <p className="text-sm leading-7 text-[#a09e98]">
                  You will dream your own goals here. Your superpower is a lens, not a sentence.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1a1a18] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#a855f7]">Your allyship superpower</p>
                <h2 className="mt-3 text-2xl font-black">{compactSuperpowerLabel(initialState)}</h2>
                <p className="mt-2 text-xs uppercase tracking-wider text-[#6b6965]">
                  {initialState.superpowerOrientation ? `${initialState.superpowerOrientation} focus` : 'Use this as a suggestion lens'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full rounded-lg bg-[#7c3aed] px-5 py-4 font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.45)]" onClick={() => setScreen('vague')}>
                Begin Lenses -&gt;
              </button>
              <button className="w-full py-3 text-sm text-[#a09e98]" onClick={() => setScreen('vague')}>
                Choose without quiz
              </button>
            </div>
          </section>
        )}

        {screen === 'vague' && (
          <section className="flex flex-1 flex-col justify-between gap-6">
            <div className="space-y-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#a855f7]">Before goals - desire</p>
              <div>
                <h1 className="text-2xl font-black">What are you moving toward?</h1>
                <p className="mt-3 text-sm leading-7 text-[#a09e98]">
                  No goals yet. Just the shape of it. What would feel different if this year worked?
                </p>
              </div>
              <textarea
                value={vagueMovement}
                onChange={(event) => setVagueMovement(event.target.value)}
                placeholder="Write loosely. Half-sentences are fine."
                className="min-h-40 w-full rounded-xl border border-white/10 bg-[#111110] p-4 text-sm leading-6 text-[#e8e6e0] outline-none focus:border-[#7c3aed]"
              />
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6b6965]">The satisfaction feeling</p>
                <div className="flex flex-wrap gap-2">
                  {LENS_FEELINGS.map((feeling) => {
                    const selected = feelings.includes(feeling)
                    return (
                      <button
                        key={feeling}
                        onClick={() =>
                          setFeelings((current) =>
                            selected ? current.filter((item) => item !== feeling) : [...current, feeling],
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-sm ${selected ? 'border-[#7c3aed] bg-[#7c3aed]/20 text-[#d8b4fe]' : 'border-white/10 bg-[#1a1a18] text-[#a09e98]'}`}
                      >
                        {feeling}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <button className="w-full rounded-lg bg-[#7c3aed] px-5 py-4 font-bold text-white" onClick={() => setScreen('workshop')}>
              Work through the five lenses -&gt;
            </button>
          </section>
        )}

        {screen === 'workshop' && (
          <section className="flex flex-1 flex-col gap-5">
            <div className="rounded-xl border border-white/10 bg-[#1a1a18] p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-black">
                  <span className="mr-2 text-[#a855f7]">{activeDomain.glyph}</span>
                  {activeDomain.label}
                </h1>
                <button className="text-xs text-[#a09e98]" onClick={parkActiveDomain}>Park this lens</button>
              </div>
              <div className="mt-4 grid grid-cols-3 rounded-lg bg-black/30 p-1 text-xs">
                {(['write', 'options', 'keep'] as Phase[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setPhase(item)}
                    className={`rounded-md px-2 py-2 capitalize ${phase === item ? 'bg-[#7c3aed] text-white' : 'text-[#6b6965]'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {phase === 'write' && (
              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-black">Free-write your {activeDomain.label.toLowerCase()}.</h2>
                  <p className="mt-2 text-sm leading-6 text-[#a09e98]">{activeDomain.prompt}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#111110] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a09e98]">{timerSeconds === 0 ? 'stay as long as you like' : 'ten quiet minutes - no pressure'}</span>
                    <span className="font-mono text-lg text-[#d8b4fe]">{timerLabel}</span>
                  </div>
                  <button className="mt-3 text-xs text-[#a855f7]" onClick={() => setTimerRunning((value) => !value)}>
                    {timerRunning ? 'Pause' : 'Start'} timer
                  </button>
                </div>
                <textarea
                  value={activeUnit.freewrite}
                  onChange={(event) => updateUnit({ freewrite: event.target.value })}
                  placeholder="Just write. What do you actually want here?"
                  className="min-h-64 flex-1 rounded-xl border border-white/10 bg-[#111110] p-4 text-sm leading-7 text-[#e8e6e0] outline-none focus:border-[#7c3aed]"
                />
              </div>
            )}

            {phase === 'options' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black">Turn it into options.</h2>
                  <p className="mt-2 text-sm leading-6 text-[#a09e98]">Make up to ten. Dream wide; you will narrow next.</p>
                </div>
                <div className="space-y-2">
                  {currentSeeds.map((seed) => (
                    <button key={seed} className="block w-full rounded-lg border border-dashed border-[#7c3aed]/40 p-3 text-left text-xs leading-5 text-[#d8b4fe]" onClick={() => addOption(seed)}>
                      + {seed}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {activeUnit.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111110] p-2">
                      <span className="w-6 text-center font-mono text-xs text-[#6b6965]">{String(index + 1).padStart(2, '0')}</span>
                      <input
                        value={optionText(option)}
                        onChange={(event) => updateOption(index, event.target.value)}
                        placeholder="A goal you would want..."
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                      <button className="px-2 text-[#6b6965]" onClick={() => removeOption(index)}>x</button>
                    </div>
                  ))}
                </div>
                <button disabled={activeUnit.options.length >= MAX_OPTIONS} className="w-full rounded-lg border border-dashed border-white/15 py-3 text-sm text-[#a09e98] disabled:opacity-40" onClick={() => addOption()}>
                  + Add an option ({activeUnit.options.length}/{MAX_OPTIONS})
                </button>
              </div>
            )}

            {phase === 'keep' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black">Keep five.</h2>
                  <p className="mt-2 text-sm leading-6 text-[#a09e98]">Narrowing is focus, not loss. The rest stay in your dream notes.</p>
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#a855f7]">{keptCount} / {MAX_KEPT} kept</p>
                <div className="space-y-3">
                  {activeUnit.options.map((option, index) => {
                    const keptOrder = activeUnit.keptIndexes.indexOf(index)
                    const kept = keptOrder >= 0
                    return (
                      <button
                        key={index}
                        onClick={() => toggleKept(index)}
                        disabled={!kept && keptCount >= MAX_KEPT}
                        className={`w-full rounded-xl border p-4 text-left text-sm leading-6 transition disabled:opacity-40 ${kept ? 'border-[#7c3aed] bg-[#7c3aed]/20 text-white' : 'border-white/10 bg-[#1a1a18] text-[#a09e98]'}`}
                      >
                        <span className="mr-2 font-mono text-xs">{kept ? keptOrder + 1 : '○'}</span>
                        {optionText(option) || 'Untitled option'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              className="mt-auto w-full rounded-lg bg-[#7c3aed] px-5 py-4 font-bold text-white disabled:opacity-40"
              disabled={phase === 'keep' && keptCount === 0}
              onClick={nextWorkshopStep}
            >
              {phase === 'write' ? 'I am done - make options' : phase === 'options' ? 'Choose which to keep' : domainIndex < LENS_DOMAINS.length - 1 ? 'Lock in - next lens' : 'Lock in - review'}
            </button>
          </section>
        )}

        {screen === 'review' && (
          <section className="flex flex-1 flex-col gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#a855f7]">Your authored lenses</p>
              <h1 className="mt-2 text-3xl font-black">The year you&apos;re moving toward.</h1>
            </div>
            <div className="space-y-3">
              {units.map((unit, index) => {
                const domain = domainMeta(unit.domain)
                const kept = unit.keptIndexes.map((optionIndex) => unit.options[optionIndex]).filter(Boolean)
                return (
                  <div key={unit.domain} className={`rounded-xl border border-white/10 bg-[#1a1a18] p-4 ${unit.status === 'parked' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold"><span className="mr-2 text-[#a855f7]">{domain.glyph}</span>{domain.label}</h2>
                      <button className="text-xs text-[#a09e98]" onClick={() => { setDomainIndex(index); setPhase('keep'); setScreen('workshop') }}>
                        Edit
                      </button>
                    </div>
                    {unit.status === 'parked' ? (
                      <p className="mt-3 text-sm text-[#a09e98]">Parked for now. That counts as focus.</p>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm text-[#a09e98]">
                        {kept.map((item) => <li key={item.stableKey ?? item.tempKey ?? item.text}>- {optionText(item)}</li>)}
                      </ul>
                    )}
                    {unit.status === 'parked' && (
                      <button className="mt-3 text-xs font-bold text-[#d8b4fe]" onClick={() => resumeDomain(index)}>
                        Resume this lens
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {message && <p className="rounded-lg border border-white/10 bg-[#111110] p-3 text-sm text-[#d8b4fe]">{message}</p>}
            <button className="mt-auto w-full rounded-lg bg-[#7c3aed] px-5 py-4 font-bold text-white disabled:opacity-40" disabled={isPending} onClick={saveFrame}>
              {isPending ? 'Saving...' : 'Save year frame'}
            </button>
            {message?.includes('saved') && (
              <a
                href="/lenses/descent"
                className="block rounded-lg border border-white/10 px-5 py-4 text-center font-bold text-[#d8b4fe]"
              >
                Derive quarterly goals
              </a>
            )}
            <p className="text-center text-xs text-[#6b6965]">Quarterly descent comes next. This frame is not a life sentence.</p>
          </section>
        )}
      </div>
    </main>
  )
}

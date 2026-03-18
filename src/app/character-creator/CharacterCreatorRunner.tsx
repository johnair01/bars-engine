'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  saveCharacterPlaybook,
  getNationMoves,
  getNationByName,
  type ArchetypeData,
  type NationMoveData,
} from '@/actions/character-creator'
import {
  DISCOVERY_QUESTIONS,
  NATION_QUESTIONS,
  COMMUNITY_OPTIONS,
  DREAM_QUESTIONS,
  FEAR_BELIEFS,
  ARCHETYPE_NAME_MAP,
  NATION_NAME_MAP,
  type ArchetypeKey,
  type NationKey,
  type GMVoice,
} from '@/lib/character-creator/discovery-data'
import { accumulateWeights, rankByScore, topKey, resonancePercent } from '@/lib/character-creator/scoring'
import { CharacterCreatorAvatarPreview } from '@/components/character-creator/CharacterCreatorAvatarPreview'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase =
  | 'landing'
  | 'discovery'
  | 'archetype_reveal'
  | 'archetype_alternatives'
  | 'archetype_moves'
  | 'nation_discovery'
  | 'nation_moves'
  | 'story_community'
  | 'story_dreams'
  | 'story_fears'
  | 'complete'

type DiscoveryAnswer = {
  qId: string
  choiceKey: string
  weights: Partial<Record<ArchetypeKey, number>>
}

type NationAnswer = {
  qId: string
  choiceKey: string
}

type FearChoice = {
  beliefId: string
  original: string
  personalized: string
}

type State = {
  phase: Phase
  discoveryIndex: number
  discoveryAnswers: DiscoveryAnswer[]
  archetypeScores: Record<string, number>
  resolvedArchetype: ArchetypeData | null
  nationDiscoveryIndex: number
  nationAnswers: NationAnswer[]
  nationScores: Record<string, number>
  resolvedNationId: string | null
  resolvedNationName: string | null
  nationMoves: NationMoveData[]
  nationMovesLoading: boolean
  selectedArchetypeMoves: string[]
  selectedNationMoves: string[]
  communityKey: string
  dreamAnswers: Record<string, string>
  fearChoices: FearChoice[]
  shareToken: string | null
  saving: boolean
  saveError: string | null
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  archetypes: ArchetypeData[]
  playerNationId: string | null
  playerNationName: string | null
  existingPlaybook: { shareToken: string } | null
}

// ---------------------------------------------------------------------------
// GM Voice colors
// ---------------------------------------------------------------------------

const GM_VOICE_STYLES: Record<GMVoice, { label: string; color: string }> = {
  shaman: { label: 'Shaman', color: 'text-amber-400 border-amber-500/30' },
  challenger: { label: 'Challenger', color: 'text-red-400 border-red-500/30' },
  architect: { label: 'Architect', color: 'text-indigo-400 border-indigo-500/30' },
  diplomat: { label: 'Diplomat', color: 'text-teal-400 border-teal-500/30' },
  sage: { label: 'Sage', color: 'text-violet-400 border-violet-500/30' },
}

function GMVoiceBar({ voice, line }: { voice: GMVoice; line: string }) {
  const style = GM_VOICE_STYLES[voice]
  return (
    <div className={`border-l-2 pl-4 py-1 ${style.color}`}>
      <span className={`text-xs font-mono uppercase tracking-widest ${style.color.split(' ')[0]}`}>
        {style.label}
      </span>
      <p className="text-zinc-400 text-sm mt-1 italic">{line}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CharacterCreatorRunner({
  archetypes,
  playerNationId,
  playerNationName,
  existingPlaybook,
}: Props) {
  const [state, setState] = useState<State>({
    phase: 'landing',
    discoveryIndex: 0,
    discoveryAnswers: [],
    archetypeScores: {},
    resolvedArchetype: null,
    nationDiscoveryIndex: 0,
    nationAnswers: [],
    nationScores: {},
    resolvedNationId: playerNationId,
    resolvedNationName: playerNationName,
    nationMoves: [],
    nationMovesLoading: false,
    selectedArchetypeMoves: [],
    selectedNationMoves: [],
    communityKey: '',
    dreamAnswers: {},
    fearChoices: [],
    shareToken: null,
    saving: false,
    saveError: null,
  })

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function set(partial: Partial<State>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  function resolveArchetypeFromScores(scores: Record<string, number>): ArchetypeData | null {
    const top = topKey(scores)
    if (!top) return null
    const name = ARCHETYPE_NAME_MAP[top as ArchetypeKey]
    return archetypes.find((a) => a.name === name) ?? null
  }

  // -------------------------------------------------------------------------
  // Discovery
  // -------------------------------------------------------------------------

  function handleDiscoveryChoice(choiceKey: string) {
    const q = DISCOVERY_QUESTIONS[state.discoveryIndex]
    const choice = q.choices.find((c) => c.key === choiceKey)
    if (!choice) return

    const newScores = accumulateWeights(state.archetypeScores, choice.weights as Record<string, number>)
    const newAnswers: DiscoveryAnswer[] = [
      ...state.discoveryAnswers,
      { qId: q.id, choiceKey, weights: choice.weights },
    ]

    const isLast = state.discoveryIndex >= DISCOVERY_QUESTIONS.length - 1

    if (isLast) {
      const resolved = resolveArchetypeFromScores(newScores)
      set({
        discoveryAnswers: newAnswers,
        archetypeScores: newScores,
        resolvedArchetype: resolved,
        phase: 'archetype_reveal',
      })
    } else {
      set({
        discoveryAnswers: newAnswers,
        archetypeScores: newScores,
        discoveryIndex: state.discoveryIndex + 1,
      })
    }
  }

  // -------------------------------------------------------------------------
  // Archetype moves
  // -------------------------------------------------------------------------

  function toggleArchetypeMove(key: string) {
    const current = state.selectedArchetypeMoves
    if (current.includes(key)) {
      set({ selectedArchetypeMoves: current.filter((k) => k !== key) })
    } else if (current.length < 2) {
      set({ selectedArchetypeMoves: [...current, key] })
    }
  }

  function afterArchetypeMoves() {
    // If player already has a nation, skip discovery
    if (state.resolvedNationId) {
      loadNationMovesAndGoTo(state.resolvedNationId, 'nation_moves')
    } else {
      set({ phase: 'nation_discovery' })
    }
  }

  // -------------------------------------------------------------------------
  // Nation discovery
  // -------------------------------------------------------------------------

  function handleNationChoice(choiceKey: string) {
    const q = NATION_QUESTIONS[state.nationDiscoveryIndex]
    const choice = q.choices.find((c) => c.key === choiceKey)
    if (!choice) return

    const newScores = accumulateWeights(state.nationScores, choice.nationWeights as Record<string, number>)
    const newAnswers: NationAnswer[] = [
      ...state.nationAnswers,
      { qId: q.id, choiceKey },
    ]

    const isLast = state.nationDiscoveryIndex >= NATION_QUESTIONS.length - 1

    if (isLast) {
      const topNationKey = topKey(newScores) as NationKey | null
      const nationName = topNationKey ? NATION_NAME_MAP[topNationKey] : null

      // Look up the DB nation ID
      if (nationName) {
        set({ nationAnswers: newAnswers, nationScores: newScores, nationMovesLoading: true })
        getNationByName(nationName).then((nation) => {
          const nationId = nation?.id ?? null
          if (nationId) {
            loadNationMovesAndGoTo(nationId, 'nation_moves', {
              nationAnswers: newAnswers,
              nationScores: newScores,
              resolvedNationId: nationId,
              resolvedNationName: nationName,
            })
          } else {
            set({
              nationAnswers: newAnswers,
              nationScores: newScores,
              resolvedNationName: nationName,
              nationMovesLoading: false,
              phase: 'story_community',
            })
          }
        })
      } else {
        set({ nationAnswers: newAnswers, nationScores: newScores, phase: 'story_community' })
      }
    } else {
      set({
        nationAnswers: newAnswers,
        nationScores: newScores,
        nationDiscoveryIndex: state.nationDiscoveryIndex + 1,
      })
    }
  }

  async function loadNationMovesAndGoTo(
    nationId: string,
    phase: Phase,
    extra?: Partial<State>
  ) {
    set({ nationMovesLoading: true })
    try {
      const moves = await getNationMoves(nationId)
      set({ nationMoves: moves, nationMovesLoading: false, phase, ...extra })
    } catch {
      set({ nationMovesLoading: false, phase, ...extra })
    }
  }

  // -------------------------------------------------------------------------
  // Nation moves
  // -------------------------------------------------------------------------

  function toggleNationMove(id: string) {
    const current = state.selectedNationMoves
    if (current.includes(id)) {
      set({ selectedNationMoves: current.filter((k) => k !== id) })
    } else if (current.length < 2) {
      set({ selectedNationMoves: [...current, id] })
    }
  }

  // -------------------------------------------------------------------------
  // Fear choices
  // -------------------------------------------------------------------------

  function toggleFearBelief(beliefId: string, original: string) {
    const existing = state.fearChoices.find((f) => f.beliefId === beliefId)
    if (existing) {
      set({ fearChoices: state.fearChoices.filter((f) => f.beliefId !== beliefId) })
    } else if (state.fearChoices.length < 3) {
      set({ fearChoices: [...state.fearChoices, { beliefId, original, personalized: '' }] })
    }
  }

  function updateFearPersonalized(beliefId: string, personalized: string) {
    set({
      fearChoices: state.fearChoices.map((f) =>
        f.beliefId === beliefId ? { ...f, personalized } : f
      ),
    })
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  async function handleSave() {
    if (!state.resolvedArchetype) return
    set({ saving: true, saveError: null })

    const archetype = state.resolvedArchetype

    // Build archetype moves from selections
    const archetypeMoveMap: Array<{ key: string; label: string; desc: string }> = []
    if (archetype.wakeUp) archetypeMoveMap.push({ key: 'wakeUp', label: 'Wake Up', desc: archetype.wakeUp })
    if (archetype.cleanUp) archetypeMoveMap.push({ key: 'cleanUp', label: 'Clean Up', desc: archetype.cleanUp })
    if (archetype.growUp) archetypeMoveMap.push({ key: 'growUp', label: 'Grow Up', desc: archetype.growUp })
    if (archetype.showUp) archetypeMoveMap.push({ key: 'showUp', label: 'Show Up', desc: archetype.showUp })

    const chosenArchetypeMoves = archetypeMoveMap
      .filter((m) => state.selectedArchetypeMoves.includes(m.key))
      .map((m) => ({ id: m.key, name: m.label, key: m.key }))

    const chosenNationMoves = state.nationMoves
      .filter((m) => state.selectedNationMoves.includes(m.id))
      .map((m) => ({ id: m.id, name: m.name, key: m.key }))

    const communityOption = COMMUNITY_OPTIONS.find((o) => o.key === state.communityKey)

    const result = await saveCharacterPlaybook({
      archetypeId: archetype.id,
      nationId: state.resolvedNationId ?? undefined,
      playbookName: archetype.name,
      playerAnswers: {
        discovery: state.discoveryAnswers.map((a) => ({
          qId: a.qId,
          choiceKey: a.choiceKey,
          weights: a.weights as Record<string, number>,
        })),
        nationDiscovery: state.nationAnswers,
        community: communityOption?.text ?? state.communityKey,
        dreams: DREAM_QUESTIONS.map((q) => ({
          qId: q.id,
          question: q.text,
          answer: state.dreamAnswers[q.id] ?? '',
        })),
        fears: state.fearChoices.map((f) => ({
          beliefId: f.beliefId,
          original: f.original,
          personalized: f.personalized || f.original,
        })),
      },
      playbookMoves: chosenArchetypeMoves,
      playbookBonds: chosenNationMoves,
    })

    set({ saving: false })

    if ('error' in result) {
      set({ saveError: result.error })
      return
    }

    set({ shareToken: result.shareToken, phase: 'complete' })
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const { phase } = state

  // Shell
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-400 transition text-xs uppercase tracking-widest"
          >
            &larr; Dashboard
          </Link>
          {phase !== 'landing' && phase !== 'complete' && (
            <div className="flex items-center gap-4">
              <CharacterCreatorAvatarPreview
                phase={phase}
                resolvedArchetypeName={state.resolvedArchetype?.name ?? null}
                resolvedNationName={state.resolvedNationName ?? null}
              />
              <span className="text-zinc-700 text-xs font-mono">Character Creator</span>
            </div>
          )}
        </div>

        {existingPlaybook && phase === 'landing' && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-zinc-400 text-sm">You have an existing character.</p>
            <Link
              href={`/character/${existingPlaybook.shareToken}`}
              className="text-amber-400 text-sm hover:text-amber-300 transition shrink-0"
            >
              View it &rarr;
            </Link>
          </div>
        )}

        {/* Phases */}
        {phase === 'landing' && <LandingScene onBegin={() => set({ phase: 'discovery' })} />}

        {phase === 'discovery' && (
          <DiscoveryScene
            question={DISCOVERY_QUESTIONS[state.discoveryIndex]}
            totalQuestions={DISCOVERY_QUESTIONS.length}
            currentIndex={state.discoveryIndex}
            onChoice={handleDiscoveryChoice}
          />
        )}

        {phase === 'archetype_reveal' && state.resolvedArchetype && (
          <ArchetypeReveal
            archetype={state.resolvedArchetype}
            scores={state.archetypeScores}
            archetypes={archetypes}
            onAccept={() => set({ phase: 'archetype_moves' })}
            onSeeAlternatives={() => set({ phase: 'archetype_alternatives' })}
          />
        )}

        {phase === 'archetype_alternatives' && (
          <ArchetypeAlternatives
            scores={state.archetypeScores}
            archetypes={archetypes}
            onSelect={(a) => set({ resolvedArchetype: a, phase: 'archetype_moves' })}
          />
        )}

        {phase === 'archetype_moves' && state.resolvedArchetype && (
          <ArchetypeMoves
            archetype={state.resolvedArchetype}
            selected={state.selectedArchetypeMoves}
            onToggle={toggleArchetypeMove}
            onNext={afterArchetypeMoves}
            loading={state.nationMovesLoading}
          />
        )}

        {phase === 'nation_discovery' && (
          <NationDiscovery
            question={NATION_QUESTIONS[state.nationDiscoveryIndex]}
            totalQuestions={NATION_QUESTIONS.length}
            currentIndex={state.nationDiscoveryIndex}
            onChoice={handleNationChoice}
            loading={state.nationMovesLoading}
          />
        )}

        {phase === 'nation_moves' && (
          <NationMoves
            nationName={state.resolvedNationName}
            moves={state.nationMoves}
            selected={state.selectedNationMoves}
            onToggle={toggleNationMove}
            onNext={() => set({ phase: 'story_community' })}
          />
        )}

        {phase === 'story_community' && (
          <StoryCommunity
            selected={state.communityKey}
            onSelect={(key) => set({ communityKey: key })}
            onNext={() => set({ phase: 'story_dreams' })}
          />
        )}

        {phase === 'story_dreams' && (
          <StoryDreams
            answers={state.dreamAnswers}
            onChange={(qId, val) => set({ dreamAnswers: { ...state.dreamAnswers, [qId]: val } })}
            onNext={() => set({ phase: 'story_fears' })}
          />
        )}

        {phase === 'story_fears' && (
          <StoryFears
            choices={state.fearChoices}
            onToggle={toggleFearBelief}
            onPersonalize={updateFearPersonalized}
            onComplete={handleSave}
            saving={state.saving}
            saveError={state.saveError}
          />
        )}

        {phase === 'complete' && state.shareToken && state.resolvedArchetype && (
          <CharacterComplete
            shareToken={state.shareToken}
            archetypeName={state.resolvedArchetype.name}
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Landing
// ---------------------------------------------------------------------------

function LandingScene({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Character Creator</p>
        <h1 className="text-3xl font-bold text-zinc-100 leading-tight">
          Who are you in this work?
        </h1>
        <GMVoiceBar
          voice="shaman"
          line="Before we name you, I want to see how you move. Answer honestly — the archetype finds you, not the other way around."
        />
        <p className="text-zinc-400 leading-relaxed">
          You will move through a series of scenes and choices. At the end, your archetype emerges from the pattern.
          There are no right answers. There is only what is true for you.
        </p>
      </div>
      <button
        onClick={onBegin}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
      >
        Begin &rarr;
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Discovery question
// ---------------------------------------------------------------------------

function DiscoveryScene({
  question,
  totalQuestions,
  currentIndex,
  onChoice,
}: {
  question: (typeof DISCOVERY_QUESTIONS)[0]
  totalQuestions: number
  currentIndex: number
  onChoice: (key: string) => void
}) {
  const sceneNames: Record<number, string> = {
    1: 'Scene One — Sensing the Ground',
    2: 'Scene Two — When Stakes Are Real',
    3: 'Scene Three — Finding Your Rhythm',
    4: 'Scene Four — The Deeper Arc',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-5 rounded-full transition-colors ${
                i < currentIndex
                  ? 'bg-indigo-500'
                  : i === currentIndex
                  ? 'bg-indigo-400'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <span className="text-zinc-600 text-xs font-mono">{currentIndex + 1} / {totalQuestions}</span>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
          {sceneNames[question.scene]}
        </p>
      </div>

      <GMVoiceBar voice={question.gmVoice} line={question.gmLine} />

      <p className="text-zinc-100 text-lg leading-relaxed font-medium">{question.prompt}</p>

      <div className="space-y-3">
        {question.choices.map((choice) => (
          <button
            key={choice.key}
            onClick={() => onChoice(choice.key)}
            className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all duration-150 text-zinc-300 text-sm leading-relaxed"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Archetype reveal
// ---------------------------------------------------------------------------

function ArchetypeReveal({
  archetype,
  scores,
  archetypes,
  onAccept,
  onSeeAlternatives,
}: {
  archetype: ArchetypeData
  scores: Record<string, number>
  archetypes: ArchetypeData[]
  onAccept: () => void
  onSeeAlternatives: () => void
}) {
  // Find the archetype key for display
  const archetypeKey = Object.entries(ARCHETYPE_NAME_MAP).find(
    ([, name]) => name === archetype.name
  )?.[0] as ArchetypeKey | undefined

  const pct = archetypeKey ? resonancePercent(archetypeKey, scores) : 0

  return (
    <div className="space-y-6">
      <GMVoiceBar
        voice="architect"
        line="The pattern is clear. Your choices point toward a particular way of moving in the world."
      />

      <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Your Archetype</p>
            <h2 className="text-2xl font-bold text-zinc-100">{archetype.name}</h2>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-zinc-600 font-mono">Resonance</p>
            <p className="text-xl font-bold text-indigo-400">{pct}%</p>
          </div>
        </div>
        {archetype.primaryQuestion && (
          <p className="text-zinc-400 italic text-sm">&ldquo;{archetype.primaryQuestion}&rdquo;</p>
        )}
        <p className="text-zinc-300 text-sm leading-relaxed">{archetype.description}</p>
        {(archetype.vibe || archetype.energy) && (
          <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-600">
            {archetype.vibe && <span><span className="text-zinc-500">Vibe:</span> {archetype.vibe}</span>}
            {archetype.energy && <span><span className="text-zinc-500">Energy:</span> {archetype.energy}</span>}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          This is me &rarr;
        </button>
        <button
          onClick={onSeeAlternatives}
          className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 px-5 py-3 rounded-lg text-sm transition-colors"
        >
          See alternatives
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Archetype alternatives
// ---------------------------------------------------------------------------

function ArchetypeAlternatives({
  scores,
  archetypes,
  onSelect,
}: {
  scores: Record<string, number>
  archetypes: ArchetypeData[]
  onSelect: (a: ArchetypeData) => void
}) {
  const ranked = rankByScore(scores).slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-100">Your top resonances</h2>
        <p className="text-zinc-400 text-sm">Choose the archetype that fits you best.</p>
      </div>

      <div className="space-y-3">
        {ranked.map(({ key, score }, i) => {
          const name = ARCHETYPE_NAME_MAP[key as ArchetypeKey]
          const archetype = archetypes.find((a) => a.name === name)
          if (!archetype) return null
          const pct = resonancePercent(key, scores)
          return (
            <button
              key={key}
              onClick={() => onSelect(archetype)}
              className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {i === 0 && <span className="text-indigo-400 text-xs font-mono">TOP MATCH</span>}
                  <span className="font-semibold text-zinc-100">{archetype.name}</span>
                </div>
                <span className="text-indigo-300 text-sm font-mono">{pct}%</span>
              </div>
              {archetype.primaryQuestion && (
                <p className="text-zinc-500 text-xs italic">&ldquo;{archetype.primaryQuestion}&rdquo;</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Archetype moves
// ---------------------------------------------------------------------------

function ArchetypeMoves({
  archetype,
  selected,
  onToggle,
  onNext,
  loading,
}: {
  archetype: ArchetypeData
  selected: string[]
  onToggle: (key: string) => void
  onNext: () => void
  loading: boolean
}) {
  const moves: Array<{ key: string; label: string; description: string }> = []
  if (archetype.wakeUp) moves.push({ key: 'wakeUp', label: 'Wake Up', description: archetype.wakeUp })
  if (archetype.cleanUp) moves.push({ key: 'cleanUp', label: 'Clean Up', description: archetype.cleanUp })
  if (archetype.growUp) moves.push({ key: 'growUp', label: 'Grow Up', description: archetype.growUp })
  if (archetype.showUp) moves.push({ key: 'showUp', label: 'Show Up', description: archetype.showUp })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Archetype Moves</p>
        <h2 className="text-xl font-bold text-zinc-100">Choose 2 moves</h2>
        <p className="text-zinc-400 text-sm">
          As <span className="text-zinc-200">{archetype.name}</span>, these define how you act in the world.
        </p>
      </div>

      <GMVoiceBar
        voice="diplomat"
        line="Each move is a capacity you carry. Choose the two that feel most alive in you right now."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {moves.map((move) => {
          const isSelected = selected.includes(move.key)
          const isDisabled = !isSelected && selected.length >= 2
          return (
            <button
              key={move.key}
              onClick={() => onToggle(move.key)}
              disabled={isDisabled}
              className={`text-left p-5 rounded-xl border transition-all space-y-2 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                  : isDisabled
                  ? 'border-zinc-800 bg-zinc-900/50 opacity-40 cursor-not-allowed'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">{move.label}</span>
                {isSelected && <span className="text-indigo-400 text-xs">&#10003;</span>}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">{move.description}</p>
            </button>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selected.length < 2 || loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        {loading ? 'Loading...' : 'Continue \u2192'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Nation discovery
// ---------------------------------------------------------------------------

function NationDiscovery({
  question,
  totalQuestions,
  currentIndex,
  onChoice,
  loading,
}: {
  question: (typeof NATION_QUESTIONS)[0]
  totalQuestions: number
  currentIndex: number
  onChoice: (key: string) => void
  loading: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Nation Discovery</p>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full ${
                i < currentIndex ? 'bg-emerald-500' : i === currentIndex ? 'bg-emerald-400' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      <GMVoiceBar
        voice="shaman"
        line="Every person belongs to a current. Let's find yours."
      />

      <p className="text-zinc-100 text-lg font-medium leading-relaxed">{question.prompt}</p>

      <div className="space-y-3">
        {question.choices.map((choice) => (
          <button
            key={choice.key}
            onClick={() => !loading && onChoice(choice.key)}
            disabled={loading}
            className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all text-zinc-300 text-sm leading-relaxed disabled:opacity-50"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Nation moves
// ---------------------------------------------------------------------------

function NationMoves({
  nationName,
  moves,
  selected,
  onToggle,
  onNext,
}: {
  nationName: string | null
  moves: NationMoveData[]
  selected: string[]
  onToggle: (id: string) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Nation Moves</p>
        <h2 className="text-xl font-bold text-zinc-100">Choose 2 moves</h2>
        {nationName && (
          <p className="text-zinc-400 text-sm">
            From <span className="text-emerald-400">{nationName}</span>
          </p>
        )}
      </div>

      {moves.length === 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6">
          <p className="text-zinc-500 text-sm">No nation moves configured yet. You can continue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {moves.map((move) => {
            const isSelected = selected.includes(move.id)
            const isDisabled = !isSelected && selected.length >= 2
            return (
              <button
                key={move.id}
                onClick={() => onToggle(move.id)}
                disabled={isDisabled}
                className={`text-left p-5 rounded-xl border transition-all space-y-2 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                    : isDisabled
                    ? 'border-zinc-800 bg-zinc-900/50 opacity-40 cursor-not-allowed'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    {nationName ?? 'Nation'}
                  </span>
                  {isSelected && <span className="text-emerald-400 text-xs">&#10003;</span>}
                </div>
                <p className="text-zinc-200 text-sm font-medium">{move.name}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{move.description}</p>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={moves.length > 0 && selected.length < 2}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Continue &rarr;
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Community relationship
// ---------------------------------------------------------------------------

function StoryCommunity({
  selected,
  onSelect,
  onNext,
}: {
  selected: string
  onSelect: (key: string) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Your Story</p>
        <h2 className="text-xl font-bold text-zinc-100">Community</h2>
      </div>

      <GMVoiceBar
        voice="diplomat"
        line="Before we go deeper, I want to understand how you arrived here — in this community, in this work."
      />

      <p className="text-zinc-300 text-sm leading-relaxed font-medium">
        My relationship to this community is...
      </p>

      <div className="space-y-3">
        {COMMUNITY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className={`w-full text-left p-4 rounded-xl border transition-all text-sm leading-relaxed ${
              selected === opt.key
                ? 'border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/30 text-zinc-200'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-zinc-400'
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!selected}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Continue &rarr;
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Dreams
// ---------------------------------------------------------------------------

function StoryDreams({
  answers,
  onChange,
  onNext,
}: {
  answers: Record<string, string>
  onChange: (qId: string, val: string) => void
  onNext: () => void
}) {
  const allAnswered = DREAM_QUESTIONS.every((q) => (answers[q.id] ?? '').trim().length > 0)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Your Story</p>
        <h2 className="text-xl font-bold text-zinc-100">Dreams &amp; Goals</h2>
      </div>

      <GMVoiceBar
        voice="sage"
        line="These questions aren't about strategy. They're about what you're actually hoping for."
      />

      <div className="space-y-5">
        {DREAM_QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">{q.text}</label>
            <textarea
              value={answers[q.id] ?? ''}
              onChange={(e) => onChange(q.id, e.target.value)}
              rows={2}
              placeholder="Write your answer..."
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-4 py-3 text-zinc-200 text-sm placeholder-zinc-600 outline-none transition-colors resize-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!allAnswered}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Continue &rarr;
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Fears
// ---------------------------------------------------------------------------

function StoryFears({
  choices,
  onToggle,
  onPersonalize,
  onComplete,
  saving,
  saveError,
}: {
  choices: FearChoice[]
  onToggle: (beliefId: string, original: string) => void
  onPersonalize: (beliefId: string, personalized: string) => void
  onComplete: () => void
  saving: boolean
  saveError: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Your Story</p>
        <h2 className="text-xl font-bold text-zinc-100">The fears you carry</h2>
        <p className="text-zinc-400 text-sm">Select up to 3 that resonate. You can reword them in your own language.</p>
      </div>

      <GMVoiceBar
        voice="challenger"
        line="These aren't weaknesses — they're the specific gravity that makes your archetype matter. Name them."
      />

      <div className="space-y-3">
        {FEAR_BELIEFS.map((belief) => {
          const chosen = choices.find((c) => c.beliefId === belief.id)
          const isSelected = !!chosen
          const isDisabled = !isSelected && choices.length >= 3

          return (
            <div key={belief.id} className="space-y-2">
              <button
                onClick={() => onToggle(belief.id, belief.text)}
                disabled={isDisabled}
                className={`w-full text-left p-4 rounded-xl border transition-all text-sm leading-relaxed ${
                  isSelected
                    ? 'border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20 text-zinc-200'
                    : isDisabled
                    ? 'border-zinc-800 bg-zinc-900/50 opacity-40 cursor-not-allowed text-zinc-500'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-zinc-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-xs ${isSelected ? 'text-red-400' : 'text-zinc-700'}`}>
                    {isSelected ? '&#10003;' : '&#9675;'}
                  </span>
                  {belief.text}
                </div>
              </button>

              {isSelected && (
                <div className="ml-4">
                  <input
                    type="text"
                    value={chosen?.personalized ?? ''}
                    onChange={(e) => onPersonalize(belief.id, e.target.value)}
                    placeholder="In your own words (optional)..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-zinc-300 text-xs placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {saveError && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4 text-red-400 text-sm">
          {saveError}
        </div>
      )}

      <button
        onClick={onComplete}
        disabled={saving || choices.length === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        {saving ? 'Saving...' : 'Complete Character \u2192'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene: Complete
// ---------------------------------------------------------------------------

function CharacterComplete({
  shareToken,
  archetypeName,
}: {
  shareToken: string
  archetypeName: string
}) {
  return (
    <div className="space-y-8">
      <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-8 text-center space-y-4">
        <div className="text-4xl">&#10022;</div>
        <h2 className="text-2xl font-bold text-emerald-300">Character Created</h2>
        <p className="text-zinc-400">
          You are <strong className="text-zinc-200">{archetypeName}</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href={`/character/${shareToken}`}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View character card &rarr;
          </Link>
          <Link
            href="/"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
      <div className="text-center">
        <p className="text-zinc-600 text-xs font-mono">
          Share: /character/{shareToken}
        </p>
      </div>
    </div>
  )
}

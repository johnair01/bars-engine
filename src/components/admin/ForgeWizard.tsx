'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DISSATISFACTION,
  DISTORTION_THRESHOLD,
  FORGE_STAGES,
  ROUTING_TARGETS,
  SATISFACTION_APEX,
  SELF_SABOTAGE,
  type ForgeStage,
} from '@/lib/forge-types'

type EligibilityState =
  | { status: 'loading' }
  | { status: 'eligible' }
  | { status: 'blocked'; reason: string }

const STAGE_LABELS: Record<ForgeStage, string> = {
  THIRD_PERSON: 'Stage 3 — Third Person',
  SECOND_PERSON: 'Stage 2 — Second Person',
  FIRST_PERSON: 'Stage 1 — First Person',
  FRICTION_REASSESS: 'Friction Reassess',
  ROUTING: 'Routing',
  COMPLETE: 'Complete',
}

export function ForgeWizard() {
  const [eligibility, setEligibility] = useState<EligibilityState>({ status: 'loading' })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stage, setStage] = useState<ForgeStage>('THIRD_PERSON')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [completed, setCompleted] = useState(false)

  const checkEligibility = useCallback(async () => {
    setEligibility({ status: 'loading' })
    setError(null)
    try {
      const res = await fetch('/api/admin/forge/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distortionIntensity: DISTORTION_THRESHOLD }),
      })
      const data = (await res.json()) as
        | { eligible: true }
        | { eligible: false; reason: string; message: string }
        | { error: string }
      if (!res.ok) {
        setEligibility({ status: 'blocked', reason: (data as { error: string }).error ?? 'Check failed' })
        return
      }
      if ('eligible' in data && data.eligible) {
        setEligibility({ status: 'eligible' })
      } else {
        const d = data as { message?: string; reason?: string }
        setEligibility({ status: 'blocked', reason: d.message ?? d.reason ?? 'Not eligible' })
      }
    } catch (e) {
      setEligibility({ status: 'blocked', reason: e instanceof Error ? e.message : 'Check failed' })
    }
  }, [])

  useEffect(() => {
    if (!sessionId) checkEligibility()
  }, [sessionId, checkEligibility])

  const handleStart = async (frictionStart?: number) => {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/forge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frictionStart }),
      })
      const data = (await res.json()) as { sessionId?: string; error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? 'Failed to start')
        return
      }
      if (data.sessionId) {
        setSessionId(data.sessionId)
        setStage('THIRD_PERSON')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start')
    } finally {
      setPending(false)
    }
  }

  const handleAdvance = async (payload: Record<string, unknown>) => {
    if (!sessionId) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/forge/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? 'Failed to advance')
        return
      }
      const idx = FORGE_STAGES.indexOf(stage)
      if (idx >= 0 && idx < FORGE_STAGES.length - 1) {
        setStage(FORGE_STAGES[idx + 1])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to advance')
    } finally {
      setPending(false)
    }
  }

  const handleComplete = async (routing?: Record<string, unknown>) => {
    if (!sessionId) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/forge/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routing ?? {}),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? 'Failed to complete')
        return
      }
      setCompleted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete')
    } finally {
      setPending(false)
    }
  }

  if (eligibility.status === 'loading') {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-400">Checking eligibility…</p>
      </div>
    )
  }

  if (eligibility.status === 'blocked') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-6">
          <h3 className="font-medium text-amber-200">Forge not available</h3>
          <p className="mt-2 text-sm text-zinc-400">{eligibility.reason}</p>
        </div>
        <button
          type="button"
          onClick={checkEligibility}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Check again
        </button>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="font-medium text-zinc-200">Agent Forge (3-2-1 Shadow Process)</h3>
          <p className="mt-2 text-sm text-zinc-400">
            You are eligible. Start a Forge session to externalize a part, unpack it, and reclaim intent. Optionally
            capture your friction level (0–10) at the start.
          </p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleStart()}
            disabled={pending}
            className="rounded-lg border border-purple-600 bg-purple-900/40 px-4 py-2 font-medium text-purple-200 hover:bg-purple-900/60 disabled:opacity-50"
          >
            {pending ? 'Starting…' : 'Start Forge'}
          </button>
          <button
            type="button"
            onClick={() => handleStart(5)}
            disabled={pending}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700 disabled:opacity-50"
          >
            Start with friction 5
          </button>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-6">
          <h3 className="font-medium text-emerald-200">Forge complete</h3>
          <p className="mt-2 text-sm text-zinc-400">Session finalized. Cooldown has started.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSessionId(null)
            setStage('THIRD_PERSON')
            setCompleted(false)
            checkEligibility()
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Start another (check eligibility first)
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        Stage {FORGE_STAGES.indexOf(stage) + 1} of {FORGE_STAGES.length - 1}: {STAGE_LABELS[stage]}
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <StagePanel
        stage={stage}
        pending={pending}
        onAdvance={handleAdvance}
        onComplete={handleComplete}
      />
    </div>
  )
}

type StagePanelProps = {
  stage: ForgeStage
  pending: boolean
  onAdvance: (payload: Record<string, unknown>) => Promise<void>
  onComplete: (routing?: Record<string, unknown>) => Promise<void>
}

function StagePanel({ stage, pending, onAdvance, onComplete }: StagePanelProps) {
  if (stage === 'THIRD_PERSON') {
    return (
      <ThirdPersonPanel
        pending={pending}
        onSubmit={(d) => onAdvance({ stage: 'SECOND_PERSON', ...d })}
      />
    )
  }
  if (stage === 'SECOND_PERSON') {
    return (
      <SecondPersonPanel
        pending={pending}
        onSubmit={(d) => onAdvance({ stage: 'FIRST_PERSON', ...d })}
      />
    )
  }
  if (stage === 'FIRST_PERSON') {
    return (
      <FirstPersonPanel
        pending={pending}
        onSubmit={(d) => onAdvance({ stage: 'FRICTION_REASSESS', ...d })}
      />
    )
  }
  if (stage === 'FRICTION_REASSESS') {
    return (
      <FrictionPanel
        pending={pending}
        onSubmit={(d) => onAdvance({ stage: 'ROUTING', ...d })}
      />
    )
  }
  if (stage === 'ROUTING') {
    return (
      <RoutingPanel
        pending={pending}
        onSubmit={(r) => onComplete(r)}
      />
    )
  }
  return null
}

function ThirdPersonPanel({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (d: { partDescription?: string; triggerContext?: string; observedPattern?: string }) => void
}) {
  const [partDescription, setPartDescription] = useState('')
  const [triggerContext, setTriggerContext] = useState('')
  const [observedPattern, setObservedPattern] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ partDescription, triggerContext, observedPattern })
      }}
    >
      <div>
        <label className="block text-sm font-medium text-zinc-400">Describe the part in third person</label>
        <textarea
          value={partDescription}
          onChange={(e) => setPartDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
          placeholder="When does it show up? What does it do?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400">Trigger context</label>
        <textarea
          value={triggerContext}
          onChange={(e) => setTriggerContext(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400">Observed pattern</label>
        <textarea
          value={observedPattern}
          onChange={(e) => setObservedPattern(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !partDescription.trim()}
        className="rounded-lg border border-purple-600 bg-purple-900/40 px-4 py-2 text-purple-200 hover:bg-purple-900/60 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Continue to Stage 2'}
      </button>
    </form>
  )
}

function SecondPersonPanel({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (d: Record<string, string | undefined>) => void
}) {
  const [desiredExperience, setDesiredExperience] = useState('')
  const [desiredSatisfaction, setDesiredSatisfaction] = useState('')
  const [currentGameState, setCurrentGameState] = useState('')
  const [currentDissatisfaction, setCurrentDissatisfaction] = useState('')
  const [underlyingBelief, setUnderlyingBelief] = useState('')
  const [sabotageBelief, setSabotageBelief] = useState('')

  const questions = [
    { key: 'desiredExperience', label: 'What experience are you trying to create?', value: desiredExperience, set: setDesiredExperience },
    { key: 'desiredSatisfaction', label: 'How will you feel when you get it?', value: desiredSatisfaction, set: setDesiredSatisfaction, options: SATISFACTION_APEX },
    { key: 'currentGameState', label: 'What is life like right now?', value: currentGameState, set: setCurrentGameState },
    { key: 'currentDissatisfaction', label: 'How does it feel to live here?', value: currentDissatisfaction, set: setCurrentDissatisfaction, options: DISSATISFACTION },
    { key: 'underlyingBelief', label: 'What would have to be true for someone to feel this thought?', value: underlyingBelief, set: setUnderlyingBelief },
    { key: 'sabotageBelief', label: 'What reservations do you have about your creation?', value: sabotageBelief, set: setSabotageBelief, options: SELF_SABOTAGE },
  ]

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          desiredExperience: desiredExperience || undefined,
          desiredSatisfaction: desiredSatisfaction || undefined,
          currentGameState: currentGameState || undefined,
          currentDissatisfaction: currentDissatisfaction || undefined,
          underlyingBelief: underlyingBelief || undefined,
          sabotageBelief: sabotageBelief || undefined,
        })
      }}
    >
      {questions.map((q) => (
        <div key={q.key}>
          <label className="block text-sm font-medium text-zinc-400">{q.label}</label>
          {q.options ? (
            <select
              value={q.value}
              onChange={(e) => q.set(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
            >
              <option value="">—</option>
              {q.options.map((o) => (
                <option key={o} value={o}>
                  {o.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              value={q.value}
              onChange={(e) => q.set(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-purple-600 bg-purple-900/40 px-4 py-2 text-purple-200 hover:bg-purple-900/60 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Continue to Stage 1'}
      </button>
    </form>
  )
}

function FirstPersonPanel({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (d: { firstPersonVoice?: string; reclaimedIntent?: string; alignedStep?: string }) => void
}) {
  const [firstPersonVoice, setFirstPersonVoice] = useState('')
  const [reclaimedIntent, setReclaimedIntent] = useState('')
  const [alignedStep, setAlignedStep] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ firstPersonVoice, reclaimedIntent, alignedStep })
      }}
    >
      <div>
        <label className="block text-sm font-medium text-zinc-400">Speak as the part in first person (begin with &quot;I…&quot;)</label>
        <textarea
          value={firstPersonVoice}
          onChange={(e) => setFirstPersonVoice(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
          placeholder="I…"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400">Reclaimed intent</label>
        <textarea
          value={reclaimedIntent}
          onChange={(e) => setReclaimedIntent(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400">
          One aligned step to overcome these reservations (executable within 72 hours, must reduce avoidance)
        </label>
        <textarea
          value={alignedStep}
          onChange={(e) => setAlignedStep(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !alignedStep.trim()}
        className="rounded-lg border border-purple-600 bg-purple-900/40 px-4 py-2 text-purple-200 hover:bg-purple-900/60 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Continue to Friction Reassess'}
      </button>
    </form>
  )
}

function FrictionPanel({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (d: { frictionEnd: number }) => void
}) {
  const [frictionEnd, setFrictionEnd] = useState(5)

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ frictionEnd })
      }}
    >
      <div>
        <label className="block text-sm font-medium text-zinc-400">
          Friction level now (0–10). Delta from start determines vibeulon mint.
        </label>
        <input
          type="range"
          min={0}
          max={10}
          value={frictionEnd}
          onChange={(e) => setFrictionEnd(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <span className="ml-2 text-sm text-zinc-400">{frictionEnd}</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-purple-600 bg-purple-900/40 px-4 py-2 text-purple-200 hover:bg-purple-900/60 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Continue to Routing'}
      </button>
    </form>
  )
}

function RoutingPanel({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (r: Record<string, unknown>) => void
}) {
  const [outputType, setOutputType] = useState<'NEW_AGENT' | 'APPEND_EXISTING'>('NEW_AGENT')
  const [routingTargetType, setRoutingTargetType] = useState('')
  const [routingTargetId, setRoutingTargetId] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          outputType,
          routingTargetType: routingTargetType || undefined,
          routingTargetId: routingTargetId || undefined,
        })
      }}
    >
      <div>
        <label className="block text-sm font-medium text-zinc-400">Output type</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="outputType"
              value="NEW_AGENT"
              checked={outputType === 'NEW_AGENT'}
              onChange={() => setOutputType('NEW_AGENT')}
            />
            <span>New agent</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="outputType"
              value="APPEND_EXISTING"
              checked={outputType === 'APPEND_EXISTING'}
              onChange={() => setOutputType('APPEND_EXISTING')}
            />
            <span>Append to existing</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400">Routing target type (required if vibeulon minted)</label>
        <select
          value={routingTargetType}
          onChange={(e) => setRoutingTargetType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
        >
          <option value="">—</option>
          {ROUTING_TARGETS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400">Routing target ID</label>
        <input
          type="text"
          value={routingTargetId}
          onChange={(e) => setRoutingTargetId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
          placeholder="e.g. nation or archetype ID"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-purple-600 bg-purple-900/40 px-4 py-2 text-purple-200 hover:bg-purple-900/60 disabled:opacity-50"
      >
        {pending ? 'Completing…' : 'Complete Forge'}
      </button>
    </form>
  )
}

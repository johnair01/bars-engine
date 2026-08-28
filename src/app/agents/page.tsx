'use client'

/**
 * @page /agents
 * @entity SYSTEM
 * @description Agent console for consulting the 6 Game Master Sects (Architect, Challenger, Shaman, Regent, Diplomat, Sage)
 * @permissions authenticated
 * @relationships NPC (agent archetypes)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:agent consultation, WHERE:agent console, ENERGY:agent response
 * @example /agents
 * @agentDiscoverable false
 */

import { useState } from 'react'
import {
  consultArchitect,
  consultChallenger,
  consultShaman,
  consultRegent,
  consultDiplomat,
  consultSage,
  createAgentMind,
  stepAgentMind,
  type AgentResponse,
  type AgentMindState,
} from '@/lib/agents'
import { FACE_LINE } from '@/lib/iching-struct'

type AgentKey = 'architect' | 'challenger' | 'shaman' | 'regent' | 'diplomat' | 'sage'

/**
 * Colours follow the canonical Spiral Dynamics sequence in
 * `lib/school/big-schools.ts` and `lib/campaign-hub/growth-stage.ts`:
 * Shaman Magenta → Challenger Red → Regent Amber → Architect Orange →
 * Diplomat Green → Sage Teal. Regent read Blue here and Architect held Amber's
 * hex; corrected 2026-08-27.
 *
 * The `line` is the face's classical position in a figure, from
 * `lib/iching-struct.ts`. It replaces a per-face trigram, which mapped six faces
 * onto six of the eight trigrams and left Water and Thunder with none — a face
 * has an expression at every trigram, so no single one belongs to it.
 */
const LINE_ROLE: Record<number, string> = {
  1: 'the beginning, below and hidden',
  2: 'the officer in the field',
  3: 'the exposed transition',
  4: 'the minister, next to power',
  5: "the ruler's place",
  6: 'past the situation',
}

const AGENTS: { key: AgentKey; name: string; sect: string; color: string; placeholder: string }[] = [
  { key: 'architect', name: 'Architect', sect: 'Orange/Strategy', color: '#f97316', placeholder: 'Enter a narrative lock (e.g., "I am afraid to share my work")...' },
  { key: 'challenger', name: 'Challenger', sect: 'Red/Power', color: '#ef4444', placeholder: 'Quest ID for context (optional, leave blank for general)...' },
  { key: 'shaman', name: 'Shaman', sect: 'Magenta/Mythic', color: '#a855f7', placeholder: 'What are you feeling? Describe your emotional state...' },
  { key: 'regent', name: 'Regent', sect: 'Amber/Order', color: '#f59e0b', placeholder: 'Campaign instance ID to assess...' },
  { key: 'diplomat', name: 'Diplomat', sect: 'Green/Care', color: '#22c55e', placeholder: 'No input needed — the Diplomat reads your state...' },
  { key: 'sage', name: 'Sage', sect: 'Teal/Integration', color: '#14b8a6', placeholder: 'Ask the Sage anything — it will route to specialists...' },
]

export default function AgentConsolePage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('architect')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AgentResponse<unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mind, setMind] = useState<AgentMindState | null>(null)

  const agent = AGENTS.find(a => a.key === selectedAgent)!

  async function handleConsult() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let response: AgentResponse<unknown>
      switch (selectedAgent) {
        case 'architect':
          response = await consultArchitect(input || 'I want to grow')
          break
        case 'challenger':
          response = await consultChallenger(input || undefined)
          break
        case 'shaman':
          response = await consultShaman(input || undefined)
          break
        case 'regent':
          response = await consultRegent(input || 'default-instance')
          break
        case 'diplomat':
          response = await consultDiplomat()
          break
        case 'sage':
          response = await consultSage(input || 'What should I focus on?')
          break
      }
      setResult(response)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMind() {
    try {
      const m = await createAgentMind({
        nation: 'Argyra',
        archetype: 'Bold Heart',
        goal: 'Share my creative work',
        narrative_lock: 'Fear of judgment',
        energy: 0.4,
      })
      setMind(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create mind')
    }
  }

  async function handleStepMind() {
    if (!mind) return
    try {
      const m = await stepAgentMind(mind.agent_id)
      setMind(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to step mind')
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'var(--font-geist-mono)' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Agent Console</h1>
      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.875rem' }}>
        6 Game Master Sects — consult any agent directly
      </p>

      {/* Agent selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {AGENTS.map(a => (
          <button
            key={a.key}
            onClick={() => { setSelectedAgent(a.key); setResult(null); setError(null) }}
            style={{
              padding: '0.5rem 1rem',
              border: selectedAgent === a.key ? `2px solid ${a.color}` : '1px solid #333',
              borderRadius: '0.5rem',
              background: selectedAgent === a.key ? `${a.color}22` : '#111',
              color: selectedAgent === a.key ? a.color : '#aaa',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {a.name}
            <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.6 }}>{a.sect}</span>
          </button>
        ))}
      </div>

      {/* Input + submit */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: agent.color, marginBottom: '0.25rem' }}>
          line {FACE_LINE[agent.key]} — {LINE_ROLE[FACE_LINE[agent.key]]} · {agent.sect}
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={agent.placeholder}
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#0a0a0a',
            border: `1px solid ${agent.color}44`,
            borderRadius: '0.5rem',
            color: '#eee',
            fontSize: '0.875rem',
            resize: 'vertical',
          }}
        />
        <button
          onClick={handleConsult}
          disabled={loading}
          style={{
            marginTop: '0.5rem',
            padding: '0.6rem 1.5rem',
            background: agent.color,
            color: '#000',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {loading ? 'Consulting...' : `Consult ${agent.name}`}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.75rem', background: '#3a1111', border: '1px solid #f44', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#faa' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginBottom: '2rem' }}>
          {/* Metadata bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem' }}>
            <span>Agent: <strong style={{ color: agent.color }}>{result.agent}</strong></span>
            {result.discerned_move && <span>WAVE: <strong>{result.discerned_move.replace('_', ' ')}</strong></span>}
            {result.deterministic && <span style={{ color: '#f59e0b' }}>deterministic fallback</span>}
            {result.usage_tokens && <span>Tokens: {result.usage_tokens}</span>}
          </div>
          {result.legibility_note && (
            <div style={{ fontSize: '0.75rem', color: '#aaa', fontStyle: 'italic', marginBottom: '0.75rem' }}>
              {result.legibility_note}
            </div>
          )}
          <pre style={{
            padding: '1rem',
            background: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '0.5rem',
            overflow: 'auto',
            fontSize: '0.75rem',
            color: '#ccc',
            lineHeight: 1.5,
          }}>
            {JSON.stringify(result.output, null, 2)}
          </pre>
        </div>
      )}

      {/* Agent Mind Model */}
      <div style={{ borderTop: '1px solid #222', paddingTop: '1.5rem', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Agent Mind Model</h2>
        <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '1rem' }}>
          Create a simulated agent and step through its decision loop
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleCreateMind}
            style={{ padding: '0.5rem 1rem', background: '#333', color: '#eee', border: '1px solid #555', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Create Mind
          </button>
          {mind && (
            <button
              onClick={handleStepMind}
              style={{ padding: '0.5rem 1rem', background: '#333', color: '#eee', border: '1px solid #555', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Step
            </button>
          )}
        </div>
        {mind && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#ccc', marginBottom: '0.5rem' }}>
              <span>ID: {mind.agent_id}</span>
              <span>Nation: {mind.nation}</span>
              <span>Archetype: {mind.archetype}</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              <span>Emotion: <strong style={{ color: mind.emotional_state === 'joy' ? '#22c55e' : mind.emotional_state === 'sadness' ? '#3b82f6' : '#888' }}>{mind.emotional_state}</strong></span>
              <span>Energy: <strong>{mind.energy}</strong></span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>
              Goal: {mind.goal} | Lock: {mind.narrative_lock}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

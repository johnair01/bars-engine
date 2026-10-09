'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { editLensGoal } from '@/actions/lens-goals'
import type { ObservatoryGoal } from '@/actions/observatory'

const mono = 'var(--bars-font-mono)'
const body = 'var(--bars-font-body)'

const smallBtn = {
  fontFamily: mono,
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  minHeight: 32,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--bars-line)',
  background: 'transparent',
  color: 'var(--bars-text-secondary)',
}

/** Rename, park or retire one goal at a time, without reopening the intake. */
export function LensGoalList({ goals }: { goals: ObservatoryGoal[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (goals.length === 0) return null

  const run = (goalId: string, action: 'rename' | 'park' | 'resume' | 'retire', title?: string) => {
    setError(null)
    startTransition(async () => {
      const res = await editLensGoal({ goalId, action, title })
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      setEditing(null)
      router.refresh()
    })
  }

  return (
    <div style={{ marginTop: 22 }}>
      <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', marginBottom: 10 }}>
        Goals at this level
      </p>
      {error && <p style={{ fontFamily: body, fontSize: 12.5, color: '#e05c2e', margin: '0 0 8px' }}>{error}</p>}
      <div className="flex flex-col gap-2">
        {goals.map((goal) => (
          <div key={goal.id} style={{ padding: 12, borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', opacity: goal.status === 'parked' ? 0.7 : 1 }}>
            <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: 0 }}>
              {goal.domain}{goal.status === 'parked' ? ' · parked' : ''}
            </p>
            {editing === goal.id ? (
              <div style={{ marginTop: 6 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label="Goal name"
                  style={{ width: '100%', minHeight: 44, border: '1px solid var(--bars-line)', borderRadius: 8, background: 'var(--bars-surface-inset)', padding: '0 12px', fontFamily: body, fontSize: 14, color: 'var(--bars-text-primary)', outline: 'none' }}
                />
                <div className="flex gap-2" style={{ marginTop: 8 }}>
                  <button type="button" disabled={pending} style={smallBtn} onClick={() => run(goal.id, 'rename', draft)}>Save</button>
                  <button type="button" disabled={pending} style={smallBtn} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: body, fontSize: 14, color: 'var(--bars-text-primary)', margin: '4px 0 0' }}>{goal.title}</p>
                <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
                  <button type="button" disabled={pending} style={smallBtn} onClick={() => { setEditing(goal.id); setDraft(goal.title) }}>Rename</button>
                  <button type="button" disabled={pending} style={smallBtn} onClick={() => run(goal.id, goal.status === 'parked' ? 'resume' : 'park')}>
                    {goal.status === 'parked' ? 'Resume' : 'Park'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    style={smallBtn}
                    onClick={() => { if (window.confirm('Retire this goal? It leaves your active goals.')) run(goal.id, 'retire') }}
                  >
                    Retire
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

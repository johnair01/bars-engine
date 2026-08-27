'use client'

import { useState, useTransition } from 'react'

import { updateShowUpHandoffContact, withdrawShowUpHandoff } from '@/actions/mtgoa-show-up-handoff'

/**
 * The sender's two controls: change how you are reached, or withdraw.
 *
 * Withdrawal asks once before it fires. It deletes contact details rather than
 * flagging them, so there is nothing to undo afterwards, and the page says so
 * before the click rather than after it.
 */
export function SenderControls({
  token,
  withdrawn,
  hasContact,
  contact,
}: {
  token: string
  withdrawn: boolean
  hasContact: boolean
  contact: string
}) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [next, setNext] = useState(contact)
  const [done, setDone] = useState(withdrawn)

  const say = (result: { ok: true; message: string } | { ok: false; error: string }) => {
    if (result.ok) { setMessage(result.message); setError(null) } else { setError(result.error); setMessage(null) }
  }

  const fieldStyle = {
    width: '100%', marginTop: 10, padding: '13px 14px', borderRadius: 10, fontSize: 16, lineHeight: 1.55,
    fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)', background: 'var(--bars-surface-card)',
    border: '1px solid var(--bars-line-strong)',
  } as const

  const buttonStyle = (tone: 'solid' | 'outline') => ({
    fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 15, padding: '13px 20px', minHeight: 44,
    borderRadius: 'var(--bars-radius-lg)', cursor: pending ? 'progress' : 'pointer',
    color: tone === 'solid' ? '#fff' : 'var(--bars-text-secondary)',
    background: tone === 'solid' ? 'var(--bars-liminal)' : 'none',
    border: tone === 'solid' ? 'none' : '1px solid var(--bars-line-strong)',
    boxShadow: tone === 'solid' ? 'var(--bars-shadow-inset-top)' : 'none',
  }) as const

  if (done) {
    return (
      <div style={{ marginTop: 24, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', border: '1px dashed var(--bars-line-strong)' }}>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
          {message ?? 'This handoff is withdrawn. Your name and contact details are deleted, and it has left active campaign review.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      {hasContact ? (
        <div style={{ padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: '0 0 0 1px var(--bars-line)' }}>
          <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>how a steward reaches you</span>
          <input
            aria-label="Contact route"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Email or other contact route"
            style={fieldStyle}
          />
          <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
            Leaving this empty deletes your contact details and keeps the handoff.
          </p>
          <div style={{ marginTop: 13 }}>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => say(await updateShowUpHandoffContact(token, next)))}
              style={buttonStyle('solid')}
            >
              Save contact preference
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', border: '1px dashed var(--bars-line-strong)' }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
            You sent this anonymously, so the stewards hold the handoff alone. Withdrawing it stays yours to do.
          </p>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: '0 0 0 1px var(--bars-line)' }}>
        <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>withdraw this handoff</span>
        <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
          It leaves active campaign review, and your name and contact details are deleted immediately. The handoff stays in
          the record with nothing identifying you attached. This is permanent.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 13 }}>
          {confirming ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await withdrawShowUpHandoff(token)
                    say(result)
                    if (result.ok) setDone(true)
                  })
                }
                style={buttonStyle('solid')}
              >
                Yes, withdraw it
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} style={buttonStyle('outline')}>
                Keep it
              </button>
            </>
          ) : (
            <button type="button" disabled={pending} onClick={() => setConfirming(true)} style={buttonStyle('outline')}>
              Withdraw this handoff
            </button>
          )}
        </div>
      </div>

      {message ? (
        <p role="status" style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.55, color: '#6fc795', textWrap: 'pretty' }}>{message}</p>
      ) : null}
      {error ? (
        <p role="alert" style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.55, color: '#e8896f', textWrap: 'pretty' }}>{error}</p>
      ) : null}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'

import { submitShowUpHandoff } from '@/actions/mtgoa-show-up-handoff'
import {
  SHOW_UP_LIMITS,
  SHOW_UP_PLACEMENT_KINDS,
  SHOW_UP_STEWARD_REQUESTS,
  SHOW_UP_TERMS,
  showUpStewardRequest,
} from '@/lib/mtgoa-course/show-up-handoff'
import type { DayTenLane, DayTenPlacement } from '@/lib/mtgoa-course/day-ten'
import { BackLink, OutlineButton, PrivacyLine, Step, StepBody, StepEyebrow, StepTitle, mono } from './CheckKit'

/**
 * The one thing on Day 10 that can leave the device.
 *
 * Purple throughout, and only here: the covenant's primary-action colour is
 * doing double duty as the signal that this screen crosses a boundary the rest
 * of the day never crosses. Fire is the practice; purple is the send.
 *
 * The reader sees every field before it goes, editable, pre-filled from the lane
 * they built. Everything absent from this form is absent from the request — the
 * server parser accepts these fields and nothing else.
 */

const ACCENT = 'var(--bars-liminal-glow)'

export type SubmissionSeed = {
  title: string
  purpose: string
  nextAction: string
  owner: string
  terms: string
  returnPlan: string
}

export function DayTenStewardSubmission({
  seed,
  lane,
  placement,
  face,
  placementLearning,
  onBack,
}: {
  seed: SubmissionSeed
  lane: DayTenLane
  placement: DayTenPlacement
  face: string | null
  placementLearning: string
  onBack: () => void
}) {
  const [fields, setFields] = useState<SubmissionSeed>(seed)
  const [kind, setKind] = useState<string | null>(lane === 'local_team' ? null : 'calendar')
  const [request, setRequest] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [learning, setLearning] = useState(placementLearning)
  const [senderName, setSenderName] = useState('')
  const [senderContact, setSenderContact] = useState('')
  const [senderRegion, setSenderRegion] = useState('')
  const [website, setWebsite] = useState('')
  const [consent, setConsent] = useState(false)

  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const requestDef = showUpStewardRequest(request)
  const needsContact = !!requestDef?.contactRequired
  const canSend = !!request && (!needsContact || (senderName.trim() && senderContact.trim() && consent))
  const shared = lane === 'local_team'

  const fieldStyle = {
    width: '100%', marginTop: 9, padding: '13px 14px', borderRadius: 10, fontSize: 16, lineHeight: 1.55,
    fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)', background: 'var(--bars-surface-card)',
    border: '1px solid var(--bars-line-strong)', resize: 'vertical' as const,
  }

  const send = () =>
    start(async () => {
      setError(null)
      const result = await submitShowUpHandoff({
        campaignRef: 'mtgoa-book-launch',
        lane,
        placementState: placement,
        placementKind: kind,
        face,
        domain: 'SKILLFUL_ORGANIZING',
        title: fields.title,
        purpose: fields.purpose,
        nextAction: fields.nextAction,
        owner: fields.owner,
        terms: fields.terms,
        returnPlan: fields.returnPlan,
        stewardRequest: request,
        note,
        placementLearning: learning,
        senderName,
        senderContact,
        senderRegion,
        consentToContact: consent,
        website,
      })
      if (result.ok) setLink(result.link)
      else setError(result.error)
    })

  if (link) {
    const full = `masteringallyship.com${link}`
    return (
      <Step>
        <StepEyebrow color={ACCENT}>submitted to the campaign</StepEyebrow>
        <StepTitle size={29}>Your handoff is with the Campaign Steward.</StepTitle>
        <StepBody top={14}>
          It is private to the people stewarding this work. Your private course writing stayed here. A submission creates a
          role, task, or commitment only through a separate agreement made later.
        </StepBody>

        <div style={{ marginTop: 20, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px rgba(124,58,237,.45)' }}>
          <StepEyebrow color={ACCENT}>your handoff link · save this</StepEyebrow>
          <p style={{ ...mono, margin: '10px 0 0', fontSize: 13, lineHeight: 1.6, color: '#e8e6e0', wordBreak: 'break-all' }}>{full}</p>
          <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
            {SHOW_UP_TERMS.withdrawal}
          </p>
          <div style={{ marginTop: 12 }}>
            <OutlineButton
              onClick={() => {
                navigator.clipboard?.writeText(`https://${full}`)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1800)
              }}
            >
              {copied ? 'copied ♦' : 'copy my handoff link'}
            </OutlineButton>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <OutlineButton onClick={onBack} block strong>Back to my Day 10 receipt →</OutlineButton>
        </div>
        <PrivacyLine>{SHOW_UP_TERMS.retention}</PrivacyLine>
      </Step>
    )
  }

  return (
    <Step>
      <BackLink onClick={onBack} />
      <StepEyebrow color={ACCENT}>review what you are sharing</StepEyebrow>
      <StepTitle size={27}>Nothing leaves this device until you send it.</StepTitle>

      <div style={{ marginTop: 16, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid var(--bars-liminal)` }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>{SHOW_UP_TERMS.visibility}</p>
        <p style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>{SHOW_UP_TERMS.response}</p>
        <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>{SHOW_UP_TERMS.retention}</p>
      </div>

      <span className="bars-label" style={{ display: 'block', marginTop: 26, color: 'var(--bars-text-muted)' }}>1 · the handoff being shared</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 12 }}>
        {([
          ['title', 'title / short label', 'A short name for this handoff'],
          ['purpose', 'purpose', 'This exists so that…'],
          ['nextAction', 'next action', 'The next action is…'],
          ['owner', 'owner', 'me'],
          ['terms', 'terms / permission boundary', 'Optional… / ask first before…'],
          ['returnPlan', 'return date or rhythm', 'We will come back on…'],
        ] as const).map(([key, label, placeholder]) => (
          <div key={key} style={{ padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}>
            <label className="bars-label" htmlFor={`sub-${key}`} style={{ display: 'block', color: ACCENT }}>{label}</label>
            <textarea
              id={`sub-${key}`}
              rows={2}
              value={fields[key]}
              placeholder={placeholder}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              style={fieldStyle}
            />
          </div>
        ))}

        <div style={{ padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}>
          <span className="bars-label" style={{ display: 'block', color: ACCENT }}>where it is placed</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 11 }}>
            {SHOW_UP_PLACEMENT_KINDS.map((k) => {
              const on = kind === k.key
              return (
                <button
                  key={k.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setKind(on ? null : k.key)}
                  style={{
                    ...mono, fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase', padding: '12px 14px',
                    minHeight: 44, borderRadius: 9, cursor: 'pointer',
                    color: on ? '#fff' : 'var(--bars-text-secondary)',
                    background: on ? 'var(--bars-liminal)' : 'var(--bars-surface-inset)',
                    border: `1px solid ${on ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
                  }}
                >
                  {k.label}
                </button>
              )
            })}
          </div>
          <p style={{ ...mono, margin: '11px 0 0', fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            state: {placement} · lane: {shared ? 'Shared Work Handoff' : 'Allyship Rhythm'}
            {face ? ` · ${face} · Skillful Organizing` : ''}
          </p>
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
          Your 3-2-1 dialogue, load check, body weather, beliefs, and card answers stay on this device. The form above is the
          whole of what gets sent.
        </p>
      </div>

      <span className="bars-label" style={{ display: 'block', marginTop: 28, color: 'var(--bars-text-muted)' }}>2 · what would be useful from us?</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {SHOW_UP_STEWARD_REQUESTS.map((r) => {
          const on = request === r.key
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={on}
              onClick={() => setRequest(r.key)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left', padding: '15px 16px',
                cursor: 'pointer', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: 'none',
                boxShadow: `var(--bars-shadow-inset-top), 0 0 0 ${on ? '1.5px var(--bars-liminal)' : '1px var(--bars-line)'}`,
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20,
                  marginTop: 2, borderRadius: '50%', fontSize: 10, color: '#fff',
                  background: on ? 'var(--bars-liminal)' : 'transparent',
                  boxShadow: on ? `0 0 0 1px ${ACCENT}` : 'inset 0 0 0 1.5px var(--bars-line-strong)',
                }}
              >
                {on ? '●' : ''}
              </span>
              <span style={{ flex: 1, fontSize: 15.5, lineHeight: 1.5, color: '#e8e6e0', textWrap: 'pretty' }}>{r.label}</span>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 13, padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}>
        <label className="bars-label" htmlFor="sub-note" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>
          anything else Wendell should know? · optional
        </label>
        <textarea
          id="sub-note" rows={3} value={note} placeholder="Optional."
          onChange={(e) => setNote(e.target.value.slice(0, SHOW_UP_LIMITS.note))} style={fieldStyle}
        />
        <p style={{ ...mono, margin: '6px 0 0', textAlign: 'right', fontSize: 11, color: 'var(--bars-text-muted)' }}>
          {note.length} / {SHOW_UP_LIMITS.note}
        </p>

        <label className="bars-label" htmlFor="sub-learning" style={{ display: 'block', marginTop: 14, color: 'var(--bars-text-muted)' }}>
          what did putting this somewhere real teach you? · optional
        </label>
        <textarea
          id="sub-learning" rows={2} value={learning} placeholder="Share only what you want the steward to know about the work."
          onChange={(e) => setLearning(e.target.value.slice(0, SHOW_UP_LIMITS.placementLearning))} style={fieldStyle}
        />
        <p style={{ ...mono, margin: '6px 0 0', textAlign: 'right', fontSize: 11, color: 'var(--bars-text-muted)' }}>
          {learning.length} / {SHOW_UP_LIMITS.placementLearning}
        </p>
      </div>

      <span className="bars-label" style={{ display: 'block', marginTop: 28, color: 'var(--bars-text-muted)' }}>3 · contact and consent</span>
      <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
        {needsContact
          ? 'How should a Campaign Steward reach you? Contact and consent are required for the response you asked for.'
          : 'Contact is optional when no reply is needed. Leave these blank to stay anonymous.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <input aria-label="Name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Name" style={{ ...fieldStyle, marginTop: 0 }} />
        <input aria-label="Email or other contact route" value={senderContact} onChange={(e) => setSenderContact(e.target.value)} placeholder="Email or other contact route" style={{ ...fieldStyle, marginTop: 0 }} />
        <input aria-label="City or region" value={senderRegion} onChange={(e) => setSenderRegion(e.target.value)} placeholder="City or region — only if it matters to the handoff" style={{ ...fieldStyle, marginTop: 0 }} />
      </div>

      {/* Honeypot. Off-screen, never announced, and a filled one is a bot. */}
      <input
        tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <label
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 13, marginTop: 12, padding: '16px 17px', cursor: 'pointer',
          borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)',
          boxShadow: `0 0 0 ${consent ? `1.5px ${ACCENT}` : '1px var(--bars-line-strong)'}`,
        }}
      >
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ flex: 'none', width: 22, height: 22, marginTop: 1, accentColor: 'var(--bars-liminal)' }} />
        <span style={{ flex: 1, fontSize: 15, lineHeight: 1.55, color: '#e8e6e0', textWrap: 'pretty' }}>{SHOW_UP_TERMS.consent}</span>
      </label>

      <div style={{ marginTop: 22 }}>
        {canSend ? (
          <button
            type="button"
            disabled={pending}
            onClick={send}
            style={{
              display: 'block', width: '100%', textAlign: 'center', fontFamily: 'var(--bars-font-display)', fontWeight: 700,
              fontSize: 16, padding: 16, borderRadius: 'var(--bars-radius-lg)', border: 'none', color: '#fff',
              background: 'var(--bars-liminal)', cursor: pending ? 'progress' : 'pointer',
              boxShadow: `var(--bars-shadow-inset-top), 0 10px 24px -10px ${ACCENT}`,
            }}
          >
            {pending ? 'Sending…' : 'Send this handoff to the Campaign Steward'}
          </button>
        ) : (
          <span
            aria-disabled
            style={{
              display: 'block', textAlign: 'center', fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 16,
              padding: 16, borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-muted)',
              background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)',
            }}
          >
            {request ? 'Add contact and consent to send' : 'Choose what would be useful from us'}
          </span>
        )}
      </div>
      {error ? (
        <p role="alert" style={{ margin: '11px 0 0', textAlign: 'center', fontSize: 14.5, lineHeight: 1.55, color: '#e8896f', textWrap: 'pretty' }}>{error}</p>
      ) : null}
      <p style={{ margin: '11px 0 0', textAlign: 'center', fontSize: 14, lineHeight: 1.55, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
        A submission leaves roles, tasks, and public posts alone. Only a separate Campaign Steward decision can create one.
      </p>
    </Step>
  )
}

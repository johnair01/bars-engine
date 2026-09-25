import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { readShowUpHandoffForSender } from '@/actions/mtgoa-show-up-handoff'
import { SHOW_UP_TERMS, showUpArtifactRows } from '@/lib/mtgoa-course/show-up-handoff'
import { SenderControls } from './SenderControls'

/**
 * @page /my-handoff/[token]
 * @entity MTGOA
 * @description A Day 10 sender's own handoff — status, and the controls to withdraw or change contact.
 * @permissions public, capability-scoped
 *
 * The accountless half of the Day 10 submission. The token in the URL is the
 * whole authorization: it reaches exactly one submission and carries no
 * identity, so an anonymous sender has the same control as a named one.
 *
 * Steward notes are absent by construction — `readShowUpHandoffForSender`
 * never selects them.
 */

export const metadata: Metadata = {
  title: 'Your handoff | Mastering the Game of Allyship',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_COPY: Record<string, string> = {
  new: 'With the stewards, and nobody has looked yet.',
  seen: 'A steward has read it.',
  replied: 'A steward responded through the route you gave.',
  shaping_conversation: 'A conversation is open about what this could become.',
  closed: 'Handled. No further steward action is expected.',
  withdrawn: 'Withdrawn. It has left active campaign review.',
}

export default async function MyHandoffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const submission = await readShowUpHandoffForSender(token)
  if (!submission) notFound()

  const withdrawn = submission.status === 'withdrawn'
  const rows = showUpArtifactRows(submission)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bars-bg-base)', color: 'var(--bars-text-primary)', fontFamily: 'var(--bars-font-body)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px clamp(16px,5vw,32px) 96px' }}>
        <span className="bars-label" style={{ display: 'block', color: 'var(--bars-liminal-glow)' }}>your handoff</span>
        <h1 className="bars-title" style={{ margin: '10px 0 0', fontSize: 'clamp(26px,5vw,34px)', lineHeight: 1.16, textWrap: 'pretty' }}>
          {submission.title}
        </h1>
        <p className="bars-prose" style={{ margin: '14px 0 0', fontSize: 16.5, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
          Sent {submission.createdAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.{' '}
          {STATUS_COPY[submission.status] ?? ''}
        </p>

        <div style={{ marginTop: 20, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', padding: '6px 18px 16px' }}>
          {rows.map((row) => (
            <div key={row.label} style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{row.label}</span>
              <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.5, color: '#e8e6e0', textWrap: 'pretty' }}>{row.value}</p>
            </div>
          ))}
          <p style={{ margin: '13px 0 0', fontFamily: 'var(--bars-font-mono)', fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            {submission.placementState}
            {submission.placementKind ? ` · ${submission.placementKind}` : ''}
            {submission.requestLabel ? ` · asked for: ${submission.requestLabel}` : ''}
          </p>
        </div>

        <div style={{ marginTop: 20, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: '2px solid var(--bars-liminal)' }}>
          <span className="bars-label" style={{ display: 'block', color: 'var(--bars-liminal-glow)' }}>the terms you agreed to</span>
          <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>{SHOW_UP_TERMS.visibility}</p>
          <p style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>{SHOW_UP_TERMS.response}</p>
          <p style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>{SHOW_UP_TERMS.retention}</p>
        </div>

        <SenderControls
          token={token}
          withdrawn={withdrawn}
          hasContact={!!submission.lead?.contact}
          contact={submission.lead?.contact ?? ''}
        />

        <p style={{ margin: '26px 0 0', textAlign: 'center', fontFamily: 'var(--bars-font-mono)', fontSize: 'var(--bars-text-2xs)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', lineHeight: 1.6 }}>
          This link reaches your own handoff and no one else&rsquo;s
        </p>
      </div>
    </main>
  )
}

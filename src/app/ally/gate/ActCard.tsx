'use client'

import { useEffect, useState } from 'react'
import { sealGateAct, takeBackGateAct } from '@/actions/founder-gate-acts'
import {
  CARD_COPY, INTRO_KINDS, OFFERING_BANDS, PAYMENT_LINKS, WORK_QUESTIONS, AGENDA_MAX, actLink, introNote, packetToSeal,
  type Act, type Band, type IntroKind,
} from '@/lib/founder-gate/acts'
import { LINKS } from '@/lib/founder-gate/content'
import type { Packet } from '@/lib/founder-gate/seed-packet'
import { allyId, readCards, writeCard, type DeviceCard } from './device'
import { GOLD, PAPER, PAPER_INK, PAPER_MUTED } from './ui'

const PENCIL = 'Georgia, "Times New Roman", serif'
const WAX = '#8f2a22'
const small: React.CSSProperties = { fontSize: '.72rem', color: PAPER_MUTED, textTransform: 'uppercase', letterSpacing: '.08em' }
const q: React.CSSProperties = { margin: 0, fontSize: '1rem', fontWeight: 600, color: PAPER_INK }
const keyBtn = (ghost: boolean, off = false): React.CSSProperties => ({
  minHeight: 48, borderRadius: 12, padding: '10px 12px', fontSize: '1rem', fontWeight: 600, cursor: off ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'center',
  background: ghost ? 'transparent' : PAPER_INK, color: ghost ? PAPER_INK : GOLD, border: `1.5px solid ${PAPER_INK}`, opacity: off ? 0.55 : 1,
})
const chipBtn = (on: boolean): React.CSSProperties => ({
  minHeight: 44, borderRadius: 999, padding: '8px 14px', fontSize: '.95rem', cursor: 'pointer', fontFamily: 'inherit',
  background: on ? PAPER_INK : 'transparent', color: on ? PAPER : PAPER_INK, border: `1.5px solid ${PAPER_INK}`,
})
const seal = (off: boolean): React.CSSProperties => ({
  flex: 1, minHeight: 48, borderRadius: 50, border: 0, fontWeight: 600, fontSize: '1rem', cursor: off ? 'default' : 'pointer', fontFamily: 'inherit',
  background: WAX, color: '#f8e6c8', boxShadow: 'inset 0 0 0 3px #b8453a', opacity: off ? 0.5 : 1,
})
const sealNo: React.CSSProperties = { ...seal(false), background: '#d8ccb4', color: PAPER_INK, boxShadow: 'inset 0 0 0 3px #bfae90' }

/** The questions each act asks, in order. A chips question stores an id; a pencil question stores the visitor's own line. */
type Q = { kind: 'band' } | { kind: 'kind' } | { kind: 'pencil'; label: string; optional?: boolean }
const QUESTIONS: Record<Act, Q[]> = {
  offering: [{ kind: 'band' }],
  intro: [{ kind: 'kind' }, { kind: 'pencil', label: CARD_COPY.intro.lineQuestion }],
  share: [{ kind: 'pencil', label: CARD_COPY.share.question, optional: true }],
  work: WORK_QUESTIONS.map((label) => ({ kind: 'pencil' as const, label })),
}

/** The sentence a kept card shows: the visitor's own words when there are some, else the act's name. */
function keptSentence(act: Act, front: string, card: DeviceCard): string {
  if (act === 'offering') return card.band && card.band !== 'open' ? `An offering of $${card.band}.` : 'An offering, the amount chosen there.'
  const own = (card.answers ?? []).find((a) => a.trim())
  return own?.trim() || front
}

/**
 * One act on the back of a harvest card: one question at a time, one key that does the act, and a wax seal that keeps it.
 * "Not today" closes the card the same way and sends nothing. Pencilled answers (a friend's name, the visitor's words) stay
 * in this component and on the phone; the server receives only the act, its kind or amount, the agenda and the preset packet.
 */
export function ActCard({ act, front, title, packet, onClose }: { act: Act; front: string; title: string; packet: Packet; onClose: () => void }) {
  const qs = QUESTIONS[act]
  const [at, setAt] = useState(0)
  const [band, setBand] = useState<Band | null>(null)
  const [kind, setKind] = useState<IntroKind | null>(null)
  const [lines, setLines] = useState<string[]>(() => qs.map(() => ''))
  const [done, setDone] = useState<DeviceCard | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { const c = readCards()[act]; if (c) setDone(c) }, [act])

  const answered = (i: number) => {
    const x = qs[i]
    return x.kind === 'band' ? band !== null : x.kind === 'kind' ? kind !== null : x.optional ? i < at : lines[i].trim() !== ''
  }
  const ready = qs.every((_, i) => answered(i)) && at >= qs.length
  const setLine = (i: number, v: string) => setLines((l) => l.map((x, j) => (j === i ? v.slice(0, AGENDA_MAX) : x)))

  const close = (card: DeviceCard) => { writeCard(act, card); setDone(card) }
  const onSeal = async () => {
    if (!ready || busy) return
    setBusy(true); setNote('')
    const base: DeviceCard = { state: 'sealed', at: new Date().toISOString(), kind: kind ?? undefined, band: band ?? undefined, answers: lines.filter((x) => x.trim()) }
    try {
      const r = await sealGateAct({
        allyId: allyId(), act, packet: packetToSeal(packet),
        ...(act === 'intro' && kind ? { kind } : {}),
        ...(act === 'offering' && band ? { band } : {}),
        ...(act === 'work' ? { agenda: [lines[0].trim(), lines[1].trim(), lines[2].trim()] } : {}),
      })
      if (!r.ok) { setNote(r.error); return }
      close(r.kept === 'sealed' ? { ...base, index: r.index } : base)
      if (r.kept === 'device') setNote(CARD_COPY.keptDevice)
    } catch {
      setNote('The seal failed. The card is still open.')
    } finally { setBusy(false) }
  }
  const notToday = () => close({ state: 'not-today', at: new Date().toISOString(), kind: kind ?? undefined, band: band ?? undefined, answers: lines.filter((x) => x.trim()) })
  const takeBack = async () => {
    if (!done) return
    setBusy(true)
    try {
      if (done.index !== undefined) await takeBackGateAct({ allyId: allyId(), index: done.index })
      writeCard(act, { ...done, state: 'withdrawn' })
      setDone({ ...done, state: 'withdrawn' }); setNote(CARD_COPY.takenBack)
    } catch { setNote('That failed. Try again.') } finally { setBusy(false) }
  }

  const copy = async (text: string, msg: string) => { try { await navigator.clipboard.writeText(text); setNote(msg) } catch { setNote('Copying failed. Select the text and copy it yourself.') } }
  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer')
  const introLink = actLink('intro', kind ?? 'work')

  const shell = (children: React.ReactNode) => (
    <div role="dialog" aria-label={title} style={{ position: 'absolute', inset: 0, zIndex: 8, overflowY: 'auto', background: 'rgba(15,11,19,.9)', padding: '56px 14px 18px', display: 'grid', alignContent: 'start' }} onClick={(e) => e.stopPropagation()}>
      <section style={{ background: PAPER, color: PAPER_INK, borderRadius: 18, padding: '16px 14px 14px', display: 'grid', gap: 10, border: '1px solid #cdb98f', boxShadow: '0 8px 22px rgba(0,0,0,.45)' }}>
        <span style={small}>{title}</span>
        <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.25rem', lineHeight: 1.25 }}>{front}</h2>
        {children}
      </section>
    </div>
  )

  if (done) {
    const sentence = keptSentence(act, front, done)
    return shell(
      <>
        {done.state === 'sealed' && (
          <>
            <p style={{ margin: 0, fontSize: '.9rem', color: PAPER_MUTED }}>{CARD_COPY.sealedLead}</p>
            <p style={{ margin: 0, fontFamily: PENCIL, fontStyle: 'italic', fontSize: '1.2rem', color: '#1d2a52', borderBottom: '1.5px solid #1d2a52', paddingBottom: 4 }}>{sentence}</p>
            <button type="button" style={keyBtn(true)} disabled={busy} onClick={takeBack}>{CARD_COPY.takeBack}</button>
          </>
        )}
        {done.state === 'not-today' && (
          <>
            <p style={{ margin: 0, fontSize: '.95rem' }}>{CARD_COPY.notTodayKept}</p>
            <button type="button" style={keyBtn(true)} onClick={() => { writeCard(act, null); setDone(null); setNote('') }}>Open the card again</button>
          </>
        )}
        {done.state === 'withdrawn' && <p style={{ margin: 0, fontSize: '.95rem' }}>{CARD_COPY.takenBack}</p>}
        {note && <span aria-live="polite" style={{ fontSize: '.85rem', color: PAPER_MUTED }}>{note}</span>}
        <button type="button" style={keyBtn(false)} onClick={onClose}>Back to the bed</button>
      </>,
    )
  }

  return shell(
    <>
      {qs.map((x, i) => {
        if (i > at) return null
        const current = i === at
        if (x.kind === 'band') {
          return (
            <div key={i} style={{ display: 'grid', gap: 8 }}>
              <p style={q}>{CARD_COPY.offering.question}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {OFFERING_BANDS.map((b) => <button key={b.id} type="button" aria-pressed={band === b.id} style={chipBtn(band === b.id)} onClick={() => { setBand(b.id); setAt(Math.max(at, i + 1)) }}>{b.label}</button>)}
              </div>
            </div>
          )
        }
        if (x.kind === 'kind') {
          return (
            <div key={i} style={{ display: 'grid', gap: 8 }}>
              <p style={q}>{CARD_COPY.intro.kindQuestion}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INTRO_KINDS.map((k) => <button key={k.id} type="button" aria-pressed={kind === k.id} style={chipBtn(kind === k.id)} onClick={() => { setKind(k.id); setAt(Math.max(at, i + 1)) }}>{k.label}</button>)}
              </div>
            </div>
          )
        }
        return (
          <div key={i} style={{ display: 'grid', gap: 6 }}>
            <label style={q} htmlFor={`act-${act}-${i}`}>{x.label}</label>
            {current ? (
              <>
                <input id={`act-${act}-${i}`} value={lines[i]} onChange={(e) => setLine(i, e.target.value)} maxLength={AGENDA_MAX} autoComplete="off" autoCapitalize="sentences"
                  style={{ fontFamily: PENCIL, fontStyle: 'italic', fontSize: '1.15rem', color: '#4a4a5a', background: 'transparent', border: 0, borderBottom: '1.5px dashed #a99', padding: '6px 2px', outline: 'none' }} />
                <span style={{ ...small, textTransform: 'none', letterSpacing: 0 }}>{CARD_COPY.pencilHint}</span>
                <button type="button" style={keyBtn(true, !x.optional && !lines[i].trim())} disabled={!x.optional && !lines[i].trim()} onClick={() => setAt(i + 1)}>{i < qs.length - 1 ? 'Next' : 'That is it'}</button>
              </>
            ) : (
              <button type="button" onClick={() => setAt(i)} aria-label={`Rewrite: ${x.label}`} style={{ textAlign: 'left', fontFamily: PENCIL, fontStyle: 'italic', fontSize: '1.15rem', color: '#1d2a52', background: 'transparent', border: 0, borderBottom: '1.5px solid #1d2a52', padding: '6px 2px', cursor: 'pointer', minHeight: 40 }}>{lines[i] || 'Left blank'}</button>
            )}
          </div>
        )
      })}

      {ready && act === 'offering' && (
        <>
          <button type="button" style={keyBtn(false)} onClick={() => open(PAYMENT_LINKS.venmo)}>{CARD_COPY.offering.keys.venmo}</button>
          <button type="button" style={keyBtn(true)} onClick={() => open(PAYMENT_LINKS.cashapp)}>{CARD_COPY.offering.keys.cashapp}</button>
        </>
      )}
      {ready && act === 'intro' && (
        <>
          <button type="button" style={keyBtn(false, !introLink)} disabled={!introLink} onClick={() => copy(introNote(lines[1], kind ?? 'work', introLink), CARD_COPY.intro.copied)}>{introLink ? CARD_COPY.intro.key : CARD_COPY.waiting}</button>
        </>
      )}
      {ready && act === 'share' && (
        <>
          <button type="button" style={keyBtn(false)} onClick={() => open(LINKS.bookshop)}>{CARD_COPY.share.keys.buy}</button>
          <button type="button" style={keyBtn(true)} onClick={async () => {
            const url = `${window.location.origin}/ally/gate`
            if (typeof navigator.share === 'function') { try { await navigator.share({ url }); return } catch { /* cancelled: fall through to copy */ } }
            await copy(url, CARD_COPY.share.copied)
          }}>{CARD_COPY.share.keys.share}</button>
        </>
      )}
      {ready && act === 'work' && (
        <>
          <p style={{ margin: 0, fontSize: '.9rem', color: PAPER_MUTED }}>{CARD_COPY.work.lead}</p>
          <button type="button" style={keyBtn(false)} onClick={() => open(LINKS.coachingFree)}>{CARD_COPY.work.key}</button>
        </>
      )}

      <div style={{ background: '#e8dcc2', borderRadius: 10, padding: '8px 10px', fontSize: '.82rem', lineHeight: 1.4, color: '#4d3f30' }}>{CARD_COPY[act].kept}</div>
      {note && <span aria-live="polite" style={{ fontSize: '.85rem', color: PAPER_MUTED }}>{note}</span>}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" style={seal(!ready || busy)} disabled={!ready || busy} onClick={onSeal}>{CARD_COPY[act].seal}</button>
        <button type="button" style={sealNo} onClick={notToday}>{CARD_COPY.notToday}</button>
      </div>
      <button type="button" style={{ ...keyBtn(true), minHeight: 40, fontWeight: 400, borderColor: '#cdb98f', color: PAPER_MUTED }} onClick={onClose}>Back to the bed</button>
    </>,
  )
}

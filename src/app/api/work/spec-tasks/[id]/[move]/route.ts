/** A spec worker holds before posting one Board blocker; the Council resumes and verifies separately. */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { councilCaller, isLane, laneCaller } from '@/lib/work/lanes'
import { docHash, sessionWrite } from '@/lib/board/session-write'
import { blockSpecTicket, resumeSpecTicket, verifySpecTicket } from '@/lib/work/spec-task'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

type BlockBody = { question?: string; checked?: string; missing?: string; whyPerson?: string;
  why?: string; nextStep?: string; project?: string;
  options?: { v: string; label: string; c: string }[]; recommended?: string }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; move: string }> }) {
  const { id, move } = await params
  const ticket = await db.workTicket.findUnique({ where: { id }, select: { lane: true, state: true } })
  const worker = move === 'block' && ticket && isLane(ticket.lane) && laneCaller(req, ticket.lane)
  if (!councilCaller(req) && !worker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (worker === 'lane' && !['claimed', 'held'].includes(ticket?.state ?? ''))
    return NextResponse.json({ error: 'Claim this ticket before blocking it' }, { status: 409 })
  const body = (await req.json().catch(() => ({}))) as BlockBody & { reviewer?: string; evidence?: string }
  try {
    if (move === 'block') {
      const { question, checked, missing, whyPerson, why, nextStep, project, options, recommended } = body
      if (![question, checked, missing, whyPerson, why, nextStep, project].every(s => typeof s === 'string' && s.trim().length >= 8)
          || !Array.isArray(options) || options.length < 2 || options.length > 4
          || options.some(o => !o || !o.v || !o.label || !o.c)
          || !options.some(o => o.v === recommended)) {
        return NextResponse.json({ error: 'A blocker needs a project, concrete question, checked record, missing decision, person, why, next step, options and recommendation' }, { status: 400 })
      }
      const held = await blockSpecTicket(db, id)
      const card = {
        project, face: 'regent', front: {
          why, why_person: whyPerson, next_step: nextStep,
          missing: { kind: 'decision', text: missing },
          moves: [
            { move: 'claude_takes_it', label: 'Claude takes it', recommended: false, mechanic: 'dispatch-lever' },
            { move: 'steer', label: 'Steer', recommended: true, mechanic: 'steer-helm' },
            { move: 'compost', label: 'Compost', recommended: false, mechanic: 'compost-hatch' },
          ],
        }, back: { deck: project, face: 'regent' }, inside: {
          acceptance: ['Save one answer on this card before work resumes.'],
          receipt: null, rulings: [], charge: null, tokens: { spent: 0, budget: null },
          source: `Spec task ${held.taskKey}, ticket ${id}. Checked: ${checked}`,
        }, commitment: null, outcome: null, bar: null,
      }
      const row = { kind: 'questions', pass: 'spec-work-blocker', faces: ['regent'], q: question,
        options, recommended, card, specTask: held.taskKey, ticketId: id }
      const posted = await db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${held.cardId}))`
        const existing = await tx.boardSave.findFirst({ where: {
          board: 'council', collection: 'rows', docId: held.cardId,
        }, orderBy: { receivedAt: 'desc' } })
        if (existing && docHash(existing.data) !== docHash(row))
          return { written: [], same: 0, refused: ['The existing blocker card has different words'] }
        return sessionWrite(tx, [{ collection: 'rows', docId: held.cardId, mode: 'set', data: row }])
      })
      if (posted.refused.length) return NextResponse.json({ error: posted.refused, held: true, cardId: held.cardId },
        { status: posted.refused.includes('The existing blocker card has different words') ? 409 : 503 })
      return NextResponse.json({ held: true, cardId: held.cardId, posted: posted.written.length > 0,
        same: posted.same > 0 }, { headers: NO_STORE })
    }
    if (move === 'resume') return NextResponse.json(await resumeSpecTicket(db, id), { headers: NO_STORE })
    if (move === 'verify') {
      if (!body.reviewer?.trim() || !body.evidence?.trim()) return NextResponse.json({ error: 'Reviewer and evidence required' }, { status: 400 })
      return NextResponse.json(await verifySpecTicket(db, id, body.reviewer, body.evidence), { headers: NO_STORE })
    }
    return NextResponse.json({ error: 'Unknown move' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Spec task move failed' }, { status: 409 })
  }
}

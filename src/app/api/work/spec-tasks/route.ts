/** Publish a checked spec task. Council owns source validation; the app independently checks release authority. */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { councilCaller } from '@/lib/work/lanes'
import { publishSpecTask, validateSpecTask, type SpecTaskDraft } from '@/lib/work/spec-task'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { task?: SpecTaskDraft;
    authority?: { kind?: string; rowId?: string; choice?: string } } | null
  const t = body?.task
  if (!t || typeof t.key !== 'string' || typeof t.revision !== 'string' || typeof t.title !== 'string'
      || typeof t.brief !== 'string' || !Array.isArray(t.lanes) || !Array.isArray(t.dependencies)
      || !t.basis || typeof t.basis !== 'object' || Array.isArray(t.basis)) {
    return NextResponse.json({ error: 'Invalid task packet' }, { status: 400 })
  }
  const invalid = validateSpecTask(t)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
  const a = body?.authority
  if (a?.kind === 'pilot' && process.env.BARS_LOCAL === '1') {
    // The local probe has no live Board. This bypass cannot run in a deployment.
  } else if (a?.kind === 'board' && a.rowId && a.choice) {
    const [row, answer] = await Promise.all([
      db.boardSave.findFirst({ where: { board: 'council', collection: 'rows', docId: a.rowId },
        orderBy: { receivedAt: 'desc' } }),
      db.boardSave.findFirst({ where: { board: 'council', collection: 'questions', docId: a.rowId,
        source: 'board-owner' }, orderBy: { receivedAt: 'desc' } }),
    ])
    const rowData = row?.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? row.data as Record<string, unknown> : null
    const release = rowData?.specRelease
    const saved = answer?.data && typeof answer.data === 'object' && !Array.isArray(answer.data)
      ? (answer.data as Record<string, unknown>).choice : null
    if (rowData?.kind !== 'questions' || !Array.isArray(rowData.options)
        || !rowData.options.some(o => o && typeof o === 'object' && (o as Record<string, unknown>).v === a.choice)
        || !release || typeof release !== 'object' || Array.isArray(release)
        || (release as Record<string, unknown>).prefix !== t.key.slice(0, t.key.lastIndexOf('/') + 1)
        || (release as Record<string, unknown>).choice !== a.choice || saved !== a.choice) {
      return NextResponse.json({ error: 'Release authority does not match the saved Board ruling' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'An owner-saved Board release ruling is required' }, { status: 403 })
  }
  const r = await publishSpecTask(db, { ...t, basis: { ...t.basis, authority: a } })
  return NextResponse.json({ created: r.created, ticket: { id: r.ticket.id, lane: r.ticket.lane,
    state: r.ticket.state } }, { status: r.created ? 201 : 200, headers: NO_STORE })
}

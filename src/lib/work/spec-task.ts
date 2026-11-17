import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { dryLanes } from './queue'
import { firstLitLane, isLane } from './lanes'

export interface SpecTaskDraft {
  key: string
  revision: string
  title: string
  brief: string
  basis: Record<string, unknown>
  lanes: string[]
  dependencies: string[]
}

export function validateSpecTask(t: SpecTaskDraft): string | null {
  if (!/^spec:[A-Za-z0-9._/-]+\/[A-Z]?T\d{3,}$/.test(t.key)) return 'Invalid spec task key'
  if (!/^[a-f0-9]{12,64}$/.test(t.revision)) return 'Invalid task revision'
  if (!t.title.trim() || !t.brief.trim()) return 'Title and brief are required'
  if (!t.lanes.length || t.lanes.some(l => !isLane(l)) || new Set(t.lanes).size !== t.lanes.length) return 'Unsupported or duplicate lane'
  if (t.dependencies.includes(t.key) || new Set(t.dependencies).size !== t.dependencies.length) return 'Invalid dependencies'
  if (t.dependencies.some(d => !/^spec:[A-Za-z0-9._/-]+\/[A-Z]?T\d{3,}$/.test(d))) return 'Invalid dependency key'
  return null
}

/** One task revision becomes one immutable ticket; publication and predecessor retirement share a transaction. */
export async function publishSpecTask(db: PrismaClient, t: SpecTaskDraft) {
  const invalid = validateSpecTask(t)
  if (invalid) throw new Error(invalid)
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${t.key}))`
    const current = await tx.specWorkTask.findUnique({ where: { key: t.key } })
    if (current?.revision === t.revision) {
      const ticket = await tx.workTicket.findUniqueOrThrow({ where: { id: current.ticketId } })
      return { ticket, created: false }
    }
    const deps = await tx.specWorkTask.findMany({ where: { key: { in: t.dependencies } } })
    const ready = t.dependencies.every(key => deps.some(d => d.key === key && d.verifiedAt))
    const sourceKey = `${t.key}@${t.revision}`
    const lane = firstLitLane(t.lanes, await dryLanes(tx))
    const ticket = await tx.workTicket.create({ data: {
      sourceKey, specTaskKey: t.key, title: t.title, brief: t.brief, basis: t.basis as object,
      lanes: t.lanes, lane, state: ready ? 'ready' : 'held',
    } })
    if (current) {
      await tx.workTicket.updateMany({ where: { id: current.ticketId, state: { in: ['ready', 'held'] } },
        data: { state: 'held', result: `Superseded by ${ticket.id}` } })
    }
    await tx.specWorkTask.upsert({ where: { key: t.key }, create: {
      key: t.key, revision: t.revision, ticketId: ticket.id, dependencies: t.dependencies,
    }, update: {
      revision: t.revision, ticketId: ticket.id, dependencies: t.dependencies,
      gate: 'open', blockerCardId: null, verifiedAt: null, verifiedBy: null, evidence: null,
    } })
    return { ticket, created: true }
  })
}

/** Hold first, then post the Board card. Repeating this move returns the same card ID. */
export async function blockSpecTicket(db: PrismaClient, ticketId: string) {
  return db.$transaction(async tx => {
    const ticket = await tx.workTicket.findUnique({ where: { id: ticketId } })
    if (!ticket?.specTaskKey) throw new Error('Not a spec ticket')
    if (!['ready', 'claimed', 'held'].includes(ticket.state)) throw new Error('Ticket cannot be blocked in this state')
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ticket.specTaskKey}))`
    const task = await tx.specWorkTask.findUniqueOrThrow({ where: { key: ticket.specTaskKey } })
    if (task.ticketId !== ticketId) throw new Error('Superseded ticket')
    if (ticket.state === 'held' && !task.blockerCardId) throw new Error('Held ticket has no blocker to retry')
    const cardId = task.blockerCardId ?? `spec-stop-${createHash('sha256').update(ticketId).digest('hex').slice(0, 16)}`
    await tx.specWorkTask.update({ where: { key: task.key }, data: { gate: 'blocked', blockerCardId: cardId } })
    await tx.workTicket.updateMany({ where: { id: ticketId, state: { in: ['ready', 'claimed'] } },
      data: { state: 'held', claimedBy: null, leaseUntil: null } })
    return { cardId, taskKey: task.key, ticketId }
  })
}

/** Only a Board answer saved in Wendell's owner session may clear the decision gate. */
export async function resumeSpecTicket(db: PrismaClient, ticketId: string) {
  return db.$transaction(async tx => {
    const ticket = await tx.workTicket.findUnique({ where: { id: ticketId } })
    if (!ticket?.specTaskKey) throw new Error('Not a spec ticket')
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ticket.specTaskKey}))`
    const task = await tx.specWorkTask.findUniqueOrThrow({ where: { key: ticket.specTaskKey } })
    if (task.ticketId !== ticketId || task.gate !== 'blocked' || !task.blockerCardId) throw new Error('No current blocker')
    const ruling = await tx.boardSave.findFirst({ where: {
      board: 'council', collection: 'questions', docId: task.blockerCardId, source: 'board-owner',
    }, orderBy: { receivedAt: 'desc' } })
    const answer = ruling?.data && typeof ruling.data === 'object' && !Array.isArray(ruling.data)
      ? (ruling.data as Record<string, unknown>).choice : null
    if (answer !== 'resume') throw new Error('No owner-saved Board ruling to resume this work')
    const deps = await tx.specWorkTask.findMany({ where: { key: { in: task.dependencies } } })
    const ready = task.dependencies.every(key => deps.some(d => d.key === key && d.verifiedAt))
    await tx.specWorkTask.update({ where: { key: task.key }, data: { gate: 'open' } })
    await tx.workTicket.updateMany({ where: { id: ticketId, state: 'held' }, data: { state: ready ? 'ready' : 'held' } })
    return { taskKey: task.key, ticketId, cardId: task.blockerCardId, answer, ready }
  })
}

/** A result string is only submitted evidence. A reviewer separately accepts it for the current revision. */
export async function verifySpecTicket(db: PrismaClient, ticketId: string, reviewer: string, evidence: string) {
  return db.$transaction(async tx => {
    const ticket = await tx.workTicket.findUnique({ where: { id: ticketId } })
    if (!ticket?.specTaskKey || ticket.state !== 'done') throw new Error('No completed spec ticket')
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ticket.specTaskKey}))`
    const task = await tx.specWorkTask.findUniqueOrThrow({ where: { key: ticket.specTaskKey } })
    if (task.ticketId !== ticketId || task.gate !== 'open') throw new Error('Ticket is stale or blocked')
    await tx.specWorkTask.update({ where: { key: task.key }, data: { verifiedAt: new Date(), verifiedBy: reviewer, evidence } })
    const waiting = await tx.specWorkTask.findMany({ where: { dependencies: { has: task.key }, gate: 'open' } })
    for (const next of waiting) {
      const deps = await tx.specWorkTask.findMany({ where: { key: { in: next.dependencies } } })
      if (next.dependencies.every(key => deps.some(d => d.key === key && d.verifiedAt))) {
        await tx.workTicket.updateMany({ where: { id: next.ticketId, state: 'held' }, data: { state: 'ready' } })
      }
    }
    return { taskKey: task.key, ticketId, verified: true }
  })
}

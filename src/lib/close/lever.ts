import type { Prisma, PrismaClient } from '@prisma/client'
import { pushTicket } from '@/lib/work/queue'
import { dayHasRed, unsafeReasons } from './safe'
import type { CloseRecord } from './types'

type Db = PrismaClient | Prisma.TransactionClient

export interface Pulled { record: CloseRecord; error?: string; ticketId?: string }

/**
 * The lever (FR-005, FR-006). This is the only code path in the closing ritual that calls `pushTicket`; nothing goes
 * to Zo until he pulls it, one ticket per pull. A pull re-checks the day and the ticket's own safety facts at the
 * moment it is pulled, so a check that went red after the plan was agreed still stops it.
 */
export async function pullLever(db: Db, prev: CloseRecord, ticketId: string): Promise<Pulled> {
  const refuse = (error: string): Pulled => ({ record: prev, error })
  if (prev.status !== 'open') return refuse(`This close is ${prev.status}.`)
  const t = prev.plan.tickets.find(x => x.id === ticketId)
  if (!t) return refuse(`There is no ticket ${ticketId}.`)
  if (t.hull !== 'zo') return refuse(`Ticket ${ticketId} is not in Zo tonight.`)
  if (t.released || prev.sent.includes(t.id)) return refuse(`Ticket ${ticketId} already went.`)
  if (dayHasRed(prev)) return refuse('A check is red today, so nothing is safe to run tonight.')
  if (!t.safety) return refuse(`Ticket ${ticketId} carries no safety facts, so it is not safe to run tonight.`)
  const why = unsafeReasons(t.safety)
  if (why.length) return refuse(`Ticket ${ticketId} is not safe to run tonight: ${why.join('; ')}.`)

  const brief = [
    `From the ${prev.date} evening close. ${t.title}`,
    `Source: ${t.source}. Budget: ${t.minutes} minutes. One lane (zo). End in a pull request or a board row.`,
    'Next owner + wake: Wendell opens it in the morning; the pull request or board row is the report.',
  ].join('\n\n')
  await pushTicket(db, {
    sourceKey: `close-${prev.date}-${t.id}`, title: t.title, brief,
    basis: { rows: [], answer: 'lever', label: `Pulled at the ${prev.date} close`, steer: '', savedAt: new Date().toISOString() },
    lanes: ['zo'],
  })
  const record: CloseRecord = JSON.parse(JSON.stringify(prev))
  record.sent.push(t.id)
  record.plan.tickets.find(x => x.id === t.id)!.released = true
  return { record, ticketId: t.id }
}

import type { PrismaClient } from '@prisma/client'
import { parse, step } from './grammar'
import { pullLever } from './lever'
import { renderChat } from './render'
import { openClose, saveClose } from './store'
import type { CloseRecord } from './types'

type Db = Pick<PrismaClient, 'boardSave' | 'workTicket'>

/** Today in Pacific time, as YYYY-MM-DD. */
export function pacificToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now)
}

const screen = (r: CloseRecord) => r.status === 'open' ? renderChat(r) : `The close for ${r.date} is ${r.status}.`

export async function closeRead(db: Db, date = pacificToday()) {
  const r = await openClose(db, date)
  return { date, status: r.status, move: r.move, text: screen(r) }
}

/** One reply: parse, step, and at "send" pull the lever for that ticket (the only place a ticket leaves). */
export async function closeSay(db: Db, say: string, date = pacificToday()) {
  const prev = await openClose(db, date)
  const s = step(prev, parse(say, prev.move))
  let record = s.record
  let error = s.error
  let ticketId: string | undefined
  if (!error && s.send) {
    const pulled = await pullLever(db as never, record, s.send)
    record = pulled.record; error = pulled.error; ticketId = pulled.ticketId
  }
  if (!error) { const refused = await saveClose(db, record); if (refused) error = `Could not save: ${refused}` }
  return { date, status: record.status, move: record.move, error, ticketId, text: error ? `${error}\n\n${screen(prev)}` : screen(record) }
}

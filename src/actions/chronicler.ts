'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRung, linkError, flagsForApproval, type Rung } from '@/lib/chronicler/ladder'


async function adminId(): Promise<string | null> {
  const player = await getCurrentPlayer()
  if (!player) return null
  const role = await db.playerRole.findFirst({ where: { playerId: player.id, role: { key: 'admin' } } })
  return role ? player.id : null
}
const done = (): never => { revalidatePath('/admin/chronicler'); redirect('/admin/chronicler') }
/** A refusal goes back to the page with the sentence in the URL, so a plain form shows it. */
const refuse = (error: string): never => redirect(`/admin/chronicler?error=${encodeURIComponent(error)}`)

/** Put a new card on a rung. The card is a private BAR, so it joins the same store as every other BAR. */
export async function addCard(form: FormData): Promise<void> {
  const id = await adminId(); if (!id) return refuse('Admin access required')
  const rung = form.get('rung'), title = String(form.get('title') ?? '').trim(), description = String(form.get('description') ?? '').trim()
  if (!isRung(rung)) return refuse('Pick a rung.')
  if (!title) return refuse('A card needs a title.')
  const bar = await db.customBar.create({ data: { creatorId: id, title, description: description || title, visibility: 'private' } })
  await db.chroniclerNode.create({ data: { barId: bar.id, rung } })
  done()
}

/** Join a parent to a child. The rule lives in linkError: several parents are fine, a link may only run downward. */
export async function addLink(form: FormData): Promise<void> {
  if (!(await adminId())) return refuse('Admin access required')
  const parentId = String(form.get('parentId') ?? ''), childId = String(form.get('childId') ?? '')
  const [p, c] = await Promise.all([parentId, childId].map((barId) => db.chroniclerNode.findUnique({ where: { barId } })))
  const err = linkError(p ? { barId: p.barId, rung: p.rung as Rung } : undefined, c ? { barId: c.barId, rung: c.rung as Rung } : undefined)
  if (err) return refuse(err)
  await db.chroniclerLink.upsert({ where: { parentId_childId: { parentId, childId } }, create: { parentId, childId }, update: {} })
  done()
}

/** An Admin approval: queue one flag for every card the approved card reaches, plus the horizontal question. */
export async function approveCard(form: FormData): Promise<void> {
  if (!(await adminId())) return refuse('Admin access required')
  const barId = String(form.get('barId') ?? '')
  const [nodes, links] = await Promise.all([db.chroniclerNode.findMany(), db.chroniclerLink.findMany()])
  const flags = flagsForApproval(barId, nodes.map((n) => ({ barId: n.barId, rung: n.rung as Rung })), links)
  if (!flags.length) return refuse('That card is not on the ladder.')
  await db.chroniclerFlag.createMany({ data: flags })
  done()
}

export async function answerFlag(form: FormData): Promise<void> {
  if (!(await adminId())) return refuse('Admin access required')
  const id = String(form.get('flagId') ?? ''), answer = String(form.get('answer') ?? '').trim()
  const dismiss = form.get('dismiss') !== null
  if (!dismiss && !answer) return refuse('Write an answer, or dismiss the flag.')
  await db.chroniclerFlag.update({ where: { id }, data: dismiss ? { status: 'dismissed', answeredAt: new Date() } : { status: 'answered', answer, answeredAt: new Date() } })
  done()
}

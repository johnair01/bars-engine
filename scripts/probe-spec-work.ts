/** Run only through scripts/local/dev.sh run -- npx tsx scripts/probe-spec-work.ts. */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { blockSpecTicket, publishSpecTask, resumeSpecTicket, verifySpecTicket } from '../src/lib/work/spec-task'
import { claimTicket, moveTicket, returnLapsed, setLaneDry } from '../src/lib/work/queue'

if (process.env.BARS_LOCAL !== '1') throw new Error('Local database only')
const db = new PrismaClient()
const run = randomUUID().slice(0, 8)
const a = `spec:pilot/${run}/T001`, b = `spec:pilot/${run}/T002`
const c = `spec:pilot/${run}/T003`
const d = `spec:pilot/${run}/T004`
const task = (key: string, revision: string, dependencies: string[] = []) => ({
  key, revision, title: key, brief: `Complete ${key} and return evidence.`,
  basis: { spec: 'pilot', task: key }, lanes: ['deepai'], dependencies,
})

async function main() {
  await setLaneDry(db, 'deepai', false, null)
  const [first, repeat] = await Promise.all([
    publishSpecTask(db, task(a, 'a'.repeat(12))), publishSpecTask(db, task(a, 'a'.repeat(12))),
  ])
  assert.equal(first.ticket.id, repeat.ticket.id)
  assert.equal(Number(first.created) + Number(repeat.created), 1)
  const dependent = await publishSpecTask(db, task(b, 'b'.repeat(12), [a]))
  assert.equal(dependent.ticket.state, 'held')
  assert.equal(await claimTicket(db, 'deepai', 'early', new Date(), dependent.ticket.id), null)
  const revised = await publishSpecTask(db, task(a, 'c'.repeat(12)))
  assert.notEqual(first.ticket.id, revised.ticket.id)
  assert.equal(await claimTicket(db, 'deepai', 'stale', new Date(), first.ticket.id), null)
  const current = await claimTicket(db, 'deepai', 'worker', new Date(), revised.ticket.id)
  assert.equal(current?.id, revised.ticket.id)
  const block = await blockSpecTicket(db, revised.ticket.id)
  assert.equal((await blockSpecTicket(db, revised.ticket.id)).cardId, block.cardId)
  await db.workTicket.update({ where: { id: revised.ticket.id }, data: {
    state: 'claimed', leaseUntil: new Date(0), claimedBy: 'expired worker',
  } })
  await returnLapsed(db)
  assert.equal(await claimTicket(db, 'deepai', 'blocked', new Date(), revised.ticket.id), null)
  await db.boardSave.create({ data: { board: 'council', collection: 'questions', docId: block.cardId,
    source: 'council-menu', data: { choice: 'continue' } } })
  await assert.rejects(resumeSpecTicket(db, revised.ticket.id), /No owner-saved Board ruling/)
  await db.boardSave.create({ data: { board: 'council', collection: 'questions', docId: block.cardId,
    source: 'board-owner', data: { choice: 'resume' } } })
  assert.equal((await resumeSpecTicket(db, revised.ticket.id)).ready, true)
  assert.equal((await claimTicket(db, 'deepai', 'resumed', new Date(), revised.ticket.id))?.id, revised.ticket.id)
  assert.equal((await moveTicket(db, revised.ticket.id, 'deepai', 'done', 'https://example.test/evidence')).ok, true)
  assert.equal(await claimTicket(db, 'deepai', 'still waiting', new Date(), dependent.ticket.id), null)
  await verifySpecTicket(db, revised.ticket.id, 'local-reviewer', 'Acceptance checked in pilot')
  assert.equal((await claimTicket(db, 'deepai', 'dependent', new Date(), dependent.ticket.id))?.id, dependent.ticket.id)
  const oldClaim = await publishSpecTask(db, task(c, 'e'.repeat(12)))
  assert.equal((await claimTicket(db, 'deepai', 'old claim', new Date(), oldClaim.ticket.id))?.id, oldClaim.ticket.id)
  await publishSpecTask(db, task(c, 'f'.repeat(12)))
  await moveTicket(db, oldClaim.ticket.id, 'deepai', 'release', 'Superseded during claim')
  assert.equal((await db.workTicket.findUniqueOrThrow({ where: { id: oldClaim.ticket.id } })).state, 'held')
  assert.equal(await claimTicket(db, 'deepai', 'stale release', new Date(), oldClaim.ticket.id), null)
  const beforeDry = await publishSpecTask(db, { ...task(d, '1'.repeat(12)), lanes: ['deepai', 'freebuff'] })
  assert.equal((await claimTicket(db, 'deepai', 'dry-lane worker', new Date(), beforeDry.ticket.id))?.id, beforeDry.ticket.id)
  const dryBlock = await blockSpecTicket(db, beforeDry.ticket.id)
  await db.boardSave.create({ data: { board: 'council', collection: 'questions', docId: dryBlock.cardId,
    source: 'board-owner', data: { choice: 'resume' } } })
  await setLaneDry(db, 'deepai', true, 'Local pilot')
  await resumeSpecTicket(db, beforeDry.ticket.id)
  assert.equal((await db.workTicket.findUniqueOrThrow({ where: { id: beforeDry.ticket.id } })).lane, 'freebuff')
  await setLaneDry(db, 'deepai', false, null)
  console.log(JSON.stringify({ duplicate: 'one ticket', dependent: 'held', stale: 'refused',
    blocked: 'refused after lease expiry', staleRelease: 'held', ownerRuling: 'required',
    dryLane: 'passed to freebuff', evidence: 'verified before dependent claim',
    blockerCardId: block.cardId, run }))
}

main().finally(() => db.$disconnect())

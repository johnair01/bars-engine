/** Run: npx tsx src/lib/npc/memory-trial/harness.test.ts   (scripted voice; no network, no database) */
import assert from 'node:assert/strict'
import { InMemoryStore, PROPOSE_MARKER, runTrial, runTurn, RETENTION_CAPS, type Msg, type Voice } from './harness'
import { architectElderPlan as plan, villagerPlan } from './plan'

/** A voice that knows nothing but its prompt: it can only repeat what the prompt holds. */
function scriptedVoice(opts: { honest?: boolean } = {}): Voice {
  return async (messages: Msg[]) => {
    const system = messages[0].content
    const last = messages[messages.length - 1].content
    if (system.includes(PROPOSE_MARKER)) {
      const player = last.split('\nNPC:')[0].replace('Player: ', '')
      const type = /^(my|i) /i.test(player) ? 'relationship' : 'scene'
      return JSON.stringify([{ type, summary: player }])
    }
    if (/ai model|language model|system prompt/i.test(last)) return 'I am the Architect Elder. Bring me a structure to check.'
    const lines = system.split('\n').filter((l) => l.startsWith('- '))
    if (opts.honest === false) return 'You told me about your sister in Lisbon.' // invents
    // Plumbing test only: it repeats every line it was given. Whether a real model picks the right
    // line for an indirect question is what the live run (run-trial.ts) measures.
    return lines.length ? `I recall: ${lines.map((l) => l.slice(2)).join(' ')}` : 'I do not know that.'
  }
}

async function main() {
  // 1. Full trial: 3 days, wiped context each day, two players.
  {
    const store = new InMemoryStore()
    store.seedCanon(plan.npc.id, plan.canon)
    const r = await runTrial({ store, voice: scriptedVoice() }, plan, 'player-a', 'player-b')
    assert.equal(r.recalled, 10, `recalled ${r.recalled}, missed ${r.missed}`)
    assert.deepEqual(r.leaks, [])
    assert.deepEqual(r.fabrications, [])
    assert.ok(r.personaHeld)
    assert.ok(r.pass)
  }
  // 2. Store isolation: B sees canon, never A's private rows.
  {
    const store = new InMemoryStore()
    store.seedCanon(plan.npc.id, plan.canon)
    await runTurn({ store, voice: scriptedVoice() }, plan.npc, 'player-a', 'My dog is named Pickle.')
    const b = await store.list(plan.npc.id, 'player-b')
    assert.equal(b.length, plan.canon.length)
    assert.ok(b.every((m) => m.isCanon))
    const a = await store.list(plan.npc.id, 'player-a')
    assert.ok(a.some((m) => !m.isCanon && m.summary.includes('Pickle')))
  }
  // 3. Skeptic's test: one unique fact, wiped context, recall from the store alone.
  {
    const store = new InMemoryStore()
    await runTurn({ store, voice: scriptedVoice() }, plan.npc, 'player-a', 'My locker code is zebra-47.')
    const fresh = JSON.parse(JSON.stringify(store.toJSON()))
    const reopened = InMemoryStore.fromJSON(fresh)
    const rows = await reopened.list(plan.npc.id, 'player-a')
    assert.ok(rows.some((m) => m.summary.includes('zebra-47')))
  }
  // 4. A voice that invents facts fails the trial.
  {
    const store = new InMemoryStore()
    const r = await runTrial({ store, voice: scriptedVoice({ honest: false }) }, plan, 'player-a', 'player-b')
    assert.ok(r.fabrications.length > 0)
    assert.equal(r.pass, false)
  }
  // 5. Retention caps prune the oldest private rows and never canon.
  {
    const store = new InMemoryStore()
    store.seedCanon(plan.npc.id, plan.canon)
    for (let i = 0; i < RETENTION_CAPS.relationship + 2; i++) await store.addPrivate(plan.npc.id, 'player-a', 'relationship', `fact ${i}`)
    const rows = (await store.list(plan.npc.id, 'player-a')).filter((m) => !m.isCanon)
    assert.equal(rows.length, RETENTION_CAPS.relationship)
    assert.ok(!rows.some((m) => m.summary === 'fact 0'))
    assert.equal((await store.list(plan.npc.id, 'player-a')).filter((m) => m.isCanon).length, plan.canon.length)
  }
  // 6. The villager stand-in runs the same gate.
  {
    const store = new InMemoryStore()
    store.seedCanon(villagerPlan.npc.id, villagerPlan.canon)
    const vr = await runTrial({ store, voice: scriptedVoice() }, villagerPlan, 'player-a', 'player-b'); assert.ok(vr.pass, JSON.stringify(vr))
  }
  console.log('memory-trial harness: all 6 checks passed')
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})

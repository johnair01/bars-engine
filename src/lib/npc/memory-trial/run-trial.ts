/**
 * Live run of the planted-facts test against a real voice, one day per process so the model's
 * context is wiped between days and memory comes from the store file alone.
 *
 *   TRIAL_VOICE_URL=https://.../v1 TRIAL_VOICE_MODEL=<name> TRIAL_VOICE_KEY=<key> \
 *   npx tsx src/lib/npc/memory-trial/run-trial.ts --store /tmp/trial.json --day 1|2|3|recall
 *
 * Endpoint is any OpenAI-compatible chat API (a free hosted tier, or the box's own model).
 * Use invented players only. Read the provider's terms on human review before any real player text.
 * The key comes from the environment; never paste it into a command line or a file in the repo.
 */
import fs from 'node:fs'
import { InMemoryStore, plantDay, recallAll, type Msg, type Voice } from './harness'
import { architectElderPlan as plan } from './plan'

const arg = (n: string) => process.argv[process.argv.indexOf(`--${n}`) + 1]

const voice: Voice = async (messages: Msg[]) => {
  const { TRIAL_VOICE_URL: url, TRIAL_VOICE_MODEL: model, TRIAL_VOICE_KEY: key } = process.env
  if (!url || !model || !key) throw new Error('Set TRIAL_VOICE_URL, TRIAL_VOICE_MODEL and TRIAL_VOICE_KEY')
  const res = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  })
  if (!res.ok) throw new Error(`voice ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j = (await res.json()) as { choices: { message: { content: string } }[] }
  return j.choices[0].message.content
}

async function main() {
  const file = arg('store')
  const day = arg('day')
  if (!file || !day) throw new Error('usage: --store <file> --day 1|2|3|recall')
  const store = fs.existsSync(file) ? InMemoryStore.fromJSON(JSON.parse(fs.readFileSync(file, 'utf8'))) : new InMemoryStore()
  if (!fs.existsSync(file)) store.seedCanon(plan.npc.id, plan.canon)
  const deps = { store, voice }
  if (day === 'recall') {
    const r = await recallAll(deps, plan, 'test-player-a')
    const b = (await store.list(plan.npc.id, 'test-player-b')).filter((m) => !m.isCanon)
    console.log(JSON.stringify({ recalled: r.recalled.length, total: plan.facts.length, missed: r.missed, fabrications: r.fabrications, personaHeld: r.personaHeld, otherPlayerRows: b.length }, null, 1))
    return
  }
  await plantDay(deps, plan, 'test-player-a', Number(day) as 1 | 2 | 3)
  fs.writeFileSync(file, JSON.stringify(store.toJSON(), null, 1))
  console.log(`day ${day} planted; ${store.rows.filter((r) => !r.isCanon).length} private rows in ${file}`)
}
main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})

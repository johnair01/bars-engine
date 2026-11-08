/**
 * Run: npx tsx src/lib/bar-asset/__tests__/quality-gate.test.ts
 *
 * The pre-translation Jev quality gate, with a fake fetch (no network, no key).
 * Covers: score read-back, mode=off zero-call, shadow proceed-on-low-score,
 * enforce throw, fallback proceed-on-ok:false. (SPEC-jev-quality-gate-001)
 */

import { runQualityGate, QUALITY_QUESTION, QualityGateError } from '@/lib/bar-asset/quality-gate'

let fails = 0
function ok(cond: boolean, msg: string) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg)
  if (!cond) fails++
}

const SEED = {
  id: 'seed-1',
  title: 'The Ashen Reliquary',
  description: 'A cracked reliquary of black glass, humming faintly, ringed by votive candles burnt to stubs.',
}

function fakeScore(score: number): typeof fetch {
  return (async (_url: unknown) =>
    new Response(
      JSON.stringify({ model: 'typesafe-ai/jev', answers: { [QUALITY_QUESTION]: { type: 'score', score } } }),
    )) as typeof fetch
}

async function withEnv<T>(env: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]))
  Object.entries(env).forEach(([k, v]) => {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  })
  try {
    return await fn()
  } finally {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    })
  }
}

async function main() {  process.env.AI_GATEWAY_API_KEY = 'k'
  const savedMode = process.env.JEV_QUALITY_GATE_MODE

  // mode=off: zero Jev calls
  let calls = 0
  const spy = (async () => {
    calls++
    return new Response('{}')
  }) as typeof fetch
  delete process.env.JEV_QUALITY_GATE_MODE
  const off = await runQualityGate(SEED, { fetchImpl: spy })
  ok(off.mode === 'off' && off.ok && off.score === null, 'default mode is off, ok, no score')
  ok(calls === 0, 'mode=off makes zero Jev calls')

  // shadow: score read back, proceeds on high and low
  process.env.JEV_QUALITY_GATE_MODE = 'shadow'
  const high = await runQualityGate(SEED, { fetchImpl: fakeScore(0.83) })
  ok(high.ok && high.mode === 'shadow' && high.score === 0.83, 'shadow reads the score and proceeds')

  const low = await runQualityGate(SEED, { fetchImpl: fakeScore(0.12) })
  ok(low.ok && low.score === 0.12, 'shadow proceeds on a low score')

  // wire shape: score question goes out as score with criteria
  let wire: any
  const wireSpy = (async (_url: unknown, init?: RequestInit) => {
    wire = JSON.parse(String(init?.body))
    return new Response(
      JSON.stringify({ model: 'typesafe-ai/jev', answers: { [QUALITY_QUESTION]: { type: 'score', score: 0.5 } } }),
    )
  }) as typeof fetch
  await runQualityGate(SEED, { fetchImpl: wireSpy })
  const q = wire.questions[QUALITY_QUESTION]
  ok(q.type === 'score' && q.criteria.length === 4, 'one score question with four criteria')
  ok(wire.state.startsWith('Title: The Ashen Reliquary'), 'state is title+description, not player text')

  // enforce: below threshold throws QualityGateError
  process.env.JEV_QUALITY_GATE_MODE = 'enforce'
  process.env.JEV_QUALITY_GATE_THRESHOLD = '0.6'
  let threw = false
  try {
    await runQualityGate(SEED, { fetchImpl: fakeScore(0.4) })
  } catch (e) {
    threw = e instanceof QualityGateError && e.score === 0.4 && e.threshold === 0.6
  }
  ok(threw, 'enforce throws QualityGateError below threshold')

  const pass = await runQualityGate(SEED, { fetchImpl: fakeScore(0.9) })
  ok(pass.ok && pass.score === 0.9, 'enforce passes above threshold')

  delete process.env.JEV_QUALITY_GATE_THRESHOLD
  const noThreshold = await runQualityGate(SEED, { fetchImpl: fakeScore(0.4) })
  ok(noThreshold.ok && noThreshold.bypassed === 'no threshold configured', 'enforce without threshold bypasses, never rejects')

  process.env.JEV_QUALITY_GATE_MODE = 'shadow'  // fallback: Jev absent/unreachable always proceeds
  const dead = (async () => {
    throw new TypeError('fetch failed')
  }) as typeof fetch
  const fb = await runQualityGate(SEED, { fetchImpl: dead })
  ok(fb.ok && fb.score === null && fb.mode === 'shadow', 'ok:false always proceeds in shadow')
  process.env.JEV_QUALITY_GATE_MODE = 'enforce'
  process.env.JEV_QUALITY_GATE_THRESHOLD = '0.6'
  const fbEnforce = await runQualityGate(SEED, { fetchImpl: dead })
  ok(fbEnforce.ok && fbEnforce.bypassed !== undefined, 'ok:false always proceeds even in enforce')

  if (savedMode === undefined) delete process.env.JEV_QUALITY_GATE_MODE
  else process.env.JEV_QUALITY_GATE_MODE = savedMode

  if (fails) {
    console.log(`${fails} failed`)
    process.exit(1)
  }
  console.log('all passed')
}

main()

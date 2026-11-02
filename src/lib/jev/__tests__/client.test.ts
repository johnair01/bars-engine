/**
 * Run: npx tsx src/lib/jev/__tests__/client.test.ts
 *
 * The Jev client's wire shape and its fallbacks, with a fake fetch (no network, no key).
 */

import { decide, fromGatewayAnswers, jevAuth, toGatewayRequest } from '@/lib/jev/client'

let fails = 0
function ok(cond: boolean, msg: string) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg)
  if (!cond) fails++
}

async function main() {
  delete process.env.AI_GATEWAY_API_KEY
  delete process.env.VERCEL_OIDC_TOKEN

  const wire = toGatewayRequest('s', {
    a: { type: 'noul', instructions: 'yes?' },
    b: { type: 'choice', instructions: 'which?', criteria: { x: 'X', y: 'Y' } },
  })
  ok(wire.questions.a.type === 'boolean', 'noul goes out as boolean')
  ok(wire.questions.b.type === 'choice', 'choice goes out as choice')

  const back = fromGatewayAnswers({ a: { type: 'boolean', probability: 0.9 }, b: { type: 'choice', choice: 'x' } })
  ok(back?.a.noul === 0.9 && back?.b.choice === 'x', 'answers come back in Jev names')
  ok(fromGatewayAnswers(null) === null, 'no answers is null')

  ok(jevAuth() === null, 'no credential, no auth')
  ok(jevAuth('oidc-tok')?.method === 'oidc', 'OIDC header is used when there is no key')
  process.env.AI_GATEWAY_API_KEY = 'k'
  ok(jevAuth('oidc-tok')?.method === 'api-key', 'the key wins over OIDC')

  let sent: RequestInit | undefined
  const fakeOk = (async (_url: unknown, init?: RequestInit) => {
    sent = init
    return new Response(JSON.stringify({ model: 'typesafe-ai/jev', answers: { answer: { type: 'boolean', probability: 0.97 } } }))
  }) as typeof fetch
  const good = await decide('authentication test', { answer: { type: 'noul', instructions: 'test?' } }, { fetchImpl: fakeOk })
  ok(good.ok && good.answers.answer.noul === 0.97, 'a good answer is read')
  const headers = sent?.headers as Record<string, string>
  ok(headers['authorization'] === 'Bearer k' && headers['ai-model-id'] === 'typesafe-ai/jev', 'key and model in headers')

  const fake403 = (async () => new Response('state echoed here', { status: 403 })) as typeof fetch
  const denied = await decide('secret state', { answer: { type: 'noul', instructions: 'q' } }, { fetchImpl: fake403 })
  ok(!denied.ok && denied.status === 403 && !JSON.stringify(denied).includes('echoed'), '403 falls back without echoing the body')

  const fakeThrow = (async () => { throw new TypeError('network') }) as typeof fetch
  const down = await decide('s', { answer: { type: 'noul', instructions: 'q' } }, { fetchImpl: fakeThrow })
  ok(!down.ok, 'a network failure falls back, never throws')

  const big = await decide('x'.repeat(100_001), { answer: { type: 'noul', instructions: 'q' } }, { fetchImpl: fakeOk })
  ok(!big.ok, 'state over the limit is refused before sending')

  delete process.env.AI_GATEWAY_API_KEY
  const none = await decide('s', { answer: { type: 'noul', instructions: 'q' } }, { fetchImpl: fakeOk })
  ok(!none.ok && none.auth === null, 'no credential falls back')

  if (fails) {
    console.log(`${fails} failed`)
    process.exit(1)
  }
  console.log('all passed')
}

main()

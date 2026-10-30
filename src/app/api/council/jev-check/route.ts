/**
 * @route GET /api/council/jev-check
 * @entity SYSTEM
 * @description Whether bars-engine can reach Jev through the Vercel AI Gateway, and with which credential
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @example GET /api/council/jev-check?token=<COUNCIL_MENU_TOKEN>
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { decide } from '@/lib/jev/client'

export const dynamic = 'force-dynamic'

/**
 * Wendell, 2026-10-30: "I've got it set up on my computer, but it seems I need to set it up in bars-engine". His Mac
 * reaches Jev through the gateway (`jev auth test --provider vercel`); this is the same test from the deployment. It
 * sends one fixed sentence, never data, and answers the credential used, the latency and Jev's yes probability.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret || !tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN required' }, { status: 401 })
  }
  const result = await decide(
    'authentication test',
    { answer: { type: 'noul', instructions: 'Is this an authentication test?' } },
    { oidcToken: req.headers.get('x-vercel-oidc-token') },
  )
  return NextResponse.json(
    {
      ...result,
      keySet: Boolean(process.env.AI_GATEWAY_API_KEY),
      oidcSeen: Boolean(req.headers.get('x-vercel-oidc-token') || process.env.VERCEL_OIDC_TOKEN),
    },
    { status: result.ok ? 200 : 502 },
  )
}

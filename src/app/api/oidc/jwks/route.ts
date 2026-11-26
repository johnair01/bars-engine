/**
 * Public half of the RS256 key that signs WorkAdventure's ID tokens.
 * WorkAdventure's openid-client selects it by `kid` from the ID token header.
 */
import { oidcJwks } from '@/lib/wa/oidc'

export const runtime = 'nodejs'

export function GET() {
  return Response.json(oidcJwks(), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}

/**
 * OIDC discovery for WorkAdventure's `OPENID_CLIENT_ISSUER`.
 */
import { oidcDiscovery } from '@/lib/wa/oidc'

export const runtime = 'nodejs'

export function GET() {
  return Response.json(oidcDiscovery(), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}

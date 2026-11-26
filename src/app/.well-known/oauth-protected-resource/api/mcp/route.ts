/**
 * RFC 9728 protected-resource metadata for the Council Board's MCP server: names the server's authorization server so a
 * client that got a 401 from /api/mcp can find where to sign in. The path-inserted form of the URL is the one the 401's
 * WWW-Authenticate header gives.
 */
import { publicOrigin, resourceUrl, SCOPE } from '@/lib/mcp-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    {
      resource: resourceUrl(),
      authorization_servers: [publicOrigin()],
      scopes_supported: [SCOPE],
      bearer_methods_supported: ['header'],
      resource_name: 'Council Board',
    },
    { headers: { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } },
  )
}

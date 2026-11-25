/**
 * RFC 8414 authorization-server metadata for the Council Board's MCP sign-in. Advertises PKCE S256, a public client
 * (no secret), dynamic registration and client-ID metadata documents.
 */
import { publicOrigin, SCOPE } from '@/lib/mcp-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  const base = publicOrigin()
  return Response.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/api/mcp/oauth/authorize`,
      token_endpoint: `${base}/api/mcp/oauth/token`,
      registration_endpoint: `${base}/api/mcp/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [SCOPE],
      client_id_metadata_document_supported: true,
    },
    { headers: { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } },
  )
}

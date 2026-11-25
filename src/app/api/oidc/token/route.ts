/**
 * OIDC token endpoint: exchanges the short-lived, PKCE-bound code for an access
 * token and an HS256 ID token. WorkAdventure's openid-client sends
 * `client_secret_basic`; `client_secret_post` is accepted for parity.
 */
import type { NextRequest } from 'next/server'
import { WA_OIDC_CLIENT_ID } from '@/lib/wa/config'
import { issueTokens, readAuthCode, verifyClientAuthentication } from '@/lib/wa/oidc'
import { verifyPkce } from '@/lib/wa/jwt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TokenBody = Record<string, string>

async function readBody(request: NextRequest): Promise<TokenBody> {
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      const parsed = (await request.json()) as Record<string, unknown>
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')]),
      )
    } catch {
      return {}
    }
  }
  const text = await request.text()
  return Object.fromEntries(new URLSearchParams(text))
}

function oidcError(error: string, description: string, status = 400) {
  return Response.json({ error, error_description: description }, { status })
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)

  const authenticated = verifyClientAuthentication({
    authorizationHeader: request.headers.get('authorization'),
    bodyClientId: body.client_id,
    bodyClientSecret: body.client_secret,
  })
  if (!authenticated) return oidcError('invalid_client', 'client authentication failed', 401)

  if (body.grant_type !== 'authorization_code') {
    return oidcError('unsupported_grant_type', 'only authorization_code is supported')
  }
  if (!body.code) return oidcError('invalid_request', 'code is required')
  if (!body.redirect_uri) return oidcError('invalid_request', 'redirect_uri is required')

  const code = readAuthCode(body.code)
  if (!code.ok) return oidcError('invalid_grant', code.error)

  if (code.payload.clientId !== WA_OIDC_CLIENT_ID) {
    return oidcError('invalid_grant', 'code was issued to another client')
  }
  if (code.payload.redirectUri !== body.redirect_uri) {
    return oidcError('invalid_grant', 'redirect_uri does not match the code')
  }

  if (code.payload.codeChallenge) {
    if (!body.code_verifier) {
      return oidcError('invalid_request', 'code_verifier is required')
    }
    if (!verifyPkce(body.code_verifier, code.payload.codeChallenge)) {
      return oidcError('invalid_grant', 'code_verifier does not match the challenge')
    }
  }

  const tokens = issueTokens({
    sub: code.payload.sub,
    email: code.payload.email,
    name: code.payload.name,
    tags: code.payload.tags,
    scope: code.payload.scope,
    nonce: code.payload.nonce,
  })

  return Response.json(tokens, {
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
}

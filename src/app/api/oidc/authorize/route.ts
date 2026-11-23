/**
 * OIDC authorization endpoint. WorkAdventure redirects the browser here; if the
 * person is not signed into bars-engine, the existing login page takes over and
 * returns to this exact URL afterwards.
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { WA_OIDC_CLIENT_ID } from '@/lib/wa/config'
import { createAuthCode, readAuthorizeParams } from '@/lib/wa/oidc'
import { emailForPlayer, tagsForPlayer } from '@/lib/wa/player'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function errorRedirect(redirectUri: string, state: string | undefined, error: string): NextResponse {
  const target = new URL(redirectUri)
  target.searchParams.set('error', error)
  if (state) target.searchParams.set('state', state)
  return NextResponse.redirect(target)
}

export async function GET(request: NextRequest) {
  const validation = readAuthorizeParams(request.nextUrl.searchParams)
  if (!validation.ok) {
    if (validation.redirectUri && validation.state) {
      return errorRedirect(validation.redirectUri, validation.state, validation.error)
    }
    return Response.json({ error: validation.error }, { status: 400 })
  }

  const params = validation.params
  const player = await getCurrentPlayer()

  if (!player) {
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`
    const login = new URL('/login', request.nextUrl.origin)
    login.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(login)
  }

  if (!WA_OIDC_CLIENT_ID) {
    return errorRedirect(params.redirectUri, params.state, 'server_error')
  }

  const code = createAuthCode(
    {
      id: player.id,
      name: player.name,
      email: emailForPlayer(player),
      tags: tagsForPlayer(player),
    },
    params,
  )

  const target = new URL(params.redirectUri)
  target.searchParams.set('code', code)
  if (params.state) target.searchParams.set('state', params.state)
  return NextResponse.redirect(target)
}

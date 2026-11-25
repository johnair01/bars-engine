import { beforeAll, describe, expect, it } from 'vitest'

type OidcModule = typeof import('../oidc')

let oidc: OidcModule

const params = {
  clientId: 'workadventure',
  redirectUri: 'https://world.test/openid-callback',
  responseType: 'code',
  scope: 'openid email profile',
  state: 'state-1',
  nonce: 'nonce-1',
  codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  codeChallengeMethod: 'S256',
}

beforeAll(async () => {
  process.env.WA_OIDC_SIGNING_SECRET = 'oidc-test-secret'
  process.env.WA_OIDC_CLIENT_SECRET = 'oidc-client-secret'
  process.env.WA_OIDC_REDIRECT_URIS = 'https://world.test/openid-callback'
  oidc = await import('../oidc')
})

describe('wa oidc', () => {
  it('validates the client and the registered redirect', () => {
    const search = new URLSearchParams({
      client_id: 'workadventure',
      redirect_uri: 'https://world.test/openid-callback',
      response_type: 'code',
      scope: 'openid email profile',
      state: 'state-1',
    })
    const result = oidc.readAuthorizeParams(search)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.params.state).toBe('state-1')
  })

  it('refuses an unregistered redirect', () => {
    const search = new URLSearchParams({
      client_id: 'workadventure',
      redirect_uri: 'https://evil.test/callback',
      response_type: 'code',
      scope: 'openid',
    })
    const result = oidc.readAuthorizeParams(search)
    expect(result.ok).toBe(false)
  })

  it('issues a code that carries the player and PKCE challenge', () => {
    const player = { id: 'player-1', name: 'Yun', email: 'yun@example.test', tags: ['gm'] }
    const code = oidc.createAuthCode(player, params, 1000)
    const read = oidc.readAuthCode(code, 1001)
    expect(read.ok).toBe(true)
    if (read.ok) {
      expect(read.payload.sub).toBe('player-1')
      expect(read.payload.tags).toEqual(['gm'])
      expect(read.payload.codeChallenge).toBe(params.codeChallenge)
      expect(read.payload.nonce).toBe('nonce-1')
    }
  })

  it('expires a code after two minutes', () => {
    const code = oidc.createAuthCode({ id: 'player-1', name: 'Yun', tags: [] }, params, 1000)
    const read = oidc.readAuthCode(code, 1200)
    expect(read.ok).toBe(false)
  })

  it('issues an access token and an ID token with the same subject', () => {
    const tokens = oidc.issueTokens({
      sub: 'player-1',
      email: 'yun@example.test',
      name: 'Yun',
      tags: ['gm'],
      scope: 'openid email profile',
      nonce: 'nonce-1',
      nowSeconds: 1000,
    })
    const access = oidc.readAccessToken(tokens.access_token, 1001)
    expect(access.ok).toBe(true)
    if (access.ok) {
      expect(access.claims.sub).toBe('player-1')
      expect(access.claims.tags).toEqual(['gm'])
    }
    expect(tokens.id_token.split('.')).toHaveLength(3)
  })

  it('publishes discovery metadata WorkAdventure can discover', () => {
    const discovery = oidc.oidcDiscovery()
    expect(discovery.authorization_endpoint).toMatch(/\/api\/oidc\/authorize$/)
    expect(discovery.id_token_signing_alg_values_supported).toEqual(['HS256'])
    expect(discovery.code_challenge_methods_supported).toEqual(['S256'])
  })
})

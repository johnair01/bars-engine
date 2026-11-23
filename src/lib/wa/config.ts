/**
 * Configuration for the WorkAdventure seams.
 *
 * WorkAdventure is the venue: it owns movement, presence, video, maps, and the
 * avatar shelf. bars-engine owns identity and character truth. This module keeps
 * every URL and secret name in one place so the routes cannot drift from the
 * box's `.env`.
 *
 * @see docs/WA_IDENTITY_AND_ASSETS.md
 */

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/** Where WorkAdventure's pusher reaches us. Must match `ADMIN_API_URL` on the box. */
export const WA_ADMIN_API_URL = withoutTrailingSlash(
  process.env.BARS_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bars-engine.vercel.app',
)

/** The shared secret WorkAdventure sends as `Authorization: <token>`. */
export const WA_ADMIN_API_TOKEN = process.env.WA_ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN || ''

export const WA_OIDC_CLIENT_ID = process.env.WA_OIDC_CLIENT_ID || 'workadventure'

export const WA_OIDC_CLIENT_SECRET = process.env.WA_OIDC_CLIENT_SECRET || ''

/** RS256 private key (PKCS8 PEM) for ID tokens. WorkAdventure's client requires RS256. */
export const WA_OIDC_PRIVATE_KEY = (process.env.WA_OIDC_PRIVATE_KEY || '').replace(/\\n/g, '\n')

export const WA_OIDC_KEY_ID = process.env.WA_OIDC_KEY_ID || 'wa-1'

/** The OIDC issuer advertised at `/.well-known/openid-configuration`. */
export const WA_OIDC_ISSUER = withoutTrailingSlash(
  process.env.WA_OIDC_ISSUER || WA_ADMIN_API_URL,
)

/**
 * Redirect URIs WorkAdventure may ask us to return to. The box computes its own
 * from `PUSHER_URL`, so `https://world.masteringallyship.com/openid-callback` is
 * the production default. Add preview hosts with a comma-separated env value.
 */
export const WA_OIDC_REDIRECT_URIS = (
  process.env.WA_OIDC_REDIRECT_URIS || 'https://world.masteringallyship.com/openid-callback'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

/** Signing secret for short-lived OIDC codes and tokens. Falls back to the admin token. */
export const WA_OIDC_SIGNING_SECRET =
  process.env.WA_OIDC_SIGNING_SECRET || WA_ADMIN_API_TOKEN || process.env.SECRET_KEY || ''

/** Public origin of the map-storage volume, used to turn a room URL into a map URL. */
export const WA_MAP_STORAGE_PUBLIC_URL = withoutTrailingSlash(
  process.env.WA_MAP_STORAGE_PUBLIC_URL ||
    'https://world.masteringallyship.com/map-storage',
)

/** The map a player lands on when no room URL names one. */
export const WA_DOJO_WAM_URL =
  process.env.WA_DOJO_WAM_URL ||
  `${WA_MAP_STORAGE_PUBLIC_URL}/calrunian-dojo/calrunian-dojo.wam`

/** Tags that open the in-room editor and the GM surfaces. */
export const WA_EDITOR_TAGS = ['admin', 'editor', 'gm']

/** Optional explicit allow-list for editors, in addition to role tags. */
export const WA_EDITOR_PLAYER_IDS = (process.env.WA_EDITOR_PLAYER_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

export const WA_ROOM_ACCESS_ENABLED = true

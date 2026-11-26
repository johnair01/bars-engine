/**
 * Resolve the identifier the WorkAdventure pusher relays (`userIdentifier`) to
 * a Player. It is the OIDC `sub` (Player.id) or the account email, the same two
 * forms /api/room/access accepts. A miss is logged with the identifier so the
 * box log shows which form WorkAdventure sent (the 2026-11-24 404s).
 */
import { db } from '@/lib/db'

type FindClient = Pick<typeof db, 'player'>

export async function findPlayerByIdentifier<S extends Record<string, boolean>>(
  userIdentifier: string,
  select: S,
  route: string,
  client: FindClient = db
) {
  const byId = await client.player.findUnique({ where: { id: userIdentifier }, select })
  if (byId) return byId
  const byEmail = await client.player.findFirst({
    where: { contactValue: { equals: userIdentifier, mode: 'insensitive' }, contactType: 'email' },
    select,
  })
  if (byEmail) return byEmail
  console.warn(
    `[wa] ${route}: no player for userIdentifier=${JSON.stringify(userIdentifier)} ` +
      `(looksLikeEmail=${userIdentifier.includes('@')}, length=${userIdentifier.length}); tried Player.id then email`
  )
  return null
}

export function playerNotFoundResponse(userIdentifier: string) {
  return Response.json(
    {
      error: 'player not found',
      detail: 'userIdentifier matched neither a Player.id nor an account email',
      userIdentifier,
    },
    { status: 404 }
  )
}

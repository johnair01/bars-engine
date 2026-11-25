/**
 * WorkAdventure's capability probe. Public: the pusher calls it without the
 * admin token and decides which optional Admin API routes to use.
 *
 * Only the capabilities this bridge actually implements are advertised. An
 * absent capability is a feature WA leaves to its local implementation, which
 * is better than advertising a route that returns an error.
 */
export const runtime = 'nodejs'

export function GET() {
  return Response.json({
    'api/woka/list': 'v1',
    'api/save-textures': 'v1',
    'api/save-name': 'v1',
  })
}

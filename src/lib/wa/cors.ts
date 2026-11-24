export function waCors(request: Request): Record<string, string> {
  const allowed = process.env.WA_WORLD_ORIGIN || 'https://world.masteringallyship.com'
  const origin = request.headers.get('origin')
  // WorkAdventure runs map scripts in an iframe whose origin is the map's host, so the map host
  // (this site) is also allowed.
  const ok = origin === allowed || origin === 'https://bars-engine.vercel.app'
  return {
    'Access-Control-Allow-Origin': ok ? origin! : allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

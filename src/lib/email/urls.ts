/**
 * App-absolute URLs for email links.
 */
export function absoluteUrl(path: string): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://bars-engine.vercel.app'
  const base = raw.replace(/\/$/, '')
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * The intake's preview token. On a Vercel preview or a dev server, the edit link
 * `/campaigns/<slug>/edit/preview/intake` opens the intake with no real token:
 * answers stay in the browser, nothing is written to the database, and STUCK?
 * emails go to Wendell marked "[Preview test]". Production never accepts it.
 */
export const INTAKE_PREVIEW_TOKEN = 'preview'

export function isIntakePreview(token: string): boolean {
  if (token !== INTAKE_PREVIEW_TOKEN) return false
  return process.env.VERCEL_ENV === 'preview' || (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'development')
}

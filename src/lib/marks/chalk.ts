/**
 * The chalk ring (Wendell's pick on the look pm-mark-look-1, option A): on a preview he holds a finger still on the
 * trouble spot, a chalk ring circles it, and a slip takes one line that lands on the Council Board. The script is one
 * file, public/marks/chalk.js; this is the one tag every page that serves its own HTML adds to load it.
 */
export const CHALK_TAG = '<script src="/marks/chalk.js" defer></script>'

/** Whether this build carries the chalk ring: Vercel preview deployments only (they sit behind Vercel's own login). */
export const chalkOn = (env = process.env.VERCEL_ENV) => env === 'preview'

/** The page with the chalk tag before </head> (or </body>, or at the end), when `on`; unchanged otherwise. */
export function withChalk(html: string, on = chalkOn()): string {
  if (!on || html.includes(CHALK_TAG)) return html
  for (const close of [/<\/head>/i, /<\/body>/i]) {
    const m = close.exec(html)
    if (m) return html.slice(0, m.index) + CHALK_TAG + '\n' + html.slice(m.index)
  }
  return html + '\n' + CHALK_TAG
}

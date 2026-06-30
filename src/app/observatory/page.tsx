import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getObservatory } from '@/actions/observatory'

/**
 * @page /observatory
 * @entity SYSTEM
 * @description The Observatory — temporal navigation over the Lens hierarchy
 *   (orientation → vision → year → quarter → month → week → today). Planetarium:
 *   every Lens is a telescope; zoom through time. LENS1 skeleton.
 * @permissions authenticated
 * @relationships LENS (the 7 levels), CUSTOM_BAR (grown under a lens)
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:lenses, WHERE:observatory, ENERGY:orient
 * @agentDiscoverable false
 */
export const dynamic = 'force-dynamic'

const purple = 'var(--bars-liminal)'
const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'

export default async function ObservatoryPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const res = await getObservatory()
  const levels = 'error' in res ? [] : res.levels
  const err = 'error' in res ? res.error : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)' }}>
      <div className="w-full" style={{ maxWidth: 432, margin: '0 auto', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))' }}>
        <header className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <Link href="/" style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            ← Back
          </Link>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: purple }}>Observatory</span>
        </header>

        <div style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purple, margin: 0 }}>The planetarium</p>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '4px 0 0' }}>
            Zoom through time
          </h1>
          <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 0' }}>
            Every lens is a telescope. Broadest at the top, today at the bottom.
          </p>
        </div>

        {err && <p style={{ fontFamily: body, fontSize: 13, color: '#e05c2e' }}>{err}</p>}

        {/* Telescope stack: broadest (orientation) → today */}
        <div className="flex flex-col gap-2">
          {levels.map((lvl) => {
            const unauthored = !lvl.authored
            return (
              <Link
                key={lvl.level}
                href={`/observatory/${lvl.level}`}
                className="flex items-center justify-between"
                style={{
                  textDecoration: 'none',
                  minHeight: 56,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--bars-surface-card)',
                  boxShadow: unauthored
                    ? 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line-dashed)'
                    : 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
                  opacity: unauthored ? 0.85 : 1,
                }}
              >
                <div className="min-w-0">
                  <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: 0 }}>
                    {lvl.level}
                  </p>
                  <p style={{ fontFamily: display, fontWeight: 700, fontSize: 15, color: 'var(--bars-text-primary)', margin: '2px 0 0' }}>
                    {unauthored ? `Name your ${lvl.level} →` : lvl.label}
                  </p>
                </div>
                {!unauthored && (
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: lvl.barCount > 0 ? purple : 'var(--bars-text-muted)' }}>
                    {lvl.barCount > 0 ? `${lvl.barCount} ✦` : '—'}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

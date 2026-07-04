import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getLensLevel } from '@/actions/observatory'
import { getWeeklyReflectionSummary } from '@/actions/weekly-reflection'
import { LensAuthorForm } from '../LensAuthorForm'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { WeeklyReflectionRitual } from '@/components/observatory/WeeklyReflectionRitual'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

/**
 * @page /observatory/[level]
 * @entity SYSTEM
 * @description A single Observatory level — its Lens + the BARs grown under it.
 *   Vision/orientation are authored here; calendar levels are auto-seeded.
 * @permissions authenticated
 * @relationships LENS, CUSTOM_BAR (lensId)
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:one lens, WHERE:observatory, ENERGY:orient
 * @agentDiscoverable false
 */
export const dynamic = 'force-dynamic'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

const VALID: ReadonlySet<string> = new Set(['fire', 'water', 'wood', 'metal', 'earth'])
function el(raw: string | null): ElementKey {
  const v = (raw ?? '').toLowerCase()
  return (VALID.has(v) ? v : 'earth') as ElementKey
}

export default async function ObservatoryLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { level } = await params
  const res = await getLensLevel(level)
  if ('error' in res) {
    if (res.error === 'Unknown level') notFound()
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)' }} className="flex items-center justify-center p-6">
        <p style={{ fontFamily: body, fontSize: 14, color: 'var(--bars-text-secondary)' }}>{res.error}</p>
      </div>
    )
  }

  const authorable = res.level === 'vision' || res.level === 'orientation'
  const isWeekly = res.level === 'weekly'
  const reflectionRes = isWeekly ? await getWeeklyReflectionSummary() : null
  const reflection = reflectionRes && !('error' in reflectionRes) ? reflectionRes : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)' }}>
      <div className="w-full" style={{ maxWidth: 432, margin: '0 auto', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))' }}>
        <header className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <Link href="/observatory" style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            ← Observatory
          </Link>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: purple }}>{res.level}</span>
        </header>

        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: 0 }}>
            {res.title}
          </h1>
          {res.description && (
            <p style={{ fontFamily: body, fontSize: 13, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 0' }}>{res.description}</p>
          )}
        </div>

        {authorable && (
          <LensAuthorForm
            level={res.level as 'vision' | 'orientation'}
            initialTitle={res.authored ? res.title ?? '' : ''}
            initialDescription={res.description ?? ''}
          />
        )}

        {isWeekly && reflection && <WeeklyReflectionRitual summary={reflection} />}
        {isWeekly && reflectionRes && 'error' in reflectionRes && (
          <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)', marginTop: 16 }}>
            {reflectionRes.error}
          </p>
        )}

        {/* BARs grown under this lens */}
        <div style={{ marginTop: 22 }}>
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', marginBottom: 10 }}>
            Grown under this lens
          </p>
          {res.bars.length === 0 ? (
            <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)' }}>
              Nothing yet. BARs you plant under this lens will appear here.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {res.bars.map((b) => {
                const element = el(b.element)
                const gem = ELEMENT_TOKENS[element].gem
                return (
                  <Link key={b.id} href={`/bars/${b.id}`} style={{ textDecoration: 'none' }}>
                    <CultivationCard element={element} altitude="neutral" stage="seed" className="w-full" aria-label={b.title}>
                      <div className="flex items-center gap-3 p-3">
                        <span className="flex-none flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, background: `color-mix(in srgb, ${gem} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${gem} 45%, transparent)`, color: gem, fontSize: 15 }} aria-hidden>
                          {ELEMENT_TOKENS[element].sigil}
                        </span>
                        <p className="min-w-0 flex-1" style={{ fontFamily: body, fontSize: 14, color: 'var(--bars-text-primary)', margin: 0 }}>{b.title}</p>
                      </div>
                    </CultivationCard>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

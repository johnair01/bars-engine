import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getGarden } from '@/actions/garden'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

/**
 * @page /garden
 * @entity SYSTEM
 * @description The Garden — the player's planted BARs (those with a gardenId).
 *   Separate from Hand / Vault / World. First slice of the Lens/Living-World work.
 * @permissions authenticated
 * @relationships CUSTOM_BAR (planted: gardenId), LENS (grown under)
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:planted BARs, WHERE:garden, ENERGY:cultivate
 * @agentDiscoverable false
 */
export const dynamic = 'force-dynamic'

const VALID: ReadonlySet<string> = new Set(['fire', 'water', 'wood', 'metal', 'earth'])
function el(raw: string | null): ElementKey {
  const v = (raw ?? '').toLowerCase()
  return (VALID.has(v) ? v : 'earth') as ElementKey
}

export default async function GardenPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const res = await getGarden()
  const plants = 'error' in res ? [] : res.plants
  const err = 'error' in res ? res.error : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)' }}>
      <div className="w-full" style={{ maxWidth: 432, margin: '0 auto', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))' }}>
        <header className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <Link href="/" style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            ← Back
          </Link>
          <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bars-wood-gem)' }}>
            Garden
          </span>
        </header>

        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bars-wood-gem)', margin: 0 }}>
              What you&rsquo;ve planted
            </p>
            <h1 style={{ fontFamily: 'var(--bars-font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '4px 0 0' }}>
              {plants.length > 0 ? `${plants.length} growing` : 'Your garden'}
            </h1>
          </div>
          <Link
            href="/forge"
            style={{ flex: '0 0 auto', textDecoration: 'none', padding: '9px 13px', borderRadius: 'var(--bars-radius-md, 10px)', background: 'color-mix(in srgb, var(--bars-liminal) 16%, var(--bars-surface-card))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 45%, var(--bars-line))', fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-liminal-glow)' }}
          >
            ✦ Forge a move
          </Link>
        </div>

        {err && <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 13, color: '#e05c2e' }}>{err}</p>}

        {plants.length === 0 ? (
          <div
            className="flex flex-col items-center text-center"
            style={{ marginTop: 28, padding: '28px 20px', border: '1px dashed var(--bars-line-dashed)', borderRadius: 12, background: 'var(--bars-surface-inset)' }}
          >
            <span style={{ fontSize: 26, color: 'var(--bars-wood-gem)' }} aria-hidden>❖</span>
            <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', margin: '14px 0 0' }}>
              Nothing planted yet. Plant a task from <Link href="/tap-the-vein" style={{ color: 'var(--bars-liminal)' }}>Tap the Vein</Link>, or <Link href="/forge" style={{ color: 'var(--bars-liminal)' }}>forge a promise move</Link> — and it will grow here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {plants.map((p) => {
              const element = el(p.element)
              const gem = ELEMENT_TOKENS[element].gem
              return (
                <Link key={p.id} href={`/bars/${p.id}`} style={{ textDecoration: 'none' }}>
                  <CultivationCard
                    element={element}
                    altitude={p.composted ? 'dissatisfied' : 'neutral'}
                    stage={p.composted ? 'composted' : 'seed'}
                    className="w-full"
                    aria-label={`Planted: ${p.title}${p.composted ? ', composted' : ''}`}
                  >
                    <div className="flex items-center gap-3 p-3" style={{ opacity: p.composted ? 0.6 : 1 }}>
                      <span
                        className="flex-none flex items-center justify-center rounded-lg"
                        style={{ width: 38, height: 38, background: `color-mix(in srgb, ${gem} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${gem} 45%, transparent)`, color: gem, fontSize: 16 }}
                        aria-hidden
                      >
                        {ELEMENT_TOKENS[element].sigil}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 14, lineHeight: 1.35, color: 'var(--bars-text-primary)', margin: 0 }}>
                          {p.title}
                        </p>
                        <p style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '3px 0 0' }}>
                          {p.composted
                            ? 'composted · feeds the soil'
                            : p.eaArc ?? (p.maturity ?? 'seed').replace(/_/g, ' ')}
                        </p>
                        {!p.composted && p.experienceIntent && (
                          <p style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: gem, margin: '2px 0 0' }}>
                            {p.experienceIntent}
                          </p>
                        )}
                      </div>
                    </div>
                  </CultivationCard>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

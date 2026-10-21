/**
 * @route /campaigns/[slug]
 * @entity CAMPAIGN
 * @description A hosted allyship campaign: one person's practice, the four allyship
 *   domains as the ways to help, and a join form that puts each supporter on her
 *   list. `/campaigns/annastasia` is the pilot. Public, no auth, no AI.
 * @permissions public (admins additionally see the owner's edit link)
 * @dimensions WHO:a supporter of a skilled helper, WHAT:allyship campaign + join,
 *   WHERE:hosted campaign, ENERGY:show_up
 *
 * Content defaults and the edit model live in `src/lib/hosted-campaigns/`. Rendered
 * dynamically because she edits it at runtime from her own link.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { domainGemVar } from '@/lib/allyship-domains'
import { isCurrentPlayerAdmin } from '@/lib/ally-campaign/content-server'
import {
  DOMAIN_ASK,
  FIELD_SPEC,
  getHostedDefault,
  progressPercent,
  resolveHosted,
  type HostedCampaignFields,
  type HostedFieldKey,
} from '@/lib/hosted-campaigns/campaigns'
import { getHostedStore } from '@/lib/hosted-campaigns/server'
import { JoinForm } from './JoinForm'
import { EditLinkBox } from './EditLinkBox'
import { Paths, sceneFor } from './Paths'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = getHostedDefault(slug)
  return {
    title: c ? `Back ${c.fields.name} — an allyship campaign` : 'Campaign',
    description: c?.fields.tagline || 'Choose your way in: get support, back a new practice, or pass the word.',
  }
}

const PROMPT = Object.fromEntries(FIELD_SPEC.map((f) => [f.key, f.prompt])) as Record<HostedFieldKey, string>

/** A field's value, or its prompt styled as a gap still to fill. */
function Val({ f, k }: { f: HostedCampaignFields; k: HostedFieldKey }) {
  if (f[k]) return <>{f[k]}</>
  return (
    <span
      className="rounded px-1"
      style={{ color: 'var(--bars-gold)', background: 'var(--bars-surface-inset)', border: '1px dashed var(--bars-line-dashed)' }}
    >
      {PROMPT[k]}
    </span>
  )
}

export default async function HostedCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ path?: string | string[] }>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const [store, isAdmin] = await Promise.all([getHostedStore(), isCurrentPlayerAdmin()])
  const campaign = resolveHosted(slug, store)
  if (!campaign) notFound()
  const f = campaign.fields
  const pct = progressPercent(f)
  const scene = sceneFor(typeof sp.path === 'string' ? sp.path : undefined, campaign)
  const h2 = { fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-xl)', color: 'var(--bars-text-primary)' }

  return (
    <main className="flex min-h-screen justify-center" style={{ background: 'var(--bars-bg-base)', fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)' }}>
      <div className="flex w-full max-w-[680px] flex-col gap-10 px-5 pb-20 pt-10">
        {isAdmin && <EditLinkBox slug={campaign.slug} token={store[campaign.slug]?.editToken ?? null} />}

        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase" style={{ letterSpacing: 'var(--bars-tracking-wide)', color: 'var(--bars-earth-gem)' }}>
            An allyship campaign{f.practice ? <> for {f.practice}</> : null}
          </p>
          <h1 style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-4xl)', lineHeight: 'var(--bars-leading-tight)' }}>
            Back <Val f={f} k="name" />
          </h1>
          <p style={{ fontSize: 'var(--bars-text-lg)', color: 'var(--bars-text-secondary)' }}>
            <Val f={f} k="tagline" />
          </p>
          <div className="mt-2 flex flex-col gap-2 rounded-lg p-4" style={{ background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' }}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-2xl)' }}><Val f={f} k="raised" /></span>
              <span style={{ color: 'var(--bars-text-secondary)' }}>raised of <Val f={f} k="goal" /></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bars-surface-inset)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct ?? 0}%`, background: 'var(--bars-earth-gem)' }} />
            </div>
            {f.deadline && <p className="text-sm" style={{ color: 'var(--bars-text-secondary)' }}>Open until {f.deadline}</p>}
          </div>
        </header>

        <section id="stage" className="scroll-mt-6 rounded-xl p-5" style={{ background: 'var(--bars-surface-inset)', border: '1px solid var(--bars-line)' }}>
          <Paths campaign={campaign} scene={scene} val={(k) => <Val f={f} k={k} />} />
        </section>

        <section id="join" className="flex scroll-mt-6 flex-col gap-3">
          <h2 style={h2}>Join the crew</h2>
          <p style={{ color: 'var(--bars-text-secondary)' }}>
            Every campaign runs on four kinds of work. Pick the one you can do without strain and tell her you are in.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ALLYSHIP_DOMAINS.map((d) => (
              <div key={d.key} className="rounded-lg p-4" style={{ background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)', borderTop: `3px solid ${domainGemVar(d.key)}` }}>
                <h3 className="font-semibold" style={{ color: domainGemVar(d.key) }}>{d.label}</h3>
                <p className="text-sm" style={{ color: 'var(--bars-text-secondary)' }}><Val f={f} k={DOMAIN_ASK[d.key]} /></p>
              </div>
            ))}
          </div>
          <JoinForm slug={campaign.slug} name={f.name || 'her'} />
        </section>

        <section className="flex flex-col gap-2" style={{ color: 'var(--bars-text-secondary)' }}>
          <p>Her episode of Mastering Allyship releases <Val f={f} k="episode" />.</p>
          <p>Follow along: <Val f={f} k="followAlong" /></p>
          <p className="mt-4 italic">If none of this fits right now, that is a real answer. You can come back any time.</p>
        </section>
      </div>
    </main>
  )
}

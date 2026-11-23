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

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = getHostedDefault(slug)
  return {
    title: c ? `Back ${c.fields.name} — an allyship campaign` : 'Campaign',
    description: 'Three ways to put resources behind a new practice, and a place to join the campaign.',
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

function Way({ title, body, href, label }: { title: string; body: React.ReactNode; href: string; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg p-4" style={{ background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' }}>
      <h3 style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-lg)', color: 'var(--bars-text-primary)' }}>{title}</h3>
      <p style={{ color: 'var(--bars-text-secondary)' }}>{body}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start rounded-md px-4 py-2 font-semibold"
          style={{ background: 'var(--bars-earth-gem)', color: 'var(--bars-bg-base)' }}
        >
          {label}
        </a>
      ) : (
        <span className="self-start rounded-md px-4 py-2 text-sm" style={{ color: 'var(--bars-text-muted)', border: '1px dashed var(--bars-line-dashed)' }}>
          {label}: link coming
        </span>
      )}
    </div>
  )
}

export default async function HostedCampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [store, isAdmin] = await Promise.all([getHostedStore(), isCurrentPlayerAdmin()])
  const campaign = resolveHosted(slug, store)
  if (!campaign) notFound()
  const f = campaign.fields
  const pct = progressPercent(f)
  const h2 = { fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-xl)', color: 'var(--bars-text-primary)' }

  return (
    <main className="flex min-h-screen justify-center" style={{ background: 'var(--bars-bg-base)', fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)' }}>
      <div className="flex w-full max-w-[680px] flex-col gap-10 px-5 pb-20 pt-10">
        {isAdmin && <EditLinkBox slug={campaign.slug} token={store[campaign.slug]?.editToken ?? null} />}

        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase" style={{ letterSpacing: 'var(--bars-tracking-wide)', color: 'var(--bars-earth-gem)' }}>
            An allyship campaign
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

        <section className="flex flex-col gap-3">
          <h2 style={h2}>The story</h2>
          {f.story ? (
            f.story.split(/\n{2,}/).map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)
          ) : (
            <p><Val f={f} k="story" /></p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 style={h2}>Three ways to put resources behind it</h2>
          <div className="grid gap-3">
            <Way title="Give to the GoFundMe" href={f.gofundmeUrl} label="Donate" body={<>A one-time gift for <Val f={f} k="gofundmeFor" />.</>} />
            <Way title="Join the Patreon" href={f.patreonUrl} label="Join" body="A small monthly pledge is income she can plan around. Following for free counts too." />
            <Way title="Book a session" href={f.bookingUrl} label="Book" body={<><Val f={f} k="bookWhat" />. Rate: <Val f={f} k="rate" />.</>} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 style={h2}>Be part of the campaign</h2>
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

/**
 * The campaign as a choose-your-own-adventure: a visitor picks the door that fits
 * them (needs support, wants to back her, knows someone, wants to know who she is)
 * and each scene ends in more choices. Every scene is a URL (`?path=<scene>`), so
 * the page needs no JavaScript and any scene can be linked to directly.
 *
 * Wendell, 2026-10-21: "integrate that with her campaign page in a CYOA style for
 * people to know how to work and support her".
 */
import type { ReactNode } from 'react'
import type { HostedCampaign, HostedCampaignFields, HostedFieldKey, HostedService } from '@/lib/hosted-campaigns/campaigns'

export const BASE_SCENES = ['start', 'wire', 'net', 'share', 'founder'] as const

/** The scene a `?path=` value names, or the entrance for anything unknown. */
export function sceneFor(path: string | undefined, campaign: HostedCampaign): string {
  if (!path) return 'start'
  if ((BASE_SCENES as readonly string[]).includes(path)) return path
  return campaign.services.some((s) => s.key === path) ? path : 'start'
}

type ValFn = (k: HostedFieldKey) => ReactNode

interface Choice {
  to: string
  text: string
}

const h3 = { fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-2xl)', color: 'var(--bars-text-primary)', lineHeight: 'var(--bars-leading-tight)' }
const card = { background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' }

function Choices({ choices }: { choices: Choice[] }) {
  return (
    <nav className="mt-2 flex flex-col gap-2" aria-label="Choose where to go next">
      {choices.map((c) => (
        <a
          key={c.to + c.text}
          href={`?path=${c.to}#stage`}
          className="rounded-md px-4 py-3 font-semibold transition-colors"
          style={{ ...card, color: 'var(--bars-text-primary)' }}
        >
          <span aria-hidden style={{ color: 'var(--bars-earth-gem)' }}>→ </span>
          {c.text}
        </a>
      ))}
    </nav>
  )
}

function Button({ href, label }: { href: string; label: string }) {
  if (!href) {
    return (
      <span className="self-start rounded-md px-4 py-2 text-sm" style={{ color: 'var(--bars-text-muted)', border: '1px dashed var(--bars-line-dashed)' }}>
        {label}: link coming
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="self-start rounded-md px-4 py-2 font-semibold"
      style={{ background: 'var(--bars-earth-gem)', color: 'var(--bars-bg-base)' }}
    >
      {label}
    </a>
  )
}

function Way({ title, body, href, label }: { title: string; body: ReactNode; href: string; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg p-4" style={card}>
      <h4 className="font-semibold" style={{ fontSize: 'var(--bars-text-lg)' }}>{title}</h4>
      <p style={{ color: 'var(--bars-text-secondary)' }}>{body}</p>
      <Button href={href} label={label} />
    </div>
  )
}

function Scene({ kicker, title, children, choices }: { kicker: string; title: ReactNode; children: ReactNode; choices: Choice[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase" style={{ letterSpacing: 'var(--bars-tracking-wide)', color: 'var(--bars-earth-gem)' }}>{kicker}</p>
      <h3 style={h3}>{title}</h3>
      {children}
      <Choices choices={choices} />
    </div>
  )
}

function paragraphs(text: string) {
  return text.split(/\n{2,}/).map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)
}

function ServiceScene({ s, f, val, others }: { s: HostedService; f: HostedCampaignFields; val: ValFn; others: Choice[] }) {
  const price = s.usesRate ? val('rate') : s.price
  return (
    <Scene kicker={s.title} title={s.title} choices={others}>
      <p>{s.body}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg p-4 text-sm" style={card}>
        <dt style={{ color: 'var(--bars-text-muted)' }}>Price</dt>
        <dd>{price}</dd>
        <dt style={{ color: 'var(--bars-text-muted)' }}>Length</dt>
        <dd>{s.length}</dd>
      </dl>
      <Button href={f.bookingUrl} label={s.price === 'No cost' ? 'Schedule it' : 'Book it'} />
    </Scene>
  )
}

export function Paths({ campaign, scene, val }: { campaign: HostedCampaign; scene: string; val: ValFn }) {
  const f = campaign.fields
  const name = f.name || 'her'
  const toStart: Choice = { to: 'start', text: 'Back to the entrance' }

  const service = campaign.services.find((s) => s.key === scene)
  if (service) {
    const others: Choice[] = [
      ...campaign.services.filter((s) => s !== service).map((s) => ({ to: s.key, text: s.choice })),
      { to: 'net', text: `I'd like to hold the net for ${name} too` },
      toStart,
    ]
    return <ServiceScene s={service} f={f} val={val} others={others} />
  }

  switch (scene) {
    case 'wire':
      return (
        <Scene
          kicker="The high wire"
          title="Sometimes life can feel a little out of balance"
          choices={[...campaign.services.map((s) => ({ to: s.key, text: s.choice })), toStart]}
        >
          <p>{val('hook')}</p>
          <p>
            {f.practice || name} is here to help you step off that tightrope and onto solid ground: not just managing the ebb and flow of
            life&apos;s obstacles, but learning to master them. Which act are you ready for?
          </p>
        </Scene>
      )
    case 'net':
      return (
        <Scene
          kicker="Holding the net"
          title={<>Every high-wire act needs a net under it</>}
          choices={[
            { to: 'share', text: 'I can tell people about this' },
            { to: 'founder', text: `First, tell me more about ${name}` },
            toStart,
          ]}
        >
          <p>A new practice stays on the wire when people put resources behind it. Here are three ways.</p>
          <div className="grid gap-3">
            <Way title="Give to the GoFundMe" href={f.gofundmeUrl} label="Donate" body={<>A one-time gift for {val('gofundmeFor')}.</>} />
            <Way title="Join the Patreon" href={f.patreonUrl} label="Join" body="A small monthly pledge is income she can plan around. Following for free counts too." />
            <Way title="Book a session" href={f.bookingUrl} label="Book" body={<>{val('bookWhat')}. Rate: {val('rate')}.</>} />
          </div>
          <p style={{ color: 'var(--bars-text-secondary)' }}>
            Not money? The crew does four kinds of work, and every one counts. <a href="#join" className="underline">Join the crew below.</a>
          </p>
        </Scene>
      )
    case 'share':
      return (
        <Scene
          kicker="Passing the word"
          title="You know someone juggling too much"
          choices={[
            { to: 'wire', text: 'Actually, that someone is me' },
            { to: 'net', text: 'I can put resources behind her too' },
            toStart,
          ]}
        >
          <p>
            Most people find a coach because someone who cares about them said a name out loud. You can be that person.
          </p>
          <p>{val('askAwareness')}</p>
          <p style={{ color: 'var(--bars-text-secondary)' }}>
            {name}&apos;s episode of Mastering Allyship releases {val('episode')}. Send it, or send this page, with a sentence of your own.
          </p>
        </Scene>
      )
    case 'founder':
      return (
        <Scene
          kicker="The ringmaster"
          title={<>Who runs this circus?</>}
          choices={[
            { to: 'wire', text: 'I could use her help' },
            { to: 'net', text: 'I want to back her practice' },
            toStart,
          ]}
        >
          {f.story ? paragraphs(f.story) : <p>{val('story')}</p>}
        </Scene>
      )
    default:
      return (
        <Scene
          kicker="Step right up"
          title="Life is a three-ring circus. Which act brought you here?"
          choices={[
            { to: 'wire', text: "I'm the one on the high wire, and I'd like some help" },
            { to: 'net', text: `I want to hold the net for ${name}` },
            { to: 'share', text: 'I know someone juggling too much' },
            { to: 'founder', text: 'Who runs this circus?' },
          ]}
        >
          <p style={{ color: 'var(--bars-text-secondary)' }}>
            Pick the door that fits. Every path ends in more choices, and you can always come back to the entrance.
          </p>
        </Scene>
      )
  }
}

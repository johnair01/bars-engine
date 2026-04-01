import Link from 'next/link'

interface EventHeroProps {
  title: string
  isLoggedIn: boolean
  campaignRef?: string | null
}

export function EventHero({ title, isLoggedIn, campaignRef }: EventHeroProps) {
  return (
    <section className="event-hero">
      <div className="event-hero-content">
        <h1 className="event-hero-title">{title}</h1>
        <p className="event-hero-subtitle">Birthday Quest Weekend</p>
        <p className="event-hero-tagline">
          Enter curious. Follow signals. Play the game.
        </p>
        <p className="event-hero-meta">April 4 – 5, 2026 · Portland</p>

        {isLoggedIn ? (
          <Link
            href="#weekend"
            className="event-hero-cta"
          >
            See the Weekend
          </Link>
        ) : (
          <Link
            href={`/campaign?ref=${campaignRef ?? 'bruised-banana'}`}
            className="event-hero-cta"
          >
            Enter
          </Link>
        )}
      </div>
      <div className="event-hero-scroll" aria-hidden="true">
        Scroll
      </div>
    </section>
  )
}

import Link from 'next/link'

interface EventHeroProps {
  campaignName: string
  theme: string | null
  targetDescription: string | null
  /** Next event date summary, e.g. "Fri Apr 4 + Sat Apr 5" */
  dateSummary: string | null
  /** Fundraiser progress (0-1), null if no fundraiser */
  progressPct: number | null
  currentFormatted: string | null
  goalFormatted: string | null
  donatePath: string
  rsvpUrl: string | null
  /** Partiful invite URL or external link */
  partifulUrl: string | null
  rsvpCount: number
}

export function EventHero({
  campaignName,
  theme,
  targetDescription,
  dateSummary,
  progressPct,
  currentFormatted,
  goalFormatted,
  donatePath,
  rsvpUrl,
  partifulUrl,
  rsvpCount,
}: EventHeroProps) {
  const externalRsvp = partifulUrl || rsvpUrl

  return (
    <header className="text-center space-y-5 pt-6 pb-2">
      <Link href="/" className="text-xs cs-text-muted hover:cs-text-secondary transition inline-block">
        ← Back
      </Link>

      <h1 className="cs-title font-pixel text-2xl sm:text-3xl leading-tight">
        {campaignName}
      </h1>

      {theme && (
        <p className="cs-text-accent-1 text-sm italic max-w-md mx-auto">{theme}</p>
      )}

      {dateSummary && (
        <p className="cs-text-accent-2 text-sm font-mono tracking-wide">{dateSummary}</p>
      )}

      {targetDescription && (
        <p className="cs-text-secondary text-sm max-w-lg mx-auto leading-relaxed">{targetDescription}</p>
      )}

      {/* Fundraiser progress */}
      {progressPct !== null && currentFormatted && goalFormatted && (
        <div className="max-w-sm mx-auto space-y-2">
          <div className="cs-progress-track">
            <div className="cs-progress-fill" style={{ width: `${Math.round(progressPct * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="cs-text-secondary">{currentFormatted}</span>
            <span className="cs-text-muted">{goalFormatted}</span>
          </div>
        </div>
      )}

      {/* Dual CTA */}
      <div className="flex gap-3 justify-center max-w-sm mx-auto">
        <Link href={donatePath} className="cs-cta-secondary flex-1 text-center text-sm">
          Donate
        </Link>
        {externalRsvp ? (
          <a
            href={externalRsvp}
            target="_blank"
            rel="noopener noreferrer"
            className="cs-cta-primary flex-1 text-center text-sm"
          >
            RSVP
          </a>
        ) : (
          <Link href="/conclave/guided" className="cs-cta-primary flex-1 text-center text-sm">
            Join the Game
          </Link>
        )}
      </div>

      {/* Social proof */}
      {rsvpCount > 0 && (
        <p className="cs-text-muted text-xs">
          {rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} going
        </p>
      )}
    </header>
  )
}

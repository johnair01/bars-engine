import Link from 'next/link'

interface NightCardProps {
  variant: 'friday' | 'saturday' | 'sunday'
  label: string
  title: string
  description: string
  when: string
  where: string
  status: string
  ctaLabel: string
  ctaHref: string
  secondaryLinks?: { label: string; href: string }[]
}

export function NightCard({
  variant,
  label,
  title,
  description,
  when,
  where,
  status,
  ctaLabel,
  ctaHref,
  secondaryLinks,
}: NightCardProps) {
  return (
    <article className={`night-card night-card--${variant}`}>
      <span className="night-card-label">{label}</span>
      <h3 className="night-card-title">{title}</h3>
      <p className="night-card-desc">{description}</p>

      <div className="mt-4 space-y-2">
        <div className="night-card-detail">
          <span className="night-card-detail-label">When</span>
          <span>{when}</span>
        </div>
        <div className="night-card-detail">
          <span className="night-card-detail-label">Where</span>
          <span>{where}</span>
        </div>
      </div>

      <div className="night-card-status">{status}</div>

      <div className="flex flex-wrap gap-2 items-center">
        <Link href={ctaHref} className="night-card-cta">
          {ctaLabel}
        </Link>
        {secondaryLinks?.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm hover:underline underline-offset-2"
            style={{ color: 'var(--ep-text-muted)' }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  )
}

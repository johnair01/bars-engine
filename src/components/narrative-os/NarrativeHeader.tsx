import Link from 'next/link'

type Props = {
  title: string
  subtitle: string
  narrativeDescription: string
  mechanicalDescription: string
  accentBar: string
  backHref: string
  backLabel: string
}

export function NarrativeHeader({
  title,
  subtitle,
  narrativeDescription,
  mechanicalDescription,
  accentBar,
  backHref,
  backLabel,
}: Props) {
  return (
    <header className="space-y-3">
      <Link href={backHref} className="text-xs text-zinc-600 hover:text-zinc-400 transition inline-block">
        {backLabel}
      </Link>
      <div className={`h-px w-24 bg-gradient-to-r ${accentBar} rounded-full`} aria-hidden />
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{subtitle}</p>
        <p className="text-sm text-zinc-400 mt-3 max-w-2xl leading-relaxed">{narrativeDescription}</p>
        <p className="text-xs text-zinc-600 mt-2 max-w-xl">{mechanicalDescription}</p>
      </div>
    </header>
  )
}

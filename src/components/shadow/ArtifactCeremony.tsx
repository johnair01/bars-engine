'use client'

type ArtifactType = 'quest' | 'daemon' | 'fuel' | 'witness'

const COPY: Record<ArtifactType, { headline: string; acknowledgment: string; cta: string }> = {
  quest: {
    headline: 'Quest forged',
    acknowledgment: 'Your shadow work became a quest.',
    cta: 'See your quest',
  },
  daemon: {
    headline: 'Daemon awakened',
    acknowledgment: 'This shadow is now a daemon in your care.',
    cta: 'Meet your daemon',
  },
  fuel: {
    headline: 'Charge recorded',
    acknowledgment: 'Your insight has fueled the system.',
    cta: 'Back to now',
  },
  witness: {
    headline: 'Witness noted',
    acknowledgment: 'Your charge is preserved.',
    cta: 'Back to now',
  },
}

type Props = {
  artifactType: ArtifactType
  artifactName?: string
  onContinue: () => void
}

export function ArtifactCeremony({ artifactType, artifactName, onContinue }: Props) {
  const { headline, acknowledgment, cta } = COPY[artifactType]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 animate-in fade-in duration-500"
      role="dialog"
      aria-modal="true"
      aria-label="Artifact ceremony"
    >
      <div className="max-w-md text-center space-y-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">{headline}</p>

        {artifactName && (
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {artifactName}
          </h2>
        )}

        <p className="text-zinc-400 text-lg">{acknowledgment}</p>

        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors text-sm"
        >
          {cta} →
        </button>
      </div>
    </div>
  )
}

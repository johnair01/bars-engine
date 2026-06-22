import Link from 'next/link'

/**
 * Screen B — "A seed is on the board" confirmation.
 * Shown after captureBar() completes. Two exit paths:
 *   - Go to garden (vault/list)
 *   - Tune now → open the Tune screen for this BAR
 */

interface KeptPageProps {
    searchParams: Promise<{
        barId?: string
        dest?: 'hand' | 'vault'
        title?: string
    }>
}

export default async function KeptPage({ searchParams }: KeptPageProps) {
    const { barId, dest, title } = await searchParams

    const destinationLabel = dest === 'hand' ? 'your Hand' : 'the Vault'
    const barTitle = title ? decodeURIComponent(title).slice(0, 80) : 'A seed'

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-6 gap-8"
            style={{ background: 'var(--bars-bg-base, #0a0908)' }}
        >
            {/* Glyph / ambient mark */}
            <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                style={{
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.3)',
                }}
            >
                🌱
            </div>

            {/* Message */}
            <div className="text-center flex flex-col gap-2 max-w-xs">
                <p
                    className="text-lg font-semibold leading-snug"
                    style={{ color: 'var(--bars-text-primary, #e8e6e0)' }}
                >
                    A seed is on the board
                </p>
                <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--bars-text-secondary, #a09e98)' }}
                >
                    <span style={{ color: '#c4b5fd' }}>&ldquo;{barTitle}&rdquo;</span>
                    {' '}landed in {destinationLabel}.
                    Tune it now to name its context, charge, and move — or come back later.
                </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                {barId && (
                    <Link
                        href={`/bars/${barId}/tune`}
                        className="block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all"
                        style={{
                            background: 'rgba(124,58,237,0.6)',
                            border: '1px solid rgba(167,139,250,0.6)',
                            color: '#e8e6e0',
                        }}
                    >
                        Tune now →
                    </Link>
                )}
                <Link
                    href={dest === 'hand' ? '/hand' : '/bars/garden'}
                    className="block w-full py-3 rounded-xl text-sm text-center transition-all"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#a09e98',
                    }}
                >
                    {dest === 'hand' ? 'Go to your Hand' : 'Go to Garden'}
                </Link>
            </div>
        </div>
    )
}

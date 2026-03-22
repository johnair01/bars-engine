import Link from 'next/link'

/**
 * Compact wayfinding — avoids duplicating the full nav pill row (Vault Phase A).
 */
export function VaultQuickLinks() {
    return (
        <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
            <span className="text-zinc-600">Elsewhere:</span>{' '}
            <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-300">
                Dashboard
            </Link>
            {' · '}
            <Link href="/bars" className="text-purple-400/90 hover:text-purple-300">
                BARs
            </Link>
            {' · '}
            <Link href="/daemons" className="text-indigo-400/90 hover:text-indigo-300">
                Daemons
            </Link>
            {' · '}
            <Link href="/wallet" className="text-zinc-400 hover:text-zinc-300">
                Wallet
            </Link>
            {' · '}
            <Link href="/bars/available" className="text-zinc-400 hover:text-zinc-300">
                Browse BARs
            </Link>
        </p>
    )
}

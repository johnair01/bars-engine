import Link from 'next/link'

type VaultRoomHeaderProps = {
    title: string
    description?: string
}

/**
 * Breadcrumb + title for nested Vault room routes (VPE-E1).
 *
 * Carries a link to the BARs guide. Player signal (2026-03-30, /bars): "We also
 * need documentation for how a player is supposed to interact with this page."
 * The guide already existed at /wiki/bars-guide — nothing outside /wiki linked
 * to it, so it was unreachable from the rooms it documents.
 */
export function VaultRoomHeader({ title, description }: VaultRoomHeaderProps) {
    return (
        <header className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href="/vault" className="text-zinc-500 hover:text-white text-sm inline-block">
                    ← Vault
                </Link>
                <Link
                    href="/wiki/bars-guide"
                    className="text-xs text-zinc-600 hover:text-zinc-300 underline underline-offset-2"
                >
                    How BARs work →
                </Link>
            </div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {description ? <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">{description}</p> : null}
        </header>
    )
}

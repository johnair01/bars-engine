import Link from 'next/link'

type VaultRoomHeaderProps = {
    title: string
    description?: string
}

/**
 * Breadcrumb + title for nested Vault room routes (VPE-E1).
 */
export function VaultRoomHeader({ title, description }: VaultRoomHeaderProps) {
    return (
        <header className="space-y-2">
            <Link href="/hand" className="text-zinc-500 hover:text-white text-sm inline-block">
                ← Vault
            </Link>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {description ? <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">{description}</p> : null}
        </header>
    )
}

'use client'

import { useState, type ReactNode } from 'react'
import { VAULT_LIST_PAGE_SIZE } from '@/lib/vault-ui'

type VaultLoadMoreProps = {
    total: number
    children: (visibleCount: number) => ReactNode
    pageSize?: number
}

/**
 * Slices dense lists: show first N, then "Load more" (UI Style Guide — avoid infinite scroll).
 */
export function VaultLoadMore({ total, children, pageSize = VAULT_LIST_PAGE_SIZE }: VaultLoadMoreProps) {
    const [visible, setVisible] = useState(Math.min(pageSize, total))

    const showMore = () => {
        setVisible((v) => Math.min(v + pageSize, total))
    }

    return (
        <div className="space-y-3">
            {children(visible)}
            {visible < total ? (
                <div className="flex justify-center pt-1">
                    <button
                        type="button"
                        onClick={showMore}
                        className="text-sm px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                    >
                        Load more ({total - visible} remaining)
                    </button>
                </div>
            ) : null}
        </div>
    )
}

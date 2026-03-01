'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PromoteDocButton({ nodeId }: { nodeId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handlePromote() {
        if (!confirm('Promote to canonical?')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/docs/nodes/${nodeId}/promote`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) {
                alert(data.error || 'Failed')
                return
            }
            router.refresh()
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handlePromote}
            disabled={loading}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
            {loading ? '...' : 'Promote'}
        </button>
    )
}

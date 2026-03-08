'use client'

import { useEffect, useState } from 'react'
import { CreateBarForm, type CreateBarPrefill } from './CreateBarForm'

const STORAGE_KEY = 'shadow321_metadata'

export function CreateBarPageClient({ setup, from321 }: { setup?: boolean; from321?: boolean }) {
    const [prefill, setPrefill] = useState<CreateBarPrefill | undefined>(undefined)

    useEffect(() => {
        if (from321 && typeof window !== 'undefined') {
            try {
                const raw = sessionStorage.getItem(STORAGE_KEY)
                if (raw) {
                    const parsed = JSON.parse(raw) as CreateBarPrefill
                    if (parsed && typeof parsed === 'object') {
                        setPrefill(parsed)
                        sessionStorage.removeItem(STORAGE_KEY)
                    }
                }
            } catch {
                /* ignore */
            }
        }
    }, [from321])

    return <CreateBarForm setup={setup} prefill={prefill} />
}

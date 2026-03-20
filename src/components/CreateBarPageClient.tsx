'use client'

import { useEffect, useState } from 'react'
import { CreateBarForm, type CreateBarPrefill, type CreateBar321Session } from './CreateBarForm'

const STORAGE_KEY = 'shadow321_metadata'
const STORAGE_SESSION_KEY = 'shadow321_session'

export function CreateBarPageClient({ setup, from321 }: { setup?: boolean; from321?: boolean }) {
    const [prefill, setPrefill] = useState<CreateBarPrefill | undefined>(undefined)
    const [session321, setSession321] = useState<CreateBar321Session | undefined>(undefined)

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
                const sessionRaw = sessionStorage.getItem(STORAGE_SESSION_KEY)
                if (sessionRaw) {
                    const session = JSON.parse(sessionRaw) as CreateBar321Session
                    if (session && typeof session === 'object') {
                        setSession321(session)
                        sessionStorage.removeItem(STORAGE_SESSION_KEY)
                    }
                }
            } catch {
                /* ignore */
            }
        }
    }, [from321])

    return <CreateBarForm setup={setup} prefill={prefill} session321={session321} />
}

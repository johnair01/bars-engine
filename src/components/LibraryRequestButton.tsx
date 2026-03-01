'use client'

import { useState } from 'react'
import { LibraryRequestModal } from './LibraryRequestModal'

export function LibraryRequestButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-purple-500/50 hover:bg-zinc-800 transition text-sm font-medium text-zinc-300"
            >
                Request from Library
            </button>
            <LibraryRequestModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    )
}

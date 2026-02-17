'use client'

import { useTransition } from 'react'
import { deleteBinding } from '@/actions/twine'
import { useRouter } from 'next/navigation'

export function DeleteBindingButton({ bindingId }: { bindingId: string }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <button
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    await deleteBinding(bindingId)
                    router.refresh()
                })
            }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded transition disabled:opacity-50"
        >
            {isPending ? '...' : 'Delete'}
        </button>
    )
}

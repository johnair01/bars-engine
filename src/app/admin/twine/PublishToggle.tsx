'use client'

import { useTransition } from 'react'
import { togglePublishStory } from '@/actions/twine'
import { useRouter } from 'next/navigation'

export function PublishToggle({ storyId, isPublished }: { storyId: string; isPublished: boolean }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <button
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    await togglePublishStory(storyId)
                    router.refresh()
                })
            }}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold transition disabled:opacity-50 ${
                isPublished
                    ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                    : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
            }`}
        >
            {isPending ? '...' : isPublished ? 'Unpublish' : 'Publish'}
        </button>
    )
}

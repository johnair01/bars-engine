'use client'

import { useTransition } from 'react'
import { toggleTemplateStory } from '@/actions/twine'
import { useRouter } from 'next/navigation'

export function TemplateToggle({ storyId, isTemplate }: { storyId: string; isTemplate: boolean }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <button
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    await toggleTemplateStory(storyId)
                    router.refresh()
                })
            }}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold transition disabled:opacity-50 ${
                isTemplate
                    ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-400'
            }`}
            title={isTemplate ? 'Remove template flag' : 'Set as template'}
        >
            {isPending ? '...' : isTemplate ? 'Template' : 'Set template'}
        </button>
    )
}

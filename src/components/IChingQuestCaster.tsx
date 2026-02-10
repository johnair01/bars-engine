'use client'

import { CastingRitual } from './CastingRitual'
import { generateQuestFromReading } from '@/actions/generate-quest'

export function IChingQuestCaster() {
    return (
        <CastingRitual
            mode="page"
            onComplete={async (hexagramId) => {
                const result = await generateQuestFromReading(hexagramId)
                if (!result.success) {
                    throw new Error(result.error)
                }
            }}
        />
    )
}

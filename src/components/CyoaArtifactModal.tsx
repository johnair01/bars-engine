'use client'

import { CyoaRunState } from '@/lib/cyoa-state'
import { promptsForBlueprintKey } from '@/lib/cyoa/blueprint-prompt-library'

interface CyoaArtifactModalProps {
    runState?: Partial<CyoaRunState>
}

export function CyoaArtifactModal({ runState }: CyoaArtifactModalProps) {
    if (!runState?.artifactLedger || runState.artifactLedger.length === 0) {
        return null
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm z-50 animate-in slide-in-from-bottom-2">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div>
                    <h4 className="text-zinc-300 font-medium text-sm">Artifacts Unlocked</h4>
                    <p className="text-zinc-500 text-xs">
                        {runState.artifactLedger.length} item{runState.artifactLedger.length === 1 ? '' : 's'} recorded in your ledger.
                    </p>
                </div>
                <div className="flex gap-2">
                    {runState.artifactLedger.map((artifact, i) => {
                        const prompts = promptsForBlueprintKey(artifact.blueprintKey)
                        const label = prompts[0] || (artifact.kind === 'bar' ? 'BAR' : 'Quest')
                        return (
                            <div key={i} className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded text-purple-300 text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={label}>
                                {label}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

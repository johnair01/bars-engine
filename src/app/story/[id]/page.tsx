import { getCurrentPlayer } from '@/lib/auth'
import { getPassage } from '@/lib/story'
import { redirect } from 'next/navigation'
import { StoryChoices } from '../StoryChoices'

/**
 * @page /story/:id
 * @entity SYSTEM
 * @description Legacy story passage player - displays passage text with choices (replaced by Twine adventures)
 * @permissions authenticated
 * @params id:string (path, required) - Passage identifier
 * @relationships loads story passage, displays choices, triggers actions
 * @energyCost 0 (legacy story navigation)
 * @dimensions WHO:playerId, WHAT:SYSTEM, WHERE:story, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /story/invitation
 * @agentDiscoverable false
 * @experimental true
 */
export default async function DynamicStoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const player = await getCurrentPlayer()
    if (!player) return redirect('/conclave')

    const passage = await getPassage(id)
    if (!passage) return <div>End of Line.</div>

    return (
        <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            <div className="max-w-md w-full space-y-12">
                <div className="text-xl md:text-2xl font-light leading-relaxed whitespace-pre-wrap text-zinc-300">
                    {passage.text}
                </div>

                <div className="pt-8">
                    <StoryChoices
                        passageId={id}
                        choices={passage.choices}
                        action={passage.action}
                    />
                </div>
            </div>
        </div>
    )
}

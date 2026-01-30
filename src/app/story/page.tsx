import { getCurrentPlayer } from '@/lib/auth'
import { getPassage } from '@/lib/story'
import { redirect } from 'next/navigation'
import { StoryChoices } from './StoryChoices'

export default async function StoryPage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/invite/ANTIGRAVITY')

    // MVP: Check if player has wallet items to determine state?
    // Actually, we just start at 'invitation' if no state.
    // If they have state, we redirect to wallet or show 'holding'.
    // For this prototype, we always start at 'invitation' unless they are deep.
    // Using URL/Search params for state is easiest for a stateless prototype, 
    // but we have a DB. Let's rely on DB state for 'Bar' and 'Quest'.

    // If player has Bar, they might be past 'first_reading'.
    // If player has Quest, they might be past 'the_call'.
    // But to allow re-playability for testing, maybe we just default to 'invitation'
    // or respect the 'passageId' search param?
    // Let's use search param ?p=invitation default.

    // Actually, the previous implementation used `params.id` for dynamic passages.
    // The root `/story` page was the entry.
    // I'll keep `/story` as the entry that redirects to `/story/invitation` or renders 'invitation'.

    return <StoryRenderer passageId="invitation" />
}

async function StoryRenderer({ passageId }: { passageId: string }) {
    const passage = await getPassage(passageId)
    if (!passage) return <div>End of Line.</div>

    return (
        <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            <div className="max-w-md w-full space-y-12">
                <div className="text-xl md:text-2xl font-light leading-relaxed whitespace-pre-wrap text-zinc-300">
                    {passage.text}
                </div>

                <div className="pt-8">
                    <StoryChoices passageId={passage.id} choices={passage.choices} />
                </div>
            </div>
        </div>
    )
}

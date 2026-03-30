import { getCyoaDraft } from '@/actions/cyoa-generator'
import { CmaGeneratorUI } from '@/components/cyoa/generator/CmaGeneratorUI'
import { redirect } from 'next/navigation'

export default async function CyoaGeneratePage(props: { searchParams: Promise<{ draftId?: string }> }) {
    const { draftId } = await props.searchParams

    if (!draftId) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-2xl font-bold text-zinc-100 mb-4">No Draft Selected</h1>
                <p className="text-zinc-500 max-w-md mb-8">
                    To generate an adventure, please start from a BAR in your wallet
                    or complete a 321 Inner Work session.
                </p>
                <a href="/wallet" className="text-emerald-500 hover:text-emerald-400 font-mono text-sm underlineDecoration">
                    Return to Wallet →
                </a>
            </div>
        )
    }

    const draft = await getCyoaDraft(draftId)
    if (!draft) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Draft Not Found</h1>
                <p className="text-zinc-500 mb-8">The draft you are looking for has been lost in the signal.</p>
                <a href="/" className="text-zinc-400 hover:text-zinc-100 font-mono text-sm underlineDecoration">
                    Return Home
                </a>
            </div>
        )
    }

    return (
        <div className="bg-black">
            <CmaGeneratorUI
                initialDraft={{
                    id: draft.id,
                    graphJson: draft.graphJson,
                    emotionalCharge: draft.emotionalCharge,
                    gmId: draft.gmId,
                    status: draft.status,
                    campaignId: draft.campaignId,
                    mission: (draft as any).mission || 'Direct Action'
                }}
            />
        </div>
    )
}

import { getLibraryProvenance } from '@/actions/library-provenance'
import { LibraryView } from '@/components/library/LibraryView'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'The Library | BARS Engine',
    description: 'Review the historical provenance of your metabolized artifacts.',
}

export default async function LibraryPage() {
    const provenance = await getLibraryProvenance()

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10 md:p-16 max-w-5xl mx-auto space-y-12">
            <LibraryView provenance={provenance} />
        </div>
    )
}

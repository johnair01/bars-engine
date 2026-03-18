import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateBarFormPage } from './CreateBarFormPage'
import Link from 'next/link'

export default async function CreateBarPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/bars" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm">
                        ←
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Pin it</h1>
                        <p className="text-zinc-500 text-sm">A scrap. A note. Add a photo on the next screen if you have one.</p>
                    </div>
                </div>

                <CreateBarFormPage />
            </div>
        </div>
    )
}

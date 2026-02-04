import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/AdminNav'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const player = await getCurrentPlayer()

    if (!player) {
        redirect('/conclave')
    }

    // Strict Admin Check
    const adminRole = await db.playerRole.findFirst({
        where: {
            playerId: player.id,
            role: { key: 'admin' }
        }
    })

    if (!adminRole) {
        // Not authorized
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 pl-64">
            <AdminNav />
            <main className="p-8 max-w-6xl mx-auto">
                {children}
            </main>
        </div>
    )
}

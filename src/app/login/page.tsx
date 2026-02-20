import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (playerId) {
        const player = await db.player.findUnique({
            where: { id: playerId },
            select: { id: true, nationId: true, playbookId: true }
        })
        if (player) {
            if (!player.nationId || !player.playbookId) {
                redirect('/conclave/onboarding')
            }
            redirect('/')
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
            <LoginForm />
        </div>
    )
}

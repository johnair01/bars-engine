import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NationPage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/')
    if (!player.nation) return redirect('/')

    return redirect(`/nation/${player.nation.id}`)
}

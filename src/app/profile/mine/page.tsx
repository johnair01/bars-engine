import { getOrCreateProfileMap } from '@/actions/profile-spatial'
import { redirect } from 'next/navigation'

export default async function ProfileMinePage() {
    const profileMap = await getOrCreateProfileMap()
    
    // Redirect to the player's dynamic profile map ID
    redirect(`/profile/${profileMap.playerId}`)
}

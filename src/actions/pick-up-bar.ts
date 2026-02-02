'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { STARTER_BARS } from '@/lib/bars'

export async function pickUpBar(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const barId = formData.get('barId') as string

    let barDef = STARTER_BARS.find(b => b.id === barId)

    // Look up in CustomBar if not found
    if (!barDef) {
        const customBar = await db.customBar.findUnique({
            where: { id: barId }
        })
        if (customBar && customBar.status === 'active') {
            // Adapt to BarDef interface (partial)
            barDef = {
                id: customBar.id,
                title: customBar.title,
                description: customBar.description,
                type: customBar.type as 'vibe' | 'story',
                reward: customBar.reward,
                inputs: JSON.parse(customBar.inputs || '[]'),
                unique: false
            }
        }
    }

    if (!barDef) {
        return { error: 'Unknown bar' }
    }

    try {
        const starterPack = await db.starterPack.findUnique({
            where: { playerId }
        })

        if (!starterPack) {
            return { error: 'Starter pack not found' }
        }

        const data = JSON.parse(starterPack.data) as {
            completedBars: { id: string; inputs: Record<string, any> }[],
            activeBars: string[]
        }

        // Initialize activeBars if not present
        if (!data.activeBars) {
            data.activeBars = []
        }

        // Check if already active or completed
        if (data.activeBars.includes(barId)) {
            return { error: 'Bar already active' }
        }
        if (data.completedBars.some(cb => cb.id === barId)) {
            return { error: 'Bar already completed' }
        }

        // Add to active
        data.activeBars.push(barId)

        await db.starterPack.update({
            where: { playerId },
            data: { data: JSON.stringify(data) }
        })

        revalidatePath('/')
        return { success: true, barId }

    } catch (e: any) {
        console.error("Pick up bar failed:", e?.message)
        return { error: 'Failed to pick up bar' }
    }
}

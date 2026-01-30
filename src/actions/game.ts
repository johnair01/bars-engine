'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function assignBarToPlayer(existingPlayerId?: string) {
    const player = existingPlayerId
        ? await db.player.findUnique({ where: { id: existingPlayerId }, include: { bars: true } })
        : await getCurrentPlayer()

    if (!player) return redirect('/invite/ANTIGRAVITY')

    if (player.bars.length > 0) return redirect('/wallet')

    // LOGIC: Select Bar (1..64)
    // MVP: Random
    const barId = Math.floor(Math.random() * 64) + 1

    await db.playerBar.create({
        data: {
            playerId: player.id,
            barId,
            source: 'engine',
            notes: 'Assigned via Intro Story',
        }
    })

    // Assign Initial Quest
    // Fetch a random or specific quest
    const quest = await db.quest.findFirst()
    if (quest) {
        await db.playerQuest.create({
            data: {
                playerId: player.id,
                questId: quest.id,
                status: 'active',
            }
        })
    }

    // Grant Initial Vibulon Event (The Return)
    // Actually, user spec says "Quest completion... grants +1 vibulon".
    // But maybe initial assignment grants one? No, usually start with 0.

    redirect('/wallet')
}

'use server'

import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

export async function checkEmail(email: string) {
    const account = await db.account.findUnique({
        where: { email }
    })
    return { exists: !!account }
}

export async function checkContactAvailability(contact: string) {
    // Check both Account and Player to ensure no conflicts
    const [existingAccount, existingPlayer] = await Promise.all([
        db.account.findUnique({ where: { email: contact } }),
        db.player.findUnique({
            where: {
                contactType_contactValue: {
                    contactType: 'email',
                    contactValue: contact
                }
            }
        })
    ])

    if (existingAccount || existingPlayer) {
        return { available: false, reason: existingAccount ? 'account_exists' : 'player_exists' }
    }

    return { available: true }
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) return { error: 'Email and password required' }

    const account = await db.account.findUnique({
        where: { email },
        include: { players: true }
    })

    if (!account) return { error: 'Invalid credentials' }

    if (!account.passwordHash) {
        return { error: 'Account setup incomplete. Please contact admin.' }
    }

    const isValid = await verifyPassword(password, account.passwordHash)
    if (!isValid) return { error: 'Invalid credentials' }

    // Logic: Login implies selecting a character. For MVP, pick the first one.
    // If no character, we should handle that (maybe redirect to create?)
    const player = account.players[0]

    if (!player) {
        // This is a valid account without a character. 
        // TODO: Handle this case in UI (e.g. redirect to /conclave/create)
        return { error: 'No character found for this account. (Support pending)' }
    }

    const cookieStore = await cookies()
    cookieStore.set('bars_player_id', player.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30
    })

    return { success: true }
}

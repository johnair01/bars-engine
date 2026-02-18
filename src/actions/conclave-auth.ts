'use server'

import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth-utils'
import { cookies } from 'next/headers'
import { isAuthBypassEmailVerificationEnabled } from '@/lib/mvp-flags'
import { createRequestId, logActionError } from '@/lib/mvp-observability'

export type LoginState = {
    error?: string
    success?: boolean
    redirectTo?: string
}

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
    const requestId = createRequestId()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) return { error: 'Email and password required' } satisfies LoginState

    try {
        const account = await db.account.findUnique({
            where: { email },
            include: { players: true }
        })

        if (!account) return { error: 'Invalid credentials' } satisfies LoginState

        if (!account.passwordHash) {
            return { error: 'Account setup incomplete. Please contact admin.' } satisfies LoginState
        }

        if (isAuthBypassEmailVerificationEnabled()) {
            console.info(`[MVP][login] req=${requestId} AUTH_BYPASS_EMAIL_VERIFICATION enabled (dev-only)`)
        }

        const isValid = await verifyPassword(password, account.passwordHash)
        if (!isValid) return { error: 'Invalid credentials' } satisfies LoginState

        // Logic: Login implies selecting a character. For MVP, pick the first one.
        const player = account.players[0]

        if (!player) {
            return { error: 'No character found for this account. (Support pending)' } satisfies LoginState
        }

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

        // If the player hasn't selected Nation / Archetype yet, drive them into the guided narrative
        // node where those choices are made.
        const redirectTo = !player.nationId
            ? '/conclave/guided?step=nation_select'
            : (!player.playbookId ? '/conclave/guided?step=playbook_select' : '/')

        return { success: true, redirectTo } satisfies LoginState
    } catch (error) {
        logActionError(
            { action: 'login', requestId, userId: null, extra: { email } },
            error
        )
        return { error: `Login failed. Please retry. (req: ${requestId})` } satisfies LoginState
    }
}

export async function loginWithState(_prevState: LoginState | null, formData: FormData): Promise<LoginState> {
    return login(formData)
}

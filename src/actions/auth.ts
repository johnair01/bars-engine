'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('bars_player_id')
    redirect('/login')
}

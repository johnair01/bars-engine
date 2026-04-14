/**
 * @page /conclave
 * @entity SYSTEM
 * @description Conclave entry point - redirects to guided onboarding flow
 * @permissions public
 * @relationships PLAYER (onboarding)
 * @dimensions WHO:new_player, WHAT:onboarding_redirect, WHERE:conclave
 * @example /conclave
 * @agentDiscoverable false
 */

import { redirect } from 'next/navigation'

export default async function ConclaveEntryPage() {
    redirect('/login')
}

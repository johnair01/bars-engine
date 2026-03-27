/**
 * @page /conclave/wizard
 * @entity SYSTEM
 * @description Legacy wizard entry point - redirects to /conclave/guided
 * @permissions public
 * @relationships SYSTEM (onboarding redirect)
 * @dimensions WHO:new_player, WHAT:wizard_redirect, WHERE:conclave
 * @example /conclave/wizard
 * @agentDiscoverable false
 */

import { redirect } from 'next/navigation'

export default async function ConclaveWizardPage() {
    redirect('/conclave/guided')
}

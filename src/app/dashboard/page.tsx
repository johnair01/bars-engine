import { redirect } from 'next/navigation'

/**
 * @page /dashboard
 * @entity PLAYER
 * @description Dashboard redirect to home page (authenticated view)
 * @permissions authenticated
 * @energyCost 0 (redirect only)
 * @dimensions WHO:currentPlayer, WHAT:PLAYER
 * @example /dashboard
 * @agentDiscoverable false
 */
export default function DashboardRedirectPage() {
    redirect('/')
}

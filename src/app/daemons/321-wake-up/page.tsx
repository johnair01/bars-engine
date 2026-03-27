import { redirect } from 'next/navigation'

/**
 * @page /daemons/321-wake-up
 * @entity DAEMON
 * @description Legacy daemon discovery entry point - redirects to /shadow/321 (canonical 321 process with daemon discovery)
 * @permissions authenticated
 * @relationships DAEMON (discovery redirect)
 * @dimensions WHO:player, WHAT:daemon_redirect, WHERE:daemons
 * @example /daemons/321-wake-up
 * @agentDiscoverable false
 *
 * Bookmarks only: canonical 321 + daemon discovery is `Shadow321Runner` at `/shadow/321`.
 */
export default function WakeUp321RedirectPage() {
  redirect('/shadow/321')
}

import { redirect } from 'next/navigation'

/**
 * @page /bars
 * @entity BAR
 * @description Legacy Inspirations list — folded into the canonical Vault "All BARs" room (QLA Phase 1). Redirects to /vault/all so there is one inventory home. Detail pages (/bars/[id]) and sub-routes (/bars/capture, /bars/feed, …) are unaffected.
 * @permissions authenticated
 * @energyCost 0
 * @dimensions WHO:currentPlayer, WHAT:BAR, WHERE:vault
 * @example /bars
 * @agentDiscoverable false
 */
export default function BarsPage() {
    redirect('/vault/all')
}

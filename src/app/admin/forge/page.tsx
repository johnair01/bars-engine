import Link from 'next/link'
import { ForgeWizard } from '@/components/admin/ForgeWizard'

/**
 * @page /admin/forge
 * @entity BAR
 * @description Forge wizard for creating and managing BARs
 * @permissions admin
 * @dimensions WHO:admin, WHAT:BAR, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/forge
 * @agentDiscoverable false
 */
export default function AdminForgePage() {
  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-white transition">
          ← Back to Admin
        </Link>
      </header>

      <ForgeWizard />
    </div>
  )
}

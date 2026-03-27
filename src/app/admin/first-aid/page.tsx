import Link from 'next/link'
import { FirstAidToolsEditor } from '@/components/admin/FirstAidToolsEditor'

/**
 * @page /admin/first-aid
 * @entity SYSTEM
 * @description First aid tools for quick edits and emergency fixes
 * @permissions admin
 * @dimensions WHO:admin, WHAT:SYSTEM, PERSONAL_THROUGHPUT:clean-up
 * @example /admin/first-aid
 * @agentDiscoverable false
 */
export default function AdminFirstAidPage() {
    return (
        <div className="space-y-8">
            <header>
                <Link href="/admin" className="text-sm text-zinc-500 hover:text-white transition">
                    ← Back to Admin
                </Link>
            </header>

            <FirstAidToolsEditor />
        </div>
    )
}

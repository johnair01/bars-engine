import Link from 'next/link'
import { FirstAidToolsEditor } from '@/components/admin/FirstAidToolsEditor'

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

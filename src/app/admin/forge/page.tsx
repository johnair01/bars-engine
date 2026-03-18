import Link from 'next/link'
import { ForgeWizard } from '@/components/admin/ForgeWizard'

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

import { ForkWizard } from './ForkWizard'
import Link from 'next/link'

export default function ForkWizardPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <header className="space-y-1">
          <Link
            href="/wiki/fork-your-instance"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition"
          >
            ← Fork Guide
          </Link>
          <h1 className="text-2xl font-bold text-white">Fork Wizard</h1>
          <p className="text-zinc-500 text-sm">Step-by-step: get your own BARs Engine running.</p>
        </header>
        <ForkWizard />
      </div>
    </div>
  )
}

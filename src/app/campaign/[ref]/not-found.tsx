import Link from 'next/link'

export default function CampaignNotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-xl font-bold">Campaign not found</h1>
      <p className="text-zinc-400 mt-2 text-center max-w-md">
        This campaign may not exist, hasn&apos;t been approved yet, or the URL is incorrect.
      </p>
      <Link href="/" className="mt-6 text-purple-400 hover:text-purple-300">
        ← Home
      </Link>
    </div>
  )
}

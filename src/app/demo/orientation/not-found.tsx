import Link from 'next/link'

export default function DemoOrientationNotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-xl font-bold">Preview link not found</h1>
      <p className="text-zinc-400 mt-2 text-center max-w-md">
        This demo link may have expired, been revoked, or the URL is incorrect.
      </p>
      <Link href="/" className="mt-6 text-purple-400 hover:text-purple-300">
        Home
      </Link>
    </div>
  )
}

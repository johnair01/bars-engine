import type { Metadata } from 'next'
import Link from 'next/link'
import { PavedBricks } from './PavedBricks'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'

export const metadata: Metadata = { title: 'A yellow brick is paved · The Crossing' }

export default async function ThankYouSentPage(props: {
  searchParams: Promise<{ n?: string }>
}) {
  const { n } = await props.searchParams
  const count = Number.parseInt(n ?? '', 10)
  const label = Number.isFinite(count) && count > 0 ? `${count} contributor${count === 1 ? '' : 's'}` : 'your contributors'

  return (
    <main
      className="flex min-h-screen items-center px-5 py-10 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[520px] space-y-6 text-center">
        <PavedBricks />

        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.02em]">
          A yellow brick is paved.
        </h1>

        <p className="text-[15px] leading-relaxed text-[#d6d4cd]">
          You let <span className="font-semibold text-white">{label}</span> know the car is secured.
          Every move became evidence — and the campaign followed up on all of it.
        </p>

        <p className="text-[13px] leading-relaxed text-[#a09e98]">
          The Crossing is complete. The next BAR is already waiting.
        </p>

        <Link
          href="/campaign/the-crossing/steward"
          className="inline-flex rounded-[11px] border px-5 py-3 text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
          style={{ borderColor: 'rgba(124,58,237,.42)' }}
        >
          Back to the board
        </Link>
      </div>
    </main>
  )
}

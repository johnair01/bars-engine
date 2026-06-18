import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { getCapabilities } from '@/lib/entitlements/service'
import { buildCollection, type CollectionEntry } from '@/lib/launch/collection'
import { formatPrice } from '@/lib/launch/offers'
import type { ElementKey } from '@/lib/ui/card-tokens'

export const metadata: Metadata = {
  title: 'Your Collection — Mastering Allyship',
  description: 'Open the products you own — the deck, the book, the handbook — all in one place.',
}

// element → accent border/text, written as full strings so Tailwind keeps them.
const ELEMENT_ACCENT: Record<ElementKey, string> = {
  fire: 'border-orange-800/50 hover:border-orange-500/70',
  water: 'border-blue-800/50 hover:border-blue-500/70',
  wood: 'border-emerald-800/50 hover:border-emerald-500/70',
  metal: 'border-slate-700/50 hover:border-slate-400/70',
  earth: 'border-amber-800/50 hover:border-amber-500/70',
}

/**
 * /collection — the post-login product hub ("Your Collection").
 *
 * Surfaces every launch product with its access state for the signed-in player: owned
 * products lead with an "Open" action that deep-links into the in-app surface (the deck
 * app at /deck, files at /downloads); locked ones offer a buy CTA to /launch. Admins own
 * everything (bypass). Driven by `buildCollection` over the player's capabilities, so the
 * registry in offers.ts stays the single source of truth.
 *
 * @see src/lib/launch/collection.ts
 */
export default async function CollectionPage() {
  const player = await getCurrentPlayer()

  if (!player) {
    return (
      <Shell>
        <p className="text-center text-sm text-[#a09e98]">
          <Link href="/login?callbackUrl=/collection" className="text-purple-400 underline-offset-2 hover:underline">
            Sign in
          </Link>{' '}
          to open the products you own.
        </p>
      </Shell>
    )
  }

  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  const caps = await getCapabilities(player.id)
  const collection = buildCollection(caps, isAdmin)
  const ownedCount = collection.filter((e) => e.owned).length

  return (
    <Shell>
      <p className="text-center text-xs text-[#6b6965]">
        {isAdmin
          ? 'Admin — every product is open to you.'
          : ownedCount > 0
            ? `${ownedCount} ${ownedCount === 1 ? 'product' : 'products'} in your collection.`
            : 'Nothing unlocked yet — pick something up below.'}
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {collection.map((entry) => (
          <ProductCard key={entry.offer.key} entry={entry} />
        ))}
      </ul>

      <footer className="space-y-2 border-t border-zinc-800 pt-6 text-center text-xs text-[#6b6965]">
        <p>
          Looking for a downloadable file?{' '}
          <Link href="/downloads" className="text-purple-400 underline-offset-2 hover:underline">
            Your downloads
          </Link>
          {' · '}
          <Link href="/redeem" className="text-purple-400 underline-offset-2 hover:underline">
            Redeem a code
          </Link>
        </p>
      </footer>
    </Shell>
  )
}

function ProductCard({ entry }: { entry: CollectionEntry }) {
  const { offer, owned, open } = entry
  return (
    <li className={`flex flex-col gap-3 rounded-xl border bg-[#141412] p-4 transition-colors ${ELEMENT_ACCENT[offer.element]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#e8e6e0]">{offer.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#a09e98]">{offer.blurb}</p>
        </div>
        {owned ? (
          <span className="shrink-0 rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Owned
          </span>
        ) : (
          <span className="shrink-0 text-xs font-semibold text-[#6b6965]">
            {offer.pwyw ? `${formatPrice(offer.priceCents)}+` : formatPrice(offer.priceCents)}
            {offer.recurring ? '/mo' : ''}
          </span>
        )}
      </div>

      <div className="mt-auto">
        {owned ? (
          open ? (
            <Link
              href={open.href}
              className="flex min-h-10 items-center justify-center rounded-lg bg-purple-600 px-4 text-sm font-bold text-white transition-colors hover:bg-purple-500"
            >
              {open.label} →
            </Link>
          ) : (
            <p className="text-xs text-[#6b6965]">
              {offer.preorder ? 'Preordered — ships after the print run.' : 'Active on your account.'}
            </p>
          )
        ) : (
          <Link
            href={entry.learnHref}
            className="flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-bold text-[#e8e6e0] transition-colors hover:border-zinc-500"
          >
            {offer.cta} →
          </Link>
        )}
      </div>
    </li>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-14">
      <div className="mx-auto max-w-2xl space-y-7">
        <header className="space-y-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">Your Collection</h1>
          <p className="text-sm text-[#a09e98]">Open the products you own — or pick up the rest.</p>
        </header>
        {children}
      </div>
    </main>
  )
}

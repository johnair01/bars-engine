import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChapterOneSignup, DojoWaitlist } from './ListenForms'
import { formatPrice, offerByKey } from '@/lib/launch/offers'
import { BOOK_AMAZON_KINDLE_URL, BOOK_AMAZON_PAPERBACK_URL, BOOK_DIGITAL_GUMROAD_URL } from '@/lib/launch/book-offer'
import { AWAKEN_DECK_SALES_HREF } from '@/lib/awaken/content'

export const metadata: Metadata = {
  title: 'Keep practicing — Mastering the Game of Allyship',
  description:
    'Heard the episode? Read the first chapter free, get the book, practise with the deck, or join the list for the next Dojo cohort.',
}

/**
 * @page /listen
 * @entity CAMPAIGN
 * @description The one place podcast listeners are sent (council position lr-one-place).
 *   Gives before it asks: free Chapter 1 first, then the book (Amazon and the direct
 *   digital copy side by side, row lr-book-door), the deck, and a waitlist for the next
 *   Dojo cohort (row lr-dojo-door). Show notes link here as /listen?ep=N; the tag is for
 *   the site's visit analytics, so nothing here reads it.
 * @permissions public
 * @relationships /mastering-allyship/chapter-1, /deck/sales, /mastering-allyship/dojo
 * @dimensions WHO:listener, WHAT:next step, WHERE:listen, ENERGY:invitation
 * @example /listen?ep=5
 * @agentDiscoverable true
 */
const DOOR = 'rounded-2xl border border-zinc-800 bg-black/30 p-5 sm:p-6'
const LINK =
  'inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold transition-colors'

export default function ListenPage() {
  const book = offerByKey('book-digital')
  const deck = offerByKey('deck-digital')
  const bookPrice = book ? formatPrice(book.priceCents) : '$30'
  const deckPrice = deck ? formatPrice(deck.priceCents) : '$22'

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-10 text-[#e8e6e0] sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Keep the conversation going.</h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            If the episode stirred something, here is where to take it. Start free. Everything else
            is there when you want it.
          </p>
        </header>

        <section aria-labelledby="chapter-1" className={`${DOOR} flex gap-5`}>
          <Image
            src="/mastering-allyship/cover-front.png"
            alt="Mastering the Game of Allyship book cover"
            width={430}
            height={688}
            className="hidden h-auto w-24 shrink-0 self-start rounded-[2px_6px_6px_2px] sm:block"
          />
          <div className="min-w-0 flex-1 space-y-4">
            <h2 id="chapter-1" className="text-xl font-bold">
              Read Chapter 1, free
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              The opening chapter treats allyship as a game you can learn to play, instead of a verdict
              on whether you are a good person. Leave an address and it arrives at once.
            </p>
            <ChapterOneSignup />
          </div>
        </section>

        <section aria-labelledby="book" className={`${DOOR} space-y-4`}>
          <h2 id="book" className="text-xl font-bold">
            Get the book
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Six roles, their shadows, and a way to stop playing the version you cannot win. Pick the
            edition you want to hold.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BOOK_AMAZON_PAPERBACK_URL && (
              <li className="space-y-3 rounded-xl border border-zinc-800 p-4">
                <p className="font-bold">Paperback</p>
                <p className="text-sm text-zinc-400">On Amazon.</p>
                <a href={BOOK_AMAZON_PAPERBACK_URL} className={`${LINK} w-full border-amber-500/60 text-amber-100 hover:bg-amber-950/30`}>
                  Buy the paperback
                </a>
              </li>
            )}
            {BOOK_AMAZON_KINDLE_URL && (
              <li className="space-y-3 rounded-xl border border-zinc-800 p-4">
                <p className="font-bold">Kindle</p>
                <p className="text-sm text-zinc-400">On Amazon.</p>
                <a href={BOOK_AMAZON_KINDLE_URL} className={`${LINK} w-full border-amber-500/60 text-amber-100 hover:bg-amber-950/30`}>
                  Buy for Kindle
                </a>
              </li>
            )}
            <li className="space-y-3 rounded-xl border border-emerald-700/50 p-4">
              <p className="font-bold">Digital, direct · {bookPrice}</p>
              <p className="text-sm text-zinc-400">
                Straight from me, with 30 days in the app so you can play what you read.
              </p>
              <a href={BOOK_DIGITAL_GUMROAD_URL} className={`${LINK} w-full border-emerald-600/70 text-emerald-100 hover:bg-emerald-950/30`}>
                Get the digital book
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="deck" className={`${DOOR} space-y-4`}>
          <h2 id="deck" className="text-xl font-bold">
            Practise with the deck
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            120 moves. Draw one, try it in a real conversation this week, then draw another.
          </p>
          <Link href={AWAKEN_DECK_SALES_HREF} className={`${LINK} border-purple-500/60 text-purple-100 hover:bg-purple-950/30`}>
            See the deck · {deckPrice}
          </Link>
        </section>

        <section aria-labelledby="dojo" className={`${DOOR} space-y-4`}>
          <h2 id="dojo" className="text-xl font-bold">
            Practise with people
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            The Allyship Dojo is a weekly group where each session teaches one move. No cohort has a
            date yet. Leave your name and you will hear when one does.
          </p>
          <DojoWaitlist />
        </section>

        <footer className="border-t border-zinc-800 pt-6 text-center text-sm text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            More about the book and the game
          </Link>
        </footer>
      </div>
    </main>
  )
}

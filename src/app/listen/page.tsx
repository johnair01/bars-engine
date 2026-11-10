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
    'Heard the episode? Read the first chapter free, get the book, practice with the deck, or join the list for the next Dojo cohort.',
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
const SECTION = 'space-y-4 border-t border-zinc-800 pt-8'
const LINK =
  'inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400'
const LINK_PLAIN = `${LINK} border-zinc-600 text-[#e8e6e0] hover:border-zinc-400 hover:bg-white/5`
const LINK_DIRECT = `${LINK} border-emerald-500/70 text-emerald-100 hover:bg-emerald-950/40`

export default function ListenPage() {
  const book = offerByKey('book-digital')
  const deck = offerByKey('deck-digital')
  const bookPrice = book ? formatPrice(book.priceCents) : '$30'
  const deckPrice = deck ? formatPrice(deck.priceCents) : '$22'

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] selection:bg-emerald-500/30 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-4">
          <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
            Keep the conversation going.
          </h1>
          <p className="max-w-prose text-pretty text-base leading-relaxed text-[#b4b2ab]">
            If the episode stirred something, here is where to take it. Start free. Everything else
            is there when you want it.
          </p>
        </header>

        <section
          aria-labelledby="chapter-1"
          className="space-y-4 rounded-2xl border border-emerald-700/50 bg-emerald-950/10 p-5 sm:p-7"
        >
          <h2 id="chapter-1" className="text-2xl font-bold">
            Read Chapter 1, free
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-[#b4b2ab]">
            The opening chapter treats allyship as a game you can learn to play, instead of a verdict
            on whether you are a good person. Leave an address and it arrives at once.
          </p>
          <ChapterOneSignup />
        </section>

        <section aria-labelledby="book" className={`${SECTION} sm:flex sm:gap-6 sm:space-y-0`}>
          <Image
            src="/mastering-allyship/cover-front.png"
            alt="Mastering the Game of Allyship book cover"
            width={430}
            height={688}
            sizes="(min-width: 640px) 112px, 96px"
            className="h-auto w-24 shrink-0 self-start rounded-[2px_6px_6px_2px] shadow-lg shadow-black/60 sm:w-28"
          />
          <div className="mt-4 min-w-0 flex-1 space-y-4 sm:mt-0">
            <h2 id="book" className="text-xl font-bold">
              Get the book
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-[#b4b2ab]">
              Six roles, their shadows, and a way to stop playing the version you cannot win. Pick the
              edition you want to hold.
            </p>
            <ul className="grid gap-5">
              {BOOK_AMAZON_PAPERBACK_URL && (
                <li className="space-y-2">
                  <p className="font-bold">Paperback</p>
                  <p className="text-sm text-[#b4b2ab]">On Amazon.</p>
                  <a href={BOOK_AMAZON_PAPERBACK_URL} className={`${LINK_PLAIN} w-full sm:w-auto`}>
                    Buy the paperback
                  </a>
                </li>
              )}
              {BOOK_AMAZON_KINDLE_URL && (
                <li className="space-y-2">
                  <p className="font-bold">Kindle</p>
                  <p className="text-sm text-[#b4b2ab]">On Amazon.</p>
                  <a href={BOOK_AMAZON_KINDLE_URL} className={`${LINK_PLAIN} w-full sm:w-auto`}>
                    Buy for Kindle
                  </a>
                </li>
              )}
              <li className="space-y-2">
                <p className="font-bold">Digital, direct · {bookPrice}</p>
                <p className="text-sm text-[#b4b2ab]">
                  Straight from me, with 30 days in the app so you can play what you read.
                </p>
                <a href={BOOK_DIGITAL_GUMROAD_URL} className={`${LINK_DIRECT} w-full sm:w-auto`}>
                  Get the digital book
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="deck" className={SECTION}>
          <h2 id="deck" className="text-xl font-bold">
            Practice with the deck
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-[#b4b2ab]">
            120 moves. Draw one, try it in a real conversation this week, then draw another.
          </p>
          <Link href={AWAKEN_DECK_SALES_HREF} className={`${LINK_PLAIN} w-full sm:w-auto`}>
            See the deck · {deckPrice}
          </Link>
        </section>

        <section aria-labelledby="dojo" className={SECTION}>
          <h2 id="dojo" className="text-xl font-bold">
            Practice with people
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-[#b4b2ab]">
            The Allyship Dojo is a weekly group where each session teaches one move. No cohort has a
            date yet. Leave your name and you will hear when one does.
          </p>
          <DojoWaitlist />
        </section>

        <footer className="border-t border-zinc-800 pt-6 text-center text-sm">
          <Link
            href="/mastering-allyship"
            className="text-[#b4b2ab] underline-offset-4 hover:text-[#e8e6e0] hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            More about the book and the game
          </Link>
        </footer>
      </div>
    </main>
  )
}

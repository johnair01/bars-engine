import type { Metadata } from 'next'
import { unsubscribeFromList } from '@/actions/list-unsubscribe'
import { isContactId } from '@/lib/esp/resend-list'

export const metadata: Metadata = {
  title: 'Unsubscribe · Mastering Allyship',
  robots: { index: false, follow: false },
}

/**
 * Where the "Unsubscribe" link in list mail lands.
 *
 * `c` is the reader's Resend contact id. Confirming sets that contact's
 * `unsubscribed` flag, which every list send checks (see resend-list.ts).
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; done?: string; error?: string }>
}) {
  const { c, done, error } = await searchParams
  const valid = isContactId(c)

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16 text-[#e8e6e0] sm:px-6">
      <div className="mx-auto max-w-lg space-y-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400">
          Mastering Allyship
        </p>

        {!valid ? (
          <>
            <h1 className="text-2xl font-bold text-white">This link has lost its code.</h1>
            <p className="text-sm leading-relaxed text-zinc-300">
              Reply to any email from me and ask to come off the list. I will do it by hand.
            </p>
          </>
        ) : done ? (
          <>
            <h1 className="text-2xl font-bold text-white">You are off the list.</h1>
            <p className="text-sm leading-relaxed text-zinc-300">
              The quarterly sheet reminder and any other list email from me stop here. If this was
              a mistake, reply to any email from me and I will put you back.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">Come off the list?</h1>
            <p className="text-sm leading-relaxed text-zinc-300">
              This stops the quarterly character sheet reminder and any other list email from me.
              An email you ask for directly, like Chapter One or a quiz result, still arrives.
            </p>
            {error && (
              <p className="rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                That hit an error on my side. Try again, or reply to any email from me and I will
                take you off by hand.
              </p>
            )}
            <form action={unsubscribeFromList}>
              <input type="hidden" name="c" value={c} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-500"
              >
                Unsubscribe
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

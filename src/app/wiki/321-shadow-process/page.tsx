import Link from 'next/link'

/**
 * @page /wiki/321-shadow-process
 * @entity WIKI
 * @description What the 321 (3→2→1) witness pass is — third, second, first person — with links to handbook and in-app session
 * @permissions public
 */
export default function Wiki321ShadowProcessPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>
          {' / '}
          <span className="text-zinc-400">321 shadow process</span>
        </div>
        <h1 className="text-3xl font-bold text-white">The 321 witness pass</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          &quot;321&quot; is a short ritual for moving charge: you write in <strong className="text-zinc-300">third person</strong>{' '}
          (witness), then <strong className="text-zinc-300">second person</strong> (what the feeling wants you to hear), then{' '}
          <strong className="text-zinc-300">first person</strong> (what is true for you now). It is the same pattern as the public
          Bruised Banana donation demo — nothing is saved until you sign in elsewhere.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Where to go next</h2>
        <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-5">
          <li>
            <Link href="/wiki/handbook" className="text-emerald-400 hover:text-emerald-300">
              Player handbook
            </Link>{' '}
            — how 321 fits the Clean Up move
          </li>
          <li>
            <Link href="/shadow/321" className="text-emerald-400 hover:text-emerald-300">
              Start a 321 session
            </Link>{' '}
            — in the app when you are signed in
          </li>
          <li>
            <Link href="/demo/bruised-banana" className="text-emerald-400 hover:text-emerald-300">
              Donation demo
            </Link>{' '}
            — public ritual, session only
          </li>
        </ul>
      </section>
    </div>
  )
}

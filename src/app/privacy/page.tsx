import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy — Mastering the Game of Allyship',
  description:
    'What MTGOA Publisher, the tool that posts the Mastering the Game of Allyship podcast to YouTube, Instagram and Facebook, uses and keeps.',
}

/**
 * @page /privacy
 * @entity CAMPAIGN
 * @description The privacy policy for MTGOA Publisher, the scheduled tool (six-faces-council
 *   council/podcast/publish/publish.py) that uploads Wendell's own podcast episodes and clips to his
 *   own YouTube channel, Instagram account and Facebook Page. Google's YouTube API audit and Meta's
 *   app review each ask for a public privacy policy URL; this is it (pod-full-upload-route, 2026-10-31).
 * @permissions public
 * @relationships /mastering-allyship, /podcast
 * @dimensions WHO:reviewer, WHAT:policy, WHERE:mastering-allyship, ENERGY:trust
 * @example /privacy
 * @agentDiscoverable true
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Privacy</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Privacy policy · MTGOA Publisher
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            It posts my own show to my own accounts, and reads nobody else&apos;s data.
          </h1>
          <p className="text-sm text-zinc-500">Last changed 31 October 2026.</p>
          <p className="text-base leading-relaxed text-[#a09e98]">
            MTGOA Publisher is a small tool I run for my podcast, Mastering the Game of Allyship. It
            uploads my own episodes to my own YouTube channel, and my own clips to my own Instagram
            account and Facebook Page, on dates I approve. No one else signs in to it, and it has no
            users besides me.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">What it uses</h2>
          <p className="text-base leading-relaxed text-[#a09e98]">
            <strong className="text-[#e8e6e0]">Google and YouTube.</strong> A sign-in token for my own
            channel, with permission to upload videos and to read the channel&apos;s name. The tool uses it
            to upload an episode, set its thumbnail, and confirm which channel it is signed in to. It does
            not read viewers&apos; data, comments, subscribers or any other channel.
          </p>
          <p className="text-base leading-relaxed text-[#a09e98]">
            <strong className="text-[#e8e6e0]">Meta.</strong> A token for my own Facebook Page and its
            linked Instagram account, used to publish my posts and read their view counts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">What it keeps</h2>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The tokens live only in GitHub&apos;s encrypted secret store for the repository that runs the
            tool. They are never written to a file, a log or a message. After a post goes out, the tool
            records its id, link, time and view counts. It keeps nothing else and shares nothing with
            anyone.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Removing access</h2>
          <p className="text-base leading-relaxed text-[#a09e98]">
            I can revoke the tool&apos;s access at any time from my Google account&apos;s security settings
            (third-party connections) or Meta&apos;s Business Integrations, and by deleting its secrets.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Contact</h2>
          <p className="text-base leading-relaxed text-[#a09e98]">
            Write to me, Wendell Britt, at{' '}
            <a href="mailto:wendell@masteringallyship.com" className="text-amber-400 hover:text-amber-300">
              wendell@masteringallyship.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

/**
 * @page /privacy
 * @description Privacy policy for the MTGOA Publisher app (Meta) and this site. Public.
 */
export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Mastering the Game of Allyship and the MTGOA Publisher app.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-300">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-zinc-500">Last updated 19 October 2026</p>

        <p>
          This policy covers Mastering the Game of Allyship (the podcast and book by Wendell Britt) and the
          MTGOA Publisher app, a Meta app that Wendell Britt uses to publish the show&apos;s own posts to its
          Instagram account and Facebook Page.
        </p>

        <h2 className="text-lg font-semibold text-white">What the MTGOA Publisher app does</h2>
        <p>
          The app posts the show&apos;s own episodes, clips, images and captions to the show&apos;s Instagram
          account and Facebook Page, and reads the view, save and share counts of those posts. It acts only on
          accounts that Wendell Britt owns and has connected to it. It does not ask visitors or followers to log
          in, and it does not collect their personal information.
        </p>

        <h2 className="text-lg font-semibold text-white">What we collect and keep</h2>
        <p>
          The app stores an access token for the show&apos;s own accounts, kept as a private secret and never
          published. It stores the content it posts and the post numbers Meta returns. It does not store
          information about people who view, like, comment on or follow those posts, other than the totals Meta
          reports.
        </p>

        <h2 className="text-lg font-semibold text-white">What we share</h2>
        <p>
          We do not sell personal information, and we do not share it for advertising. Content posted through
          the app goes to Meta, where Meta&apos;s own privacy policy applies.
        </p>

        <h2 className="text-lg font-semibold text-white">Deleting your data</h2>
        <p>
          The app holds no profile of you. If you commented on, tagged yourself in, or appear in one of the
          show&apos;s posts and want it removed, write to the address below with a link to the post and we will
          remove it. You can also remove the app&apos;s access to your own account at any time in your Facebook
          or Instagram settings, under Apps and Websites.
        </p>

        <h2 className="text-lg font-semibold text-white">Contact</h2>
        <p>
          Wendell Britt, wendell@masteringallyship.com. We will update this page when the practices above
          change and show the date at the top.
        </p>
      </div>
    </main>
  )
}

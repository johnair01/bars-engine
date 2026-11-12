import { CopyEditor } from './CopyEditor'

export const dynamic = 'force-dynamic'

/** Admin: the default text of the Friendcraft deck pages. The admin layout already holds this to site admins; the API also lets a Friendcraft steward save. */
export default function FriendcraftCopyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Friendcraft deck text</h1>
        <p className="text-sm text-zinc-400">
          These are the words a friend reads in their book when they write a goal and word three cards. Change a line and
          the next page a friend opens shows it. Clear a line to bring the built-in words back. A line is one short
          sentence with no numbers.
        </p>
      </header>
      <CopyEditor />
    </div>
  )
}

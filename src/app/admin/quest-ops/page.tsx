import { redirect } from 'next/navigation'

/** Alias for “Quest ops” hub — primary surface is `/admin/quests`. */
export default function QuestOpsRedirectPage() {
  redirect('/admin/quests')
}

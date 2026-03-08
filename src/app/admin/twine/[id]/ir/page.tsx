import { getStoryForAdmin, getCompiledVersionsForStory } from '@/actions/twine'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IRAuthoringClient } from './IRAuthoringClient'

export default async function AdminTwineIRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [story, versions] = await Promise.all([
    getStoryForAdmin(id),
    getCompiledVersionsForStory(id),
  ])
  if (!story) redirect('/admin/twine')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/twine/${id}`}
          className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit IR: {story.title}</h1>
          <p className="text-zinc-500 text-sm">Structured story nodes → compile to .twee → publish</p>
        </div>
      </div>

      <IRAuthoringClient story={story} versions={versions} />
    </div>
  )
}

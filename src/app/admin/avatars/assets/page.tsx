import { getAdminSpriteAssets } from '@/actions/admin'
import Link from 'next/link'
import { SpriteAssetsClient } from './SpriteAssetsClient'

/**
 * @page /admin/avatars/assets
 * @entity PLAYER
 * @description Browse and upload sprite layer assets (base, nation_body, playbook_outfit, nation_accent, playbook_accent)
 * @permissions admin
 * @dimensions WHO:admin, WHAT:PLAYER, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/avatars/assets
 * @agentDiscoverable false
 */
export default async function AdminSpriteAssetsPage() {
    const data = await getAdminSpriteAssets()

    return (
        <div className="space-y-6 sm:space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Sprite Assets</h1>
                    <p className="text-zinc-400 text-sm">
                        Browse sprite files by layer. Upload or replace PNGs for avatar composition.
                        Layers stack in order: base → nation_body → playbook_outfit → nation_accent → playbook_accent.
                        Verify stacking at the <Link href="/admin/avatars" className="text-purple-400 hover:text-purple-300">Avatar Gallery</Link>.
                    </p>
                </div>
                <Link
                    href="/admin/avatars"
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    ← Avatar Gallery
                </Link>
            </header>

            <SpriteAssetsClient data={data} />
        </div>
    )
}

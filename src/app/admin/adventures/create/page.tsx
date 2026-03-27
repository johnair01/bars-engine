import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"
import { CreateAdventureForm } from "./CreateAdventureForm"
import Link from "next/link"

/**
 * @page /admin/adventures/create
 * @entity QUEST
 * @description Create new Twine narrative campaign or quest adventure
 * @permissions admin
 * @dimensions WHO:admin, WHAT:QUEST, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/adventures/create
 * @agentDiscoverable false
 */
export default function CreateAdventurePage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <AdminPageHeader
                title="Create Adventure"
                description="Start a new Twine narrative campaign or quest."
                action={
                    <Link
                        href="/admin/adventures"
                        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        &larr; Back to List
                    </Link>
                }
            />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <CreateAdventureForm />
            </div>
        </div>
    )
}

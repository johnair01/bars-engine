import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"
import { CreatePassageForm } from "./CreatePassageForm"
import Link from "next/link"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function CreatePassagePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const p = await params
    const adventure = await db.adventure.findUnique({
        where: { id: p.id }
    })

    if (!adventure) {
        notFound()
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <AdminPageHeader
                title="Create Passage"
                description={`Adding a new node to ${adventure.title}`}
                action={
                    <Link
                        href={`/admin/adventures/${adventure.id}`}
                        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        &larr; Back to {adventure.title}
                    </Link>
                }
            />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <CreatePassageForm adventureId={adventure.id} />
            </div>
        </div>
    )
}

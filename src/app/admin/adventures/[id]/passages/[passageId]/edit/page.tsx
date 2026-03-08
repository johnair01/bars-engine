import { db } from "@/lib/db"
import { AdminPageHeader } from "@/app/admin/components/AdminPageHeader"
import { EditPassageForm } from "./EditPassageForm"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function EditPassagePage({
    params
}: {
    params: Promise<{ id: string; passageId: string }>
}) {
    const p = await params
    const passage = await db.passage.findUnique({
        where: { id: p.passageId },
        include: { adventure: { include: { passages: true } } }
    })

    if (!passage || passage.adventureId !== p.id) {
        notFound()
    }

    const passages = passage.adventure?.passages ?? []

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={`Edit Passage: ${passage.nodeId}`}
                description="Update passage text and choices."
                action={
                    <Link
                        href={`/admin/adventures/${p.id}`}
                        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        &larr; Back to Adventure
                    </Link>
                }
            />

            <EditPassageForm adventureId={p.id} passage={passage} passages={passages} />
        </div>
    )
}

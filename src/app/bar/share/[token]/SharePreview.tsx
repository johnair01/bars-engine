'use client'

type Share = {
    bar: { id: string; title: string; description: string | null }
    fromUser: { name: string }
    instance: { id: string; name: string; slug: string } | null
}

export function SharePreview({ share }: { share: Share }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <p className="text-sm text-zinc-500">
                <span className="text-zinc-400 font-medium">{share.fromUser.name}</span> has shared a reflection with you
            </p>
            <h2 className="text-lg font-bold text-white">{share.bar.title}</h2>
            {share.bar.description && (
                <p className="text-sm text-zinc-400 line-clamp-3">{share.bar.description}</p>
            )}
            {share.instance && (
                <p className="text-xs text-zinc-500">
                    Part of <span className="text-zinc-400">{share.instance.name}</span>
                </p>
            )}
        </div>
    )
}

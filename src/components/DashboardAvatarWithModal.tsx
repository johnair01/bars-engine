'use client'

import { useState } from 'react'
import { Avatar } from './Avatar'
import { AvatarModal } from './AvatarModal'

type DashboardAvatarWithModalProps = {
    player: { name: string; avatarConfig?: string | null; pronouns?: string | null }
}

export function DashboardAvatarWithModal({ player }: DashboardAvatarWithModalProps) {
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="cursor-pointer rounded-full ring-2 ring-transparent hover:ring-purple-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="View avatar"
            >
                <Avatar player={player} size="lg" />
            </button>
            <AvatarModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                player={player}
            />
        </>
    )
}

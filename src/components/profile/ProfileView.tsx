'use client'

import React, { useState } from 'react'
import { ProfileRoomCanvas } from './ProfileRoomCanvas'
import { Trophy, Package, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AnchorData } from '@/lib/spatial-world/pixi-room'

interface ProfileViewProps {
    player: {
        id: string
        name: string
        nation?: { name: string } | null
        archetype?: { name: string } | null
    }
    profileMap: {
        rooms: {
            id: string
            name: string
            tilemap: string
            anchors: any[]
        }[]
    }
    trophyRoom: {
        id: string
        name: string
        tilemap: string
        anchors: any[]
    }
    isOwner: boolean
    myCompletedQuests: {
        questId: string
        quest: { name: string }
        completedAt: string | null
    }[]
    avatarInfo: {
        avatarConfig: string | null
        walkableSpriteUrl: string | null
    }
}

export function ProfileView({
    player,
    trophyRoom,
    isOwner,
    myCompletedQuests,
    avatarInfo,
}: ProfileViewProps) {
    const [selectedArtifact, setSelectedArtifact] = useState<{ id: string; type: 'BAR' | 'BAR_DECK'; name: string } | null>(null)
    
    // Parse tilemap and anchors
    const tilemap = JSON.parse(trophyRoom.tilemap || '{}')
    const anchors: AnchorData[] = (trophyRoom.anchors || []).map((a: any) => ({
        id: a.id,
        anchorType: a.anchorType,
        tileX: a.tileX,
        tileY: a.tileY,
        label: a.label,
        linkedId: a.linkedId,
        linkedType: a.linkedType,
        config: a.config || null,
    }))

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10 flex flex-col gap-8 max-w-7xl mx-auto h-screen">
            <header className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        {isOwner ? 'My Personal Museum' : `${player.name}'s Museum`}
                        <Sparkles className="w-5 h-5 text-amber-400" />
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Resonating as <span className="text-purple-400 font-bold">{player.archetype?.name}</span> of <span className="text-cyan-400 font-bold">{player.nation?.name}</span>
                    </p>
                </div>
                <div className="flex gap-4">
                     <Link href="/" className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm">
                        Dashboard
                     </Link>
                </div>
            </header>

            <main className="flex-1 flex gap-8 overflow-hidden">
                <div className="flex-1 h-full relative">
                    <ProfileRoomCanvas
                        spatialBindKey={`profile-${trophyRoom.id}-${JSON.stringify(tilemap)}`}
                        player={{
                            id: player.id,
                            name: player.name,
                            avatarConfig: avatarInfo.avatarConfig,
                            walkableSpriteUrl: avatarInfo.walkableSpriteUrl,
                        }}
                        room={{ id: trophyRoom.id, name: trophyRoom.name, tilemap, anchors }}
                        isOwner={isOwner}
                        selectedArtifact={selectedArtifact}
                        onPlaced={() => setSelectedArtifact(null)}
                    />
                </div>

                {isOwner && (
                    <aside className="w-80 flex flex-col gap-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 shrink-0 overflow-y-auto">
                        <div className="space-y-1">
                             <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    Trophy Slots ({anchors.filter(a => a.anchorType === 'bar' || a.anchorType === 'bar_deck').length}/8)
                                </h2>
                                <div className="text-[10px] font-bold text-amber-500 uppercase animate-pulse">
                                    {selectedArtifact ? 'Click map to place' : '8 Slots Total'}
                                </div>
                             </div>
                             <p className="text-[10px] text-zinc-600 leading-tight">
                                {selectedArtifact 
                                    ? `Now click anywhere in the room to place "${selectedArtifact.name}"` 
                                    : "Select a BAR to curate it into the spatial room."
                                }
                             </p>
                        </div>

                        <div className="space-y-3">
                            {myCompletedQuests.map((pq) => {
                                const isSelected = selectedArtifact?.id === pq.questId
                                return (
                                    <div 
                                        key={pq.questId}
                                        onClick={() => setSelectedArtifact(isSelected ? null : { id: pq.questId, type: 'BAR', name: pq.quest.name })}
                                        className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'bg-amber-600/20 border-amber-500 shadow-lg shadow-amber-900/20' 
                                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-500/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                                               isSelected ? 'bg-amber-500 border-amber-400 text-white' : 'bg-zinc-800 border-zinc-700 group-hover:bg-zinc-700 text-zinc-500'
                                           }`}>
                                                <Package className="w-4 h-4" />
                                           </div>
                                           <div className={`text-xs font-bold truncate max-w-[150px] ${isSelected ? 'text-amber-200' : 'text-white'}`}>
                                                {pq.quest.name}
                                           </div>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 italic">
                                            {isSelected ? 'Ready to place' : `Metabolized: ${new Date(pq.completedAt || '').toLocaleDateString()}`}
                                        </div>
                                    </div>
                                )
                            })}

                            {myCompletedQuests.length === 0 && (
                                <div className="text-center py-10 opacity-30 italic text-sm">
                                    No completed BARs held.
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </main>
        </div>
    )
}

/**
 * The 8 Kotter Stages mapped to archetype moves.
 * When a player with the matching playbook makes a move,
 * they can advance the quest to the next stage.
 */
export const KOTTER_STAGES = {
    1: { name: 'Urgency', move: 'THUNDERCLAP', trigram: 'Thunder', emoji: '⚡' },
    2: { name: 'Coalition', move: 'NURTURE', trigram: 'Earth', emoji: '🤝' },
    3: { name: 'Vision', move: 'COMMAND', trigram: 'Heaven', emoji: '👁' },
    4: { name: 'Communicate', move: 'EXPRESS', trigram: 'Lake', emoji: '🎭' },
    5: { name: 'Obstacles', move: 'INFILTRATE', trigram: 'Water', emoji: '💧' },
    6: { name: 'Wins', move: 'IGNITE', trigram: 'Fire', emoji: '🔥' },
    7: { name: 'Build On', move: 'PERMEATE', trigram: 'Wind', emoji: '🌬' },
    8: { name: 'Anchor', move: 'IMMOVABLE', trigram: 'Mountain', emoji: '⛰' },
} as const

export type KotterStage = keyof typeof KOTTER_STAGES

export type ArchetypeMove = typeof KOTTER_STAGES[KotterStage]['move']

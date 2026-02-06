import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Create Roles
    const roles = [
        { key: 'ACE', displayName: 'Ace (Gilligan)', description: 'The innocent, the wildcard.' },
        { key: 'VETERAN', displayName: 'Veteran (Skipper)', description: 'The leader, the protector.' },
        { key: 'ENGINEER', displayName: 'Engineer (Professor)', description: 'The builder, the solver.' },
        { key: 'ROOKIE', displayName: 'Rookie (Mary Ann)', description: 'The grounded, the hopeful.' },
        { key: 'LEADER', displayName: 'Leader (Howell)', description: 'The resource holder.' },
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: { key: role.key },
            update: {},
            create: role,
        })
    }

    // 2. Create 64 Bars (Placeholder)
    for (let i = 1; i <= 64; i++) {
        await prisma.bar.upsert({
            where: { id: i },
            update: {},
            create: {
                id: i,
                name: `Bar #${i}`,
                tone: 'Neutral',
                text: `This is the state of Bar ${i}. Potential energy waiting for form.`,
            },
        })
    }

    // 3. Create Admin Invite
    await prisma.invite.upsert({
        where: { token: 'ANTIGRAVITY' },
        update: {},
        create: {
            token: 'ANTIGRAVITY',
            status: 'active',
            preassignedRoleKey: 'ENGINEER',
        },
    })

    // 4. Create Nations (Canonical Spec) with Basic Moves
    const nations = [
        {
            name: 'Argyra',
            description: 'The Silver City. Logic, reflection, and mirrors.',
            imgUrl: '/nations/argyra.png',
            wakeUp: 'Mirror Meditation: See yourself clearly by examining your reflections in others.',
            cleanUp: 'Silver Purge: Dissolve illusions and false beliefs through logical analysis.',
            growUp: 'Crystal Lattice: Build systematic frameworks for understanding complexity.',
            showUp: 'Calculated Action: Execute with precision based on thorough analysis.',
        },
        {
            name: 'Pyrakanth',
            description: 'The Burning Garden. Passion, consumption, and growth.',
            imgUrl: '/nations/pyrakanth.png',
            wakeUp: 'Ember Vision: Let passion illuminate what truly matters to you.',
            cleanUp: 'Burn Offering: Transform old wounds into fuel for new growth.',
            growUp: 'Wild Cultivation: Nurture your desires into full bloom through devoted care.',
            showUp: 'Blaze Forward: Act with full intensity and commitment.',
        },
        {
            name: 'Virelune',
            description: 'The Green Moon. Mystery, tides, and secrets.',
            imgUrl: '/nations/virelune.png',
            wakeUp: 'Lunar Insight: Attune to hidden patterns by observing what others miss.',
            cleanUp: 'Tide Washing: Let emotional currents carry away what no longer serves.',
            growUp: 'Mystery School: Embrace not-knowing as the path to deeper wisdom.',
            showUp: 'Shadow Walk: Act subtly, leaving no trace but lasting impact.',
        },
        {
            name: 'Meridia',
            description: 'The Golden Noon. Clarity, trade, and exchange.',
            imgUrl: '/nations/meridia.png',
            wakeUp: 'Noon Clarity: Stand in the full light and see all things as they are.',
            cleanUp: 'Fair Exchange: Release attachments by trading old for new.',
            growUp: 'Market Mastery: Learn the art of value creation and exchange.',
            showUp: 'Golden Deal: Take action through negotiation and mutual benefit.',
        },
        {
            name: 'Lamenth',
            description: 'The Weeping Stone. Memory, history, and foundations.',
            imgUrl: '/nations/lamenth.png',
            wakeUp: 'Ancestral Sight: Remember the wisdom embedded in your lineage.',
            cleanUp: 'Stone Grief: Honor old pain by allowing it to fully pass through.',
            growUp: 'Foundation Building: Grow by deeply understanding where you came from.',
            showUp: 'Enduring Presence: Act with the weight of history behind you.',
        },
    ]

    for (const n of nations) {
        await prisma.nation.upsert({
            where: { name: n.name },
            update: {
                wakeUp: n.wakeUp,
                cleanUp: n.cleanUp,
                growUp: n.growUp,
                showUp: n.showUp,
            },
            create: n,
        })
    }

    // 5. Create Playbooks (Trigram Canonical) with Basic Moves
    // Map of Descriptive Name -> Filename for content loading
    const fileMap: Record<string, string> = {
        'The Bold Heart': 'heaven.md',
        'The Devoted Guardian': 'earth.md',
        'The Decisive Storm': 'thunder.md',
        'The Danger Walker': 'water.md',
        'The Still Point': 'mountain.md',
        'The Subtle Influence': 'wind.md',
        'The Truth Seer': 'fire.md',
        'The Joyful Connector': 'lake.md',
    }

    const playbooks = [
        {
            name: 'The Bold Heart',
            description: 'Element: Heaven (Qian). The one who acts when others hesitate.',
            moves: JSON.stringify(['The Catalyst', 'The Initiator', 'The Unstoppable Spark']),
            wakeUp: 'Cosmic Vision: See the grand pattern that connects all things.',
            cleanUp: 'Dragon\'s Breath: Burn away doubt and hesitation.',
            growUp: 'Sovereign Path: Develop leadership through taking responsibility.',
            showUp: 'Initiative: Be the first to act, setting the direction for others.',
        },
        {
            name: 'The Devoted Guardian',
            description: 'Element: Earth (Kun). Selfless protector who holds space for others.',
            moves: JSON.stringify(['The Protective Friend', 'The Grounding Force', 'The Space-Holder']),
            wakeUp: 'Ground Sense: Feel the truth of a situation through your body.',
            cleanUp: 'Composting: Transform decay into fertile ground.',
            growUp: 'Steady Cultivation: Grow through patient, consistent practice.',
            showUp: 'Hold Space: Act by receiving and supporting others.',
        },
        {
            name: 'The Decisive Storm',
            description: 'Element: Thunder (Zhen). The one who acts in the crucial moment.',
            moves: JSON.stringify(['The Storm', 'The Moment Seizer', 'The Bold Interrupter']),
            wakeUp: 'Shock Awareness: Let sudden insight shake you out of complacency.',
            cleanUp: 'Storm Release: Express stuck energy through dramatic catharsis.',
            growUp: 'Rapid Activation: Grow through bold experiments and quick pivots.',
            showUp: 'First Strike: Act decisively before conditions change.',
        },
        {
            name: 'The Danger Walker',
            description: 'Element: Water (Kan). The one who thrives in chaos and danger.',
            moves: JSON.stringify(['The Chaos Surfer', 'The Deep Diver', 'The Storm Sailor']),
            wakeUp: 'Depth Perception: See beneath the surface to hidden currents.',
            cleanUp: 'Dissolution: Let go by allowing things to dissolve naturally.',
            growUp: 'Adaptive Learning: Grow by flowing around obstacles.',
            showUp: 'Persistence: Act like water—find every crack, never stop.',
        },
        {
            name: 'The Still Point',
            description: 'Element: Mountain (Gen). The one who knows when to stop.',
            moves: JSON.stringify(['The Immovable Presence', 'The Deliberate Stopper', 'The Resting Power']),
            wakeUp: 'Still Point: Find clarity in absolute stillness.',
            cleanUp: 'Stone Silence: Release through stopping completely.',
            growUp: 'Inner Heights: Grow by going inward and upward.',
            showUp: 'Immovable Stand: Act by refusing to move.',
        },
        {
            name: 'The Subtle Influence',
            description: 'Element: Wind (Xun). The one who changes everything gradually.',
            moves: JSON.stringify(['The Gentle Influencer', 'The Patient Transformer', 'The Unseen Changer']),
            wakeUp: 'Subtle Perception: Notice the small signs that reveal big truths.',
            cleanUp: 'Gentle Dispersal: Let old patterns scatter like leaves in wind.',
            growUp: 'Gradual Influence: Grow by slowly permeating new territories.',
            showUp: 'Indirect Action: Act through suggestion and gentle pressure.',
        },
        {
            name: 'The Truth Seer',
            description: 'Element: Fire (Li). The one who sees and speaks what\'s real.',
            moves: JSON.stringify(['The Truth-Teller', 'The Clarity-Bringer', 'The Illusion-Burner']),
            wakeUp: 'Illumination: See clearly by bringing light to dark corners.',
            cleanUp: 'Purifying Flame: Burn away impurities to reveal the essential.',
            growUp: 'Radiant Development: Grow by sharing your light with others.',
            showUp: 'Declare: Act by making your position brilliantly clear.',
        },
        {
            name: 'The Joyful Connector',
            description: 'Element: Lake (Dui). The one who brings people together through delight.',
            moves: JSON.stringify(['The Natural Connector', 'The Joy-Spreader', 'The Open Heart']),
            wakeUp: 'Joyful Recognition: See truth through delight and pleasure.',
            cleanUp: 'Laughter\'s Release: Let joy dissolve what heaviness remains.',
            growUp: 'Generous Exchange: Grow through giving and receiving freely.',
            showUp: 'Invitation: Act by creating openings for others to join.',
        },
    ]

    // Helper to extract list items
    const extractList = (text: string, header: string, endMarker: string = '\n\n'): string[] => {
        const regex = new RegExp(`\\*\\*${header}\\*\\*:[\\s\\n]+([\\s\\S]*?)(?=${endMarker}|$)`, 'i')
        const match = text.match(regex)
        if (!match) return []
        return match[1].split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s*/, ''))
    }

    const extractLine = (text: string, header: string): string | null => {
        const regex = new RegExp(`\\*\\*${header}\\*\\*:\\s*(.*)`, 'i')
        const match = text.match(regex)
        return match ? match[1].trim() : null
    }

    for (const p of playbooks) {
        // Read Markdown Content
        const filename = fileMap[p.name]
        let content = ''
        let richData: any = {}

        if (filename) {
            try {
                const filePath = path.join(process.cwd(), 'docs/handbook/archetypes', filename)
                content = fs.readFileSync(filePath, 'utf-8')

                // Parse Rich Data
                richData = {
                    centralConflict: extractLine(content, 'Central Conflict'),
                    vibe: extractLine(content, 'Your vibe'),
                    energy: extractLine(content, 'Your energy'),
                    primaryQuestion: (() => {
                        // "Choose [Archetype] if you:"
                        const match = content.match(/\*\*Choose.*?if you:\*\*\s*(.*)/i)
                        return match ? match[1].trim() : null
                    })(),
                    examples: JSON.stringify(extractList(content, 'Example Archetypes', '\\n###')),
                    shadowSignposts: JSON.stringify(extractList(content, 'This is NOT about', '\\n\\*\\*This IS')),
                    lightSignposts: JSON.stringify(extractList(content, 'This IS about', '\\n---')),
                }

            } catch (err) {
                console.warn(`Warning: Could not read/parse content for ${p.name} (${filename})`, err)
            }
        }

        await prisma.playbook.upsert({
            where: { name: p.name },
            update: {
                wakeUp: p.wakeUp,
                cleanUp: p.cleanUp,
                growUp: p.growUp,
                showUp: p.showUp,
                description: p.description,
                content: content,
                ...richData
            },
            create: {
                ...p,
                content: content,
                ...richData
            },
        })
    }

    // 5b. MIGRATION: Cleanup old Trigram Playbooks and migrate players
    const migrationMap: Record<string, string> = {
        // Original short names
        'Heaven': 'The Bold Heart',
        'Earth': 'The Devoted Guardian',
        'Thunder': 'The Decisive Storm',
        'Water': 'The Danger Walker',
        'Mountain': 'The Still Point',
        'Wind': 'The Subtle Influence',
        'Fire': 'The Truth Seer',
        'Lake': 'The Joyful Connector',
        // Legacy "Trigram" names (found in DB)
        'Heaven (Qian)': 'The Bold Heart',
        'Earth (Kun)': 'The Devoted Guardian',
        'Thunder (Zhen)': 'The Decisive Storm',
        'Water (Kan)': 'The Danger Walker',
        'Mountain (Gen)': 'The Still Point',
        'Wind (Xun)': 'The Subtle Influence',
        'Fire (Li)': 'The Truth Seer',
        'Lake (Dui)': 'The Joyful Connector'
    }

    for (const [oldName, newName] of Object.entries(migrationMap)) {
        const oldP = await prisma.playbook.findUnique({ where: { name: oldName } })
        const newP = await prisma.playbook.findUnique({ where: { name: newName } })

        if (oldP && newP) {
            console.log(`Migrating players from ${oldName} to ${newName}...`)
            await prisma.player.updateMany({
                where: { playbookId: oldP.id },
                data: { playbookId: newP.id }
            })
            console.log(`Deleting legacy playbook: ${oldName}`)
            await prisma.playbook.delete({ where: { id: oldP.id } })
        }
    }

    // 6. Create Demo Invite Tokens
    const demoTokens = [
        { token: 'WENDELL', preassignedRoleKey: 'ACE' },
        { token: 'PLAYER_TWO', preassignedRoleKey: 'ROOKIE' },
    ]
    for (const dt of demoTokens) {
        await prisma.invite.upsert({
            where: { token: dt.token },
            update: {},
            create: {
                token: dt.token,
                status: 'active',
                preassignedRoleKey: dt.preassignedRoleKey,
            },
        })
    }

    // 7. Create PUBLIC Invite (for quick onboarding/testing)
    await prisma.invite.upsert({
        where: { token: 'PUBLIC' },
        update: {},
        create: {
            token: 'PUBLIC',
            status: 'active',
            maxUses: 1000,
            uses: 0,
        },
    })

    // 7b. Create SHOW_CAP Invite (Operation: Show Cap Alpha Seeding)
    // Theme: 'oceans11' (Fiasco / Coen Brothers / Professional Heist)
    await prisma.invite.upsert({
        where: { token: 'SHOW_CAP' },
        update: {
            theme: 'oceans11', // Update theme if it exists
        },
        create: {
            token: 'SHOW_CAP',
            status: 'active',
            maxUses: 100,
            uses: 0,
            theme: 'oceans11',
        },
    })

    // 8. Create Test Players with known IDs
    const testPlayers = [
        { id: 'test-alice', name: 'Alice (Test)', contactType: 'email', contactValue: 'alice@test.local' },
        { id: 'test-bob', name: 'Bob (Test)', contactType: 'email', contactValue: 'bob@test.local' },
    ]

    // Get PUBLIC invite ID for linking
    const publicInvite = await prisma.invite.findUnique({ where: { token: 'PUBLIC' } })

    for (const tp of testPlayers) {
        const existing = await prisma.player.findUnique({ where: { id: tp.id } })
        if (!existing && publicInvite) {
            const player = await prisma.player.create({
                data: {
                    id: tp.id,
                    name: tp.name,
                    contactType: tp.contactType,
                    contactValue: tp.contactValue,
                    inviteId: publicInvite.id,
                },
            })

            // Create StarterPack for this player
            await prisma.starterPack.upsert({
                where: { playerId: player.id },
                update: {},
                create: {
                    playerId: player.id,
                    data: JSON.stringify({ completedBars: [], activeBars: [] }),
                },
            })

            console.log(`  Created test player: ${tp.name}`)
        }
    }

    // 8b. Create/Update Admin Account (test-admin) with Password
    if (publicInvite) {
        const adminEmail = 'admin@admin.local'
        const adminPasswordHash = await hash('password', 10)

        // 1. Create Account
        const adminAccount = await prisma.account.upsert({
            where: { email: adminEmail },
            update: { passwordHash: adminPasswordHash },
            create: {
                email: adminEmail,
                passwordHash: adminPasswordHash
            }
        })

        // 2. Create/Update Player linked to Account
        // We use upsert to ensure test-admin exists and has the correct accountId
        const adminPlayer = await prisma.player.upsert({
            where: { id: 'test-admin' },
            update: {
                accountId: adminAccount.id,
                contactValue: adminEmail
            },
            create: {
                id: 'test-admin',
                name: 'Admin (God Mode)',
                contactType: 'email',
                contactValue: adminEmail,
                inviteId: publicInvite.id,
                accountId: adminAccount.id,
                onboardingComplete: true
            }
        })

        // Create StarterPack for Admin
        await prisma.starterPack.upsert({
            where: { playerId: adminPlayer.id },
            update: {},
            create: {
                playerId: adminPlayer.id,
                data: JSON.stringify({ completedBars: [], activeBars: [] }),
            },
        })

        console.log(`  Created ADMIN account: ${adminEmail} / password`)
    }

    // 9. Create Admin Role for test-admin
    const adminRole = await prisma.role.findUnique({ where: { key: 'admin' } })
    if (!adminRole) {
        await prisma.role.create({
            data: { key: 'admin', displayName: 'Administrator', description: 'Full system access' },
        })
    }
    const testAdmin = await prisma.player.findUnique({ where: { id: 'test-admin' } })
    if (testAdmin) {
        const adminRoleRecord = await prisma.role.findUnique({ where: { key: 'admin' } })
        if (adminRoleRecord) {
            await prisma.playerRole.upsert({
                where: { playerId_roleId: { playerId: testAdmin.id, roleId: adminRoleRecord.id } },
                update: {},
                create: { playerId: testAdmin.id, roleId: adminRoleRecord.id },
            })
        }
    }

    // 10. Create Sample CustomBars for testing visibility
    const alice = await prisma.player.findUnique({ where: { id: 'test-alice' } })
    if (alice) {
        // Public bar (everyone can see)
        await prisma.customBar.upsert({
            where: { id: 'sample-public-bar' },
            update: {},
            create: {
                id: 'sample-public-bar',
                creatorId: alice.id,
                title: 'Community Quest',
                description: 'A public quest anyone can pick up.',
                visibility: 'public',
                inputs: JSON.stringify([{ key: 'response', label: 'Your Response', type: 'text' }]),
            },
        })

        // Private bar (only Alice sees, must delegate)
        await prisma.customBar.upsert({
            where: { id: 'sample-private-bar' },
            update: {},
            create: {
                id: 'sample-private-bar',
                creatorId: alice.id,
                title: 'Secret Mission',
                description: 'A private draft only Alice can see.',
                visibility: 'private',
                inputs: JSON.stringify([{ key: 'response', label: 'Secret', type: 'textarea' }]),
            },
        })

        console.log('  Created sample CustomBars (public + private)')
    }

    // 11. Create Orientation Thread with Starter Quests
    console.log('Creating orientation thread...')

    // Get a creator for the quests (use test-admin or alice)
    const threadCreator = await prisma.player.findFirst({
        where: { id: { in: ['test-admin', 'test-alice'] } }
    })

    if (threadCreator) {
        // Create orientation quests (CustomBars)
        const orientationQuests = [
            {
                id: 'orientation-quest-1',
                title: 'Set Your Intention',
                description: 'What brings you to this journey? This "Wake Up" quest is about setting your orientation as we prepare for the party.',
                moveType: 'wakeUp',
                inputs: JSON.stringify([{ key: 'intention', label: 'My intention is...', type: 'textarea' }]),
            },
            {
                id: 'orientation-quest-2',
                title: 'Meet Your Archetype',
                description: 'Explore your archetype\'s story and handbook. This "Wake Up" quest raises your awareness of your natural patterns.',
                moveType: 'wakeUp',
                inputs: JSON.stringify([{
                    key: 'reflection',
                    label: 'The move that resonates most is...',
                    type: 'text',
                    trigger: 'ARCHETYPE_VIEWED' // To be used by fireTrigger
                }]),
            },
            {
                id: 'orientation-quest-3',
                title: 'Cast Your First Reading',
                description: 'Visit the I Ching caster. This "Wake Up" quest connects you with the signal of the moment.',
                moveType: 'wakeUp',
                inputs: JSON.stringify([{ key: 'reflection', label: 'The reading spoke to me because...', type: 'textarea', trigger: 'ICHING_CAST' }]),
            },
            {
                id: 'orientation-quest-4',
                title: 'Send a Vibeulon',
                description: 'Find someone and send a token of connection. This "Show Up" quest is your first internal impact.',
                moveType: 'showUp',
                inputs: JSON.stringify([{ key: 'recipient', label: 'I sent my first Vibeulon to...', type: 'text' }]),
            },
        ]

        for (const quest of orientationQuests) {
            await prisma.customBar.upsert({
                where: { id: quest.id },
                update: {
                    title: quest.title,
                    description: quest.description,
                    moveType: quest.moveType,
                    inputs: quest.inputs,
                },
                create: {
                    id: quest.id,
                    creatorId: threadCreator.id,
                    title: quest.title,
                    description: quest.description,
                    type: 'vibe',
                    moveType: quest.moveType,
                    visibility: 'public',
                    reward: 1,
                    inputs: quest.inputs,
                },
            })
        }

        // Create the Orientation Thread
        const orientationThread = await prisma.questThread.upsert({
            where: { id: 'orientation-thread' },
            update: {},
            create: {
                id: 'orientation-thread',
                title: 'Welcome Journey',
                description: 'Your first steps into the Conclave. Complete these quests to find your footing.',
                threadType: 'orientation',
                creatorType: 'system',
                completionReward: 5, // Bonus vibeulons for completing the journey
            },
        })

        // Link quests to thread in order
        for (let i = 0; i < orientationQuests.length; i++) {
            await prisma.threadQuest.upsert({
                where: {
                    threadId_questId: {
                        threadId: orientationThread.id,
                        questId: orientationQuests[i].id
                    }
                },
                update: { position: i + 1 },
                create: {
                    threadId: orientationThread.id,
                    questId: orientationQuests[i].id,
                    position: i + 1,
                },
            })
        }

        console.log('  Created orientation thread with 4 starter quests')
    }

    console.log('Seeding complete.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

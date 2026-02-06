import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import fs from 'fs'
import path from 'path'

export async function runSeed(prisma: PrismaClient) {
    console.log('Seeding database...')

    // 1. Create Roles
    const roles = [
        { key: 'ACE', displayName: 'Ace (Gilligan)', description: 'The innocent, the wildcard.' },
        { key: 'VETERAN', displayName: 'Veteran (Skipper)', description: 'The leader, the protector.' },
        { key: 'ENGINEER', displayName: 'Engineer (Professor)', description: 'The builder, the solver.' },
        { key: 'ROOKIE', displayName: 'Rookie (Mary Ann)', description: 'The grounded, the hopeful.' },
        { key: 'LEADER', displayName: 'Leader (Howell)', description: 'The resource holder.' },
        { key: 'admin', displayName: 'Administrator', description: 'Full system access' }
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: { key: role.key },
            update: { displayName: role.displayName, description: role.description },
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
    const adminInvite = await prisma.invite.upsert({
        where: { token: 'ANTIGRAVITY' },
        update: {},
        create: {
            token: 'ANTIGRAVITY',
            status: 'active',
            preassignedRoleKey: 'ENGINEER',
        },
    })

    // 4. Create Nations
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
            update: n,
            create: n,
        })
    }

    // 5. Create Playbooks (Archetypes)
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

    // Helper functions for parsing
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
        const filename = fileMap[p.name]
        let content = ''
        let richData: any = {}

        if (filename) {
            try {
                // IMPORTANT: Use src/content/handbook path for production compatibility
                const filePath = path.join(process.cwd(), 'src/content/handbook/archetypes', filename)
                content = fs.readFileSync(filePath, 'utf-8')

                richData = {
                    centralConflict: extractLine(content, 'Central Conflict'),
                    vibe: extractLine(content, 'Your vibe'),
                    energy: extractLine(content, 'Your energy'),
                    primaryQuestion: (() => {
                        const match = content.match(/\*\*Choose.*?if you:\*\*\s*(.*)/i)
                        return match ? match[1].trim() : null
                    })(),
                    examples: JSON.stringify(extractList(content, 'Example Archetypes', '\\n###')),
                    shadowSignposts: JSON.stringify(extractList(content, 'This is NOT about', '\\n\\*\\*This IS')),
                    lightSignposts: JSON.stringify(extractList(content, 'This IS about', '\\n---')),
                }
            } catch (err) {
                console.warn(`Warning: Could not read/parse content for ${p.name}`, err)
            }
        }

        await prisma.playbook.upsert({
            where: { name: p.name },
            update: { ...p, content, ...richData },
            create: { ...p, content, ...richData },
        })
    }

    // 6. Create Public Invite
    const publicInvite = await prisma.invite.upsert({
        where: { token: 'PUBLIC' },
        update: {},
        create: { token: 'PUBLIC', status: 'active', maxUses: 1000, uses: 0 }
    })

    // 7. Create Admin Account
    const adminEmail = 'admin@admin.local'
    const adminPasswordHash = await hash('password', 10)
    const adminAccount = await prisma.account.upsert({
        where: { email: adminEmail },
        update: { passwordHash: adminPasswordHash },
        create: { email: adminEmail, passwordHash: adminPasswordHash }
    })

    const adminPlayer = await prisma.player.upsert({
        where: { id: 'test-admin' },
        update: { accountId: adminAccount.id, contactValue: adminEmail },
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

    await prisma.starterPack.upsert({
        where: { playerId: adminPlayer.id },
        update: {},
        create: { playerId: adminPlayer.id, data: JSON.stringify({ completedBars: [], activeBars: [] }) }
    })

    // Link admin role
    const adminRole = await prisma.role.findUnique({ where: { key: 'admin' } })
    if (adminRole) {
        await prisma.playerRole.upsert({
            where: { playerId_roleId: { playerId: adminPlayer.id, roleId: adminRole.id } },
            update: {},
            create: { playerId: adminPlayer.id, roleId: adminRole.id }
        })
    }

    // 8. Create 40 Test Accounts
    console.log('Creating 40 test accounts...')
    const allNations = await prisma.nation.findMany()
    const allPlaybooks = await prisma.playbook.findMany()

    for (const nation of allNations) {
        for (const playbook of allPlaybooks) {
            const nationSlug = nation.name.toLowerCase().replace(/\s+/g, '')
            const playbookSlug = playbook.name.toLowerCase().replace(/\s+/g, '-').replace('the-', '')
            const email = `test.${nationSlug}.${playbookSlug}@conclave.local`
            const testPasswordHash = await hash('password', 10)

            const acc = await prisma.account.upsert({
                where: { email },
                update: { passwordHash: testPasswordHash },
                create: { email, passwordHash: testPasswordHash }
            })

            const player = await prisma.player.upsert({
                where: { id: `test-${nationSlug}-${playbookSlug}` },
                update: { nationId: nation.id, playbookId: playbook.id },
                create: {
                    id: `test-${nationSlug}-${playbookSlug}`,
                    name: `${nation.name} ${playbook.name}`,
                    contactType: 'email',
                    contactValue: email,
                    inviteId: publicInvite.id,
                    accountId: acc.id,
                    nationId: nation.id,
                    playbookId: playbook.id,
                    onboardingComplete: true
                }
            })

            await prisma.starterPack.upsert({
                where: { playerId: player.id },
                update: {},
                create: { playerId: player.id, data: JSON.stringify({ completedBars: [], activeBars: [] }) }
            })
        }
    }

    // 9. Orientation Thread
    const orientationQuests = [
        { id: 'orientation-quest-1', title: 'Set Your Intention', moveType: 'wakeUp' },
        { id: 'orientation-quest-2', title: 'Meet Your Archetype', moveType: 'wakeUp' },
        { id: 'orientation-quest-3', title: 'Cast Your First Reading', moveType: 'wakeUp' },
        { id: 'orientation-quest-4', title: 'Send a Vibeulon', moveType: 'showUp' },
    ]

    for (const q of orientationQuests) {
        await prisma.customBar.upsert({
            where: { id: q.id },
            update: {},
            create: {
                id: q.id,
                creatorId: adminPlayer.id,
                title: q.title,
                description: 'Orientation quest description...',
                type: 'vibe',
                moveType: q.moveType,
                visibility: 'public',
                reward: 1,
                inputs: '[]'
            }
        })
    }

    const orientationThread = await prisma.questThread.upsert({
        where: { id: 'orientation-thread' },
        update: {},
        create: { id: 'orientation-thread', title: 'Welcome Journey', threadType: 'orientation', creatorType: 'system' }
    })

    for (let i = 0; i < orientationQuests.length; i++) {
        await prisma.threadQuest.upsert({
            where: { threadId_questId: { threadId: orientationThread.id, questId: orientationQuests[i].id } },
            update: { position: i + 1 },
            create: { threadId: orientationThread.id, questId: orientationQuests[i].id, position: i + 1 }
        })
    }

    console.log('Seeding complete.')
}

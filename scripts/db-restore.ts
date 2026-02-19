import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function restore() {
    const backupFile = process.argv[2]
    if (!backupFile) {
        console.error('❌ Please provide a backup file path: npx tsx scripts/db-restore.ts backups/snapshot_...')
        process.exit(1)
    }

    const backupPath = path.isAbsolute(backupFile) ? backupFile : path.join(process.cwd(), backupFile)

    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Backup file not found: ${backupPath}`)
        process.exit(1)
    }

    console.log(`📥 Starting Restoration from: ${backupFile}...`)

    try {
        const raw = fs.readFileSync(backupPath, 'utf8')
        const data = JSON.parse(raw)

        // 1. Restore Nations
        if (data.nations) {
            console.log('   - Restoring Nations...')
            for (const nation of data.nations) {
                try {
                    await prisma.nation.upsert({
                        where: { id: nation.id },
                        update: nation,
                        create: nation
                    })
                } catch (e) { }
            }
        }

        // 1b. Restore Invites
        if (data.invites) {
            console.log('   - Restoring Invites...')
            for (const invite of data.invites) {
                try {
                    await prisma.invite.upsert({
                        where: { id: invite.id },
                        update: invite,
                        create: invite
                    })
                } catch (e) { }
            }
        }

        // 2. Restore Playbooks
        if (data.playbooks) {
            console.log('   - Restoring Playbooks...')
            for (const playbook of data.playbooks) {
                try {
                    await prisma.playbook.upsert({
                        where: { id: playbook.id },
                        update: playbook,
                        create: playbook
                    })
                } catch (e) { }
            }
        }

        // 3. Restore Accounts
        if (data.accounts) {
            console.log('   - Restoring Accounts...')
            for (const account of data.accounts) {
                try {
                    await prisma.account.upsert({
                        where: { id: account.id },
                        update: account,
                        create: account
                    })
                } catch (e) { }
            }
        }

        // 4. Restore Players
        if (data.players) {
            console.log('   - Restoring Players...')
            for (const player of data.players) {
                try {
                    await prisma.player.upsert({
                        where: { id: player.id },
                        update: player,
                        create: player
                    })
                } catch (err) { }
            }
        }

        // 5. Restore CustomBars (Quests)
        if (data.customBars) {
            console.log('   - Restoring Quests...')
            for (const quest of data.customBars) {
                try {
                    await prisma.customBar.upsert({
                        where: { id: quest.id },
                        update: quest,
                        create: quest
                    })
                } catch (err) { }
            }
        }

        // 6. Restore Instances
        if (data.instances) {
            console.log('   - Restoring Instances...')
            for (const instance of data.instances) {
                try {
                    await prisma.instance.upsert({
                        where: { id: instance.id },
                        update: instance,
                        create: instance
                    })
                } catch (err) { }
            }
        }

        console.log('✅ Restoration complete!')

    } catch (error) {
        console.error('❌ Restoration failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

restore()

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups')
    const backupPath = path.join(backupDir, `snapshot_${timestamp}.json`)

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir)
    }

    console.log('📦 Starting Manual Backup...')

    try {
        const [players, accounts, customBars, nations, playbooks, instances, invites] = await Promise.all([
            prisma.player.findMany(),
            prisma.account.findMany(),
            prisma.customBar.findMany(),
            prisma.nation.findMany(),
            prisma.playbook.findMany(),
            prisma.instance.findMany(),
            prisma.invite.findMany(),
        ])

        const data = {
            timestamp: new Date().toISOString(),
            players,
            accounts,
            customBars,
            nations,
            playbooks,
            instances,
            invites,
        }

        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2))

        console.log(`✅ Backup saved to: ${backupPath}`)
        console.log(`📊 Statistics:`)
        console.log(`   - Players: ${players.length}`)
        console.log(`   - Accounts: ${accounts.length}`)
        console.log(`   - Quests: ${customBars.length}`)
        console.log(`   - Nations: ${nations.length}`)
        console.log(`   - Playbooks: ${playbooks.length}`)
        console.log(`   - Instances: ${instances.length}`)

    } catch (error) {
        console.error('❌ Backup failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

backup()

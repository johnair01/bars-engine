import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function snapshot() {
  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outPath = path.join(backupDir, `prod_snapshot_${timestamp}.json`)

  console.log('📦 Snapshotting production data...')

  // Count everything first
  const counts: Record<string, number> = {
    invite: await prisma.invite.count(),
    player: await prisma.player.count(),
    role: await prisma.role.count(),
    account: await prisma.account.count(),
    playerRole: await prisma.playerRole.count(),
    bar: await prisma.bar.count(),
    customBar: await prisma.customBar.count(),
    shadow321Session: await prisma.shadow321Session.count(),
    questProposal: await prisma.questProposal.count(),
    playerBar: await prisma.playerBar.count(),
    barShare: await prisma.barShare.count(),
    barResponse: await prisma.barResponse.count(),
    quest: await prisma.quest.count(),
    playerQuest: await prisma.playerQuest.count(),
    book: await prisma.book.count(),
    bookAnalysisResumeLog: await prisma.bookAnalysisResumeLog.count(),
    verificationCompletionLog: await prisma.verificationCompletionLog.count(),
    questThread: await prisma.questThread.count(),
    threadQuest: await prisma.threadQuest.count(),
    threadProgress: await prisma.threadProgress.count(),
    questPack: await prisma.questPack.count(),
    packQuest: await prisma.packQuest.count(),
    packProgress: await prisma.packProgress.count(),
    vibulonEvent: await prisma.vibulonEvent.count(),
    vibulon: await prisma.vibulon.count(),
    nation: await prisma.nation.count(),
    polarity: await prisma.polarity.count(),
    nationMove: await prisma.nationMove.count(),
    playerNationMoveUnlock: await prisma.playerNationMoveUnlock.count(),
    playerMoveEquip: await prisma.playerMoveEquip.count(),
    moveUse: await prisma.moveUse.count(),
    questMoveLog: await prisma.questMoveLog.count(),
    archetype: await prisma.archetype.count(),
    emotionalFirstAidTool: await prisma.emotionalFirstAidTool.count(),
    emotionalFirstAidSession: await prisma.emotionalFirstAidSession.count(),
    starterPack: await prisma.starterPack.count(),
    auditLog: await prisma.auditLog.count(),
    globalState: await prisma.globalState.count(),
    storyTick: await prisma.storyTick.count(),
    twineStory: await prisma.twineStory.count(),
    compiledTweeVersion: await prisma.compiledTweeVersion.count(),
    twineRun: await prisma.twineRun.count(),
    twineBinding: await prisma.twineBinding.count(),
    instance: await prisma.instance.count(),
    barDeck: await prisma.barDeck.count(),
    barDeckCard: await prisma.barDeckCard.count(),
    barBinding: await prisma.barBinding.count(),
    actorDeckState: await prisma.actorDeckState.count(),
    campaignInvitation: await prisma.campaignInvitation.count(),
    campaignPlaybook: await prisma.campaignPlaybook.count(),
    eventCampaign: await prisma.eventCampaign.count(),
    eventArtifact: await prisma.eventArtifact.count(),
    eventParticipant: await prisma.eventParticipant.count(),
    eventInvite: await prisma.eventInvite.count(),
    gameboardSlot: await prisma.gameboardSlot.count(),
    gameboardBid: await prisma.gameboardBid.count(),
    gameboardAidOffer: await prisma.gameboardAidOffer.count(),
    bountyStake: await prisma.bountyStake.count(),
    redemptionPack: await prisma.redemptionPack.count(),
    donation: await prisma.donation.count(),
    instanceMembership: await prisma.instanceMembership.count(),
    appConfig: await prisma.appConfig.count(),
    adminAuditLog: await prisma.adminAuditLog.count(),
    microTwineModule: await prisma.microTwineModule.count(),
    vibeulonLedger: await prisma.vibeulonLedger.count(),
    instanceParticipation: await prisma.instanceParticipation.count(),
    adventure: await prisma.adventure.count(),
    passage: await prisma.passage.count(),
    playerAdventureProgress: await prisma.playerAdventureProgress.count(),
    libraryRequest: await prisma.libraryRequest.count(),
    docNode: await prisma.docNode.count(),
    docEvidenceLink: await prisma.docEvidenceLink.count(),
    backlogItem: await prisma.backlogItem.count(),
    schism: await prisma.schism.count(),
    specKitBacklogItem: await prisma.specKitBacklogItem.count(),
    aiResponseCache: await prisma.aiResponseCache.count(),
  }

  const populated = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  console.log('\n📊 Tables with data:')
  populated.forEach(([k, v]) => console.log(`   ${k}: ${v}`))

  // Now fetch all populated tables
  const data: Record<string, unknown[]> = {}

  for (const [table] of populated) {
    console.log(`   Fetching ${table}...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data[table] = await (prisma as any)[table].findMany()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('does not exist in the current database')) {
        console.log(`   ⚠️  Schema mismatch on ${table}, using raw query...`)
        const tableName = table.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
        // Convert camelCase to snake_case with plural
        const snakeTable = tableName.endsWith('s') ? tableName : tableName + 's'
        try {
          data[table] = await prisma.$queryRawUnsafe(`SELECT * FROM "${snakeTable}"`)
        } catch {
          // Try common table name patterns
          const patterns = [snakeTable, tableName, `${tableName}_log`, `${snakeTable}_log`]
          let found = false
          for (const p of patterns) {
            try {
              data[table] = await prisma.$queryRawUnsafe(`SELECT * FROM "${p}"`)
              found = true
              break
            } catch { /* try next */ }
          }
          if (!found) {
            console.log(`   ❌ Could not fetch ${table}, skipping`)
            data[table] = []
          }
        }
      } else {
        console.log(`   ❌ Error on ${table}: ${msg.slice(0, 100)}`)
        data[table] = []
      }
    }
  }

  const snapshot = {
    timestamp: new Date().toISOString(),
    source: 'production',
    counts: Object.fromEntries(populated),
    data,
  }

  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2))
  console.log(`\n✅ Snapshot saved: ${outPath}`)
  console.log(`   Total records: ${populated.reduce((sum, [, c]) => sum + c, 0)}`)

  await prisma.$disconnect()
}

snapshot().catch(e => { console.error('❌', e); process.exit(1) })

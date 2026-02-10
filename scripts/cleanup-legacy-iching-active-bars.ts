import { db } from '../src/lib/db'
import { cleanupLegacyIChingStarterPackState } from '../src/lib/iching-hardening'

async function main() {
    const result = await cleanupLegacyIChingStarterPackState(db)
    console.log(
        `Done. Scanned ${result.packsScanned} packs, updated ${result.packsUpdated}, removed ${result.entriesRemoved} legacy iching activeBars entries, invalid JSON packs: ${result.invalidJsonPacks}.`
    )
}

main()
    .catch((error) => {
        console.error('Failed to clean legacy I Ching active bars:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })

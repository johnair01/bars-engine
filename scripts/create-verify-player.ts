import { db } from '../src/lib/db'

async function createVerificationPlayer() {
    console.log('=== CREATING VERIFICATION PLAYER ===')

    // Find an invite
    const invite = await db.invite.findFirst()
    if (!invite) {
        console.error('No invitation tokens found in DB.')
        process.exit(1)
    }

    const testPlayer = await db.player.upsert({
        where: {
            contactType_contactValue: {
                contactType: 'email',
                contactValue: 'verify@test.auto'
            }
        },
        update: {
            nationId: null,      // Reset for testing
            playbookId: null,    // Reset for testing
            onboardingComplete: false
        },
        create: {
            name: 'Verify Test',
            contactType: 'email',
            contactValue: 'verify@test.auto',
            inviteId: invite.id,
            onboardingComplete: false
        }
    })

    console.log(`Verification player created: ${testPlayer.id}`)
    console.log('Login with email: verify@test.auto')
}

createVerificationPlayer()
    .catch(console.error)
    .finally(() => db.$disconnect())

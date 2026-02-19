import { db } from '../src/lib/db'

async function main() {
    try {
        console.log('--- DB Access Test ---')
        const storyCount = await db.twineStory.count()
        console.log(`TwineStory count: ${storyCount}`)
        const runCount = await db.twineRun.count()
        console.log(`TwineRun count: ${runCount}`)
        const bindingCount = await db.twineBinding.count()
        console.log(`TwineBinding count: ${bindingCount}`)
        console.log('--- SUCCESS ---')
    } catch (e: any) {
        console.error('--- FAILURE ---')
        console.error(e.message)
    }
}

main()

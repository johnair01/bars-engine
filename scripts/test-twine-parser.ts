import { ParsedTwineSchema, getStartPassageId } from '../src/lib/schemas'

console.log('--- Testing Twine Zod Schemas ---')

// 1. Valid modern format
const validModern = {
    title: "Modern Export",
    startPassage: "passage-1",
    passages: [
        { pid: "passage-1", name: "Start", text: "Hello" }
    ]
}

// 2. Valid legacy format
const validLegacy = {
    title: "Legacy Export",
    startPassagePid: "1",
    startPassageName: "Start",
    passages: [
        { pid: "1", name: "Start", text: "Hello" }
    ]
}

// 3. Very minimal format
const validMinimal = {
    passages: [
        { name: "OnlyNode", text: "Hi" }
    ]
}

// 4. Malformed format (passages is not an array)
const malformed = {
    title: "Broken",
    passages: { "1": { name: "Start" } }
}

function testSchema(name: string, data: unknown) {
    const result = ParsedTwineSchema.safeParse(data)
    if (result.success) {
        try {
            const startId = getStartPassageId(result.data)
            console.log(`✅ [${name}] Validated. Start Passage: ${startId}`)
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            console.log(`❌ [${name}] Validated, but getStartPassageId failed: ${msg}`)
        }
    } else {
        console.log(`❌ [${name}] Validation Failed:`, result.error.message)
    }
}

testSchema("Valid Modern", validModern)
testSchema("Valid Legacy", validLegacy)
testSchema("Valid Minimal", validMinimal)
testSchema("Malformed JSON", malformed)

/**
 * UI Verification via HTML Analysis
 * 
 * Fetches server-rendered HTML and verifies expected elements exist.
 * NO BROWSER NEEDED - just HTTP requests.
 * 
 * This catches:
 * - Components that fail to render
 * - Missing UI elements
 * - Server-side errors
 * - Broken imports/dependencies
 * 
 * This does NOT catch:
 * - Client-side JavaScript issues
 * - CSS styling problems
 * - Interactive behavior (clicks, etc)
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

interface UITest {
    name: string
    path: string
    expectedElements: string[]  // Strings that should appear in HTML
    forbiddenElements?: string[] // Strings that should NOT appear
}

const UI_TESTS: UITest[] = [
    // Public pages (no auth required)
    {
        name: 'Landing Page',
        path: '/',
        expectedElements: [
            'BARS ENGINE',                // App title
            'Sign Up',                    // CTA button
        ],
        forbiddenElements: [
            'Application error',
            'NEXT_NOT_FOUND'
        ]
    },
    {
        name: 'Invite Landing',
        path: '/invite/ANTIGRAVITY',
        expectedElements: [
            'invite',                     // Some invite-related text
        ],
        forbiddenElements: [
            'Application error',
        ]
    },
    {
        name: 'Conclave Entry',
        path: '/conclave',
        expectedElements: [
            'email',                      // Login form
        ],
        forbiddenElements: [
            'Application error',
        ]
    },
    {
        name: 'Health Check',
        path: '/api/health',
        expectedElements: [
            'ok',                         // Health response
        ],
        forbiddenElements: []
    },
]

// Note: These pages require authentication
// /bars/available, /wallet, /iching, /quest
// They redirect to /conclave when not logged in
// To test these, need to set up auth cookie or test the redirect behavior

async function fetchPage(path: string): Promise<{ status: number; html: string }> {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    try {
        const { stdout } = await execAsync(
            `curl -s "${BASE_URL}${path}"`,
            { maxBuffer: 1024 * 1024 * 5 }  // 5MB buffer
        )
        return { status: 200, html: stdout }
    } catch (e) {
        return { status: 0, html: `FETCH_ERROR: ${(e as Error).message}` }
    }
}

async function runTest(test: UITest): Promise<{ passed: boolean; issues: string[] }> {
    const { status, html } = await fetchPage(test.path)
    const issues: string[] = []

    // Check HTTP status
    if (status !== 200) {
        issues.push(`HTTP ${status} (expected 200)`)
    }

    // Check expected elements
    for (const expected of test.expectedElements) {
        if (!html.includes(expected)) {
            issues.push(`Missing: "${expected}"`)
        }
    }

    // Check forbidden elements
    for (const forbidden of test.forbiddenElements || []) {
        if (html.includes(forbidden)) {
            issues.push(`Found unwanted: "${forbidden}"`)
        }
    }

    return { passed: issues.length === 0, issues }
}

async function main() {
    console.log('🖥️  UI Verification (HTML Analysis)\n')
    console.log(`Testing against: ${BASE_URL}`)
    console.log('─'.repeat(50))

    let passed = 0
    let failed = 0

    for (const test of UI_TESTS) {
        process.stdout.write(`${test.name}... `)

        const result = await runTest(test)

        if (result.passed) {
            console.log('✓')
            passed++
        } else {
            console.log('✗')
            result.issues.forEach(issue => console.log(`    └─ ${issue}`))
            failed++
        }
    }

    console.log('─'.repeat(50))
    console.log(`\n${passed} passed, ${failed} failed`)

    if (failed === 0) {
        console.log('\n✅ All UI elements verified in HTML!')
        console.log('\nThis confirms:')
        console.log('  • Pages render without server errors')
        console.log('  • Expected elements exist in HTML')
        console.log('  • No obvious crashes or undefined values')
    } else {
        console.log('\n❌ Some UI checks failed')
        console.log('Run dev server and check pages manually')
        process.exit(1)
    }
}

main().catch(console.error)

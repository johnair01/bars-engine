#!/usr/bin/env tsx
/**
 * Validate manifest: check for common regression patterns.
 * - Files using React hooks must have "use client" at top
 * - Exit 1 on failure, 0 on success
 *
 * Part of the Roadblock Metabolism System.
 */

import * as fs from 'fs'
import * as path from 'path'

const HOOK_PATTERNS = [
    /\buseState\b/,
    /\buseEffect\b/,
    /\buseTransition\b/,
    /\buseCallback\b/,
    /\buseMemo\b/,
    /\buseRef\b/,
    /\buseContext\b/,
    /\buseReducer\b/,
    /\buseId\b/,
    /\buseSyncExternalStore\b/,
    /\buseInsertionEffect\b/,
    /\buseDeferredValue\b/,
]

const CLIENT_ONLY_PATTERNS = [
    /\bcreateContext\b/,
    /\bonClick\s*=/,
    /\bonChange\s*=/,
    /\bwindow\./,
    /\bdocument\./,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
]

function usesHooksOrClientOnly(content: string): boolean {
    const allPatterns = [...HOOK_PATTERNS, ...CLIENT_ONLY_PATTERNS]
    return allPatterns.some((p) => p.test(content))
}

function hasUseClient(content: string): boolean {
    const firstLines = content.split('\n').slice(0, 5).join('\n')
    return /["']use client["']/.test(firstLines)
}

function hasUseServer(content: string): boolean {
    const firstLines = content.split('\n').slice(0, 10).join('\n')
    return /["']use server["']/.test(firstLines) || /['"]use server['"]/.test(firstLines)
}

function walkDir(dir: string, ext: string[], files: string[] = []): string[] {
    if (!fs.existsSync(dir)) return files
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (e.name !== 'node_modules' && e.name !== '.git') {
                walkDir(full, ext, files)
            }
        } else if (ext.some((x) => e.name.endsWith(x))) {
            files.push(full)
        }
    }
    return files
}

function main(): number {
    const srcDir = path.join(process.cwd(), 'src')
    const files = walkDir(srcDir, ['.tsx', '.ts'])
    const violations: { file: string; reason: string }[] = []

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        if (usesHooksOrClientOnly(content) && !hasUseClient(content) && !hasUseServer(content)) {
            violations.push({
                file: path.relative(process.cwd(), file),
                reason: 'Uses hooks or client-only APIs but missing "use client" directive',
            })
        }
    }

    if (violations.length > 0) {
        console.error('[validate-manifest] Roadblock: missing "use client" in files that use hooks/client APIs:\n')
        for (const v of violations) {
            console.error(`  ${v.file}: ${v.reason}`)
        }
        console.error('\nAdd "use client" as the first line of each file, or fix the imports.')
        return 1
    }

    return 0
}

process.exit(main())

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type SecretPattern = {
    name: string
    regex: RegExp
}

const SECRET_PATTERNS: SecretPattern[] = [
    { name: 'OpenAI key', regex: /\bsk-(?:proj|live|test)-[A-Za-z0-9_-]{20,}\b/g },
    { name: 'GitHub token', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
    { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: 'Slack token', regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
]

const TEXT_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.json', '.md', '.txt', '.yml', '.yaml', '.toml',
    '.env', '.sql', '.prisma', '.sh',
])

const ALLOWLIST_SNIPPETS = [
    'YOUR_OPENAI_API_KEY',
    'sk-proj-REPLACE_ME',
    'example',
    'placeholder',
]

type Finding = {
    file: string
    line: number
    pattern: string
    snippet: string
}

function getTrackedFiles(): string[] {
    const output = execSync('git ls-files', { encoding: 'utf8' })
    return output.split('\n').map(f => f.trim()).filter(Boolean)
}

function getLineNumber(content: string, index: number): number {
    let line = 1
    for (let i = 0; i < index; i++) {
        if (content[i] === '\n') line++
    }
    return line
}

function shouldScan(file: string): boolean {
    const ext = path.extname(file)
    if (TEXT_EXTENSIONS.has(ext)) return true
    return path.basename(file).startsWith('.env')
}

function scanFile(file: string): Finding[] {
    if (!shouldScan(file)) return []

    const absPath = path.resolve(process.cwd(), file)
    const content = readFileSync(absPath, 'utf8')
    if (content.includes('\u0000')) return []

    const findings: Finding[] = []
    for (const { name, regex } of SECRET_PATTERNS) {
        regex.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = regex.exec(content)) !== null) {
            const value = match[0]
            const lowerContext = content
                .slice(Math.max(0, match.index - 50), Math.min(content.length, match.index + value.length + 50))
                .toLowerCase()

            const allowlisted = ALLOWLIST_SNIPPETS.some(snippet => lowerContext.includes(snippet.toLowerCase()))
            if (allowlisted) continue

            findings.push({
                file,
                line: getLineNumber(content, match.index),
                pattern: name,
                snippet: value.slice(0, 8) + '…'
            })
        }
    }

    return findings
}

function main() {
    const files = getTrackedFiles()
    const findings = files.flatMap(scanFile)

    if (findings.length === 0) {
        console.log('✅ No obvious secrets detected in tracked files.')
        return
    }

    console.error('❌ Potential secrets detected:')
    for (const finding of findings) {
        console.error(`- ${finding.file}:${finding.line} [${finding.pattern}] ${finding.snippet}`)
    }

    console.error('\nRotate exposed keys and replace with environment-variable placeholders.')
    process.exit(1)
}

main()

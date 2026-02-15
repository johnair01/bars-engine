#!/usr/bin/env npx tsx
import { execSync } from 'child_process'

type Deployment = {
    id: number
    environment?: string
    created_at?: string
}

type DeploymentStatus = {
    state?: string
    environment_url?: string
    created_at?: string
}

function run(command: string) {
    return execSync(command, {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd(),
        env: process.env,
    }).toString().trim()
}

function parseRepoSlug(remoteUrl: string) {
    const sanitized = remoteUrl.replace(/\.git$/, '')

    if (sanitized.startsWith('git@github.com:')) {
        return sanitized.replace('git@github.com:', '')
    }

    try {
        const url = new URL(sanitized)
        if (url.hostname !== 'github.com') return null
        return url.pathname.replace(/^\//, '')
    } catch {
        const match = sanitized.match(/github\.com[:/](.+\/.+)$/)
        return match ? match[1] : null
    }
}

function parseJson<T>(raw: string) {
    return JSON.parse(raw) as T
}

function pickDeployment(deployments: Deployment[]) {
    const previews = deployments.filter((deployment) => (deployment.environment || '').toLowerCase() === 'preview')
    if (previews.length === 0) return null
    return previews.sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime()
        const bTime = new Date(b.created_at || 0).getTime()
        return bTime - aTime
    })[0]
}

function pickStatus(statuses: DeploymentStatus[]) {
    const withUrl = statuses.filter((status) => !!status.environment_url)
    if (withUrl.length === 0) return null

    const successful = withUrl.find((status) => status.state === 'success')
    return successful || withUrl[0]
}

function main() {
    const branch = run('git branch --show-current')
    const sha = run('git rev-parse HEAD')
    const remote = run('git remote get-url origin')
    const repoSlug = parseRepoSlug(remote)

    if (!repoSlug) {
        throw new Error(`Unable to parse GitHub repo from origin URL: ${remote}`)
    }

    const deploymentsRaw = run(`gh api "repos/${repoSlug}/deployments?sha=${sha}"`)
    const deployments = parseJson<Deployment[]>(deploymentsRaw)
    const deployment = pickDeployment(deployments)

    if (!deployment) {
        throw new Error(`No Preview deployment found yet for ${branch} @ ${sha.slice(0, 7)}.`)
    }

    const statusesRaw = run(`gh api "repos/${repoSlug}/deployments/${deployment.id}/statuses"`)
    const statuses = parseJson<DeploymentStatus[]>(statusesRaw)
    const status = pickStatus(statuses)

    if (!status?.environment_url) {
        throw new Error(`Preview deployment found, but no environment URL is available yet (deployment id ${deployment.id}).`)
    }

    console.log('🔗 Branch preview link (open on mobile for manual verification):')
    console.log(status.environment_url)
    console.log('')
    console.log(`branch: ${branch}`)
    console.log(`commit: ${sha}`)
}

try {
    main()
} catch (error) {
    console.error('❌ Failed to resolve preview link.')
    console.error((error as Error).message)
    process.exit(1)
}

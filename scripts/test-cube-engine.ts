#!/usr/bin/env npx tsx
import {
    assignCubeGeometry,
    createSeededRng,
    formatCubeGeometry,
    VisibilityAxis,
    RevelationAxis,
    DirectionAxis,
    type CubeBias,
} from '@/lib/cube-engine'

function assert(condition: unknown, message: string) {
    if (!condition) {
        throw new Error(message)
    }
}

function testDeterministicSeed() {
    const a = assignCubeGeometry({ hexagramId: 20, seed: 'fixed-seed' })
    const b = assignCubeGeometry({ hexagramId: 20, seed: 'fixed-seed' })
    assert(JSON.stringify(a) === JSON.stringify(b), 'Fixed seed should produce deterministic geometry')
}

function testUniformSanity() {
    const counts: Record<string, number> = {}
    const rng = createSeededRng('uniform-sanity')
    const trials = 8000

    for (let i = 0; i < trials; i += 1) {
        const geometry = assignCubeGeometry({ hexagramId: (i % 64) + 1, rng })
        counts[geometry.state] = (counts[geometry.state] || 0) + 1
    }

    const expected = trials / 8
    const tolerance = expected * 0.3
    Object.entries(counts).forEach(([state, count]) => {
        assert(
            Math.abs(count - expected) <= tolerance,
            `Uniform sanity check failed for ${state}: got ${count}, expected ~${expected}`
        )
    })
}

function testBiasInfluence() {
    const strongSeekBias: CubeBias = {
        visibility: {
            [VisibilityAxis.HIDE]: 0.1,
            [VisibilityAxis.SEEK]: 10,
        },
        revelation: {
            [RevelationAxis.TRUTH]: 10,
            [RevelationAxis.DARE]: 0.1,
        },
        direction: {
            [DirectionAxis.INTERIOR]: 0.1,
            [DirectionAxis.EXTERIOR]: 10,
        }
    }

    const rng = createSeededRng('bias-influence')
    let seek = 0
    let hide = 0
    let truth = 0
    let dare = 0
    let interior = 0
    let exterior = 0

    for (let i = 0; i < 3000; i += 1) {
        const geometry = assignCubeGeometry({
            hexagramId: (i % 64) + 1,
            bias: strongSeekBias,
            rng,
        })
        if (geometry.visibility === VisibilityAxis.SEEK) seek += 1
        else hide += 1

        if (geometry.revelation === RevelationAxis.TRUTH) truth += 1
        else dare += 1

        if (geometry.direction === DirectionAxis.EXTERIOR) exterior += 1
        else interior += 1
    }

    assert(seek > hide * 3, `Expected SEEK to dominate under bias (seek=${seek}, hide=${hide})`)
    assert(truth > dare * 3, `Expected TRUTH to dominate under bias (truth=${truth}, dare=${dare})`)
    assert(exterior > interior * 3, `Expected EXTERIOR to dominate under bias (exterior=${exterior}, interior=${interior})`)
}

function testStringify() {
    const geometry = assignCubeGeometry({ hexagramId: 15, seed: 'stringify' })
    const label = formatCubeGeometry(geometry)
    assert(label.includes(' + '), 'Cube geometry string format should include axis separators')
}

function main() {
    testDeterministicSeed()
    testUniformSanity()
    testBiasInfluence()
    testStringify()
    console.log('✅ Cube Engine tests passed')
}

main()

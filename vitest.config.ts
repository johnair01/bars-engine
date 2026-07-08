import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Vitest-only suites (alchemy-engine + TSG action mocks). Sibling *.test.ts files use `tsx` + node:assert.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/actions/__tests__/campaign-attach.test.ts',
      'src/actions/__tests__/campaign-milestone-authoring.test.ts',
      'src/lib/alchemy-engine/__tests__/ai-generation.test.ts',
      'src/lib/alchemy-engine/__tests__/arc-flow-wiring.test.ts',
      'src/lib/alchemy-engine/__tests__/e2e-arc-dissatisfied-to-epiphany.test.ts',
      'src/lib/alchemy-engine/__tests__/passage-resolver.test.ts',
      'src/lib/alchemy-engine/__tests__/reflection-bar-persistence-wiring.test.ts',
      'src/lib/technique-library/__tests__/vocabulary-no-drift.test.ts',
      'src/lib/technique-library/__tests__/resolve.test.ts',
      'src/lib/technique-library/__tests__/validate.test.ts',
      'src/lib/technique-library/__tests__/superpower-decks.test.ts',
      'src/lib/technique-library/__tests__/quality.test.ts',
      'src/lib/technique-library/__tests__/superpower-quality.test.ts',
      'src/lib/technique-library/__tests__/go-deeper.test.ts',
      'src/lib/emotional-alchemy/__tests__/registry.test.ts',
      'src/lib/emotional-alchemy/__tests__/vector.test.ts',
      'src/lib/emotional-alchemy/__tests__/composer.test.ts',
      'src/lib/emotional-alchemy/__tests__/deck-draw.test.ts',
      'src/lib/emotional-alchemy/__tests__/crisis-resources.test.ts',
      'src/lib/emotional-alchemy/__tests__/service.test.ts',
      'src/lib/player-entitlements/__tests__/superpower-skus.test.ts',
      'src/lib/superpowers/__tests__/quiz-loadout.test.ts',
      'src/lib/launch/__tests__/superpower-offers.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

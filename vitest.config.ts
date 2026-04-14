import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Vitest-only suites under alchemy-engine. Sibling *.test.ts files use `tsx` + node:assert.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/alchemy-engine/__tests__/ai-generation.test.ts',
      'src/lib/alchemy-engine/__tests__/arc-flow-wiring.test.ts',
      'src/lib/alchemy-engine/__tests__/e2e-arc-dissatisfied-to-epiphany.test.ts',
      'src/lib/alchemy-engine/__tests__/passage-resolver.test.ts',
      'src/lib/alchemy-engine/__tests__/reflection-bar-persistence-wiring.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

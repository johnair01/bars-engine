import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Vitest-only suites; most repo tests still run via `tsx` per package.json.
 * Exclude tsx-script style files in the same dirs (no describe/it) so `vitest run` does not fail.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/__tests__/npc-face-resolver.test.ts',
      'src/lib/cyoa-composer/__tests__/merge-overrides.test.ts',
      'src/lib/cyoa-composer/__tests__/step-registry.test.ts',
      'src/lib/alchemy-engine/__tests__/**/*.test.ts',
    ],
    exclude: [
      'src/lib/alchemy-engine/__tests__/action-phase-validation.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

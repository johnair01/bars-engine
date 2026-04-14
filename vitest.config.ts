import path from 'node:path'
import { defineConfig } from 'vitest/config'

/** Vitest-only suites; most repo tests still run via `tsx` per package.json. */
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/__tests__/npc-face-resolver.test.ts',
      'src/lib/cyoa-composer/__tests__/merge-overrides.test.ts',
      'src/lib/cyoa-composer/__tests__/step-registry.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

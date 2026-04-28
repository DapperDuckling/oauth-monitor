import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/common',
      'packages/frontend/client',
      'packages/frontend/react',
      'packages/frontend/svelte',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'packages/common/src/**',
        'packages/frontend/client/src/**',
        'packages/frontend/react/src/**',
        'packages/frontend/svelte/src/lib/**',
      ],
      exclude: [
        '**/dist/**',
        '**/*.d.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});

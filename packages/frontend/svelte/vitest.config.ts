import { defineProject } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineProject({
  plugins: [svelte({ hot: !process.env['VITEST'] })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    name: 'svelte',
    environment: 'jsdom',
    include: ['__tests__/**/*.test.{ts,svelte.ts}'],
    setupFiles: ['./test/setup.ts'],
  },
});

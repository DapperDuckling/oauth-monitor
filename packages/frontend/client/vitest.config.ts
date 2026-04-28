import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'client',
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});

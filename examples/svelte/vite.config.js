import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

const libPath = path.resolve(__dirname, '../src/lib');

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3000,
    watch: {
      // Watch for changes in the library's source directory
      include: [`${libPath}/**`]
    },
    fs: {
      // Allow serving files from the library's source directory
      allow: [libPath]
    }
  },
  // Ensure that Vite can resolve the linked package
  resolve: {
    alias: {
      '@dapperduckling/oauth-monitor-svelte': libPath
    }
  },
  // Prevent Vite from pre-bundling the local package
  optimizeDeps: {
    exclude: ['@dapperduckling/oauth-monitor-svelte']
  }
});

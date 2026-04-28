import { vi } from 'vitest';

/**
 * Returns a freshly-imported OauthMonitorClient module, bypassing the singleton
 * cache held in the static `omcClient` field. Use in `beforeEach` to ensure each
 * test gets a clean class.
 */
export async function freshClientModule() {
  vi.resetModules();
  return await import('../../src/oauth-monitor-client.js');
}

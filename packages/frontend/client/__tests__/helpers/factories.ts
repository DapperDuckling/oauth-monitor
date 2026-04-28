import type { ClientConfig } from '../../src/types.js';
import type { UserStatusWrapped } from '@dapperduckling/oauth-monitor-common';

export const baseConfig = (overrides: Partial<ClientConfig> = {}): ClientConfig => ({
  apiServerOrigin: 'http://api.example.test',
  ...overrides,
});

export const wrappedStatus = (
  overrides: Partial<UserStatusWrapped['payload']> = {},
  meta: Partial<Pick<UserStatusWrapped, 'checksum' | 'timestamp'>> = {},
): UserStatusWrapped => ({
  checksum: meta.checksum ?? 'cs-1',
  timestamp: meta.timestamp ?? 1000,
  payload: {
    loggedIn: true,
    accessExpires: Math.floor(Date.now() / 1000) + 3600,
    refreshExpires: Math.floor(Date.now() / 1000) + 7200,
    ...overrides,
  },
});

export const fetchOk = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

export const fetchStatus = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

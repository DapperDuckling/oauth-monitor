import { vi } from 'vitest';
import { writable, type Writable } from 'svelte/store';
import type { OauthMonitorState, OauthMonitorStore } from '../../src/lib/types.js';

export const initialState = (): OauthMonitorState => ({
  userStatus: { loggedIn: false, accessExpires: -1, refreshExpires: -1 },
  ui: {
    showLoginOverlay: true,
    showMustLoginOverlay: false,
    showLogoutOverlay: false,
    executingLogout: false,
    silentLoginInitiated: false,
    lengthyLogin: false,
    loginError: false,
    hasInvalidTokens: false,
  },
});

export const makeMockStore = (
  override: (s: OauthMonitorState) => void = () => {},
): OauthMonitorStore & { _writable: Writable<OauthMonitorState> } => {
  const start = initialState();
  override(start);
  const w = writable<OauthMonitorState>(start);
  return {
    subscribe: w.subscribe,
    dispatch: vi.fn(),
    reset: vi.fn(),
    _writable: w,
  };
};

export const makeMockClient = () => ({
  start: vi.fn(),
  destroy: vi.fn(),
  handleLogin: vi.fn(),
  handleLogout: vi.fn(),
  abortAuthCheck: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  isStarted: vi.fn(() => true),
});

export const ctxMap = (
  store = makeMockStore(),
  client = makeMockClient(),
) =>
  new Map<unknown, unknown>([
    ['oauth-monitor-store', store],
    ['oauth-monitor-client', client],
  ]);

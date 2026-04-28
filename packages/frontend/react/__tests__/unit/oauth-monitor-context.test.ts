import { describe, it, expect } from 'vitest';
import { InitialContext } from '../../src/oauth-monitor-context.js';

describe('InitialContext', () => {
  it('shape is stable', () => {
    expect(InitialContext).toEqual({
      userStatus: { loggedIn: false, accessExpires: -1, refreshExpires: -1 },
      ui: {
        lengthyLogin: false,
        showLoginOverlay: true,
        silentLoginInitiated: false,
        executingLogout: false,
        showMustLoginOverlay: false,
        showLogoutOverlay: false,
        loginError: false,
        hasInvalidTokens: false,
      },
    });
  });
});

import { describe, it, expect } from 'vitest';
import { RouteUrlDefaults } from '../../src/defaults.js';

describe('RouteUrlDefaults', () => {
  it('match documented defaults', () => {
    expect(RouteUrlDefaults).toEqual({
      _prefix: '/oauth-monitor',
      loginPage: '/login',
      logoutPage: '/logout',
      userStatus: '/user-status',
    });
  });
});

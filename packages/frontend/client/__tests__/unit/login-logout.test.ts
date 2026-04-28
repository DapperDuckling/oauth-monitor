import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig } from '../helpers/factories.js';
import { LocalStorage } from '../../src/types.js';

describe('OauthMonitorClient login/logout navigation', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;
  let originalHref: string;

  beforeEach(async () => {
    mod = await freshClientModule();
    originalHref = window.location.href;
    // jsdom by default disallows href set; emulate by replacing the window.location object.
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { ...window.location, href: originalHref },
    });
  });

  it('handleLogin() navigates to default login URL on the api origin', () => {
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ apiServerOrigin: 'http://api.test' }),
    );
    c.handleLogin();
    expect((window.location as { href: string }).href).toBe(
      'http://api.test/oauth-monitor/login',
    );
  });

  it('handleLogin(true) opens a new window and does NOT navigate', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ apiServerOrigin: 'http://api.test' }),
    );
    c.handleLogin(true);
    expect(openSpy).toHaveBeenCalledWith(
      'http://api.test/oauth-monitor/login',
      '_blank',
    );
    expect((window.location as { href: string }).href).toBe(originalHref);
  });

  it('handleLogin honors a custom routePaths override', () => {
    const c = mod.OauthMonitorClient.instance(
      baseConfig({
        apiServerOrigin: 'http://api.test',
        routePaths: { _prefix: '/auth', loginPage: '/sign-in' },
      }),
    );
    c.handleLogin();
    expect((window.location as { href: string }).href).toBe(
      'http://api.test/auth/sign-in',
    );
  });

  it('handleLogout() clears localStorage and navigates to logout URL', () => {
    localStorage.setItem(LocalStorage.USER_STATUS, '{"x":1}');
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ apiServerOrigin: 'http://api.test' }),
    );
    c.handleLogout();
    expect(localStorage.getItem(LocalStorage.USER_STATUS)).toBeNull();
    expect((window.location as { href: string }).href).toBe(
      'http://api.test/oauth-monitor/logout',
    );
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig, wrappedStatus } from '../helpers/factories.js';
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
    c.destroy();
  });

  describe('Popup auto-close flow', () => {
    it('notifies opener and closes popup window when logged in', async () => {
      const mockOpener = {
        postMessage: vi.fn(),
        closed: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).opener = mockOpener;
      const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

      const status = {
        checksum: 'pop123',
        timestamp: Date.now(),
        payload: {
          loggedIn: true,
          accessExpires: 999999,
          refreshExpires: 999999,
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(status), { status: 200 }),
      );

      const c = mod.OauthMonitorClient.instance(baseConfig());
      await c.authCheck(true);

      expect(mockOpener.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: 'pop123' }),
        window.location.origin,
      );
      expect(closeSpy).toHaveBeenCalled();

      c.destroy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).opener;
    });

    it('notifyOpenerAndClose static helper notifies opener and calls window.close()', () => {
      const mockOpener = {
        postMessage: vi.fn(),
        closed: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).opener = mockOpener;
      const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

      const status = {
        checksum: 'static123',
        timestamp: Date.now(),
        payload: {
          loggedIn: true,
          accessExpires: 999999,
          refreshExpires: 999999,
        },
      };

      mod.OauthMonitorClient.notifyOpenerAndClose(status);

      expect(mockOpener.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: 'static123' }),
        window.location.origin,
      );
      expect(closeSpy).toHaveBeenCalled();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).opener;
    });

    it('does not crash and ignores notification if opener is closed or is self', () => {
      const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

      // Case 1: opener is closed
      const mockClosedOpener = { postMessage: vi.fn(), closed: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).opener = mockClosedOpener;

      mod.OauthMonitorClient.notifyOpenerAndClose();
      expect(mockClosedOpener.postMessage).not.toHaveBeenCalled();

      // Case 2: opener is window itself
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).opener = window;
      mod.OauthMonitorClient.notifyOpenerAndClose();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).opener;
    });

    it('uses stored status from localStorage when no status argument passed to notifyOpenerAndClose', () => {
      const mockOpener = { postMessage: vi.fn(), closed: false };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).opener = mockOpener;
      vi.spyOn(window, 'close').mockImplementation(() => {});

      const stored = wrappedStatus(
        { loggedIn: true },
        { checksum: 'stored-cs' },
      );
      localStorage.setItem(LocalStorage.USER_STATUS, JSON.stringify(stored));

      mod.OauthMonitorClient.notifyOpenerAndClose();

      expect(mockOpener.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ checksum: 'stored-cs' }),
        window.location.origin,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).opener;
    });
  });
});

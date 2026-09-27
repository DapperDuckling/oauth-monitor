import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig, wrappedStatus, fetchOk, fetchStatus } from '../helpers/factories.js';
import { ClientEvent, LocalStorage } from '../../src/types.js';

describe('OauthMonitorClient.authCheck', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;

  beforeEach(async () => {
    mod = await freshClientModule();
  });

  it('200 + valid wrapped: dispatches START_AUTH_CHECK and END_AUTH_CHECK; stores status', async () => {
    const status = wrappedStatus({ loggedIn: true }, { checksum: 'ok', timestamp: 100 });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(fetchOk(status));
    const c = mod.OauthMonitorClient.instance(baseConfig());

    const start = vi.fn();
    const end = vi.fn();
    c.addEventListener(ClientEvent.START_AUTH_CHECK, start);
    c.addEventListener(ClientEvent.END_AUTH_CHECK, end);

    await c.authCheck(true);

    expect(fetchSpy).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
    expect(end).toHaveBeenCalledWith(
      ClientEvent.END_AUTH_CHECK,
      expect.objectContaining({ loggedIn: true }),
    );
    expect(localStorage.getItem(LocalStorage.USER_STATUS)).toContain('"checksum":"ok"');
    c.destroy();
  });

  it('401: dispatches INVALID_TOKENS without storing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchStatus(401));
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const invalid = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, invalid);

    await c.authCheck(true);
    expect(invalid).toHaveBeenCalled();
    expect(localStorage.getItem(LocalStorage.USER_STATUS)).toBeNull();
    c.destroy();
  });

  it('403: dispatches INVALID_TOKENS', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchStatus(403));
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const invalid = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, invalid);

    await c.authCheck(true);
    expect(invalid).toHaveBeenCalled();
    c.destroy();
  });

  it('500: dispatches INVALID_TOKENS', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchStatus(500));
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const invalid = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, invalid);

    await c.authCheck(true);
    expect(invalid).toHaveBeenCalled();
    c.destroy();
  });

  it('network throw: dispatches LOGIN_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('boom'));
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const err = vi.fn();
    c.addEventListener(ClientEvent.LOGIN_ERROR, err);

    await c.authCheck(true);
    expect(err).toHaveBeenCalled();
    c.destroy();
  });

  it('AbortError: caught, dispatches LOGIN_ERROR (no escape)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new DOMException('aborted', 'AbortError'),
    );
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const err = vi.fn();
    c.addEventListener(ClientEvent.LOGIN_ERROR, err);

    await expect(c.authCheck(true)).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
    c.destroy();
  });

  it('typia rejection (malformed body): dispatches LOGIN_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchOk({ totally: 'wrong' }));
    const typia = await import('typia');
    vi.mocked(typia.is).mockReturnValueOnce(false);
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const err = vi.fn();
    c.addEventListener(ClientEvent.LOGIN_ERROR, err);

    await c.authCheck(true);
    expect(err).toHaveBeenCalled();
    c.destroy();
  });

  it('concurrent calls: second authCheck while first in-flight does not refetch', async () => {
    let resolveFn: (r: Response) => void;
    const pending = new Promise<Response>((res) => {
      resolveFn = res;
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(pending);
    const c = mod.OauthMonitorClient.instance(baseConfig());

    const first = c.authCheck(true);
    const second = c.authCheck(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    resolveFn!(fetchStatus(401));
    await Promise.all([first, second]);
    c.destroy();
  });

  it('fetch is called with the configured URL and credentials', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(fetchStatus(401));
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ apiServerOrigin: 'http://api.test', routePaths: { userStatus: '/me' } }),
    );

    await c.authCheck(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://api.test/oauth-monitor/me',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          credentials: 'include',
        }),
        signal: expect.any(AbortSignal),
      }),
    );
    c.destroy();
  });

  it('after successful authCheck, authCheckAbort is cleared (next call refetches)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(fetchStatus(401));
    const c = mod.OauthMonitorClient.instance(baseConfig());

    await c.authCheck(true);
    await c.authCheck(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    c.destroy();
  });

  describe('Userinfo response normalization & CAC claims', () => {
    it('normalizes raw oauth2-proxy /oauth2/userinfo response into UserStatusWrapped with profile', async () => {
      const rawUserinfo = {
        user: 'jean-luc',
        email: 'jean-luc@example.mil',
        preferredUsername: 'jean-luc',
        branchOfServiceCode: 'A',
        rankCode: 'CTR',
        dutyOrgCode: 'USA',
        company: 'Defense Systems',
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchOk(rawUserinfo));
      const c = mod.OauthMonitorClient.instance(
        baseConfig({ userinfoMode: true }),
      );

      const endSpy = vi.fn();
      c.addEventListener(ClientEvent.END_AUTH_CHECK, endSpy);

      await c.authCheck(true);

      expect(endSpy).toHaveBeenCalledWith(
        ClientEvent.END_AUTH_CHECK,
        expect.objectContaining({
          loggedIn: true,
          profile: expect.objectContaining({
            email: 'jean-luc@example.mil',
            branchOfServiceCode: 'A',
            rankCode: 'CTR',
            dutyOrgCode: 'USA',
          }),
        }),
      );

      const stored = JSON.parse(localStorage.getItem(LocalStorage.USER_STATUS)!);
      expect(stored.payload.profile.branchOfServiceCode).toBe('A');
      expect(stored.payload.profile.rankCode).toBe('CTR');
      c.destroy();
    });

    it('constructs displayName from given_name and family_name when displayName/name are absent', async () => {
      const rawUserinfo = {
        sub: 'cac-id-9988',
        given_name: 'Chester',
        family_name: 'Nimitz',
        email: 'nimitz.c@navy.mil',
        branchOfServiceCode: 'N',
        rankCode: 'ADM',
        dutyOrgCode: 'USN',
        customAttribute: 'FleetCommander',
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchOk(rawUserinfo));
      const c = mod.OauthMonitorClient.instance(
        baseConfig({ userinfoMode: true }),
      );

      const endSpy = vi.fn();
      c.addEventListener(ClientEvent.END_AUTH_CHECK, endSpy);

      await c.authCheck(true);

      expect(endSpy).toHaveBeenCalledWith(
        ClientEvent.END_AUTH_CHECK,
        expect.objectContaining({
          loggedIn: true,
          profile: expect.objectContaining({
            displayName: 'Chester Nimitz',
            name: 'Chester Nimitz',
            branchOfServiceCode: 'N',
            rankCode: 'ADM',
            claims: expect.objectContaining({
              customAttribute: 'FleetCommander',
            }),
          }),
        }),
      );
      c.destroy();
    });

    it('handles 401 Unauthorized in userinfo mode as INVALID_TOKENS', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
      );
      const c = mod.OauthMonitorClient.instance(
        baseConfig({ userinfoMode: true }),
      );

      const invalidSpy = vi.fn();
      c.addEventListener(ClientEvent.INVALID_TOKENS, invalidSpy);

      await c.authCheck(true);

      expect(invalidSpy).toHaveBeenCalledWith(ClientEvent.INVALID_TOKENS, undefined);
      c.destroy();
    });

    it('handles network error in userinfo mode and dispatches LOGIN_ERROR without escaping', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'));
      const c = mod.OauthMonitorClient.instance(
        baseConfig({ userinfoMode: true }),
      );

      const errSpy = vi.fn();
      c.addEventListener(ClientEvent.LOGIN_ERROR, errSpy);

      await expect(c.authCheck(true)).resolves.toBeUndefined();
      expect(errSpy).toHaveBeenCalledWith(ClientEvent.LOGIN_ERROR, undefined);
      c.destroy();
    });
  });

  describe('Standing Heartbeat Leader via Web Locks', () => {
    it('requests omc_heartbeat_leader lock and executes periodic authCheck when logged in', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(fetchOk(wrappedStatus({ loggedIn: true })));

      let lockCallback: (() => Promise<void>) | null = null;
      const requestMock = vi.fn().mockImplementation((name, options, callback) => {
        lockCallback = callback;
        return callback();
      });

      Object.defineProperty(navigator, 'locks', {
        value: { request: requestMock },
        configurable: true,
        writable: true,
      });

      const c = mod.OauthMonitorClient.instance(
        baseConfig({ heartbeatInterval: 60 }),
      );
      c.start();
      await vi.advanceTimersByTimeAsync(10);
      fetchSpy.mockClear();

      // Put logged in status in localStorage
      localStorage.setItem(
        LocalStorage.USER_STATUS,
        JSON.stringify(wrappedStatus({ loggedIn: true })),
      );

      expect(requestMock).toHaveBeenCalledWith(
        'omc_heartbeat_leader',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
        expect.any(Function),
      );

      // Advance by heartbeat interval (60 seconds)
      await vi.advanceTimersByTimeAsync(60 * 1000);
      expect(fetchSpy).toHaveBeenCalled();

      c.destroy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).locks;
    });

    it('skips heartbeat polling when user is logged out', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(fetchOk(wrappedStatus({ loggedIn: true })));

      const requestMock = vi.fn().mockImplementation((name, options, callback) => {
        return callback();
      });

      Object.defineProperty(navigator, 'locks', {
        value: { request: requestMock },
        configurable: true,
        writable: true,
      });

      const c = mod.OauthMonitorClient.instance(
        baseConfig({ heartbeatInterval: 60 }),
      );
      c.start();
      await vi.advanceTimersByTimeAsync(10);
      fetchSpy.mockClear();

      // Stash logged out status in localStorage
      localStorage.setItem(
        LocalStorage.USER_STATUS,
        JSON.stringify(wrappedStatus({ loggedIn: false })),
      );

      // Advance by heartbeat interval (60 seconds)
      await vi.advanceTimersByTimeAsync(60 * 1000);
      expect(fetchSpy).not.toHaveBeenCalled();

      c.destroy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).locks;
    });

    it('handles leader lock abort when client is destroyed', async () => {
      let abortHandler: (() => void) | null = null;
      const requestMock = vi.fn().mockImplementation((name, options, callback) => {
        options.signal.addEventListener('abort', () => {
          if (abortHandler) abortHandler();
        });
        return new Promise<void>((resolve) => {
          abortHandler = resolve;
        });
      });

      Object.defineProperty(navigator, 'locks', {
        value: { request: requestMock },
        configurable: true,
        writable: true,
      });

      const c = mod.OauthMonitorClient.instance(
        baseConfig({ heartbeatInterval: 30 }),
      );
      c.start();
      await vi.advanceTimersByTimeAsync(10);

      // Destroy client should trigger abort on the lock signal
      expect(abortHandler).not.toBeNull();
      c.destroy();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).locks;
    });
  });
});

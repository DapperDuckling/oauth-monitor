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
});

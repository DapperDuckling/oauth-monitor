import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig, wrappedStatus } from '../helpers/factories.js';
import { ClientEvent, LocalStorage } from '../../src/types.js';

describe('OauthMonitorClient expiration listener', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;

  beforeEach(async () => {
    mod = await freshClientModule();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 401 }),
    );
  });

  it('does NOT schedule a timeout when eagerRefreshTime is false (disabled)', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ eagerRefreshTime: false as unknown as number }),
    );
    c.start();
    // Stash a status into storage to trigger setupExpirationListener via storage event
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus()),
    );
    setTimeoutSpy.mockClear();
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    c.destroy();
  });

  it('clamps the scheduled delay to a 15-second minimum', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ eagerRefreshTime: 0.01 }),
    );
    c.start();
    // accessExpires very near now → would compute a sub-15s delay → must clamp to 15000
    const soon = Math.floor(Date.now() / 1000) + 1;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus({ accessExpires: soon }, { checksum: 'cs-soon', timestamp: 1 }),
      ),
    );
    setTimeoutSpy.mockClear();
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    const timeoutCall = setTimeoutSpy.mock.calls.at(-1);
    expect(timeoutCall?.[1]).toBeGreaterThanOrEqual(15000);
    c.destroy();
  });

  it('skips re-scheduling when expirationWatchTimestamp matches existing', () => {
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ eagerRefreshTime: 1 }),
    );
    c.start();
    const access = Math.floor(Date.now() / 1000) + 3600;
    // First write — schedules an expiration timer
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus({ accessExpires: access }, { checksum: 'a', timestamp: 1 }),
      ),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    // Spy AFTER first event so we observe only the second event's calls.
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    // Same accessExpires, different checksum → handleUpdated proceeds past the hash guard,
    // but setupExpirationListener's "matching timestamp" guard should skip new scheduling.
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus({ accessExpires: access }, { checksum: 'b', timestamp: 2 }),
      ),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    // Filter to long-delay timers (the eager-refresh ones), ignoring any setImmediate(0) plumbing.
    const longTimers = setTimeoutSpy.mock.calls.filter(
      (call) => typeof call[1] === 'number' && (call[1] as number) >= 15000,
    );
    expect(longTimers).toHaveLength(0);
    c.destroy();
  });

  it('does not schedule a timeout when accessExpires is negative', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ eagerRefreshTime: 1 }),
    );
    c.start();
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({ accessExpires: -1 })),
    );
    setTimeoutSpy.mockClear();
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    c.destroy();
  });

  it('timer fire triggers an authCheck (force=true)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 401 }));
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ eagerRefreshTime: 1 }),
    );
    c.start();
    await vi.advanceTimersByTimeAsync(0);
    fetchSpy.mockClear();

    const access = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus({ accessExpires: access }, { checksum: 'cs-eager', timestamp: 5 }),
      ),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(fetchSpy).toHaveBeenCalled();
    c.destroy();
  });

  describe('Web Locks API deconfliction', () => {
    it('executes authCheck when Web Lock is granted', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('{}', { status: 401 }));

      const mockLock = { name: 'omc_eager_refresh', mode: 'exclusive' };
      const requestMock = vi.fn().mockImplementation(async (name, options, callback) => {
        return callback(mockLock);
      });

      Object.defineProperty(navigator, 'locks', {
        value: { request: requestMock },
        configurable: true,
        writable: true,
      });

      const c = mod.OauthMonitorClient.instance(
        baseConfig({ eagerRefreshTime: 1 }),
      );
      c.start();
      await vi.advanceTimersByTimeAsync(0);
      fetchSpy.mockClear();

      const access = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem(
        LocalStorage.USER_STATUS,
        JSON.stringify(
          wrappedStatus({ accessExpires: access }, { checksum: 'cs-lock-1', timestamp: 10 }),
        ),
      );
      window.dispatchEvent(
        new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
      );

      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(requestMock).toHaveBeenCalledWith(
        'omc_eager_refresh',
        { ifAvailable: true },
        expect.any(Function),
      );
      expect(fetchSpy).toHaveBeenCalled();
      c.destroy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).locks;
    });

    it('skips authCheck when another tab already holds the Web Lock', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('{}', { status: 401 }));

      // Simulate lock unavailable (another tab is actively refreshing)
      const requestMock = vi.fn().mockImplementation(async (name, options, callback) => {
        return callback(null);
      });

      Object.defineProperty(navigator, 'locks', {
        value: { request: requestMock },
        configurable: true,
        writable: true,
      });

      const c = mod.OauthMonitorClient.instance(
        baseConfig({ eagerRefreshTime: 1 }),
      );
      c.start();
      await vi.runAllTimersAsync();
      fetchSpy.mockClear();

      const access = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem(
        LocalStorage.USER_STATUS,
        JSON.stringify(
          wrappedStatus({ accessExpires: access }, { checksum: 'cs-lock-2', timestamp: 11 }),
        ),
      );
      window.dispatchEvent(
        new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
      );

      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(requestMock).toHaveBeenCalledWith(
        'omc_eager_refresh',
        { ifAvailable: true },
        expect.any(Function),
      );
      expect(fetchSpy).not.toHaveBeenCalled();
      c.destroy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).locks;
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig, wrappedStatus, fetchStatus } from '../helpers/factories.js';
import { ClientEvent, LocalStorage } from '../../src/types.js';

describe('OauthMonitorClient.authCheckNoWait', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;

  beforeEach(async () => {
    mod = await freshClientModule();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchStatus(401));
  });

  it('valid ACCESS + first call + fastInitialAuthCheck → returns true', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus(
          { loggedIn: true, accessExpires: future },
          { checksum: 'init', timestamp: 1 },
        ),
      ),
    );
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ fastInitialAuthCheck: true }),
    );
    expect(c.authCheckNoWait()).toBe(true);
    c.destroy();
  });

  it('valid ACCESS + cached hash already populated → returns true with no refetch', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus(
          { loggedIn: true, accessExpires: future },
          { checksum: 'first', timestamp: 1 },
        ),
      ),
    );
    const c = mod.OauthMonitorClient.instance(
      baseConfig({ fastInitialAuthCheck: true }),
    );
    c.authCheckNoWait(); // populates userStatusHash
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockClear();
    expect(c.authCheckNoWait()).toBe(true);
    c.destroy();
  });

  it('invalid ACCESS + valid REFRESH → returns false; no INVALID_TOKENS dispatched', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const past = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus(
          { loggedIn: true, accessExpires: past, refreshExpires: future },
          { checksum: 'r1', timestamp: 1 },
        ),
      ),
    );
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const invalid = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, invalid);

    expect(c.authCheckNoWait()).toBe(false);
    expect(invalid).not.toHaveBeenCalled();
    c.destroy();
  });

  it('invalid ACCESS + invalid REFRESH → returns false AND dispatches INVALID_TOKENS', () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus(
          { loggedIn: true, accessExpires: past, refreshExpires: past },
          { checksum: 'r2', timestamp: 1 },
        ),
      ),
    );
    const c = mod.OauthMonitorClient.instance(baseConfig());
    const invalid = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, invalid);

    expect(c.authCheckNoWait()).toBe(false);
    expect(invalid).toHaveBeenCalled();
    c.destroy();
  });
});

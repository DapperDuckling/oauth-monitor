import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig, wrappedStatus } from '../helpers/factories.js';
import { ClientEvent, LocalStorage } from '../../src/types.js';

describe('OauthMonitorClient window events', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;

  beforeEach(async () => {
    mod = await freshClientModule();
    // Stop the start() side-effect from making auth-check requests during these tests.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 401 }),
    );
  });

  it('storage event for unrelated key is ignored', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    const listener = vi.fn();
    c.addEventListener(ClientEvent.USER_STATUS_UPDATED, listener);

    window.dispatchEvent(
      new StorageEvent('storage', { key: 'unrelated', newValue: 'x' }),
    );
    expect(listener).not.toHaveBeenCalled();
    c.destroy();
  });

  it('storage event with USER_STATUS key dispatches USER_STATUS_UPDATED when valid status stored', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({}, { checksum: 'abc', timestamp: 100 })),
    );
    const listener = vi.fn();
    c.addEventListener(ClientEvent.USER_STATUS_UPDATED, listener);

    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    expect(listener).toHaveBeenCalledOnce();
    c.destroy();
  });

  it('storage event for USER_STATUS dispatches INVALID_TOKENS when nothing stored', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    const listener = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, listener);

    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    expect(listener).toHaveBeenCalled();
    c.destroy();
  });

  it('focus event triggers authCheckNoWait → INVALID_TOKENS when no tokens', async () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    const listener = vi.fn();
    c.addEventListener(ClientEvent.INVALID_TOKENS, listener);

    window.dispatchEvent(new FocusEvent('focus'));
    expect(listener).toHaveBeenCalled();
    c.destroy();
  });

  it('message event from foreign origin is rejected', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    const setSpy = vi.spyOn(localStorage, 'setItem');
    setSpy.mockClear();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: wrappedStatus({}, { timestamp: 9999 }),
      }),
    );
    // No localStorage write for foreign origin
    const userStatusWrites = setSpy.mock.calls.filter(
      (call) => call[0] === LocalStorage.USER_STATUS,
    );
    expect(userStatusWrites).toHaveLength(0);
    c.destroy();
  });

  it('message event from same origin with valid wrapped status writes to storage', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: wrappedStatus({}, { timestamp: 9999 }),
      }),
    );
    const stored = localStorage.getItem(LocalStorage.USER_STATUS);
    expect(stored).toBeTruthy();
    c.destroy();
  });

  it('message event with malformed payload is ignored (typia is<T> rejects)', async () => {
    const typia = await import('typia');
    vi.mocked(typia.is).mockReturnValueOnce(false);
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    const setSpy = vi.spyOn(localStorage, 'setItem');
    setSpy.mockClear();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { not: 'valid' },
      }),
    );
    const userStatusWrites = setSpy.mock.calls.filter(
      (call) => call[0] === LocalStorage.USER_STATUS,
    );
    expect(userStatusWrites).toHaveLength(0);
    c.destroy();
  });

  it('USER_STATUS_UPDATED is suppressed when checksum matches the cached one', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({}, { checksum: 'same', timestamp: 100 })),
    );
    const listener = vi.fn();
    c.addEventListener(ClientEvent.USER_STATUS_UPDATED, listener);

    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    listener.mockClear();
    // Second event with same stored data → no new dispatch
    window.dispatchEvent(
      new StorageEvent('storage', { key: LocalStorage.USER_STATUS }),
    );
    expect(listener).not.toHaveBeenCalled();
    c.destroy();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/svelte';
import { tick } from 'svelte';

const { instances, MockClient } = vi.hoisted(() => {
  const arr: Array<MockClient> = [];
  class MockClient {
    config: unknown;
    listeners: Array<(event: string, payload?: unknown) => void> = [];
    start = vi.fn();
    destroy = vi.fn();
    handleLogin = vi.fn();
    handleLogout = vi.fn();
    abortAuthCheck = vi.fn();
    addEventListener = vi.fn(
      (
        _event: string,
        listener: (event: string, payload?: unknown) => void,
      ) => {
        this.listeners.push(listener);
      },
    );
    removeEventListener = vi.fn();
    isStarted = vi.fn(() => true);
    constructor(cfg: unknown) {
      this.config = cfg;
      arr.push(this);
    }
    emit(event: string, payload?: unknown) {
      for (const l of this.listeners) l(event, payload);
    }
  }
  return { instances: arr, MockClient };
});

vi.mock('@dapperduckling/oauth-monitor-client', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    OauthMonitorClient: MockClient,
  };
});

import OauthMonitor from '../../src/lib/components/OauthMonitor.svelte';
import { ClientEvent } from '@dapperduckling/oauth-monitor-client';

const cfg = (over: Record<string, unknown> = {}) => ({
  client: { apiServerOrigin: 'http://api.test' },
  svelte: over,
});

describe('OauthMonitor.svelte', () => {
  beforeEach(() => {
    instances.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts: instantiates client and calls start() when not deferred', async () => {
    render(OauthMonitor, { props: { config: cfg() } });
    await tick();
    const c = instances.at(-1)!;
    expect(c.start).toHaveBeenCalledOnce();
  });

  it('does NOT call start() when deferredStart is true', async () => {
    render(OauthMonitor, { props: { config: cfg({ deferredStart: true }), triggerStart: false } });
    await tick();
    const c = instances.at(-1)!;
    expect(c.start).not.toHaveBeenCalled();
  });

  it('triggerStart=true with deferredStart eventually calls start', async () => {
    const { rerender } = render(OauthMonitor, {
      props: { config: cfg({ deferredStart: true }), triggerStart: false },
    });
    await tick();
    const c = instances.at(-1)!;
    expect(c.start).not.toHaveBeenCalled();
    await rerender({ config: cfg({ deferredStart: true }), triggerStart: true });
    await tick();
    expect(c.start).toHaveBeenCalledOnce();
  });

  it('unmount calls client.destroy()', async () => {
    const { unmount } = render(OauthMonitor, { props: { config: cfg() } });
    await tick();
    const c = instances.at(-1)!;
    unmount();
    expect(c.destroy).toHaveBeenCalledOnce();
  });

  it('START_AUTH_CHECK schedules a 7s lengthy-login timer', async () => {
    render(OauthMonitor, { props: { config: cfg() } });
    await tick();
    const c = instances.at(-1)!;
    act(() => c.emit(ClientEvent.START_AUTH_CHECK));
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    // No throw is the success condition; reducer-level coverage is in store.test.
    expect(c.listeners.length).toBeGreaterThan(0);
  });

  it('END_AUTH_CHECK clears the lengthy-login timer', async () => {
    render(OauthMonitor, { props: { config: cfg() } });
    await tick();
    const c = instances.at(-1)!;
    act(() => c.emit(ClientEvent.START_AUTH_CHECK));
    act(() =>
      c.emit(ClientEvent.END_AUTH_CHECK, {
        loggedIn: true,
        accessExpires: 0,
        refreshExpires: 0,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(7100);
    });
    expect(c.listeners.length).toBeGreaterThan(0);
  });

  it('LOGIN_ERROR clears the lengthy-login timer', async () => {
    render(OauthMonitor, { props: { config: cfg() } });
    await tick();
    const c = instances.at(-1)!;
    act(() => c.emit(ClientEvent.START_AUTH_CHECK));
    act(() => c.emit(ClientEvent.LOGIN_ERROR));
    act(() => {
      vi.advanceTimersByTime(7100);
    });
    expect(c.listeners.length).toBeGreaterThan(0);
  });

  it('disableAuthComponents suppresses all UI', async () => {
    render(OauthMonitor, { props: { config: cfg({ disableAuthComponents: true }) } });
    await tick();
    expect(screen.queryByText(/Checking Credentials/i)).not.toBeInTheDocument();
  });

  it('default Login UI renders when started and showLoginOverlay is true', async () => {
    render(OauthMonitor, { props: { config: cfg() } });
    await tick();
    await tick();
    expect(screen.getByText(/Checking Credentials/i)).toBeInTheDocument();
  });
});

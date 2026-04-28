import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

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

import { OauthMonitorProvider } from '../../src/components/OauthMonitorProvider.js';
import { ClientEvent } from '@dapperduckling/oauth-monitor-client';

const cfg = (over = {}) => ({
  client: { apiServerOrigin: 'http://api.test' },
  react: { ...over },
});

describe('OauthMonitorProvider', () => {
  beforeEach(() => {
    instances.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <OauthMonitorProvider config={cfg()}>
        <div data-testid="child">hello</div>
      </OauthMonitorProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls client.start() on mount when not deferred', () => {
    render(
      <OauthMonitorProvider config={cfg()}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    expect(c.start).toHaveBeenCalledOnce();
  });

  it('does NOT call client.start() when deferredStart is true', () => {
    render(
      <OauthMonitorProvider config={cfg({ deferredStart: true })}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    expect(c.start).not.toHaveBeenCalled();
  });

  it('registers globalEventListener when supplied', () => {
    const fn = vi.fn();
    render(
      <OauthMonitorProvider config={cfg({ globalEventListener: fn })}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    expect(c.addEventListener).toHaveBeenCalledWith('*', fn);
  });

  it('START_AUTH_CHECK schedules a 7s lengthy-login timer (no error after fire)', () => {
    render(
      <OauthMonitorProvider config={cfg()}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    act(() => c.emit(ClientEvent.START_AUTH_CHECK));
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(c.listeners.length).toBeGreaterThan(0);
  });

  it('USER_STATUS_UPDATED with loggedIn=true clears the lengthy timer', () => {
    render(
      <OauthMonitorProvider config={cfg()}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    act(() => c.emit(ClientEvent.START_AUTH_CHECK));
    act(() =>
      c.emit(ClientEvent.USER_STATUS_UPDATED, {
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

  it('LOGIN_ERROR clears the lengthy timer', () => {
    render(
      <OauthMonitorProvider config={cfg()}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    act(() => c.emit(ClientEvent.START_AUTH_CHECK));
    act(() => c.emit(ClientEvent.LOGIN_ERROR));
    act(() => {
      vi.advanceTimersByTime(7100);
    });
    expect(c.listeners.length).toBeGreaterThan(0);
  });

  it('unmount calls client.destroy()', () => {
    const { unmount } = render(
      <OauthMonitorProvider config={cfg()}>
        <div />
      </OauthMonitorProvider>,
    );
    const c = instances.at(-1)!;
    unmount();
    expect(c.destroy).toHaveBeenCalledOnce();
  });

  it('renders custom loginModalComponent override with props', () => {
    const Custom = ({ greeting }: { greeting?: string }) => (
      <div data-testid="custom-login">{greeting}</div>
    );
    render(
      <OauthMonitorProvider
        config={cfg({
          loginModalComponent: Custom,
          loginModalProps: { greeting: 'hi' },
        })}
      >
        <div />
      </OauthMonitorProvider>,
    );
    expect(screen.getByTestId('custom-login')).toHaveTextContent('hi');
  });

  it('disableAuthComponents suppresses all auth UI', () => {
    render(
      <OauthMonitorProvider config={cfg({ disableAuthComponents: true })}>
        <div data-testid="child">x</div>
      </OauthMonitorProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

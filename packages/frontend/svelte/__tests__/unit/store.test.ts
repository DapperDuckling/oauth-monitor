import { describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { createOauthMonitorStore } from '../../src/lib/store.js';
import { OmcDispatchType } from '../../src/lib/types.js';
import { ClientEvent } from '@dapperduckling/oauth-monitor-client';

const initial = () => ({
  userStatus: { loggedIn: false, accessExpires: -1, refreshExpires: -1 },
  ui: {
    showLoginOverlay: true,
    showMustLoginOverlay: false,
    showLogoutOverlay: false,
    executingLogout: false,
    silentLoginInitiated: false,
    lengthyLogin: false,
    loginError: false,
    hasInvalidTokens: false,
  },
});

const clientEvent = (type: ClientEvent, detail?: unknown) => ({
  type: OmcDispatchType.OMC_CLIENT_EVENT,
  payload: { type, detail } as unknown as CustomEvent,
});

describe('createOauthMonitorStore — initial state', () => {
  it('subscribe receives initial state immediately', () => {
    const store = createOauthMonitorStore();
    expect(get(store)).toEqual(initial());
  });
});

describe('createOauthMonitorStore — ClientEvent transitions', () => {
  it('INVALID_TOKENS sets login overlays + clears loggedIn', () => {
    const store = createOauthMonitorStore();
    store.dispatch(clientEvent(ClientEvent.INVALID_TOKENS));
    const s = get(store);
    expect(s.ui.showLoginOverlay).toBe(true);
    expect(s.ui.hasInvalidTokens).toBe(true);
    expect(s.ui.silentLoginInitiated).toBe(false);
    expect(s.ui.showMustLoginOverlay).toBe(true);
    expect(s.userStatus.loggedIn).toBe(false);
  });

  it('START_AUTH_CHECK clears prior error/lengthy and sets silentLoginInitiated', () => {
    const store = createOauthMonitorStore();
    store.dispatch(clientEvent(ClientEvent.LOGIN_ERROR));
    store.dispatch(clientEvent(ClientEvent.START_AUTH_CHECK));
    const s = get(store);
    expect(s.ui.silentLoginInitiated).toBe(true);
    expect(s.ui.showMustLoginOverlay).toBe(false);
    expect(s.ui.loginError).toBe(false);
    expect(s.ui.lengthyLogin).toBe(false);
  });

  it('LOGIN_ERROR sets loginError and clears silentLoginInitiated', () => {
    const store = createOauthMonitorStore();
    store.dispatch(clientEvent(ClientEvent.LOGIN_ERROR));
    const s = get(store);
    expect(s.ui.loginError).toBe(true);
    expect(s.ui.silentLoginInitiated).toBe(false);
  });

  it('USER_STATUS_UPDATED loggedIn=true: clears hasInvalidTokens, hides overlays', () => {
    const store = createOauthMonitorStore();
    store.dispatch(clientEvent(ClientEvent.INVALID_TOKENS));
    store.dispatch(
      clientEvent(ClientEvent.USER_STATUS_UPDATED, {
        loggedIn: true,
        accessExpires: 1,
        refreshExpires: 2,
      }),
    );
    const s = get(store);
    expect(s.userStatus.loggedIn).toBe(true);
    expect(s.ui.hasInvalidTokens).toBe(false);
    expect(s.ui.showLoginOverlay).toBe(false);
    expect(s.ui.showMustLoginOverlay).toBe(false);
  });

  it('USER_STATUS_UPDATED loggedIn=false: shows overlays', () => {
    const store = createOauthMonitorStore();
    store.dispatch(
      clientEvent(ClientEvent.USER_STATUS_UPDATED, {
        loggedIn: false,
        accessExpires: -1,
        refreshExpires: -1,
      }),
    );
    const s = get(store);
    expect(s.ui.showLoginOverlay).toBe(true);
    expect(s.ui.showMustLoginOverlay).toBe(true);
  });

  it('END_AUTH_CHECK loggedIn=true: hides showMustLoginOverlay, clears silentLoginInitiated', () => {
    const store = createOauthMonitorStore();
    store.dispatch(
      clientEvent(ClientEvent.END_AUTH_CHECK, {
        loggedIn: true,
        accessExpires: 1,
        refreshExpires: 2,
      }),
    );
    const s = get(store);
    expect(s.ui.showMustLoginOverlay).toBe(false);
    expect(s.ui.silentLoginInitiated).toBe(false);
  });

  it('END_AUTH_CHECK loggedIn=false: shows showMustLoginOverlay', () => {
    const store = createOauthMonitorStore();
    store.dispatch(
      clientEvent(ClientEvent.END_AUTH_CHECK, {
        loggedIn: false,
        accessExpires: -1,
        refreshExpires: -1,
      }),
    );
    expect(get(store).ui.showMustLoginOverlay).toBe(true);
  });
});

describe('createOauthMonitorStore — direct UI actions', () => {
  it('LENGTHY_LOGIN sets ui.lengthyLogin', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.LENGTHY_LOGIN });
    expect(get(store).ui.lengthyLogin).toBe(true);
  });

  it('EXECUTING_LOGOUT sets ui.executingLogout', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.EXECUTING_LOGOUT });
    expect(get(store).ui.executingLogout).toBe(true);
  });

  it('SHOW_LOGIN sets showLoginOverlay', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.SHOW_LOGIN });
    expect(get(store).ui.showLoginOverlay).toBe(true);
  });

  it('SHOW_LOGOUT sets showLogoutOverlay', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.SHOW_LOGOUT });
    expect(get(store).ui.showLogoutOverlay).toBe(true);
  });

  it('HIDE_DIALOG resets helpers and hides overlays', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.SHOW_LOGIN });
    store.dispatch({ type: OmcDispatchType.SHOW_LOGOUT });
    store.dispatch({ type: OmcDispatchType.LENGTHY_LOGIN });
    store.dispatch({ type: OmcDispatchType.HIDE_DIALOG });
    const s = get(store);
    expect(s.ui.showLoginOverlay).toBe(false);
    expect(s.ui.showLogoutOverlay).toBe(false);
    expect(s.ui.lengthyLogin).toBe(false);
  });

  it('DESTROY_CLIENT returns to initial state', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.EXECUTING_LOGOUT });
    store.dispatch({ type: OmcDispatchType.DESTROY_CLIENT });
    expect(get(store)).toEqual(initial());
  });

  it('reset() returns to initial state', () => {
    const store = createOauthMonitorStore();
    store.dispatch({ type: OmcDispatchType.SHOW_LOGOUT });
    store.reset();
    expect(get(store)).toEqual(initial());
  });

  it('SET_OMC_CLIENT stores the client reference on the state', () => {
    const store = createOauthMonitorStore();
    const fakeClient = { handleLogin: () => undefined } as never;
    store.dispatch({
      type: OmcDispatchType.SET_OMC_CLIENT,
      payload: fakeClient,
    });
    expect(get(store).omcClient).toBe(fakeClient);
  });

  it('client reference survives subsequent dispatches (passes by reference, not via structuredClone)', () => {
    // Class instances with methods can't be structured-cloned. The reducer must extract
    // omcClient before cloning the rest, then re-attach by reference.
    const store = createOauthMonitorStore();
    const fakeClient = { handleLogin: () => undefined } as never;
    store.dispatch({ type: OmcDispatchType.SET_OMC_CLIENT, payload: fakeClient });
    expect(() =>
      store.dispatch({ type: OmcDispatchType.LENGTHY_LOGIN }),
    ).not.toThrow();
    const s = get(store);
    expect(s.omcClient).toBe(fakeClient);
    expect(s.ui.lengthyLogin).toBe(true);
  });

  it('DESTROY_CLIENT clears the omcClient reference', () => {
    const store = createOauthMonitorStore();
    store.dispatch({
      type: OmcDispatchType.SET_OMC_CLIENT,
      payload: {} as never,
    });
    store.dispatch({ type: OmcDispatchType.DESTROY_CLIENT });
    expect(get(store).omcClient).toBeUndefined();
  });
});

describe('createOauthMonitorStore — subscriber semantics', () => {
  it('subscribers receive new states on dispatch', () => {
    const store = createOauthMonitorStore();
    const sub = vi.fn();
    const unsub = store.subscribe(sub);
    sub.mockClear();
    store.dispatch({ type: OmcDispatchType.LENGTHY_LOGIN });
    expect(sub).toHaveBeenCalledOnce();
    unsub();
  });

  it('structuredClone isolation: each dispatch yields a new state object', () => {
    const store = createOauthMonitorStore();
    const before = get(store);
    store.dispatch({ type: OmcDispatchType.LENGTHY_LOGIN });
    const after = get(store);
    expect(after).not.toBe(before);
  });
});

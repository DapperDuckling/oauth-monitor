import { describe, it, expect } from 'vitest';
import { produce } from 'immer';
import { reducer } from '../../src/reducer.js';
import { InitialContext } from '../../src/oauth-monitor-context.js';
import { OmcDispatchType, type OauthMonitorStateActions } from '../../src/types.js';
import { ClientEvent } from '@dapperduckling/oauth-monitor-client';

const dispatch = (
  action: OauthMonitorStateActions,
  state = structuredClone(InitialContext),
) =>
  produce(state, (draft) => {
    const next = reducer(draft, action);
    return next;
  });

const clientEvent = (type: ClientEvent, detail?: unknown) =>
  ({
    type: OmcDispatchType.OMC_CLIENT_EVENT,
    payload: { type, detail } as unknown as Event,
  }) satisfies OauthMonitorStateActions;

describe('reducer — initial state', () => {
  it('matches InitialContext exactly', () => {
    expect(structuredClone(InitialContext)).toEqual(InitialContext);
    expect(InitialContext.userStatus.loggedIn).toBe(false);
    expect(InitialContext.ui.showLoginOverlay).toBe(true);
  });
});

describe('reducer — ClientEvent transitions', () => {
  it('INVALID_TOKENS sets login overlays and clears loggedIn', () => {
    const next = dispatch(clientEvent(ClientEvent.INVALID_TOKENS));
    expect(next.ui.showLoginOverlay).toBe(true);
    expect(next.ui.hasInvalidTokens).toBe(true);
    expect(next.ui.silentLoginInitiated).toBe(false);
    expect(next.ui.showMustLoginOverlay).toBe(true);
    expect(next.userStatus.loggedIn).toBe(false);
  });

  it('START_AUTH_CHECK sets silentLoginInitiated and clears prior error/lengthy', () => {
    const start = dispatch({
      type: OmcDispatchType.OMC_CLIENT_EVENT,
      payload: { type: ClientEvent.LOGIN_ERROR } as unknown as Event,
    });
    const next = dispatch(clientEvent(ClientEvent.START_AUTH_CHECK), start);
    expect(next.ui.silentLoginInitiated).toBe(true);
    expect(next.ui.showMustLoginOverlay).toBe(false);
    expect(next.ui.loginError).toBe(false);
    expect(next.ui.lengthyLogin).toBe(false);
  });

  it('LOGIN_ERROR sets loginError and clears silentLoginInitiated', () => {
    const next = dispatch(clientEvent(ClientEvent.LOGIN_ERROR));
    expect(next.ui.loginError).toBe(true);
    expect(next.ui.silentLoginInitiated).toBe(false);
  });

  it('USER_STATUS_UPDATED with loggedIn=true: clears hasInvalidTokens, hides overlays', () => {
    const start = dispatch(clientEvent(ClientEvent.INVALID_TOKENS));
    const next = dispatch(
      clientEvent(ClientEvent.USER_STATUS_UPDATED, {
        loggedIn: true,
        accessExpires: 100,
        refreshExpires: 200,
      }),
      start,
    );
    expect(next.userStatus.loggedIn).toBe(true);
    expect(next.ui.hasInvalidTokens).toBe(false);
    expect(next.ui.showLoginOverlay).toBe(false);
    expect(next.ui.showMustLoginOverlay).toBe(false);
    expect(next.ui.lengthyLogin).toBe(false);
    expect(next.ui.loginError).toBe(false);
  });

  it('USER_STATUS_UPDATED with loggedIn=false: shows overlays', () => {
    const next = dispatch(
      clientEvent(ClientEvent.USER_STATUS_UPDATED, {
        loggedIn: false,
        accessExpires: -1,
        refreshExpires: -1,
      }),
    );
    expect(next.userStatus.loggedIn).toBe(false);
    expect(next.ui.showLoginOverlay).toBe(true);
    expect(next.ui.showMustLoginOverlay).toBe(true);
  });

  it('END_AUTH_CHECK with loggedIn=true: hides showMustLoginOverlay, clears silentLoginInitiated', () => {
    const next = dispatch(
      clientEvent(ClientEvent.END_AUTH_CHECK, {
        loggedIn: true,
        accessExpires: 100,
        refreshExpires: 200,
      }),
    );
    expect(next.ui.showMustLoginOverlay).toBe(false);
    expect(next.ui.silentLoginInitiated).toBe(false);
  });

  it('END_AUTH_CHECK with loggedIn=false: shows showMustLoginOverlay', () => {
    const next = dispatch(
      clientEvent(ClientEvent.END_AUTH_CHECK, {
        loggedIn: false,
        accessExpires: -1,
        refreshExpires: -1,
      }),
    );
    expect(next.ui.showMustLoginOverlay).toBe(true);
  });
});

describe('reducer — direct UI actions', () => {
  it('SET_OMC_CLIENT stores the client reference', () => {
    const fakeClient = { handleLogin: () => undefined } as never;
    const next = dispatch({
      type: OmcDispatchType.SET_OMC_CLIENT,
      payload: fakeClient,
    });
    expect(next.omcClient).toBe(fakeClient);
  });

  it('LENGTHY_LOGIN sets ui.lengthyLogin', () => {
    const next = dispatch({ type: OmcDispatchType.LENGTHY_LOGIN });
    expect(next.ui.lengthyLogin).toBe(true);
  });

  it('EXECUTING_LOGOUT sets ui.executingLogout', () => {
    const next = dispatch({ type: OmcDispatchType.EXECUTING_LOGOUT });
    expect(next.ui.executingLogout).toBe(true);
  });

  it('SHOW_LOGIN sets showLoginOverlay', () => {
    const start = produce(InitialContext, (d) => {
      d.ui.showLoginOverlay = false;
    });
    const next = dispatch({ type: OmcDispatchType.SHOW_LOGIN }, start);
    expect(next.ui.showLoginOverlay).toBe(true);
  });

  it('SHOW_LOGOUT sets showLogoutOverlay', () => {
    const next = dispatch({ type: OmcDispatchType.SHOW_LOGOUT });
    expect(next.ui.showLogoutOverlay).toBe(true);
  });

  it('HIDE_DIALOG resets ui helpers and hides overlays', () => {
    const start = produce(InitialContext, (d) => {
      d.ui.showLoginOverlay = true;
      d.ui.showLogoutOverlay = true;
      d.ui.lengthyLogin = true;
      d.ui.silentLoginInitiated = true;
      d.ui.loginError = true;
    });
    const next = dispatch({ type: OmcDispatchType.HIDE_DIALOG }, start);
    expect(next.ui.showLoginOverlay).toBe(false);
    expect(next.ui.showLogoutOverlay).toBe(false);
    expect(next.ui.lengthyLogin).toBe(false);
    expect(next.ui.silentLoginInitiated).toBe(false);
    expect(next.ui.loginError).toBe(false);
  });

  it('DESTROY_CLIENT returns a fresh InitialContext clone', () => {
    const dirty = produce(InitialContext, (d) => {
      d.userStatus.loggedIn = true;
      d.ui.executingLogout = true;
    });
    const next = dispatch({ type: OmcDispatchType.DESTROY_CLIENT }, dirty);
    expect(next).toEqual(InitialContext);
    // Returned object is a clone, not the InitialContext singleton itself.
    expect(next).not.toBe(InitialContext);
    expect(next.ui).not.toBe(InitialContext.ui);
    expect(next.userStatus).not.toBe(InitialContext.userStatus);
  });
});

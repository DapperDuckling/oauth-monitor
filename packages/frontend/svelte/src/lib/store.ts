import { writable } from 'svelte/store';
import type { OauthMonitorState, OauthMonitorStateActions } from './types';
import { OmcDispatchType } from './types';
import { ClientEvent } from "@dapperduckling/oauth-monitor-client";
import type { UserStatus } from "@dapperduckling/oauth-monitor-common";

const initialState: OauthMonitorState = {
    userStatus: {
        loggedIn: false,
        accessExpires: -1,
        refreshExpires: -1,
    },
    ui: {
        showLoginOverlay: true, // Default to true to allow checks to happen
        showMustLoginOverlay: false,
        showLogoutOverlay: false,
        executingLogout: false,
        silentLoginInitiated: false,
        lengthyLogin: false,
        loginError: false,
        hasInvalidTokens: false,
    }
};

const resetUiHelperStates = (state: OauthMonitorState) => {
    state.ui.silentLoginInitiated = false;
    state.ui.lengthyLogin = false;
    state.ui.loginError = false;
    return state;
}

const handleClientEvent = (state: OauthMonitorState, action: Extract<OauthMonitorStateActions, { type: OmcDispatchType.OMC_CLIENT_EVENT }>): OauthMonitorState => {
    const eventType = action.payload.type as ClientEvent;
    const detail = (action.payload as CustomEvent).detail as UserStatus;

    switch (eventType) {
        case ClientEvent.INVALID_TOKENS:
            state.ui.showLoginOverlay = true;
            state.ui.hasInvalidTokens = true;
            break;
        case ClientEvent.START_AUTH_CHECK:
            state.ui.silentLoginInitiated = true;
            state.ui.showMustLoginOverlay = false;
            state.ui.loginError = false;
            state.ui.lengthyLogin = false;
            break;
        case ClientEvent.LOGIN_ERROR:
            state.ui.loginError = true;
            state.ui.silentLoginInitiated = false;
            break;
        case ClientEvent.USER_STATUS_UPDATED:
            state.userStatus = detail;
            if (detail.loggedIn) state.ui.hasInvalidTokens = false;
            state = resetUiHelperStates(state);
            state.ui.showLoginOverlay = !detail.loggedIn;
            state.ui.showMustLoginOverlay = !detail.loggedIn;
            break;
        case ClientEvent.END_AUTH_CHECK:
            state.ui.silentLoginInitiated = false;
            state.ui.showMustLoginOverlay = !detail.loggedIn;
            break;
    }
    return state;
};

function createReducer(state: OauthMonitorState, action: OauthMonitorStateActions): OauthMonitorState {
    // structuredClone is available in Node 17+ and all modern browsers.
    // If you are on an older environment, replace with JSON.parse(JSON.stringify(state))
    const newState = structuredClone(state);

    switch (action.type) {
        case OmcDispatchType.OMC_CLIENT_EVENT:
            return handleClientEvent(newState, action);

        // Note: SET_OMC_CLIENT is handled in the component context,
        // the store primarily holds data derived from the client

        case OmcDispatchType.LENGTHY_LOGIN:
            newState.ui.lengthyLogin = true;
            break;
        case OmcDispatchType.EXECUTING_LOGOUT:
            newState.ui.showLogoutOverlay = true;
            newState.ui.executingLogout = true;
            break;
        case OmcDispatchType.SHOW_LOGIN:
            newState.ui.showLoginOverlay = true;
            break;
        case OmcDispatchType.SHOW_LOGOUT:
            newState.ui.showLogoutOverlay = true;
            break;
        case OmcDispatchType.HIDE_DIALOG:
            resetUiHelperStates(newState);
            newState.ui.showLoginOverlay = false;
            newState.ui.showLogoutOverlay = false;
            break;
        case OmcDispatchType.DESTROY_CLIENT:
            return structuredClone(initialState);
    }

    return newState;
}

export const createOauthMonitorStore = () => {
    const { subscribe, update, set } = writable<OauthMonitorState>(structuredClone(initialState));

    const dispatch = (action: OauthMonitorStateActions) => {
        update(state => createReducer(state, action));
    };

    return {
        subscribe,
        dispatch,
        reset: () => set(structuredClone(initialState))
    };
};

export type OauthMonitorStore = ReturnType<typeof createOauthMonitorStore>;

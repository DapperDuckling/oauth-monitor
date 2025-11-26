import type {ImmerReducer} from "use-immer";
import type {OauthMonitorContextProps} from "./oauth-monitor-context.js";
import {InitialContext} from "./oauth-monitor-context.js";
import type {UserStatus} from "@dapperduckling/oauth-monitor-common";
import {ClientEvent} from "@dapperduckling/oauth-monitor-client";
import {Draft} from "immer";
import {OmcDispatchType, OauthMonitorStateActions} from "./types.js";

type ImmerReducerType = ImmerReducer<OauthMonitorContextProps, OauthMonitorStateActions>;

const resetUiHelperStates = (draft: Draft<OauthMonitorContextProps>) => {
    draft.ui.silentLoginInitiated = draft.ui.lengthyLogin = draft.ui.loginError = false;
}

const OauthMonitorClientEventHandler: ImmerReducerType = (draft, action) => {
    // Ensure the correct payload was passed
    if (action.type !== OmcDispatchType.OMC_CLIENT_EVENT) return;

    const eventType = action.payload.type as ClientEvent;
    const payload = action.payload as CustomEvent<UserStatus>;

    switch (eventType) {
        case ClientEvent.INVALID_TOKENS:
            draft.ui.showLoginOverlay = true;
            draft.ui.hasInvalidTokens = true;
            draft.ui.silentLoginInitiated = false;
            draft.ui.showMustLoginOverlay = true;
            draft.userStatus.loggedIn = false;
            break;
        case ClientEvent.START_AUTH_CHECK:
            draft.ui.silentLoginInitiated = true;
            draft.ui.showMustLoginOverlay = false;
            draft.ui.loginError = false;
            draft.ui.lengthyLogin = false;
            break;
        case ClientEvent.LOGIN_ERROR:
            draft.ui.loginError = true;
            draft.ui.silentLoginInitiated = false;
            break;
        case ClientEvent.USER_STATUS_UPDATED:
            draft.userStatus = payload.detail;
            if (payload.detail.loggedIn) draft.ui.hasInvalidTokens = false;
            resetUiHelperStates(draft);
            draft.ui.showLoginOverlay = draft.ui.showMustLoginOverlay = !payload.detail.loggedIn;   // Show hide the overlay and must log in
            break;
        case ClientEvent.END_AUTH_CHECK:
            draft.ui.silentLoginInitiated = false;
            draft.ui.showMustLoginOverlay = !payload.detail.loggedIn;
            break;
    }

    return undefined;
}

export const reducer: ImmerReducerType = (draft, action) => {
    switch (action.type) {
        case OmcDispatchType.OMC_CLIENT_EVENT:
            return OauthMonitorClientEventHandler(draft, action);
        case OmcDispatchType.SET_OMC_CLIENT:
            draft.omcClient = action.payload;
            break;
        case OmcDispatchType.LENGTHY_LOGIN:
            draft.ui.lengthyLogin = true;
            break;
        case OmcDispatchType.EXECUTING_LOGOUT:
            draft.ui.showLogoutOverlay = true;
            draft.ui.executingLogout = true;
            break;
        case OmcDispatchType.SHOW_LOGIN:
            draft.ui.showLoginOverlay = true;
            break;
        case OmcDispatchType.SHOW_LOGOUT:
            draft.ui.showLogoutOverlay = true;
            break;
        case OmcDispatchType.HIDE_DIALOG:
            resetUiHelperStates(draft);
            draft.ui.showLoginOverlay = false;
            draft.ui.showLogoutOverlay = false;
            break;
        case OmcDispatchType.DESTROY_CLIENT:
            return structuredClone(InitialContext);
    }

    return undefined;
}

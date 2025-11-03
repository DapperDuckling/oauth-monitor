import type {ImmerReducer} from "use-immer";
import type {AuthMonitorContextProps} from "./auth-monitor-context.js";
import {InitialContext} from "./auth-monitor-context.js";
import type {UserStatus} from "@dapperduckling/keycloak-connector-common";
import {ClientEvent} from "@dapperduckling/keycloak-connector-client";
import {Draft} from "immer";
import {KccDispatchType, AuthMonitorStateActions} from "./types.js";

type ImmerReducerType = ImmerReducer<AuthMonitorContextProps, AuthMonitorStateActions>;

const resetUiHelperStates = (draft: Draft<AuthMonitorContextProps>) => {
    draft.ui.silentLoginInitiated = draft.ui.lengthyLogin = draft.ui.loginError = false;
}

const authMonitorClientEventHandler: ImmerReducerType = (draft, action) => {
    // Ensure the correct payload was passed
    if (action.type !== KccDispatchType.KCC_CLIENT_EVENT) return;

    const eventType = action.payload.type as ClientEvent;
    switch (eventType) {
        case ClientEvent.AUTH_CHECK_STARTED:
            draft.ui.silentLoginInitiated = true;
            draft.ui.loginError = false;
            break;
        case ClientEvent.USER_STATUS_UPDATED:
            const payload = action.payload as CustomEvent<UserStatus>;
            draft.userStatus = payload.detail;
            resetUiHelperStates(draft);
            draft.ui.showLoginOverlay = draft.ui.showMustLoginOverlay = !payload.detail.loggedIn;   // Show hide the overlay and must log in
            draft.hasAuthenticatedOnce = draft.hasAuthenticatedOnce || payload.detail.loggedIn;     // Potentially set the auth once flag
            break;
    }

    return undefined;
}

export const reducer: ImmerReducerType = (draft, action) => {
    switch (action.type) {
        case KccDispatchType.KCC_CLIENT_EVENT:
            return authMonitorClientEventHandler(draft, action);
        case KccDispatchType.SET_KCC_CLIENT:
            draft.kccClient = action.payload;
            break;
        case KccDispatchType.LENGTHY_LOGIN:
            draft.ui.lengthyLogin = true;
            break;
        case KccDispatchType.SHOW_LOGIN:
            draft.ui.showLoginOverlay = true;
            break;
        case KccDispatchType.HIDE_DIALOG:
            resetUiHelperStates(draft);
            draft.ui.showLoginOverlay = false;
            break;
        case KccDispatchType.DESTROY_CLIENT:
            return structuredClone(InitialContext);
    }

    return undefined;
}

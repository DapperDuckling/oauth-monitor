import {createContext, Dispatch} from "react";
import {AuthMonitorClient} from "@dapperduckling/keycloak-connector-client";
import type {AuthMonitorState, AuthMonitorStateActions} from "./types.js";

export interface AuthMonitorContextProps extends AuthMonitorState {
    kccClient?: AuthMonitorClient,
}

export const InitialContext: AuthMonitorContextProps = {
    userStatus: {
        loggedIn: false,
    },
    hasAuthenticatedOnce: false,
    ui: {
        lengthyLogin: false,
        showLoginOverlay: true,
        silentLoginInitiated: false,
        executingLogout: false,
        showMustLoginOverlay: false,
        showLogoutOverlay: false,
        loginError: false,
        hasInvalidTokens: false,
    }
}

export const AuthMonitorContext = createContext<AuthMonitorContextProps | undefined>(undefined);
AuthMonitorContext.displayName = "AuthMonitorContext";

export const AuthMonitorDispatchContext = createContext<Dispatch<AuthMonitorStateActions> | undefined>(undefined);
AuthMonitorContext.displayName = "AuthMonitorDispatchContext";

import {createContext, Dispatch} from "react";
import {OauthMonitorClient} from "@dapperduckling/oauth-monitor-client";
import type {OauthMonitorState, OauthMonitorStateActions} from "./types.js";

export interface OauthMonitorContextProps extends OauthMonitorState {
    omcClient?: OauthMonitorClient,
}

export const InitialContext: OauthMonitorContextProps = {
    userStatus: {
        loggedIn: false,
        accessExpires: -1,
        refreshExpires: -1,
    },
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

export const OauthMonitorContext = createContext<OauthMonitorContextProps | undefined>(undefined);
OauthMonitorContext.displayName = "OauthMonitorContext";

export const OauthMonitorDispatchContext = createContext<Dispatch<OauthMonitorStateActions> | undefined>(undefined);
OauthMonitorContext.displayName = "OauthMonitorDispatchContext";

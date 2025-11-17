import {OauthMonitorClient} from "@dapperduckling/oauth-monitor-client";
import {ReactConfig} from "./components/OauthMonitorProvider.js";
import {ReactNode} from "react";
import type {UserStatusImmerSafe} from "@dapperduckling/oauth-monitor-common";

export interface AuthProps {
    children: ReactNode;
    reactConfig?: ReactConfig;
}
export interface OauthMonitorState {
    userStatus: UserStatusImmerSafe;
    hasAuthenticatedOnce: boolean;
    ui: {
        showLoginOverlay: boolean;
        showMustLoginOverlay: boolean;
        showLogoutOverlay: boolean;
        executingLogout: boolean;
        silentLoginInitiated: boolean;
        lengthyLogin: boolean;
        loginError: boolean;
        hasInvalidTokens: boolean;
    }
}

export enum OmcDispatchType {
    DESTROY_CLIENT = "DESTROY_CLIENT",
    SET_OMC_CLIENT = "SET_OMC_CLIENT",
    OMC_CLIENT_EVENT = "OMC_CLIENT_EVENT",
    LENGTHY_LOGIN = "LENGTHY_LOGIN",
    SHOW_LOGIN = "SHOW_LOGIN",
    SHOW_LOGOUT = "SHOW_LOGOUT",
    EXECUTING_LOGOUT = "EXECUTING_LOGOUT",
    HIDE_DIALOG = "HIDE_DIALOG",
}

export type OauthMonitorStateActions =
    | { type: OmcDispatchType.SET_OMC_CLIENT; payload: OauthMonitorClient; }
    | { type: OmcDispatchType.OMC_CLIENT_EVENT; payload: Event | CustomEvent<UserStatusImmerSafe>; }
    | { type:
            OmcDispatchType.DESTROY_CLIENT |
            OmcDispatchType.LENGTHY_LOGIN |
            OmcDispatchType.SHOW_LOGIN |
            OmcDispatchType.SHOW_LOGOUT |
            OmcDispatchType.EXECUTING_LOGOUT |
            OmcDispatchType.HIDE_DIALOG
    }

import {OauthMonitorClient} from "@dapperduckling/oauth-monitor-client";
import {ReactNode} from "react";
import type {UserStatus} from "@dapperduckling/oauth-monitor-common";

export interface AuthProps {
    children: ReactNode;
}
export interface OauthMonitorState {
    userStatus: UserStatus;
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
    | { type: OmcDispatchType.OMC_CLIENT_EVENT; payload: Event | CustomEvent<UserStatus>; }
    | { type:
            OmcDispatchType.DESTROY_CLIENT |
            OmcDispatchType.LENGTHY_LOGIN |
            OmcDispatchType.SHOW_LOGIN |
            OmcDispatchType.SHOW_LOGOUT |
            OmcDispatchType.EXECUTING_LOGOUT |
            OmcDispatchType.HIDE_DIALOG
    }

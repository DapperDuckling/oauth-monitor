import type { OauthMonitorClient } from "@dapperduckling/oauth-monitor-client";
import type { UserStatus } from "@dapperduckling/oauth-monitor-common";
import type { ComponentType } from "svelte";
import type { Writable } from "svelte/store";

// Re-export common types for convenience
export type { UserStatus } from "@dapperduckling/oauth-monitor-common";

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
    | { type: OmcDispatchType.OMC_CLIENT_EVENT; payload: CustomEvent<UserStatus> | { type: string, detail: any }; }
    | { type:
        OmcDispatchType.DESTROY_CLIENT |
        OmcDispatchType.LENGTHY_LOGIN |
        OmcDispatchType.SHOW_LOGIN |
        OmcDispatchType.SHOW_LOGOUT |
        OmcDispatchType.EXECUTING_LOGOUT |
        OmcDispatchType.HIDE_DIALOG
}

export interface SvelteConfig {
    /**
     * @desc Disable the built-in UI components (Login/Logout/Pill) if you want to build your own entirely outside the monitor
     */
    disableAuthComponents?: boolean;

    /**
     * @desc Pass a Svelte component to replace the default Login modal entirely
     */
    loginModalComponent?: ComponentType;

    /**
     * @desc Pass props to the loginModalComponent
     */
    loginModalProps?: Record<string, any>;

    /**
     * @desc Pass a Svelte component to replace the default Logout modal entirely
     */
    logoutModalComponent?: ComponentType;

    /**
     * @desc Pass props to the logoutModalComponent
     */
    logoutModalProps?: Record<string, any>;

    /**
     * @desc Pass a Svelte component to replace the default Floating Pill entirely
     */
    floatingPillComponent?: ComponentType;

    /**
     * @desc Pass props to the floatingPillComponent
     */
    floatingPillProps?: Record<string, any>;

    /**
     * @desc Defer the start of the plugin (auto-start disabled)
     */
    deferredStart?: boolean;
}

export type OauthMonitorStore = {
    subscribe: Writable<OauthMonitorState>['subscribe'];
    dispatch: (action: OauthMonitorStateActions) => void;
    reset: () => void;
};

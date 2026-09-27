import {Dispatch, useContext} from "react";
import type {UserProfile, UserStatus} from "@dapperduckling/oauth-monitor-common";
import type {OauthMonitorClient} from "@dapperduckling/oauth-monitor-client";
import type {OauthMonitorContextProps} from "./oauth-monitor-context.js";
import {OauthMonitorContext, OauthMonitorDispatchContext} from "./oauth-monitor-context.js";
import {OauthMonitorStateActions} from "./types.js";

/**
 * Access the full OAuth Monitor state and dispatch context.
 */
export const useOauthMonitor = <TProfile = UserProfile>(): [OauthMonitorContextProps<TProfile>, Dispatch<OauthMonitorStateActions<TProfile>>] => {
    const omcContext = useContext(OauthMonitorContext);
    const omcDispatch = useContext(OauthMonitorDispatchContext);
    if (!omcContext || !omcDispatch) {
        throw new Error("useOauthMonitor must be used in components that are children of a <OauthMonitorProvider> component.");
    }

    return [omcContext as OauthMonitorContextProps<TProfile>, omcDispatch as Dispatch<OauthMonitorStateActions<TProfile>>];
};

/**
 * Hook to access the reactive, up-to-date user profile claims.
 * Automatically updates when the session or user claims refresh.
 *
 * @example
 * ```tsx
 * const profile = useUserProfile<DoDUserProfile>();
 * return <div>Hello, {profile?.displayName}</div>;
 * ```
 */
export const useUserProfile = <TProfile = UserProfile>(): TProfile | undefined => {
    const [omcContext] = useOauthMonitor<TProfile>();
    return omcContext.userStatus.profile;
};

/**
 * Hook to access the full reactive user status (loggedIn, token expirations, profile claims).
 *
 * @example
 * ```tsx
 * const { loggedIn, accessExpires, profile } = useUserStatus();
 * ```
 */
export const useUserStatus = <TProfile = UserProfile>(): UserStatus<TProfile> => {
    const [omcContext] = useOauthMonitor<TProfile>();
    return omcContext.userStatus;
};

/**
 * Hook to access the underlying OauthMonitorClient instance for manual actions (authCheck, logout, etc).
 */
export const useOauthMonitorClient = (): OauthMonitorClient | undefined => {
    const [omcContext] = useOauthMonitor();
    return omcContext.omcClient;
};

export interface UseAuthReturn<TProfile = UserProfile> {
    /** True if the user currently has active, valid tokens */
    loggedIn: boolean;
    /** Full reactive user status object including expirations and profile */
    userStatus: UserStatus<TProfile>;
    /** Reactive user profile claims (DoD CAC claims, OIDC claims, etc.) */
    profile: TProfile | undefined;
    /** The underlying client instance */
    client: OauthMonitorClient | undefined;
    /** Manually trigger an immediate authentication check / token refresh */
    refresh: (force?: boolean) => Promise<void>;
    /** Open login window / flow */
    login: (newWindow?: boolean) => void;
    /** Trigger logout */
    logout: () => void;
}

/**
 * All-in-one developer hook providing reactive user info and auth action helpers.
 *
 * @example
 * ```tsx
 * const { loggedIn, profile, refresh, login, logout } = useAuth<DoDUserProfile>();
 * ```
 */
export const useAuth = <TProfile = UserProfile>(): UseAuthReturn<TProfile> => {
    const [omcContext] = useOauthMonitor<TProfile>();
    return {
        loggedIn: omcContext.userStatus.loggedIn,
        userStatus: omcContext.userStatus,
        profile: omcContext.userStatus.profile,
        client: omcContext.omcClient,
        refresh: async (force: boolean = true) => {
            await omcContext.omcClient?.authCheck(force);
        },
        login: (newWindow: boolean = true) => {
            omcContext.omcClient?.handleLogin(newWindow);
        },
        logout: () => {
            omcContext.omcClient?.handleLogout();
        },
    };
};



export interface UserProfile {
    displayName?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    preferredUsername?: string | undefined;
    sub?: string | undefined;
    rankCode?: string | undefined;
    branchOfServiceCode?: string | undefined;
    dutyOrgCode?: string | undefined;
    company?: string | undefined;
    department?: string | undefined;
    roles?: string[] | undefined;
    groups?: string[] | undefined;
    claims?: Record<string, unknown> | undefined;
}

export type UserStatus<TProfile = UserProfile> = {
    loggedIn: boolean;
    accessExpires: number;
    refreshExpires: number;
    profile?: TProfile | undefined;
}

export enum TokenType {
    ACCESS,
    REFRESH,
}

export type UserStatusWrapped<TProfile = UserProfile> = {
    checksum: string,
    payload: UserStatus<TProfile>,
    timestamp: number,
}

export type CustomRouteUrl = {
    _prefix?: string;
    loginPage?: string;
    logoutPage?: string;
    userStatus?: string;
}

export enum RouteEnum {
    // String enums MUST match key found in CustomRouteUrl type
    LOGIN_PAGE = "loginPage",
    LOGOUT_PAGE = "logoutPage",
    USER_STATUS = "userStatus",
}

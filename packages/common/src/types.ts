
export interface UserProfile {
    displayName?: string;
    name?: string;
    email?: string;
    preferredUsername?: string;
    sub?: string;
    rankCode?: string;
    branchOfServiceCode?: string;
    dutyOrgCode?: string;
    company?: string;
    department?: string;
    roles?: string[];
    groups?: string[];
    claims?: Record<string, unknown>;
}

export type UserStatus<TProfile = UserProfile> = {
    loggedIn: boolean;
    accessExpires: number;
    refreshExpires: number;
    profile?: TProfile;
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

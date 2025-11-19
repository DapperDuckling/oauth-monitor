
export type UserStatus = {
    loggedIn: boolean;
    accessExpires: number;
    refreshExpires: number;
}

export enum TokenType {
    ACCESS,
    REFRESH,
}

export type UserStatusWrapped = {
    checksum: string,
    payload: UserStatus,
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

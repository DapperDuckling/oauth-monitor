
export type UserStatus = {
    loggedIn: boolean;
    accessExpires: number;
    refreshExpires: number;
}

export type UserStatusWrapped = {
    md5: string,
    payload: UserStatus,
    timestamp: number,
}

export type CustomRouteUrl = {
    _prefix?: string;
    userStatus?: string;
}

export enum RouteEnum {
    // String enums MUST match key found in CustomRouteUrl type
    USER_STATUS = "userStatus",
}

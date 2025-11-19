import {ClientConfig, ClientEvent, LocalStorage} from "./types.js";
import {
    EventListener, TokenType,
    URL,
    type UserStatus,
    type UserStatusWrapped, isObject, getRoutePath, RouteEnum
} from "@dapperduckling/oauth-monitor-common";
import {is} from "typia";
import {setImmediate} from "./utils.js";


export class OauthMonitorClient {

    private static omcClient: OauthMonitorClient | undefined = undefined;

    private userStatusHash: string | undefined = undefined;
    private eventListener = new EventListener<ClientEvent>();

    private config: ClientConfig;
    private started = false;
    private isAuthCheckedWithServer = false;
    // private isAuthChecking = false;
    private authCheckAbort: AbortController['abort'] | null = null;
    private isDestroyed = false;
    private expirationWatchTimestamp: null | number = null;
    private expirationWatchSignal: null | number = null;

    public constructor(config: ClientConfig) {
        // Store the config
        this.config = config;

        // Add defaults
        this.config.eagerRefreshTime ??= 2.5;

        // Update the logger reference
        if (this.config.logger) {
            this.config.logger = this.config.logger.child({"Source": "OauthMonitorClient"})
        }

        // Listen for events from the storage api
        if (typeof window !== 'undefined') {
            window.addEventListener("storage", this.handleStorageEvent);
            window.addEventListener("focus", this.handleOnFocus);
        }
    }

    public start = () => {
        // Check to see if the client is already started
        if (this.started) {
            this.config.logger?.error(`Already started, cannot start again`);
        }

        // Set the auth to happen on the next tick
        this.authCheckNextTick();

        // Set the started flag
        this.started = true;
    }

    public isStarted = () => this.started;

    public addEventListener = (...args: Parameters<EventListener<ClientEvent>['addEventListener']>) => this.eventListener.addEventListener(...args);
    public removeEventListener = (...args: Parameters<EventListener<ClientEvent>['removeEventListener']>) => this.eventListener.removeEventListener(...args);

    private clearUserStatus = () => {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(LocalStorage.USER_STATUS);
    }

    public abortAuthCheck = () => {
        this.authCheckAbort?.();
    }

    private storeUserStatus = (data: UserStatusWrapped | undefined) => {
        if (typeof localStorage === 'undefined') return;
        try {
            if (data === undefined) return;

            // Grab the existing user status from local storage
            const existingUserStatus = JSON.parse(
                localStorage.getItem(LocalStorage.USER_STATUS) ?? "{}"
            ) as UserStatusWrapped;

            // Don't update the local storage if this data has the same checksum or is older
            // const hasDifferentHash = existingUserStatus["checksum"] === undefined || existingUserStatus["checksum"] !== data.checksum;
            const isMoreRecentData =
                existingUserStatus["timestamp"] === undefined ||
                existingUserStatus["timestamp"] < data.timestamp;
            if (isMoreRecentData) {
                // Store the new user status in local storage
                localStorage.setItem(LocalStorage.USER_STATUS, JSON.stringify(data));

                // Call the local storage update for this instance
                this.handleUpdatedUserStatus();
            }
        } catch (e) {
            this.config.logger?.error(`Could not update localStorage with user data`);
            if (isObject(e)) this.config.logger?.error(e);
        }
    }

    private handleStorageEvent = (event: StorageEvent) => {
        // Check for the user data update
        if (event.key !== LocalStorage.USER_STATUS) return;

        // Call helper function to handle any changes to the status
        this.handleUpdatedUserStatus();

        // Update the auth checked with server flag
        // (Storage events from other clients are the result of network calls)
        this.isAuthCheckedWithServer = true;
    }

    private handleOnFocus = () => {
        if (typeof window === 'undefined') return;
        this.authCheckNoWait();
    }

    handleLogin = (newWindow?: boolean) => {
        if (typeof window === 'undefined' || typeof self === 'undefined') return;
        // Abort the auth check
        this.abortAuthCheck();

        // Build the login url
        const loginUrl = new URL(getRoutePath(RouteEnum.LOGIN_PAGE, this.config.routePaths), this.config.apiServerOrigin);

        // Check if we should open a new window
        if (newWindow) {
            window.open(loginUrl.toString(), "_blank");
        } else {
            self.location.href = loginUrl.toString();
        }
    }

    handleLogout = () => {
        if (typeof self === 'undefined') return;
        // Clear the local storage
        this.clearUserStatus();

        // Build the logout url
        const logoutUrl = new URL(getRoutePath(RouteEnum.LOGOUT_PAGE, this.config.routePaths), this.config.apiServerOrigin);

        // Redirect to the logout page
        self.location.href = logoutUrl.toString();
    }

    private handleUpdatedUserStatus = () => {

        // Grab the user status from local storage
        const userStatusWrapped = OauthMonitorClient.getStoredUserStatusWrapped();

        // Check for no result
        if (userStatusWrapped === undefined) return;

        // Cancel any background requests
        this.abortAuthCheck();

        // Check to see if the hash is not different
        if (this.userStatusHash === userStatusWrapped["checksum"]) return;

        // Grab the user status payload
        const userStatus = userStatusWrapped["payload"];

        // Check for a missing payload
        if (userStatus === undefined) return;

        // Update the user status hash
        this.userStatusHash = userStatusWrapped["checksum"];

        // Set up the access token expiration function
        this.setupExpirationListener(userStatus);

        this.eventListener.dispatchEvent<UserStatus>(ClientEvent.USER_STATUS_UPDATED, userStatus);
    }

    private setupExpirationListener = (userStatus: UserStatus) => {

        // Check if eager refresh is disabled
        if (typeof this.config.eagerRefreshTime !== "number") return;

        // Check if there is already an expiration listener
        if (this.expirationWatchSignal && this.expirationWatchTimestamp === userStatus.accessExpires) return;

        // Abort any previous expiration listener
        if (this.expirationWatchSignal) clearTimeout(this.expirationWatchSignal);

        // Calculate time remaining until eager refresh should occur
        const secondsRemaining = userStatus.accessExpires - Date.now()/1000 - (this.config.eagerRefreshTime * 60);

        // Check if we have a negative value
        if (userStatus.accessExpires < 0) return;

        // Set up the expiration listener
        if (typeof window !== 'undefined') {
            this.expirationWatchSignal = window.setTimeout(async () => {
                console.debug(`Access token expiration within ${this.config.eagerRefreshTime} minutes, eagerly fetching new token`);
                await this.authCheck(true);
            }, Math.max(secondsRemaining * 1000, 15000));
        }

        // Record the timeout's target timestamp
        this.expirationWatchTimestamp = userStatus.accessExpires;

    }

    public authCheck = async (force?: boolean) => {

        // Execute the synchronous auth check portion
        if (!force && this.authCheckNoWait() && this.userStatusHash !== undefined) return;

        // Dispatch the start auth check event
        this.eventListener.dispatchEvent(ClientEvent.START_AUTH_CHECK);

        // Check if auth check already running
        if (this.authCheckAbort !== null) {
            console.debug(`Is already auth checking, will not make another attempt`);
            return;
        }

        // Prepare abort controller
        const abortController = new AbortController();
        this.authCheckAbort = () => abortController.abort();
        const userStatusUrl = `${this.config.apiServerOrigin}${getRoutePath(RouteEnum.USER_STATUS, this.config.routePaths)}`;

        try {
            // Check the user status
            const response = await fetch(userStatusUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "credentials": "include"
                },
                signal: abortController.signal,
            });

            // Handle 401, 403, or other non-2xx errors
            if (!response.ok) {
                // noinspection ExceptionCaughtLocallyJS
                this.eventListener.dispatchEvent(ClientEvent.INVALID_TOKENS);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const userStatusWrapped = await response.json();

            if (!is<UserStatusWrapped>(userStatusWrapped)) {
                this.config.logger?.error("Validation Failed:", userStatusWrapped);
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("Response validation failed: Invalid UserStatus shape");
            }

            // Advise finished auth check
            this.eventListener.dispatchEvent<UserStatus>(ClientEvent.END_AUTH_CHECK, userStatusWrapped.payload);

            // Update the auth checked with server flag
            this.isAuthCheckedWithServer = true;

            // Update the user status and interface
            this.storeUserStatus(userStatusWrapped);

        } catch (error) {
            this.eventListener.dispatchEvent(ClientEvent.LOGIN_ERROR);
        } finally {
            // Clear the abort function
            this.authCheckAbort = null;
        }
    }

    public destroy = () => {
        this.abortAuthCheck();
        if (typeof window !== 'undefined') {
            window.removeEventListener("storage", this.handleStorageEvent);
            window.removeEventListener("focus", this.handleOnFocus);
        }
        this.isDestroyed = true;
    }

    public authCheckNoWait = () => {

        // Check for a valid access token
        if (OauthMonitorClient.isTokenCurrent(TokenType.ACCESS)) {
            // Initial check if the user status has not been populated
            if (this.userStatusHash === undefined && this.config.fastInitialAuthCheck) {
                // Attempt to update the user status with cached data immediately
                this.handleUpdatedUserStatus();

                // Perform a background check of the login status
                this.authCheckNextTick(true);
            }

            return true;
        }

        // Check for a valid refresh token
        const validRefreshToken = OauthMonitorClient.isTokenCurrent(TokenType.REFRESH);

        // Perform background login
        this.authCheckNextTick(true);

        // Check for an invalid refresh token as well
        if (!validRefreshToken) {
            // Send an invalid tokens event
            this.eventListener.dispatchEvent(ClientEvent.INVALID_TOKENS);
        }

        return false;
    }

    private authCheckNextTick = (force?: boolean) => setImmediate(async () => {
        if (this.isDestroyed) return;
        await this.authCheck(force);
    });

    private static getStoredUserStatusWrapped = () => {
        if (typeof localStorage === 'undefined') return undefined;
        // Grab the user status from local storage
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const userStatusWrapped = JSON.parse(
            localStorage.getItem(LocalStorage.USER_STATUS) ?? "{}"
        );

        // Check the resultant object for the proper type
        return is<UserStatusWrapped>(userStatusWrapped) ? userStatusWrapped : undefined;
    }

    static isTokenCurrent = (type: TokenType) => {

        // Grab the user status from local storage
        const userStatusWrapped = OauthMonitorClient.getStoredUserStatusWrapped();

        // Check for no result
        if (userStatusWrapped === undefined) return;

        let expirationTimestamp;

        switch (type) {
            case TokenType.ACCESS:
                expirationTimestamp = userStatusWrapped.payload.accessExpires;

                // Ensure logged in
                if (!userStatusWrapped.payload.loggedIn) return false;

                break;
            case TokenType.REFRESH:
                expirationTimestamp = userStatusWrapped.payload.refreshExpires;
                break;
            default:
                throw new Error("Invalid token type");
        }

        // Check for an invalid number
        if (Number.isNaN(expirationTimestamp)) return false;

        return (Date.now() < expirationTimestamp * 1000);
    }

    static instance = (config: ClientConfig): OauthMonitorClient => {
        // Check if the client has already been instantiated
        if (this.omcClient && !this.omcClient.isDestroyed) {
            // Ensure the config hasn't changed
            if (this.omcClient.config !== config) {
                throw new Error("OauthMonitorClient already instantiated, cannot re-instantiate with a different config.");
            }

            // Return the existing client
            return this.omcClient;
        }

        // Initiate the singleton
        this.omcClient = new OauthMonitorClient(config);

        // Return the client
        return this.omcClient;
    }
}

export const oauthMonitorClient = (config: ClientConfig) => OauthMonitorClient.instance(config);

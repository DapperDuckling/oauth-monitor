import {
    SilentLoginEvent,
    type SilentLoginMessage,
    TokenType,
    type UserStatus,
    type UserStatusWrapped,
    URL, isObject,
} from "@dapperduckling/oauth-monitor-common";
import {rateLimit, setImmediate} from "./utils.js";
import {is} from "typia";
import {type ClientConfig, ClientEvent, LocalStorage} from "./types.js";
import {EventListener} from "@dapperduckling/oauth-monitor-common";

export class OauthMonitorClient {

    private static omcClient: OauthMonitorClient | undefined = undefined;

    // Create a random token if in a secure context. If not in a secure context, just generate a non-cryptographically secure "random" token
    // Dev note: This is merely a defense-in-depth approach that is paired with origin checking anyway. If this app is running in an unsecure
    //            context already, the user has already lost to a MITM attack.
    private token = self.isSecureContext
        ? self.crypto.randomUUID()
        : Math.floor(Math.random() * 100_000).toString();


    private userStatusHash: string | undefined = undefined;
    private eventListener = new EventListener<ClientEvent>();

    private config: ClientConfig;
    private acceptableOrigins: string[];
    private userStatusAbortController: AbortController | undefined = undefined;
    private started = false;
    private isAuthChecking = false;
    private isDestroyed = false;
    private expirationWatchTimestamp: null | number = null;
    private expirationWatchSignal: null | number = null;

    private silentLoginTimeout: number | undefined = undefined;

    private silentLoginListenerTimeout: number | undefined = undefined;

    public constructor(config: ClientConfig) {
        // Store the config
        this.config = config;

        // Add defaults
        this.config.eagerRefreshTime ??= 2.5;

        // Update the logger reference
        if (this.config.logger) {
            this.config.logger = this.config.logger.child({"Source": "OauthMonitorClient"})
        }

        // Build the list of acceptable origins
        this.acceptableOrigins = [self.origin];

        // Validate the api server origin input
        if (config.apiServerOrigin !== undefined) {
            // Check for a valid URL
            if (!URL.canParse(config.apiServerOrigin)) {
                throw new Error("Invalid apiServerOrigin specified, cannot parse with `URL`");
            }

            // Calculate the origin from the provided "origin"
            const calculatedOrigin = new URL(config.apiServerOrigin).origin;

            // Check if the api server origin is an actual origin
            if (new URL(config.apiServerOrigin).origin !== config.apiServerOrigin) {
                throw new Error(`Invalid apiServerOrigin specified, calculated origin ${calculatedOrigin} does not match input ${config.apiServerOrigin}.`);
            }

            // Add the api server origin to the acceptable origins
            this.acceptableOrigins.push(config.apiServerOrigin);
        }

        // Listen for events from the storage api
        window.addEventListener("storage", this.handleStorageEvent);

        // Setup an on window focus listener
        window.addEventListener("focus", this.handleOnFocus);

        // Setup the silent login message listener
        window.addEventListener("message", this.handleWindowMessage);
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
        localStorage.removeItem(LocalStorage.USER_STATUS);
    }

    private storeUserStatus = (data: UserStatusWrapped | undefined) => {
        try {
            if (data === undefined) return;

            // Grab the existing user status from local storage
            const existingUserStatus = JSON.parse(
                localStorage.getItem(LocalStorage.USER_STATUS) ?? "{}"
            );

            // Don't update the local storage if this data has the same checksum or is older
            // const hasDifferentHash = existingUserStatus["md5"] === undefined || existingUserStatus["md5"] !== data.md5;
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

    private handleLoginError = () => {
        // Remove the iframe
        this.removeSilentIframe();

        // Reset the auth check flag
        this.isAuthChecking = false;

        // // Check for a valid token at this point
        // if (OauthMonitorClient.isTokenCurrent(TokenType.ACCESS)) return;

        // Send the login error event
        this.eventListener.dispatchEvent(ClientEvent.LOGIN_ERROR);
    }

    private handleWindowMessage = (event: MessageEvent<SilentLoginMessage>) => {

        // Ignore message not from our an allowed origin or does not have the correct token
        if (!this.acceptableOrigins.includes(event.origin) || event.data.token !== this.token) return;

        // Extract the silent login message
        const silentLoginMessage = event.data;
        this.config.logger?.debug(`OMC Parent received: ${silentLoginMessage.event}`);

        // Handle the message
        switch (silentLoginMessage.event) {
            case SilentLoginEvent.CHILD_ALIVE:
                this.listenerAwake = true;
                clearTimeout(this.silentLoginTimeout);
                break;
            case SilentLoginEvent.LOGIN_LISTENER_ALIVE:
                this.loginListenerAwake = true;
                clearTimeout(this.silentLoginListenerTimeout);
                break;
            case SilentLoginEvent.LOGIN_REQUIRED:
            case SilentLoginEvent.LOGIN_SUCCESS:

                // Update the auth checked with server flag
                this.isAuthCheckedWithServer = true;

                // Update the user status and interface
                this.storeUserStatus(silentLoginMessage.data);

                // Remove the iframes
                this.removeSilentIframe();

                if (silentLoginMessage.event === SilentLoginEvent.LOGIN_SUCCESS) {
                    this.removeListenerIframe();
                }

                // Reset the auth check flag
                this.isAuthChecking = false;
                break;
            case SilentLoginEvent.LOGIN_ERROR:
            default:
                this.handleLoginError();
        }
    }

    public abortBackgroundLogins = () => {
        this.isAuthChecking = false;
        this.userStatusAbortController?.abort();
    }

    public destroy = () => {
        this.abortBackgroundLogins();
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

    // private refreshAccessWithRefresh = async () => {
    //     // Check for a valid refresh token
    //     const validRefreshToken = OauthMonitorClient.isTokenCurrent(TokenType.REFRESH);
    //
    //     // With a valid refresh token, attempt to update
    //     if (!validRefreshToken) return false;
    //
    //     // Create a new abort controller
    //     this.userStatusAbortController = new AbortController();
    //
    //     try {
    //         // Make a request to the user-status page in order to update the token
    //         const userStatusUrl = `${this.config.apiServerOrigin}${getRoutePath(RouteEnum.USER_STATUS, this.config.routePaths)}`;
    //
    //         // Attempt to log out using a fetch
    //         const userStatusFetch = await fetch(`${userStatusUrl}`, {
    //             credentials: "include",
    //             signal: this.userStatusAbortController.signal,
    //         });
    //
    //         // Clear the abort controller
    //         this.userStatusAbortController = undefined;
    //
    //         // Grab the result
    //         const userStatusWrapped = await userStatusFetch.json();
    //
    //         // Check for a message we were not expecting
    //         if (!is<UserStatusWrapped>(userStatusWrapped)) {
    //             // noinspection ExceptionCaughtLocallyJS
    //             throw new Error(`Invalid response from server`);
    //         }
    //
    //         // Checked for not logged in
    //         if (!userStatusWrapped.payload.loggedIn) return false;
    //
    //         // Update the user status
    //         this.storeUserStatus(userStatusWrapped);
    //
    //         return true;
    //
    //     } catch (e) {
    //         if (!(e instanceof DOMException && e.name === 'AbortError')) {
    //             // Log the error
    //             this.config.logger?.error(`Failed to refresh access token in the background`);
    //             if (isObject(e)) this.config.logger?.error(e);
    //         }
    //     }
    //
    //     return false;
    // }

    private authCheckNextTick = (force?: boolean) => setImmediate(async () => {
        if (this.isDestroyed) return;
        await this.authCheck(force);
    });

    public authCheck = async (force?: boolean) => {

        // Execute the synchronous auth check portion
        if (!force && this.authCheckNoWait() && this.userStatusHash !== undefined) return;

        // Prevent multiple async auth checks from occurring
        if (this.isAuthChecking) {
            console.debug(`Is already auth checking, will not make another attempt`);
            return;
        }

        // Set the flag
        this.isAuthChecking = true;

        // Dispatch the start silent login event
        this.eventListener.dispatchEvent(ClientEvent.START_SILENT_LOGIN);

        // Attempt to update the auth with the refresh token
        if (await this.refreshAccessWithRefresh()) {
            this.isAuthChecking = false;
            this.isAuthCheckedWithServer = true;
            return;
        }

        // Attempt to reauthenticate silently
        this.silentLogin();
    }

    private handleOnFocus = () => {
        this.authCheckNoWait();
    }

    private static getStoredUserStatusWrapped = () => {
        // Grab the user status from local storage
        const userStatusWrapped = JSON.parse(
            localStorage.getItem(LocalStorage.USER_STATUS) ?? "{}"
        );

        // Check the resultant object for the proper type
        return is<UserStatusWrapped>(userStatusWrapped) ? userStatusWrapped : undefined;
    }

    private handleUpdatedUserStatus = () => {

        // Grab the user status from local storage
        const userStatusWrapped = OauthMonitorClient.getStoredUserStatusWrapped();

        // Check for no result
        if (userStatusWrapped === undefined) return;

        // Cancel any background requests
        this.abortBackgroundLogins();

        // Check to see if the hash is not different
        if (this.userStatusHash === userStatusWrapped["md5"]) return;

        // Grab the user status payload
        const userStatus = userStatusWrapped["payload"];

        // Check for a missing payload
        if (userStatus === undefined) return;

        // Update the user status hash
        this.userStatusHash = userStatusWrapped["md5"];

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
        this.expirationWatchSignal = window.setTimeout(async () => {
            console.debug(`Access token expiration within ${this.config.eagerRefreshTime} minutes, eagerly fetching new token`);
            await this.authCheck(true);
        }, Math.max(secondsRemaining * 1000, 15000));

        // Record the timeout's target timestamp
        this.expirationWatchTimestamp = userStatus.accessExpires;

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

    static isTokenCurrent = (type: TokenType) => {

        // Grab the user status from local storage
        const userStatusWrapped = OauthMonitorClient.getStoredUserStatusWrapped();

        // Check for no result
        if (userStatusWrapped === undefined) return;

        let expirationTimestamp;

        switch (type) {
            case TokenType.ACCESS:
                expirationTimestamp = userStatusWrapped.payload.accessExpires;
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
        if (this.omcClient) {
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

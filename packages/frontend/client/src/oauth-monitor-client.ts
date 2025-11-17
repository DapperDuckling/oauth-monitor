import {ClientConfig, ClientEvent, LocalStorage} from "./types";
import {
    EventListener,
    SilentLoginEvent,
    type SilentLoginMessage,
    URL,
    type UserStatus,
    type UserStatusWrapped
} from "@dapperduckling/oauth-monitor-common";
import {is} from "typia";


export class OauthMonitorClient {

    private static omcClient: OauthMonitorClient | undefined = undefined;

    private userStatusHash: string | undefined = undefined;
    private eventListener = new EventListener<ClientEvent>();

    private config: ClientConfig;
    private acceptableOrigins: string[];
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
        this.authCheckNoWait();
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


    private static getStoredUserStatusWrapped = () => {
        // Grab the user status from local storage
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const userStatusWrapped = JSON.parse(
            localStorage.getItem(LocalStorage.USER_STATUS) ?? "{}"
        );

        // Check the resultant object for the proper type
        return is<UserStatusWrapped>(userStatusWrapped) ? userStatusWrapped : undefined;
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

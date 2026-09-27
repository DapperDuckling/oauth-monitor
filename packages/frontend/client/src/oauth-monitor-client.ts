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
    private authCheckAbort: AbortController['abort'] | null = null;
    private isDestroyed = false;
    private expirationWatchTimestamp: null | number = null;
    private expirationWatchSignal: null | number = null;
    private heartbeatIntervalSignal: number | null = null;
    private heartbeatAbortController: AbortController | null = null;

    public constructor(config: ClientConfig) {
        // Store the config
        this.config = config;

        // Add defaults
        this.config.eagerRefreshTime ??= 2.5;

        // Update the logger reference
        if (this.config.logger) {
            this.config.logger = this.config.logger.child?.({"Source": "OauthMonitorClient"})
        }
    }

    public start = () => {
        // Check to see if the client is already started
        if (this.started) {
            this.config.logger?.error(`Already started, cannot start again`);
        }

        // Listen for events from the storage api
        if (typeof window !== 'undefined') {
            window.addEventListener("storage", this.handleStorageEvent);
            window.addEventListener("focus", this.handleOnFocus);
            window.addEventListener('message', this.handleMessage);
        }

        // Set the auth to happen on the next tick
        this.authCheckNextTick();

        // Setup standing heartbeat leader
        this.setupHeartbeatLeader();

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

    private handleMessage =  (event: MessageEvent) => {
        // Security check
        if (event.origin !== window.location.origin) return;

        // Check type
        if (is<UserStatusWrapped>(event.data)) {
            this.storeUserStatus(event.data);
        }
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
        if (userStatusWrapped === undefined) {
            this.eventListener.dispatchEvent(ClientEvent.INVALID_TOKENS);
            return;
        }

        // Cancel any background requests
        this.abortAuthCheck();

        // Check to see if the hash is not different
        if (this.userStatusHash === userStatusWrapped["checksum"]) return;

        // Grab the user status payload
        const userStatus = userStatusWrapped["payload"];

        // Check for a missing payload
        if (userStatus === undefined) {
            this.eventListener.dispatchEvent(ClientEvent.INVALID_TOKENS);
            return;
        }

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
                if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
                    await navigator.locks.request('omc_eager_refresh', { ifAvailable: true }, async (lock) => {
                        if (!lock) {
                            console.debug('Another tab is eagerly refreshing the session, skipping refresh in this tab');
                            return;
                        }
                        console.debug(`Access token expiration within ${this.config.eagerRefreshTime} minutes, eagerly fetching new token`);
                        await this.authCheck(true);
                    });
                } else {
                    console.debug(`Access token expiration within ${this.config.eagerRefreshTime} minutes, eagerly fetching new token`);
                    await this.authCheck(true);
                }
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
                this.eventListener.dispatchEvent(ClientEvent.INVALID_TOKENS);
                this.config.logger?.debug("Auth check not okay, assuming not authenticated.");
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const responseData = await response.json();
            const userStatusWrapped = this.normalizeUserStatus(responseData);

            // Advise finished auth check
            this.eventListener.dispatchEvent<UserStatus>(ClientEvent.END_AUTH_CHECK, userStatusWrapped.payload);

            // Update the auth checked with server flag
            this.isAuthCheckedWithServer = true;

            // Update the user status and interface
            this.storeUserStatus(userStatusWrapped);

            // If running inside an auth popup and logged in, notify opener and close
            if (userStatusWrapped.payload.loggedIn) {
                this.checkAndHandlePopupCloser(userStatusWrapped);
            }

        } catch (error) {
            this.eventListener.dispatchEvent(ClientEvent.LOGIN_ERROR);
            this.config.logger?.debug("Auth check failed.");
        } finally {
            // Clear the abort function
            this.authCheckAbort = null;
        }
    }

    private checkAndHandlePopupCloser = (userStatusWrapped: UserStatusWrapped) => {
        OauthMonitorClient.notifyOpenerAndClose(userStatusWrapped);
    }

    public static notifyOpenerAndClose = (status?: UserStatusWrapped) => {
        if (typeof window === 'undefined') return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.opener && !win.opener.closed && win.opener !== window) {
            const data = status ?? OauthMonitorClient.getStoredUserStatusWrapped();
            if (data) {
                try {
                    win.opener.postMessage(data, window.location.origin);
                } catch {
                    // Suppress cross-origin restriction
                }
            }
            window.close();
        }
    }

    private normalizeUserStatus = (data: unknown): UserStatusWrapped => {
        if (is<UserStatusWrapped>(data)) {
            return data;
        }

        if (data && typeof data === 'object') {
            const raw = data as Record<string, unknown>;

            // Check if it's already an unwrapped UserStatus
            if (typeof raw['loggedIn'] === 'boolean' && typeof raw['accessExpires'] === 'number') {
                return {
                    checksum: JSON.stringify(raw),
                    timestamp: Date.now(),
                    payload: raw as unknown as UserStatus,
                };
            }

            // Check if it's an oauth2-proxy userinfo response
            const hasUserIdentifier = typeof raw['user'] === 'string' ||
                typeof raw['email'] === 'string' ||
                typeof raw['preferredUsername'] === 'string' ||
                typeof raw['preferred_username'] === 'string' ||
                typeof raw['sub'] === 'string';

            if (this.config.userinfoMode || hasUserIdentifier) {
                const nowSec = Math.floor(Date.now() / 1000);
                const lifespan = (typeof this.config.heartbeatInterval === 'number' && this.config.heartbeatInterval > 0)
                    ? this.config.heartbeatInterval * 2
                    : 300;

                const profile = {
                    displayName: (raw['name'] ?? raw['displayName'] ?? raw['user']) as string | undefined,
                    name: (raw['name'] ?? raw['displayName']) as string | undefined,
                    email: raw['email'] as string | undefined,
                    preferredUsername: (raw['preferredUsername'] ?? raw['preferred_username'] ?? raw['user']) as string | undefined,
                    sub: (raw['sub'] ?? raw['user']) as string | undefined,
                    rankCode: raw['rankCode'] as string | undefined,
                    branchOfServiceCode: raw['branchOfServiceCode'] as string | undefined,
                    dutyOrgCode: (raw['dutyOrgCode'] ?? raw['company']) as string | undefined,
                    company: (raw['company'] ?? raw['dutyOrgCode']) as string | undefined,
                    department: raw['department'] as string | undefined,
                    roles: Array.isArray(raw['roles']) ? (raw['roles'] as string[]) : undefined,
                    groups: Array.isArray(raw['groups']) ? (raw['groups'] as string[]) : undefined,
                    claims: raw,
                };

                return {
                    checksum: JSON.stringify(raw),
                    timestamp: Date.now(),
                    payload: {
                        loggedIn: true,
                        accessExpires: nowSec + lifespan,
                        refreshExpires: nowSec + lifespan,
                        profile,
                    },
                };
            }
        }

        this.config.logger?.error({ data }, "Validation Failed");
        // noinspection ExceptionCaughtLocallyJS
        throw new Error("Response validation failed: Invalid UserStatus shape");
    }

    private setupHeartbeatLeader = () => {
        if (!this.config.heartbeatInterval || this.config.heartbeatInterval <= 0) return;
        if (typeof window === 'undefined') return;

        this.heartbeatAbortController?.abort();
        const abortController = new AbortController();
        this.heartbeatAbortController = abortController;

        if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
            navigator.locks.request('omc_heartbeat_leader', { signal: abortController.signal }, async () => {
                this.config.logger?.debug('Elected as heartbeat leader tab');
                this.startHeartbeatTimer();
                return new Promise<void>((resolve) => {
                    abortController.signal.addEventListener('abort', () => {
                        this.stopHeartbeatTimer();
                        resolve();
                    });
                });
            }).catch((err: unknown) => {
                if (err instanceof Error && err.name !== 'AbortError') {
                    this.config.logger?.error({ err }, 'Heartbeat leader lock failed');
                }
            });
        } else {
            this.startHeartbeatTimer();
        }
    }

    private startHeartbeatTimer = () => {
        if (!this.config.heartbeatInterval || this.config.heartbeatInterval <= 0) return;
        if (typeof window === 'undefined') return;
        this.stopHeartbeatTimer();

        const intervalMs = this.config.heartbeatInterval * 1000;
        this.heartbeatIntervalSignal = window.setInterval(async () => {
            const stored = OauthMonitorClient.getStoredUserStatusWrapped();
            if (!stored || !stored.payload.loggedIn) {
                this.config.logger?.debug('User is not logged in, skipping heartbeat poll');
                return;
            }
            this.config.logger?.debug('Heartbeat leader tab executing periodic auth check');
            await this.authCheck(true);
        }, intervalMs);
    }

    private stopHeartbeatTimer = () => {
        if (this.heartbeatIntervalSignal !== null && typeof window !== 'undefined') {
            clearInterval(this.heartbeatIntervalSignal);
            this.heartbeatIntervalSignal = null;
        }
    }

    public destroy = () => {
        this.abortAuthCheck();
        this.stopHeartbeatTimer();
        this.heartbeatAbortController?.abort();
        if (typeof window !== 'undefined') {
            window.removeEventListener("storage", this.handleStorageEvent);
            window.removeEventListener("focus", this.handleOnFocus);
            window.removeEventListener("message", this.handleMessage);
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

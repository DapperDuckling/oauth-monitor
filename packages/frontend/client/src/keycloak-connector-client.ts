import {
    LoginWindowEvent,
    type LoginWindowMessage,
    type UserStatus,
    isObject,
    AuthMonitorConfig,
} from "@dapperduckling/keycloak-connector-common";
import {setImmediate} from "./utils.js";
import {is} from "typia";
import {type ClientConfig, ClientEvent, LocalStorage} from "./types.js";
import {EventListener} from "@dapperduckling/keycloak-connector-common";

export class AuthMonitorClient {

    private static kccClient: AuthMonitorClient | undefined = undefined;
    private static readonly LISTENER_IFRAME_ID = "listener-login-iframe";
    private static readonly MAX_LOGIN_LISTENER_WAIT_SECS = 30;

    // Create a random token if in a secure context. If not in a secure context, just generate a non-cryptographically secure "random" token
    // Dev note: This is merely a defense-in-depth approach that is paired with origin checking anyway. If this app is running in an unsecure
    //            context already, the user has already lost to a MITM attack.
    private token = self.isSecureContext
        ? self.crypto.randomUUID()
        : Math.floor(Math.random() * 100_000).toString();


    private userStatus: UserStatus | undefined = undefined;
    private eventListener = new EventListener<ClientEvent>();

    private config: AuthMonitorConfig;
    private acceptableOrigins: string[];
    private userStatusAbortController: AbortController | undefined = undefined;
    private started = false;
    private isAuthChecking = false;
    private isDestroyed = false;

    private loginListenerInitiated: number | undefined = undefined;
    private loginListenerAwake = false;
    private silentLoginListenerTimeout: number | undefined = undefined;
    private uniqueListenerIframeId = `${AuthMonitorClient.LISTENER_IFRAME_ID}-${this.token}`;

    public constructor(config: AuthMonitorConfig) {
        // Store the config
        this.config = config;

        // Build the list of acceptable origins
        this.acceptableOrigins = [self.origin];

        // Listen for events from the storage api
        window.addEventListener("storage", this.handleStorageEvent);

        // Setup an on window focus listener
        window.addEventListener("focus", this.authCheck);

        // Setup the silent login message listener
        window.addEventListener("message", this.handleWindowMessage);
    }

    public start = () => {
        // Check to see if the client is already started
        if (this.started) {
            console.error(`Already started, cannot start again`);
        }

        // Set the auth to happen on the next tick
        this.authCheck();

        // Set the started flag
        this.started = true;
    }

    public isStarted = () => this.started;

    public addEventListener = (...args: Parameters<EventListener<ClientEvent>['addEventListener']>) => this.eventListener.addEventListener(...args);
    public removeEventListener = (...args: Parameters<EventListener<ClientEvent>['removeEventListener']>) => this.eventListener.removeEventListener(...args);

    private storeUserStatus = (data: UserStatus | undefined) => {
        try {
            if (data === undefined) return;

            localStorage.setItem(LocalStorage.USER_STATUS, JSON.stringify(data));

            this.handleUpdatedUserStatus();
        } catch (e) {
            console.error(`Could not update localStorage with user data`);
            if (isObject(e)) console.error(e);
        }
    }

    private handleWindowMessage = (event: MessageEvent<LoginWindowMessage>) => {

        // Ignore message not from our an allowed origin or does not have the correct token
        if (!this.acceptableOrigins.includes(event.origin) || (event.data as any).token !== this.token) return;

        const message = event.data;
        console.debug(`AuthMonitor parent received: ${message.event}`);

        // Handle the message
        switch (message.event) {
            case LoginWindowEvent.LOGIN_LISTENER_ALIVE:
                this.loginListenerAwake = true;
                clearTimeout(this.silentLoginListenerTimeout);
                break;
            case LoginWindowEvent.LOGIN_SUCCESS:
                this.authCheck();
                this.removeListenerIframe();
                break;
        }
    }

    private loginWindowListener = () => {

        // Check if the listener is already up
        if (this.loginListenerAwake) return;

        // Check if the previous login listener is still initiating
        if (this.loginListenerInitiated !== undefined &&
            this.loginListenerInitiated + AuthMonitorClient.MAX_LOGIN_LISTENER_WAIT_SECS * 1000 > Date.now()) return;

        // Remove any existing login listener iframe
        this.removeListenerIframe();

        // Check for an existing silent listener
        if (document.querySelectorAll(`#${this.uniqueListenerIframeId}`).length > 0) return;

        // Make an iframe to listen for successful authentications
        const iframe = document.createElement("iframe");
        iframe.id = this.uniqueListenerIframeId;
        iframe.src = `${this.config.loginUrl}?source-origin=${self.origin}&silent-token=${this.token}`;
        iframe.setAttribute(
            "sandbox",
            "allow-scripts allow-same-origin"
        );
        iframe.style.display = "none";
        iframe.onload = () => {
            this.silentLoginListenerTimeout = window.setTimeout(() => {
                // Check for a successful listener
                if (this.loginListenerAwake) return;

                // Log
                console.debug(`Failed to start login listener`);

                // Wipe the login listener
                this.removeListenerIframe();
            }, 500);
        }

        // Mount the iframe
        document.body.appendChild(iframe);

        // Store the initiated time
        this.loginListenerAwake = false;
        this.loginListenerInitiated = Date.now();
    }

    public abortBackgroundCheck = () => {
        this.isAuthChecking = false;
        this.userStatusAbortController?.abort();
    }

    public destroy = () => {
        this.abortBackgroundCheck();
        this.removeListenerIframe();
        this.isDestroyed = true;
    }

    private removeListenerIframe = () => {
        document.querySelectorAll(`#${this.uniqueListenerIframeId}`).forEach(elem => elem.remove());
        this.loginListenerInitiated = undefined;
        this.loginListenerAwake = false;
    };

    public authCheck = async () => {
        if (this.isDestroyed || this.isAuthChecking) return;

        this.isAuthChecking = true;
        this.eventListener.dispatchEvent(ClientEvent.AUTH_CHECK_STARTED);

        try {
            const response = await fetch(this.config.statusUrl, { signal: this.userStatusAbortController?.signal });
            const loggedIn = response.ok;

            if (this.userStatus?.loggedIn !== loggedIn) {
                const newUserStatus = { loggedIn };
                this.storeUserStatus(newUserStatus);
                this.eventListener.dispatchEvent<UserStatus>(ClientEvent.USER_STATUS_UPDATED, newUserStatus);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            if (this.userStatus?.loggedIn) {
                const newUserStatus = { loggedIn: false };
                this.storeUserStatus(newUserStatus);
                this.eventListener.dispatchEvent<UserStatus>(ClientEvent.USER_STATUS_UPDATED, newUserStatus);
            }
        }

        this.isAuthChecking = false;
    };

    private static getStoredUserStatus = (): UserStatus | undefined => {
        const statusStr = localStorage.getItem(LocalStorage.USER_STATUS);
        if (!statusStr) return undefined;
        try {
            const status = JSON.parse(statusStr);
            return is<UserStatus>(status) ? status : undefined;
        } catch {
            return undefined;
        }
    }

    private handleUpdatedUserStatus = () => {
        const userStatus = AuthMonitorClient.getStoredUserStatus();
        if (userStatus?.loggedIn !== this.userStatus?.loggedIn) {
            this.userStatus = userStatus;
            this.eventListener.dispatchEvent<UserStatus>(ClientEvent.USER_STATUS_UPDATED, userStatus);
        }
    }

    private handleStorageEvent = (event: StorageEvent) => {
        if (event.key !== LocalStorage.USER_STATUS) return;
        this.handleUpdatedUserStatus();
    }

    /**
     * Prepares the client to smoothly handle logins through a new window
     */
    prepareToHandleNewWindowLogin = () => this.loginWindowListener();

    handleLogin = () => {
        this.abortBackgroundCheck();
        window.open(this.config.loginUrl, "_blank", "rel=opener");
    }

    static instance = (config: AuthMonitorConfig): AuthMonitorClient => {
        if (this.kccClient) {
            if (this.kccClient.config !== config) {
                throw new Error("AuthMonitorClient already instantiated, cannot re-instantiate with a different config.");
            }
            return this.kccClient;
        }

        this.kccClient = new AuthMonitorClient(config);
        return this.kccClient;
    }
}

export const authMonitorClient = (config: AuthMonitorConfig) => AuthMonitorClient.instance(config);

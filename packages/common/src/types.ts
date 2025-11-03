/**
 * Configuration for the frontend authentication monitor.
 */
export type AuthMonitorConfig = {
  /**
   * The URL to poll to check the user's authentication status.
   * A 2xx response means "authenticated", while a 4xx/5xx response means "unauthenticated".
   */
  statusUrl: string;

  /**
   * The URL to redirect the user to when they need to log in.
   */
  loginUrl: string;
};

/**
 * Represents the user's authentication status from the frontend's perspective.
 */
export type UserStatus = {
    loggedIn: boolean;
}

/**
 * Events used for cross-window communication during the login flow.
 * This allows the main application window to detect when a login is successful
 * in a separate login window.
 */
export enum LoginWindowEvent {
    /**
     * Sent by the main window to the login window to confirm it's alive.
     */
    CHILD_ALIVE = "CHILD_ALIVE",
    /**
     * Sent by the login window to the main window to confirm it's ready to listen.
     */
    LOGIN_LISTENER_ALIVE = "LOGIN_LISTENER_ALIVE",
    /**
     * Sent by the main window when it detects the user needs to log in.
     */
    LOGIN_REQUIRED = "LOGIN_REQUIRED",
    /**
     * Sent by the login window back to the main window upon successful authentication.
     */
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    /**
     * Sent by the login window back to the main window if an error occurs.
     */
    LOGIN_ERROR = "LOGIN_ERROR",
}

/**
 * The message structure for postMessage communication between the main and login windows.
 */
export type LoginWindowMessage = {
    event: LoginWindowEvent,
};


type SuccessResponse = {
    success: true;
}

type ErrorResponse = {
    success: false;
    error: string;
    errorData?: unknown;
}

export type GeneralResponse = SuccessResponse | ErrorResponse;

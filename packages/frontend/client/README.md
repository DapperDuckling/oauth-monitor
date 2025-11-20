# OAuth Monitor Client

This package provides a UI-agnostic client for the OAuth Monitor. It handles the core logic of checking authentication status, managing tokens, and communicating with your backend server. It's designed to be used as a standalone library that you can integrate into any JavaScript application, allowing you to build your own custom UI on top of it. It operates by periodically checking a `user-status` endpoint on your server and emitting events when the user's authentication state changes. This allows you to create a responsive UI that reacts to logins, logouts, and token refreshes.

## Table of Contents

1. [Getting Started](#getting-started)
2. [API and Events](#api-and-events)

## Getting Started

1.  **Installation:**

    ```bash
    npm install @dapper-duckling/oauth-monitor-client
    ```

2.  **Set Up Backend Endpoints:**

    For this client to work, you must have a backend server that is properly configured to handle authentication requests.

    > **Important!**
    > For more information on how to set up the required endpoints, please refer to the [main README file on GitHub](https://github.com/dapper-duckling/oauth-monitor#backend-server-setup).

3.  **Initialize and Use the Client:**

    The client is event-driven. You can listen for events to update your UI and application state.

    ```javascript
    import { OauthMonitorClient } from '@dapper-duckling/oauth-monitor-client';

    // Configuration for the client
    const config = {
        apiServerOrigin: 'http://localhost:3001', // Your backend server
        fastInitialAuthCheck: true,
        eagerRefreshTime: 0.5,
    };

    // Create a new instance of the client
    const oauthClient = new OauthMonitorClient(config);

    // Example: Update UI based on authentication status
    oauthClient.on('userStatusChange', (status) => {
        const { loggedIn } = status;
        if (loggedIn) {
            console.log('User is logged in!');
            // Update your UI to show a logged-in state
        } else {
            console.log('User is logged out.');
            // Update your UI to show a logged-out state
        }
    });

    // Example: Manually trigger login or logout
    function handleLogin() {
        oauthClient.handleLogin();
    }

    function handleLogout() {
        oauthClient.handleLogout();
    }

    // Start the client's monitoring
    oauthClient.start();
    ```

## API and Events

### `OauthMonitorClient(config)`

Creates a new client instance. The `config` object requires `apiServerOrigin`.

### `.start()`

Starts the client's polling mechanism to check for authentication status changes.

### `.stop()`

Stops the client's polling mechanism.

### `.handleLogin()`

Initiates the login flow by opening a new window to the login endpoint.

### `.handleLogout()`

Initiates the logout flow by redirecting the user to the logout endpoint.

### Events

You can listen for events using the `.on(eventName, callback)` method.

-   **`userStatusChange`**: Fired when the user's authentication status changes. The callback receives the new `userStatus` object.
-   **`tokenRefresh`**: Fired when the access token is about to expire and a refresh is attempted.
-   **`error`**: Fired when an error occurs during the authentication check.

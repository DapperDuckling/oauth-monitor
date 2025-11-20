# OAuth Monitor

OAuth Monitor is a lightweight, open-source tool designed to provide seamless authentication monitoring for web applications. It helps developers keep track of user authentication states and manage login sessions with ease by providing a set of tools to monitor OAuth authentication status in your application. It consists of a backend service that you implement and frontend plugins that you can integrate into your application.

## Table of Contents

1. [Plugins](#plugins)
2. [Getting Started](#getting-started)
3. [Backend Server Setup](#backend-server-setup)

## Plugins

OAuth Monitor offers plugins for popular frontend frameworks and a standalone client:

-   **[@dapperduckling/oauth-monitor-react](https://www.npmjs.com/package/@dapperduckling/oauth-monitor-react)**: A set of components and hooks to integrate authentication monitoring in your React application.
-   **[@dapperduckling/oauth-monitor-svelte](https://www.npmjs.com/package/@dapperduckling/oauth-monitor-svelte)**: A collection of stores and components for Svelte applications to track authentication status.
-   **[@dapperduckling/oauth-monitor-client](https://www.npmjs.com/package/@dapperduckling/oauth-monitor-client)**: The core UI-agnostic client that can be wrapped with any custom UI.

## Getting Started

1.  **Set up your backend:** Implement the required endpoints as described in the [Backend Server Setup](#backend-server-setup) section.
2.  **Install a frontend plugin:** Choose and install the plugin for your framework (e.g., React, Svelte).
3.  **Configure the plugin:** Follow the instructions in the plugin's README to integrate it into your application.

## Backend Server Setup

To use OAuth Monitor, you need to set up a backend server that exposes specific endpoints. The plugins use these endpoints to check the user's status and manage login/logout flows.

By default, the plugins will look for the following routes:

-   `/oauth-monitor/user-status`
-   `/oauth-monitor/login`
-   `/oauth-monitor/logout`

### Example Backend (Express.js)

Below is a sample implementation using Express.js. This is for demonstration purposes; you should adapt it to your own backend environment and authentication logic.

```javascript
const express = require('express');
const { createHash } = require('node:crypto');
const app = express();

// /oauth-monitor/user-status
// This endpoint should return the current user's authentication status.
app.get('/oauth-monitor/user-status', (req, res) => {
    // This is where you should check the user's session.
    // Replace this with your actual authentication logic.
    const userStatus = {
        loggedIn: true, // or false
        accessExpires: 1678886400, // Unix timestamp (seconds) for access token expiry
        refreshExpires: 1678890000, // Unix timestamp (seconds) for refresh token expiry
    };
    const payloadString = JSON.stringify(userStatus);

    res.json({
        checksum: createHash('md5').update(payloadString).digest('hex'),
        payload: userStatus,
        timestamp: Date.now(),
    });
});

// /oauth-monitor/login
// This endpoint should be the redirect URI for your OAuth flow.
// Its only job is to close the login window/popup.
app.get('/oauth-monitor/login', (req, res) => {
    // After your application has successfully authenticated the user,
    // the OAuth provider should redirect to this endpoint.
    res.send('<script>window.close();</script>');
});

// /oauth-monitor/logout
// This endpoint should initiate your application's logout process.
app.get('/oauth-monitor/logout', (req, res) => {
    // This should trigger your application's logout logic and then
    // redirect to your identity provider's logout URL.
    const idpLogoutUrl = 'https://your-oauth-provider.com/logout?redirect_uri=http://localhost:3000';
    res.redirect(idpLogoutUrl);
});

app.listen(3001, () => {
    console.log('API server listening at http://localhost:3001');
});
```

# OAuth Monitor for Svelte

This package provides the official Svelte implementation for OAuth Monitor, offering a component and context-based system to track a user's authentication status. It is designed to be flexible and easy to integrate into any Svelte project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Overriding UI Components](#overriding-ui-components)

## Getting Started

1.  **Installation:**

    ```bash
    npm install @dapper-duckling/oauth-monitor-svelte
    ```

2.  **Set Up Backend Endpoints:**

    For this plugin to work, you must have a backend server that is properly configured to handle authentication requests. 
    
    > **Important!**
    > For more information on how to set up the required endpoints, please refer to the [main README file on GitHub](https://github.com/dapper-duckling/oauth-monitor#backend-server-setup).

3.  **Wrap your application with the `OauthMonitor` component:**

    ```svelte
    <script lang="ts">
        import { OauthMonitor } from '@dapperduckling/oauth-monitor-svelte';
        import '@dapperduckling/oauth-monitor-svelte/styles.css';

        const config = {
            client: {
                apiServerOrigin: "http://localhost:3001", // Your backend server
                fastInitialAuthCheck: true,
                eagerRefreshTime: 0.5
            },
            svelte: {}
        };
    </script>

    <OauthMonitor {config}>
        <!-- Your application components -->
    </OauthMonitor>
    ```

4.  **Access authentication status and actions in child components:**

    You can access the authentication store and client by using Svelte's `getContext` API.

    ```svelte
    <script lang="ts">
        import { getContext } from 'svelte';
        import type { OauthMonitorStore } from '@dapperduckling/oauth-monitor-svelte';
        import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';

        const store = getContext<OauthMonitorStore>('oauth-monitor-store');
        const client = getContext<OauthMonitorClient>('oauth-monitor-client');

        const doLogin = () => client.handleLogin(true);
        const doLogout = () => client.handleLogout();
    </script>

    <div>
        {#if $store.userStatus?.loggedIn}
            <button on:click={doLogout}>Logout</button>
        {:else}
            <button on:click={doLogin}>Login</button>
        {/if}
    </div>
    ```

## Overriding UI Components

By default, this package comes with a dark-themed UI for the Login Modal, Logout Modal, and a "Floating Pill" that indicates read-only status. You can override these components entirely with your own designs by passing them into the `svelte` config.

### 1. Custom Login Modal

The Login Modal appears when the user's session is invalid or expired.

**Configuration:**

```typescript
import MyCustomLogin from './MyCustomLogin.svelte';

const config = {
    // ... client config
    svelte: {
        loginModalComponent: MyCustomLogin,
        loginModalProps: { title: "Welcome Back" } // Optional props
    }
};
```

**Implementation Example:**

Your component should handle three main states:
1.  **Standard:** Prompt the user to login.
2.  **Lengthy Login (`ui.lengthyLogin`):** The server is taking >7 seconds to respond. Show a spinner or message so the user knows it hasn't frozen.
3.  **Error (`ui.loginError`):** The server failed to respond (network error/500).

```svelte
<!-- MyCustomLogin.svelte -->
<script lang="ts">
    import { getContext } from 'svelte';
    import type { OauthMonitorStore } from '@dapperduckling/oauth-monitor-svelte';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';

    // 1. Access the store and client
    const store = getContext<OauthMonitorStore>('oauth-monitor-store');
    const client = getContext<OauthMonitorClient>('oauth-monitor-client');

    // 2. React to UI flags
    $: ui = $store.ui;
    
    const handleLogin = () => client.handleLogin(true);
</script>

<div class="modal-backdrop">
    <div class="modal">
        <h2>Authentication Required</h2>

        {#if ui.loginError}
            <div class="error-alert">
                Unable to reach authentication server. Please try again later.
            </div>
        {:else if ui.lengthyLogin}
            <div class="warning-alert">
                Connecting to identity provider is taking longer than usual...
            </div>
        {/if}

        <button on:click={handleLogin}>
            Log In via SSO
        </button>
    </div>
</div>
```

### 2. Custom Logout Modal

The Logout Modal appears when `client.handleLogout()` is called but before the actual redirect, allowing for a "Are you sure?" confirmation or a "Signing out..." spinner.

**Configuration:**

```typescript
import MyCustomLogout from './MyCustomLogout.svelte';

const config = {
    svelte: {
        logoutModalComponent: MyCustomLogout
    }
};
```

**Implementation Example:**

```svelte
<!-- MyCustomLogout.svelte -->
<script lang="ts">
    import { getContext } from 'svelte';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';
    import type { OauthMonitorStore } from '@dapperduckling/oauth-monitor-svelte';
    import { OmcDispatchType } from '@dapperduckling/oauth-monitor-svelte';

    const client = getContext<OauthMonitorClient>('oauth-monitor-client');
    const store = getContext<OauthMonitorStore>('oauth-monitor-store');

    const confirmLogout = () => {
         // Notify store we are executing logout (optional, for UI state)
        store.dispatch({ type: OmcDispatchType.EXECUTING_LOGOUT });
        // Trigger actual logout
        client.handleLogout();
    };
    
    const cancel = () => {
        // Hides the modal
        store.dispatch({ type: OmcDispatchType.HIDE_DIALOG });
        // Aborts any pending check if one was running
        client.abortAuthCheck(); 
    };
</script>

<div class="modal">
    <p>Are you sure you want to log out?</p>
    <button on:click={confirmLogout}>Yes, Logout</button>
    <button on:click={cancel}>Cancel</button>
</div>
```

### 3. Custom Floating Pill

The Floating Pill is a small indicator shown when the user is **not** logged in but is viewing the app in read-only mode (if allowed).

**Configuration:**

```typescript
import MyFloatingPill from './MyFloatingPill.svelte';

const config = {
    svelte: {
        floatingPillComponent: MyFloatingPill
    }
};
```

**Implementation Example:**

```svelte
<!-- MyFloatingPill.svelte -->
<script lang="ts">
    import { getContext } from 'svelte';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';
    import { OmcDispatchType, type OauthMonitorStore } from '@dapperduckling/oauth-monitor-svelte';

    const store = getContext<OauthMonitorStore>('oauth-monitor-store');
    const client = getContext<OauthMonitorClient>('oauth-monitor-client');

    const login = () => {
        store.dispatch({ type: OmcDispatchType.SHOW_LOGIN });
        client.handleLogin(true);
    };
</script>

<div class="fixed-bottom-right">
    <span>Guest Mode</span>
    <button on:click={login}>Sign In</button>
</div>
```

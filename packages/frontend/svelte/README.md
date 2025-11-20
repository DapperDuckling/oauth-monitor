# OAuth Monitor for Svelte

This package provides the official Svelte implementation for OAuth Monitor, offering a component and context-based system to track a user's authentication status. It is designed to be flexible and easy to integrate into any Svelte project.

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

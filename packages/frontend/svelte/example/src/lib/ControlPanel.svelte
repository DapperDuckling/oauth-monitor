<script lang="ts">
    import { getContext } from 'svelte';
    import { OmcDispatchType } from '@dapperduckling/oauth-monitor-svelte';
    import type { OauthMonitorStore } from '@dapperduckling/oauth-monitor-svelte';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';

    // Consume the context provided by OauthMonitor parent
    const store = getContext<OauthMonitorStore>('oauth-monitor-store');
    const client = getContext<OauthMonitorClient>('oauth-monitor-client');

    let userStatus: any;
    let ui: any;

    store.subscribe(state => {
        userStatus = state.userStatus;
        ui = state.ui;
    });

    const refreshProfile = async () => {
        console.log('Forcing reauth check...');
        await client.authCheck(true);
        console.log('Done.');
    };

    const showLogin = () => {
        store.dispatch({ type: OmcDispatchType.SHOW_LOGIN });
    };

    const showLogout = () => {
        store.dispatch({ type: OmcDispatchType.SHOW_LOGOUT });
    };

    const doLogin = () => client.handleLogin(true);
    const doLogout = () => {
        store.dispatch({type: OmcDispatchType.EXECUTING_LOGOUT});
        client.handleLogout();
    };

</script>

<div class="w-full max-w-2xl grid gap-8">

    <!-- Status Card -->
    <div class="bg-[#313131] p-6 rounded-lg border border-gray-700">
        <h2 class="text-xl font-bold mb-4 border-b border-gray-600 pb-2">User Status</h2>
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-gray-400">Logged In:</div>
            <div class={userStatus?.loggedIn ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                {userStatus?.loggedIn ? 'YES' : 'NO'}
            </div>

            <div class="text-gray-400">Access Expires:</div>
            <div>{userStatus?.accessExpires || 'N/A'}</div>

            <div class="text-gray-400">Refresh Expires:</div>
            <div>{userStatus?.refreshExpires || 'N/A'}</div>
        </div>
    </div>

    <!-- Actions Card -->
    <div class="bg-[#313131] p-6 rounded-lg border border-gray-700">
        <h2 class="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Actions</h2>

        <div class="flex flex-wrap gap-4">
            {#if !userStatus?.loggedIn}
                <button class="btn-primary" on:click={doLogin}>Login (Redirect)</button>
                <button class="btn-secondary" on:click={showLogin}>Show Login Modal</button>
            {:else}
                <button class="btn-danger" on:click={doLogout}>Logout</button>
                <button class="btn-secondary" on:click={showLogout}>Show Logout Modal</button>
            {/if}

            <button class="btn-secondary" on:click={refreshProfile}>Force Refresh Data</button>
        </div>
    </div>

    <!-- Debug Card -->
    <div class="bg-black/30 p-4 rounded border border-gray-800 font-mono text-xs overflow-auto max-h-60">
        <h3 class="text-gray-500 mb-2 uppercase font-bold">Debug UI State</h3>
        <pre>{JSON.stringify(ui, null, 2)}</pre>
    </div>

</div>

<style>
    button {
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-weight: bold;
        transition: all 0.2s;
    }
    .btn-primary { background: #79b4c3; color: #fff; }
    .btn-primary:hover { background: #69a4b3; }

    .btn-secondary { background: #4a4a4a; color: #fff; }
    .btn-secondary:hover { background: #5a5a5a; }

    .btn-danger { background: #ef5350; color: #fff; }
    .btn-danger:hover { background: #e53935; }
</style>

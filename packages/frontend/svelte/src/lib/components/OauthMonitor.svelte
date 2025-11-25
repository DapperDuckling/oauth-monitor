<script lang="ts">
    import { onMount, onDestroy, setContext } from 'svelte';
    import { OauthMonitorClient, ClientEvent } from "@dapperduckling/oauth-monitor-client";
    import type { ClientConfig } from "@dapperduckling/oauth-monitor-client";
    import { createOauthMonitorStore } from '../store';
    import { OmcDispatchType } from '../types';
    import type { SvelteConfig } from '../types';
    import type { UserStatus } from '@dapperduckling/oauth-monitor-common';

    // UI Components
    import Login from './Login.svelte';
    import Logout from './Logout.svelte';
    import FloatingPill from './FloatingPill.svelte';
    import LoginChild from './LoginChild.svelte';

    export let config: {
        client: ClientConfig;
        svelte?: SvelteConfig;
    };

    export let triggerStart: boolean;

    // Create Store and Context
    const store = createOauthMonitorStore();
    setContext('oauth-monitor-store', store);

    // Instantiate Client
    const client = new OauthMonitorClient(config.client);
    setContext('oauth-monitor-client', client);

    let lengthyLoginTimeout: ReturnType<typeof setTimeout> | undefined;

    // Store subscriptions for template rendering
    let showLoginOverlay = false;
    let showLogoutOverlay = false;
    let loggedIn = false;

    const unsubscribeStore = store.subscribe(state => {
        showLoginOverlay = state.ui.showLoginOverlay;
        showLogoutOverlay = state.ui.showLogoutOverlay;
        loggedIn = state.userStatus.loggedIn;
    });

    // Setup Event Listeners
    const setupListeners = () => {
        // Main Client Listener
        client.addEventListener('*', (clientEvent, payload) => {
            // Dispatch to store
            const event = new CustomEvent(clientEvent, { detail: payload });
            store.dispatch({ type: OmcDispatchType.OMC_CLIENT_EVENT, payload: event });

            // Lengthy Login Logic
            if (clientEvent === ClientEvent.START_AUTH_CHECK) {
                clearTimeout(lengthyLoginTimeout);
                lengthyLoginTimeout = setTimeout(() => {
                    store.dispatch({ type: OmcDispatchType.LENGTHY_LOGIN });
                }, 7000);
            }

            if (clientEvent === ClientEvent.END_AUTH_CHECK || clientEvent === ClientEvent.LOGIN_ERROR) {
                clearTimeout(lengthyLoginTimeout);
            }
        });
    };

    let loaded = false;

    onMount(() => {
        store.dispatch({ type: OmcDispatchType.SET_OMC_CLIENT, payload: client });
        setupListeners();

        if (config.svelte?.deferredStart !== true) {
            client.start();
        }

        loaded = true;
    });

    onDestroy(() => {
        client.destroy();
        store.dispatch({ type: OmcDispatchType.DESTROY_CLIENT });
        unsubscribeStore();
        clearTimeout(lengthyLoginTimeout);
    });

    $: if (config.svelte?.deferredStart === true && loaded && triggerStart) {
        client.start();
    }

</script>

<!-- Slot for the main app content -->
<slot />

<!-- UI Components -->
{#if config.svelte?.disableAuthComponents !== true && client.isStarted()}

    {#if showLoginOverlay}
        <Login>
            {#if config.svelte?.loginModalComponent}
                <svelte:component this={config.svelte.loginModalComponent} {...config.svelte.loginModalProps} />
            {:else}
                <LoginChild />
            {/if}
        </Login>
    {/if}

    {#if !showLoginOverlay && !loggedIn}
        <FloatingPill />
    {/if}

    {#if showLogoutOverlay}
        <Logout>
            {#if config.svelte?.logoutModalComponent}
                <svelte:component this={config.svelte.logoutModalComponent} {...config.svelte.logoutModalProps} />
            {:else}
                <LoginChild />
            {/if}
        </Logout>
    {/if}

{/if}

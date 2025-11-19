<script lang="ts">
    import { getContext } from 'svelte';
    import Overlay from './Overlay.svelte';
    import type { OauthMonitorStore } from '../store';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';

    const store = getContext<OauthMonitorStore>('oauth-monitor-store');
    const client = getContext<OauthMonitorClient>('oauth-monitor-client');

    let ui = {
        showMustLoginOverlay: false,
        loginError: false,
        lengthyLogin: false
    };

    store.subscribe(state => {
        ui = state.ui;
    });

    // Reactive declarations
    $: expressionLevel = (ui.showMustLoginOverlay || ui.loginError) ? "expressed" :
        (ui.lengthyLogin ? "regular" : "subdued");

    // Type casting for the prop
    $: level = expressionLevel as "expressed" | "regular" | "subdued";

    $: mainMsg = ui.loginError ? "Error Checking Credentials" :
        ui.showMustLoginOverlay ? "Authentication Required" : "Checking Credentials";

    $: subMsg = ui.loginError ? "Failed to communicate with server" :
        (!ui.showMustLoginOverlay && ui.lengthyLogin ? "this is taking longer than expected" : undefined);

    const handleLogin = () => client?.handleLogin(true);
</script>

<Overlay
        {mainMsg}
        {subMsg}
        userCanClose={true}
        buttonLabel="Login"
        buttonAction={handleLogin}
        buttonNewWindow={true}
        buttonExpressionLevel={level}
>
    <slot />
</Overlay>

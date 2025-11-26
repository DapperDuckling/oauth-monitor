<script lang="ts">
    import { getContext } from 'svelte';
    import Overlay from './Overlay.svelte';
    import type { OauthMonitorStore } from '../types';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';
    import { OmcDispatchType } from '../types';

    const store = getContext<OauthMonitorStore>('oauth-monitor-store');
    const client = getContext<OauthMonitorClient>('oauth-monitor-client');

    const handleLogout = () => {
        store.dispatch({ type: OmcDispatchType.EXECUTING_LOGOUT });
        client?.handleLogout();
    };
</script>

<Overlay
        mainMsg="Are you sure you want to log out?"
        userCanClose={true}
        buttonLabel="Logout"
        buttonAction={handleLogout}
        buttonExpressionLevel="expressed"
>
    <slot />
</Overlay>

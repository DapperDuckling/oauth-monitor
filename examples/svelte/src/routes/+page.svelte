<script lang="ts">
    import { OauthMonitor } from '@dapperduckling/oauth-monitor-svelte';
    import '@dapperduckling/oauth-monitor-svelte/styles.css';
    import ControlPanel from '$lib/ControlPanel.svelte';
    // import CustomLogo from "$lib/CustomLogo.svelte";

    const config = {
        client: {
            apiServerOrigin: "http://localhost:3005",
            fastInitialAuthCheck: true,
            eagerRefreshTime: 0.5
        },
        svelte: {
            deferredStart: true,
            // logoutModalComponent: CustomLogo,
        }
    };
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-8">
    <h1 class="text-3xl font-bold mb-8 text-[#79b4c3]">Svelte OAuth Monitor Example</h1>

    <OauthMonitor {config} triggerStart={true}>
        <ControlPanel />
    </OauthMonitor>
</div>

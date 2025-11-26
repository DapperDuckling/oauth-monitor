<script lang="ts">
    import { getContext } from 'svelte';
    import type { OauthMonitorStore } from '../types';

    // export let logo: string | undefined = undefined;

    // Get store from context
    const store = getContext<OauthMonitorStore>('oauth-monitor-store');

    // Subscribe to store to react to UI state
    $: silentLoginInitiated = $store.ui.silentLoginInitiated;

    $: animationVisible = silentLoginInitiated;
</script>

<div class="relative mt-0 w-[180px] flex flex-col items-center justify-center">
    <div class="flex flex-col items-center justify-center w-full h-full">
        <div class="w-full min-w-[150px] h-1.5 bg-gray-700 rounded-full overflow-hidden relative {animationVisible ? 'visible' : 'invisible'}">
            <div class="absolute top-0 left-0 h-full bg-[#79b4c3] w-full animate-indeterminate-bar origin-left"></div>
        </div>
    </div>
</div>

<style>
    /*.spinner-black {*/
    /*    animation: spin 12s linear infinite;*/
    /*    animation-delay: 6s;*/
    /*}*/

    /*.spinner-color {*/
    /*    animation: spin 12s linear infinite;*/
    /*}*/

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Custom indeterminate bar animation */
    @keyframes indeterminate-bar {
        0% { transform: translateX(-100%) scaleX(0.2); }
        50% { transform: translateX(0%) scaleX(0.5); }
        100% { transform: translateX(100%) scaleX(0.2); }
    }

    .animate-indeterminate-bar {
        animation: indeterminate-bar 1.5s infinite linear;
    }
</style>

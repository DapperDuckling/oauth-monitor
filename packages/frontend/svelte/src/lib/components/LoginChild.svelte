<script lang="ts">
    import { getContext } from 'svelte';
    import type { OauthMonitorStore } from '../store';

    export let logo: string | undefined = undefined;

    // Get store from context
    const store = getContext<OauthMonitorStore>('oauth-monitor-store');

    // Subscribe to store to react to UI state
    let silentLoginInitiated = false;
    let showMustLoginOverlay = false;

    store.subscribe(state => {
        silentLoginInitiated = state.ui.silentLoginInitiated;
        showMustLoginOverlay = state.ui.showMustLoginOverlay;
    });
</script>

<div class="relative mt-0 h-[180px] w-[180px] flex flex-col items-center justify-center">
    {#if logo}
        <!-- Logo Mode -->
        <img
                src={logo}
                alt="App Logo"
                class="h-full w-full object-contain"
        />

        {#if silentLoginInitiated && !showMustLoginOverlay}
            <!-- Circular Loaders overlaying the logo -->
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden w-[180px] h-[180px] pointer-events-none">
                <div class="spinner-black absolute inset-0 border-[2px] border-transparent border-t-black/80 rounded-full"></div>
            </div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden w-[180px] h-[180px] pointer-events-none">
                <div class="spinner-color absolute inset-0 border-[2px] border-transparent border-t-[#e1af35] rounded-full"></div>
            </div>
        {/if}
    {:else}
        <!-- No Logo Mode - Horizontal Bar -->
        <div class="flex flex-col items-center justify-center w-full h-full space-y-4">
            {#if silentLoginInitiated && !showMustLoginOverlay}
                <div class="w-full min-w-[150px] h-1.5 bg-gray-700 rounded-full overflow-hidden relative">
                    <div class="absolute top-0 left-0 h-full bg-[#79b4c3] w-full animate-indeterminate-bar origin-left"></div>
                </div>
            {:else}
                <!-- Placeholder icon if not loading and no logo provided -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-gray-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            {/if}
        </div>
    {/if}
</div>

<style>
    .spinner-black {
        animation: spin 12s linear infinite;
        animation-delay: 6s;
    }

    .spinner-color {
        animation: spin 12s linear infinite;
    }

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

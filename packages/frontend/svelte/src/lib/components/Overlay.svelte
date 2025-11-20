<script lang="ts">
    import { createEventDispatcher, getContext } from 'svelte';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';
    import type { OauthMonitorStore } from '../store';
    import { OmcDispatchType } from '../types';

    export let mainMsg: string;
    export let subMsg: string | undefined = undefined;
    export let userCanClose: boolean = false;

    // Button Props
    export let buttonLabel: string;
    export let buttonAction: () => void;
    export let buttonNewWindow: boolean = false;
    export let buttonExpressionLevel: "subdued" | "regular" | "expressed" = "expressed";

    const dispatch = createEventDispatcher();
    const client = getContext<OauthMonitorClient>('oauth-monitor-client');
    const store = getContext<OauthMonitorStore>('oauth-monitor-store');

    const handleClose = () => {
        client?.abortAuthCheck();
        store.dispatch({ type: OmcDispatchType.HIDE_DIALOG });
        dispatch('close');
    };
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <!-- Modal Card -->
    <div class="relative w-full min-w-[265px] max-w-sm flex flex-col items-center rounded-lg bg-[#051827] p-6 text-white shadow-xl border border-gray-800">

        {#if userCanClose}
            <button
                    on:click={handleClose}
                    class="absolute right-2 top-2 p-1 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        {/if}

        <!-- Text Content -->
        <div class="text-center space-y-1 mt-6">
            <h2 class="text-lg font-medium leading-6">{mainMsg}</h2>
            <div class="h-4"> <!-- Fixed height to prevent layout jump -->
                {#if subMsg && subMsg.trim() !== ""}
                    <p class="text-xs font-variant-caps text-[#ef9a9a] uppercase tracking-wide">
                        {subMsg}
                    </p>
                {/if}
            </div>
        </div>

        <!-- Content Slot (Logo, etc) -->
        <div class="w-full flex justify-center mb-2">
            <slot />
        </div>

        <!-- Action Button -->
        <button
                on:click={buttonAction}
                class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase transition-all duration-200"
                class:btn-subdued={buttonExpressionLevel === 'subdued'}
                class:btn-regular={buttonExpressionLevel === 'regular'}
                class:btn-expressed={buttonExpressionLevel === 'expressed'}
        >
            {buttonLabel}
            {#if buttonNewWindow}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
            {/if}
        </button>
    </div>
</div>

<style>
    .font-variant-caps {
        font-variant-caps: all-small-caps;
    }

    .btn-subdued {
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: rgba(255, 255, 255, 0.7);
    }
    .btn-subdued:hover {
        border-color: white;
        color: white;
        background-color: rgba(255, 255, 255, 0.05);
    }

    .btn-regular {
        background-color: #4a4a4a;
        color: white;
    }
    .btn-regular:hover {
        background-color: #5a5a5a;
    }

    .btn-expressed {
        background-color: #79b4c3; /* Info light blue */
        color: white;
        font-weight: 700;
    }
    .btn-expressed:hover {
        background-color: #69a4b3;
    }
</style>

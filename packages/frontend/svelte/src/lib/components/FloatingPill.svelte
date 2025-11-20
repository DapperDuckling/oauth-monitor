<script lang="ts">
    import { getContext } from 'svelte';
    import { fade } from 'svelte/transition';
    import type { OauthMonitorClient } from '@dapperduckling/oauth-monitor-client';
    import { OmcDispatchType, type OauthMonitorStore } from '../types';

    const omcStore = getContext<OauthMonitorStore>('oauth-monitor-store');
    const omcClient = getContext<OauthMonitorClient>('oauth-monitor-client');

    const handleOpenLogin = () => {
        omcStore.dispatch({ type: OmcDispatchType.SHOW_LOGIN });
        omcClient?.handleLogin(true);
    };
</script>

<div
    in:fade={{ duration: 300 }}
    class="floating-pill-container"
>
    <div class="content-wrapper">
        <div class="text-wrapper">
            <span class="main-text">Not Logged In</span>
            <span class="sub-text">Viewing read-only mode</span>
        </div>

        <button
            on:click={handleOpenLogin}
            class="login-button"
        >
            Login
        </button>
    </div>
</div>

<style>
    .floating-pill-container {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1400; /* Corresponds to MUI's snackbar z-index */
        background-color: rgba(49, 49, 49, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px); /* For Safari */
        color: white;
        padding: 8px;
        padding-left: 16px;
        border-radius: 9999px;
        border: 1px solid rgba(122, 122, 122, 0.5);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .content-wrapper {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .text-wrapper {
        display: flex;
        flex-direction: column;
    }

    .main-text {
        font-size: 0.875rem; /* subtitle2 */
        font-weight: bold;
        line-height: 1.2;
    }

    .sub-text {
        font-size: 0.75rem; /* caption */
        color: #B9B9B9;
    }

    .login-button {
        background-color: #79b4c3;
        color: white;
        font-weight: bold;
        border-radius: 9999px;
        text-transform: none;
        padding: 6px 16px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .login-button:hover {
        background-color: #69a4b3;
    }
</style>

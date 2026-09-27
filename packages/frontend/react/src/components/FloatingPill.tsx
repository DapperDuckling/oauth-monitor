import type { CSSProperties } from 'react';
import { OmcDispatchType } from "../types.js";
import { useOauthMonitor } from "../use-oauth-monitor.js";

export const FloatingPill = () => {
    const [omcContext, omcDispatch] = useOauthMonitor();

    const handleOpenLogin = () => {
        omcDispatch({ type: OmcDispatchType.SHOW_LOGIN });
        omcContext.omcClient?.handleLogin(true);
    };

    const containerStyle: CSSProperties = {
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1400,
        backgroundColor: 'rgba(49, 49, 49, 0.9)',
        backdropFilter: 'blur(10px)',
        color: '#ffffff',
        padding: '8px 12px 8px 20px',
        borderRadius: 9999,
        border: '1px solid rgba(122, 122, 122, 0.5)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    };

    const buttonStyle: CSSProperties = {
        backgroundColor: '#79b4c3',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        borderRadius: 9999,
        border: 'none',
        padding: '6px 16px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontFamily: 'inherit',
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', lineHeight: 1.2 }}>
                    Not Logged In
                </span>
                <span style={{ fontSize: '0.75rem', color: '#B9B9B9' }}>
                    Viewing read-only mode
                </span>
            </div>

            <button
                type="button"
                onClick={handleOpenLogin}
                style={buttonStyle}
            >
                Login
            </button>
        </div>
    );
};

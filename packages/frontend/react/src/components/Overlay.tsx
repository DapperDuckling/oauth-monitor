import type {CSSProperties, ReactNode} from "react";
import { useOauthMonitor } from "../use-oauth-monitor.js";
import {OmcDispatchType} from "../types.js";

export type ButtonExpressionLevel = "subdued" | "regular" | "expressed";

export interface OverlayProps {
    children?: ReactNode;
    mainMsg: string;
    subMsg?: string | undefined;
    userCanClose?: boolean;
    button: {
        label: string;
        onClick: () => void;
        newWindow?: boolean;
        expressionLevel?: ButtonExpressionLevel;
    }
}

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const OpenInNewIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

export const Overlay = (props: OverlayProps) => {

    // Update the expression level if not set
    props.button.expressionLevel ??= "expressed";

    const [omcContext, omcDispatch] = useOauthMonitor();

    const backdropStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
    };

    const cardStyle: CSSProperties = {
        position: 'relative',
        backgroundColor: '#051827',
        color: '#ffffff',
        borderRadius: 8,
        padding: '24px',
        minWidth: 265,
        maxWidth: 420,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        fontFamily: 'inherit',
    };

    const closeBtnStyle: CSSProperties = {
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'none',
        border: 'none',
        color: '#9e9e9e',
        cursor: 'pointer',
        padding: 6,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const buttonVariantStyle: CSSProperties = props.button.expressionLevel === 'subdued'
        ? {
            backgroundColor: 'transparent',
            border: '1px solid #79b4c3',
            color: '#79b4c3',
            opacity: 0.6,
        }
        : props.button.expressionLevel === 'regular'
        ? {
            backgroundColor: '#79b4c3',
            border: 'none',
            color: '#ffffff',
            opacity: 1,
        }
        : {
            backgroundColor: '#0288d1',
            border: 'none',
            color: '#ffffff',
            opacity: 1,
        };

    const buttonStyle: CSSProperties = {
        width: '100%',
        padding: '10px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s, opacity 0.2s',
        ...buttonVariantStyle,
    };

    return (
        <div style={backdropStyle} role="presentation">
            <div
                role="dialog"
                aria-modal="true"
                style={cardStyle}
            >
                {props.userCanClose && (
                    <button
                        type="button"
                        aria-label="close"
                        onClick={() => {
                            omcContext.omcClient?.abortAuthCheck();
                            omcDispatch({type: OmcDispatchType.HIDE_DIALOG});
                        }}
                        style={closeBtnStyle}
                    >
                        <CloseIcon />
                    </button>
                )}
                {props.children}
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>
                        {props.mainMsg}
                    </h3>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: '#ef9a9a',
                            fontVariantCaps: 'all-small-caps',
                            marginTop: '-3px',
                            marginBottom: '-17px',
                            minHeight: 18,
                            visibility: props.subMsg !== undefined && props.subMsg.trim() !== '' ? 'visible' : 'hidden',
                        }}
                    >
                        {props.subMsg ?? '\u00A0'}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={props.button.onClick}
                    style={buttonStyle}
                >
                    {props.button.label}
                    {props.button.newWindow && <OpenInNewIcon />}
                </button>
            </div>
        </div>
    );
};


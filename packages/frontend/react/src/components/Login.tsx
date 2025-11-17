import {useOauthMonitor} from "../use-oauth-monitor.js";
import {ButtonExpressionLevel, Overlay, type OverlayProps} from "./Overlay.js";
import {AuthProps} from "../types.js";

export const Login = ({children, reactConfig}: AuthProps) => {
    const [omcContext] = useOauthMonitor();
    
    const {ui} = omcContext;

    let expressionLevel: ButtonExpressionLevel;

    if (ui.showMustLoginOverlay || ui.loginError) {
        expressionLevel = "expressed";
    } else if (ui.lengthyLogin) {
        expressionLevel = "regular";
    } else {
        expressionLevel = "subdued";
    }

    const overlayProps: OverlayProps = {
        mainMsg: ui.loginError ? "Error Checking Credentials" : ui.showMustLoginOverlay ? "Authentication Required" : "Checking Credentials",
        subMsg: ui.loginError ? "Failed to communicate with server" : !ui.showMustLoginOverlay && ui.lengthyLogin ? "this is taking longer than expected" : undefined,
        button: {
            label: "Login",
            onClick: () => omcContext.omcClient?.handleLogin(omcContext.hasAuthenticatedOnce),
            newWindow: omcContext.hasAuthenticatedOnce,
            expressionLevel: expressionLevel,
        },
        userCanClose: !!(omcContext.hasAuthenticatedOnce || reactConfig?.deferredStart),
    }

    // Start the login listener if login will be with a new window
    if (omcContext.hasAuthenticatedOnce) omcContext.omcClient?.prepareToHandleNewWindowLogin();

    return (
        <Overlay {...overlayProps}>
            {children}
        </Overlay>
    );
}


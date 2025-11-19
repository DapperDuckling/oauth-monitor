import {useOauthMonitor} from "../use-oauth-monitor.js";
import {ButtonExpressionLevel, Overlay, type OverlayProps} from "./Overlay.js";
import {AuthProps} from "../types.js";

export const Login = ({children}: AuthProps) => {
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
            onClick: () => omcContext.omcClient?.handleLogin(true),
            newWindow: true,
            expressionLevel: expressionLevel,
        },
        userCanClose: true,
    }

    return (
        <Overlay {...overlayProps}>
            {children}
        </Overlay>
    );
}


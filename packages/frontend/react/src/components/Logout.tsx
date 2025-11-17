import {useOauthMonitor} from "../use-oauth-monitor.js";
import {Overlay} from "./Overlay.js";
import {AuthProps, OmcDispatchType} from "../types.js";

export const Logout = ({children}: AuthProps) => {
    const [omcContext, omcDispatch] = useOauthMonitor();

    const overlayProps = {
        mainMsg: "Are you sure you want to log out?",
        button: {
            label: "Logout",
            onClick: () => {
                omcDispatch({type: OmcDispatchType.EXECUTING_LOGOUT});
                omcContext.omcClient?.handleLogout();
            },
        },
        userCanClose: true,
    };

    return (
        <Overlay {...overlayProps}>
            {children}
        </Overlay>
    );
}

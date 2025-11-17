import {type ReactNode, useEffect} from 'react';
import {
    type ClientConfig, ClientEvent, OauthMonitorClient,
} from "@dapperduckling/oauth-monitor-client";
import {Login} from "./Login.js";
import {
    InitialContext,
    OauthMonitorContext,
    OauthMonitorDispatchContext,
} from "../oauth-monitor-context.js";
import {reducer} from "../reducer.js";
import {useImmerReducer} from "use-immer";
import {createTheme, ThemeProvider} from "@mui/material";
import {Logout} from "./Logout.js";
import {OmcDispatchType} from "../types.js";
import {EventListenerFunction, type UserStatus} from "@dapperduckling/oauth-monitor-common";

export type ReactConfig = {
    disableAuthComponents?: boolean,

    /**
     * @desc Specify a component to pass to the login modal for slight customization
     */
    loginModalChildren?: ReactNode;

    /**
     * @desc Specify a component to pass to the logout modal for slight customization
     */
    logoutModalChildren?: ReactNode;

    /**
     * Defer the start of the plugin
     */
    deferredStart?: boolean;

    /**
     * Can specify an event listener to catch all emitted events
     */
    globalEventListener?: EventListenerFunction<ClientEvent>;
}

interface ConnectorProviderProps {
    children: ReactNode,
    config: {
        client: ClientConfig,
        react?: ReactConfig,
    },
}

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#ffffff" },
        // @ts-ignore
        grey: { main: "#7a7a7a" },
        darkgrey: { main: "#313131" },
        lightgrey: { main: "#B9B9B9" },
        lightblue: { main: "#79b4c3" },
        white: { main: "#fff" },
        black: { main: "#000" },
        red: { main: "#ff0000" },
    },
});

export const OauthMonitorProvider = ({children, config}: ConnectorProviderProps) => {

    // Grab the initial context
    const initialContext = structuredClone(InitialContext);

    // Update for a deferred start
    if (config.react?.deferredStart) initialContext.ui.showLoginOverlay = false;

    // Initialize the reducer
    const [omcContext, omcDispatch] = useImmerReducer(reducer, initialContext);

    useEffect(() => {
        // Safety check for non-typescript instances
        if (config === undefined) {
            throw new Error("No config provided to OauthMonitorProvider");
        }

        // Instantiate the keycloak connector client
        // const omcClient = OauthMonitorClient(config.client);
        const omcClient = new OauthMonitorClient(config.client);

        // Store the client in the context
        omcDispatch({type: OmcDispatchType.SET_OMC_CLIENT, payload: omcClient});

        // Attach handler
        let lengthyLoginTimeout: undefined | number = undefined;

        // Add event listener to pass events down to components
        omcClient.addEventListener('*', (clientEvent, payload) => {

            // console.debug(`KCP received event: ${clientEvent}`);

            // Build a custom event
            const event = new CustomEvent(clientEvent, {detail: payload});

            // Dispatch the event
            omcDispatch({type: OmcDispatchType.OMC_CLIENT_EVENT, payload: event});

            // Capture silent login events and set a timer to flag them as lengthy
            if (event.type === ClientEvent.START_SILENT_LOGIN) {
                clearTimeout(lengthyLoginTimeout);
                lengthyLoginTimeout = window.setTimeout(() => {
                    omcDispatch({type: OmcDispatchType.LENGTHY_LOGIN});
                }, 7000);
            }

            // Clear timeout on login or error
            if ((event.type === ClientEvent.USER_STATUS_UPDATED && (payload as UserStatus)['loggedIn']) ||
                event.type === ClientEvent.LOGIN_ERROR
            ) {
                clearTimeout(lengthyLoginTimeout);
            }
        });

        // Add global event listener from user
        if (config.react?.globalEventListener) omcClient.addEventListener('*', config.react?.globalEventListener);

        // Initialize the connector
        if (config.react?.deferredStart !== true) omcClient.start();

        return () => {
            omcClient.destroy();
            omcDispatch({type: OmcDispatchType.DESTROY_CLIENT});
        }
    }, []);

    return (
        <OauthMonitorContext.Provider value={omcContext}>
            <OauthMonitorDispatchContext.Provider value={omcDispatch}>
                {config.react?.disableAuthComponents !== true &&
                    <ThemeProvider theme={theme}>
                        {omcContext.ui.showLoginOverlay && <Login {...config.react}>{config.react?.loginModalChildren}</Login>}
                        {omcContext.ui.showLogoutOverlay && <Logout {...config.react}>{config.react?.logoutModalChildren}</Logout>}
                    </ThemeProvider>
                }
                {omcContext.hasAuthenticatedOnce && children}
            </OauthMonitorDispatchContext.Provider>
        </OauthMonitorContext.Provider>
    );
};



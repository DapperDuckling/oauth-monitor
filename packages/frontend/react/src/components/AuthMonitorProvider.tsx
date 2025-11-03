import {type ReactNode, useEffect} from 'react';
import {
    AuthMonitorClient,
    ClientEvent,
} from "@dapperduckling/keycloak-connector-client";
import {Login} from "./Login.js";
import {
    InitialContext,
    AuthMonitorContext,
    AuthMonitorDispatchContext,
} from "../auth-monitor-context.js";
import {reducer} from "../reducer.js";
import {useImmerReducer} from "use-immer";
import {createTheme, ThemeProvider} from "@mui/material";
import {KccDispatchType} from "../types.js";
import {EventListenerFunction, type UserStatus, AuthMonitorConfig} from "@dapperduckling/keycloak-connector-common";

export type ReactConfig = {
    disableAuthComponents?: boolean,

    /**
     * @desc Specify a component to pass to the login modal for slight customization
     */
    loginModalChildren?: ReactNode;

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
        client: AuthMonitorConfig,
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

export const AuthMonitorProvider = ({children, config}: ConnectorProviderProps) => {

    // Grab the initial context
    const initialContext = structuredClone(InitialContext);

    // Update for a deferred start
    if (config.react?.deferredStart) initialContext.ui.showLoginOverlay = false;

    // Initialize the reducer
    const [kccContext, kccDispatch] = useImmerReducer(reducer, initialContext);

    useEffect(() => {
        // Safety check for non-typescript instances
        if (config === undefined) {
            throw new Error("No config provided to AuthMonitorProvider");
        }

        const authMonitorClient = new AuthMonitorClient(config.client);

        // Store the client in the context
        kccDispatch({type: KccDispatchType.SET_KCC_CLIENT, payload: authMonitorClient});

        // Add event listener to pass events down to components
        authMonitorClient.addEventListener('*_*, (clientEvent, payload) => {

            // Build a custom event
            const event = new CustomEvent(clientEvent, {detail: payload});

            // Dispatch the event
            kccDispatch({type: KccDispatchType.KCC_CLIENT_EVENT, payload: event});
        });

        // Add global event listener from user
        if (config.react?.globalEventListener) authMonitorClient.addEventListener('*_*, config.react?.globalEventListener);

        // Initialize the connector
        if (config.react?.deferredStart !== true) authMonitorClient.start();

        return () => {
            authMonitorClient.destroy();
            kccDispatch({type: KccDispatchType.DESTROY_CLIENT});
        }
    }, []);

    return (
        <AuthMonitorContext.Provider value={kccContext}>
            <AuthMonitorDispatchContext.Provider value={kccDispatch}>
                {config.react?.disableAuthComponents !== true &&
                    <ThemeProvider theme={theme}>
                        {kccContext.ui.showLoginOverlay && <Login {...config.react}>{config.react?.loginModalChildren}</Login>}
                    </ThemeProvider>
                }
                {kccContext.hasAuthenticatedOnce && children}
            </AuthMonitorDispatchContext.Provider>
        </AuthMonitorContext.Provider>
    );
};

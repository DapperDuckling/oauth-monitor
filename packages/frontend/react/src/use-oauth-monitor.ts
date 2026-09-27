import {Dispatch, useContext} from "react";
import type {UserProfile} from "@dapperduckling/oauth-monitor-common";
import type {OauthMonitorContextProps} from "./oauth-monitor-context.js";
import {OauthMonitorContext, OauthMonitorDispatchContext} from "./oauth-monitor-context.js";
import {OauthMonitorStateActions} from "./types.js";

export const useOauthMonitor = <TProfile = UserProfile>(): [OauthMonitorContextProps<TProfile>, Dispatch<OauthMonitorStateActions<TProfile>>] => {
    const omcContext = useContext(OauthMonitorContext);
    const omcDispatch = useContext(OauthMonitorDispatchContext);
    if (!omcContext || !omcDispatch) {
        throw new Error("useOauthMonitor must be used in components that are children of a <OauthMonitorProvider> component.");
    }

    return [omcContext as OauthMonitorContextProps<TProfile>, omcDispatch as Dispatch<OauthMonitorStateActions<TProfile>>];
};

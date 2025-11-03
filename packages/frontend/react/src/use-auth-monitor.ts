import {Dispatch, useContext} from "react";
import type {AuthMonitorContextProps} from "./auth-monitor-context.js";
import {AuthMonitorContext, AuthMonitorDispatchContext} from "./auth-monitor-context.js";

import {AuthMonitorStateActions} from "./types.js";

export const useAuthMonitor = (): [AuthMonitorContextProps, Dispatch<AuthMonitorStateActions>] => {
    const kccContext = useContext(AuthMonitorContext);
    const kccDispatch = useContext(AuthMonitorDispatchContext);
    if (!kccContext || !kccDispatch) {
        throw new Error("useAuthMonitor must be used in components that are children of a <AuthMonitorProvider> component.");
    }

    return [kccContext, kccDispatch];
};

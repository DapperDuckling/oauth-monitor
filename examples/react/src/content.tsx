import {Button} from "@mui/material";
import {useOauthMonitor, OmcDispatchType} from "@dapperduckling/oauth-monitor-react";

export const Content = () => {
    const [omcContext, omcDispatch] = useOauthMonitor();
    const startIfNotStarted = () => omcContext.omcClient?.isStarted() || omcContext.omcClient?.start();

    const refreshProfile = async () => {
        console.log('forcing reauth check');
        await omcContext.omcClient?.authCheck(true); // note: omcClient will not handle more than one request at a time
        console.log('done forcing reauth check');
    };

    return (
        <div>
            <h2>This is an example of the DapperDuckling React Plugin</h2>
            {!omcContext.userStatus.loggedIn ?
                <div>
                <Button onClick={() => {
                    startIfNotStarted();
                    omcDispatch({type: OmcDispatchType.SHOW_LOGIN});
                    omcContext.omcClient?.handleLogin(true);
                }}>Login Now</Button>
                <Button onClick={() => {
                    startIfNotStarted();
                    omcDispatch({type: OmcDispatchType.SHOW_LOGIN});
                    setTimeout(() => omcContext.omcClient?.authCheck(), 0);
                }}>Show Login Modal</Button>
            </div> : <div>
                <Button onClick={() => {
                    if (omcContext.omcClient?.isStarted() !== true) return;
                    omcDispatch({type: OmcDispatchType.EXECUTING_LOGOUT});
                    omcContext.omcClient?.handleLogout();
                }}>Logout Now</Button>
                <Button onClick={() => {
                    if (omcContext.omcClient?.isStarted() !== true) return;
                    omcDispatch({type: OmcDispatchType.SHOW_LOGOUT});
                }}>Show Logout Modal</Button>
            </div>
            }

            <h3>Example of force refresh of user data</h3>
            <Button onClick={refreshProfile}>Force refresh of user data</Button>
            <Button onClick={() => {
                const result = omcContext.omcClient?.authCheckNoWait();
                console.log(result);
            }}>No wait auth check</Button>
            <div><sub><b>Delete your access token first, if you want to see "accessExpires" change</b></sub></div>
            <div>
                <h4>UI Data</h4>
                    {JSON.stringify(omcContext.ui)}
                <h4>User Data</h4>
                <div>
                    {JSON.stringify(omcContext.userStatus)}
                </div>
            </div>
        </div>
    )
}

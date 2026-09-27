import { useAuth, useOauthMonitor, OmcDispatchType } from "@dapperduckling/oauth-monitor-react";

export const Content = () => {
    // Developers can use useAuth() for high-level user info & action helpers
    const { loggedIn, profile, refresh, client } = useAuth();
    // Lower-level context access is also available via useOauthMonitor()
    const [omcContext, omcDispatch] = useOauthMonitor();

    const startIfNotStarted = () => client?.isStarted() || client?.start();

    const refreshProfile = async () => {
        console.log('forcing reauth check');
        await refresh(true);
        console.log('done forcing reauth check');
    };

    const branchNames: Record<string, string> = {
        A: 'U.S. Army',
        N: 'U.S. Navy',
        AF: 'U.S. Air Force',
        F: 'U.S. Air Force',
        M: 'U.S. Marine Corps',
        S: 'U.S. Space Force',
        C: 'U.S. Coast Guard',
        D: 'Department of Defense',
    };

    const branchName = profile?.branchOfServiceCode ? branchNames[profile.branchOfServiceCode] ?? profile.branchOfServiceCode : 'DoD';

    const btnStyle: React.CSSProperties = {
        padding: '8px 16px',
        margin: '4px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'inherit',
    };

    const cardStyle: React.CSSProperties = {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        margin: '12px 0',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <h1>OAuth Monitor v3 Example App</h1>
            <p style={{ color: '#666' }}>Demonstrates headless React integration, DoD CAC user profile claims, and Web Locks session coordination.</p>

            {profile && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                            backgroundColor: '#0d47a1',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                        }}>
                            {branchName} ({profile.branchOfServiceCode ?? 'N/A'})
                        </span>
                        {profile.rankCode && (
                            <span style={{
                                backgroundColor: '#37474f',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                            }}>
                                Rank: {profile.rankCode}
                            </span>
                        )}
                        <h3 style={{ margin: 0 }}>{profile.displayName ?? profile.name}</h3>
                    </div>
                    <div style={{ fontSize: '14px', color: '#555' }}>
                        <div><strong>Email:</strong> {profile.email}</div>
                        <div><strong>Duty Org:</strong> {profile.dutyOrgCode}</div>
                        <div><strong>Company:</strong> {profile.company}</div>
                    </div>
                </div>
            )}

            {!omcContext.userStatus.loggedIn ? (
                <div style={cardStyle}>
                    <h3>Authentication: Logged Out</h3>
                    <button style={btnStyle} onClick={() => {
                        startIfNotStarted();
                        omcDispatch({type: OmcDispatchType.SHOW_LOGIN});
                        omcContext.omcClient?.handleLogin(true);
                    }}>Login Now (Popup)</button>
                    <button style={btnStyle} onClick={() => {
                        startIfNotStarted();
                        omcDispatch({type: OmcDispatchType.SHOW_LOGIN});
                        setTimeout(() => omcContext.omcClient?.authCheck(), 0);
                    }}>Show Login Modal</button>
                </div>
            ) : (
                <div style={cardStyle}>
                    <h3>Authentication: Active Session</h3>
                    <button style={{ ...btnStyle, backgroundColor: '#d32f2f' }} onClick={() => {
                        if (omcContext.omcClient?.isStarted() !== true) return;
                        omcDispatch({type: OmcDispatchType.EXECUTING_LOGOUT});
                        omcContext.omcClient?.handleLogout();
                    }}>Logout Now</button>
                    <button style={btnStyle} onClick={() => {
                        if (omcContext.omcClient?.isStarted() !== true) return;
                        omcDispatch({type: OmcDispatchType.SHOW_LOGOUT});
                    }}>Show Logout Modal</button>
                </div>
            )}

            <div style={cardStyle}>
                <h3>Session Actions & Multi-Tab Testing</h3>
                <button style={btnStyle} onClick={refreshProfile}>Force Refresh Token</button>
                <button style={btnStyle} onClick={() => {
                    const result = omcContext.omcClient?.authCheckNoWait();
                    console.log('No-wait result:', result);
                }}>No-Wait Auth Check</button>
                <p style={{ fontSize: '13px', color: '#666' }}>
                    Tip: Open multiple browser tabs at <code>http://localhost:3000</code>. Watch console logs to see Web Locks elect a leader and deduplicate eager refreshes!
                </p>
            </div>

            <div style={cardStyle}>
                <h4>Live State Inspector</h4>
                <details open>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>User Status</summary>
                    <pre style={{ backgroundColor: '#2d3748', color: '#f7fafc', padding: '12px', borderRadius: '4px', overflowX: 'auto' }}>
                        {JSON.stringify(omcContext.userStatus, null, 2)}
                    </pre>
                </details>
                <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>UI State</summary>
                    <pre style={{ backgroundColor: '#2d3748', color: '#f7fafc', padding: '12px', borderRadius: '4px', overflowX: 'auto' }}>
                        {JSON.stringify(omcContext.ui, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
};

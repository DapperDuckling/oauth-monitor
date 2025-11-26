# OAuth Monitor for React

This package provides the official React implementation for OAuth Monitor, offering a set of components and hooks that simplify the process of tracking a user's authentication status. It is designed to be flexible and easy to integrate into any React project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Overriding UI Components](#overriding-ui-components)

## Getting Started

1.  **Installation:**

    ```bash
    npm install @dapper-duckling/oauth-monitor-react
    ```

2.  **Set Up Backend Endpoints:**

    For this plugin to work, you must have a backend server that is properly configured to handle authentication requests.

    > **Important!**
    > For more information on how to set up the required endpoints, please refer to the [main README file on GitHub](https://github.com/dapper-duckling/oauth-monitor#backend-server-setup).

3.  **Wrap your application with the `OauthMonitorProvider`:**

    ```tsx
    import { OauthMonitorProvider } from '@dapperduckling/oauth-monitor-react';

    const config = {
        client: {
            apiServerOrigin: "http://localhost:3001", // Your backend server
            fastInitialAuthCheck: true,
            eagerRefreshTime: 0.5
        },
        react: {}
    };

    function App() {
        return (
            <OauthMonitorProvider config={config}>
                {/* Your application components */}
            </OauthMonitorProvider>
        );
    }
    ```

4.  **Access authentication status and actions in child components:**

    You can access the authentication state and client by using the `useOauthMonitor` hook.

    ```tsx
    import { useOauthMonitor } from '@dapperduckling/oauth-monitor-react';

    const MyComponent = () => {
        const [context, dispatch] = useOauthMonitor();
        const client = context.omcClient;

        const doLogin = () => client?.handleLogin(true);
        const doLogout = () => client?.handleLogout();

        if (context.userStatus.loggedIn) {
            return <button onClick={doLogout}>Logout</button>;
        }

        return <button onClick={doLogin}>Login</button>;
    };
    ```

## Overriding UI Components

By default, this package renders a Material UI based Login Modal, Logout Modal, and "Floating Pill". You can replace these entirely with your own components using the configuration object.

### 1. Custom Login Modal

The Login Modal is critical for handling authentication flows when tokens expire.

**Configuration:**

```tsx
import { MyLoginModal } from './MyLoginModal';

const config = {
    // ... client config
    react: {
        loginModalComponent: MyLoginModal,
        loginModalProps: { title: "App Login" } // Optional
    }
};
```

**Implementation Example:**

You should monitor `ui.lengthyLogin` (triggers after 7s of waiting) and `ui.loginError` (network failures).

```tsx
import { useOauthMonitor } from '@dapperduckling/oauth-monitor-react';

export const MyLoginModal = ({ title }) => {
    // 1. Get context
    const [context] = useOauthMonitor();
    const { ui } = context;
    const client = context.omcClient;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h1>{title}</h1>

                {ui.loginError && <p className="error">Server Connection Failed</p>}
                
                {!ui.loginError && ui.lengthyLogin && (
                    <p className="warning">Connecting is taking longer than usual...</p>
                )}

                <button onClick={() => client?.handleLogin(true)}>
                    Log In
                </button>
            </div>
        </div>
    );
};
```

### 2. Custom Logout Modal

Overrides the confirmation dialog shown before logging out.

**Configuration:**

```tsx
import { MyLogoutModal } from './MyLogoutModal';

const config = {
    react: {
        logoutModalComponent: MyLogoutModal
    }
};
```

**Implementation Example:**

```tsx
import { useOauthMonitor, OmcDispatchType } from '@dapperduckling/oauth-monitor-react';

export const MyLogoutModal = () => {
    const [context, dispatch] = useOauthMonitor();
    const client = context.omcClient;

    const handleLogout = () => {
        dispatch({ type: OmcDispatchType.EXECUTING_LOGOUT });
        client?.handleLogout();
    };

    const handleCancel = () => {
        dispatch({ type: OmcDispatchType.HIDE_DIALOG });
        client?.abortAuthCheck();
    };

    return (
        <div className="modal">
            <p>Sign out of your account?</p>
            <button onClick={handleLogout}>Confirm</button>
            <button onClick={handleCancel}>Cancel</button>
        </div>
    );
};
```

### 3. Custom Floating Pill

Overrides the small indicator shown to non-logged-in users.

**Configuration:**

```tsx
import { MyPill } from './MyPill';

const config = {
    react: {
        floatingPillComponent: MyPill
    }
};
```

**Implementation Example:**

```tsx
import { useOauthMonitor, OmcDispatchType } from '@dapperduckling/oauth-monitor-react';

export const MyPill = () => {
    const [context, dispatch] = useOauthMonitor();
    const client = context.omcClient;

    const openLogin = () => {
        dispatch({ type: OmcDispatchType.SHOW_LOGIN });
        client?.handleLogin(true);
    };

    return (
        <button className="sticky-login-btn" onClick={openLogin}>
            Not Logged In - Click to Login
        </button>
    );
};
```

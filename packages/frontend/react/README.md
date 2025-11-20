# OAuth Monitor for React

This package provides the official React implementation for OAuth Monitor, offering a set of components and hooks that simplify the process of tracking a user's authentication status. It is designed to be flexible and easy to integrate into any React project.

## Getting Started

1.  **Installation:**

    ```bash
    npm install @dapper-duckling/oauth-monitor-react
    ```

2.  **Set Up Backend Endpoints:**

    For this plugin to work, you must have a backend server that is properly configured to handle authentication requests. 
    
    > **Important!**
    > For more information on how to set up the required endpoints, please refer to the [main README file on GitHub](https://github.com/dapper-duckling/oauth-monitor#backend-server-setup).

3.  **Wrap your application with the `OAuthMonitor` provider:**

    ```jsx
    import { OAuthMonitor } from '@dapper-duckling/oauth-monitor-react';

    function App() {
        return (
            <OAuthMonitor>
                {/* Your application components */}
            </OAuthMonitor>
        );
    }
    ```

4.  **Use the `useOAuthMonitor` hook to access authentication status:**

    ```jsx
    import { useOAuthMonitor } from '@dapper-duckling/oauth-monitor-react';

    function MyComponent() {
        const { isAuthenticated, login, logout } = useOAuthMonitor();

        return (
            <div>
                {isAuthenticated ? (
                    <button onClick={logout}>Logout</button>
                ) : (
                    <button onClick={login}>Login</button>
                )}
            </div>
        );
    }
    ```

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { produce } from 'immer';
import { Login } from '../../../src/components/Login.js';
import {
  InitialContext,
  OauthMonitorContext,
  OauthMonitorDispatchContext,
  type OauthMonitorContextProps,
} from '../../../src/oauth-monitor-context.js';

const wrap = (state: OauthMonitorContextProps, dispatch = vi.fn()) =>
  ({ children }: { children: ReactNode }) => (
    <OauthMonitorContext.Provider value={state}>
      <OauthMonitorDispatchContext.Provider value={dispatch}>
        {children}
      </OauthMonitorDispatchContext.Provider>
    </OauthMonitorContext.Provider>
  );

const ctx = (overrides: (d: OauthMonitorContextProps) => void = () => {}) =>
  produce(InitialContext, (d) => {
    overrides(d);
  });

describe('Login', () => {
  it('shows "Checking Credentials" headline by default', () => {
    const Wrapper = wrap(ctx());
    render(<Login>x</Login>, { wrapper: Wrapper });
    expect(screen.getByText(/Checking Credentials/i)).toBeInTheDocument();
  });

  it('shows "Authentication Required" when showMustLoginOverlay is true', () => {
    const Wrapper = wrap(
      ctx((d) => {
        d.ui.showMustLoginOverlay = true;
      }),
    );
    render(<Login>x</Login>, { wrapper: Wrapper });
    expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
  });

  it('shows "Error Checking Credentials" when loginError is true', () => {
    const Wrapper = wrap(
      ctx((d) => {
        d.ui.loginError = true;
      }),
    );
    render(<Login>x</Login>, { wrapper: Wrapper });
    expect(screen.getByText(/Error Checking Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to communicate with server/i)).toBeInTheDocument();
  });

  it('shows lengthy-login subMsg when ui.lengthyLogin is set', () => {
    const Wrapper = wrap(
      ctx((d) => {
        d.ui.lengthyLogin = true;
      }),
    );
    render(<Login>x</Login>, { wrapper: Wrapper });
    expect(
      screen.getByText(/this is taking longer than expected/i),
    ).toBeInTheDocument();
  });

  it('clicking Login button calls client.handleLogin(true)', async () => {
    const handleLogin = vi.fn();
    const Wrapper = wrap(
      ctx((d) => {
        d.omcClient = { handleLogin } as unknown as typeof d.omcClient;
      }),
    );
    render(<Login>x</Login>, { wrapper: Wrapper });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /login/i }));
    expect(handleLogin).toHaveBeenCalledWith(true);
  });

  it('renders provided children', () => {
    const Wrapper = wrap(ctx());
    render(<Login><div data-testid="login-child">hi</div></Login>, { wrapper: Wrapper });
    expect(screen.getByTestId('login-child')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { produce } from 'immer';
import { Logout } from '../../../src/components/Logout.js';
import {
  InitialContext,
  OauthMonitorContext,
  OauthMonitorDispatchContext,
  type OauthMonitorContextProps,
} from '../../../src/oauth-monitor-context.js';
import { OmcDispatchType } from '../../../src/types.js';

const wrap = (state: OauthMonitorContextProps, dispatch = vi.fn()) =>
  ({ children }: { children: ReactNode }) => (
    <OauthMonitorContext.Provider value={state}>
      <OauthMonitorDispatchContext.Provider value={dispatch}>
        {children}
      </OauthMonitorDispatchContext.Provider>
    </OauthMonitorContext.Provider>
  );

describe('Logout', () => {
  it('renders the confirmation prompt', () => {
    const Wrapper = wrap(structuredClone(InitialContext));
    render(<Logout>x</Logout>, { wrapper: Wrapper });
    expect(screen.getByText(/Are you sure you want to log out/i)).toBeInTheDocument();
  });

  it('clicking Logout dispatches EXECUTING_LOGOUT and calls client.handleLogout', async () => {
    const handleLogout = vi.fn();
    const dispatch = vi.fn();
    const state = produce(InitialContext, (d) => {
      d.omcClient = { handleLogout } as unknown as typeof d.omcClient;
    });
    render(<Logout>x</Logout>, { wrapper: wrap(state, dispatch) });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: OmcDispatchType.EXECUTING_LOGOUT });
    expect(handleLogout).toHaveBeenCalledOnce();
  });

  it('renders provided children', () => {
    const Wrapper = wrap(structuredClone(InitialContext));
    render(<Logout><div data-testid="logout-child">y</div></Logout>, { wrapper: Wrapper });
    expect(screen.getByTestId('logout-child')).toBeInTheDocument();
  });
});

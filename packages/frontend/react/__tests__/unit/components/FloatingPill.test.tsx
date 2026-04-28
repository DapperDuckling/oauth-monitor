import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { produce } from 'immer';
import { FloatingPill } from '../../../src/components/FloatingPill.js';
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

describe('FloatingPill', () => {
  it('renders the not-logged-in copy', () => {
    render(<FloatingPill />, { wrapper: wrap(structuredClone(InitialContext)) });
    expect(screen.getByText(/Not Logged In/i)).toBeInTheDocument();
    expect(screen.getByText(/Viewing read-only mode/i)).toBeInTheDocument();
  });

  it('clicking Login dispatches SHOW_LOGIN and calls client.handleLogin(true)', async () => {
    const handleLogin = vi.fn();
    const dispatch = vi.fn();
    const state = produce(InitialContext, (d) => {
      d.omcClient = { handleLogin } as unknown as typeof d.omcClient;
    });
    render(<FloatingPill />, { wrapper: wrap(state, dispatch) });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /login/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: OmcDispatchType.SHOW_LOGIN });
    expect(handleLogin).toHaveBeenCalledWith(true);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { produce } from 'immer';
import { Overlay } from '../../../src/components/Overlay.js';
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

const baseProps = (over: Partial<Parameters<typeof Overlay>[0]> = {}) => ({
  mainMsg: 'Hello',
  button: { label: 'Go', onClick: vi.fn() },
  ...over,
});

describe('Overlay', () => {
  it('renders main message and button label', () => {
    render(<Overlay {...baseProps()} />, { wrapper: wrap(structuredClone(InitialContext)) });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('renders subMsg when provided', () => {
    render(<Overlay {...baseProps({ subMsg: 'sub-text' })} />, {
      wrapper: wrap(structuredClone(InitialContext)),
    });
    expect(screen.getByText('sub-text')).toBeInTheDocument();
  });

  it('clicking the button calls onClick', async () => {
    const onClick = vi.fn();
    render(<Overlay {...baseProps({ button: { label: 'X', onClick } })} />, {
      wrapper: wrap(structuredClone(InitialContext)),
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'X' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders close button when userCanClose; click dispatches HIDE_DIALOG and aborts auth check', async () => {
    const dispatch = vi.fn();
    const abortAuthCheck = vi.fn();
    const state = produce(InitialContext, (d) => {
      d.omcClient = { abortAuthCheck } as unknown as typeof d.omcClient;
    });
    render(<Overlay {...baseProps({ userCanClose: true })} />, {
      wrapper: wrap(state, dispatch),
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: OmcDispatchType.HIDE_DIALOG });
    expect(abortAuthCheck).toHaveBeenCalledOnce();
  });

  it('does NOT render close button when userCanClose is falsy', () => {
    render(<Overlay {...baseProps()} />, { wrapper: wrap(structuredClone(InitialContext)) });
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('renders children inside the dialog', () => {
    render(
      <Overlay {...baseProps()}>
        <div data-testid="child">in-dialog</div>
      </Overlay>,
      { wrapper: wrap(structuredClone(InitialContext)) },
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

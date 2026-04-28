import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Overlay from '../../../src/lib/components/Overlay.svelte';
import { OmcDispatchType } from '../../../src/lib/types.js';
import { makeMockClient, makeMockStore, ctxMap } from '../../helpers/factories.js';

const baseProps = (over: Record<string, unknown> = {}) => ({
  mainMsg: 'Hello',
  buttonLabel: 'Go',
  buttonAction: vi.fn(),
  ...over,
});

describe('Overlay.svelte', () => {
  it('renders main message and button label', () => {
    render(Overlay, { props: baseProps(), context: ctxMap() });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('renders subMsg when provided and non-empty', () => {
    render(Overlay, { props: baseProps({ subMsg: 'sub-text' }), context: ctxMap() });
    expect(screen.getByText('sub-text')).toBeInTheDocument();
  });

  it('clicking the button calls buttonAction', async () => {
    const buttonAction = vi.fn();
    render(Overlay, {
      props: baseProps({ buttonAction }),
      context: ctxMap(),
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(buttonAction).toHaveBeenCalledOnce();
  });

  it('renders close button when userCanClose=true; clicking dispatches HIDE_DIALOG and aborts auth check', async () => {
    const store = makeMockStore();
    const client = makeMockClient();
    render(Overlay, {
      props: baseProps({ userCanClose: true }),
      context: ctxMap(store, client),
    });
    await fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(store.dispatch).toHaveBeenCalledWith({
      type: OmcDispatchType.HIDE_DIALOG,
    });
    expect(client.abortAuthCheck).toHaveBeenCalledOnce();
  });

  it('does NOT render close button when userCanClose is false', () => {
    render(Overlay, { props: baseProps(), context: ctxMap() });
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });
});

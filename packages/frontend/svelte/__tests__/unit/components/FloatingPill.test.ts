import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FloatingPill from '../../../src/lib/components/FloatingPill.svelte';
import { OmcDispatchType } from '../../../src/lib/types.js';
import { makeMockClient, makeMockStore, ctxMap } from '../../helpers/factories.js';

describe('FloatingPill.svelte', () => {
  it('renders the not-logged-in copy', () => {
    render(FloatingPill, { context: ctxMap() });
    expect(screen.getByText(/Not Logged In/i)).toBeInTheDocument();
    expect(screen.getByText(/Viewing read-only mode/i)).toBeInTheDocument();
  });

  it('clicking Login dispatches SHOW_LOGIN and calls client.handleLogin(true)', async () => {
    const store = makeMockStore();
    const client = makeMockClient();
    render(FloatingPill, { context: ctxMap(store, client) });
    await fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(store.dispatch).toHaveBeenCalledWith({
      type: OmcDispatchType.SHOW_LOGIN,
    });
    expect(client.handleLogin).toHaveBeenCalledWith(true);
  });
});

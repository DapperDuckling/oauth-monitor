import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Logout from '../../../src/lib/components/Logout.svelte';
import { OmcDispatchType } from '../../../src/lib/types.js';
import { makeMockClient, makeMockStore, ctxMap } from '../../helpers/factories.js';

describe('Logout.svelte', () => {
  it('renders the confirmation prompt', () => {
    render(Logout, { context: ctxMap() });
    expect(screen.getByText(/Are you sure you want to log out/i)).toBeInTheDocument();
  });

  it('clicking Logout dispatches EXECUTING_LOGOUT and calls client.handleLogout', async () => {
    const store = makeMockStore();
    const client = makeMockClient();
    render(Logout, { context: ctxMap(store, client) });
    await fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(store.dispatch).toHaveBeenCalledWith({
      type: OmcDispatchType.EXECUTING_LOGOUT,
    });
    expect(client.handleLogout).toHaveBeenCalledOnce();
  });
});

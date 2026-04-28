import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Login from '../../../src/lib/components/Login.svelte';
import { makeMockClient, makeMockStore, ctxMap } from '../../helpers/factories.js';

describe('Login.svelte', () => {
  it('shows "Checking Credentials" by default', () => {
    render(Login, { context: ctxMap() });
    expect(screen.getByText(/Checking Credentials/i)).toBeInTheDocument();
  });

  it('shows "Authentication Required" when ui.showMustLoginOverlay', () => {
    const store = makeMockStore((s) => {
      s.ui.showMustLoginOverlay = true;
    });
    render(Login, { context: ctxMap(store) });
    expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
  });

  it('shows "Error Checking Credentials" when ui.loginError', () => {
    const store = makeMockStore((s) => {
      s.ui.loginError = true;
    });
    render(Login, { context: ctxMap(store) });
    expect(screen.getByText(/Error Checking Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to communicate with server/i)).toBeInTheDocument();
  });

  it('shows lengthy-login indicator when ui.lengthyLogin', () => {
    const store = makeMockStore((s) => {
      s.ui.lengthyLogin = true;
    });
    render(Login, { context: ctxMap(store) });
    expect(
      screen.getByText(/this is taking longer than expected/i),
    ).toBeInTheDocument();
  });

  it('clicking Login button calls client.handleLogin(true)', async () => {
    const client = makeMockClient();
    render(Login, { context: ctxMap(makeMockStore(), client) });
    await fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(client.handleLogin).toHaveBeenCalledWith(true);
  });
});

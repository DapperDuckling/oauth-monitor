import { describe, it, expect } from 'vitest';
import { render, container } from '@testing-library/svelte';
import LoginChild from '../../../src/lib/components/LoginChild.svelte';
import { makeMockStore, ctxMap } from '../../helpers/factories.js';

describe('LoginChild.svelte', () => {
  it('renders the indeterminate progress bar container', () => {
    const { container } = render(LoginChild, { context: ctxMap() });
    // Locked behavior: outermost wrapper exists with the bar inside it
    expect(container.querySelector('.animate-indeterminate-bar')).not.toBeNull();
  });

  it('bar wrapper is invisible when silentLoginInitiated=false', () => {
    const { container } = render(LoginChild, { context: ctxMap() });
    const wrapper = container.querySelector('.invisible');
    expect(wrapper).not.toBeNull();
  });

  it('bar wrapper is visible when silentLoginInitiated=true', () => {
    const store = makeMockStore((s) => {
      s.ui.silentLoginInitiated = true;
    });
    const { container } = render(LoginChild, { context: ctxMap(store) });
    expect(container.querySelector('.visible')).not.toBeNull();
  });
});

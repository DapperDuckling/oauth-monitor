import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { useOauthMonitor } from '../../src/use-oauth-monitor.js';
import {
  InitialContext,
  OauthMonitorContext,
  OauthMonitorDispatchContext,
} from '../../src/oauth-monitor-context.js';

describe('useOauthMonitor', () => {
  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useOauthMonitor())).toThrow(
      /must be used in components/i,
    );
  });

  it('returns [state, dispatch] from context', () => {
    const dispatch = () => undefined;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OauthMonitorContext.Provider value={InitialContext}>
        <OauthMonitorDispatchContext.Provider value={dispatch}>
          {children}
        </OauthMonitorDispatchContext.Provider>
      </OauthMonitorContext.Provider>
    );
    const { result } = renderHook(() => useOauthMonitor(), { wrapper });
    expect(result.current[0]).toBe(InitialContext);
    expect(result.current[1]).toBe(dispatch);
  });
});

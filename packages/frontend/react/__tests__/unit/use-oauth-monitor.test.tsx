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

  it('supports custom generic UserProfile types', () => {
    interface DoDUserProfile {
      rankCode: string;
      branchOfServiceCode: string;
      dutyOrgCode: string;
    }
    const dodState = {
      ...InitialContext,
      userStatus: {
        loggedIn: true,
        accessExpires: 999999,
        refreshExpires: 999999,
        profile: {
          rankCode: 'CAPT',
          branchOfServiceCode: 'N',
          dutyOrgCode: 'USN',
        },
      },
    };
    const dispatch = () => undefined;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OauthMonitorContext.Provider value={dodState as unknown as typeof InitialContext}>
        <OauthMonitorDispatchContext.Provider value={dispatch}>
          {children}
        </OauthMonitorDispatchContext.Provider>
      </OauthMonitorContext.Provider>
    );
    const { result } = renderHook(() => useOauthMonitor<DoDUserProfile>(), { wrapper });
    expect(result.current[0].userStatus.profile?.rankCode).toBe('CAPT');
    expect(result.current[0].userStatus.profile?.branchOfServiceCode).toBe('N');
    expect(result.current[0].userStatus.profile?.dutyOrgCode).toBe('USN');
  });
});

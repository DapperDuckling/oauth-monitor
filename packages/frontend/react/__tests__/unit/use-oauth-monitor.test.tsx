import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  useOauthMonitor,
  useUserProfile,
  useUserStatus,
  useOauthMonitorClient,
  useAuth,
} from '../../src/use-oauth-monitor.js';
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

describe('developer convenience hooks', () => {
  interface DoDUserProfile {
    rankCode: string;
    branchOfServiceCode: string;
    dutyOrgCode: string;
  }

  const mockClient = {
    authCheck: vi.fn(async () => {}),
    handleLogin: vi.fn(),
    handleLogout: vi.fn(),
  };

  const dodState = {
    ...InitialContext,
    omcClient: mockClient as any,
    userStatus: {
      loggedIn: true,
      accessExpires: 999999,
      refreshExpires: 999999,
      profile: {
        rankCode: 'CTR',
        branchOfServiceCode: 'A',
        dutyOrgCode: 'USA',
      },
    },
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <OauthMonitorContext.Provider value={dodState as unknown as typeof InitialContext}>
      <OauthMonitorDispatchContext.Provider value={() => undefined}>
        {children}
      </OauthMonitorDispatchContext.Provider>
    </OauthMonitorContext.Provider>
  );

  it('useUserProfile returns typed profile claims directly', () => {
    const { result } = renderHook(() => useUserProfile<DoDUserProfile>(), { wrapper });
    expect(result.current?.rankCode).toBe('CTR');
    expect(result.current?.branchOfServiceCode).toBe('A');
    expect(result.current?.dutyOrgCode).toBe('USA');
  });

  it('useUserStatus returns complete status object', () => {
    const { result } = renderHook(() => useUserStatus<DoDUserProfile>(), { wrapper });
    expect(result.current.loggedIn).toBe(true);
    expect(result.current.accessExpires).toBe(999999);
    expect(result.current.profile?.rankCode).toBe('CTR');
  });

  it('useOauthMonitorClient returns client instance', () => {
    const { result } = renderHook(() => useOauthMonitorClient(), { wrapper });
    expect(result.current).toBe(mockClient);
  });

  it('useAuth returns state and action helpers', async () => {
    const { result } = renderHook(() => useAuth<DoDUserProfile>(), { wrapper });
    expect(result.current.loggedIn).toBe(true);
    expect(result.current.profile?.rankCode).toBe('CTR');
    expect(result.current.client).toBe(mockClient);

    await result.current.refresh();
    expect(mockClient.authCheck).toHaveBeenCalledWith(true);

    result.current.login(false);
    expect(mockClient.handleLogin).toHaveBeenCalledWith(false);

    result.current.logout();
    expect(mockClient.handleLogout).toHaveBeenCalled();
  });
});

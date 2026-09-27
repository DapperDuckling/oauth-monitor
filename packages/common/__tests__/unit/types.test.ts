import { describe, it, expect } from 'vitest';
import { TokenType, RouteEnum } from '../../src/types.js';

describe('TokenType enum', () => {
  it('has stable numeric values (guards against reordering)', () => {
    expect(TokenType.ACCESS).toBe(0);
    expect(TokenType.REFRESH).toBe(1);
  });
});

describe('RouteEnum', () => {
  it('values match the keys of CustomRouteUrl', () => {
    expect(RouteEnum.LOGIN_PAGE).toBe('loginPage');
    expect(RouteEnum.LOGOUT_PAGE).toBe('logoutPage');
    expect(RouteEnum.USER_STATUS).toBe('userStatus');
  });
});

describe('UserStatus and UserProfile', () => {
  it('supports UserStatus without profile', () => {
    const status = {
      loggedIn: true,
      accessExpires: 1000,
      refreshExpires: 2000,
    };
    expect(status.loggedIn).toBe(true);
    expect(status.accessExpires).toBe(1000);
    expect(status.refreshExpires).toBe(2000);
  });

  it('supports UserStatus with full UserProfile and CAC claims', () => {
    const status = {
      loggedIn: true,
      accessExpires: 1000,
      refreshExpires: 2000,
      profile: {
        name: 'Duckworth, Jean-Luc CTR (USA)',
        displayName: 'Jean-Luc Duckworth',
        email: 'jean-luc@example.mil',
        preferredUsername: 'jean-luc',
        rankCode: 'CTR',
        branchOfServiceCode: 'A',
        dutyOrgCode: 'USA',
        company: 'Defense Systems',
        roles: ['admin', 'frontier-tester'],
        claims: {
          sub: '12345',
          dodUIC: 'W12345',
        },
      },
    };
    expect(status.profile.branchOfServiceCode).toBe('A');
    expect(status.profile.rankCode).toBe('CTR');
    expect(status.profile.roles).toContain('admin');
    expect(status.profile.claims?.dodUIC).toBe('W12345');
  });
});


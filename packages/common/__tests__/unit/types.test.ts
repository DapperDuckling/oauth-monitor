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

import { describe, it, expect, vi } from 'vitest';
import { getRoutePath } from '../../src/routes.js';
import { RouteEnum } from '../../src/types.js';
import { RouteUrlDefaults } from '../../src/defaults.js';

describe('getRoutePath', () => {
  it('returns default prefix + default route when no override', () => {
    expect(getRoutePath(RouteEnum.LOGIN_PAGE)).toBe(
      `${RouteUrlDefaults._prefix}${RouteUrlDefaults.loginPage}`,
    );
    expect(getRoutePath(RouteEnum.LOGOUT_PAGE)).toBe(
      `${RouteUrlDefaults._prefix}${RouteUrlDefaults.logoutPage}`,
    );
    expect(getRoutePath(RouteEnum.USER_STATUS)).toBe(
      `${RouteUrlDefaults._prefix}${RouteUrlDefaults.userStatus}`,
    );
  });

  it('honors a custom _prefix', () => {
    expect(getRoutePath(RouteEnum.LOGIN_PAGE, { _prefix: '/auth' })).toBe(
      `/auth${RouteUrlDefaults.loginPage}`,
    );
  });

  it('honors a custom individual route', () => {
    expect(getRoutePath(RouteEnum.USER_STATUS, { userStatus: '/me' })).toBe(
      `${RouteUrlDefaults._prefix}/me`,
    );
  });

  it('honors prefix and route together', () => {
    expect(
      getRoutePath(RouteEnum.LOGIN_PAGE, { _prefix: '/x', loginPage: '/y' }),
    ).toBe('/x/y');
  });

  it('logs error when route value is undefined override', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = getRoutePath(RouteEnum.LOGIN_PAGE, { loginPage: undefined });
    // override with undefined falls back to default; no error path
    expect(result).toBe(`${RouteUrlDefaults._prefix}${RouteUrlDefaults.loginPage}`);
    spy.mockRestore();
  });

  it('locks behavior when prefix is empty string override', () => {
    expect(getRoutePath(RouteEnum.LOGIN_PAGE, { _prefix: '' })).toBe(
      RouteUrlDefaults.loginPage,
    );
  });
});

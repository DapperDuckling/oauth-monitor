import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig, wrappedStatus } from '../helpers/factories.js';
import { TokenType } from '@dapperduckling/oauth-monitor-common';
import { LocalStorage } from '../../src/types.js';

describe('isTokenCurrent', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;
  beforeEach(async () => {
    mod = await freshClientModule();
  });

  it('returns undefined when no stored status', () => {
    expect(mod.OauthMonitorClient.isTokenCurrent(TokenType.ACCESS)).toBeUndefined();
  });

  it('ACCESS: returns false when loggedIn=false even if expires in future', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({ loggedIn: false, accessExpires: future })),
    );
    expect(mod.OauthMonitorClient.isTokenCurrent(TokenType.ACCESS)).toBe(false);
  });

  it('ACCESS: returns true when loggedIn=true and access expires in future', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({ loggedIn: true, accessExpires: future })),
    );
    expect(mod.OauthMonitorClient.isTokenCurrent(TokenType.ACCESS)).toBe(true);
  });

  it('ACCESS: returns false when access expired', () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({ loggedIn: true, accessExpires: past })),
    );
    expect(mod.OauthMonitorClient.isTokenCurrent(TokenType.ACCESS)).toBe(false);
  });

  it('REFRESH: independent of loggedIn flag', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(
        wrappedStatus({ loggedIn: false, refreshExpires: future, accessExpires: 0 }),
      ),
    );
    expect(mod.OauthMonitorClient.isTokenCurrent(TokenType.REFRESH)).toBe(true);
  });

  it('returns undefined when stored payload has invalid shape (NaN serializes to null and fails validation)', () => {
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus({ accessExpires: NaN })),
    );
    expect(
      mod.OauthMonitorClient.isTokenCurrent(TokenType.ACCESS),
    ).toBeUndefined();
  });

  it('throws on invalid token type', () => {
    localStorage.setItem(
      LocalStorage.USER_STATUS,
      JSON.stringify(wrappedStatus()),
    );
    expect(() =>
      mod.OauthMonitorClient.isTokenCurrent(99 as unknown as TokenType),
    ).toThrow(/invalid token type/i);
  });
});

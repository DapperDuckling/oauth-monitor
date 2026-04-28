import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIG = process.env['NODE_ENV'];

describe('connector-cookies', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    if (ORIG === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = ORIG;
  });

  it('uses dev prefix when NODE_ENV=development', async () => {
    process.env['NODE_ENV'] = 'development';
    const mod = await import('../../src/connector-cookies.js');
    expect(mod.STORAGE_PREFIX_COMBINED).toBe('__DEV_ONLY-omc-');
    expect(mod.ConnectorCookies.ACCESS_TOKEN).toBe('__DEV_ONLY-omc-access');
  });

  it('uses secure prefix when NODE_ENV is not development', async () => {
    process.env['NODE_ENV'] = 'production';
    const mod = await import('../../src/connector-cookies.js');
    expect(mod.STORAGE_PREFIX_COMBINED).toBe('__SECURE-omc-');
    expect(mod.ConnectorCookies.ACCESS_TOKEN).toBe('__SECURE-omc-access');
  });

  it('uses secure prefix when NODE_ENV unset', async () => {
    delete process.env['NODE_ENV'];
    const mod = await import('../../src/connector-cookies.js');
    expect(mod.STORAGE_PREFIX_COMBINED).toBe('__SECURE-omc-');
  });

  it('ConnectorCookies is frozen', async () => {
    const { ConnectorCookies } = await import('../../src/connector-cookies.js');
    expect(Object.isFrozen(ConnectorCookies)).toBe(true);
  });

  it('ConnectorCookieNames contains all 7 values', async () => {
    const { ConnectorCookies, ConnectorCookieNames } = await import(
      '../../src/connector-cookies.js'
    );
    expect(ConnectorCookieNames).toHaveLength(7);
    expect(ConnectorCookieNames).toEqual(Object.values(ConnectorCookies));
  });

  it('ConnectorCookiesToKeep contains exactly access/refresh/refresh-expiration/id', async () => {
    const { ConnectorCookies, ConnectorCookiesToKeep } = await import(
      '../../src/connector-cookies.js'
    );
    expect(ConnectorCookiesToKeep).toHaveLength(4);
    expect(ConnectorCookiesToKeep).toEqual(
      expect.arrayContaining([
        ConnectorCookies.ACCESS_TOKEN,
        ConnectorCookies.REFRESH_TOKEN,
        ConnectorCookies.REFRESH_TOKEN_EXPIRATION,
        ConnectorCookies.ID_TOKEN,
      ]),
    );
  });
});

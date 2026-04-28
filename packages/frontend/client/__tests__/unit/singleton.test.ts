import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig } from '../helpers/factories.js';

describe('OauthMonitorClient singleton', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;

  beforeEach(async () => {
    mod = await freshClientModule();
  });

  it('instance() returns the same instance for repeated calls with same config', () => {
    const cfg = baseConfig();
    const a = mod.OauthMonitorClient.instance(cfg);
    const b = mod.OauthMonitorClient.instance(cfg);
    expect(a).toBe(b);
  });

  it('instance() throws when called with a different config', () => {
    mod.OauthMonitorClient.instance(baseConfig());
    expect(() => mod.OauthMonitorClient.instance(baseConfig())).toThrow(
      /already instantiated/i,
    );
  });

  it('after destroy(), next instance() produces a fresh instance', () => {
    const a = mod.OauthMonitorClient.instance(baseConfig());
    a.destroy();
    const b = mod.OauthMonitorClient.instance(baseConfig());
    expect(b).not.toBe(a);
  });

  it('oauthMonitorClient() factory delegates to instance()', () => {
    const cfg = baseConfig();
    const a = mod.oauthMonitorClient(cfg);
    const b = mod.OauthMonitorClient.instance(cfg);
    expect(a).toBe(b);
  });
});

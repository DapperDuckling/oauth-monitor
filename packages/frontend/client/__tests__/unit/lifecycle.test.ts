import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshClientModule } from '../helpers/freshClient.js';
import { baseConfig } from '../helpers/factories.js';

describe('OauthMonitorClient lifecycle', () => {
  let mod: Awaited<ReturnType<typeof freshClientModule>>;
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    mod = await freshClientModule();
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 401 }));
  });

  it('start() registers storage, focus, and message listeners', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    const events = addSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain('storage');
    expect(events).toContain('focus');
    expect(events).toContain('message');
    c.destroy();
  });

  it('isStarted() reports the started flag', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    expect(c.isStarted()).toBe(false);
    c.start();
    expect(c.isStarted()).toBe(true);
    c.destroy();
  });

  it('start() called twice logs an error via the configured logger', () => {
    const error = vi.fn();
    const logger = {
      child: vi.fn().mockReturnThis(),
      error,
      debug: vi.fn(),
    } as unknown as Parameters<typeof baseConfig>[0]['logger'];
    const c = mod.OauthMonitorClient.instance(baseConfig({ logger }));
    c.start();
    c.start();
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/already started/i));
    c.destroy();
  });

  it('destroy() removes storage, focus, and message listeners', () => {
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    removeSpy.mockClear();
    c.destroy();
    const events = removeSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain('storage');
    expect(events).toContain('focus');
    expect(events).toContain('message');
  });

  it('destroy() aborts an in-flight authCheck', async () => {
    let signalCaptured: AbortSignal | undefined;
    fetchSpy.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          signalCaptured = (init as RequestInit).signal as AbortSignal;
          signalCaptured?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const c = mod.OauthMonitorClient.instance(baseConfig());
    c.start();
    await vi.advanceTimersByTimeAsync(0);
    c.destroy();
    expect(signalCaptured?.aborted).toBe(true);
  });
});

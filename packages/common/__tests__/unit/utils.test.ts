import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  epoch,
  isDev,
  isObject,
  deferredFactory,
  URL as URLPolyfill,
  decodePayloadFromBase64,
} from '../../src/utils.js';

describe('epoch', () => {
  it('returns floor(now/1000) by default', () => {
    const before = Math.floor(Date.now() / 1000);
    const result = epoch();
    const after = Math.floor(Date.now() / 1000);
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('honors a passed Date', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    expect(epoch(d)).toBe(Math.floor(d.getTime() / 1000));
  });

  it('returns integer for fractional ms', () => {
    const d = new Date(1700000000123);
    expect(epoch(d)).toBe(1700000000);
  });
});

describe('isDev', () => {
  const origNodeEnv = process.env['NODE_ENV'];
  afterEach(() => {
    if (origNodeEnv === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = origNodeEnv;
  });

  it('true when NODE_ENV=development', () => {
    process.env['NODE_ENV'] = 'development';
    expect(isDev()).toBe(true);
  });

  it('false when NODE_ENV=production', () => {
    process.env['NODE_ENV'] = 'production';
    expect(isDev()).toBe(false);
  });

  it('false when NODE_ENV unset', () => {
    delete process.env['NODE_ENV'];
    expect(isDev()).toBe(false);
  });
});

describe('isObject', () => {
  it.each([
    [{}, true],
    [{ a: 1 }, true],
    [[], true],
    [[1, 2], true],
    [new Date(), true],
    [new Map(), true],
  ])('true for %o', (val, expected) => {
    expect(isObject(val)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [0],
    [1],
    [''],
    ['hi'],
    [true],
    [false],
    [Symbol('x')],
  ])('false for primitive/null %o', (val) => {
    expect(isObject(val)).toBe(false);
  });
});

describe('deferredFactory', () => {
  it('returns promise + resolve + reject', () => {
    const d = deferredFactory<string>();
    expect(d.promise).toBeInstanceOf(Promise);
    expect(typeof d.resolve).toBe('function');
    expect(typeof d.reject).toBe('function');
  });

  it('resolve fulfills the promise', async () => {
    const d = deferredFactory<number>();
    d.resolve(42);
    await expect(d.promise).resolves.toBe(42);
  });

  it('reject rejects the promise', async () => {
    const d = deferredFactory<number>();
    d.reject(new Error('boom'));
    await expect(d.promise).rejects.toThrow('boom');
  });
});

describe('URL polyfill', () => {
  it('canParse returns true for valid URLs', () => {
    expect(URLPolyfill.canParse('https://example.com/foo')).toBe(true);
  });

  it('canParse returns false for invalid URLs', () => {
    expect(URLPolyfill.canParse('not a url')).toBe(false);
  });

  it('falls back when native URL.canParse missing', () => {
    const native = URL.canParse;
    // @ts-expect-error force absence
    URL.canParse = undefined;
    try {
      expect(URLPolyfill.canParse('https://example.com')).toBe(true);
      expect(URLPolyfill.canParse('::not-a-url::')).toBe(false);
    } finally {
      URL.canParse = native;
    }
  });
});

describe('decodePayloadFromBase64', () => {
  it('decodes base64 JSON payload', () => {
    const obj = { a: 1, b: 'two', c: [3] };
    const b64 = Buffer.from(JSON.stringify(obj)).toString('base64');
    expect(decodePayloadFromBase64(b64)).toEqual(obj);
  });

  it('handles unicode in payload', () => {
    const obj = { greeting: 'héllo 🌍' };
    const b64 = Buffer.from(JSON.stringify(obj)).toString('base64');
    expect(decodePayloadFromBase64(b64)).toEqual(obj);
  });

  it('throws on invalid JSON content', () => {
    const b64 = Buffer.from('{not json').toString('base64');
    expect(() => decodePayloadFromBase64(b64)).toThrow();
  });
});

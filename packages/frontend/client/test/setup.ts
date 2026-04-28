import { vi, beforeEach, afterEach } from 'vitest';

// Mock typia: in production it's replaced at compile time by ts-patch + typia transform.
// In tests we provide a structural validator for UserStatusWrapped that tests can override per-case
// via vi.mocked(typia.is).mockReturnValueOnce(false).
vi.mock('typia', () => {
  const isUserStatusWrapped = (x: unknown): boolean => {
    if (x === null || typeof x !== 'object') return false;
    const obj = x as Record<string, unknown>;
    if (typeof obj['checksum'] !== 'string') return false;
    if (typeof obj['timestamp'] !== 'number') return false;
    const payload = obj['payload'];
    if (payload === null || typeof payload !== 'object') return false;
    const p = payload as Record<string, unknown>;
    return (
      typeof p['loggedIn'] === 'boolean' &&
      typeof p['accessExpires'] === 'number' &&
      typeof p['refreshExpires'] === 'number'
    );
  };
  return {
    is: vi.fn(isUserStatusWrapped),
    default: { is: vi.fn(isUserStatusWrapped) },
  };
});

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
  localStorage.clear();
});

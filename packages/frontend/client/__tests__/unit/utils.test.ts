import { describe, it, expect, vi } from 'vitest';
import { setImmediate } from '../../src/utils.js';

describe('setImmediate (client utils)', () => {
  it('schedules the handler via setTimeout(_, 0)', () => {
    const fn = vi.fn();
    setImmediate(fn);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledOnce();
  });
});

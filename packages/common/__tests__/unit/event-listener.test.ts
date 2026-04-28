import { describe, it, expect, vi } from 'vitest';
import { EventListener } from '../../src/event-listener.js';

type TestEvent = 'A' | 'B' | 'C';

describe('EventListener', () => {
  it('registers and dispatches a listener', () => {
    const el = new EventListener<TestEvent>();
    const cb = vi.fn();
    el.addEventListener('A', cb);
    el.dispatchEvent('A');
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith('A', undefined);
  });

  it('passes payload to listener', () => {
    const el = new EventListener<TestEvent>();
    const cb = vi.fn();
    el.addEventListener('A', cb);
    el.dispatchEvent('A', { value: 7 });
    expect(cb).toHaveBeenCalledWith('A', { value: 7 });
  });

  it('multiple listeners on the same event all fire', () => {
    const el = new EventListener<TestEvent>();
    const a = vi.fn();
    const b = vi.fn();
    el.addEventListener('A', a);
    el.addEventListener('A', b);
    el.dispatchEvent('A');
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('removeEventListener removes only the specified listener', () => {
    const el = new EventListener<TestEvent>();
    const a = vi.fn();
    const b = vi.fn();
    el.addEventListener('A', a);
    el.addEventListener('A', b);
    el.removeEventListener('A', a);
    el.dispatchEvent('A');
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it('removeEventListener is a no-op when listener not registered', () => {
    const el = new EventListener<TestEvent>();
    const cb = vi.fn();
    expect(() => el.removeEventListener('A', cb)).not.toThrow();
  });

  it('wildcard listener fires for any event with correct event name', () => {
    const el = new EventListener<TestEvent>();
    const wild = vi.fn();
    el.addEventListener('*', wild);
    el.dispatchEvent('A', 1);
    el.dispatchEvent('B', 2);
    el.dispatchEvent('C', 3);
    expect(wild).toHaveBeenCalledTimes(3);
    expect(wild).toHaveBeenNthCalledWith(1, 'A', 1);
    expect(wild).toHaveBeenNthCalledWith(2, 'B', 2);
    expect(wild).toHaveBeenNthCalledWith(3, 'C', 3);
  });

  it('wildcard fires alongside specific listener', () => {
    const el = new EventListener<TestEvent>();
    const specific = vi.fn();
    const wild = vi.fn();
    el.addEventListener('A', specific);
    el.addEventListener('*', wild);
    el.dispatchEvent('A', 'p');
    expect(specific).toHaveBeenCalledWith('A', 'p');
    expect(wild).toHaveBeenCalledWith('A', 'p');
  });

  it('removing wildcard does not affect specific listeners', () => {
    const el = new EventListener<TestEvent>();
    const specific = vi.fn();
    const wild = vi.fn();
    el.addEventListener('A', specific);
    el.addEventListener('*', wild);
    el.removeEventListener('*', wild);
    el.dispatchEvent('A');
    expect(specific).toHaveBeenCalledOnce();
    expect(wild).not.toHaveBeenCalled();
  });

  it('dispatch on event with no listeners does not throw', () => {
    const el = new EventListener<TestEvent>();
    expect(() => el.dispatchEvent('A')).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { OmcDispatchType } from '../../src/types.js';

describe('OmcDispatchType enum', () => {
  it('has stable string values (locks switch behavior)', () => {
    expect(OmcDispatchType.DESTROY_CLIENT).toBe('DESTROY_CLIENT');
    expect(OmcDispatchType.SET_OMC_CLIENT).toBe('SET_OMC_CLIENT');
    expect(OmcDispatchType.OMC_CLIENT_EVENT).toBe('OMC_CLIENT_EVENT');
    expect(OmcDispatchType.LENGTHY_LOGIN).toBe('LENGTHY_LOGIN');
    expect(OmcDispatchType.SHOW_LOGIN).toBe('SHOW_LOGIN');
    expect(OmcDispatchType.SHOW_LOGOUT).toBe('SHOW_LOGOUT');
    expect(OmcDispatchType.EXECUTING_LOGOUT).toBe('EXECUTING_LOGOUT');
    expect(OmcDispatchType.HIDE_DIALOG).toBe('HIDE_DIALOG');
  });
});

import { validatePreflightInput, TRACER_LIMITS } from '../input-validator';

describe('validatePreflightInput', () => {
  it('accepts valid small inputs', () => {
    const res = validatePreflightInput('[ [1, 3, 5, 7, 9], 12 ]');
    expect(res.valid).toBe(true);
    expect(res.args).toEqual([[1, 3, 5, 7, 9], 12]);
  });

  it('accepts comma-separated arguments', () => {
    const res = validatePreflightInput('[1, 3, 5], 8');
    expect(res.valid).toBe(true);
    expect(res.args).toEqual([[1, 3, 5], 8]);
  });

  it('rejects empty input', () => {
    const res = validatePreflightInput('');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Input is required');
  });

  it('rejects invalid JSON', () => {
    const res = validatePreflightInput('{ not json }');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('not valid JSON');
  });

  it('rejects 1D arrays exceeding length limit (16)', () => {
    const bigArr = new Array(20).fill(1);
    const res = validatePreflightInput(JSON.stringify([bigArr]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds dry-run limit of 16');
  });

  it('rejects strings exceeding length limit (32)', () => {
    const longStr = 'a'.repeat(35);
    const res = validatePreflightInput(JSON.stringify([longStr]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds dry-run limit of 32');
  });

  it('rejects 2D matrices exceeding row limit (8)', () => {
    const bigMatrix = new Array(10).fill([1, 2]);
    const res = validatePreflightInput(JSON.stringify([bigMatrix]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceed maximum limit of 8');
  });

  it('rejects payloads exceeding 2KB', () => {
    const hugePayload = ' ' + '1,'.repeat(1200) + '1';
    const res = validatePreflightInput(hugePayload);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds maximum limit of 2KB');
  });
});

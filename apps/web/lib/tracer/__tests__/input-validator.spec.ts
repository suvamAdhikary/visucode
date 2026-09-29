import { validatePreflightInput, TRACER_LIMITS } from '../input-validator';

describe('validatePreflightInput', () => {
  it('exposes ADR-002 limit constants', () => {
    expect(TRACER_LIMITS.MAX_1D_ARRAY_LENGTH).toBe(16);
    expect(TRACER_LIMITS.MAX_2D_ROWS).toBe(8);
    expect(TRACER_LIMITS.MAX_2D_COLS).toBe(8);
    expect(TRACER_LIMITS.MAX_STRING_LENGTH).toBe(32);
    expect(TRACER_LIMITS.MAX_OBJECT_KEYS).toBe(16);
    expect(TRACER_LIMITS.MAX_NESTING_DEPTH).toBe(4);
    expect(TRACER_LIMITS.MAX_PAYLOAD_BYTES).toBe(2048);
  });

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

  it('accepts raw arrays and objects', () => {
    const res = validatePreflightInput([[1, 2, 3], 4]);
    expect(res.valid).toBe(true);
    expect(res.args).toEqual([[1, 2, 3], 4]);
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

  it('rejects 1000-element array before Worker start (F-LDR-S1-08)', () => {
    const thousandElements = new Array(1000).fill(0);
    const res = validatePreflightInput(JSON.stringify([thousandElements]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds dry-run limit of 16');
  });

  it('rejects strings exceeding length limit (32)', () => {
    const longStr = 'a'.repeat(35);
    const res = validatePreflightInput(JSON.stringify([longStr]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds dry-run limit of 32');
  });

  it('accepts strings within length limit (32)', () => {
    const validStr = 'a'.repeat(32);
    const res = validatePreflightInput(JSON.stringify([validStr]));
    expect(res.valid).toBe(true);
  });

  it('rejects 2D matrices exceeding row limit (8)', () => {
    const bigMatrix = new Array(10).fill([1, 2]);
    const res = validatePreflightInput(JSON.stringify([bigMatrix]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceed maximum limit of 8');
  });

  it('rejects 2D matrices exceeding column limit (8)', () => {
    const wideMatrix = [new Array(10).fill(1)];
    const res = validatePreflightInput(JSON.stringify([wideMatrix]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('column count 10 exceeds maximum limit of 8');
  });

  it('rejects objects exceeding key count limit (16)', () => {
    const wideObj = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`key${i}`, i]));
    const res = validatePreflightInput(JSON.stringify([wideObj]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Object key count 20 exceeds dry-run limit of 16');
  });

  it('rejects deeply nested structures exceeding depth limit (4)', () => {
    const deepObj = { a: { b: { c: { d: { e: 1 } } } } };
    const res = validatePreflightInput(JSON.stringify([deepObj]));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('nesting depth exceeds maximum allowed limit of 4');
  });

  it('rejects payloads exceeding 2KB', () => {
    const hugePayload = ' ' + '1,'.repeat(1200) + '1';
    const res = validatePreflightInput(hugePayload);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds maximum limit of 2KB');
  });
});

import type { TracePreflightResult } from './types';

export const TRACER_LIMITS = {
  MAX_PAYLOAD_BYTES: 2048,
  MAX_NESTING_DEPTH: 4,
  MAX_1D_ARRAY_LENGTH: 16,
  MAX_2D_ROWS: 8,
  MAX_2D_COLS: 8,
  MAX_STRING_LENGTH: 32,
  MAX_OBJECT_KEYS: 16,
};

/**
 * Validates input data for Live Dry Run before launching the Worker.
 * Enforces hard size and shape limits defined in ADR-002 Decision 5 (F-LDR-S1-08).
 */
export function validatePreflightInput(rawInput: string | unknown): TracePreflightResult {
  if (rawInput === undefined || rawInput === null || (typeof rawInput === 'string' && rawInput.trim() === '')) {
    return {
      valid: false,
      error: 'Input is required for dry run. Please provide valid input arguments.',
    };
  }

  let args: any[];

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (trimmed.length > TRACER_LIMITS.MAX_PAYLOAD_BYTES) {
      return {
        valid: false,
        error: `Input payload exceeds maximum limit of 2KB (got ${trimmed.length} characters).`,
      };
    }

    // Check if input uses LeetCode assignment prose like "head = [1,2,3,4,5]" or "nums = [2,7,11,15], target = 9"
    const hasAssignments = /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/i.test(trimmed);
    if (hasAssignments) {
      try {
        const stripped = trimmed.replace(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*/g, '');
        const wrappedStripped = JSON.parse(`[${stripped}]`);
        args = Array.isArray(wrappedStripped) ? wrappedStripped : [wrappedStripped];
      } catch {
        return {
          valid: false,
          error: 'Input has assignment syntax but contains invalid JSON values. Please check syntax.',
        };
      }
    } else {
      try {
        const parsed = JSON.parse(trimmed);
        args = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Try wrapping in array if user passed comma-separated arguments: e.g. [1, 2, 3], 6
        try {
          const wrapped = JSON.parse(`[${trimmed}]`);
          args = wrapped;
        } catch {
          return {
            valid: false,
            error: 'Input is not valid JSON. Please check syntax.',
          };
        }
      }
    }
  } else if (Array.isArray(rawInput)) {
    args = rawInput;
  } else {
    args = [rawInput];
  }

  // Validate structural shape limits on arguments
  for (let i = 0; i < args.length; i++) {
    const error = checkValueLimits(args[i], 1);
    if (error) {
      return {
        valid: false,
        error: `Argument ${i + 1}: ${error}`,
      };
    }
  }

  return {
    valid: true,
    args,
  };
}

function checkValueLimits(val: any, depth: number): string | null {
  if (depth > TRACER_LIMITS.MAX_NESTING_DEPTH) {
    return `Input nesting depth exceeds maximum allowed limit of ${TRACER_LIMITS.MAX_NESTING_DEPTH}.`;
  }

  if (typeof val === 'string') {
    if (val.length > TRACER_LIMITS.MAX_STRING_LENGTH) {
      return `String length ${val.length} exceeds dry-run limit of ${TRACER_LIMITS.MAX_STRING_LENGTH}.`;
    }
    return null;
  }

  if (Array.isArray(val)) {
    // Check if 2D matrix
    const is2D = val.length > 0 && val.every((item) => Array.isArray(item));
    if (is2D) {
      if (val.length > TRACER_LIMITS.MAX_2D_ROWS) {
        return `2D grid rows ${val.length} exceed maximum limit of ${TRACER_LIMITS.MAX_2D_ROWS}.`;
      }
      for (const row of val) {
        if (row.length > TRACER_LIMITS.MAX_2D_COLS) {
          return `2D grid column count ${row.length} exceeds maximum limit of ${TRACER_LIMITS.MAX_2D_COLS}.`;
        }
      }
    } else {
      if (val.length > TRACER_LIMITS.MAX_1D_ARRAY_LENGTH) {
        return `Array length ${val.length} exceeds dry-run limit of ${TRACER_LIMITS.MAX_1D_ARRAY_LENGTH}.`;
      }
    }

    // Check inner elements
    for (const item of val) {
      const err = checkValueLimits(item, depth + 1);
      if (err) return err;
    }
    return null;
  }

  if (val !== null && typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length > TRACER_LIMITS.MAX_OBJECT_KEYS) {
      return `Object key count ${keys.length} exceeds dry-run limit of ${TRACER_LIMITS.MAX_OBJECT_KEYS}.`;
    }
    for (const k of keys) {
      const err = checkValueLimits(val[k], depth + 1);
      if (err) return err;
    }
  }

  return null;
}

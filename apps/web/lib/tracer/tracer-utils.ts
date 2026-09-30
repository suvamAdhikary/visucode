import type { Variable } from '@visucode/shared-types';
import type { DiagnosticKind } from './types';

export const MAX_STEPS = 500;
export const MAX_RECURSION_DEPTH = 50;

/**
 * Safely stringifies runtime JavaScript values, avoiding circular reference explosions.
 */
export function safeStringify(val: any, seen = new Set<any>()): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;

  if (typeof val === 'object') {
    if (seen.has(val)) return '[Circular]';
    seen.add(val);

    try {
      if (Array.isArray(val)) {
        const items = val.map((item) => safeStringify(item, seen));
        return `[${items.join(', ')}]`;
      }
      const entries = Object.entries(val).map(
        ([k, v]) => `${JSON.stringify(k)}: ${safeStringify(v, seen)}`
      );
      return `{${entries.join(', ')}}`;
    } finally {
      seen.delete(val);
    }
  }

  return String(val);
}

/**
 * Returns simplified type label for Variable display.
 */
export function getVariableType(val: any): Variable['type'] {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'boolean') return 'boolean';
  return 'object';
}

/**
 * Creates user-friendly, factual diagnostic advice without LLM hallucination.
 */
export function createDiagnosticSuggestion(kind: DiagnosticKind, line?: number): string {
  switch (kind) {
    case 'loop-hang':
      return `Check loop termination conditions near line ${line || '?'}. Variables are not changing between iterations.`;
    case 'step-cap-exceeded':
      return `Execution exceeded the maximum limit of ${MAX_STEPS} steps. Ensure loops and recursions have valid base cases.`;
    case 'recursion-depth-exceeded':
      return `Call stack reached depth of ${MAX_RECURSION_DEPTH}. Check for missing or unreachable recursive base cases.`;
    case 'timeout':
      return `Execution timed out after 2 seconds. Check for long-running operations or unoptimized iterations.`;
    case 'runtime-error':
      return `A runtime exception occurred near line ${line || '?'}. Check for null/undefined property accesses.`;
    default:
      return 'Check code logic and boundary constraints.';
  }
}

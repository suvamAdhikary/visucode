import type {
  ArrayVisualizerState,
  DpTableVisualizerState,
  HashMapVisualizerState,
  HashMapEntry,
  Pointer,
} from '@visucode/shared-types';
import { safeStringify } from './tracer-context';

export interface VisualizerStateResult {
  arrayState?: ArrayVisualizerState;
  pointers?: Pointer[];
  dpTableState?: DpTableVisualizerState;
  hashMapState?: HashMapVisualizerState;
}

const POINTER_NAMES = new Set([
  'left',
  'right',
  'lo',
  'hi',
  'low',
  'high',
  'mid',
  'middle',
  'start',
  'end',
  'i',
  'j',
  'k',
  'p',
  'ptr',
  'p1',
  'p2',
  'curr',
  'slow',
  'fast',
]);

const POINTER_COLORS: Record<string, string> = {
  left: '#06b6d4',
  lo: '#06b6d4',
  low: '#06b6d4',
  start: '#06b6d4',
  p1: '#06b6d4',
  slow: '#06b6d4',
  right: '#a855f7',
  hi: '#a855f7',
  high: '#a855f7',
  end: '#a855f7',
  p2: '#a855f7',
  fast: '#a855f7',
  mid: '#f59e0b',
  middle: '#f59e0b',
  i: '#3b82f6',
  j: '#10b981',
  k: '#ec4899',
  p: '#38bdf8',
  ptr: '#38bdf8',
  curr: '#f43f5e',
};

const ARRAY_PRIORITY_NAMES = ['nums', 'arr', 'array', 'list', 'elements', 'data'];
const DP_PRIORITY_NAMES = ['dp', 'grid', 'matrix', 'table', 'memo', 'board'];
const MAP_PRIORITY_NAMES = ['map', 'seen', 'counts', 'count', 'freq', 'dict', 'lookup', 'hash'];

/**
 * Infers on-the-go visuals from runtime local variables (Sprint 2 - ADR-002, F-LDR-S2-01..04).
 * Pure mapper function with zero side effects.
 */
export function inferStepVisualizerState(
  locals: Record<string, any>
): VisualizerStateResult {
  const result: VisualizerStateResult = {};

  const entries = Object.entries(locals).filter(
    ([k]) => !['this', 'arguments', '__vc', '__vc_ret'].includes(k)
  );

  // 1. Identify 2D Arrays -> dpTableState (F-LDR-S2-02)
  let dpEntry = entries.find(
    ([k, v]) =>
      DP_PRIORITY_NAMES.includes(k.toLowerCase()) &&
      Array.isArray(v) &&
      v.length > 0 &&
      Array.isArray(v[0])
  );

  if (!dpEntry) {
    dpEntry = entries.find(
      ([, v]) => Array.isArray(v) && v.length > 0 && Array.isArray(v[0])
    );
  }

  if (dpEntry) {
    const rawGrid: any[][] = dpEntry[1];
    const grid = rawGrid.map((row) =>
      Array.isArray(row)
        ? row.map((cell) =>
            cell === undefined || cell === null
              ? null
              : typeof cell === 'number' || typeof cell === 'string'
              ? cell
              : safeStringify(cell)
          )
        : []
    );

    // Check for row/col pointers like i, j
    let activeCell: [number, number] | undefined;
    const rowIdx = locals['i'] ?? locals['row'] ?? locals['r'];
    const colIdx = locals['j'] ?? locals['col'] ?? locals['c'];
    if (
      typeof rowIdx === 'number' &&
      Number.isInteger(rowIdx) &&
      rowIdx >= 0 &&
      rowIdx < grid.length &&
      typeof colIdx === 'number' &&
      Number.isInteger(colIdx) &&
      colIdx >= 0 &&
      grid[rowIdx] &&
      colIdx < grid[rowIdx].length
    ) {
      activeCell = [rowIdx, colIdx];
    }

    result.dpTableState = {
      grid,
      activeCell,
    };
  }

  // 2. Identify 1D Arrays -> arrayState + pointers (F-LDR-S2-01)
  let arrayEntry = entries.find(
    ([k, v]) =>
      ARRAY_PRIORITY_NAMES.includes(k.toLowerCase()) &&
      Array.isArray(v) &&
      (v.length === 0 || !Array.isArray(v[0]))
  );

  if (!arrayEntry) {
    arrayEntry = entries.find(
      ([, v]) => Array.isArray(v) && (v.length === 0 || !Array.isArray(v[0]))
    );
  }

  if (arrayEntry) {
    const rawArr: any[] = arrayEntry[1];
    const elements = rawArr.map((item) =>
      typeof item === 'number' || typeof item === 'string'
        ? item
        : safeStringify(item)
    );

    // Extract valid numeric pointer locals
    const pointers: Pointer[] = [];
    for (const [name, val] of entries) {
      const lower = name.toLowerCase();
      if (
        POINTER_NAMES.has(lower) &&
        typeof val === 'number' &&
        Number.isInteger(val) &&
        val >= 0 &&
        val <= elements.length // allow pointing to end boundary
      ) {
        pointers.push({
          name,
          index: val,
          color: POINTER_COLORS[lower] || '#6366f1',
          label: `${name}=${val}`,
        });
      }
    }

    const highlightIndices = pointers
      .map((p) => p.index)
      .filter(
        (idx): idx is number =>
          typeof idx === 'number' && idx >= 0 && idx < elements.length
      );

    result.arrayState = {
      elements,
      highlightIndices: highlightIndices.length > 0 ? highlightIndices : undefined,
    };

    if (pointers.length > 0) {
      result.pointers = pointers;
    }
  }

  // 3. Identify Objects / Map / Class Instances -> hashMapState (F-LDR-S2-03)
  let mapEntry = entries.find(
    ([k, v]) =>
      MAP_PRIORITY_NAMES.includes(k.toLowerCase()) &&
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v)
  );

  if (!mapEntry) {
    mapEntry = entries.find(
      ([, v]) =>
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        (v instanceof Map || Object.keys(v).length > 0)
    );
  }

  if (mapEntry) {
    const rawObj = mapEntry[1];
    const hashEntries: HashMapEntry[] = [];

    if (rawObj instanceof Map) {
      for (const [k, v] of rawObj.entries()) {
        hashEntries.push({
          key: String(k),
          value:
            typeof v === 'number' || typeof v === 'string'
              ? v
              : safeStringify(v),
        });
      }
    } else if (typeof rawObj === 'object') {
      for (const [k, v] of Object.entries(rawObj)) {
        hashEntries.push({
          key: String(k),
          value:
            typeof v === 'number' || typeof v === 'string'
              ? v
              : safeStringify(v),
        });
      }
    }

    if (hashEntries.length > 0) {
      result.hashMapState = {
        entries: hashEntries,
      };
    }
  }

  return result;
}

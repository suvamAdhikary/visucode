import type {
  ArrayVisualizerState,
  DpTableVisualizerState,
  HashMapVisualizerState,
  HashMapEntry,
  Pointer,
} from '@visucode/shared-types';
import { safeStringify } from './tracer-utils';

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
  read: '#06b6d4',
  right: '#a855f7',
  hi: '#a855f7',
  high: '#a855f7',
  end: '#a855f7',
  p2: '#a855f7',
  fast: '#a855f7',
  write: '#a855f7',
  mid: '#f59e0b',
  middle: '#f59e0b',
  i: '#3b82f6',
  j: '#10b981',
  k: '#ec4899',
  idx: '#3b82f6',
  index: '#3b82f6',
  pos: '#8b5cf6',
  p: '#38bdf8',
  ptr: '#38bdf8',
  curr: '#f43f5e',
};

const DYNAMIC_POINTER_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#14b8a6', // teal
];

/**
 * Deterministic color assignment for standard and custom user-defined pointer variables.
 */
export function getPointerColor(name: string): string {
  const lower = name.toLowerCase();
  if (POINTER_COLORS[lower]) return POINTER_COLORS[lower];
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
  }
  return DYNAMIC_POINTER_PALETTE[Math.abs(hash) % DYNAMIC_POINTER_PALETTE.length];
}

function getLocalVar(locals: Record<string, any>, name: string): any {
  if (locals[name] !== undefined) return locals[name];
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(locals)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

const ARRAY_PRIORITY_NAMES = ['nums', 'arr', 'array', 'list', 'elements', 'data'];
const DP_PRIORITY_NAMES = ['dp', 'grid', 'matrix', 'table', 'memo', 'board'];
const MAP_PRIORITY_NAMES = ['map', 'seen', 'counts', 'count', 'freq', 'dict', 'lookup', 'hash'];

/**
 * Infers on-the-go visuals from runtime local variables (Sprint 2 - ADR-002, F-LDR-S2-01..04).
 * Pure mapper function with zero side effects. Accepts optional AST-detected index variables.
 */
export function inferStepVisualizerState(
  locals: Record<string, any>,
  detectedIndices?: Set<string> | string[],
  coordinatePairs?: [string, string][]
): VisualizerStateResult {
  const result: VisualizerStateResult = {};

  const detectedSet =
    detectedIndices instanceof Set
      ? detectedIndices
      : Array.isArray(detectedIndices)
      ? new Set(detectedIndices.map((s) => s.toLowerCase()))
      : undefined;

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

    // Check for row/col pointers: prioritize explicit AST 2D coordinate pairs, then standard conventions (r/c, i/j, row/col, rowIdx/colIdx)
    let activeCell: [number, number] | undefined;
    let rowIdx: number | undefined;
    let colIdx: number | undefined;

    // 1. Prioritize explicit AST 2D coordinate pairs found in user subscript expressions (e.g. matrix[rowIdx][colIdx], grid[r][c])
    if (coordinatePairs && coordinatePairs.length > 0) {
      for (const [rName, cName] of coordinatePairs) {
        const rVal = getLocalVar(locals, rName);
        const cVal = getLocalVar(locals, cName);
        if (
          typeof rVal === 'number' &&
          Number.isInteger(rVal) &&
          typeof cVal === 'number' &&
          Number.isInteger(cVal)
        ) {
          rowIdx = rVal;
          colIdx = cVal;
          break;
        }
      }
    }

    // 2. Fallback to standard convention pairs if no AST coordinate pair matched in locals
    if (rowIdx === undefined || colIdx === undefined) {
      const standardPairs: [string, string][] = [
        ['i', 'j'],
        ['r', 'c'],
        ['row', 'col'],
        ['rowIdx', 'colIdx'],
        ['rowIndex', 'colIndex'],
        ['R', 'C'],
        ['I', 'J'],
      ];
      for (const [rName, cName] of standardPairs) {
        const rVal = getLocalVar(locals, rName);
        const cVal = getLocalVar(locals, cName);
        if (
          typeof rVal === 'number' &&
          Number.isInteger(rVal) &&
          typeof cVal === 'number' &&
          Number.isInteger(cVal)
        ) {
          rowIdx = rVal;
          colIdx = cVal;
          break;
        }
      }
    }

    // 3. Fallback: individual row and column variables
    if (rowIdx === undefined || colIdx === undefined) {
      if (rowIdx === undefined) {
        rowIdx =
          locals['i'] ??
          locals['r'] ??
          locals['row'] ??
          locals['rowIdx'] ??
          locals['rowIndex'] ??
          locals['R'] ??
          locals['I'];
      }
      if (colIdx === undefined) {
        colIdx =
          locals['j'] ??
          locals['c'] ??
          locals['col'] ??
          locals['colIdx'] ??
          locals['colIndex'] ??
          locals['C'] ??
          locals['J'];
      }
    }

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

    // Extract valid numeric pointer locals (conventional or AST-detected)
    const pointers: Pointer[] = [];
    for (const [name, val] of entries) {
      const lower = name.toLowerCase();
      const isPointer =
        POINTER_NAMES.has(lower) ||
        (detectedSet !== undefined && detectedSet.has(lower));

      if (
        isPointer &&
        typeof val === 'number' &&
        Number.isInteger(val) &&
        val >= 0 &&
        val < elements.length
      ) {
        pointers.push({
          name,
          index: val,
          color: getPointerColor(name),
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

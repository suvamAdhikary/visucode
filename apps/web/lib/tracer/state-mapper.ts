import type {
  ArrayVisualizerState,
  DpTableVisualizerState,
  HashMapVisualizerState,
  HashMapEntry,
  LinkedListVisualizerState,
  LinkedListNode,
  TreeVisualizerState,
  TreeNode,
  Pointer,
} from '@visucode/shared-types';
import { safeStringify } from './tracer-utils';

export interface VisualizerStateResult {
  arrayState?: ArrayVisualizerState;
  pointers?: Pointer[];
  dpTableState?: DpTableVisualizerState;
  hashMapState?: HashMapVisualizerState;
  linkedListState?: LinkedListVisualizerState;
  treeState?: TreeVisualizerState;
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
const LIST_PRIORITY_NAMES = ['head', 'dummy', 'dummyhead', 'list', 'l1', 'l2', 'first', 'curr', 'cur', 'prev', 'tail'];
const TREE_PRIORITY_NAMES = ['root', 'tree', 't', 'node'];

/**
 * Negative guard (F-LDR-S3-01): validates whether an object is a Linked List node.
 * - Must be an object, not array, not Map/Set/Date/RegExp.
 * - Must have 'next' property.
 * - obj.next MUST be null, undefined, or an object (rejects primitives like strings, numbers, booleans).
 * - Must have a value-like property ('val', 'value', 'data', 'item', 'key') or a recognizable class constructor.
 */
export function isLinkedListNodeCandidate(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (obj instanceof Map || obj instanceof Set || obj instanceof Date || obj instanceof RegExp) return false;
  if (!('next' in obj)) return false;

  const record = obj as Record<string, unknown>;
  const nextVal = record.next;
  if (nextVal !== null && nextVal !== undefined && typeof nextVal !== 'object') {
    return false;
  }

  // Reject obvious pagination or config objects: e.g. { page, limit, next: "/items" }
  if ('page' in record || 'limit' in record || 'totalPages' in record || 'autoPlay' in record) {
    return false;
  }

  const hasValueProp =
    'val' in record ||
    'value' in record ||
    'data' in record ||
    'item' in record ||
    'key' in record;

  const ctorName = obj.constructor?.name || '';
  const isListNodeCtor = /^(ListNode|LinkedListNode|Node)$/i.test(ctorName);

  return hasValueProp || isListNodeCtor;
}

/**
 * Negative guard (F-LDR-S3-02): validates whether an object is a Binary Tree node.
 * - Must be an object, not array, not Map/Set/Date/RegExp.
 * - Must have 'left' or 'right' property (or both).
 * - Neither obj.left nor obj.right can be a primitive (rejects bounding boxes { left: 10, right: 20 }, CSS { left: '10px' }).
 * - Must have a value-like property ('val', 'value', 'data', 'item', 'key') or a recognizable class constructor.
 */
export function isTreeNodeCandidate(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (obj instanceof Map || obj instanceof Set || obj instanceof Date || obj instanceof RegExp) return false;

  const hasLeft = 'left' in obj;
  const hasRight = 'right' in obj;
  if (!hasLeft && !hasRight) return false;

  const record = obj as Record<string, unknown>;
  const leftVal = record.left;
  const rightVal = record.right;

  // If left or right is a primitive (number, string, boolean, etc.), REJECT immediately!
  if (leftVal !== null && leftVal !== undefined && typeof leftVal !== 'object') {
    return false;
  }
  if (rightVal !== null && rightVal !== undefined && typeof rightVal !== 'object') {
    return false;
  }

  // Reject bounding box / rectangle objects: e.g. { top, bottom, left, right }
  if ('top' in record || 'bottom' in record || 'width' in record || 'height' in record) {
    return false;
  }

  const hasValueProp =
    'val' in record ||
    'value' in record ||
    'data' in record ||
    'item' in record ||
    'key' in record;

  const ctorName = obj.constructor?.name || '';
  const isTreeNodeCtor = /^(TreeNode|BinaryTreeNode|BSTNode|Node)$/i.test(ctorName);

  return hasValueProp || isTreeNodeCtor;
}

/**
 * Extracts linked list nodes and pointer references from local variables (F-LDR-S3-01).
 */
export function extractLinkedList(entries: [string, any][]): {
  linkedListState?: LinkedListVisualizerState;
  pointers: Pointer[];
  nodeObjects: Set<any>;
} {
  const candidateEntries = entries.filter(([, v]) => isLinkedListNodeCandidate(v));
  if (candidateEntries.length === 0) {
    return { pointers: [], nodeObjects: new Set() };
  }

  // 1. Identify head/start node
  let rootEntry = candidateEntries.find(([k]) =>
    LIST_PRIORITY_NAMES.includes(k.toLowerCase())
  );
  if (!rootEntry) {
    const nextRefs = new Set<any>();
    for (const [, node] of candidateEntries) {
      if (node.next && typeof node.next === 'object') {
        nextRefs.add(node.next);
      }
    }
    rootEntry = candidateEntries.find(([, node]) => !nextRefs.has(node)) || candidateEntries[0];
  }

  const startNode = rootEntry[1];
  const visitedNodes: any[] = [];
  const nodeToId = new Map<any, string>();
  const visitedSet = new Set<any>();
  let idCounter = 1;

  const traverseChain = (node: any) => {
    let curr: any = node;
    while (curr && typeof curr === 'object' && !visitedSet.has(curr) && visitedNodes.length < 16) {
      visitedSet.add(curr);
      const nodeId = `node-${idCounter++}`;
      nodeToId.set(curr, nodeId);
      visitedNodes.push(curr);
      curr = curr.next;
    }
  };

  traverseChain(startNode);

  // Traverse any other candidate nodes not reached from startNode (e.g. unreversed fragment in curr/nxt)
  for (const [, candidateNode] of candidateEntries) {
    if (!visitedSet.has(candidateNode) && visitedNodes.length < 16) {
      traverseChain(candidateNode);
    }
  }

  if (visitedNodes.length === 0) {
    return { pointers: [], nodeObjects: new Set() };
  }

  const nodes: LinkedListNode[] = [];
  for (let i = 0; i < visitedNodes.length; i++) {
    const nodeObj = visitedNodes[i];
    const id = nodeToId.get(nodeObj)!;
    const rawVal =
      nodeObj.val !== undefined
        ? nodeObj.val
        : nodeObj.value !== undefined
        ? nodeObj.value
        : nodeObj.data !== undefined
        ? nodeObj.data
        : i + 1;

    const value =
      typeof rawVal === 'number' || typeof rawVal === 'string'
        ? rawVal
        : safeStringify(rawVal);

    let nextId: string | undefined;
    if (nodeObj.next && typeof nodeObj.next === 'object') {
      nextId = nodeToId.get(nodeObj.next);
    }

    nodes.push({ id, value, nextId });
  }

  const pointers: Pointer[] = [];
  const highlightIds: string[] = [];

  for (const [name, val] of entries) {
    if (val && typeof val === 'object' && nodeToId.has(val)) {
      const targetId = nodeToId.get(val)!;
      pointers.push({
        name,
        targetId,
        color: getPointerColor(name),
        label: name,
      });
      if (!highlightIds.includes(targetId)) {
        highlightIds.push(targetId);
      }
    }
  }

  return {
    linkedListState: {
      nodes,
      headId: nodeToId.get(startNode),
      highlightIds: highlightIds.length > 0 ? highlightIds : undefined,
    },
    pointers,
    nodeObjects: visitedSet,
  };
}

/**
 * Extracts binary tree nodes and pointer references from local variables (F-LDR-S3-02).
 */
export function extractTree(entries: [string, any][]): {
  treeState?: TreeVisualizerState;
  pointers: Pointer[];
  nodeObjects: Set<any>;
} {
  const candidateEntries = entries.filter(([, v]) => isTreeNodeCandidate(v));
  if (candidateEntries.length === 0) {
    return { pointers: [], nodeObjects: new Set() };
  }

  // 1. Identify root node
  let rootEntry = candidateEntries.find(([k]) =>
    TREE_PRIORITY_NAMES.includes(k.toLowerCase())
  );
  if (!rootEntry) {
    const childRefs = new Set<any>();
    for (const [, node] of candidateEntries) {
      if (node.left && typeof node.left === 'object') childRefs.add(node.left);
      if (node.right && typeof node.right === 'object') childRefs.add(node.right);
    }
    rootEntry = candidateEntries.find(([, node]) => !childRefs.has(node)) || candidateEntries[0];
  }

  const rootNode = rootEntry[1];
  const nodes: TreeNode[] = [];
  const nodeToId = new Map<any, string>();
  const visitedSet = new Set<any>();
  let idCounter = 1;

  const traverseSubtree = (startNode: any) => {
    const queue: any[] = [startNode];
    visitedSet.add(startNode);
    if (!nodeToId.has(startNode)) {
      nodeToId.set(startNode, `tree-node-${idCounter++}`);
    }

    while (queue.length > 0 && nodes.length < 31) {
      const curr = queue.shift()!;
      const id = nodeToId.get(curr)!;
      const rawVal =
        curr.val !== undefined
          ? curr.val
          : curr.value !== undefined
          ? curr.value
          : curr.data !== undefined
          ? curr.data
          : '';

      const value =
        typeof rawVal === 'number' || typeof rawVal === 'string'
          ? rawVal
          : safeStringify(rawVal);

      let leftId: string | undefined;
      if (curr.left && typeof curr.left === 'object' && !visitedSet.has(curr.left)) {
        leftId = `tree-node-${idCounter++}`;
        nodeToId.set(curr.left, leftId);
        visitedSet.add(curr.left);
        queue.push(curr.left);
      } else if (curr.left && typeof curr.left === 'object' && visitedSet.has(curr.left)) {
        leftId = nodeToId.get(curr.left);
      }

      let rightId: string | undefined;
      if (curr.right && typeof curr.right === 'object' && !visitedSet.has(curr.right)) {
        rightId = `tree-node-${idCounter++}`;
        nodeToId.set(curr.right, rightId);
        visitedSet.add(curr.right);
        queue.push(curr.right);
      } else if (curr.right && typeof curr.right === 'object' && visitedSet.has(curr.right)) {
        rightId = nodeToId.get(curr.right);
      }

      nodes.push({ id, value, leftId, rightId });
    }
  };

  traverseSubtree(rootNode);

  // Traverse any other candidate tree nodes not reached from root (e.g. temporary/detached nodes)
  for (const [, candidateNode] of candidateEntries) {
    if (!visitedSet.has(candidateNode) && nodes.length < 31) {
      traverseSubtree(candidateNode);
    }
  }

  const pointers: Pointer[] = [];
  const highlightIds: string[] = [];

  for (const [name, val] of entries) {
    if (val && typeof val === 'object' && nodeToId.has(val)) {
      const targetId = nodeToId.get(val)!;
      pointers.push({
        name,
        targetId,
        color: getPointerColor(name),
        label: name,
      });
      if (!highlightIds.includes(targetId)) {
        highlightIds.push(targetId);
      }
    }
  }

  return {
    treeState: {
      nodes,
      rootId: nodeToId.get(rootNode),
      highlightIds: highlightIds.length > 0 ? highlightIds : undefined,
    },
    pointers,
    nodeObjects: visitedSet,
  };
}

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

  // 3. Identify Linked List -> linkedListState (Sprint 3 - F-LDR-S3-01)
  const listRes = extractLinkedList(entries);
  if (listRes.linkedListState) {
    result.linkedListState = listRes.linkedListState;
    if (listRes.pointers.length > 0) {
      result.pointers = [...(result.pointers || []), ...listRes.pointers];
    }
  }

  // 4. Identify Binary Tree -> treeState (Sprint 3 - F-LDR-S3-02)
  const treeRes = extractTree(entries);
  if (treeRes.treeState) {
    result.treeState = treeRes.treeState;
    if (treeRes.pointers.length > 0) {
      result.pointers = [...(result.pointers || []), ...treeRes.pointers];
    }
  }

  const consumedNodeObjects = new Set<any>([
    ...listRes.nodeObjects,
    ...treeRes.nodeObjects,
  ]);

  // 5. Identify Objects / Map / Class Instances -> hashMapState (F-LDR-S2-03)
  let mapEntry = entries.find(
    ([k, v]) =>
      MAP_PRIORITY_NAMES.includes(k.toLowerCase()) &&
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !consumedNodeObjects.has(v)
  );

  if (!mapEntry) {
    mapEntry = entries.find(
      ([, v]) =>
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        !consumedNodeObjects.has(v) &&
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

import { inferStepVisualizerState } from '../state-mapper';
import { traceUserCode } from '../tracer';

describe('Live Dry Run State Mapper (Sprint 2 — F-LDR-S2-01..04)', () => {
  describe('1D Array and Pointers (F-LDR-S2-01)', () => {
    it('infers 1D arrayState and valid index pointers from locals', () => {
      const locals = {
        nums: [1, 3, 5, 7, 9],
        left: 0,
        right: 4,
        target: 12,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.arrayState).toBeDefined();
      expect(viz.arrayState?.elements).toEqual([1, 3, 5, 7, 9]);
      expect(viz.pointers).toBeDefined();
      expect(viz.pointers?.length).toBe(2);

      const leftPtr = viz.pointers?.find((p) => p.name === 'left');
      expect(leftPtr).toBeDefined();
      expect(leftPtr?.index).toBe(0);
      expect(leftPtr?.color).toBe('#06b6d4');

      const rightPtr = viz.pointers?.find((p) => p.name === 'right');
      expect(rightPtr).toBeDefined();
      expect(rightPtr?.index).toBe(4);
      expect(rightPtr?.color).toBe('#a855f7');

      expect(viz.arrayState?.highlightIndices).toEqual([0, 4]);
    });

    it('ignores out-of-bounds numeric locals as pointers even with valid pointer names', () => {
      const locals = {
        arr: [10, 20, 30],
        i: 1,
        right: 100, // pointer name, but out of bounds (100 >= arr.length)
        left: -5,   // pointer name, but negative
        k: 2,       // k is not treated as an index pointer (window size)
      };

      const viz = inferStepVisualizerState(locals);
      expect(viz.arrayState?.elements).toEqual([10, 20, 30]);
      expect(viz.pointers?.length).toBe(1);
      expect(viz.pointers?.[0].name).toBe('i');
      expect(viz.pointers?.[0].index).toBe(1);
      expect(viz.pointers?.some((p) => p.name === 'right' || p.name === 'left' || p.name === 'k')).toBe(false);
    });
  });

  describe('2D Grid and Active Cell (F-LDR-S2-02)', () => {
    it('infers dpTableState from nested 2D array and tracks activeCell', () => {
      const locals = {
        dp: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        i: 1,
        j: 1,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.dpTableState).toBeDefined();
      expect(viz.dpTableState?.grid).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
      expect(viz.dpTableState?.activeCell).toEqual([1, 1]);
    });

    it('handles null/undefined cells in dp grid safely', () => {
      const locals = {
        grid: [
          [1, undefined],
          [null, 2],
        ],
      };

      const viz = inferStepVisualizerState(locals);
      expect(viz.dpTableState?.grid).toEqual([
        [1, null],
        [null, 2],
      ]);
      expect(viz.dpTableState?.activeCell).toBeUndefined();
    });
  });

  describe('Objects, Maps, and Class Fields (F-LDR-S2-03)', () => {
    it('infers hashMapState from JS Map instance', () => {
      const map = new Map<string, number>();
      map.set('apple', 3);
      map.set('banana', 5);

      const locals = {
        seen: map,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.hashMapState).toBeDefined();
      expect(viz.hashMapState?.entries).toEqual([
        { key: 'apple', value: 3 },
        { key: 'banana', value: 5 },
      ]);
    });

    it('infers hashMapState from plain object', () => {
      const locals = {
        counts: {
          x: 10,
          y: 20,
        },
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.hashMapState).toBeDefined();
      expect(viz.hashMapState?.entries).toEqual([
        { key: 'x', value: 10 },
        { key: 'y', value: 20 },
      ]);
    });

    it('infers hashMapState from class instance fields', () => {
      class Counter {
        public total: number;
        public label: string;
        constructor(total: number, label: string) {
          this.total = total;
          this.label = label;
        }
      }

      const instance = new Counter(42, 'hits');
      const locals = {
        counter: instance,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.hashMapState).toBeDefined();
      expect(viz.hashMapState?.entries).toEqual([
        { key: 'total', value: 42 },
        { key: 'label', value: 'hits' },
      ]);
    });
  });

  describe('End-to-end Tracer Visualizer Integration', () => {
    it('populates arrayState and pointers automatically in live dry run trace', async () => {
      const code = `function twoSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`;

      const res = await traceUserCode({
        code,
        input: '[[2, 7, 11, 15], 9]',
      });

      expect(res.completed).toBe(true);
      expect(res.steps.length).toBeGreaterThan(0);

      // Verify that intermediate steps contain arrayState and pointers
      const stepWithPointers = res.steps.find(
        (s) => s.arrayState && s.pointers && s.pointers.length >= 2
      );
      expect(stepWithPointers).toBeDefined();
      expect(stepWithPointers?.arrayState?.elements).toEqual([2, 7, 11, 15]);

      const left = stepWithPointers?.pointers?.find((p) => p.name === 'left');
      const right = stepWithPointers?.pointers?.find((p) => p.name === 'right');
      expect(left?.index).toBe(0);
      expect(right?.index).toBe(3);

      // Factual explanation (F-LDR-S2-04)
      expect(stepWithPointers?.explanation).toContain('left = 0');
      expect(stepWithPointers?.explanation).toContain('right = 3');
      expect(stepWithPointers?.explanation).not.toContain('Moving pointer from');
    });

    it('populates dpTableState and activeCell in live dry run trace for grid algorithms', async () => {
      const code = `function miniDP() {
  const dp = [
    [1, 2],
    [3, 4]
  ];
  let i = 0;
  let j = 1;
  return dp[i][j];
}`;

      const res = await traceUserCode({
        code,
        input: '[]',
      });

      expect(res.completed).toBe(true);
      const stepWithDP = res.steps.find((s) => s.dpTableState);
      expect(stepWithDP).toBeDefined();
      expect(stepWithDP?.dpTableState?.grid).toEqual([
        [1, 2],
        [3, 4],
      ]);

      const stepWithActiveCell = res.steps.find((s) => s.dpTableState?.activeCell);
      expect(stepWithActiveCell).toBeDefined();
      expect(stepWithActiveCell?.dpTableState?.activeCell).toEqual([0, 1]);
    });

    it('populates hashMapState in live dry run trace for frequency map algorithms', async () => {
      const code = `function charCount(str) {
  const counts = {};
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}`;

      const res = await traceUserCode({
        code,
        input: '["aba"]',
      });

      expect(res.completed).toBe(true);
      const stepWithMap = res.steps.find(
        (s) => s.hashMapState && s.hashMapState.entries.length > 0
      );
      expect(stepWithMap?.hashMapState?.entries).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: 'a' })])
      );
    });

    it('populates hashMapState for class instances in live dry run trace', async () => {
      const code = `class Item {
  constructor(name, val) {
    this.name = name;
    this.val = val;
  }
}
function testClass() {
  const item = new Item('alpha', 100);
  return item.val;
}`;

      const res = await traceUserCode({
        code,
        input: '[]',
      });

      expect(res.completed).toBe(true);
      const stepWithClassInstance = res.steps.find(
        (s) => s.hashMapState && s.hashMapState.entries.length >= 2
      );
      expect(stepWithClassInstance).toBeDefined();
      expect(stepWithClassInstance?.hashMapState?.entries).toEqual([
        { key: 'name', value: 'alpha' },
        { key: 'val', value: 100 },
      ]);
    });

    it('draws a pointer for loop index k when indexing array in AST, but ignores scalar window size k', async () => {
      // 1. Loop index k: arr[k] -> draws pointer k
      const loopKCode = `function testLoopK(nums) {
  let ans = 0;
  for (let k = 0; k < nums.length; k++) {
    ans += nums[k];
  }
  return ans;
}`;
      const loopRes = await traceUserCode({
        code: loopKCode,
        input: '[[10, 20, 30]]',
      });
      expect(loopRes.completed).toBe(true);
      const stepWithKPointer = loopRes.steps.find(
        (s) => s.pointers && s.pointers.some((p) => p.name === 'k')
      );
      expect(stepWithKPointer).toBeDefined();
      expect(stepWithKPointer?.pointers?.find((p) => p.name === 'k')?.color).toBe('#ec4899');

      // 2. Scalar window size k: sum += k, no nums[k] -> does NOT draw pointer for k
      const scalarKCode = `function testWindowK(nums, k) {
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i >= k) sum += nums[i];
  }
  return sum;
}`;
      const scalarRes = await traceUserCode({
        code: scalarKCode,
        input: '[[10, 20, 30, 40], 2]',
      });
      expect(scalarRes.completed).toBe(true);
      const stepWithPointers = scalarRes.steps.find((s) => s.pointers && s.pointers.length > 0);
      expect(stepWithPointers).toBeDefined();
      expect(stepWithPointers?.pointers?.some((p) => p.name === 'k')).toBe(false);
      expect(stepWithPointers?.pointers?.some((p) => p.name === 'i')).toBe(true);
    });

    it('supports arbitrary user-defined pointer names (e.g. myPointer, cursor)', async () => {
      const code = `function customPointerDemo(items) {
  let myPointer = 1;
  const val = items[myPointer];
  return val;
}`;

      const res = await traceUserCode({
        code,
        input: '[[100, 200, 300]]',
      });

      expect(res.completed).toBe(true);
      const stepWithCustomPointer = res.steps.find(
        (s) => s.pointers && s.pointers.some((p) => p.name === 'myPointer')
      );
      expect(stepWithCustomPointer).toBeDefined();
      const ptr = stepWithCustomPointer?.pointers?.find((p) => p.name === 'myPointer');
      expect(ptr?.index).toBe(1);
      expect(ptr?.label).toBe('myPointer=1');
      expect(ptr?.color).toBeDefined();
    });

    it('supports custom 2D grid coordinates r and c for activeCell', async () => {
      const code = `function gridCoords(matrix) {
  let r = 0;
  let c = 1;
  return matrix[r][c];
}`;

      const res = await traceUserCode({
        code,
        input: '[[[1, 2], [3, 4]]]',
      });

      expect(res.completed).toBe(true);
      const stepWithActiveCell = res.steps.find(
        (s) => s.dpTableState && s.dpTableState.activeCell !== undefined
      );
      expect(stepWithActiveCell).toBeDefined();
      expect(stepWithActiveCell?.dpTableState?.activeCell).toEqual([0, 1]);
    });

    it('supports camelCase 2D grid coordinates rowIdx and colIdx for activeCell', async () => {
      const code = `function gridCamelCase(matrix) {
  let rowIdx = 1;
  let colIdx = 0;
  return matrix[rowIdx][colIdx];
}`;

      const res = await traceUserCode({
        code,
        input: '[[[1, 2], [3, 4]]]',
      });

      expect(res.completed).toBe(true);
      const stepWithActiveCell = res.steps.find(
        (s) => s.dpTableState && s.dpTableState.activeCell !== undefined
      );
      expect(stepWithActiveCell).toBeDefined();
      expect(stepWithActiveCell?.dpTableState?.activeCell).toEqual([1, 0]);
    });

    it('prioritizes AST 2D coordinate pairs over unrelated outer loop index i', async () => {
      const code = `function gridNested(matrix) {
  let i = 0; // outer loop variable
  let r = 1;
  let c = 0;
  return matrix[r][c];
}`;

      const res = await traceUserCode({
        code,
        input: '[[[1, 2], [3, 4]]]',
      });

      expect(res.completed).toBe(true);
      const stepWithActiveCell = res.steps.find(
        (s) => s.dpTableState && s.dpTableState.activeCell !== undefined
      );
      expect(stepWithActiveCell).toBeDefined();
      expect(stepWithActiveCell?.dpTableState?.activeCell).toEqual([1, 0]);
    });

    it('supports binary offsets in 2D coordinate subscripts (matrix[r - 1][c])', async () => {
      const code = `function gridOffset(matrix) {
  let r = 1;
  let c = 1;
  return matrix[r - 1][c];
}`;

      const res = await traceUserCode({
        code,
        input: '[[[1, 2], [3, 4]]]',
      });

      expect(res.completed).toBe(true);
      const stepWithActiveCell = res.steps.find(
        (s) => s.dpTableState && s.dpTableState.activeCell !== undefined
      );
      expect(stepWithActiveCell).toBeDefined();
      expect(stepWithActiveCell?.dpTableState?.activeCell).toEqual([1, 1]);
    });

    it('supports ternary index expressions (arr[cond ? a : b]) and excludes binary offsets (arr[i + offset])', async () => {
      const code = `function indexingEdgeCases(arr) {
  let cond = true;
  let a = 1;
  let b = 2;
  let offset = 1;
  let i = 0;
  const v1 = arr[cond ? a : b];
  const v2 = arr[i + offset];
  return v1 + v2;
}`;

      const res = await traceUserCode({
        code,
        input: '[[10, 20, 30, 40]]',
      });

      expect(res.completed).toBe(true);
      // a and b should be detected as pointers
      const stepWithPointers = res.steps.find(
        (s) => s.pointers && s.pointers.some((p) => p.name === 'a' || p.name === 'b')
      );
      expect(stepWithPointers).toBeDefined();
      expect(stepWithPointers?.pointers?.some((p) => p.name === 'a')).toBe(true);

      // offset should NOT be detected as a pointer; i should be detected as a pointer
      const allPointersAcrossSteps = res.steps.flatMap((s) => s.pointers || []);
      expect(allPointersAcrossSteps.some((p) => p.name === 'offset')).toBe(false);
      expect(allPointersAcrossSteps.some((p) => p.name === 'i')).toBe(true);
    });

    it('treats i as base pointer in arr[offset + i] and extracts i and j from arr[i * n + j]', async () => {
      const code = `function offsetAndStride(arr) {
  let offset = 2;
  let i = 1;
  let j = 0;
  let n = 2;
  const val1 = arr[offset + i];
  const val2 = arr[i * n + j];
  return val1 + val2;
}`;

      const res = await traceUserCode({
        code,
        input: '[[10, 20, 30, 40, 50]]',
      });

      expect(res.completed).toBe(true);
      const allPointers = res.steps.flatMap((s) => s.pointers || []);
      expect(allPointers.some((p) => p.name === 'i')).toBe(true);
      expect(allPointers.some((p) => p.name === 'j')).toBe(true);
      expect(allPointers.some((p) => p.name === 'offset')).toBe(false);
      expect(allPointers.some((p) => p.name === 'n')).toBe(false);
    });
  });

  describe('Linked List Structure Heuristic (Sprint 3 — F-LDR-S3-01)', () => {
    it('infers linkedListState and pointers from { val, next } chains', () => {
      const node3 = { val: 30, next: null };
      const node2 = { val: 20, next: node3 };
      const node1 = { val: 10, next: node2 };

      const locals = {
        head: node1,
        curr: node2,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.linkedListState).toBeDefined();
      expect(viz.linkedListState?.nodes.length).toBe(3);
      expect(viz.linkedListState?.headId).toBe('node-1');
      expect(viz.linkedListState?.nodes[0].value).toBe(10);
      expect(viz.linkedListState?.nodes[0].nextId).toBe('node-2');
      expect(viz.linkedListState?.nodes[1].value).toBe(20);
      expect(viz.linkedListState?.nodes[1].nextId).toBe('node-3');
      expect(viz.linkedListState?.nodes[2].value).toBe(30);
      expect(viz.linkedListState?.nodes[2].nextId).toBeUndefined();

      // Pointers target node IDs
      expect(viz.pointers).toBeDefined();
      const headPtr = viz.pointers?.find((p) => p.name === 'head');
      const currPtr = viz.pointers?.find((p) => p.name === 'curr');
      expect(headPtr?.targetId).toBe('node-1');
      expect(currPtr?.targetId).toBe('node-2');

      // Highlight IDs correspond to target nodes
      expect(viz.linkedListState?.highlightIds).toEqual(['node-1', 'node-2']);

      // Consumed linked list nodes are NOT also treated as generic hash maps
      expect(viz.hashMapState).toBeUndefined();
    });

    it('supports class-instance linked list nodes', () => {
      class ListNode {
        val: number;
        next: ListNode | null;
        constructor(val: number, next: ListNode | null = null) {
          this.val = val;
          this.next = next;
        }
      }

      const tail = new ListNode(2);
      const head = new ListNode(1, tail);

      const locals = { head, tail };
      const viz = inferStepVisualizerState(locals);

      expect(viz.linkedListState).toBeDefined();
      expect(viz.linkedListState?.nodes.length).toBe(2);
      expect(viz.linkedListState?.nodes[0].value).toBe(1);
      expect(viz.linkedListState?.nodes[1].value).toBe(2);
      expect(viz.pointers?.find((p) => p.name === 'head')?.targetId).toBe('node-1');
      expect(viz.pointers?.find((p) => p.name === 'tail')?.targetId).toBe('node-2');
    });

    it('safely handles circular linked list references without infinite looping', () => {
      const nodeA: any = { val: 'A' };
      const nodeB: any = { val: 'B', next: nodeA };
      nodeA.next = nodeB;

      const locals = { head: nodeA };
      const viz = inferStepVisualizerState(locals);

      expect(viz.linkedListState).toBeDefined();
      expect(viz.linkedListState?.nodes.length).toBe(2);
      expect(viz.linkedListState?.nodes[0].nextId).toBe('node-2');
      expect(viz.linkedListState?.nodes[1].nextId).toBe('node-1');
    });

    it('extracts multiple linked list fragments and maps pointers across disjoint chains (e.g. reverseList)', () => {
      // Simulates reverseList midway: node 1 reversed (points to null), nodes 2->3 unreversed
      const node1 = { val: 1, next: null };
      const node3 = { val: 3, next: null };
      const node2 = { val: 2, next: node3 };

      const locals = {
        prev: node1,
        curr: node2,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.linkedListState).toBeDefined();
      // All 3 nodes across both fragments are captured
      expect(viz.linkedListState?.nodes.length).toBe(3);
      expect(viz.linkedListState?.nodes.map((n) => n.value)).toEqual([1, 2, 3]);

      // Both pointers correctly resolve to their respective fragment nodes
      const prevPtr = viz.pointers?.find((p) => p.name === 'prev');
      const currPtr = viz.pointers?.find((p) => p.name === 'curr');
      expect(prevPtr?.targetId).toBe('node-1');
      expect(currPtr?.targetId).toBe('node-2');

      // None of the fragment nodes leak into hashMapState
      expect(viz.hashMapState).toBeUndefined();
    });

    // Negative guards for F-LDR-S3-01
    it('negative guard (F-LDR-S3-01): rejects unrelated objects with string or number next', () => {
      const locals1 = {
        config: { next: 'tuesday', current: 'monday' },
      };
      const viz1 = inferStepVisualizerState(locals1);
      expect(viz1.linkedListState).toBeUndefined();

      const locals2 = {
        counter: { next: 42, count: 5 },
      };
      const viz2 = inferStepVisualizerState(locals2);
      expect(viz2.linkedListState).toBeUndefined();

      const locals3 = {
        flags: { next: false, autoPlay: true },
      };
      const viz3 = inferStepVisualizerState(locals3);
      expect(viz3.linkedListState).toBeUndefined();

      const locals4 = {
        pagination: { page: 1, limit: 10, next: '/api/items?page=2' },
      };
      const viz4 = inferStepVisualizerState(locals4);
      expect(viz4.linkedListState).toBeUndefined();
    });
  });

  describe('Binary Tree Structure Heuristic (Sprint 3 — F-LDR-S3-02)', () => {
    it('infers treeState and pointers from { val, left, right } binary tree nodes', () => {
      const leftChild = { val: 2, left: null, right: null };
      const rightChild = { val: 3, left: null, right: null };
      const rootNode = { val: 1, left: leftChild, right: rightChild };

      const locals = {
        root: rootNode,
        curr: leftChild,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.treeState).toBeDefined();
      expect(viz.treeState?.nodes.length).toBe(3);
      expect(viz.treeState?.rootId).toBe('tree-node-1');

      const rootInTree = viz.treeState?.nodes.find((n) => n.id === 'tree-node-1');
      expect(rootInTree?.value).toBe(1);
      expect(rootInTree?.leftId).toBe('tree-node-2');
      expect(rootInTree?.rightId).toBe('tree-node-3');

      const leftInTree = viz.treeState?.nodes.find((n) => n.id === 'tree-node-2');
      expect(leftInTree?.value).toBe(2);
      expect(leftInTree?.leftId).toBeUndefined();
      expect(leftInTree?.rightId).toBeUndefined();

      // Pointers target tree nodes
      expect(viz.pointers).toBeDefined();
      const rootPtr = viz.pointers?.find((p) => p.name === 'root');
      const currPtr = viz.pointers?.find((p) => p.name === 'curr');
      expect(rootPtr?.targetId).toBe('tree-node-1');
      expect(currPtr?.targetId).toBe('tree-node-2');

      // Highlight IDs correspond to target nodes
      expect(viz.treeState?.highlightIds).toEqual(['tree-node-1', 'tree-node-2']);

      // Consumed tree nodes are NOT also treated as generic hash maps
      expect(viz.hashMapState).toBeUndefined();
    });

    it('supports class-instance binary tree nodes', () => {
      class TreeNode {
        val: string;
        left: TreeNode | null;
        right: TreeNode | null;
        constructor(val: string, left: TreeNode | null = null, right: TreeNode | null = null) {
          this.val = val;
          this.left = left;
          this.right = right;
        }
      }

      const left = new TreeNode('B');
      const right = new TreeNode('C');
      const root = new TreeNode('A', left, right);

      const locals = { root, curr: right };
      const viz = inferStepVisualizerState(locals);

      expect(viz.treeState).toBeDefined();
      expect(viz.treeState?.nodes.length).toBe(3);
      expect(viz.treeState?.nodes[0].value).toBe('A');
      expect(viz.pointers?.find((p) => p.name === 'root')?.targetId).toBe('tree-node-1');
      expect(viz.pointers?.find((p) => p.name === 'curr')?.targetId).toBe('tree-node-3');
    });

    it('extracts detached tree nodes and maps pointers (e.g. temporary nodes during tree construction)', () => {
      const root = { val: 10, left: null, right: null };
      const tempNode = { val: 20, left: null, right: null };

      const locals = { root, temp: tempNode };
      const viz = inferStepVisualizerState(locals);

      expect(viz.treeState).toBeDefined();
      expect(viz.treeState?.nodes.length).toBe(2);
      expect(viz.pointers?.find((p) => p.name === 'root')?.targetId).toBe('tree-node-1');
      expect(viz.pointers?.find((p) => p.name === 'temp')?.targetId).toBe('tree-node-2');
      expect(viz.hashMapState).toBeUndefined();
    });

    // Negative guards for F-LDR-S3-02
    it('negative guard (F-LDR-S3-02): rejects bounding boxes and ranges with primitive left/right', () => {
      const locals1 = {
        box: { left: 10, right: 20, top: 0, bottom: 50 },
      };
      const viz1 = inferStepVisualizerState(locals1);
      expect(viz1.treeState).toBeUndefined();

      const locals2 = {
        interval: { left: 5, right: 15 },
      };
      const viz2 = inferStepVisualizerState(locals2);
      expect(viz2.treeState).toBeUndefined();

      const locals3 = {
        styles: { left: '10px', right: '20px' },
      };
      const viz3 = inferStepVisualizerState(locals3);
      expect(viz3.treeState).toBeUndefined();

      const locals4 = {
        binarySearchState: { left: 0, right: 8, target: 5 },
      };
      const viz4 = inferStepVisualizerState(locals4);
      expect(viz4.treeState).toBeUndefined();

      const locals5 = {
        directions: { left: true, right: false },
      };
      const viz5 = inferStepVisualizerState(locals5);
      expect(viz5.treeState).toBeUndefined();
    });
  });

  describe('Full End-to-End Tracer with Data Structures (Sprint 3)', () => {
    it('traces linked list traversal and captures linkedListState across steps', async () => {
      const code = `function traverseList(head) {
  let curr = head;
  let sum = 0;
  while (curr !== null) {
    sum += curr.val;
    curr = curr.next;
  }
  return sum;
}`;

      // Pass input as linked list JSON
      const listInput = { val: 1, next: { val: 2, next: { val: 3, next: null } } };
      const res = await traceUserCode({
        code,
        input: JSON.stringify([listInput]),
      });

      expect(res.completed).toBe(true);
      expect(res.returnValue).toBe(6);

      // Verify that linkedListState is captured on steps
      const stepWithList = res.steps.find((s) => s.linkedListState !== undefined);
      expect(stepWithList).toBeDefined();
      expect(stepWithList?.linkedListState?.nodes.length).toBe(3);
      expect(stepWithList?.linkedListState?.nodes[0].value).toBe(1);
      expect(stepWithList?.linkedListState?.nodes[1].value).toBe(2);
      expect(stepWithList?.linkedListState?.nodes[2].value).toBe(3);

      // Verify pointers on steps targeting node IDs
      const stepWithCurr = res.steps.find((s) => s.pointers?.some((p) => p.name === 'curr'));
      expect(stepWithCurr).toBeDefined();
      expect(stepWithCurr?.pointers?.find((p) => p.name === 'curr')?.targetId).toMatch(/^node-\d+$/);
    });

    it('traces binary tree traversal and captures treeState across steps', async () => {
      const code = `function maxDepth(root) {
  if (root === null) return 0;
  let curr = root;
  return 1;
}`;

      const treeInput = {
        val: 1,
        left: { val: 2, left: null, right: null },
        right: { val: 3, left: null, right: null },
      };

      const res = await traceUserCode({
        code,
        input: JSON.stringify([treeInput]),
      });

      expect(res.completed).toBe(true);
      expect(res.returnValue).toBe(1);

      const stepWithTree = res.steps.find((s) => s.treeState !== undefined);
      expect(stepWithTree).toBeDefined();
      expect(stepWithTree?.treeState?.nodes.length).toBe(3);
      expect(stepWithTree?.treeState?.nodes[0].value).toBe(1);
    });
  });
});

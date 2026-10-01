import {
  arrayToList,
  arrayToTree,
  detectHydrationType,
  hydrateArgs,
  ListNode,
  TreeNode,
} from '../hydrator';
import type { Problem } from '@visucode/shared-types';

describe('Tracer Hydrator (F-LDR-S3-03)', () => {
  describe('arrayToList', () => {
    it('converts array into a singly linked list chain', () => {
      const head = arrayToList([1, 2, 3, 4, 5]);
      expect(head).toBeInstanceOf(ListNode);
      expect(head?.val).toBe(1);
      expect(head?.next?.val).toBe(2);
      expect(head?.next?.next?.val).toBe(3);
      expect(head?.next?.next?.next?.val).toBe(4);
      expect(head?.next?.next?.next?.next?.val).toBe(5);
      expect(head?.next?.next?.next?.next?.next).toBeNull();
    });

    it('returns null for empty or non-array inputs', () => {
      expect(arrayToList([])).toBeNull();
      expect(arrayToList(null as any)).toBeNull();
    });

    it('supports cycle creation with pos index', () => {
      const head = arrayToList([3, 2, 0, -4], 1);
      expect(head?.val).toBe(3);
      const node2 = head?.next;
      expect(node2?.val).toBe(2);
      const node3 = node2?.next;
      expect(node3?.val).toBe(0);
      const node4 = node3?.next;
      expect(node4?.val).toBe(-4);
      // Last node points back to node2 at pos 1
      expect(node4?.next).toBe(node2);
    });
  });

  describe('arrayToTree', () => {
    it('converts level-order array into a binary tree with null children', () => {
      const root = arrayToTree([3, 9, 20, null, null, 15, 7]);
      expect(root).toBeInstanceOf(TreeNode);
      expect(root?.val).toBe(3);
      expect(root?.left?.val).toBe(9);
      expect(root?.left?.left).toBeNull();
      expect(root?.left?.right).toBeNull();
      expect(root?.right?.val).toBe(20);
      expect(root?.right?.left?.val).toBe(15);
      expect(root?.right?.right?.val).toBe(7);
    });

    it('returns null for empty or null root array', () => {
      expect(arrayToTree([])).toBeNull();
      expect(arrayToTree([null])).toBeNull();
      expect(arrayToTree(null as any)).toBeNull();
    });
  });

  describe('detectHydrationType', () => {
    it('detects linked-list from category or wrapperCode', () => {
      const prob1 = { category: 'linked-list' } as unknown as Problem;
      expect(detectHydrationType(prob1)).toBe('linked-list');

      const prob2 = {
        category: 'array',
        wrapperCode: { javascript: 'function __arrayToList(arr) { ... }' },
      } as unknown as Problem;
      expect(detectHydrationType(prob2)).toBe('linked-list');
    });

    it('detects tree from category or wrapperCode', () => {
      const prob1 = { category: 'tree' } as unknown as Problem;
      expect(detectHydrationType(prob1)).toBe('tree');

      const prob2 = {
        category: 'array',
        wrapperCode: { javascript: 'function __arrayToTree(arr) { ... }' },
      } as unknown as Problem;
      expect(detectHydrationType(prob2)).toBe('tree');
    });

    it('returns none for other categories like array or hash-map', () => {
      const prob = { category: 'hash-map' } as unknown as Problem;
      expect(detectHydrationType(prob)).toBe('none');
    });
  });

  describe('hydrateArgs', () => {
    it('hydrates linked list array arguments', () => {
      const hydrated = hydrateArgs([[1, 2, 3]], 'linked-list');
      expect(hydrated.length).toBe(1);
      expect(hydrated[0]).toBeInstanceOf(ListNode);
      expect(hydrated[0].val).toBe(1);
    });

    it('hydrates multiple list arguments for mergeTwoLists', () => {
      const hydrated = hydrateArgs([[1, 2, 4], [1, 3, 4]], 'linked-list');
      expect(hydrated.length).toBe(2);
      expect(hydrated[0]).toBeInstanceOf(ListNode);
      expect(hydrated[1]).toBeInstanceOf(ListNode);
    });

    it('hydrates cycle list args [arr, pos] into a single head argument when code is hasCycle', () => {
      const cycleCode = 'function hasCycle(head) { let slow = head; }';
      const hydrated = hydrateArgs([[3, 2, 0, -4], 1], 'linked-list', cycleCode);
      expect(hydrated.length).toBe(1);
      expect(hydrated[0]).toBeInstanceOf(ListNode);
      expect(hydrated[0].next?.next?.next?.next).toBe(hydrated[0].next);
    });

    it('preserves multi-argument linked list functions like removeNthFromEnd(head, n) without cycle conversion', () => {
      const removeCode = 'function removeNthFromEnd(head, n) { let dummy = new ListNode(0); }';
      const hydrated = hydrateArgs([[1, 2, 3, 4, 5], 2], 'linked-list', removeCode);
      expect(hydrated.length).toBe(2);
      expect(hydrated[0]).toBeInstanceOf(ListNode);
      expect(hydrated[0].val).toBe(1);
      // Last node has next: null (NOT a cycle)
      expect(hydrated[0].next?.next?.next?.next?.next).toBeNull();
      // Second argument n=2 is preserved intact
      expect(hydrated[1]).toBe(2);
    });

    it('auto-detects linked-list from function ... (head) or .next in playground scripts', () => {
      const code1 = 'function customSolve(head) { return head ? head.val : 0; }';
      const hydrated1 = hydrateArgs([[10, 20]], 'auto', code1);
      expect(hydrated1.length).toBe(1);
      expect(hydrated1[0]).toBeInstanceOf(ListNode);
      expect(hydrated1[0].val).toBe(10);

      const code2 = 'const run = (head, k) => { let curr = head; while (curr) curr = curr.next; };';
      const hydrated2 = hydrateArgs([[1, 2, 3], 5], 'auto', code2);
      expect(hydrated2.length).toBe(2);
      expect(hydrated2[0]).toBeInstanceOf(ListNode);
      expect(hydrated2[1]).toBe(5);

      const code3 = 'function loopNodes(first) { while (first) first = first.next; }';
      const hydrated3 = hydrateArgs([[100]], 'auto', code3);
      expect(hydrated3.length).toBe(1);
      expect(hydrated3[0]).toBeInstanceOf(ListNode);

      const code4 = 'const traverse = head => { let c = head; while (c) c = c?.next; };';
      const hydrated4 = hydrateArgs([[5, 10, 15]], 'auto', code4);
      expect(hydrated4.length).toBe(1);
      expect(hydrated4[0]).toBeInstanceOf(ListNode);
      expect(hydrated4[0].val).toBe(5);
    });

    it('auto-detects tree from function ... (root) or .left/.right in playground scripts', () => {
      const code1 = 'function depth(root) { if (!root) return 0; return 1; }';
      const hydrated1 = hydrateArgs([[3, 9, 20]], 'auto', code1);
      expect(hydrated1.length).toBe(1);
      expect(hydrated1[0]).toBeInstanceOf(TreeNode);
      expect(hydrated1[0].val).toBe(3);

      const code2 = 'const invert = (root) => { const left = root.left; root.left = root.right; };';
      const hydrated2 = hydrateArgs([[4, 2, 7]], 'auto', code2);
      expect(hydrated2.length).toBe(1);
      expect(hydrated2[0]).toBeInstanceOf(TreeNode);

      const code3 = 'const getLeft = root => root?.left;';
      const hydrated3 = hydrateArgs([[1, 2, 3]], 'auto', code3);
      expect(hydrated3.length).toBe(1);
      expect(hydrated3[0]).toBeInstanceOf(TreeNode);
      expect(hydrated3[0].val).toBe(1);
    });

    it('does not falsely auto-detect list or tree for array two-pointers code', () => {
      const code = 'function twoSum(nums, target) { let left = 0, right = nums.length - 1; }';
      const raw = [[2, 7, 11, 15], 9];
      const hydrated = hydrateArgs(raw, 'auto', code);
      expect(hydrated).toEqual([[2, 7, 11, 15], 9]);
    });

    it('hydrates tree array arguments', () => {
      const hydrated = hydrateArgs([[3, 9, 20, null, null, 15, 7]], 'tree');
      expect(hydrated.length).toBe(1);
      expect(hydrated[0]).toBeInstanceOf(TreeNode);
      expect(hydrated[0].val).toBe(3);
    });

    it('leaves args untouched when hydration is none', () => {
      const raw = [[2, 7, 11, 15], 9];
      const hydrated = hydrateArgs(raw, 'none');
      expect(hydrated).toEqual([[2, 7, 11, 15], 9]);
    });
  });
});

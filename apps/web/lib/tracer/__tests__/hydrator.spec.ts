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

    it('hydrates cycle list args [arr, pos] into a single head argument', () => {
      const hydrated = hydrateArgs([[3, 2, 0, -4], 1], 'linked-list');
      expect(hydrated.length).toBe(1);
      expect(hydrated[0]).toBeInstanceOf(ListNode);
      expect(hydrated[0].next?.next?.next?.next).toBe(hydrated[0].next);
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

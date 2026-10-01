import type { Problem } from '@visucode/shared-types';

export class ListNode {
  val: any;
  next: ListNode | null;

  constructor(val?: any, next?: ListNode | null) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }
}

export class TreeNode {
  val: any;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val?: any, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }
}

/**
 * Converts a JS array into a singly linked list with optional cycle.
 * Compatible with LeetCode catalog test cases and wrappers (F-LDR-S3-03).
 */
export function arrayToList(arr: any[], pos?: number): ListNode | null {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;

  const head = new ListNode(arr[0]);
  let curr = head;
  let cycleNode: ListNode | null = pos === 0 ? head : null;

  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
    if (i === pos) cycleNode = curr;
  }

  if (typeof pos === 'number' && pos !== -1 && cycleNode) {
    curr.next = cycleNode;
  }

  return head;
}

/**
 * Converts a level-order JS array into a binary tree.
 * Supports null values for missing children.
 * Compatible with LeetCode catalog test cases and wrappers (F-LDR-S3-03).
 */
export function arrayToTree(arr: any[]): TreeNode | null {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  if (arr[0] === null || arr[0] === undefined) return null;

  const root = new TreeNode(arr[0]);
  const queue: TreeNode[] = [root];
  let i = 1;

  while (queue.length > 0 && i < arr.length) {
    const curr = queue.shift()!;

    if (i < arr.length) {
      if (arr[i] !== null && arr[i] !== undefined) {
        curr.left = new TreeNode(arr[i]);
        queue.push(curr.left);
      }
      i++;
    }

    if (i < arr.length) {
      if (arr[i] !== null && arr[i] !== undefined) {
        curr.right = new TreeNode(arr[i]);
        queue.push(curr.right);
      }
      i++;
    }
  }

  return root;
}

export type HydrationType = 'linked-list' | 'tree' | 'none' | 'auto';

/**
 * Detects whether a problem requires linked-list or tree input hydration.
 */
export function detectHydrationType(problem?: Problem): HydrationType {
  if (!problem) return 'none';
  const jsWrapper = problem.wrapperCode?.['javascript'] || '';
  if (jsWrapper.includes('__arrayToList') || problem.category === 'linked-list') {
    return 'linked-list';
  }
  if (
    jsWrapper.includes('__arrayToTree') ||
    problem.category === 'tree'
  ) {
    return 'tree';
  }
  return 'none';
}

/**
 * Hydrates array arguments into node objects (linked-list or tree) prior to worker execution.
 * Ensures user code runs directly without wrapper code on the instrumented tape (F-LDR-S3-03).
 */
export function hydrateArgs(
  args: any[],
  hydrationType: HydrationType = 'auto',
  code?: string
): any[] {
  if (!args || !Array.isArray(args) || args.length === 0) {
    return args;
  }

  let resolvedType = hydrationType;
  if (resolvedType === 'auto') {
    if (code) {
      // Robust detection for playground & arbitrary user scripts (F-LDR-S3-03)
      // Matches function ... (head), (head) =>, head =>, .next property access, or known list helpers
      const isList =
        /\(([^)]*\b)?head\b/i.test(code) ||
        /\bhead\s*=>/i.test(code) ||
        /\b[a-zA-Z0-9_$]+\??\.next\b/.test(code) ||
        /\bListNode\b/.test(code) ||
        /\b(reverseList|mergeTwoLists|hasCycle|detectCycle|cycle|deleteNode|removeNthFromEnd|reorderList|middleNode|deleteDuplicates|removeElements)\b/i.test(code);

      // Matches function ... (root), (root) =>, root =>, .left / .right property access, or known tree helpers
      const isTree =
        /\(([^)]*\b)?root\b/i.test(code) ||
        /\broot\s*=>/i.test(code) ||
        /\b[a-zA-Z0-9_$]+\??\.(left|right)\b/.test(code) ||
        /\bTreeNode\b/.test(code) ||
        /\b(maxDepth|minDepth|invertTree|isSameTree|isSubtree|levelOrder|isValidBST|lowestCommonAncestor|hasPathSum|diameterOfBinaryTree)\b/i.test(code);

      if (isList && !isTree) resolvedType = 'linked-list';
      else if (isTree && !isList) resolvedType = 'tree';
      else resolvedType = 'none';
    } else {
      resolvedType = 'none';
    }
  }

  if (resolvedType === 'linked-list') {
    // Only treat [arr, pos] as a cycle when the code specifically represents a cycle problem (e.g. hasCycle)
    // Preserves multi-argument functions like removeNthFromEnd(head, n)
    const isCycleProblem =
      Boolean(code && (/\b(hasCycle|detectCycle|cycle|loop)\b/i.test(code) || /\bpos\b/i.test(code)));

    if (isCycleProblem && args.length === 2 && Array.isArray(args[0]) && typeof args[1] === 'number') {
      return [arrayToList(args[0], args[1])];
    }

    // Normal linked list(s): convert array arguments to list nodes, preserve scalar arguments (e.g. n in removeNthFromEnd)
    return args.map((arg) => (Array.isArray(arg) ? arrayToList(arg) : arg));
  }

  if (resolvedType === 'tree') {
    return args.map((arg) => (Array.isArray(arg) ? arrayToTree(arg) : arg));
  }

  return args;
}

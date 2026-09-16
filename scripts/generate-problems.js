const fs = require('fs');
const path = require('path');

const problemsDir = process.env.PROBLEMS_DIR || path.join(__dirname, '../apps/web/content/problems');

const JS_LINKED_LIST_WRAPPER = `
class ListNode { constructor(val, next) { this.val = (val===undefined ? 0 : val); this.next = (next===undefined ? null : next); } }
function __arrayToList(arr) { if(!arr || !arr.length) return null; let head = new ListNode(arr[0]); let curr = head; for(let i=1; i<arr.length; i++) { curr.next = new ListNode(arr[i]); curr = curr.next; } return head; }
function __listToArray(head) { const res = []; let curr = head; let count=0; while(curr && count < 1000) { res.push(curr.val); curr = curr.next; count++; } return res; }
function __execute(arg) { return __listToArray(reverseList(__arrayToList(arg))); }
`.trim();

const reverseLinkedList = {
  slug: 'reverse-linked-list',
  title: 'Reverse Linked List',
  difficulty: 'Easy',
  category: 'linked-list',
  patterns: ['two-pointers'],
  companies: ['Amazon', 'Microsoft', 'Apple'],
  description: 'Given the `head` of a singly linked list, reverse the list, and return *the reversed list*.',
  examples: [
    { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }
  ],
  constraints: [
    'The number of nodes in the list is the range [0, 5000].',
    '-5000 <= Node.val <= 5000'
  ],
  hints: ['Can you reverse the links while iterating?'],
  starterCode: {
    javascript: '/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n    let prev = null;\n    let curr = head;\n    while (curr !== null) {\n        let nxt = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nxt;\n    }\n    return prev;\n}'
  },
  wrapperCode: {
    javascript: JS_LINKED_LIST_WRAPPER
  },
  solutions: [
    {
      language: 'javascript',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: 'Iterate through the list, changing the next pointer to point to the previous node.',
      code: 'function reverseList(head) {\n    let prev = null;\n    let curr = head;\n    while (curr !== null) {\n        let nxt = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nxt;\n    }\n    return prev;\n}'
    }
  ],
  testCases: [
    { id: '1', input: '[[1,2,3,4,5]]', expected: '[5,4,3,2,1]' },
    { id: '2', input: '[[1,2]]', expected: '[2,1]' },
    { id: '3', input: '[[]]', expected: '[]' }
  ],
  dryRunSteps: [
    {
      stepNumber: 1,
      line: 2,
      variables: [{ name: 'prev', value: 'null', type: 'ListNode' }, { name: 'curr', value: 'head', type: 'ListNode' }],
      explanation: 'Initialize prev to null and curr to head.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 1, nextId: 'n2' },
          { id: 'n2', value: 2, nextId: 'n3' },
          { id: 'n3', value: 3 }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'curr', targetId: 'n1', color: '#10b981' }, { name: 'prev', color: '#ef4444' }]
    },
    {
      stepNumber: 2,
      line: 4,
      variables: [{ name: 'nxt', value: 'n2', type: 'ListNode' }],
      explanation: 'Save the next node before overwriting the link.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 1, nextId: 'n2' },
          { id: 'n2', value: 2, nextId: 'n3' },
          { id: 'n3', value: 3 }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'curr', targetId: 'n1', color: '#10b981' }, { name: 'nxt', targetId: 'n2', color: '#3b82f6' }]
    },
    {
      stepNumber: 3,
      line: 5,
      variables: [],
      explanation: 'Reverse the current link to point backwards.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 1 },
          { id: 'n2', value: 2, nextId: 'n3' },
          { id: 'n3', value: 3 }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'curr', targetId: 'n1', color: '#10b981' }]
    },
    {
      stepNumber: 4,
      line: 6,
      variables: [],
      explanation: 'Advance prev pointer.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 1 },
          { id: 'n2', value: 2, nextId: 'n3' },
          { id: 'n3', value: 3 }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'curr', targetId: 'n1', color: '#10b981' }, { name: 'prev', targetId: 'n1', color: '#ef4444' }]
    },
    {
      stepNumber: 5,
      line: 7,
      variables: [],
      explanation: 'Advance curr pointer.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 1 },
          { id: 'n2', value: 2, nextId: 'n3' },
          { id: 'n3', value: 3 }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'curr', targetId: 'n2', color: '#10b981' }, { name: 'prev', targetId: 'n1', color: '#ef4444' }]
    },
    {
      stepNumber: 6,
      line: 5,
      variables: [],
      explanation: 'Reverse the second link to point backwards to prev.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 1 },
          { id: 'n2', value: 2, nextId: 'n1' },
          { id: 'n3', value: 3 }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'curr', targetId: 'n2', color: '#10b981' }, { name: 'prev', targetId: 'n1', color: '#ef4444' }]
    }
  ],
  externalLinks: [{ title: 'LeetCode', url: 'https://leetcode.com/' }],
  realWorldUseCases: [],
  accessLevel: 'free'
};

const CYCLE_WRAPPER = `
class ListNode { constructor(val, next) { this.val = (val===undefined ? 0 : val); this.next = (next===undefined ? null : next); } }
function __arrayToList(arr, pos) { 
  if(!arr || !arr.length) return null; 
  let head = new ListNode(arr[0]); let curr = head; let cycleNode = pos===0?head:null;
  for(let i=1; i<arr.length; i++) { curr.next = new ListNode(arr[i]); curr = curr.next; if(i===pos) cycleNode=curr; } 
  if(pos !== -1) curr.next = cycleNode;
  return head; 
}
function __execute(arr, pos) { return hasCycle(__arrayToList(arr, pos)); }
`.trim();

const linkedListCycle = {
  slug: 'linked-list-cycle',
  title: 'Linked List Cycle',
  difficulty: 'Easy',
  category: 'linked-list',
  patterns: ['two-pointers'],
  companies: ['Amazon', 'Microsoft'],
  description: 'Given `head`, the head of a linked list, determine if the linked list has a cycle in it.',
  examples: [
    { input: 'head = [3,2,0,-4], pos = 1', output: 'true' }
  ],
  constraints: [],
  hints: ['Can you use two pointers, one moving faster than the other?'],
  starterCode: {
    javascript: 'function hasCycle(head) {\n    let slow = head, fast = head;\n    while (fast && fast.next) {\n        slow = slow.next;\n        fast = fast.next.next;\n        if (slow === fast) return true;\n    }\n    return false;\n}'
  },
  wrapperCode: { javascript: CYCLE_WRAPPER },
  solutions: [
    {
      language: 'javascript',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: 'Floyd cycle finding algorithm.',
      code: 'function hasCycle(head) {\n    let slow = head, fast = head;\n    while (fast && fast.next) {\n        slow = slow.next;\n        fast = fast.next.next;\n        if (slow === fast) return true;\n    }\n    return false;\n}'
    }
  ],
  testCases: [
    { id: '1', input: '[[3,2,0,-4], 1]', expected: 'true' },
    { id: '2', input: '[[1,2], 0]', expected: 'true' },
    { id: '3', input: '[[1], -1]', expected: 'false' }
  ],
  dryRunSteps: [
    {
      stepNumber: 1,
      line: 2,
      variables: [],
      explanation: 'Initialize slow and fast pointers to head.',
      linkedListState: {
        nodes: [
          { id: 'n1', value: 3, nextId: 'n2' },
          { id: 'n2', value: 2, nextId: 'n3' },
          { id: 'n3', value: 0, nextId: 'n4' },
          { id: 'n4', value: -4, nextId: 'n2' }
        ],
        headId: 'n1'
      },
      pointers: [{ name: 'slow', targetId: 'n1', color: '#10b981' }, { name: 'fast', targetId: 'n1', color: '#ef4444' }]
    },
    {
      stepNumber: 2,
      line: 3,
      variables: [],
      explanation: 'Move slow pointer.',
      linkedListState: { nodes: [] },
      pointers: []
    },
    {
      stepNumber: 3,
      line: 4,
      variables: [],
      explanation: 'Move fast pointer.',
      linkedListState: { nodes: [] },
      pointers: []
    }
  ],
  externalLinks: [{ title: 'LeetCode', url: 'https://leetcode.com/' }],
  realWorldUseCases: [],
  accessLevel: 'free'
};


const MERGE_WRAPPER = `
class ListNode { constructor(val, next) { this.val = (val===undefined ? 0 : val); this.next = (next===undefined ? null : next); } }
function __arrayToList(arr) { if(!arr || !arr.length) return null; let head = new ListNode(arr[0]); let curr = head; for(let i=1; i<arr.length; i++) { curr.next = new ListNode(arr[i]); curr = curr.next; } return head; }
function __listToArray(head) { const res = []; let curr = head; let count=0; while(curr && count < 1000) { res.push(curr.val); curr = curr.next; count++; } return res; }
function __execute(list1, list2) { return __listToArray(mergeTwoLists(__arrayToList(list1), __arrayToList(list2))); }
`.trim();

const mergeTwoSortedLists = {
  slug: 'merge-two-sorted-lists',
  title: 'Merge Two Sorted Lists',
  difficulty: 'Easy',
  category: 'linked-list',
  patterns: ['two-pointers'],
  companies: ['Amazon', 'Microsoft'],
  description: 'Merge two sorted linked lists and return it as a new sorted list.',
  examples: [
    { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }
  ],
  constraints: [],
  hints: ['Use a dummy node.'],
  starterCode: {
    javascript: 'function mergeTwoLists(list1, list2) {\n    let dummy = new ListNode(-1);\n    let curr = dummy;\n    while(list1 && list2) {\n        if(list1.val <= list2.val) {\n            curr.next = list1;\n            list1 = list1.next;\n        } else {\n            curr.next = list2;\n            list2 = list2.next;\n        }\n        curr = curr.next;\n    }\n    curr.next = list1 || list2;\n    return dummy.next;\n}'
  },
  wrapperCode: { javascript: MERGE_WRAPPER },
  solutions: [
    {
      language: 'javascript',
      timeComplexity: 'O(N+M)',
      spaceComplexity: 'O(1)',
      explanation: 'Two pointers comparing values.',
      code: 'function mergeTwoLists(list1, list2) {\n    let dummy = new ListNode(-1);\n    let curr = dummy;\n    while(list1 && list2) {\n        if(list1.val <= list2.val) {\n            curr.next = list1;\n            list1 = list1.next;\n        } else {\n            curr.next = list2;\n            list2 = list2.next;\n        }\n        curr = curr.next;\n    }\n    curr.next = list1 || list2;\n    return dummy.next;\n}'
    }
  ],
  testCases: [
    { id: '1', input: '[[1,2,4], [1,3,4]]', expected: '[1,1,2,3,4,4]' },
    { id: '2', input: '[[], []]', expected: '[]' },
    { id: '3', input: '[[], [0]]', expected: '[0]' }
  ],
  dryRunSteps: [
    {
      stepNumber: 1,
      line: 2,
      variables: [],
      explanation: 'Initialize dummy node.',
      linkedListState: {
        nodes: [
          { id: 'd', value: -1 },
          { id: 'n1', value: 1, nextId: 'n2' },
          { id: 'n2', value: 2 },
          { id: 'm1', value: 1, nextId: 'm2' },
          { id: 'm2', value: 3 }
        ]
      },
      pointers: [{ name: 'curr', targetId: 'd', color: '#10b981' }, { name: 'list1', targetId: 'n1', color: '#ef4444' }, { name: 'list2', targetId: 'm1', color: '#3b82f6' }]
    },
    {
      stepNumber: 2,
      line: 3,
      variables: [],
      explanation: 'Check if lists are not null.',
      linkedListState: { nodes: [] },
      pointers: []
    },
    {
      stepNumber: 3,
      line: 4,
      variables: [],
      explanation: 'Compare values.',
      linkedListState: { nodes: [] },
      pointers: []
    }
  ],
  externalLinks: [{ title: 'LeetCode', url: 'https://leetcode.com/' }],
  realWorldUseCases: [],
  accessLevel: 'free'
};


const JS_TREE_WRAPPER = `
class TreeNode { constructor(val, left, right) { this.val = (val===undefined ? 0 : val); this.left = (left===undefined ? null : left); this.right = (right===undefined ? null : right); } }
function __arrayToTree(arr) {
    if (!arr.length) return null;
    let root = new TreeNode(arr[0]);
    let q = [root];
    let i = 1;
    while(i < arr.length) {
        let curr = q.shift();
        if (arr[i] !== null) { curr.left = new TreeNode(arr[i]); q.push(curr.left); }
        i++;
        if (i < arr.length && arr[i] !== null) { curr.right = new TreeNode(arr[i]); q.push(curr.right); }
        i++;
    }
    return root;
}
function __treeToArray(root) {
    if (!root) return [];
    let res = [];
    let q = [root];
    while(q.length > 0) {
        let curr = q.shift();
        if (curr) { res.push(curr.val); q.push(curr.left); q.push(curr.right); }
        else { res.push(null); }
    }
    while(res[res.length-1] === null) res.pop();
    return res;
}
`;

const maxDepthWrapper = JS_TREE_WRAPPER + `\nfunction __execute(arr) { return maxDepth(__arrayToTree(arr)); }`;
const maxDepth = {
  slug: 'maximum-depth-of-binary-tree',
  title: 'Maximum Depth of Binary Tree',
  difficulty: 'Easy',
  category: 'tree',
  patterns: ['dfs'],
  companies: ['Amazon', 'Microsoft'],
  description: 'Given the `root` of a binary tree, return its maximum depth.',
  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: '3' }
  ],
  constraints: [],
  hints: ['A binary tree depth is the maximum of left and right depths + 1.'],
  externalLinks: [
    {
      title: 'LeetCode Maximum Depth of Binary Tree',
      url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'
    }
  ],
  starterCode: {
    javascript: 'function maxDepth(root) {\n    if (!root) return 0;\n    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}'
  },
  wrapperCode: { javascript: maxDepthWrapper },
  solutions: [
    {
      language: 'javascript',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(H)',
      explanation: 'DFS to find depth.',
      code: 'function maxDepth(root) {\n    if (!root) return 0;\n    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}'
    }
  ],
  testCases: [
    { id: '1', input: '[[3,9,20,null,null,15,7]]', expected: '3' },
    { id: '2', input: '[[1,null,2]]', expected: '2' },
    { id: '3', input: '[[]]', expected: '0' }
  ],
  dryRunSteps: [
    {
      stepNumber: 1,
      line: 2,
      variables: [],
      explanation: 'Call maxDepth on root.',
      treeState: {
        nodes: [
          { id: 'n3', value: 3, leftId: 'n9', rightId: 'n20' },
          { id: 'n9', value: 9 },
          { id: 'n20', value: 20, leftId: 'n15', rightId: 'n7' },
          { id: 'n15', value: 15 },
          { id: 'n7', value: 7 }
        ],
        rootId: 'n3'
      },
      pointers: [{ name: 'root', targetId: 'n3', color: '#10b981' }]
    },
    {
      stepNumber: 2,
      line: 3,
      variables: [],
      explanation: 'Recurse left.',
      treeState: { nodes: [], rootId: '' },
      pointers: []
    },
    {
      stepNumber: 3,
      line: 3,
      variables: [],
      explanation: 'Recurse right.',
      treeState: { nodes: [], rootId: '' },
      pointers: []
    }
  ],
  realWorldUseCases: [],
  accessLevel: 'free'
};


const invertTreeWrapper = JS_TREE_WRAPPER + `\nfunction __execute(arr) { return __treeToArray(invertTree(__arrayToTree(arr))); }`;
const invertTree = {
  slug: 'invert-binary-tree',
  title: 'Invert Binary Tree',
  difficulty: 'Easy',
  category: 'tree',
  patterns: ['dfs'],
  companies: ['Google', 'Mac'],
  description: 'Given the `root` of a binary tree, invert the tree, and return its root.',
  examples: [
    { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }
  ],
  constraints: [],
  hints: ['Swap left and right children recursively.'],
  externalLinks: [
    {
      title: 'LeetCode Invert Binary Tree',
      url: 'https://leetcode.com/problems/invert-binary-tree/'
    }
  ],
  starterCode: {
    javascript: 'function invertTree(root) {\n    if (!root) return null;\n    let temp = root.left;\n    root.left = root.right;\n    root.right = temp;\n    invertTree(root.left);\n    invertTree(root.right);\n    return root;\n}'
  },
  wrapperCode: { javascript: invertTreeWrapper },
  solutions: [
    {
      language: 'javascript',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(H)',
      explanation: 'DFS to swap children.',
      code: 'function invertTree(root) {\n    if (!root) return null;\n    let temp = root.left;\n    root.left = root.right;\n    root.right = temp;\n    invertTree(root.left);\n    invertTree(root.right);\n    return root;\n}'
    }
  ],
  testCases: [
    { id: '1', input: '[[4,2,7,1,3,6,9]]', expected: '[4,7,2,9,6,3,1]' },
    { id: '2', input: '[[2,1,3]]', expected: '[2,3,1]' },
    { id: '3', input: '[[]]', expected: '[]' }
  ],
  dryRunSteps: [
    {
      stepNumber: 1,
      line: 4,
      variables: [],
      explanation: 'Swap left and right of root.',
      treeState: {
        nodes: [
          { id: 'n4', value: 4, leftId: 'n7', rightId: 'n2' },
          { id: 'n2', value: 2 },
          { id: 'n7', value: 7 }
        ],
        rootId: 'n4'
      },
      pointers: [{ name: 'root', targetId: 'n4', color: '#10b981' }]
    },
    {
      stepNumber: 2,
      line: 5,
      variables: [],
      explanation: 'Recurse left.',
      treeState: { nodes: [], rootId: '' },
      pointers: []
    },
    {
      stepNumber: 3,
      line: 6,
      variables: [],
      explanation: 'Recurse right.',
      treeState: { nodes: [], rootId: '' },
      pointers: []
    }
  ],
  realWorldUseCases: [],
  accessLevel: 'free'
};


fs.writeFileSync(path.join(problemsDir, 'reverse-linked-list.json'), JSON.stringify(reverseLinkedList, null, 2));
fs.writeFileSync(path.join(problemsDir, 'linked-list-cycle.json'), JSON.stringify(linkedListCycle, null, 2));
fs.writeFileSync(path.join(problemsDir, 'merge-two-sorted-lists.json'), JSON.stringify(mergeTwoSortedLists, null, 2));
fs.writeFileSync(path.join(problemsDir, 'maximum-depth-of-binary-tree.json'), JSON.stringify(maxDepth, null, 2));
fs.writeFileSync(path.join(problemsDir, 'invert-binary-tree.json'), JSON.stringify(invertTree, null, 2));

console.log('Successfully wrote 5 problems!');

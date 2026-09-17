const fs = require('fs');
const path = require('path');

const problemsDir = 'd:\\\\Suvam-Work\\\\Project\\\\visucode\\\\apps\\\\web\\\\content\\\\problems';

function readProblem(slug) {
  return JSON.parse(fs.readFileSync(path.join(problemsDir, `${slug}.json`), 'utf8'));
}

function writeProblem(slug, data) {
  fs.writeFileSync(path.join(problemsDir, `${slug}.json`), JSON.stringify(data, null, 2));
}

// 1. Fix reverse-linked-list
let rev = readProblem('reverse-linked-list');
rev.externalLinks = [{ platform: 'leetcode', url: 'https://leetcode.com/problems/reverse-linked-list/' }];
rev.starterCode.javascript = `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n    // Your code here\n}`;
// Let's generate complete dry run for reverse-linked-list: [1,2,3,4,5]
const revNodes = [
  { id: 'n1', value: 1, nextId: 'n2' },
  { id: 'n2', value: 2, nextId: 'n3' },
  { id: 'n3', value: 3, nextId: 'n4' },
  { id: 'n4', value: 4, nextId: 'n5' },
  { id: 'n5', value: 5, nextId: null }
];
// Wait, generating steps by hand in a script is easier:
let revSteps = [];
let prev = null, curr = 'n1', nxt = null;
let currentNodes = JSON.parse(JSON.stringify(revNodes));
let headId = 'n1';
let stepNum = 1;

revSteps.push({
  stepNumber: stepNum++,
  line: 2,
  variables: [{ name: 'prev', value: 'null', type: 'ListNode' }, { name: 'curr', value: 'head', type: 'ListNode' }],
  explanation: 'Initialize prev to null and curr to head.',
  linkedListState: { nodes: JSON.parse(JSON.stringify(currentNodes)), headId: headId },
  pointers: [{ name: 'curr', targetId: 'n1', color: '#10b981' }, { name: 'prev', color: '#ef4444' }] // prev is null, no target
});

// We need to trace the loop for all 5 nodes
let ids = ['n1', 'n2', 'n3', 'n4', 'n5', null];
for (let i = 0; i < 5; i++) {
  let cId = ids[i];
  let nId = ids[i+1];
  
  // let nxt = curr.next
  revSteps.push({
    stepNumber: stepNum++,
    line: 4,
    variables: [{ name: 'nxt', value: nId ? nId : 'null', type: 'ListNode' }],
    explanation: 'Save the next node before overwriting the link.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(currentNodes)), headId: headId },
    pointers: [
      { name: 'curr', targetId: cId, color: '#10b981' },
      ...(prev ? [{ name: 'prev', targetId: prev, color: '#ef4444' }] : []),
      ...(nId ? [{ name: 'nxt', targetId: nId, color: '#3b82f6' }] : [])
    ]
  });

  // curr.next = prev
  let nodeToUpdate = currentNodes.find(n => n.id === cId);
  nodeToUpdate.nextId = prev; // can be null
  
  revSteps.push({
    stepNumber: stepNum++,
    line: 5,
    variables: [],
    explanation: 'Reverse the current link to point backwards.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(currentNodes)), headId: headId },
    pointers: [
      { name: 'curr', targetId: cId, color: '#10b981' },
      ...(prev ? [{ name: 'prev', targetId: prev, color: '#ef4444' }] : []),
      ...(nId ? [{ name: 'nxt', targetId: nId, color: '#3b82f6' }] : [])
    ]
  });

  // prev = curr
  prev = cId;
  revSteps.push({
    stepNumber: stepNum++,
    line: 6,
    variables: [],
    explanation: 'Advance prev pointer.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(currentNodes)), headId: headId },
    pointers: [
      { name: 'curr', targetId: cId, color: '#10b981' },
      { name: 'prev', targetId: prev, color: '#ef4444' },
      ...(nId ? [{ name: 'nxt', targetId: nId, color: '#3b82f6' }] : [])
    ]
  });

  // curr = nxt
  curr = nId;
  revSteps.push({
    stepNumber: stepNum++,
    line: 7,
    variables: [],
    explanation: 'Advance curr pointer.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(currentNodes)), headId: headId },
    pointers: [
      ...(curr ? [{ name: 'curr', targetId: curr, color: '#10b981' }] : []),
      { name: 'prev', targetId: prev, color: '#ef4444' },
      ...(nId ? [{ name: 'nxt', targetId: nId, color: '#3b82f6' }] : [])
    ]
  });
}

// Update headId
headId = prev;
revSteps.push({
  stepNumber: stepNum++,
  line: 9,
  variables: [],
  explanation: 'Return prev as the new head of the reversed list.',
  linkedListState: { nodes: JSON.parse(JSON.stringify(currentNodes)), headId: headId },
  pointers: [
    { name: 'prev', targetId: prev, color: '#ef4444' }
  ]
});

rev.dryRunSteps = revSteps;
writeProblem('reverse-linked-list', rev);


// 2. Fix linked-list-cycle
let cyc = readProblem('linked-list-cycle');
cyc.externalLinks = [{ platform: 'leetcode', url: 'https://leetcode.com/problems/linked-list-cycle/' }];
cyc.starterCode.javascript = `/**\n * Definition for singly-linked list.\n * function ListNode(val) {\n *     this.val = val;\n *     this.next = null;\n * }\n */\n/**\n * @param {ListNode} head\n * @return {boolean}\n */\nfunction hasCycle(head) {\n    // Your code here\n}`;
// Re-build dry runs correctly keeping all nodes
const cycNodes = [
  { id: 'n1', value: 3, nextId: 'n2' },
  { id: 'n2', value: 2, nextId: 'n3' },
  { id: 'n3', value: 0, nextId: 'n4' },
  { id: 'n4', value: -4, nextId: 'n2' }
];
const cycSteps = [
  {
    stepNumber: 1,
    line: 2,
    variables: [],
    explanation: 'Initialize slow and fast pointers to head.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n1', color: '#3b82f6' }, { name: 'fast', targetId: 'n1', color: '#ef4444' }]
  },
  {
    stepNumber: 2,
    line: 4,
    variables: [],
    explanation: 'Move slow pointer by 1 step.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n2', color: '#3b82f6' }, { name: 'fast', targetId: 'n1', color: '#ef4444' }]
  },
  {
    stepNumber: 3,
    line: 5,
    variables: [],
    explanation: 'Move fast pointer by 2 steps.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n2', color: '#3b82f6' }, { name: 'fast', targetId: 'n3', color: '#ef4444' }]
  },
  {
    stepNumber: 4,
    line: 4,
    variables: [],
    explanation: 'Move slow pointer by 1 step.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n3', color: '#3b82f6' }, { name: 'fast', targetId: 'n3', color: '#ef4444' }]
  },
  {
    stepNumber: 5,
    line: 5,
    variables: [],
    explanation: 'Move fast pointer by 2 steps (loops back).',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n3', color: '#3b82f6' }, { name: 'fast', targetId: 'n2', color: '#ef4444' }]
  },
  {
    stepNumber: 6,
    line: 4,
    variables: [],
    explanation: 'Move slow pointer by 1 step.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n4', color: '#3b82f6' }, { name: 'fast', targetId: 'n2', color: '#ef4444' }]
  },
  {
    stepNumber: 7,
    line: 5,
    variables: [],
    explanation: 'Move fast pointer by 2 steps (loops back to n4).',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n4', color: '#3b82f6' }, { name: 'fast', targetId: 'n4', color: '#ef4444' }]
  },
  {
    stepNumber: 8,
    line: 6,
    variables: [],
    explanation: 'slow and fast meet! Cycle detected.',
    linkedListState: { nodes: JSON.parse(JSON.stringify(cycNodes)), headId: 'n1' },
    pointers: [{ name: 'slow', targetId: 'n4', color: '#10b981' }, { name: 'fast', targetId: 'n4', color: '#10b981' }]
  }
];
cyc.dryRunSteps = cycSteps;
writeProblem('linked-list-cycle', cyc);

// 3. merge-two-sorted-lists
let mrg = readProblem('merge-two-sorted-lists');
mrg.externalLinks = [{ platform: 'leetcode', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' }];
mrg.starterCode.javascript = `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nfunction mergeTwoLists(list1, list2) {\n    // Your code here\n}`;
// The user noted: "Merge Two Sorted Lists ... dry run traces show extremely thin lines for pointers in the svg. Something missing?"
// Pointers arrays must have `name` and `targetId` and `color`. Let's check existing:
mrg.dryRunSteps.forEach(step => {
  step.pointers = step.pointers.filter(p => p.targetId && p.name && p.color);
});
writeProblem('merge-two-sorted-lists', mrg);

// 4. invert-binary-tree
let inv = readProblem('invert-binary-tree');
inv.externalLinks = [{ platform: 'leetcode', url: 'https://leetcode.com/problems/invert-binary-tree/' }];
inv.companies = ['Google', 'Meta'];
inv.starterCode.javascript = `/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nfunction invertTree(root) {\n    // Your code here\n}`;

// User noted: "nodes: [] happens when a node becomes empty (e.g. invert tree step 2) which crashes the visualizer, always maintain tree structure even if children swap to null."
// Let's fix invert-binary-tree dryRunSteps:
// Find step where it crashes due to empty nodes or missing child.
const fullTree = [
  { id: 'n4', value: 4, leftId: 'n2', rightId: 'n7' },
  { id: 'n2', value: 2, leftId: 'n1', rightId: 'n3' },
  { id: 'n7', value: 7, leftId: 'n6', rightId: 'n9' },
  { id: 'n1', value: 1 },
  { id: 'n3', value: 3 },
  { id: 'n6', value: 6 },
  { id: 'n9', value: 9 }
];
let clonedNodes = JSON.parse(JSON.stringify(fullTree));
const invSteps = [
  {
    stepNumber: 1,
    line: 2,
    variables: [],
    explanation: 'Start DFS at root (4).',
    treeState: { nodes: JSON.parse(JSON.stringify(clonedNodes)), rootId: 'n4' },
    pointers: [{ name: 'curr', targetId: 'n4', color: '#10b981' }]
  },
  {
    stepNumber: 2,
    line: 4,
    variables: [{ name: 'temp', value: 'n2 (2)', type: 'TreeNode' }],
    explanation: 'Save left child (2) to temp.',
    treeState: { nodes: JSON.parse(JSON.stringify(clonedNodes)), rootId: 'n4' },
    pointers: [{ name: 'curr', targetId: 'n4', color: '#10b981' }]
  },
  {
    stepNumber: 3,
    line: 5,
    variables: [],
    explanation: 'Set left child to right child (7).',
    treeState: {
      nodes: [
        { id: 'n4', value: 4, leftId: 'n7', rightId: 'n7' },
        { id: 'n2', value: 2, leftId: 'n1', rightId: 'n3' },
        { id: 'n7', value: 7, leftId: 'n6', rightId: 'n9' },
        { id: 'n1', value: 1 },
        { id: 'n3', value: 3 },
        { id: 'n6', value: 6 },
        { id: 'n9', value: 9 }
      ],
      rootId: 'n4'
    },
    pointers: [{ name: 'curr', targetId: 'n4', color: '#10b981' }]
  },
  {
    stepNumber: 4,
    line: 6,
    variables: [],
    explanation: 'Set right child to temp (2).',
    treeState: {
      nodes: [
        { id: 'n4', value: 4, leftId: 'n7', rightId: 'n2' },
        { id: 'n2', value: 2, leftId: 'n1', rightId: 'n3' },
        { id: 'n7', value: 7, leftId: 'n6', rightId: 'n9' },
        { id: 'n1', value: 1 },
        { id: 'n3', value: 3 },
        { id: 'n6', value: 6 },
        { id: 'n9', value: 9 }
      ],
      rootId: 'n4'
    },
    pointers: [{ name: 'curr', targetId: 'n4', color: '#10b981' }]
  },
  {
    stepNumber: 5,
    line: 7,
    variables: [],
    explanation: 'Recursively invert the left subtree (which is now 7).',
    treeState: {
      nodes: [
        { id: 'n4', value: 4, leftId: 'n7', rightId: 'n2' },
        { id: 'n2', value: 2, leftId: 'n1', rightId: 'n3' },
        { id: 'n7', value: 7, leftId: 'n9', rightId: 'n6' }, // 7 inverted!
        { id: 'n1', value: 1 },
        { id: 'n3', value: 3 },
        { id: 'n6', value: 6 },
        { id: 'n9', value: 9 }
      ],
      rootId: 'n4'
    },
    pointers: [{ name: 'curr', targetId: 'n7', color: '#3b82f6' }]
  },
  {
    stepNumber: 6,
    line: 8,
    variables: [],
    explanation: 'Recursively invert the right subtree (which is now 2).',
    treeState: {
      nodes: [
        { id: 'n4', value: 4, leftId: 'n7', rightId: 'n2' },
        { id: 'n2', value: 2, leftId: 'n3', rightId: 'n1' }, // 2 inverted!
        { id: 'n7', value: 7, leftId: 'n9', rightId: 'n6' },
        { id: 'n1', value: 1 },
        { id: 'n3', value: 3 },
        { id: 'n6', value: 6 },
        { id: 'n9', value: 9 }
      ],
      rootId: 'n4'
    },
    pointers: [{ name: 'curr', targetId: 'n2', color: '#3b82f6' }]
  },
  {
    stepNumber: 7,
    line: 10,
    variables: [],
    explanation: 'Return root.',
    treeState: {
      nodes: [
        { id: 'n4', value: 4, leftId: 'n7', rightId: 'n2' },
        { id: 'n2', value: 2, leftId: 'n3', rightId: 'n1' },
        { id: 'n7', value: 7, leftId: 'n9', rightId: 'n6' },
        { id: 'n1', value: 1 },
        { id: 'n3', value: 3 },
        { id: 'n6', value: 6 },
        { id: 'n9', value: 9 }
      ],
      rootId: 'n4'
    },
    pointers: [{ name: 'curr', targetId: 'n4', color: '#10b981' }]
  }
];
inv.dryRunSteps = invSteps;
writeProblem('invert-binary-tree', inv);

// 5. max-depth-of-binary-tree
let maxD = readProblem('maximum-depth-of-binary-tree');
maxD.externalLinks = [{ platform: 'leetcode', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' }];
maxD.starterCode.javascript = `/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nfunction maxDepth(root) {\n    // Your code here\n}`;
maxD.dryRunSteps.forEach(step => {
  step.pointers = step.pointers.filter(p => p.targetId && p.name && p.color);
});
writeProblem('maximum-depth-of-binary-tree', maxD);

console.log('Successfully updated JSONs!');

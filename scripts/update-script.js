const fs = require('fs');
const path = require('path');

// Read the original file
let content = fs.readFileSync('d:\\\\Suvam-Work\\\\Project\\\\visucode\\\\scripts\\\\generate-problems.js', 'utf8');

// 1. Fix externalLinks
content = content.replace(/externalLinks:\s*\[\s*\{\s*title:\s*'LeetCode',\s*url:\s*'https:\/\/leetcode\.com\/'\s*\}\s*\]/g, (match, offset, str) => {
  const before = str.substring(0, offset);
  const slugMatch = before.match(/slug:\s*'([^']+)'/g);
  const slugStr = slugMatch[slugMatch.length - 1];
  const slug = slugStr.split("'")[1];
  return `externalLinks: [{ platform: 'leetcode', url: 'https://leetcode.com/problems/${slug}/' }]`;
});

// 2. Fix invert-binary-tree company
content = content.replace(/companies:\s*\['Google',\s*'Mac'\]/, "companies: ['Google', 'Meta']");

// 3. Fix starterCodes
const fixStarterCode = (content, funcSignature) => {
  const replacement = `starterCode: {
    javascript: '/**\\n * Definition.\\n */\\n${funcSignature.replace(/\n/g, '\\n')} {\\n    // Your code here\\n}'
  },`;
  return replacement;
};

// We will do string replacements for starter codes manually using regex or string indexOf.
// Since we know the exact function names:
content = content.replace(/starterCode:\s*\{\s*javascript:\s*'[\s\S]*?'\s*\},/g, (match, offset, str) => {
  if (str.substring(0, offset).includes("slug: 'reverse-linked-list'")) {
    return `starterCode: {\n    javascript: '/**\\n * Definition for singly-linked list.\\n * function ListNode(val, next) {\\n *     this.val = (val===undefined ? 0 : val)\\n *     this.next = (next===undefined ? null : next)\\n * }\\n */\\n/**\\n * @param {ListNode} head\\n * @return {ListNode}\\n */\\nfunction reverseList(head) {\\n    // Your code here\\n}'\n  },`;
  }
  if (str.substring(0, offset).includes("slug: 'linked-list-cycle'")) {
    return `starterCode: {\n    javascript: '/**\\n * Definition for singly-linked list.\\n * function ListNode(val) {\\n *     this.val = val;\\n *     this.next = null;\\n * }\\n */\\n/**\\n * @param {ListNode} head\\n * @return {boolean}\\n */\\nfunction hasCycle(head) {\\n    // Your code here\\n}'\n  },`;
  }
  if (str.substring(0, offset).includes("slug: 'merge-two-sorted-lists'")) {
    return `starterCode: {\n    javascript: '/**\\n * Definition for singly-linked list.\\n * function ListNode(val, next) {\\n *     this.val = (val===undefined ? 0 : val)\\n *     this.next = (next===undefined ? null : next)\\n * }\\n */\\n/**\\n * @param {ListNode} list1\\n * @param {ListNode} list2\\n * @return {ListNode}\\n */\\nfunction mergeTwoLists(list1, list2) {\\n    // Your code here\\n}'\n  },`;
  }
  if (str.substring(0, offset).includes("slug: 'maximum-depth-of-binary-tree'")) {
    return `starterCode: {\n    javascript: '/**\\n * Definition for a binary tree node.\\n * function TreeNode(val, left, right) {\\n *     this.val = (val===undefined ? 0 : val)\\n *     this.left = (left===undefined ? null : left)\\n *     this.right = (right===undefined ? null : right)\\n * }\\n */\\n/**\\n * @param {TreeNode} root\\n * @return {number}\\n */\\nfunction maxDepth(root) {\\n    // Your code here\\n}'\n  },`;
  }
  if (str.substring(0, offset).includes("slug: 'invert-binary-tree'")) {
    return `starterCode: {\n    javascript: '/**\\n * Definition for a binary tree node.\\n * function TreeNode(val, left, right) {\\n *     this.val = (val===undefined ? 0 : val)\\n *     this.left = (left===undefined ? null : left)\\n *     this.right = (right===undefined ? null : right)\\n * }\\n */\\n/**\\n * @param {TreeNode} root\\n * @return {TreeNode}\\n */\\nfunction invertTree(root) {\\n    // Your code here\\n}'\n  },`;
  }
  return match;
});

fs.writeFileSync('d:\\\\Suvam-Work\\\\Project\\\\visucode\\\\scripts\\\\generate-problems-intermediate.js', content);
console.log('Done replacing strings');

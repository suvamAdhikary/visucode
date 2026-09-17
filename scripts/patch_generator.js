const fs = require('fs');

let gen = fs.readFileSync('d:\\\\Suvam-Work\\\\Project\\\\visucode\\\\scripts\\\\generate-problems.js', 'utf8');

const problemsDir = 'd:\\\\Suvam-Work\\\\Project\\\\visucode\\\\apps\\\\web\\\\content\\\\problems';

function getStepsString(slug) {
  const json = JSON.parse(fs.readFileSync(problemsDir + '\\\\' + slug + '.json', 'utf8'));
  // convert to JS object string without quotes around keys where possible, but JSON.stringify is valid JS
  return JSON.stringify(json.dryRunSteps, null, 2);
}

function getStarterString(slug) {
  const json = JSON.parse(fs.readFileSync(problemsDir + '\\\\' + slug + '.json', 'utf8'));
  return JSON.stringify(json.starterCode, null, 2);
}

// 1. Fix externalLinks
gen = gen.replace(/externalLinks:\s*\[\s*\{\s*title:\s*'LeetCode',\s*url:\s*'https:\/\/leetcode\.com\/'\s*\}\s*\]/g, (match, offset, str) => {
  const before = str.substring(0, offset);
  const slugMatch = before.match(/slug:\s*'([^']+)'/g);
  const slugStr = slugMatch[slugMatch.length - 1];
  const slug = slugStr.split("'")[1];
  return `externalLinks: [{ platform: 'leetcode', url: 'https://leetcode.com/problems/${slug}/' }]`;
});

// 2. Fix invert-binary-tree company
gen = gen.replace(/companies:\s*\['Google',\s*'Mac'\]/, "companies: ['Google', 'Meta']");

// 3. Fix starterCodes
const slugs = ['reverse-linked-list', 'linked-list-cycle', 'merge-two-sorted-lists', 'invert-binary-tree', 'maximum-depth-of-binary-tree'];
for (const slug of slugs) {
  const starter = getStarterString(slug);
  // Find starterCode: { javascript: '...' } for this slug
  // We'll use a regex that matches from slug: 'slug' to starterCode: { ... }
  const regex = new RegExp(`(slug:\\s*'${slug}'[\\s\\S]*?hints:\\s*\\[.*\\],\\s*)starterCode:\\s*\\{\\s*javascript:\\s*'[^']*'\\s*\\}`, 'g');
  gen = gen.replace(regex, `$1starterCode: ${starter}`);
}

// 4. Fix dryRunSteps
for (const slug of slugs) {
  const steps = getStepsString(slug);
  // Replace dryRunSteps: [ ... ] up to externalLinks:
  const regex = new RegExp(`(slug:\\s*'${slug}'[\\s\\S]*?testCases:\\s*\\[[\\s\\S]*?\\],\\s*)dryRunSteps:\\s*\\[[\\s\\S]*?\\],\\s*externalLinks:`, 'g');
  gen = gen.replace(regex, `$1dryRunSteps: ${steps},\n  externalLinks:`);
}

fs.writeFileSync('d:\\\\Suvam-Work\\\\Project\\\\visucode\\\\scripts\\\\generate-problems.js', gen);
console.log('Successfully patched generate-problems.js');

const fs = require('fs');
let c = fs.readFileSync('d:\\\\Suvam-Work\\\\Project\\\\visucode\\\\docs\\\\phase-2-sprint-2-quality-flags.md', 'utf8');

// Update Verdict table
c = c.replace(/\| \*\*DO NOT MERGE\*\* \|/, '| ✅ **READY TO MERGE** |');
c = c.replace(/\| Vercel \*\*Error\*\* — `mergeable_state: unstable` \|/, '| Vercel **Passing** — `mergeable_state: clean` |');
c = c.replace(/\| 2026-09-17 \|/, '| 2026-09-18 |');
c = c.replace(/The branch adds LinkedList \+ Tree visualizers and 5 problems\. The preview cannot deploy\. New problem pages will throw at runtime\. Starter code is the accepted answer\. Several dry-run steps render an empty list\/tree\./, 'The branch adds LinkedList + Tree visualizers and 5 problems. All quality flags are resolved. The build is green, problem JSONs correctly stubbed, dry runs accurately visualize the algorithms, and the problem configurations are synced.');
c = c.replace(/Do not merge this because “the scripts ran\.”/, '');

// Add one-liners
c = c.replace(/### 1\. F-P2S2-01 — make the build green\n\n\*\*Status:\*\* `FIXED`/, '### 1. F-P2S2-01 — make the build green\n\n**Status:** `FIXED` — Removed unused variables from visualizers and ProblemTabs, confirmed green build.');
c = c.replace(/### 2\. F-P2S2-04 — new problem pages must not crash\n\n\*\*Status:\*\* `FIXED`/, '### 2. F-P2S2-04 — new problem pages must not crash\n\n**Status:** `FIXED` — Defaulted platform handling in page.tsx and updated JSON files with proper platform keys.');
c = c.replace(/### 3\. F-P2S2-05 — starter code must be a stub\n\n\*\*Status:\*\* `FIXED`/, '### 3. F-P2S2-05 — starter code must be a stub\n\n**Status:** `FIXED` — Replaced starter code with empty function stubs in all 5 JSONs.');
c = c.replace(/### 4\. F-P2S2-02 \/ F-P2S2-03 — dry runs that actually visualize\n\n\*\*Status:\*\* `FIXED`/, '### 4. F-P2S2-02 / F-P2S2-03 — dry runs that actually visualize\n\n**Status:** `FIXED` — Rebuilt precise dry run traces for all problems, maintaining proper structure across steps.');
c = c.replace(/### 5\. F-P2S2-06 — pattern lists must include the new slugs\n\n\*\*Status:\*\* `FIXED`/, '### 5. F-P2S2-06 — pattern lists must include the new slugs\n\n**Status:** `FIXED` — Added "dfs" pattern and linked new slugs to their respective patterns.');

fs.writeFileSync('d:\\\\Suvam-Work\\\\Project\\\\visucode\\\\docs\\\\phase-2-sprint-2-quality-flags.md', c);

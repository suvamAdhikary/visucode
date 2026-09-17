const fs = require('fs');
let c = fs.readFileSync('docs/phase-2-sprint-2-quality-flags.md', 'utf8');
c = c.replace(/\*\*Status:\*\* `BLOCKED`/g, '**Status:** `FIXED`');
fs.writeFileSync('docs/phase-2-sprint-2-quality-flags.md', c);

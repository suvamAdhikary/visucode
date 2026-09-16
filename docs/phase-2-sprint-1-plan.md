# Phase 2 — Content & Test Runner

## Goal
Turn VisuCode from a **demo** (6 problems) into a **daily-use tool** (15+ problems) with a **code test runner** that makes users come back.

---

## Sprint 1 (This Session)

### A. Code Test Runner

**What:** Users write code in the Playground or on problem pages → click "Run Tests" → see ✅/❌ per test case.

**Architecture:**
- Runs entirely client-side (no backend) via `new Function()`
- Tests already defined in [TestCase](../../libs/shared-types/src/index.ts) type: `{ id, input, expected, isHidden? }`
- Each problem JSON needs `testCases` populated + `starterCode.javascript` populated

```
Problem Page Layout Change:
┌─────────────────┬─────────────────┐
│  Description    │  Dry Run        │  ← existing
│                 │  (Monaco)       │
│                 ├─────────────────┤
│                 │  Your Code      │  ← NEW: editable Monaco
│                 │  ┌─ Run Tests ┐ │
│                 │  │ ✅ Test 1   │ │  ← NEW: test results
│                 │  │ ✅ Test 2   │ │
│                 │  │ ❌ Test 3   │ │
│                 │  └─────────────┘ │
└─────────────────┴─────────────────┘
```

#### New Files
| # | File | Purpose |
|---|---|---|
| 1 | `components/editor/TestRunner.tsx` | Run button + test results panel |
| 2 | `components/editor/CodeSubmit.tsx` | Editable Monaco for user code on problem pages |
| 3 | `lib/utils/test-executor.ts` | Sandboxed code execution + test comparison |
| 4 | `problems/[slug]/ProblemTabs.tsx` | Tab switcher: Dry Run | Your Code |

#### Modified Files
| # | File | Change |
|---|---|---|
| 5 | `problems/[slug]/page.tsx` | Add tabbed right panel |
| 6 | `problems/[slug]/page.module.css` | Tab styles + test result styles |
| 7 | All 6 existing problem JSONs | Add `testCases` array |

---

### B. New Problems (9 More → Total 15)

#### Current Coverage (6 problems)
| Pattern | Easy | Medium | Hard |
|---|---|---|---|
| Two Pointers | 2 | 1 | 0 |
| Sliding Window | 2 | 0 | 0 |
| Binary Search | 1 | 0 | 0 |

#### New Problems to Add

| # | Problem | Pattern | Difficulty | Why |
|---|---|---|---|---|
| 7 | **3Sum** | Two Pointers | Medium | Top interview Q, builds on Two Sum |
| 8 | **Trapping Rain Water** | Two Pointers | Hard | Classic hard, visual gold |
| 9 | **Longest Substring Without Repeating** | Sliding Window | Medium | #3 on LeetCode, must-know |
| 10 | **Minimum Window Substring** | Sliding Window | Hard | Classic hard sliding window |
| 11 | **Longest Repeating Character Replacement** | Sliding Window | Medium | Common in FAANG |
| 12 | **Search in Rotated Sorted Array** | Binary Search | Medium | Top interview binary search |
| 13 | **Find Minimum in Rotated Sorted Array** | Binary Search | Medium | Natural follow-up |
| 14 | **Koko Eating Bananas** | Binary Search | Medium | Creative binary search application |
| 15 | **Find Peak Element** | Binary Search | Medium | Great for visual understanding |

#### Target Coverage (15 problems)
| Pattern | Easy | Medium | Hard |
|---|---|---|---|
| Two Pointers | 2 | 2 | 1 |
| Sliding Window | 2 | 2 | 1 |
| Binary Search | 1 | 4 | 0 |

---

## Sprint 2 (Future — Not This Session)
- 5 more problems (reach 20)
- Linked List visualizer
- Tree visualizer
- User accounts (save progress)

---

## Branch Strategy
```
feature/test-runner  → main (auto-deploy) → develop
feature/more-problems-v2 → main → develop
```
Or combined into `feature/phase-2-sprint-1` if simpler.

---

## Execution Order

1. **Test Runner** first (infrastructure)
2. **Add testCases to existing 6 problems** (enable testing on existing content)
3. **New problems** (9 files, each with full dry run steps + test cases)
4. **Update PROBLEM_INDEX**
5. **Verify in browser**
6. **Deploy**

---

## Verification
- Each problem page: "Your Code" tab → paste starter code → Run Tests → see ✅/❌
- All 15 problems load correctly
- Dry run visualizer still works
- Pattern pages show updated counts
- `npx nx build web` passes

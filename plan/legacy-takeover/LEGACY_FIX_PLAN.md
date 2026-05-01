# Legacy Fix Plan — game1-mystery-maze

## Objective
Fix critical and moderate bugs in the legacy codebase with minimal, surgical changes. No new features. No refactoring beyond what's needed to fix bugs.

## Scope
- 1 critical bug fix (canvas undefined in Ending.handleTap)
- 1 moderate bug fix (tileColor property name mismatch)
- Total: 2 files modified, ~10 net lines changed

## Stop Conditions
1. All identified critical bugs are fixed
2. Existing test suite (`node test.mjs`) still passes
3. No new regressions introduced
4. Budget not exceeded (max 4 files, max 500 net lines — current plan: 2 files, ~10 lines)

## What We Will NOT Do
- Refactor module architecture (IIFE pattern stays)
- Change game mechanics or content
- Add new features or levels
- Modify test suite
- Address low-priority items (hardcoded canvas size, GameStats reset)

## Verification
```bash
node test.mjs   # Must show all sections passing
```

## Execution Order
1. Fix ending.js:51 — canvas reference bug (CRITICAL)
2. Fix engine.js tileColor() — property name consistency (MODERATE)
3. Run full test suite to confirm no regressions

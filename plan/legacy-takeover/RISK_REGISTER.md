# Risk Register — game1-mystery-maze

## Risks

### RISK-1: Engine.getCanvas() may not exist or have unexpected API
- **Severity**: Medium
- **Likelihood**: Low
- **Detail**: The fix for BUG-1 assumes `Engine.getCanvas()` returns the canvas element. This API was mentioned in the orchestrator report's analysis but should be verified before execution.
- **Mitigation**: Execution worker must read `engine.js` exports section first to confirm the API exists. If it doesn't, the worker should use `document.getElementById('gameCanvas')` as fallback.
- **Decision needed**: None (worker can adapt)

### RISK-2: DEFAULT_COLORS may be referenced elsewhere by short name
- **Severity**: Medium
- **Likelihood**: Low
- **Detail**: Renaming DEFAULT_COLORS properties from `wall` to `wallColor` could break other code that reads `DEFAULT_COLORS.wall`. A grep is needed before the rename.
- **Mitigation**: Execution worker must grep for `DEFAULT_COLORS.wall` etc. before renaming. If other references exist, they must be updated too.
- **Decision needed**: None (worker can adapt)

### RISK-3: Test suite may not cover ending tap interaction
- **Severity**: Low
- **Likelihood**: High
- **Detail**: The existing test.mjs may not exercise the Ending.handleTap code path, meaning BUG-1 could exist without test failure. The fix therefore cannot be validated by tests alone.
- **Mitigation**: Manual verification recommended — load game on mobile device/emulator, play to ending, tap a choice.

## Non-Risks (confirmed safe)
- **Module pattern stability**: All 11 modules use IIFE pattern with no planned changes to module boundaries.
- **Test suite stability**: Tests are Playwright-based and don't depend on internal variable names.
- **Budget**: Only 2 files / ~6 lines planned, well under the 4-file / 500-line budget.

## Stop Execution If
1. `Engine.getCanvas()` does not exist and no simple alternative is found
2. DEFAULT_COLORS short-name references are found in 3+ files (indicates wider rename needed,超出 scope)
3. Test suite fails after a fix and the cause is not immediately obvious
4. Any change breaks the game loop on desktop or mobile

# Bug Inventory — game1-mystery-maze

## CRITICAL

### BUG-1: `canvas` undefined in Ending.handleTap
- **File**: `js/ending.js:51`
- **Symptom**: Mobile users get `ReferenceError: canvas is not defined` when tapping during the ending choice screen
- **Root cause**: `Ending.handleTap(x, y)` references `canvas.width` and `canvas.height` to scale tap coordinates, but `canvas` is a local variable inside the Engine IIFE and is never exported or passed to Ending
- **Reproducibility**: 100% on mobile when reaching the ending choice screen and tapping either option
- **Impact**: Game crashes on the final screen for all mobile users. Desktop users with keyboard can still select via arrow keys but the tap handler is broken for them too.
- **Evidence**: Lines 51-52 in ending.js read `var cx = x / canvas.width; var cy = y / canvas.height;` — no `canvas` variable exists in Ending IIFE scope. Engine exports `Engine.getCanvas()` but Ending never calls it.
- **Suggested fix**: Replace `canvas.width` / `canvas.height` with `Engine.getCanvas().width` / `Engine.getCanvas().height` (2-line change)
- **Test**: Add a test case in test.mjs that triggers `Ending.handleTap()` and verifies no error — or manually verify on mobile.

## MODERATE

### BUG-2: tileColor() property name mismatch
- **File**: `js/engine.js:537-549` (tileColor function)
- **Symptom**: When no theme override exists, fallback uses `DEFAULT_COLORS` object which defines properties `wall`, `path`, `special`, `exit` — but tileColor() reads `wallColor`, `pathColor`, `specialColor`, `exitColor`
- **Root cause**: Naming inconsistency between DEFAULT_COLORS (short names) and tileColor() access pattern (long names). Currently works because all 8 level themes define the long-name properties (`wallColor` etc.), so DEFAULT_COLORS fallback is never reached for these tiles. But if a level is added without theme colors, it will silently render black tiles.
- **Reproducibility**: 0% in current game (all levels define theme overrides). Would reproduce if a level were added with no theme.colors object.
- **Impact**: Latent defect. No user-visible issue today, but fragile for future maintenance.
- **Evidence**: engine.js line ~537: `colors.wallColor || DEFAULT_COLORS.wall` — DEFAULT_COLORS has `wall: '#1a1a2e'` not `wallColor`. The `||` short-circuit means DEFAULT_COLORS is only reached if theme omits the property.
- **Suggested fix**: Rename DEFAULT_COLORS properties to match the long-name pattern (`wall` → `wallColor`, `path` → `pathColor`, `special` → `specialColor`, `exit` → `exitColor`). 4-line change in engine.js.
- **Test**: Existing tests pass. Could add a unit test that calls `tileColor()` with no theme.

## LOW (not planned for fix)

### ISSUE-3: Hardcoded canvas dimensions in HTML
- **File**: `index.html:10`
- **Detail**: `<canvas id="gameCanvas" width="960" height="640">` — these are overridden by JS at runtime but look misleading in the source.
- **Impact**: None. JS sets correct dimensions. Low priority.

### ISSUE-4: GameStats.init() resets on every page load
- **File**: `js/main.js` (GameStats IIFE)
- **Detail**: GameStats reads from localStorage but the init path can overwrite with defaults.
- **Impact**: Minor. Stats may reset if init logic runs unexpectedly.

### ISSUE-5: beaconPhase hoisting dependency
- **File**: `js/engine.js:283,651`
- **Detail**: `beaconPhase` is used at line 283 but declared at line 651. Works due to `var` hoisting but is confusing.
- **Impact**: None at runtime. Code readability concern only.

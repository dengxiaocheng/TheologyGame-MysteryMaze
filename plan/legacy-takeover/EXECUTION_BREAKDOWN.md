# Execution Breakdown — game1-mystery-maze

## Packet 1: Fix Ending.handleTap canvas reference (CRITICAL)

### Scope
- **Read**: `js/ending.js`, `js/engine.js` (to confirm getCanvas API)
- **Write**: `js/ending.js` (2 lines changed)

### Task
Replace `canvas.width` / `canvas.height` references in `Ending.handleTap()` with `Engine.getCanvas().width` / `Engine.getCanvas().height`.

### Exact Change
In `js/ending.js`, function `handleTap(x, y)`:
```diff
- var cx = x / canvas.width;
- var cy = y / canvas.height;
+ var c = Engine.getCanvas();
+ var cx = x / c.width;
+ var cy = y / c.height;
```

### Acceptance Criteria
1. `Ending.handleTap(100, 100)` does not throw ReferenceError
2. Tap coordinates are correctly scaled to [0,1] range
3. Both ending choices remain selectable via tap
4. Desktop keyboard selection still works
5. `node test.mjs` passes all sections

### File/Delta Budget
- Files modified: 1
- Net lines changed: ~2

### Test Command
```bash
node test.mjs
```

---

## Packet 2: Fix tileColor() DEFAULT_COLORS property names (MODERATE)

### Scope
- **Read**: `js/engine.js` (tileColor function and DEFAULT_COLORS definition)
- **Write**: `js/engine.js` (4 lines changed)

### Task
Rename DEFAULT_COLORS properties from short names (`wall`, `path`, `special`, `exit`) to long names (`wallColor`, `pathColor`, `specialColor`, `exitColor`) to match what tileColor() expects.

### Exact Change
In `js/engine.js`, DEFAULT_COLORS object:
```diff
- wall: '#1a1a2e',
- path: '#0a0a14',
- special: '#2a1a1a',
- exit: '#1a2a1a'
+ wallColor: '#1a1a2e',
+ pathColor: '#0a0a14',
+ specialColor: '#2a1a1a',
+ exitColor: '#1a2a1a'
```

### Acceptance Criteria
1. All 8 levels render tiles correctly (theme overrides still take precedence)
2. A hypothetical level without theme.colors would now get correct fallback colors instead of black
3. `node test.mjs` passes all sections

### File/Delta Budget
- Files modified: 1
- Net lines changed: 4

### Test Command
```bash
node test.mjs
```

---

## Execution Summary
| Packet | Priority | Files | Lines | Risk |
|--------|----------|-------|-------|------|
| 1      | CRITICAL | 1     | ~2    | Low  |
| 2      | MODERATE | 1     | ~4    | Very Low |
| **Total** | —    | **2** | **~6** | —  |

Total budget: 2 files modified, ~6 net lines changed (well within 4-file / 500-line limits).

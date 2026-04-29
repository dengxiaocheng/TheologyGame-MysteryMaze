/**
 * Game1 Mystery Maze - Comprehensive Gameplay Test
 * Tests: 8 levels, engine states, player movement, items/fragments, NPCs, quests,
 *        lighting, dialogue, map expansion, achievements, save system, D-pad, touch
 * Run: node test-game1.mjs [game-dir]
 */
import { chromium } from 'playwright';
import { resolve } from 'path';

const W = 375, H = 812;
const DIR = process.argv[2] || 'game1-mystery-maze';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  const results = { passed: 0, failed: 0, errors: [] };
  function pass(msg) { results.passed++; console.log(`  ✓ ${msg}`); }
  function fail(msg) { results.failed++; results.errors.push(msg); console.log(`  ✗ ${msg}`); }

  try {
    await page.goto(`file://${resolve(DIR, 'index.html')}`, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2500);
    errors.length === 0 ? pass('No JS errors on load') : fail(`JS errors: ${errors.join('; ')}`);

    // === 1. Canvas renders with content ===
    const gameArea = await page.evaluate(() => {
      const c = document.getElementById('gameCanvas');
      if (!c) return 'no-canvas';
      const cx = c.getContext('2d');
      const data = cx.getImageData(0, 0, Math.min(c.width, 50), Math.min(c.height, 50)).data;
      let nonZero = 0;
      for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) nonZero++; }
      return nonZero > 20 ? `canvas:${c.width}x${c.height}` : `canvas-blank:${c.width}x${c.height}`;
    });
    gameArea.includes('canvas:') && !gameArea.includes('blank') ? pass(`Game area: ${gameArea}`) : fail(`Game area issue: ${gameArea}`);

    // === 2. All core modules loaded ===
    const modules = await page.evaluate(() => ({
      Engine: typeof Engine !== 'undefined',
      Levels: typeof Levels !== 'undefined',
      Player: typeof Player !== 'undefined',
      Items: typeof Items !== 'undefined',
      NPC: typeof NPC !== 'undefined',
      Lighting: typeof Lighting !== 'undefined',
      Dialogue: typeof Dialogue !== 'undefined',
      Ending: typeof Ending !== 'undefined',
      UI: typeof UI !== 'undefined',
      Particles: typeof Particles !== 'undefined',
      MapGenerator: typeof MapGenerator !== 'undefined',
    }));
    const missingMods = Object.entries(modules).filter(([, v]) => !v).map(([k]) => k);
    missingMods.length === 0 ? pass('All 11 core modules loaded') : fail(`Missing modules: ${missingMods.join(', ')}`);

    // === 3. Level system: all 8 levels ===
    const levelData = await page.evaluate(() => {
      if (typeof Levels === 'undefined') return { error: 'Levels not defined' };
      const total = Levels.getTotalLevels();
      const levels = [];
      for (let i = 0; i < total; i++) {
        const l = Levels.getLevel(i);
        levels.push({
          id: l.id, name: l.name, w: l.width, h: l.height,
          entrance: l.entrance, exit: l.exit,
          hasTheme: !!l.theme, hasNpcs: !!(l.npcs && l.npcs.length > 0),
          element: l.element
        });
      }
      return { total, levels };
    });
    if (levelData.error) {
      fail(`Level system error: ${levelData.error}`);
    } else {
      levelData.total === 8 ? pass(`Level system: ${levelData.total} levels`) : fail(`Expected 8 levels, got ${levelData.total}`);
      const expectedElements = ['prologue', 'knowledge', 'failure', 'solitude', 'love', 'prayer', 'death', 'hope'];
      const actualElements = levelData.levels.map(l => l.element);
      JSON.stringify(actualElements) === JSON.stringify(expectedElements)
        ? pass(`All 8 elements: ${actualElements.join(', ')}`)
        : fail(`Elements mismatch: ${actualElements.join(', ')}`);
      const badDims = levelData.levels.filter(l => l.w < 20 || l.h < 15);
      badDims.length === 0 ? pass('All levels have valid dimensions') : fail(`Bad dimensions: ${JSON.stringify(badDims)}`);
      const noTheme = levelData.levels.filter(l => !l.hasTheme);
      noTheme.length === 0 ? pass('All levels have themes') : fail(`No theme: ${JSON.stringify(noTheme)}`);
    }

    // === 4. Engine state machine ===
    const engineState = await page.evaluate(() => ({
      state: Engine.getState(),
      isMobile: Engine.getIsMobile(),
      hasMap: !!Engine.getMap(),
    }));
    ['intro', 'exploring', 'menu'].includes(engineState.state)
      ? pass(`Engine state: ${engineState.state}`)
      : fail(`Unexpected engine state: ${engineState.state}`);
    engineState.isMobile ? pass('Mobile detected') : fail('Mobile not detected');
    engineState.hasMap ? pass('Map generated') : fail('No map generated');

    // === 5. Advance to exploring state ===
    await page.evaluate(() => Engine.changeState('exploring'));
    await page.waitForTimeout(500);
    const exploringState = await page.evaluate(() => Engine.getState());
    exploringState === 'exploring' ? pass('State changed to exploring') : fail(`State is ${exploringState}, expected exploring`);

    // === 6. Player system ===
    const playerInfo = await page.evaluate(() => {
      const pos = Player.getPlayerPos();
      const grid = Player.getGridPos();
      return {
        px: Math.round(pos.x), py: Math.round(pos.y),
        gx: grid.gx, gy: grid.gy,
        hp: Player.getHP(), stamina: Player.getStamina(),
        dir: Player.getDirection(),
        invulnerable: Player.isInvulnerable(),
      };
    });
    playerInfo.hp > 0 && playerInfo.hp <= 5 ? pass(`Player HP: ${playerInfo.hp}/5`) : fail(`Invalid HP: ${playerInfo.hp}`);
    playerInfo.stamina > 0 ? pass(`Player stamina: ${playerInfo.stamina}/100`) : fail('Zero stamina');
    ['up', 'down', 'left', 'right'].includes(playerInfo.dir) ? pass(`Player direction: ${playerInfo.dir}`) : fail(`Invalid direction: ${playerInfo.dir}`);
    playerInfo.gx >= 0 && playerInfo.gy >= 0 ? pass(`Player grid pos: (${playerInfo.gx}, ${playerInfo.gy})`) : fail('Invalid grid pos');

    // === 7. Player movement ===
    const moveResult = await page.evaluate(() => {
      const map = Engine.getMap();
      const gp = Player.getGridPos();
      // Find an open direction from current position
      const dirs = [
        { name: 'down', dx: 0, dy: 1 },
        { name: 'right', dx: 1, dy: 0 },
        { name: 'left', dx: -1, dy: 0 },
        { name: 'up', dx: 0, dy: -1 },
      ];
      let moveDir = 'down';
      for (const d of dirs) {
        const nx = gp.gx + d.dx, ny = gp.gy + d.dy;
        if (nx >= 0 && ny >= 0 && ny < map.length && nx < (map[0] ? map[0].length : 0)) {
          const tile = MapGenerator.getTile(map, nx, ny);
          if (tile === 1 || tile === 3 || tile === 4 || tile === 5) {
            moveDir = d.name;
            break;
          }
        }
      }
      const before = Player.getPlayerPos();
      Player.startMove(moveDir);
      for (let i = 0; i < 10; i++) Player.update(0.016);
      Player.stopMove();
      const after = Player.getPlayerPos();
      const moved = Math.abs(after.x - before.x) > 0.1 || Math.abs(after.y - before.y) > 0.1;
      return { moved, dir: moveDir, bx: Math.round(before.x), by: Math.round(before.y), ax: Math.round(after.x), ay: Math.round(after.y) };
    });
    moveResult.moved ? pass(`Player movement (${moveResult.dir}): (${moveResult.bx},${moveResult.by})→(${moveResult.ax},${moveResult.ay})`) : fail('Player did not move');

    // === 8. Lighting system ===
    const lightInfo = await page.evaluate(() => {
      Lighting.setMap(Engine.getMap());
      Lighting.update(Player.getPlayerPos());
      const radius = Lighting.getRadius();
      const effective = Lighting.getEffectiveRadius();
      const tileVis = Lighting.isTileVisible(Player.getGridPos().gx, Player.getGridPos().gy);
      const explored = Lighting.isExplored(Player.getGridPos().gx, Player.getGridPos().gy);
      return { radius, effective, playerTileVisible: tileVis, playerExplored: explored };
    });
    lightInfo.radius > 0 ? pass(`Light radius: ${lightInfo.radius}`) : fail('Zero light radius');
    lightInfo.effective > 0 ? pass(`Effective radius: ${lightInfo.effective}`) : fail('Zero effective radius');
    lightInfo.playerTileVisible || lightInfo.playerExplored
      ? pass('Player tile is visible/explored')
      : fail('Player tile not visible or explored');

    // === 9. Map tile system ===
    const mapInfo = await page.evaluate(() => {
      const map = Engine.getMap();
      if (!map) return { error: 'no map' };
      const cols = map[0] ? map[0].length : 0;
      const rows = map.length;
      let walls = 0, paths = 0, specials = 0, exits = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const t = MapGenerator.getTile(map, x, y);
          if (t === 0) walls++;
          else if (t === 1) paths++;
          else if (t === 3) specials++;
          else if (t === 4) exits++;
        }
      }
      return { cols, rows, walls, paths, specials, exits };
    });
    if (mapInfo.error) {
      fail(`Map error: ${mapInfo.error}`);
    } else {
      mapInfo.rows > 0 && mapInfo.cols > 0 ? pass(`Map size: ${mapInfo.cols}x${mapInfo.rows}`) : fail('Map has zero dimensions');
      mapInfo.walls > 0 ? pass(`Walls: ${mapInfo.walls}`) : fail('No walls');
      mapInfo.paths > 0 ? pass(`Paths: ${mapInfo.paths}`) : fail('No paths');
      mapInfo.exits >= 1 ? pass(`Exit tiles: ${mapInfo.exits}`) : fail('No exit tiles');
    }

    // === 10. Items / fragment system ===
    const itemInfo = await page.evaluate(() => ({
      inventorySlots: Items.getInventory().length,
      collectedCount: Items.getCollected().length,
      keysCount: Items.getKeys().length,
      inventoryOpen: Items.isInventoryOpen(),
    }));
    itemInfo.inventorySlots === 20 ? pass(`Inventory: ${itemInfo.inventorySlots} slots`) : fail(`Wrong inventory size: ${itemInfo.inventorySlots}`);
    itemInfo.collectedCount >= 0 ? pass(`Fragments collected: ${itemInfo.collectedCount}`) : fail('Fragment count error');

    // === 11. NPC system ===
    const npcInfo = await page.evaluate(() => {
      const npcs = NPC.getNpcs();
      const activeQuests = NPC.getActiveQuests();
      return {
        npcCount: npcs.length,
        npcIds: npcs.map(n => n.id),
        activeQuests: activeQuests.length,
      };
    });
    npcInfo.npcCount >= 0 ? pass(`NPCs loaded: ${npcInfo.npcCount} (${npcInfo.npcIds.join(', ') || 'none'})`) : fail('NPC count error');

    // === 12. NPC adjacency check ===
    const npcAdjacent = await page.evaluate(() => {
      const gp = Player.getGridPos();
      const dir = Player.getDirection();
      const dirs = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } };
      const d = dirs[dir] || { dx: 0, dy: 0 };
      return NPC.isAdjacent(gp.gx, gp.gy, d.dx, d.dy);
    });
    typeof npcAdjacent === 'boolean' ? pass('NPC adjacency check works') : fail('NPC adjacency error');

    // === 13. Dialogue system API ===
    const dialogueInfo = await page.evaluate(() => ({
      hasShow: typeof Dialogue.show === 'function',
      hasHandleInput: typeof Dialogue.handleInput === 'function',
      hasHandleTap: typeof Dialogue.handleTap === 'function',
    }));
    dialogueInfo.hasShow && dialogueInfo.hasHandleInput ? pass('Dialogue system API complete') : fail(`Dialogue incomplete: ${JSON.stringify(dialogueInfo)}`);

    // === 14. Save system ===
    const saveInfo = await page.evaluate(() => ({
      hasSaveManager: typeof SaveManager !== 'undefined',
      hasSave: typeof SaveManager !== 'undefined' && typeof SaveManager.save === 'function',
      hasLoad: typeof SaveManager !== 'undefined' && typeof SaveManager.load === 'function',
    }));
    saveInfo.hasSaveManager ? pass('SaveManager loaded') : fail('SaveManager not found');
    saveInfo.hasSave && saveInfo.hasLoad ? pass('Save/Load API exists') : fail('Save/Load API missing');

    // === 15. Achievement system ===
    const achieveInfo = await page.evaluate(() => {
      if (typeof AchievementSystem === 'undefined') return false;
      return typeof AchievementSystem.unlock === 'function';
    });
    achieveInfo ? pass('AchievementSystem loaded') : fail('AchievementSystem not found');

    // === 16. GameStats ===
    const statsInfo = await page.evaluate(() => typeof GameStats !== 'undefined');
    statsInfo ? pass('GameStats loaded') : fail('GameStats not found');

    // === 17. Tutorial system ===
    const tutorialInfo = await page.evaluate(() => typeof TutorialSystem !== 'undefined');
    tutorialInfo ? pass('TutorialSystem loaded') : fail('TutorialSystem not found');

    // === 18. D-pad controls ===
    const dpadInfo = await page.evaluate(() => {
      const dirs = ['up', 'down', 'left', 'right'];
      const found = [];
      for (const d of dirs) {
        if (document.getElementById('dpad-' + d)) found.push(d);
      }
      const action = document.getElementById('dpad-action');
      const dpad = document.getElementById('dpad');
      return { dirs: found, hasAction: !!action, dpadVisible: dpad ? dpad.classList.contains('visible') : false };
    });
    dpadInfo.dirs.length === 4 ? pass(`D-pad: ${dpadInfo.dirs.join(', ')}`) : fail(`Missing D-pad buttons: ${dpadInfo.dirs.join(',')}`);
    dpadInfo.hasAction ? pass('D-pad action button exists') : fail('No action button');
    dpadInfo.dpadVisible ? pass('D-pad visible on mobile') : fail('D-pad not visible');

    // === 19. Touch on canvas ===
    const touchOk = await page.evaluate(() => {
      const target = document.getElementById('gameCanvas');
      if (!target) return 'no-canvas';
      try {
        const rect = target.getBoundingClientRect();
        const t = new Touch({ identifier: 1, target, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 });
        target.dispatchEvent(new TouchEvent('touchstart', { touches: [t], bubbles: true }));
        target.dispatchEvent(new TouchEvent('touchend', { changedTouches: [t], bubbles: true }));
        return 'ok';
      } catch (e) { return e.message; }
    });
    touchOk === 'ok' ? pass('Touch interaction works') : fail(`Touch failed: ${touchOk}`);

    // === 20. D-pad touch ===
    const dpadTouch = await page.evaluate(() => {
      const btn = document.getElementById('dpad-right');
      if (!btn) return 'no-btn';
      try {
        const rect = btn.getBoundingClientRect();
        const t = new Touch({ identifier: 2, target: btn, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 });
        btn.dispatchEvent(new TouchEvent('touchstart', { touches: [t], bubbles: true }));
        for (let i = 0; i < 3; i++) Player.update(0.016);
        btn.dispatchEvent(new TouchEvent('touchend', { changedTouches: [t], bubbles: true }));
        return 'ok';
      } catch (e) { return e.message; }
    });
    dpadTouch === 'ok' ? pass('D-pad touch input works') : fail(`D-pad touch failed: ${dpadTouch}`);

    // === 21. Level transition ===
    const levelProgress = await page.evaluate(() => {
      const map = Engine.getMap();
      if (!map) return { error: 'no map' };
      let exitPos = null;
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < (map[0] ? map[0].length : 0); x++) {
          if (MapGenerator.getTile(map, x, y) === 4) exitPos = { x, y };
        }
      }
      if (!exitPos) return { error: 'no exit found' };
      Engine.startLevelTransition();
      return { exitPos };
    });
    if (levelProgress.error) {
      fail(`Level transition error: ${levelProgress.error}`);
    } else {
      pass(`Level transition triggered at (${levelProgress.exitPos.x},${levelProgress.exitPos.y})`);
    }

    // === 22. Reflection state ===
    await page.waitForTimeout(2000);
    const afterTransition = await page.evaluate(() => Engine.getState());
    afterTransition === 'reflection' ? pass('Entered reflection state') : fail(`Expected reflection, got: ${afterTransition}`);

    // === 23. Next level ===
    const nextLevelResult = await page.evaluate(() => {
      Engine.nextLevel();
      return { state: Engine.getState(), hasMap: !!Engine.getMap() };
    });
    ['intro', 'exploring'].includes(nextLevelResult.state) ? pass(`Next level loaded, state: ${nextLevelResult.state}`) : fail(`Failed to advance: ${nextLevelResult.state}`);
    nextLevelResult.hasMap ? pass('New map generated') : fail('No map for next level');

    // === 24. Complete all levels to ending ===
    const endingReached = await page.evaluate(() => {
      for (let i = 0; i < 8; i++) {
        if (Engine.getState() === 'ending') return { reached: true, i };
        Engine.changeState('reflection');
        Engine.nextLevel();
      }
      return { reached: Engine.getState() === 'ending', finalState: Engine.getState() };
    });
    endingReached.reached ? pass('Reached ending state') : fail(`Could not reach ending: ${JSON.stringify(endingReached)}`);

    // === 25. Ending system ===
    const endingInfo = await page.evaluate(() => ({
      hasInit: typeof Ending.init === 'function',
      hasHandleInput: typeof Ending.handleInput === 'function',
      hasHandleTap: typeof Ending.handleTap === 'function',
      hasRender: typeof Ending.render === 'function',
    }));
    endingInfo.hasInit && endingInfo.hasRender ? pass('Ending system API complete') : fail(`Ending incomplete: ${JSON.stringify(endingInfo)}`);

    // === 26. MapGenerator API ===
    const genInfo = await page.evaluate(() => {
      const testMap = MapGenerator.generate(10, 10, { entrance: { x: 1, y: 1 }, exit: { x: 8, y: 8 } });
      return {
        hasGenerate: typeof MapGenerator.generate === 'function',
        hasGetTile: typeof MapGenerator.getTile === 'function',
        hasExpandMap: typeof MapGenerator.expandMap === 'function',
        canGenerate: !!testMap,
      };
    });
    genInfo.hasGenerate && genInfo.canGenerate ? pass('MapGenerator works') : fail(`MapGenerator issue: ${JSON.stringify(genInfo)}`);

    // === 27. Dynamic lights ===
    const dynLight = await page.evaluate(() => {
      const id = Lighting.addLight(5, 5, 100, '#ff0000', true);
      const hasId = id !== null && id !== undefined;
      if (hasId) Lighting.removeLight(id);
      return hasId;
    });
    dynLight ? pass('Dynamic light add/remove works') : fail('Dynamic light add failed');

    // === 28. Lighting revealAll ===
    const revealOk = await page.evaluate(() => { Lighting.revealAll(); return true; });
    revealOk ? pass('Lighting.revealAll() works') : fail('Lighting.revealAll() failed');

    // === 29. No horizontal overflow ===
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    overflow <= 2 ? pass('No horizontal overflow') : fail(`Overflow: ${overflow}px`);

    // === 30. No JS errors after all interactions ===
    errors.length === 0 ? pass('No JS errors throughout entire test') : fail(`Errors: ${errors.join('; ')}`);

  } catch (err) {
    fail(`Fatal: ${err.message}`);
  }

  await ctx.close();
  await browser.close();
  console.log(`\n  Total: ${results.passed} passed, ${results.failed} failed`);
  return results;
}

test().then(r => process.exit(r.failed > 0 ? 1 : 0)).catch(e => { console.error(e); process.exit(2); });

// 通向奥秘 - 游戏引擎

var Engine = (function () {
    var TILE_SIZE = 32;
    var COLS = 30;
    var ROWS = 20;

    var DEFAULT_COLORS = {
        wall: '#222',
        path: '#333',
        door: '#6b4c2a',
        special: '#2a2a3e',
        exit: '#3e3e2a',
        entrance: '#2a3e2a'
    };

    var canvas, ctx;
    var state = 'menu';
    var currentMap = null;
    var currentTheme = null;
    var lastTime = 0;
    var running = false;

    // Map expansion tracking
    var mapExpansionLevel = 0;
    var EXPANSION_THRESHOLDS = [2, 3, 4, 5, 6];

    // Level transition effect
    var transitionTimer = 0;
    var TRANSITION_DURATION = 1.5;
    var transitioning = false;

    // Camera system
    var cameraX = 0;
    var cameraY = 0;
    var viewWidth = 960;
    var viewHeight = 640;
    var CAMERA_SMOOTH = 0.12;

    // Mobile detection
    var isMobile = false;
    var mobileFontScale = 1;

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        // Mobile detection
        isMobile = 'ontouchstart' in window;
        Engine.isMobile = isMobile;
        mobileFontScale = isMobile ? 1.2 : 1;
        Engine.mobileFontScale = mobileFontScale;

        // Calculate initial viewport
        calcViewport();

        // Show D-Pad on mobile
        if (isMobile) {
            var dpad = document.getElementById('dpad');
            if (dpad) {
                dpad.classList.add('visible');
            }
            bindDpadTouch();
            bindCanvasTouch();
        }

        var startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', function () {
            start();
        });

        // Auto-start on mobile (start screen is keyboard-oriented)
        if (isMobile) {
            start();
        }

        // Resize handler
        window.addEventListener('resize', function () {
            calcViewport();
        });

        document.addEventListener('keydown', function (e) {
            if (state === 'exploring' && typeof Player !== 'undefined') {
                Player.handleInput(e);
                // NPC interaction key
                if ((e.key === 'e' || e.key === 'E') && typeof NPC !== 'undefined') {
                    var gridPos = Player.getGridPos();
                    var dir = Player.getDirection();
                    NPC.handleInteraction(gridPos.gx, gridPos.gy, dir);
                }
            }
            if (state === 'dialogue' && typeof Dialogue !== 'undefined') {
                Dialogue.handleInput(e);
            }
            if (state === 'reflection' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                nextLevel();
            }
            if (state === 'ending' && typeof Ending !== 'undefined') {
                Ending.handleInput(e);
            }
            if (state === 'intro' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                changeState('exploring');
            }
        });
    }

    function calcViewport() {
        viewWidth = window.innerWidth;
        viewHeight = window.innerHeight - (isMobile ? 200 : 0);
        if (viewHeight < 300) viewHeight = 300;
        // Resize canvas buffer to match viewport
        if (canvas) {
            canvas.width = viewWidth;
            canvas.height = viewHeight;
        }
    }

    function bindDpadTouch() {
        var dirs = ['up', 'down', 'left', 'right'];
        for (var i = 0; i < dirs.length; i++) {
            (function (dir) {
                var btn = document.getElementById('dpad-' + dir);
                if (!btn) return;
                btn.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    if (typeof Player !== 'undefined' && state === 'exploring') {
                        Player.startMove(dir);
                    }
                }, { passive: false });
                btn.addEventListener('touchend', function (e) {
                    e.preventDefault();
                    if (typeof Player !== 'undefined') {
                        Player.stopMove();
                    }
                }, { passive: false });
            })(dirs[i]);
        }

        // Action button
        var actionBtn = document.getElementById('dpad-action');
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', function (e) {
                e.preventDefault();
                if (state === 'exploring' && typeof NPC !== 'undefined' && typeof Player !== 'undefined') {
                    var gridPos = Player.getGridPos();
                    var dir = Player.getDirection();
                    NPC.handleInteraction(gridPos.gx, gridPos.gy, dir);
                }
            }, { passive: false });
        }
    }

    function bindCanvasTouch() {
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();

            if (state === 'intro') {
                changeState('exploring');
            } else if (state === 'reflection') {
                nextLevel();
            } else if (state === 'dialogue' && typeof Dialogue !== 'undefined') {
                Dialogue.handleTap();
            } else if (state === 'ending' && typeof Ending !== 'undefined') {
                var touch = e.touches[0];
                var rect = canvas.getBoundingClientRect();
                var x = (touch.clientX - rect.left) / rect.width * canvas.width;
                var y = (touch.clientY - rect.top) / rect.height * canvas.height;
                Ending.handleTap(x, y);
            }
        }, { passive: false });
    }

    function loadLevel(levelConfig) {
        COLS = levelConfig.width;
        ROWS = levelConfig.height;
        currentTheme = levelConfig.theme || null;
        mapExpansionLevel = 0;
        transitioning = false;
        transitionTimer = 0;

        // Ensure viewport is current, then set viewport-sized canvas buffer
        calcViewport();

        var config = {
            entrance: levelConfig.entrance,
            exit: levelConfig.exit,
            specialRooms: levelConfig.specialRooms || [],
            doors: levelConfig.doors || [],
            hiddenPaths: levelConfig.hiddenPaths || []
        };
        currentMap = MapGenerator.generate(COLS, ROWS, config);

        if (typeof Player !== 'undefined') {
            Player.init(currentMap, config.entrance);
        }
        if (typeof Lighting !== 'undefined') {
            Lighting.init(levelConfig);
            Lighting.initExplored(COLS, ROWS);
        }
        if (typeof Items !== 'undefined') {
            Items.init(levelConfig);
        }
        if (typeof NPC !== 'undefined') {
            NPC.init(levelConfig);
        }
        if (typeof Particles !== 'undefined') {
            Particles.init(levelConfig);
        }
        if (typeof UI !== 'undefined') {
            UI.setLevelName(levelConfig.name);
        }

        // Reset camera to player position
        if (typeof Player !== 'undefined') {
            var pos = Player.getPlayerPos();
            cameraX = pos.x - viewWidth / 2;
            cameraY = pos.y - viewHeight / 2;
        }
        clampCamera();

        changeState('intro');
    }

    function start() {
        var startScreen = document.getElementById('startScreen');
        startScreen.style.display = 'none';

        if (typeof Levels !== 'undefined') {
            Levels.reset();
            if (typeof Items !== 'undefined') {
                Items.resetAll();
            }
            var levelConfig = Levels.nextLevel();
            if (levelConfig) {
                loadLevel(levelConfig);
            }
        } else {
            // Fallback: simple random maze
            var config = {
                entrance: { x: 1, y: 1 },
                exit: { x: COLS - 2, y: ROWS - 2 }
            };
            currentMap = MapGenerator.generate(COLS, ROWS, config);
            if (typeof Player !== 'undefined') {
                Player.init(currentMap, config.entrance);
            }
            if (typeof Lighting !== 'undefined') {
                Lighting.init();
            }
            if (typeof UI !== 'undefined') {
                UI.init();
            }
        }

        if (!running) {
            running = true;
            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        }

        // Expose game state for testing
        window.game = window.game || {};
        window.game.player = true;
        window.game.rooms = currentMap;
    }

    function gameLoop(timestamp) {
        if (!running) return;

        var dt = (timestamp - lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        lastTime = timestamp;

        update(dt);
        render();

        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        beaconPhase += dt;

        if (state === 'exploring') {
            if (typeof Player !== 'undefined') {
                Player.update(dt);
            }

            // Update camera to follow player
            updateCamera(dt);

            if (typeof Lighting !== 'undefined' && typeof Player !== 'undefined') {
                Lighting.update(Player.getPlayerPos());
            }
            if (typeof Items !== 'undefined' && typeof Player !== 'undefined') {
                Items.update(dt, Player.getGridPos());
            }
            if (typeof NPC !== 'undefined' && typeof Player !== 'undefined') {
                NPC.update(dt, Player.getGridPos());
            }
            if (typeof Particles !== 'undefined') {
                Particles.update(dt);
            }
            if (typeof UI !== 'undefined') {
                UI.update(dt);
            }

            // Check for map expansion
            expandCurrentMap();

            // Update D-Pad action button visibility
            updateDpadAction();
        }

        // Level transition effect
        if (transitioning) {
            transitionTimer -= dt;
            if (typeof Lighting !== 'undefined') {
                Lighting.revealAll();
            }
            if (transitionTimer <= 0) {
                transitioning = false;
                transitionTimer = 0;
                changeState('reflection');
            }
        }

        if (state === 'ending' && typeof Ending !== 'undefined') {
            Ending.update(dt);
        }

        if (state === 'dialogue' && typeof Dialogue !== 'undefined') {
            Dialogue.update(dt);
        }

        if (state === 'intro') {
            if (typeof UI !== 'undefined') {
                UI.update(dt);
            }
        }
    }

    function updateCamera(dt) {
        if (typeof Player === 'undefined') return;

        var pos = Player.getPlayerPos();
        var targetCX = pos.x - viewWidth / 2;
        var targetCY = pos.y - viewHeight / 2;

        cameraX += (targetCX - cameraX) * CAMERA_SMOOTH;
        cameraY += (targetCY - cameraY) * CAMERA_SMOOTH;

        clampCamera();
    }

    function clampCamera() {
        var mapW = COLS * TILE_SIZE;
        var mapH = ROWS * TILE_SIZE;

        if (mapW <= viewWidth) {
            cameraX = (mapW - viewWidth) / 2;
        } else {
            if (cameraX < 0) cameraX = 0;
            if (cameraX > mapW - viewWidth) cameraX = mapW - viewWidth;
        }

        if (mapH <= viewHeight) {
            cameraY = (mapH - viewHeight) / 2;
        } else {
            if (cameraY < 0) cameraY = 0;
            if (cameraY > mapH - viewHeight) cameraY = mapH - viewHeight;
        }
    }

    function updateDpadAction() {
        var actionBtn = document.getElementById('dpad-action');
        if (!actionBtn || typeof NPC === 'undefined' || typeof Player === 'undefined') return;

        var gridPos = Player.getGridPos();
        var dir = Player.getDirection();
        var dirs = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };
        var d = dirs[dir] || { dx: 0, dy: 0 };
        var adjacent = NPC.isAdjacent(gridPos.gx, gridPos.gy, d.dx, d.dy);

        if (adjacent) {
            actionBtn.classList.remove('hidden');
        } else {
            actionBtn.classList.add('hidden');
        }
    }

    function render() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (state === 'exploring' || state === 'dialogue' || state === 'reflection' || state === 'intro') {
            ctx.save();
            ctx.translate(-cameraX, -cameraY);

            renderMap();

            if (typeof Items !== 'undefined') {
                Items.render(ctx);
            }

            if (typeof NPC !== 'undefined') {
                NPC.render(ctx);
            }

            if (typeof Particles !== 'undefined') {
                Particles.render(ctx);
            }

            if (typeof Player !== 'undefined') {
                Player.render(ctx);
            }

            ctx.restore();

            // Lighting in screen space (no camera transform)
            if (typeof Lighting !== 'undefined' && typeof Player !== 'undefined') {
                var ppos = Player.getPlayerPos();
                Lighting.render(ctx, ppos.x - cameraX, ppos.y - cameraY);
            }

            // UI rendered in screen space (no camera transform)
            if (typeof UI !== 'undefined') {
                UI.render(ctx);
            }
        }

        if (state === 'intro') {
            renderIntroOverlay();
        }

        if (state === 'dialogue' && typeof Dialogue !== 'undefined') {
            Dialogue.render(ctx);
        }

        if (state === 'reflection') {
            renderReflectionOverlay();
        }

        if (state === 'ending' && typeof Ending !== 'undefined') {
            Ending.render(ctx);
        }

        // Level transition golden glow
        if (transitioning) {
            var progress = 1 - (transitionTimer / TRANSITION_DURATION);
            var cx = canvas.width / 2;
            var cy = canvas.height / 2;
            var maxR = Math.sqrt(cx * cx + cy * cy);
            var r = maxR * progress;

            ctx.save();
            var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, 'rgba(212,197,160,' + (progress * 0.8).toFixed(2) + ')');
            grad.addColorStop(0.6, 'rgba(212,197,160,' + (progress * 0.4).toFixed(2) + ')');
            grad.addColorStop(1, 'rgba(212,197,160,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    function renderMap() {
        if (!currentMap) return;

        var exitX = -1, exitY = -1;
        var specialTiles = [];

        // Calculate visible tile range (culling)
        var startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
        var endCol = Math.min(COLS, Math.ceil((cameraX + viewWidth) / TILE_SIZE) + 1);
        var startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
        var endRow = Math.min(ROWS, Math.ceil((cameraY + viewHeight) / TILE_SIZE) + 1);

        for (var y = startRow; y < endRow; y++) {
            for (var x = startCol; x < endCol; x++) {
                var tile = MapGenerator.getTile(currentMap, x, y);
                ctx.fillStyle = tileColor(tile);
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                if (tile === 4) {
                    exitX = x;
                    exitY = y;
                }
                if (tile === 3) {
                    specialTiles.push({ x: x, y: y });
                }
            }
        }

        // Special room glow (dim blue-purple pulse)
        for (var i = 0; i < specialTiles.length; i++) {
            var st = specialTiles[i];
            var scx = st.x * TILE_SIZE + TILE_SIZE / 2;
            var scy = st.y * TILE_SIZE + TILE_SIZE / 2;
            var sPulse = Math.sin(beaconPhase * 1.5) * 4 + 6;
            ctx.save();
            ctx.shadowBlur = sPulse;
            ctx.shadowColor = '#6a6aaa';
            ctx.fillStyle = 'rgba(106,106,170,0.2)';
            ctx.beginPath();
            ctx.arc(scx, scy, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Exit beacon glow
        if (exitX >= 0) {
            var ecx = exitX * TILE_SIZE + TILE_SIZE / 2;
            var ecy = exitY * TILE_SIZE + TILE_SIZE / 2;
            var pulse = Math.sin(beaconPhase * 3) * 8 + 12;
            ctx.save();
            ctx.shadowBlur = pulse;
            ctx.shadowColor = '#d4c5a0';
            ctx.fillStyle = 'rgba(212,197,160,0.3)';
            ctx.beginPath();
            ctx.arc(ecx, ecy, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function tileColor(tile) {
        var colors = currentTheme || DEFAULT_COLORS;
        switch (tile) {
            case 0: return colors.wallColor || DEFAULT_COLORS.wall;
            case 1: return colors.pathColor || DEFAULT_COLORS.path;
            case 2: return colors.door || DEFAULT_COLORS.door;
            case 3: return colors.specialColor || DEFAULT_COLORS.special;
            case 4: return colors.exitColor || DEFAULT_COLORS.exit;
            case 5: return DEFAULT_COLORS.entrance;
            case 6:
                // Hidden path: visible as faint path if player has 'failure' fragment
                var hasFailure = (typeof Items !== 'undefined') && Items.hasElement('failure');
                return hasFailure ? '#3a3a4a' : (colors.wallColor || DEFAULT_COLORS.wall);
            default: return DEFAULT_COLORS.wall;
        }
    }

    function renderReflectionOverlay() {
        // Render in screen space (viewport-relative)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        var vpW = viewWidth;
        var vpH = viewHeight;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, vpW, vpH);

        var level = null;
        if (typeof Levels !== 'undefined') {
            level = Levels.getCurrentLevel();
        }

        var centerX = vpW / 2;
        var startY;

        if (level && level.reflection) {
            var ref = level.reflection;

            // Title
            ctx.fillStyle = '#d4c5a0';
            ctx.font = Math.round(24 * mobileFontScale) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ref.title, centerX, vpH / 2 - ref.lines.length * 14 - 10);

            // Lines
            ctx.fillStyle = '#aaa';
            ctx.font = Math.round(16 * mobileFontScale) + 'px "Noto Serif SC", serif';
            startY = vpH / 2 - (ref.lines.length - 1) * 14;
            for (var i = 0; i < ref.lines.length; i++) {
                ctx.fillText(ref.lines[i], centerX, startY + i * 28);
            }
        } else {
            ctx.fillStyle = '#d4c5a0';
            ctx.font = Math.round(24 * mobileFontScale) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('反思...', centerX, vpH / 2);
        }

        // "Press Enter" prompt
        ctx.fillStyle = '#666';
        ctx.font = Math.round(14 * mobileFontScale) + 'px "Noto Serif SC", serif';
        var promptText = isMobile ? '点击屏幕继续' : '按 Enter 继续';
        ctx.fillText(promptText, centerX, vpH - 40);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    function renderIntroOverlay() {
        // Render in screen space (viewport-relative)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        var vpW = viewWidth;
        var vpH = viewHeight;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, vpW, vpH);

        var level = null;
        if (typeof Levels !== 'undefined') {
            level = Levels.getCurrentLevel();
        }

        var cx = vpW / 2;
        var cy = vpH / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (level) {
            // Level name (large)
            ctx.fillStyle = '#d4c5a0';
            ctx.font = Math.round(28 * mobileFontScale) + 'px "Noto Serif SC", serif';
            ctx.fillText(level.name, cx, cy - 24);

            // Subtitle (smaller)
            ctx.fillStyle = '#888';
            ctx.font = Math.round(18 * mobileFontScale) + 'px "Noto Serif SC", serif';
            ctx.fillText(level.subtitle, cx, cy + 16);
        }

        // Prompt
        ctx.fillStyle = '#555';
        ctx.font = Math.round(14 * mobileFontScale) + 'px "Noto Serif SC", serif';
        var promptText = isMobile ? '点击屏幕开始' : '按 Enter 开始';
        ctx.fillText(promptText, cx, vpH - 40);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    var beaconPhase = 0;  // for exit beacon pulsing

    function changeState(newState) {
        state = newState;
        if (newState === 'ending' && typeof Ending !== 'undefined') {
            Ending.init();
        }
        // Show D-Pad only during exploring
        if (isMobile) {
            var dpad = document.getElementById('dpad');
            if (dpad) {
                if (newState === 'exploring') {
                    dpad.style.display = '';
                    dpad.classList.add('visible');
                } else {
                    dpad.style.display = 'none';
                }
            }
        }
    }

    function getState() {
        return state;
    }

    function getMap() {
        return currentMap;
    }

    function setMap(map) {
        currentMap = map;
    }

    function nextLevel() {
        if (typeof Levels !== 'undefined') {
            var levelConfig = Levels.nextLevel();
            if (!levelConfig) {
                changeState('ending');
                return;
            }
            loadLevel(levelConfig);
        } else {
            // Fallback: regenerate random maze
            var config = {
                entrance: { x: 1, y: 1 },
                exit: { x: COLS - 2, y: ROWS - 2 }
            };
            currentMap = MapGenerator.generate(COLS, ROWS, config);
            if (typeof Player !== 'undefined') {
                Player.init(currentMap, config.entrance);
            }
            if (typeof Lighting !== 'undefined') {
                Lighting.init();
            }
        }
    }

    function startLevelTransition() {
        transitioning = true;
        transitionTimer = TRANSITION_DURATION;
    }

    function expandCurrentMap() {
        if (mapExpansionLevel >= EXPANSION_THRESHOLDS.length) return;
        if (typeof Items === 'undefined') return;

        var fragmentCount = Items.getCollected().length;
        if (fragmentCount < EXPANSION_THRESHOLDS[mapExpansionLevel]) return;

        mapExpansionLevel++;
        var expandCols = 2;
        var expandRows = 2;

        var result = MapGenerator.expandMap(currentMap, COLS, ROWS, expandCols, expandRows);
        currentMap = result.grid;

        // Update dimensions
        COLS = result.newCols;
        ROWS = result.newRows;

        // Shift player position by offset
        if (typeof Player !== 'undefined') {
            Player.adjustPosition(result.offsetX, result.offsetY);
        }

        // Expand explored array — copy old data with offset
        if (typeof Lighting !== 'undefined') {
            Lighting.expandExplored(result.newCols, result.newRows, result.offsetX, result.offsetY);
        }

        // Show expansion notification
        if (typeof UI !== 'undefined') {
            UI.showPickup('新的区域已开启');
        }
    }

    function getContext() {
        return ctx;
    }

    function getCanvas() {
        return canvas;
    }

    function getCurrentTheme() {
        return currentTheme;
    }

    function getViewRect() {
        return { x: cameraX, y: cameraY, w: viewWidth, h: viewHeight };
    }

    function getIsMobile() {
        return isMobile;
    }

    return {
        init: init,
        start: start,
        gameLoop: gameLoop,
        update: update,
        render: render,
        changeState: changeState,
        getState: getState,
        getMap: getMap,
        setMap: setMap,
        nextLevel: nextLevel,
        loadLevel: loadLevel,
        startLevelTransition: startLevelTransition,
        getContext: getContext,
        getCanvas: getCanvas,
        getCurrentTheme: getCurrentTheme,
        getViewRect: getViewRect,
        getIsMobile: getIsMobile,
        isMobile: isMobile,
        mobileFontScale: mobileFontScale,
        TILE_SIZE: TILE_SIZE,
        COLS: COLS,
        ROWS: ROWS
    };
})();

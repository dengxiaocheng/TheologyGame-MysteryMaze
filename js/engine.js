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

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        var startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', function () {
            start();
        });

        document.addEventListener('keydown', function (e) {
            if (state === 'exploring' && typeof Player !== 'undefined') {
                Player.handleInput(e);
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

    function loadLevel(levelConfig) {
        COLS = levelConfig.width;
        ROWS = levelConfig.height;
        currentTheme = levelConfig.theme || null;

        // Update canvas size
        canvas.width = COLS * TILE_SIZE;
        canvas.height = ROWS * TILE_SIZE;

        var config = {
            entrance: levelConfig.entrance,
            exit: levelConfig.exit,
            specialRooms: levelConfig.specialRooms || [],
            doors: levelConfig.doors || []
        };
        currentMap = MapGenerator.generate(COLS, ROWS, config);

        if (typeof Player !== 'undefined') {
            Player.init(currentMap, config.entrance);
        }
        if (typeof Lighting !== 'undefined') {
            Lighting.init(levelConfig);
        }
        if (typeof Items !== 'undefined') {
            Items.init(levelConfig);
        }
        if (typeof UI !== 'undefined') {
            UI.setLevelName(levelConfig.name);
        }

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
            if (typeof Lighting !== 'undefined' && typeof Player !== 'undefined') {
                Lighting.update(Player.getPlayerPos());
            }
            if (typeof Items !== 'undefined' && typeof Player !== 'undefined') {
                Items.update(dt, Player.getGridPos());
            }
            if (typeof UI !== 'undefined') {
                UI.update(dt);
            }
        }

        if (state === 'ending' && typeof Ending !== 'undefined') {
            Ending.update(dt);
        }

        if (state === 'intro') {
            if (typeof UI !== 'undefined') {
                UI.update(dt);
            }
        }
    }

    function render() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (state === 'exploring' || state === 'dialogue' || state === 'reflection' || state === 'intro') {
            renderMap();

            if (typeof Items !== 'undefined') {
                Items.render(ctx);
            }

            if (typeof Player !== 'undefined') {
                Player.render(ctx);
            }

            if (typeof Lighting !== 'undefined') {
                Lighting.render(ctx);
            }

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
    }

    function renderMap() {
        if (!currentMap) return;

        var exitX = -1, exitY = -1;

        for (var y = 0; y < ROWS; y++) {
            for (var x = 0; x < COLS; x++) {
                var tile = MapGenerator.getTile(currentMap, x, y);
                ctx.fillStyle = tileColor(tile);
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                if (tile === 4) {
                    exitX = x;
                    exitY = y;
                }
            }
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
            default: return DEFAULT_COLORS.wall;
        }
    }

    function renderReflectionOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var level = null;
        if (typeof Levels !== 'undefined') {
            level = Levels.getCurrentLevel();
        }

        var centerX = canvas.width / 2;
        var startY;

        if (level && level.reflection) {
            var ref = level.reflection;

            // Title
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '24px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ref.title, centerX, canvas.height / 2 - ref.lines.length * 14 - 10);

            // Lines
            ctx.fillStyle = '#aaa';
            ctx.font = '16px "Noto Serif SC", serif';
            startY = canvas.height / 2 - (ref.lines.length - 1) * 14;
            for (var i = 0; i < ref.lines.length; i++) {
                ctx.fillText(ref.lines[i], centerX, startY + i * 28);
            }
        } else {
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '24px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('反思...', centerX, canvas.height / 2);
        }

        // "Press Enter" prompt
        ctx.fillStyle = '#666';
        ctx.font = '14px "Noto Serif SC", serif';
        ctx.fillText('按 Enter 继续', centerX, canvas.height - 40);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function renderIntroOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var level = null;
        if (typeof Levels !== 'undefined') {
            level = Levels.getCurrentLevel();
        }

        var cx = canvas.width / 2;
        var cy = canvas.height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (level) {
            // Level name (large)
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '28px "Noto Serif SC", serif';
            ctx.fillText(level.name, cx, cy - 24);

            // Subtitle (smaller)
            ctx.fillStyle = '#888';
            ctx.font = '18px "Noto Serif SC", serif';
            ctx.fillText(level.subtitle, cx, cy + 16);
        }

        // Prompt
        ctx.fillStyle = '#555';
        ctx.font = '14px "Noto Serif SC", serif';
        ctx.fillText('按 Enter 开始', cx, canvas.height - 40);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    var beaconPhase = 0;  // for exit beacon pulsing

    function changeState(newState) {
        state = newState;
        if (newState === 'ending' && typeof Ending !== 'undefined') {
            Ending.init();
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

    function getContext() {
        return ctx;
    }

    function getCanvas() {
        return canvas;
    }

    function getCurrentTheme() {
        return currentTheme;
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
        getContext: getContext,
        getCanvas: getCanvas,
        getCurrentTheme: getCurrentTheme,
        TILE_SIZE: TILE_SIZE,
        COLS: COLS,
        ROWS: ROWS
    };
})();

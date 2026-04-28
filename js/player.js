// 通向奥秘 - 玩家模块

var Player = (function () {
    var TILE_SIZE = 32;

    var gx, gy;           // current grid position
    var px, py;           // current pixel position (center of tile)
    var targetGx, targetGy;
    var moving = false;
    var moveSpeed = 8;    // tiles per second
    var direction = 'down';
    var map = null;

    function init(mapData, startPos) {
        map = mapData;
        gx = startPos.x;
        gy = startPos.y;
        px = gx * TILE_SIZE + TILE_SIZE / 2;
        py = gy * TILE_SIZE + TILE_SIZE / 2;
        targetGx = gx;
        targetGy = gy;
        moving = false;
        direction = 'down';
    }

    function handleInput(e) {
        if (moving) return;

        var dx = 0, dy = 0;
        var key = e.key;

        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
            dy = -1; direction = 'up';
        } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
            dy = 1; direction = 'down';
        } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            dx = -1; direction = 'left';
        } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            dx = 1; direction = 'right';
        } else {
            return;
        }

        e.preventDefault();

        var nx = gx + dx;
        var ny = gy + dy;
        var tile = MapGenerator.getTile(map, nx, ny);

        // WALL (0) is impassable; everything else is passable
        if (tile !== MapGenerator.WALL) {
            targetGx = nx;
            targetGy = ny;
            moving = true;
        }
    }

    function update(dt) {
        if (!moving) return;

        var targetPx = targetGx * TILE_SIZE + TILE_SIZE / 2;
        var targetPy = targetGy * TILE_SIZE + TILE_SIZE / 2;

        var dx = targetPx - px;
        var dy = targetPy - py;
        var dist = Math.sqrt(dx * dx + dy * dy);

        var step = moveSpeed * TILE_SIZE * dt;

        if (dist <= step) {
            // Snap to target
            px = targetPx;
            py = targetPy;
            gx = targetGx;
            gy = targetGy;
            moving = false;

            // Check tile type at new position
            var tile = MapGenerator.getTile(map, gx, gy);
            if (tile === MapGenerator.EXIT) {
                if (typeof Engine !== 'undefined') {
                    Engine.changeState('reflection');
                }
            }
        } else {
            // Interpolate toward target
            px += (dx / dist) * step;
            py += (dy / dist) * step;
        }
    }

    function render(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(212,197,160,0.5)';
        ctx.fillStyle = '#d4c5a0';
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator triangle
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#d4c5a0';
        ctx.beginPath();
        var tipDist = 16;
        var baseDist = 7;
        var halfW = 4;
        var tx, ty, bx, by, lx, ly, rx, ry;

        if (direction === 'up') {
            tx = px; ty = py - tipDist;
            lx = px - halfW; ly = py - baseDist;
            rx = px + halfW; ry = py - baseDist;
        } else if (direction === 'down') {
            tx = px; ty = py + tipDist;
            lx = px - halfW; ly = py + baseDist;
            rx = px + halfW; ry = py + baseDist;
        } else if (direction === 'left') {
            tx = px - tipDist; ty = py;
            lx = px - baseDist; ly = py - halfW;
            rx = px - baseDist; ry = py + halfW;
        } else {
            tx = px + tipDist; ty = py;
            lx = px + baseDist; ly = py - halfW;
            rx = px + baseDist; ry = py + halfW;
        }
        ctx.moveTo(tx, ty);
        ctx.lineTo(lx, ly);
        ctx.lineTo(rx, ry);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function getPlayerPos() {
        return { x: px, y: py };
    }

    function getGridPos() {
        return { gx: gx, gy: gy };
    }

    return {
        init: init,
        handleInput: handleInput,
        update: update,
        render: render,
        getPlayerPos: getPlayerPos,
        getGridPos: getGridPos
    };
})();

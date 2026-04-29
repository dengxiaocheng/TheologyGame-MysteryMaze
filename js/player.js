// 通向奥秘 - 玩家模块

var Player = (function () {
    var TILE_SIZE = 32;

    var gx, gy;           // current grid position
    var px, py;           // current pixel position (center of tile)
    var targetGx, targetGy;
    var moving = false;
    var baseMoveSpeed = 8;    // tiles per second (walking)
    var moveSpeed = 8;
    var direction = 'down';
    var targetDirection = 'down';
    var directionLerp = 1.0;  // 0 = old direction, 1 = new direction
    var prevDirection = 'down';
    var map = null;
    var trail = [];

    // Stamina / Sprint
    var MAX_STAMINA = 100;
    var stamina = MAX_STAMINA;
    var sprinting = false;
    var SPRINT_DRAIN = 20;    // stamina per second
    var SPRINT_REGEN = 10;    // stamina per second
    var SPRINT_SPEED_MULT = 2;
    var sprintHoldTime = 0;
    var SPRINT_HOLD_THRESHOLD = 0.5; // seconds to hold D-Pad for sprint on mobile

    // Animation state machine
    var animState = 'idle';  // 'idle', 'walking', 'sprinting', 'interacting'
    var breathePhase = 0;
    var interactTimer = 0;

    // Footstep dust particles
    var dustParticles = [];
    var MAX_DUST = 30;

    // Footprint trail
    var footprints = [];
    var MAX_FOOTPRINTS = 50;

    // Dash ability
    var canDash = false;
    var dashCooldown = 0;
    var DASH_COOLDOWN = 3;     // seconds
    var DASH_DISTANCE = 3;     // tiles
    var dashing = false;
    var dashStartX, dashStartY;
    var dashTargetX, dashTargetY;
    var dashProgress = 0;
    var DASH_SPEED = 15;       // tiles per second
    var dashTrailParticles = [];

    // Health / Damage
    var MAX_HP = 5;
    var hp = MAX_HP;
    var invulnerable = false;
    var invulnerableTimer = 0;
    var INVULN_DURATION = 1.5; // seconds
    var flashTimer = 0;

    // Afterimage particles (for sprinting)
    var afterimages = [];
    var MAX_AFTERIMAGES = 5;
    var afterimageTimer = 0;

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
        targetDirection = 'down';
        prevDirection = 'down';
        directionLerp = 1.0;
        trail = [];
        footprints = [];
        dustParticles = [];
        afterimages = [];
        dashTrailParticles = [];
        stamina = MAX_STAMINA;
        sprinting = false;
        sprintHoldTime = 0;
        animState = 'idle';
        breathePhase = 0;
        interactTimer = 0;
        hp = MAX_HP;
        invulnerable = false;
        invulnerableTimer = 0;
        flashTimer = 0;
        dashCooldown = 0;
        dashing = false;
        canDash = false;

        // Check if player has hope fragment (enables dash)
        if (typeof Items !== 'undefined' && Items.hasElement('hope')) {
            canDash = true;
        }
    }

    // ---- Wall Sliding ----
    function tryMove(dx, dy) {
        var nx = gx + dx;
        var ny = gy + dy;

        var hasFailure = (typeof Items !== 'undefined') && Items.hasElement('failure');
        var keysArray = (typeof Items !== 'undefined') ? Items.getKeys() : [];
        var tile = MapGenerator.getTile(map, nx, ny);

        // Door interaction
        if (tile === MapGenerator.DOOR) {
            if (MapGenerator.isDoorLocked(map, nx, ny, keysArray)) {
                if (MapGenerator.isPassable(map, nx, ny, hasFailure, keysArray)) {
                    var doorInfo = MapGenerator.getDoorInfo(map, nx, ny);
                    MapGenerator.unlockDoor(map, nx, ny);
                    if (doorInfo && doorInfo.keyId && typeof Items !== 'undefined') {
                        Items.removeKey(doorInfo.keyId);
                    }
                    targetGx = nx;
                    targetGy = ny;
                    moving = true;
                } else {
                    if (typeof Dialogue !== 'undefined') {
                        Dialogue.show(['这扇门被锁住了。'], function () {
                            if (typeof Engine !== 'undefined') {
                                Engine.changeState('exploring');
                            }
                        });
                    }
                }
                return true;
            }
            targetGx = nx;
            targetGy = ny;
            moving = true;
            return true;
        }

        if (MapGenerator.isPassable(map, nx, ny, hasFailure, keysArray)) {
            targetGx = nx;
            targetGy = ny;
            moving = true;
            return true;
        }

        return false;
    }

    function handleInput(e) {
        if (moving || dashing) return;

        var dx = 0, dy = 0;
        var key = e.key;

        // Dash ability
        if (key === ' ' && canDash && dashCooldown <= 0) {
            e.preventDefault();
            tryDash();
            return;
        }

        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
            dy = -1;
        } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
            dy = 1;
        } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            dx = -1;
        } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            dx = 1;
        } else if (key === 'e' || key === 'E') {
            // Interaction handled by engine
            return;
        } else if (key === 'Shift') {
            // Sprint toggle
            sprinting = true;
            return;
        } else {
            return;
        }

        e.preventDefault();

        // Update direction
        if (dy === -1) targetDirection = 'up';
        else if (dy === 1) targetDirection = 'down';
        else if (dx === -1) targetDirection = 'left';
        else if (dx === 1) targetDirection = 'right';

        if (targetDirection !== direction) {
            prevDirection = direction;
            direction = targetDirection;
            directionLerp = 0;
        }

        // Try direct move first
        if (tryMove(dx, dy)) return;

        // Wall sliding: if diagonal blocked, try single-axis moves
        if (dx !== 0 && dy !== 0) {
            if (tryMove(dx, 0)) {
                if (Math.abs(dx) > 0) {
                    targetDirection = dx < 0 ? 'left' : 'right';
                    if (targetDirection !== direction) {
                        prevDirection = direction;
                        direction = targetDirection;
                        directionLerp = 0;
                    }
                }
                return;
            }
            if (tryMove(0, dy)) {
                if (Math.abs(dy) > 0) {
                    targetDirection = dy < 0 ? 'up' : 'down';
                    if (targetDirection !== direction) {
                        prevDirection = direction;
                        direction = targetDirection;
                        directionLerp = 0;
                    }
                }
                return;
            }
        }
    }

    function update(dt) {
        breathePhase += dt * 2;

        // Direction lerp (smooth rotation)
        if (directionLerp < 1) {
            directionLerp += dt * 10; // 0.1 seconds
            if (directionLerp > 1) directionLerp = 1;
        }

        // Sprint input check
        if (sprinting && stamina > 0) {
            if (animState !== 'sprinting' && moving) {
                animState = 'sprinting';
            }
        } else {
            sprinting = false;
        }

        // Stamina management
        if (sprinting && moving) {
            stamina -= SPRINT_DRAIN * dt;
            if (stamina <= 0) {
                stamina = 0;
                sprinting = false;
            }
            moveSpeed = baseMoveSpeed * SPRINT_SPEED_MULT;
        } else {
            // Check speed elixir
            var speedMult = 1;
            if (typeof Items !== 'undefined' && Items.getActiveEffects) {
                var effects = Items.getActiveEffects();
                for (var i = 0; i < effects.length; i++) {
                    if (effects[i].type === 'speed_boost') {
                        speedMult = 1.5;
                    }
                }
            }
            moveSpeed = baseMoveSpeed * speedMult;
            stamina += SPRINT_REGEN * dt;
            if (stamina > MAX_STAMINA) stamina = MAX_STAMINA;
        }

        // Dash update
        if (dashing) {
            dashProgress += DASH_SPEED * dt;
            var t = Math.min(dashProgress / DASH_DISTANCE, 1);
            px = dashStartX + (dashTargetX - dashStartX) * t;
            py = dashStartY + (dashTargetY - dashStartY) * t;

            // Dash trail particles
            if (dashTrailParticles.length < 20) {
                dashTrailParticles.push({
                    x: px,
                    y: py,
                    alpha: 0.6,
                    size: 8
                });
            }

            if (t >= 1) {
                dashing = false;
                px = dashTargetX;
                py = dashTargetY;
                gx = targetGx;
                gy = targetGy;
                dashCooldown = DASH_COOLDOWN;

                // Check tile at dash destination
                var tile = MapGenerator.getTile(map, gx, gy);
                if (tile === MapGenerator.EXIT) {
                    if (typeof Engine !== 'undefined') {
                        Engine.startLevelTransition();
                    }
                }
            }
            return;
        }

        // Dash cooldown
        if (dashCooldown > 0) {
            dashCooldown -= dt;
            if (dashCooldown < 0) dashCooldown = 0;
        }

        // Invulnerability timer
        if (invulnerable) {
            invulnerableTimer -= dt;
            flashTimer += dt * 8;
            if (invulnerableTimer <= 0) {
                invulnerable = false;
                invulnerableTimer = 0;
            }
        }

        // Interaction timer
        if (interactTimer > 0) {
            interactTimer -= dt;
            if (interactTimer <= 0) {
                animState = moving ? 'walking' : 'idle';
            }
        }

        // Decay trail
        for (var t = trail.length - 1; t >= 0; t--) {
            trail[t].alpha -= dt * 0.3;
            if (trail[t].alpha <= 0) {
                trail.splice(t, 1);
            }
        }

        // Decay footprints
        for (var f = footprints.length - 1; f >= 0; f--) {
            footprints[f].alpha -= dt * 0.1; // fade over 10 seconds
            if (footprints[f].alpha <= 0) {
                footprints.splice(f, 1);
            }
        }

        // Update dust particles
        for (var d = dustParticles.length - 1; d >= 0; d--) {
            var dp = dustParticles[d];
            dp.life -= dt;
            dp.x += dp.vx * dt;
            dp.y += dp.vy * dt;
            dp.vy += 20 * dt; // gravity
            if (dp.life <= 0) {
                dustParticles.splice(d, 1);
            }
        }

        // Update afterimages
        for (var a = afterimages.length - 1; a >= 0; a--) {
            afterimages[a].alpha -= dt * 3;
            if (afterimages[a].alpha <= 0) {
                afterimages.splice(a, 1);
            }
        }

        // Update dash trail
        for (var d = dashTrailParticles.length - 1; d >= 0; d--) {
            dashTrailParticles[d].alpha -= dt * 4;
            if (dashTrailParticles[d].alpha <= 0) {
                dashTrailParticles.splice(d, 1);
            }
        }

        if (!moving) {
            if (animState !== 'interacting') {
                animState = 'idle';
            }
            return;
        }

        animState = sprinting ? 'sprinting' : 'walking';

        var targetPx = targetGx * TILE_SIZE + TILE_SIZE / 2;
        var targetPy = targetGy * TILE_SIZE + TILE_SIZE / 2;

        var ddx = targetPx - px;
        var ddy = targetPy - py;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy);

        var step = moveSpeed * TILE_SIZE * dt;

        // Sprint afterimages
        if (sprinting) {
            afterimageTimer += dt;
            if (afterimageTimer >= 0.05) {
                afterimageTimer = 0;
                if (afterimages.length >= MAX_AFTERIMAGES) afterimages.shift();
                afterimages.push({
                    x: px,
                    y: py,
                    alpha: 0.3
                });
            }
        }

        if (dist <= step) {
            // Snap to target
            px = targetPx;
            py = targetPy;
            gx = targetGx;
            gy = targetGy;
            moving = false;

            // Add trail entry
            if (trail.length >= 20) trail.shift();
            trail.push({ x: gx, y: gy, alpha: 0.4 });

            // Add footprint
            if (footprints.length >= MAX_FOOTPRINTS) footprints.shift();
            footprints.push({
                x: gx,
                y: gy,
                dir: direction,
                alpha: 1.0
            });

            // Spawn dust particles
            spawnDust(px, py, 3);

            // Check tile type at new position
            var tile = MapGenerator.getTile(map, gx, gy);
            if (tile === MapGenerator.EXIT) {
                if (typeof Engine !== 'undefined') {
                    Engine.startLevelTransition();
                }
            } else if (tile === MapGenerator.TRAP) {
                takeDamage(1);
            }

            // Check for items interaction (traps, pressure plates)
            checkTileInteraction(tile);
        } else {
            // Interpolate toward target
            px += (ddx / dist) * step;
            py += (ddy / dist) * step;
        }
    }

    function checkTileInteraction(tile) {
        // Auto-trigger pressure plates
        if (tile === MapGenerator.PRESSURE_PLATE) {
            // Toggle nearby features (handled by level logic)
            if (typeof UI !== 'undefined') {
                UI.showPickup('压力板已触发');
            }
        }
    }

    // ---- Dust Particles ----
    function spawnDust(x, y, count) {
        for (var i = 0; i < count; i++) {
            if (dustParticles.length >= MAX_DUST) dustParticles.shift();
            dustParticles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 30,
                vy: -Math.random() * 20 - 5,
                life: 0.4 + Math.random() * 0.3,
                size: 1 + Math.random() * 1.5
            });
        }
    }

    // ---- Dash Ability ----
    function tryDash() {
        if (!canDash || dashCooldown > 0 || dashing || moving) return false;

        var dirMap = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };
        var d = dirMap[direction];
        if (!d) return false;

        var hasFailure = (typeof Items !== 'undefined') && Items.hasElement('failure');
        var keysArray = (typeof Items !== 'undefined') ? Items.getKeys() : [];

        // Check path is clear for dash distance
        var finalDist = 0;
        for (var i = 1; i <= DASH_DISTANCE; i++) {
            var nx = gx + d.dx * i;
            var ny = gy + d.dy * i;
            if (!MapGenerator.isPassable(map, nx, ny, hasFailure, keysArray)) {
                break;
            }
            finalDist = i;
        }

        if (finalDist === 0) return false;

        targetGx = gx + d.dx * finalDist;
        targetGy = gy + d.dy * finalDist;
        dashStartX = px;
        dashStartY = py;
        dashTargetX = targetGx * TILE_SIZE + TILE_SIZE / 2;
        dashTargetY = targetGy * TILE_SIZE + TILE_SIZE / 2;
        dashProgress = 0;
        dashing = true;
        dashTrailParticles = [];

        return true;
    }

    // ---- Health / Damage ----
    function takeDamage(amount) {
        if (invulnerable || dashing) return;

        // Shield of Solitude reduces damage
        if (typeof Items !== 'undefined' && Items.hasArtifact && Items.hasArtifact('shield_solitude')) {
            amount = Math.max(1, Math.floor(amount * 0.5));
        }

        hp -= amount;
        invulnerable = true;
        invulnerableTimer = INVULN_DURATION;
        flashTimer = 0;

        if (hp <= 0) {
            // Death: reset to level start (keep fragments)
            hp = MAX_HP;
            if (typeof Engine !== 'undefined' && typeof Levels !== 'undefined') {
                var level = Levels.getCurrentLevel();
                if (level) {
                    var startPos = level.entrance || { x: 1, y: 1 };
                    gx = startPos.x;
                    gy = startPos.y;
                    px = gx * TILE_SIZE + TILE_SIZE / 2;
                    py = gy * TILE_SIZE + TILE_SIZE / 2;
                    targetGx = gx;
                    targetGy = gy;
                    moving = false;
                }
            }
            if (typeof UI !== 'undefined') {
                UI.showPickup('你倒下了... 重新开始本层');
            }
        } else {
            if (typeof UI !== 'undefined') {
                UI.showPickup('受到伤害！HP: ' + hp);
            }
        }
    }

    function heal(amount) {
        hp += amount;
        if (hp > MAX_HP) hp = MAX_HP;
    }

    // ---- Interaction System ----
    function interactWithTile() {
        var dirMap = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };
        var d = dirMap[direction];
        if (!d) return;

        var tx = gx + d.dx;
        var ty = gy + d.dy;
        var tile = MapGenerator.getTile(map, tx, ty);

        animState = 'interacting';
        interactTimer = 0.5;

        if (tile === MapGenerator.LORE_STONE) {
            // Show lore text
            if (typeof Levels !== 'undefined' && Levels.getLore) {
                var lore = Levels.getLore();
                if (lore && lore.length > 0) {
                    var idx = Math.floor(Math.random() * lore.length);
                    if (typeof Dialogue !== 'undefined') {
                        var extraLine = '';
                        if (typeof Items !== 'undefined' && Items.hasArtifact && Items.hasArtifact('ring_prayer')) {
                            extraLine = lore[Math.floor(Math.random() * lore.length)];
                            Dialogue.show([lore[idx].text || lore[idx], extraLine], function () {
                                if (typeof Engine !== 'undefined') Engine.changeState('exploring');
                            });
                        } else {
                            Dialogue.show([lore[idx].text || lore[idx]], function () {
                                if (typeof Engine !== 'undefined') Engine.changeState('exploring');
                            });
                        }
                    }
                }
            }
        } else if (tile === MapGenerator.TORCH) {
            // Toggle torch light
            if (typeof Lighting !== 'undefined') {
                var torchX = tx * TILE_SIZE + TILE_SIZE / 2;
                var torchY = ty * TILE_SIZE + TILE_SIZE / 2;
                Lighting.addLight(torchX, torchY, 80, '#ffaa44', true);
            }
        } else if (tile === MapGenerator.BREAKABLE_WALL) {
            // Break the wall
            MapGenerator.setTile(map, tx, ty, MapGenerator.PATH);
            if (typeof UI !== 'undefined') {
                UI.showPickup('墙壁被打破了！');
            }
            spawnDust(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, 8);
        }

        return tile;
    }

    // ---- Render ----
    function render(ctx) {
        // Render footprints
        for (var f = 0; f < footprints.length; f++) {
            var fp = footprints[f];
            var fpx = fp.x * TILE_SIZE + TILE_SIZE / 2;
            var fpy = fp.y * TILE_SIZE + TILE_SIZE / 2;
            ctx.save();
            ctx.globalAlpha = fp.alpha * 0.3;
            ctx.fillStyle = '#d4c5a0';
            ctx.translate(fpx, fpy);

            // Arrow-shaped footprint pointing in direction of travel
            var angle = 0;
            if (fp.dir === 'up') angle = -Math.PI / 2;
            else if (fp.dir === 'down') angle = Math.PI / 2;
            else if (fp.dir === 'left') angle = Math.PI;
            else if (fp.dir === 'right') angle = 0;
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(4, 0);
            ctx.lineTo(-2, -2);
            ctx.lineTo(-2, 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // Render trail
        for (var t = 0; t < trail.length; t++) {
            var tr = trail[t];
            var trpx = tr.x * TILE_SIZE + TILE_SIZE / 2;
            var trpy = tr.y * TILE_SIZE + TILE_SIZE / 2;
            ctx.save();
            ctx.globalAlpha = tr.alpha;
            ctx.fillStyle = sprinting ? '#ffe8a0' : '#d4c5a0';
            ctx.beginPath();
            ctx.arc(trpx, trpy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render dash trail particles
        for (var d = 0; d < dashTrailParticles.length; d++) {
            var dtp = dashTrailParticles[d];
            ctx.save();
            ctx.globalAlpha = dtp.alpha;
            ctx.fillStyle = '#d4c5a0';
            ctx.beginPath();
            ctx.arc(dtp.x, dtp.y, dtp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render afterimages (sprint)
        for (var a = 0; a < afterimages.length; a++) {
            var ai = afterimages[a];
            ctx.save();
            ctx.globalAlpha = ai.alpha;
            ctx.fillStyle = '#d4c5a0';
            ctx.beginPath();
            ctx.arc(ai.x, ai.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render dust particles
        for (var d = 0; d < dustParticles.length; d++) {
            var dp = dustParticles[d];
            var ratio = dp.life / 0.7;
            ctx.save();
            ctx.globalAlpha = ratio * 0.5;
            ctx.fillStyle = '#998866';
            ctx.beginPath();
            ctx.arc(dp.x, dp.y, Math.max(0.5, dp.size * ratio), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Player rendering
        ctx.save();

        // Invulnerability flashing
        if (invulnerable) {
            if (Math.sin(flashTimer * Math.PI) > 0) {
                ctx.globalAlpha = 0.3;
            }
        }

        // Breathing animation (idle)
        var breathScale = 1;
        if (animState === 'idle') {
            breathScale = 1 + 0.02 * Math.sin(breathePhase);
        }

        // Interacting state: pulse
        var interactScale = 1;
        if (animState === 'interacting') {
            interactScale = 1 + 0.1 * Math.sin(interactTimer * 10);
        }

        ctx.shadowBlur = sprinting ? 25 : 15;
        ctx.shadowColor = sprinting ? 'rgba(255,232,160,0.6)' : 'rgba(212,197,160,0.5)';
        ctx.fillStyle = '#d4c5a0';

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(breathScale * interactScale, breathScale * interactScale);
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Direction indicator triangle with smooth rotation
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#d4c5a0';

        var tipDist = 16;
        var baseDist = 7;
        var halfW = 4;

        // Calculate angle from direction
        var dirAngles = {
            up: -Math.PI / 2,
            down: Math.PI / 2,
            left: Math.PI,
            right: 0
        };

        var prevAngle = dirAngles[prevDirection] || 0;
        var currAngle = dirAngles[direction] || 0;

        // Handle wrap-around for smooth rotation
        var angleDiff = currAngle - prevAngle;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        var finalAngle = prevAngle + angleDiff * directionLerp;

        // Draw triangle at angle
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(finalAngle);

        ctx.beginPath();
        ctx.moveTo(tipDist, 0);
        ctx.lineTo(baseDist, -halfW);
        ctx.lineTo(baseDist, halfW);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        ctx.restore();

        // HP hearts (rendered in screen space offset)
        renderHearts(ctx);

        // Stamina bar
        if (stamina < MAX_STAMINA) {
            renderStaminaBar(ctx);
        }
    }

    function renderHearts(ctx) {
        var heartSize = 8;
        var spacing = 18;
        var startX = 10;
        var startY = 10;

        ctx.save();
        for (var i = 0; i < MAX_HP; i++) {
            var hx = startX + i * spacing;
            var hy = startY;

            if (i < hp) {
                ctx.fillStyle = '#cc4444';
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#cc4444';
            } else {
                ctx.fillStyle = '#442222';
                ctx.shadowBlur = 0;
            }

            // Simple heart shape using two circles and a triangle
            ctx.beginPath();
            ctx.arc(hx - 2, hy - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + 2, hy - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hx - 5, hy);
            ctx.lineTo(hx, hy + 5);
            ctx.lineTo(hx + 5, hy);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    function renderStaminaBar(ctx) {
        var barW = 60;
        var barH = 4;
        var startX = 10;
        var startY = 32;
        var ratio = stamina / MAX_STAMINA;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(startX, startY, barW, barH);

        ctx.fillStyle = stamina > 30 ? '#88ccff' : '#ff8844';
        ctx.fillRect(startX, startY, barW * ratio, barH);

        ctx.strokeStyle = 'rgba(136,204,255,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(startX, startY, barW, barH);
        ctx.restore();
    }

    function getPlayerPos() {
        return { x: px, y: py };
    }

    function getGridPos() {
        return { gx: gx, gy: gy };
    }

    function getDirection() {
        return direction;
    }

    function startMove(dir) {
        if (moving || dashing) return;

        var dx = 0, dy = 0;
        if (dir === 'up') {
            dy = -1;
        } else if (dir === 'down') {
            dy = 1;
        } else if (dir === 'left') {
            dx = -1;
        } else if (dir === 'right') {
            dx = 1;
        } else {
            return;
        }

        // Update direction
        var newDir = dir;
        if (newDir !== direction) {
            prevDirection = direction;
            direction = newDir;
            directionLerp = 0;
        }

        // Try direct move
        if (tryMove(dx, dy)) return;

        // Wall sliding
        if (dx !== 0 && dy !== 0) {
            if (tryMove(dx, 0)) return;
            if (tryMove(0, dy)) return;
        }
    }

    function stopMove() {
        sprinting = false;
        sprintHoldTime = 0;
    }

    function adjustPosition(offX, offY) {
        gx += offX;
        gy += offY;
        targetGx += offX;
        targetGy += offY;
        px += offX * TILE_SIZE;
        py += offY * TILE_SIZE;

        // Shift trail positions
        for (var i = 0; i < trail.length; i++) {
            trail[i].x += offX;
            trail[i].y += offY;
        }
        for (var i = 0; i < footprints.length; i++) {
            footprints[i].x += offX;
            footprints[i].y += offY;
        }
    }

    function setStartPosition(x, y) {
        gx = x;
        gy = y;
        px = gx * TILE_SIZE + TILE_SIZE / 2;
        py = gy * TILE_SIZE + TILE_SIZE / 2;
        targetGx = gx;
        targetGy = gy;
        moving = false;
    }

    function getStamina() { return stamina; }
    function isSprinting() { return sprinting; }
    function getHP() { return hp; }
    function getAnimState() { return animState; }
    function getDashCooldown() { return dashCooldown; }
    function isInvulnerable() { return invulnerable; }

    return {
        init: init,
        handleInput: handleInput,
        update: update,
        render: render,
        getPlayerPos: getPlayerPos,
        getGridPos: getGridPos,
        getDirection: getDirection,
        adjustPosition: adjustPosition,
        startMove: startMove,
        stopMove: stopMove,
        // New API
        getStamina: getStamina,
        isSprinting: isSprinting,
        getHP: getHP,
        takeDamage: takeDamage,
        heal: heal,
        getAnimState: getAnimState,
        tryDash: tryDash,
        getDashCooldown: getDashCooldown,
        isInvulnerable: isInvulnerable,
        interactWithTile: interactWithTile,
        setStartPosition: setStartPosition
    };
})();

// 通向奥秘 - 光照/迷雾系统

var Lighting = (function () {
    var TILE_SIZE = 32;
    var baseRadius = 160;  // 5 tiles * 32px
    var currentRadius = 160;
    var targetRadius = 160;
    var radiusTransitionSpeed = 160; // px per second
    var playerX = 0;
    var playerY = 0;
    var ambientTint = null;
    var ambientColor = null;
    var explored = null;   // 2D boolean array
    var mapCols = 0;
    var mapRows = 0;
    var currentMap = null;

    // Line-of-sight
    var visibleTiles = null; // 2D boolean array
    var losCacheDirty = true;

    // Dynamic light sources
    var dynamicLights = [];
    var nextLightId = 1;

    // Darkness exposure
    var darknessLevel = 0;     // 0 = full light, 1 = max darkness
    var DARKNESS_RATE = 0.05;  // per second in darkness
    var DARKNESS_RECOVERY = 0.15; // per second in light
    var DARKNESS_VISION_PENALTY = 0.5; // max vision reduction

    // Fragment color tints
    var FRAGMENT_TINTS = {
        knowledge: { r: 128, g: 192, b: 255, a: 0.08 },
        love: { r: 255, g: 170, b: 204, a: 0.06 },
        death: { r: 136, g: 68, b: 170, a: 0.08 },
        hope: { r: 170, g: 255, b: 170, a: 0.06 },
        prayer: { r: 255, g: 221, b: 136, a: 0.05 },
        solitude: { r: 102, g: 102, b: 170, a: 0.07 },
        failure: { r: 255, g: 102, b: 68, a: 0.06 },
        prologue: { r: 212, g: 197, b: 160, a: 0.04 }
    };

    // Bloom / glow parameters
    var bloomPass = false;
    var bloomIntensity = 0.3;

    // Weather particles (rendered as part of lighting pass)
    var weatherParticles = [];
    var weatherType = null;
    var weatherConfig = null;

    // Time tracking for animations
    var timeAccum = 0;

    // ---- Bresenham line-of-sight ----
    function bresenhamLine(x0, y0, x1, y1) {
        var points = [];
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = x0 < x1 ? 1 : -1;
        var sy = y0 < y1 ? 1 : -1;
        var err = dx - dy;
        var cx = x0;
        var cy = y0;

        while (true) {
            points.push({ x: cx, y: cy });
            if (cx === x1 && cy === y1) break;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                cx += sx;
            }
            if (e2 < dx) {
                err += dx;
                cy += sy;
            }
        }
        return points;
    }

    function castLOS(startX, startY, endX, endY, grid) {
        var line = bresenhamLine(startX, startY, endX, endY);
        // Check each point on the line (skip the start point)
        for (var i = 1; i < line.length; i++) {
            var p = line[i];
            var tile = MapGenerator.getTile(grid, p.x, p.y);
            // Walls block light
            if (tile === MapGenerator.WALL || tile === MapGenerator.BREAKABLE_WALL) {
                return false;
            }
        }
        return true;
    }

    function computeVisibility() {
        if (!currentMap || !explored) return;

        var pgx = Math.floor(playerX / TILE_SIZE);
        var pgy = Math.floor(playerY / TILE_SIZE);

        var tileRadius = Math.ceil(currentRadius / TILE_SIZE) + 1;

        // Initialize visible tiles array
        if (!visibleTiles || visibleTiles.length !== mapRows) {
            visibleTiles = [];
            for (var y = 0; y < mapRows; y++) {
                visibleTiles[y] = [];
                for (var x = 0; x < mapCols; x++) {
                    visibleTiles[y][x] = false;
                }
            }
        }

        // Clear visible tiles
        for (var y = 0; y < mapRows; y++) {
            for (var x = 0; x < mapCols; x++) {
                visibleTiles[y][x] = false;
            }
        }

        // Cast rays in all directions
        var numRays = 180; // every 2 degrees
        var step = (Math.PI * 2) / numRays;
        var r2 = currentRadius * currentRadius;

        for (var r = 0; r < numRays; r++) {
            var angle = r * step;
            var dx = Math.cos(angle);
            var dy = Math.sin(angle);

            // Walk along ray, one tile at a time
            for (var dist = 0; dist <= tileRadius; dist++) {
                var tx = pgx + Math.round(dx * dist);
                var ty = pgy + Math.round(dy * dist);

                if (tx < 0 || tx >= mapCols || ty < 0 || ty >= mapRows) break;

                var tcx = tx * TILE_SIZE + TILE_SIZE / 2;
                var tcy = ty * TILE_SIZE + TILE_SIZE / 2;
                var ddx = tcx - playerX;
                var ddy = tcy - playerY;
                if (ddx * ddx + ddy * ddy > r2) break;

                visibleTiles[ty][tx] = true;
                explored[ty][tx] = true;

                // Stop ray at walls
                var tile = MapGenerator.getTile(currentMap, tx, ty);
                if (tile === MapGenerator.WALL || tile === MapGenerator.BREAKABLE_WALL) {
                    break;
                }
            }
        }

        losCacheDirty = false;
    }

    // ---- Dynamic Light Sources ----
    function addLight(x, y, radius, color, flicker) {
        var id = nextLightId++;
        dynamicLights.push({
            id: id,
            x: x,
            y: y,
            radius: radius || 64,
            color: color || '#ffaa44',
            flicker: flicker || false,
            phase: Math.random() * Math.PI * 2,
            active: true
        });
        return id;
    }

    function removeLight(id) {
        for (var i = 0; i < dynamicLights.length; i++) {
            if (dynamicLights[i].id === id) {
                dynamicLights.splice(i, 1);
                return;
            }
        }
    }

    function updateDynamicLights(dt) {
        for (var i = 0; i < dynamicLights.length; i++) {
            var light = dynamicLights[i];
            light.phase += dt * 4; // flicker speed
        }
    }

    function renderDynamicLights(ctx) {
        for (var i = 0; i < dynamicLights.length; i++) {
            var light = dynamicLights[i];
            if (!light.active) continue;

            var r = light.radius;
            if (light.flicker) {
                // Flicker: ±15% radius oscillation
                var flickerMod = 1.0 + 0.15 * Math.sin(light.phase) + 0.05 * Math.sin(light.phase * 2.7);
                r = r * flickerMod;
            }

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            var gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, r
            );
            // Parse color for gradient
            var baseColor = parseColor(light.color);
            gradient.addColorStop(0, 'rgba(' + baseColor.r + ',' + baseColor.g + ',' + baseColor.b + ',0.3)');
            gradient.addColorStop(0.5, 'rgba(' + baseColor.r + ',' + baseColor.g + ',' + baseColor.b + ',0.15)');
            gradient.addColorStop(1, 'rgba(' + baseColor.r + ',' + baseColor.g + ',' + baseColor.b + ',0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(light.x, light.y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    function parseColor(color) {
        // Simple hex parser
        if (color.charAt(0) === '#') {
            var hex = color.substring(1);
            if (hex.length === 3) {
                return {
                    r: parseInt(hex.charAt(0) + hex.charAt(0), 16),
                    g: parseInt(hex.charAt(1) + hex.charAt(1), 16),
                    b: parseInt(hex.charAt(2) + hex.charAt(2), 16)
                };
            } else if (hex.length === 6) {
                return {
                    r: parseInt(hex.substring(0, 2), 16),
                    g: parseInt(hex.substring(2, 4), 16),
                    b: parseInt(hex.substring(4, 6), 16)
                };
            }
        }
        return { r: 255, g: 170, b: 68 };
    }

    // ---- Fragment Tint Blending ----
    function renderFragmentTints(ctx) {
        if (typeof Items === 'undefined') return;

        var collected = Items.getCollected();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (var i = 0; i < collected.length; i++) {
            var tint = FRAGMENT_TINTS[collected[i]];
            if (!tint) continue;

            var gradient = ctx.createRadialGradient(
                playerX, playerY, 0,
                playerX, playerY, currentRadius
            );
            gradient.addColorStop(0, 'rgba(' + tint.r + ',' + tint.g + ',' + tint.b + ',' + tint.a + ')');
            gradient.addColorStop(0.6, 'rgba(' + tint.r + ',' + tint.g + ',' + tint.b + ',' + (tint.a * 0.5) + ')');
            gradient.addColorStop(1, 'rgba(' + tint.r + ',' + tint.g + ',' + tint.b + ',0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(playerX, playerY, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // ---- Bloom / Glow Post-Processing ----
    function renderPostEffects(ctx) {
        if (!bloomPass) return;

        var w = ctx.canvas.width;
        var h = ctx.canvas.height;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = bloomIntensity;
        ctx.filter = 'blur(8px)';

        // Re-draw bright spots with blur for glow effect
        // Exit beacon glow
        if (currentMap) {
            for (var y = 0; y < mapRows; y++) {
                for (var x = 0; x < mapCols; x++) {
                    var tile = MapGenerator.getTile(currentMap, x, y);
                    var px = x * TILE_SIZE + TILE_SIZE / 2;
                    var py = y * TILE_SIZE + TILE_SIZE / 2;

                    if (tile === MapGenerator.EXIT) {
                        var gradient = ctx.createRadialGradient(px, py, 0, px, py, 40);
                        gradient.addColorStop(0, 'rgba(212,197,160,0.5)');
                        gradient.addColorStop(1, 'rgba(212,197,160,0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(px - 40, py - 40, 80, 80);
                    } else if (tile === MapGenerator.CRYSTAL) {
                        var gradient2 = ctx.createRadialGradient(px, py, 0, px, py, 30);
                        gradient2.addColorStop(0, 'rgba(100,200,255,0.4)');
                        gradient2.addColorStop(1, 'rgba(100,200,255,0)');
                        ctx.fillStyle = gradient2;
                        ctx.fillRect(px - 30, py - 30, 60, 60);
                    } else if (tile === MapGenerator.TORCH) {
                        var gradient3 = ctx.createRadialGradient(px, py, 0, px, py, 50);
                        gradient3.addColorStop(0, 'rgba(255,170,68,0.4)');
                        gradient3.addColorStop(1, 'rgba(255,170,68,0)');
                        ctx.fillStyle = gradient3;
                        ctx.fillRect(px - 50, py - 50, 100, 100);
                    }
                }
            }
        }

        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ---- Weather Particles ----
    var WEATHER_CONFIGS = {
        rain: { count: 60, vy: 200, vx: 20, life: 1.5, size: 1.5, color: 'rgba(150,180,220,0.4)' },
        snow: { count: 30, vy: 40, vx: 10, life: 5, size: 2, color: 'rgba(220,230,255,0.5)' },
        dust: { count: 20, vy: -10, vx: 15, life: 4, size: 1, color: 'rgba(180,160,120,0.3)' },
        fireflies: { count: 15, vy: 0, vx: 0, life: 6, size: 2.5, color: 'rgba(200,255,100,0.6)' },
        fog: { count: 10, vy: -5, vx: 8, life: 8, size: 40, color: 'rgba(150,150,170,0.08)' }
    };

    function initWeather(type) {
        weatherType = type;
        weatherConfig = WEATHER_CONFIGS[type] || null;
        weatherParticles = [];
    }

    function updateWeather(dt) {
        if (!weatherConfig) return;

        // Spawn particles
        var w = (typeof Engine !== 'undefined' && Engine.getCanvas()) ? Engine.getCanvas().width : 375;
        var h = (typeof Engine !== 'undefined' && Engine.getCanvas()) ? Engine.getCanvas().height : 600;

        while (weatherParticles.length < weatherConfig.count) {
            var p = {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (weatherConfig.vx > 0 ? (Math.random() - 0.5) * weatherConfig.vx * 2 : 0) + weatherConfig.vx,
                vy: weatherConfig.vy + (Math.random() - 0.5) * Math.abs(weatherConfig.vy) * 0.5,
                life: weatherConfig.life + (Math.random() - 0.5) * 2,
                maxLife: weatherConfig.life,
                size: weatherConfig.size + (Math.random() - 0.5) * weatherConfig.size * 0.5
            };
            // Fireflies: random wandering
            if (weatherType === 'fireflies') {
                p.vx = (Math.random() - 0.5) * 30;
                p.vy = (Math.random() - 0.5) * 30;
                p.phase = Math.random() * Math.PI * 2;
            }
            weatherParticles.push(p);
        }

        // Update
        for (var i = weatherParticles.length - 1; i >= 0; i--) {
            var p = weatherParticles[i];
            p.life -= dt;

            if (weatherType === 'fireflies') {
                p.phase += dt * 2;
                p.vx += (Math.random() - 0.5) * 60 * dt;
                p.vy += (Math.random() - 0.5) * 60 * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.life <= 0 || p.y > h + 20 || p.y < -20 || p.x < -20 || p.x > w + 20) {
                // Respawn
                p.x = Math.random() * w;
                p.y = (weatherConfig.vy > 0) ? -10 : h + 10;
                p.life = weatherConfig.life + (Math.random() - 0.5) * 2;
                p.maxLife = p.life;
                if (weatherType === 'fireflies') {
                    p.y = Math.random() * h;
                }
            }
        }
    }

    function renderWeather(ctx) {
        if (!weatherConfig) return;

        ctx.save();
        ctx.fillStyle = weatherConfig.color;

        for (var i = 0; i < weatherParticles.length; i++) {
            var p = weatherParticles[i];
            var alpha = Math.min(1, p.life / p.maxLife);

            ctx.globalAlpha = alpha;

            if (weatherType === 'rain') {
                ctx.fillRect(p.x, p.y, 1, p.size * 4);
            } else if (weatherType === 'fog') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (weatherType === 'fireflies') {
                var glow = 0.5 + 0.5 * Math.sin(p.phase);
                ctx.globalAlpha = alpha * glow;
                ctx.shadowBlur = 6;
                ctx.shadowColor = weatherConfig.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // ---- Explored Map Overlay ----
    function renderExploredOverlay(ctx) {
        if (!explored || !currentMap) return;

        var startCol = 0;
        var endCol = mapCols;
        var startRow = 0;
        var endRow = mapRows;

        // If camera info available, cull
        if (typeof Engine !== 'undefined' && Engine.getViewRect) {
            var vr = Engine.getViewRect();
            startCol = Math.max(0, Math.floor(vr.x / TILE_SIZE));
            endCol = Math.min(mapCols, Math.ceil((vr.x + vr.w) / TILE_SIZE) + 1);
            startRow = Math.max(0, Math.floor(vr.y / TILE_SIZE));
            endRow = Math.min(mapRows, Math.ceil((vr.y + vr.h) / TILE_SIZE) + 1);
        }

        ctx.save();
        ctx.globalAlpha = 0.15;

        for (var y = startRow; y < endRow; y++) {
            for (var x = startCol; x < endCol; x++) {
                if (!explored[y] || !explored[y][x]) continue;
                if (visibleTiles && visibleTiles[y] && visibleTiles[y][x]) continue; // skip currently visible

                var tile = MapGenerator.getTile(currentMap, x, y);
                if (tile === MapGenerator.WALL) {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    // Wall outline
                    ctx.strokeStyle = 'rgba(60,60,60,0.5)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (tile !== MapGenerator.WALL) {
                    // Show path as very faint
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        ctx.restore();
    }

    // ---- Darkness Exposure ----
    function updateDarknessExposure(dt) {
        var pgx = Math.floor(playerX / TILE_SIZE);
        var pgy = Math.floor(playerY / TILE_SIZE);

        // Check if player is near a torch or other light source
        var nearLight = dynamicLights.length > 0;
        if (!nearLight && currentMap) {
            // Check adjacent tiles for torches
            for (var dy = -2; dy <= 2; dy++) {
                for (var dx = -2; dx <= 2; dx++) {
                    var tx = pgx + dx;
                    var ty = pgy + dy;
                    if (tx >= 0 && tx < mapCols && ty >= 0 && ty < mapRows) {
                        var tile = MapGenerator.getTile(currentMap, tx, ty);
                        if (tile === MapGenerator.TORCH) {
                            nearLight = true;
                            break;
                        }
                    }
                }
                if (nearLight) break;
            }
        }

        if (nearLight) {
            darknessLevel -= DARKNESS_RECOVERY * dt;
        } else {
            darknessLevel += DARKNESS_RATE * dt;
        }

        if (darknessLevel < 0) darknessLevel = 0;
        if (darknessLevel > 1) darknessLevel = 1;
    }

    function getDarknessLevel() {
        return darknessLevel;
    }

    // ---- Main Functions ----
    function init(levelConfig) {
        if (levelConfig && levelConfig.theme && levelConfig.theme.lightRadius) {
            baseRadius = levelConfig.theme.lightRadius;
        } else {
            baseRadius = 160;
        }
        currentRadius = baseRadius;
        targetRadius = baseRadius;

        if (levelConfig && levelConfig.theme && levelConfig.theme.ambientTint) {
            ambientTint = levelConfig.theme.ambientTint;
        } else {
            ambientTint = null;
        }

        dynamicLights = [];
        nextLightId = 1;
        darknessLevel = 0;
        timeAccum = 0;

        // Initialize weather
        if (typeof Levels !== 'undefined' && Levels.getWeather) {
            var weather = Levels.getWeather();
            if (weather) {
                initWeather(weather);
            } else {
                weatherType = null;
                weatherConfig = null;
                weatherParticles = [];
            }
        }

        bloomPass = true;
    }

    function initExplored(cols, rows) {
        mapCols = cols;
        mapRows = rows;
        explored = [];
        for (var y = 0; y < rows; y++) {
            explored[y] = [];
            for (var x = 0; x < cols; x++) {
                explored[y][x] = false;
            }
        }

        visibleTiles = [];
        for (var y = 0; y < rows; y++) {
            visibleTiles[y] = [];
            for (var x = 0; x < cols; x++) {
                visibleTiles[y][x] = false;
            }
        }

        // If player has Ancient Map artifact, reveal 20%
        if (typeof Items !== 'undefined' && Items.hasArtifact && Items.hasArtifact('ancient_map')) {
            var totalPath = 0;
            // Count passable tiles
            if (currentMap) {
                var pathTiles = [];
                for (var y = 0; y < rows; y++) {
                    for (var x = 0; x < cols; x++) {
                        var tile = MapGenerator.getTile(currentMap, x, y);
                        if (tile !== MapGenerator.WALL) {
                            pathTiles.push({ x: x, y: y });
                            totalPath++;
                        }
                    }
                }
                var revealCount = Math.floor(totalPath * 0.2);
                for (var i = 0; i < revealCount && i < pathTiles.length; i++) {
                    var idx = Math.floor(Math.random() * pathTiles.length);
                    explored[pathTiles[idx].y][pathTiles[idx].x] = true;
                }
            }
        }
    }

    function update(playerPos) {
        if (playerPos) {
            playerX = playerPos.x;
            playerY = playerPos.y;
        }

        // Smooth radius transition
        if (currentRadius !== targetRadius) {
            var diff = targetRadius - currentRadius;
            var step = radiusTransitionSpeed * (1 / 60); // approximate dt
            if (Math.abs(diff) < step) {
                currentRadius = targetRadius;
            } else {
                currentRadius += (diff > 0 ? step : -step);
            }
        }

        // Apply fragment-based modifiers
        targetRadius = baseRadius;
        if (typeof Items !== 'undefined') {
            if (Items.hasElement('knowledge')) targetRadius *= 1.3;
            if (Items.hasElement('failure')) targetRadius *= 0.8;
            if (Items.hasElement('hope')) targetRadius *= 1.2;
            if (Items.hasElement('death')) targetRadius *= 0.7;

            // Light potion effect
            if (Items.getActiveEffects) {
                var effects = Items.getActiveEffects();
                for (var i = 0; i < effects.length; i++) {
                    if (effects[i].type === 'light_boost') {
                        targetRadius *= 1.5;
                    }
                }
            }

            // Lantern of Shadows artifact
            if (Items.hasArtifact && Items.hasArtifact('lantern_shadows')) {
                targetRadius *= 1.2;
            }
        }

        // Darkness exposure penalty
        targetRadius *= (1 - darknessLevel * DARKNESS_VISION_PENALTY);

        // Compute line-of-sight visibility
        computeVisibility();

        // Update dynamic lights
        updateDynamicLights(1 / 60);

        // Update weather
        updateWeather(1 / 60);

        // Update darkness exposure
        updateDarknessExposure(1 / 60);

        timeAccum += 1 / 60;
    }

    function render(ctx, screenPX, screenPY) {
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        var px = (typeof screenPX === 'number') ? screenPX : playerX;
        var py = (typeof screenPY === 'number') ? screenPY : playerY;

        // Render explored-but-not-visible overlay (dim outlines of previous areas)
        // This is rendered in world space, needs camera transform
        // Called separately via updateExploredOverlay

        // Layer 1: Deep dark overlay for explored-but-not-visible areas
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, h);

        // Cut out explored areas with dim visibility
        ctx.globalCompositeOperation = 'destination-out';
        var dimGradient = ctx.createRadialGradient(
            px, py, currentRadius * 0.15,
            px, py, currentRadius * 0.4
        );
        dimGradient.addColorStop(0, 'rgba(0,0,0,0.6)');
        dimGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dimGradient;
        ctx.beginPath();
        ctx.arc(px, py, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Layer 2: Full black overlay, cut out bright circle
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'destination-out';

        var gradient = ctx.createRadialGradient(
            px, py, currentRadius * 0.6,
            px, py, currentRadius
        );
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Layer 3: Dynamic light sources
        renderDynamicLights(ctx);

        // Layer 4: Fragment color tints
        renderFragmentTints(ctx);

        // Layer 5: Ambient tint
        if (ambientTint) {
            ctx.save();
            ctx.fillStyle = ambientTint;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // Layer 6: Ambient color
        if (ambientColor) {
            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = ambientColor;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // Layer 7: Weather effects
        renderWeather(ctx);

        // Layer 8: Bloom post-processing
        renderPostEffects(ctx);
    }

    // ---- Setters / Getters ----
    function setRadius(r) {
        currentRadius = r;
        targetRadius = r;
    }

    function getRadius() {
        return currentRadius;
    }

    function getEffectiveRadius() {
        return currentRadius;
    }

    function setAmbientColor(color) {
        ambientColor = color;
    }

    function getVisibleTiles() {
        return visibleTiles;
    }

    function isTileVisible(x, y) {
        if (!visibleTiles) return false;
        if (y < 0 || y >= mapRows || x < 0 || x >= mapCols) return false;
        return visibleTiles[y][x];
    }

    function isExplored(x, y) {
        if (!explored) return false;
        if (y < 0 || y >= mapRows || x < 0 || x >= mapCols) return false;
        return explored[y][x];
    }

    function revealAll() {
        if (explored && mapCols > 0) {
            for (var y = 0; y < mapRows; y++) {
                for (var x = 0; x < mapCols; x++) {
                    explored[y][x] = true;
                }
            }
        }
    }

    function expandExplored(newCols, newRows, offX, offY) {
        var newExplored = [];
        var newVisible = [];
        for (var y = 0; y < newRows; y++) {
            newExplored[y] = [];
            newVisible[y] = [];
            for (var x = 0; x < newCols; x++) {
                newExplored[y][x] = false;
                newVisible[y][x] = false;
            }
        }
        // Copy old explored data with offset
        for (var y = 0; y < mapRows; y++) {
            for (var x = 0; x < mapCols; x++) {
                newExplored[y + offY][x + offX] = explored[y][x];
                if (visibleTiles) {
                    newVisible[y + offY][x + offX] = visibleTiles[y][x];
                }
            }
        }
        explored = newExplored;
        visibleTiles = newVisible;
        mapCols = newCols;
        mapRows = newRows;
    }

    function smoothRadiusTransition(target, duration) {
        radiusTransitionSpeed = Math.abs(target - currentRadius) / (duration || 1);
        targetRadius = target;
    }

    function updateExploredOverlay(ctx) {
        renderExploredOverlay(ctx);
    }

    function renderPostEffectsExternal(ctx) {
        renderPostEffects(ctx);
    }

    function setMap(mapRef) {
        currentMap = mapRef;
    }

    return {
        init: init,
        initExplored: initExplored,
        update: update,
        render: render,
        setRadius: setRadius,
        getRadius: getRadius,
        getEffectiveRadius: getEffectiveRadius,
        isExplored: isExplored,
        revealAll: revealAll,
        expandExplored: expandExplored,
        setMap: setMap,
        // New API
        addLight: addLight,
        removeLight: removeLight,
        setAmbientColor: setAmbientColor,
        getVisibleTiles: getVisibleTiles,
        isTileVisible: isTileVisible,
        getDarknessLevel: getDarknessLevel,
        updateExploredOverlay: updateExploredOverlay,
        renderPostEffects: renderPostEffectsExternal,
        smoothRadiusTransition: smoothRadiusTransition
    };
})();

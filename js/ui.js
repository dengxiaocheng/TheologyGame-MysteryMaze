// 通向奥秘 - UI 模块（增强版）

var UI = (function () {
    var TILE_SIZE = 32;
    var levelName = '序章';
    var levelSubtitle = '';

    // Pickup notification state
    var pickupText = '';
    var pickupAlpha = 0;
    var pickupTimer = 0;

    // Interaction hint state
    var interactHintVisible = false;
    var hintBlinkPhase = 0;

    // Element colors for HUD dots
    var ELEMENT_COLORS = {
        prologue: '#d4c5a0',
        knowledge: '#c0c0ff',
        failure: '#ff6666',
        solitude: '#6666aa',
        love: '#ff88aa',
        prayer: '#ffffaa',
        death: '#aa66aa',
        hope: '#88ff88'
    };

    // --- HP / Stamina system ---
    var hp = 5;
    var maxHp = 5;
    var stamina = 100;
    var maxStamina = 100;
    var dashCooldown = 0;
    var DASH_COOLDOWN_MAX = 3;

    // --- Active effects ---
    var activeEffects = []; // [{id, name, icon, timer, maxTimer}]

    // --- Notification queue ---
    var notifications = []; // [{text, type, timer, alpha}]
    var MAX_NOTIFICATIONS = 3;
    var NOTIFICATION_DURATION = 3;

    // --- Tooltip system ---
    var tooltip = {
        visible: false,
        text: '',
        x: 0,
        y: 0,
        alpha: 0,
        timer: 0
    };

    // --- Pause menu ---
    var paused = false;
    var pauseSelection = 0;
    var PAUSE_OPTIONS = ['继续游戏', '操作说明', '退出关卡'];
    var showControls = false;

    // --- Compass ---
    var compassActive = false;
    var compassAngle = 0;

    // --- Inventory panel ---
    var inventoryOpen = false;
    var inventoryScroll = 0;

    // --- Flash effect ---
    var flashAlpha = 0;
    var flashColor = '#fff';

    function init() {
        levelName = '序章';
        levelSubtitle = '';
        pickupText = '';
        pickupAlpha = 0;
        pickupTimer = 0;
        interactHintVisible = false;
        hp = maxHp;
        stamina = maxStamina;
        dashCooldown = 0;
        activeEffects = [];
        notifications = [];
        tooltip.visible = false;
        paused = false;
        pauseSelection = 0;
        showControls = false;
        compassActive = false;
        compassAngle = 0;
        inventoryOpen = false;
        inventoryScroll = 0;
        flashAlpha = 0;
        flashColor = '#fff';
    }

    function update(dt) {
        if (pickupTimer > 0) {
            pickupTimer -= dt;
            if (pickupTimer <= 0.5) {
                pickupAlpha = pickupTimer / 0.5;
            }
            if (pickupTimer <= 0) {
                pickupAlpha = 0;
                pickupText = '';
            }
        }
        hintBlinkPhase += dt * 3;

        // Stamina regen
        if (stamina < maxStamina) {
            stamina = Math.min(maxStamina, stamina + dt * 20);
        }

        // Dash cooldown
        if (dashCooldown > 0) {
            dashCooldown = Math.max(0, dashCooldown - dt);
        }

        // Active effects tick
        for (var i = activeEffects.length - 1; i >= 0; i--) {
            activeEffects[i].timer -= dt;
            if (activeEffects[i].timer <= 0) {
                activeEffects.splice(i, 1);
            }
        }

        // Notifications tick
        for (var j = notifications.length - 1; j >= 0; j--) {
            notifications[j].timer -= dt;
            if (notifications[j].timer <= 0.5) {
                notifications[j].alpha = notifications[j].timer / 0.5;
            }
            if (notifications[j].timer <= 0) {
                notifications.splice(j, 1);
            }
        }

        // Tooltip fade
        if (tooltip.visible) {
            tooltip.alpha = Math.min(1, tooltip.alpha + dt * 4);
        } else {
            tooltip.alpha = Math.max(0, tooltip.alpha - dt * 4);
        }

        // Flash fade
        if (flashAlpha > 0) {
            flashAlpha = Math.max(0, flashAlpha - dt * 3);
        }

        // Compass angle update
        updateCompass(dt);
    }

    function render(ctx) {
        var cw = ctx.canvas.width;
        var ch = ctx.canvas.height;
        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;

        // Dark bar at top
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, cw, 44);

        // --- Fragment count (left side) ---
        var fragmentCount = (typeof Items !== 'undefined') ? Items.getCollected().length : 0;
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(16 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('碎片: ' + fragmentCount + '/8', 12, 18);

        // Collected element dots
        var collected = [];
        if (typeof Items !== 'undefined') {
            collected = Items.getCollected();
        }
        var dotX = 12 + ctx.measureText('碎片: ' + fragmentCount + '/8').width + 10;
        for (var i = 0; i < collected.length; i++) {
            var color = ELEMENT_COLORS[collected[i]] || '#d4c5a0';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(dotX + i * 12, 18, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- HP Hearts ---
        var heartStartX = 12;
        var heartY = 36;
        for (var h = 0; h < maxHp; h++) {
            drawHeart(ctx, heartStartX + h * 16, heartY, 6, h < hp ? '#ff4444' : '#442222');
        }

        // --- Stamina bar ---
        var stamBarX = heartStartX + maxHp * 16 + 10;
        var stamBarW = 60;
        var stamBarH = 6;
        ctx.fillStyle = '#222';
        ctx.fillRect(stamBarX, heartY - 3, stamBarW, stamBarH);
        var stamFill = stamina / maxStamina;
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(stamBarX, heartY - 3, stamBarW * stamFill, stamBarH);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(stamBarX, heartY - 3, stamBarW, stamBarH);

        // --- Dash cooldown indicator ---
        if (dashCooldown > 0) {
            var cdPct = dashCooldown / DASH_COOLDOWN_MAX;
            ctx.fillStyle = '#555';
            ctx.font = Math.round(10 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.fillText('闪: ' + Math.ceil(dashCooldown) + 's', stamBarX + stamBarW + 6, heartY);
        }

        // --- Active effect icons ---
        var effX = stamBarX + stamBarW + 60;
        for (var ei = 0; ei < activeEffects.length; ei++) {
            var eff = activeEffects[ei];
            var effAlpha = Math.min(1, eff.timer);
            ctx.save();
            ctx.globalAlpha = effAlpha;
            ctx.fillStyle = eff.icon || '#aa88ff';
            ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.fillText(eff.name, effX, heartY);
            // Mini timer bar
            ctx.fillStyle = '#333';
            ctx.fillRect(effX, heartY + 4, 30, 2);
            ctx.fillStyle = eff.icon || '#aa88ff';
            ctx.fillRect(effX, heartY + 4, 30 * (eff.timer / eff.maxTimer), 2);
            ctx.restore();
            effX += 40;
        }

        // --- Key count ---
        if (typeof Items !== 'undefined') {
            var keyCount = Items.getKeys().length;
            if (keyCount > 0) {
                var keyTextX = 12 + ctx.measureText('碎片: ' + fragmentCount + '/8').width + collected.length * 12 + 20;
                ctx.fillStyle = '#ffd700';
                ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
                ctx.textAlign = 'left';
                ctx.fillText('钥匙: ' + keyCount, keyTextX, 18);
            }
        }

        // --- Level name + subtitle (right side) ---
        ctx.fillStyle = '#888';
        ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'right';
        ctx.fillText(levelName, cw - 12, 14);
        if (levelSubtitle) {
            ctx.fillStyle = '#555';
            ctx.font = Math.round(11 * fs) + 'px "Noto Serif SC", serif';
            ctx.fillText(levelSubtitle, cw - 12, 30);
        }

        // --- Pickup notification ---
        if (pickupAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = pickupAlpha;
            ctx.fillStyle = '#d4c5a0';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('获得碎片：' + pickupText, cw / 2, 62);
            ctx.restore();
        }

        // --- Interaction hint ---
        if (interactHintVisible) {
            var hintAlpha = (Math.sin(hintBlinkPhase) * 0.3) + 0.7;
            ctx.save();
            ctx.globalAlpha = hintAlpha;
            ctx.fillStyle = '#d4c5a0';
            ctx.font = Math.round(13 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var hintText = (typeof Engine !== 'undefined' && Engine.isMobile) ? '点击交互按钮' : '按 E 交互';
            ctx.fillText(hintText, cw / 2, ch - 80);
            ctx.restore();
        }

        // --- Minimap (top-right, below level name) ---
        renderMinimap(ctx);

        // --- Compass ---
        if (compassActive) {
            renderCompass(ctx, cw, ch, fs);
        }

        // --- Notifications ---
        renderNotifications(ctx, cw, fs);

        // --- Tooltip ---
        if (tooltip.alpha > 0) {
            renderTooltip(ctx, fs);
        }

        // --- Inventory panel ---
        if (inventoryOpen) {
            renderInventory(ctx, cw, ch, fs);
        }

        // --- Pause menu ---
        if (paused) {
            renderPauseMenu(ctx, cw, ch, fs);
        }

        // --- Flash overlay ---
        if (flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = flashColor;
            ctx.fillRect(0, 0, cw, ch);
            ctx.restore();
        }

        // Reset
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    // ========================
    // Minimap
    // ========================
    function renderMinimap(ctx) {
        if (typeof Lighting === 'undefined' || typeof MapGenerator === 'undefined') return;
        if (typeof Engine === 'undefined') return;

        var map = Engine.getMap();
        if (!map) return;

        var cols = map[0].length;
        var rows = map.length;
        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;
        var mmW = Math.round(120 * fs);
        var mmH = Math.round(80 * fs);
        var mmX = ctx.canvas.width - mmW - 8;
        var mmY = 48;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mmX, mmY, mmW, mmH);
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(mmX, mmY, mmW, mmH);

        var scaleX = mmW / cols;
        var scaleY = mmH / rows;

        var pgx = -1, pgy = -1;
        if (typeof Player !== 'undefined') {
            var gp = Player.getGridPos();
            pgx = gp.gx;
            pgy = gp.gy;
        }

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (!Lighting.isExplored(x, y)) continue;

                var tile = MapGenerator.getTile(map, x, y);
                var px = mmX + x * scaleX;
                var py = mmY + y * scaleY;

                switch (tile) {
                    case 0: ctx.fillStyle = '#1a1a1a'; break;
                    case 1: ctx.fillStyle = '#555'; break;
                    case 2: ctx.fillStyle = '#6b4c2a'; break;
                    case 3: ctx.fillStyle = '#4444aa'; break;
                    case 4: ctx.fillStyle = '#d4c5a0'; break;
                    case 5: ctx.fillStyle = '#555'; break;
                    case 6:
                        var hasFailure = (typeof Items !== 'undefined') && Items.hasElement('failure');
                        ctx.fillStyle = hasFailure ? '#555' : '#1a1a1a';
                        break;
                    default: ctx.fillStyle = '#1a1a1a'; break;
                }
                ctx.fillRect(px, py, Math.max(scaleX, 1), Math.max(scaleY, 1));
            }
        }

        // NPC markers on minimap
        if (typeof NPC !== 'undefined') {
            var npcs = NPC.getNpcs();
            for (var ni = 0; ni < npcs.length; ni++) {
                var npc = npcs[ni];
                if (Lighting.isExplored(npc.gx, npc.gy)) {
                    var npx = mmX + npc.gx * scaleX + scaleX / 2;
                    var npy = mmY + npc.gy * scaleY + scaleY / 2;
                    ctx.fillStyle = '#88ccff';
                    ctx.beginPath();
                    ctx.arc(npx, npy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Chest markers on minimap (rendered via Items if available)
        // Chests are tracked internally by Items module; skip if API not exposed

        // Player dot (pulsing)
        if (pgx >= 0) {
            var pulse = Math.sin(hintBlinkPhase * 2) * 1 + 3;
            var ppx = mmX + pgx * scaleX + scaleX / 2;
            var ppy = mmY + pgy * scaleY + scaleY / 2;
            ctx.fillStyle = '#d4c5a0';
            ctx.beginPath();
            ctx.arc(ppx, ppy, pulse, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ========================
    // Compass
    // ========================
    function updateCompass(dt) {
        if (!compassActive) return;
        if (typeof Engine === 'undefined' || typeof Player === 'undefined') return;

        var map = Engine.getMap();
        if (!map) return;

        // Find exit tile
        var exitX = -1, exitY = -1;
        for (var y = 0; y < map.length; y++) {
            for (var x = 0; x < map[0].length; x++) {
                if (map[y][x] === 4) {
                    exitX = x;
                    exitY = y;
                }
            }
        }
        if (exitX < 0) return;

        var gp = Player.getGridPos();
        var dx = exitX - gp.gx;
        var dy = exitY - gp.gy;
        var targetAngle = Math.atan2(dy, dx);

        // Smooth rotation
        var diff = targetAngle - compassAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        compassAngle += diff * dt * 4;
    }

    function renderCompass(ctx, cw, ch, fs) {
        var cx = cw - 40;
        var cy = ch - 50;
        var r = 18;

        // Background circle
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Arrow pointing to exit
        ctx.translate(cx, cy);
        ctx.rotate(compassAngle);

        ctx.fillStyle = '#d4c5a0';
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // ========================
    // Notifications
    // ========================
    function renderNotifications(ctx, cw, fs) {
        for (var i = 0; i < notifications.length; i++) {
            var n = notifications[i];
            var ny = 80 + i * 28;
            ctx.save();
            ctx.globalAlpha = n.alpha || 1;

            var bgColor = 'rgba(10,10,20,0.8)';
            if (n.type === 'quest') bgColor = 'rgba(20,20,50,0.85)';
            else if (n.type === 'damage') bgColor = 'rgba(50,10,10,0.85)';
            else if (n.type === 'heal') bgColor = 'rgba(10,50,10,0.85)';
            else if (n.type === 'effect') bgColor = 'rgba(40,20,60,0.85)';

            var tw = ctx.measureText(n.text).width + 20;
            var nx = (cw - tw) / 2;
            ctx.fillStyle = bgColor;
            ctx.fillRect(nx, ny - 10, tw, 22);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(nx, ny - 10, tw, 22);

            var textColor = '#d4c5a0';
            if (n.type === 'damage') textColor = '#ff6666';
            else if (n.type === 'heal') textColor = '#66ff66';
            else if (n.type === 'effect') textColor = '#cc88ff';
            else if (n.type === 'quest') textColor = '#88ccff';

            ctx.fillStyle = textColor;
            ctx.font = Math.round(13 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.text, cw / 2, ny + 1);
            ctx.restore();
        }
    }

    // ========================
    // Tooltip
    // ========================
    function renderTooltip(ctx, fs) {
        if (!tooltip.text) return;

        ctx.save();
        ctx.globalAlpha = tooltip.alpha;

        var tw = ctx.measureText(tooltip.text).width + 16;
        var th = 24;
        var tx = tooltip.x;
        var ty = tooltip.y - th - 5;

        // Keep on screen
        var cw = ctx.canvas.width;
        if (tx + tw > cw - 8) tx = cw - tw - 8;
        if (tx < 8) tx = 8;
        if (ty < 4) ty = tooltip.y + 20;

        ctx.fillStyle = 'rgba(10,10,20,0.92)';
        ctx.fillRect(tx, ty, tw, th);
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tw, th);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltip.text, tx + 8, ty + th / 2);

        ctx.restore();
    }

    // ========================
    // Inventory Panel
    // ========================
    function renderInventory(ctx, cw, ch, fs) {
        var invW = Math.min(360, cw * 0.8);
        var invH = Math.min(400, ch * 0.7);
        var invX = (cw - invW) / 2;
        var invY = (ch - invH) / 2;

        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, cw, ch);

        // Panel background
        ctx.fillStyle = 'rgba(10,10,20,0.95)';
        ctx.fillRect(invX, invY, invW, invH);
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 2;
        ctx.strokeRect(invX, invY, invW, invH);

        // Title
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(20 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('背包', invX + invW / 2, invY + 25);

        // Separator
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(invX + 15, invY + 42);
        ctx.lineTo(invX + invW - 15, invY + 42);
        ctx.stroke();

        // Items list
        var items = [];
        if (typeof Items !== 'undefined') {
            var collected = Items.getCollected();
            for (var i = 0; i < collected.length; i++) {
                items.push({ name: collected[i], type: 'fragment', color: ELEMENT_COLORS[collected[i]] || '#d4c5a0' });
            }
            var keys = Items.getKeys();
            for (var k = 0; k < keys.length; k++) {
                items.push({ name: keys[k], type: 'key', color: '#ffd700' });
            }
        }

        // Quest list
        if (typeof NPC !== 'undefined') {
            var quests = NPC.getActiveQuests();
            for (var qi = 0; qi < quests.length; qi++) {
                items.push({ name: quests[qi].name || quests[qi].id, type: 'quest', color: '#88ccff' });
            }
        }

        var startY = invY + 55 + inventoryScroll;
        for (var idx = 0; idx < items.length; idx++) {
            var item = items[idx];
            var iy = startY + idx * 30;
            if (iy < invY + 42 || iy > invY + invH - 10) continue;

            // Type icon
            ctx.fillStyle = item.color;
            if (item.type === 'fragment') {
                ctx.beginPath();
                ctx.arc(invX + 25, iy, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (item.type === 'key') {
                ctx.fillRect(invX + 19, iy - 6, 12, 12);
            } else if (item.type === 'quest') {
                ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
                ctx.fillText('!', invX + 23, iy);
            }

            // Name
            ctx.fillStyle = '#ccc';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.name, invX + 42, iy + 1);
        }

        if (items.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.fillText('背包为空', invX + invW / 2, invY + invH / 2);
        }

        // Close hint
        ctx.fillStyle = '#555';
        ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        var closeText = (typeof Engine !== 'undefined' && Engine.isMobile) ? '点击关闭' : '按 I 关闭';
        ctx.fillText(closeText, invX + invW / 2, invY + invH - 15);
    }

    // ========================
    // Pause Menu
    // ========================
    function renderPauseMenu(ctx, cw, ch, fs) {
        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, cw, ch);

        var menuW = 260;
        var menuH = 220;
        var menuX = (cw - menuW) / 2;
        var menuY = (ch - menuH) / 2;

        // Panel
        ctx.fillStyle = 'rgba(10,10,20,0.95)';
        ctx.fillRect(menuX, menuY, menuW, menuH);
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuW, menuH);

        if (showControls) {
            renderControlsHelp(ctx, menuX, menuY, menuW, menuH, fs);
            return;
        }

        // Title
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(22 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暂停', menuX + menuW / 2, menuY + 30);

        // Options
        for (var oi = 0; oi < PAUSE_OPTIONS.length; oi++) {
            var oy = menuY + 70 + oi * 40;
            var isSelected = (oi === pauseSelection);

            if (isSelected) {
                ctx.fillStyle = 'rgba(212,197,160,0.15)';
                ctx.fillRect(menuX + 20, oy - 14, menuW - 40, 30);
                ctx.fillStyle = '#d4c5a0';
            } else {
                ctx.fillStyle = '#888';
            }

            ctx.font = Math.round(16 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.fillText(PAUSE_OPTIONS[oi], menuX + menuW / 2, oy);
        }

        // Stats at bottom
        ctx.fillStyle = '#555';
        ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
        var fragmentCount = (typeof Items !== 'undefined') ? Items.getCollected().length : 0;
        ctx.fillText('碎片: ' + fragmentCount + '/8  |  HP: ' + hp + '/' + maxHp, menuX + menuW / 2, menuY + menuH - 20);
    }

    function renderControlsHelp(ctx, mx, my, mw, mh, fs) {
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(18 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText('操作说明', mx + mw / 2, my + 30);

        var controls = [
            'WASD / 方向键 - 移动',
            'E - 交互',
            'I - 背包',
            'ESC / P - 暂停',
            'H - 对话历史',
            '',
            '点击屏幕继续'
        ];
        ctx.fillStyle = '#aaa';
        ctx.font = Math.round(13 * fs) + 'px "Noto Serif SC", serif';
        for (var ci = 0; ci < controls.length; ci++) {
            ctx.fillText(controls[ci], mx + mw / 2, my + 60 + ci * 22);
        }
    }

    // ========================
    // Heart drawing helper
    // ========================
    function drawHeart(ctx, cx, cy, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy + size * 0.3);
        ctx.bezierCurveTo(cx, cy - size * 0.3, cx - size, cy - size * 0.3, cx - size, cy + size * 0.1);
        ctx.bezierCurveTo(cx - size, cy + size * 0.6, cx, cy + size, cx, cy + size);
        ctx.bezierCurveTo(cx, cy + size, cx + size, cy + size * 0.6, cx + size, cy + size * 0.1);
        ctx.bezierCurveTo(cx + size, cy - size * 0.3, cx, cy - size * 0.3, cx, cy + size * 0.3);
        ctx.fill();
        ctx.restore();
    }

    // ========================
    // Public API
    // ========================
    function setLevelName(name) {
        levelName = name;
    }

    function setLevelSubtitle(text) {
        levelSubtitle = text || '';
    }

    function showPickup(elementName) {
        pickupText = elementName;
        pickupAlpha = 1;
        pickupTimer = 2;
    }

    function showInteractHint(show) {
        interactHintVisible = show;
    }

    function addNotification(text, type) {
        notifications.push({
            text: text,
            type: type || 'pickup',
            timer: NOTIFICATION_DURATION,
            alpha: 1
        });
        if (notifications.length > MAX_NOTIFICATIONS) {
            notifications.shift();
        }
    }

    function showTooltip(text, x, y) {
        tooltip.text = text;
        tooltip.x = x;
        tooltip.y = y;
        tooltip.visible = true;
    }

    function hideTooltip() {
        tooltip.visible = false;
    }

    function setHp(val) {
        hp = Math.max(0, Math.min(maxHp, val));
    }

    function setStamina(val) {
        stamina = Math.max(0, Math.min(maxStamina, val));
    }

    function useStamina(amount) {
        if (stamina >= amount) {
            stamina -= amount;
            return true;
        }
        return false;
    }

    function triggerDash() {
        dashCooldown = DASH_COOLDOWN_MAX;
    }

    function addEffect(id, name, duration, iconColor) {
        // Remove existing effect with same id
        for (var i = 0; i < activeEffects.length; i++) {
            if (activeEffects[i].id === id) {
                activeEffects.splice(i, 1);
                break;
            }
        }
        activeEffects.push({
            id: id,
            name: name,
            icon: iconColor || '#aa88ff',
            timer: duration,
            maxTimer: duration
        });
    }

    function hasEffect(id) {
        for (var i = 0; i < activeEffects.length; i++) {
            if (activeEffects[i].id === id) return true;
        }
        return false;
    }

    function flash(color) {
        flashColor = color || '#fff';
        flashAlpha = 0.4;
    }

    function togglePause() {
        paused = !paused;
        pauseSelection = 0;
        showControls = false;
    }

    function isPaused() {
        return paused;
    }

    function pauseHandleInput(e) {
        if (!paused) return false;

        if (showControls) {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                showControls = false;
            }
            return true;
        }

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            pauseSelection = (pauseSelection - 1 + PAUSE_OPTIONS.length) % PAUSE_OPTIONS.length;
            return true;
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            pauseSelection = (pauseSelection + 1) % PAUSE_OPTIONS.length;
            return true;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (pauseSelection === 0) {
                // Continue
                paused = false;
            } else if (pauseSelection === 1) {
                // Controls
                showControls = true;
            } else if (pauseSelection === 2) {
                // Exit level
                paused = false;
                if (typeof Engine !== 'undefined') {
                    Engine.changeState('menu');
                }
            }
            return true;
        }
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            paused = false;
            return true;
        }
        return true; // consume input while paused
    }

    function toggleInventory() {
        inventoryOpen = !inventoryOpen;
        inventoryScroll = 0;
    }

    function isInventoryOpen() {
        return inventoryOpen;
    }

    function inventoryHandleInput(e) {
        if (!inventoryOpen) return false;
        if (e.key === 'i' || e.key === 'I' || e.key === 'Escape') {
            inventoryOpen = false;
            return true;
        }
        return true; // consume input while open
    }

    function setCompassActive(active) {
        compassActive = active;
    }

    function handleGlobalKey(e) {
        // Pause toggle
        if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && !inventoryOpen) {
            togglePause();
            return true;
        }
        // Inventory toggle
        if (e.key === 'i' || e.key === 'I') {
            toggleInventory();
            return true;
        }
        // Paused input
        if (paused) {
            return pauseHandleInput(e);
        }
        // Inventory input
        if (inventoryOpen) {
            return inventoryHandleInput(e);
        }
        return false;
    }

    function getHp() { return hp; }
    function getMaxHp() { return maxHp; }
    function getStamina() { return stamina; }
    function getMaxStamina() { return maxStamina; }
    function getDashCooldown() { return dashCooldown; }

    return {
        init: init,
        render: render,
        update: update,
        setLevelName: setLevelName,
        setLevelSubtitle: setLevelSubtitle,
        showPickup: showPickup,
        showInteractHint: showInteractHint,
        addNotification: addNotification,
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        setHp: setHp,
        getHp: getHp,
        getMaxHp: getMaxHp,
        setStamina: setStamina,
        getStamina: getStamina,
        getMaxStamina: getMaxStamina,
        useStamina: useStamina,
        triggerDash: triggerDash,
        getDashCooldown: getDashCooldown,
        addEffect: addEffect,
        hasEffect: hasEffect,
        flash: flash,
        togglePause: togglePause,
        isPaused: isPaused,
        toggleInventory: toggleInventory,
        isInventoryOpen: isInventoryOpen,
        setCompassActive: setCompassActive,
        handleGlobalKey: handleGlobalKey,
        pauseHandleInput: pauseHandleInput,
        inventoryHandleInput: inventoryHandleInput
    };
})();

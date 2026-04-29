// 通向奥秘 - 碎片/物品系统

var Items = (function () {
    var TILE_SIZE = 32;

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

    var ELEMENT_NAMES = {
        prologue: '启示',
        knowledge: '知识',
        failure: '失败',
        solitude: '孤独',
        love: '爱',
        prayer: '祈祷',
        death: '死亡',
        hope: '希望'
    };

    var FRAGMENT_DIALOGUES = {
        prologue: '一缕微光穿透迷雾，照亮了前方的道路。',
        knowledge: '知识的碎片在此处沉淀。你所知道的越多，未知的边界就越广阔。',
        failure: '失败不是终结。每一次破碎都是重建的起点。',
        solitude: '在寂静深处，你听见了自己内心的回声。',
        love: '两道光线交汇，阴影有了温柔的轮廓。',
        prayer: '在沉默中，你找到了最深的虔诚。',
        death: '这道光芒来自黑暗的另一侧——死亡不是终结，而是变形。',
        hope: '最后的碎片。不是因为看见光才相信，而是因为相信才看见光。'
    };

    // ---- Item Definitions ----
    var ITEM_DEFS = {
        // Consumables
        health_potion: {
            name: '生命药水',
            type: 'consumable',
            rarity: 'common',
            weight: 1,
            description: '一瓶散发微光的液体。饮下后恢复两颗心。',
            effect: { type: 'heal', amount: 2 },
            color: '#cc4444',
            icon: 'potion'
        },
        light_potion: {
            name: '光明药水',
            type: 'consumable',
            rarity: 'common',
            weight: 1,
            description: '一瓶闪烁的银色液体。暂时扩大视野范围。',
            effect: { type: 'light_boost', duration: 15 },
            color: '#aaccff',
            icon: 'potion'
        },
        speed_elixir: {
            name: '疾风药剂',
            type: 'consumable',
            rarity: 'uncommon',
            weight: 1,
            description: '流动如风的液体。短暂提升移动速度。',
            effect: { type: 'speed_boost', duration: 10 },
            color: '#88ffaa',
            icon: 'potion'
        },
        revelation_scroll: {
            name: '启示卷轴',
            type: 'consumable',
            rarity: 'rare',
            weight: 1,
            description: '古老的卷轴，展开后能揭示隐藏的通道。',
            effect: { type: 'reveal_hidden', duration: 5 },
            color: '#ffdd88',
            icon: 'scroll'
        },
        // Artifacts
        compass: {
            name: '指南针',
            type: 'artifact',
            rarity: 'uncommon',
            weight: 0,
            description: '永远指向出口的古老指南针。它的指针从未犹豫。',
            artifactId: 'compass',
            color: '#ffcc44',
            icon: 'compass'
        },
        ancient_map: {
            name: '古地图',
            type: 'artifact',
            rarity: 'rare',
            weight: 0,
            description: '每层开始时已探索20%的地图。知识是最古老的灯笼。',
            artifactId: 'ancient_map',
            color: '#ddcc88',
            icon: 'map'
        },
        lantern_shadows: {
            name: '暗影灯笼',
            type: 'artifact',
            rarity: 'rare',
            weight: 0,
            description: '在黑暗中燃烧得更亮的灯笼。阴影是它的燃料。',
            artifactId: 'lantern_shadows',
            color: '#88aaff',
            icon: 'lantern'
        },
        shield_solitude: {
            name: '孤独之盾',
            type: 'artifact',
            rarity: 'rare',
            weight: 0,
            description: '减轻陷阱伤害一半。只有独行之人才能举起它。',
            artifactId: 'shield_solitude',
            color: '#6666aa',
            icon: 'shield'
        },
        ring_prayer: {
            name: '祈祷之戒',
            type: 'artifact',
            rarity: 'legendary',
            weight: 0,
            description: '与知识石碑互动时揭示额外的古代文字。信仰的回声。',
            artifactId: 'ring_prayer',
            color: '#ffdd88',
            icon: 'ring'
        }
    };

    // Rarity colors and glow
    var RARITY_STYLES = {
        common:    { border: '#888888', glow: 0, particles: 0 },
        uncommon:  { border: '#44aa44', glow: 4, particles: 1 },
        rare:      { border: '#4488ff', glow: 8, particles: 2 },
        legendary: { border: '#ffaa00', glow: 12, particles: 3 }
    };

    // ---- State ----
    var items = [];         // World items (fragments, keys, consumables, chests)
    var collected = [];     // Collected fragment elements
    var keys = [];          // Collected keys
    var inventory = [];     // 20-slot inventory: array of item objects or null
    var INVENTORY_ROWS = 4;
    var INVENTORY_COLS = 5;
    var INVENTORY_SIZE = INVENTORY_ROWS * INVENTORY_COLS;

    var artifacts = {};     // artifactId → true
    var activeEffects = []; // { type, duration, timeLeft }

    var chests = {};        // "x,y" → true (opened chests)
    var pickupAnimations = []; // { item, startTime, fromX, fromY, toX, toY, progress }

    var itemSparkles = [];  // Sparkle particles orbiting items
    var showInventory = false;

    // ---- Init ----
    function init(levelConfig) {
        items = [];
        var element = levelConfig.element || 'prologue';
        var rooms = levelConfig.specialRooms || [];

        for (var i = 0; i < rooms.length; i++) {
            items.push({
                x: rooms[i].x,
                y: rooms[i].y,
                type: 'fragment',
                element: element,
                collected: false,
                animPhase: Math.random() * Math.PI * 2
            });
        }

        // Create key items from level config
        var keyItems = levelConfig.keyItems || [];
        for (var i = 0; i < keyItems.length; i++) {
            items.push({
                x: keyItems[i].x,
                y: keyItems[i].y,
                type: 'key',
                keyId: keyItems[i].keyId,
                collected: false,
                animPhase: Math.random() * Math.PI * 2
            });
        }

        // Place chests in secret areas
        var secretAreas = levelConfig.secretAreas || [];
        for (var i = 0; i < secretAreas.length; i++) {
            var sa = secretAreas[i];
            var chestItem = randomChestItem();
            if (chestItem) {
                items.push({
                    x: sa.x,
                    y: sa.y,
                    type: 'chest',
                    chestContent: chestItem,
                    opened: false,
                    animPhase: Math.random() * Math.PI * 2
                });
            }
        }

        // Place some consumables on special rooms
        for (var i = 0; i < rooms.length; i++) {
            if (Math.random() < 0.15) {
                var potionType = randomConsumable();
                if (potionType) {
                    items.push({
                        x: rooms[i].x + (Math.random() > 0.5 ? 1 : -1),
                        y: rooms[i].y,
                        type: 'consumable',
                        itemId: potionType,
                        collected: false,
                        animPhase: Math.random() * Math.PI * 2
                    });
                }
            }
        }

        // Clear per-level state
        chests = {};
        pickupAnimations = [];
        itemSparkles = [];

        // Initialize inventory if needed
        if (!inventory || inventory.length === 0) {
            inventory = [];
            for (var i = 0; i < INVENTORY_SIZE; i++) {
                inventory[i] = null;
            }
        }
    }

    function randomConsumable() {
        var roll = Math.random();
        if (roll < 0.4) return 'health_potion';
        if (roll < 0.7) return 'light_potion';
        if (roll < 0.9) return 'speed_elixir';
        return 'revelation_scroll';
    }

    function randomChestItem() {
        var roll = Math.random();
        if (roll < 0.3) return 'health_potion';
        if (roll < 0.5) return 'light_potion';
        if (roll < 0.65) return 'speed_elixir';
        if (roll < 0.75) return 'revelation_scroll';
        // Artifact (rare)
        var artifactRoll = ['compass', 'ancient_map', 'lantern_shadows', 'shield_solitude', 'ring_prayer'];
        return artifactRoll[Math.floor(Math.random() * artifactRoll.length)];
    }

    // ---- Update ----
    function update(dt, playerGridPos) {
        if (!playerGridPos) return;

        // Update active effects
        for (var i = activeEffects.length - 1; i >= 0; i--) {
            activeEffects[i].timeLeft -= dt;
            if (activeEffects[i].timeLeft <= 0) {
                activeEffects.splice(i, 1);
            }
        }

        // Update sparkle particles
        for (var s = itemSparkles.length - 1; s >= 0; s--) {
            var sp = itemSparkles[s];
            sp.phase += dt * 3;
            sp.life -= dt;
            if (sp.life <= 0) {
                itemSparkles.splice(s, 1);
            }
        }

        // Update pickup animations
        for (var p = pickupAnimations.length - 1; p >= 0; p--) {
            var pa = pickupAnimations[p];
            pa.progress += dt * 2.5;
            if (pa.progress >= 1) {
                pickupAnimations.splice(p, 1);
            }
        }

        // Check collision with items
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.collected || item.opened) continue;

            // Animate
            item.animPhase += dt * 2;

            // Collision check
            if (item.x === playerGridPos.gx && item.y === playerGridPos.gy) {
                if (item.type === 'chest') {
                    // Auto-open chest
                    openChest(item.x, item.y);
                } else if (item.type === 'consumable') {
                    item.collected = true;
                    addToInventory(item.itemId);
                    if (typeof UI !== 'undefined') {
                        var def = ITEM_DEFS[item.itemId];
                        UI.showPickup(def ? def.name : item.itemId);
                    }
                } else if (item.type === 'key') {
                    item.collected = true;
                    keys.push(item.keyId);
                    if (typeof UI !== 'undefined') {
                        UI.showPickup('钥匙');
                    }
                } else if (item.type === 'fragment') {
                    if (!hasElement(item.element)) {
                        collected.push(item.element);
                    }
                    item.collected = true;

                    if (typeof UI !== 'undefined') {
                        UI.showPickup(ELEMENT_NAMES[item.element] || item.element);
                    }

                    if (typeof Dialogue !== 'undefined') {
                        Dialogue.show(
                            [FRAGMENT_DIALOGUES[item.element] || '你找到了一片碎片。'],
                            function () {
                                if (typeof Engine !== 'undefined') {
                                    Engine.changeState('exploring');
                                }
                            }
                        );
                    }
                }
            }
        }
    }

    // ---- Inventory Management ----
    function addToInventory(itemId) {
        var def = ITEM_DEFS[itemId];
        if (!def) return false;

        // Artifacts go to artifact slot, not inventory
        if (def.type === 'artifact') {
            artifacts[def.artifactId] = true;
            return true;
        }

        // Find first empty slot
        for (var i = 0; i < INVENTORY_SIZE; i++) {
            if (inventory[i] === null) {
                inventory[i] = { itemId: itemId, count: 1 };
                return true;
            }
        }
        return false; // inventory full
    }

    function useItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return false;
        var slot = inventory[slotIndex];
        if (!slot) return false;

        var def = ITEM_DEFS[slot.itemId];
        if (!def || def.type !== 'consumable') return false;

        var effect = def.effect;
        if (effect.type === 'heal') {
            if (typeof Player !== 'undefined') {
                Player.heal(effect.amount);
            }
            if (typeof UI !== 'undefined') {
                UI.showPickup('恢复了 ' + effect.amount + ' HP');
            }
        } else if (effect.type === 'light_boost') {
            activeEffects.push({ type: 'light_boost', duration: effect.duration, timeLeft: effect.duration });
            if (typeof UI !== 'undefined') {
                UI.showPickup('视野暂时扩大！');
            }
        } else if (effect.type === 'speed_boost') {
            activeEffects.push({ type: 'speed_boost', duration: effect.duration, timeLeft: effect.duration });
            if (typeof UI !== 'undefined') {
                UI.showPickup('速度暂时提升！');
            }
        } else if (effect.type === 'reveal_hidden') {
            activeEffects.push({ type: 'reveal_hidden', duration: effect.duration, timeLeft: effect.duration });
            if (typeof UI !== 'undefined') {
                UI.showPickup('隐藏通道已揭示！');
            }
        }

        // Remove from inventory
        inventory[slotIndex] = null;
        return true;
    }

    function dropItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return false;
        if (inventory[slotIndex] === null) return false;
        inventory[slotIndex] = null;
        return true;
    }

    function hasArtifact(id) {
        return !!artifacts[id];
    }

    function getActiveEffects() {
        return activeEffects.slice();
    }

    function getTotalWeight() {
        var weight = 0;
        for (var i = 0; i < INVENTORY_SIZE; i++) {
            if (inventory[i]) {
                var def = ITEM_DEFS[inventory[i].itemId];
                if (def) weight += (def.weight || 0) * (inventory[i].count || 1);
            }
        }
        return weight;
    }

    function getInventoryCapacity() {
        return INVENTORY_SIZE;
    }

    function getInventory() {
        return inventory.slice();
    }

    function getEncumbranceSpeedMult() {
        var weight = getTotalWeight();
        if (weight > 10) {
            return Math.max(0.5, 1 - (weight - 10) * 0.05);
        }
        return 1;
    }

    // ---- Chest System ----
    function openChest(x, y) {
        var key = x + ',' + y;
        if (chests[key]) return null; // already opened

        chests[key] = true;

        // Find the chest item
        var chestItem = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type === 'chest' && items[i].x === x && items[i].y === y && !items[i].opened) {
                chestItem = items[i];
                break;
            }
        }

        if (!chestItem) return null;
        chestItem.opened = true;

        var contentId = chestItem.chestContent;
        var def = ITEM_DEFS[contentId];

        // Pickup animation
        pickupAnimations.push({
            itemId: contentId,
            fromX: x * TILE_SIZE + TILE_SIZE / 2,
            fromY: y * TILE_SIZE + TILE_SIZE / 2,
            progress: 0
        });

        // Add to inventory or artifacts
        if (def && def.type === 'artifact') {
            artifacts[def.artifactId] = true;
            if (typeof UI !== 'undefined') {
                UI.showPickup('获得神器: ' + def.name);
            }
        } else {
            addToInventory(contentId);
            if (typeof UI !== 'undefined') {
                UI.showPickup(def ? def.name : contentId);
            }
        }

        // Spawn sparkles
        for (var s = 0; s < 8; s++) {
            itemSparkles.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                angle: (s / 8) * Math.PI * 2,
                radius: 10,
                phase: 0,
                life: 1,
                color: def ? def.color : '#ffd700'
            });
        }

        return contentId;
    }

    function isChestOpened(x, y) {
        return !!chests[x + ',' + y];
    }

    function getItemDescription(itemId) {
        var def = ITEM_DEFS[itemId];
        return def ? def.description : '';
    }

    // ---- Crafting Hints ----
    // Combining health_potion + light_potion creates "Elixir of Clarity"
    // This is hinted through lore text, not explicit UI
    var CRAFTING_RECIPES = [
        { items: ['health_potion', 'light_potion'], result: 'elixir_clarity' }
    ];

    var ITEM_DEFS_EXT = {
        elixir_clarity: {
            name: '澄明之药',
            type: 'consumable',
            rarity: 'rare',
            weight: 1,
            description: '融合了生命与光明的药剂。同时恢复生命并扩大视野。',
            effect: { type: 'clarity', healAmount: 2, lightDuration: 15 },
            color: '#ffccaa',
            icon: 'potion'
        }
    };

    // Merge extended defs
    function getFullItemDef(itemId) {
        return ITEM_DEFS[itemId] || ITEM_DEFS_EXT[itemId] || null;
    }

    // ---- Render ----
    function render(ctx) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.collected) continue;
            if (item.type === 'chest' && item.opened) continue;

            var cx = item.x * TILE_SIZE + TILE_SIZE / 2;
            var cy = item.y * TILE_SIZE + TILE_SIZE / 2;

            // Floating animation
            var floatY = Math.sin(item.animPhase) * 3;
            cy += floatY;

            ctx.save();
            ctx.shadowBlur = 12;

            if (item.type === 'key') {
                renderKey(ctx, cx, cy);
            } else if (item.type === 'fragment') {
                renderFragment(ctx, cx, cy, item.element);
            } else if (item.type === 'chest') {
                renderChest(ctx, cx, cy);
            } else if (item.type === 'consumable') {
                var def = ITEM_DEFS[item.itemId];
                if (def) {
                    renderConsumable(ctx, cx, cy, def);
                }
            }

            ctx.restore();
        }

        // Render sparkles
        for (var s = 0; s < itemSparkles.length; s++) {
            var sp = itemSparkles[s];
            var sx = sp.x + Math.cos(sp.angle + sp.phase) * sp.radius;
            var sy = sp.y + Math.sin(sp.angle + sp.phase) * sp.radius;
            ctx.save();
            ctx.globalAlpha = sp.life;
            ctx.fillStyle = sp.color;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render pickup animations
        for (var p = 0; p < pickupAnimations.length; p++) {
            var pa = pickupAnimations[p];
            var t = pa.progress;
            // Curved path upward then toward HUD
            var animX = pa.fromX;
            var animY = pa.fromY - t * 40;
            var alpha = 1 - t;
            var def = getFullItemDef(pa.itemId);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = def ? def.color : '#d4c5a0';
            ctx.shadowBlur = 8;
            ctx.shadowColor = def ? def.color : '#d4c5a0';
            ctx.beginPath();
            ctx.arc(animX, animY, 6 * (1 - t * 0.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render inventory overlay if open
        if (showInventory) {
            renderInventory(ctx);
        }
    }

    function renderKey(ctx, cx, cy) {
        var keyColor = '#ffd700';
        ctx.shadowColor = keyColor;
        ctx.fillStyle = keyColor;
        ctx.strokeStyle = keyColor;
        ctx.lineWidth = 2;

        // Key head (circle)
        ctx.beginPath();
        ctx.arc(cx - 3, cy, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Key shaft
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy);
        ctx.lineTo(cx + 8, cy);
        ctx.stroke();

        // Key teeth
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy);
        ctx.lineTo(cx + 6, cy + 3);
        ctx.moveTo(cx + 8, cy);
        ctx.lineTo(cx + 8, cy + 3);
        ctx.stroke();
    }

    function renderFragment(ctx, cx, cy, element) {
        var color = ELEMENT_COLORS[element] || '#d4c5a0';
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 6, cy);
        ctx.lineTo(cx, cy + 8);
        ctx.lineTo(cx - 6, cy);
        ctx.closePath();
        ctx.fill();

        // Sparkle particles orbiting fragments
        var phase = (typeof items !== 'undefined') ? 0 : 0;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.6;
        for (var s = 0; s < 3; s++) {
            var angle = phase + s * (Math.PI * 2 / 3) + performance.now() * 0.002;
            var sx = cx + Math.cos(angle) * 10;
            var sy = cy + Math.sin(angle) * 10;
            ctx.beginPath();
            ctx.arc(sx, sy, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function renderChest(ctx, cx, cy) {
        var isLegendary = false;
        // Check chest content rarity
        for (var i = 0; i < items.length; i++) {
            if (items[i].type === 'chest' && !items[i].opened &&
                items[i].x * TILE_SIZE + TILE_SIZE / 2 === cx &&
                items[i].y * TILE_SIZE + TILE_SIZE / 2 === cy) {
                var def = ITEM_DEFS[items[i].chestContent];
                if (def && def.rarity === 'legendary') isLegendary = true;
                break;
            }
        }

        var chestColor = isLegendary ? '#ffaa00' : '#8b6914';
        var lidColor = isLegendary ? '#cc8800' : '#6b4914';

        ctx.shadowColor = isLegendary ? '#ffaa00' : '#ffd700';
        ctx.shadowBlur = isLegendary ? 16 : 8;

        // Chest body
        ctx.fillStyle = chestColor;
        ctx.fillRect(cx - 8, cy - 4, 16, 10);

        // Chest lid
        ctx.fillStyle = lidColor;
        ctx.fillRect(cx - 9, cy - 8, 18, 5);

        // Lock
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);

        // Border
        ctx.strokeStyle = isLegendary ? '#ffcc44' : '#aa8822';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 8, cy - 4, 16, 10);
    }

    function renderConsumable(ctx, cx, cy, def) {
        var style = RARITY_STYLES[def.rarity] || RARITY_STYLES.common;

        ctx.shadowColor = def.color;
        ctx.shadowBlur = style.glow;
        ctx.fillStyle = def.color;

        if (def.icon === 'potion') {
            // Potion bottle shape
            ctx.beginPath();
            ctx.moveTo(cx - 3, cy - 6);
            ctx.lineTo(cx + 3, cy - 6);
            ctx.lineTo(cx + 5, cy - 2);
            ctx.lineTo(cx + 5, cy + 4);
            ctx.lineTo(cx - 5, cy + 4);
            ctx.lineTo(cx - 5, cy - 2);
            ctx.closePath();
            ctx.fill();

            // Bottle neck
            ctx.fillRect(cx - 2, cy - 9, 4, 4);

            // Cork
            ctx.fillStyle = '#886644';
            ctx.fillRect(cx - 2, cy - 10, 4, 2);
        } else if (def.icon === 'scroll') {
            // Scroll shape
            ctx.fillRect(cx - 6, cy - 4, 12, 8);
            ctx.beginPath();
            ctx.arc(cx - 6, cy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 6, cy, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rarity border glow
        if (style.glow > 0) {
            ctx.strokeStyle = style.border;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // ---- Inventory Screen ----
    function renderInventory(ctx) {
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;

        // Background overlay
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, w, h);

        var cellSize = 48;
        var gridW = INVENTORY_COLS * cellSize;
        var gridH = INVENTORY_ROWS * cellSize;
        var ox = (w - gridW) / 2;
        var oy = (h - gridH) / 2 - 30;

        // Title
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(20 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('背包', w / 2, oy - 20);

        // Grid
        for (var row = 0; row < INVENTORY_ROWS; row++) {
            for (var col = 0; col < INVENTORY_COLS; col++) {
                var idx = row * INVENTORY_COLS + col;
                var slotX = ox + col * cellSize;
                var slotY = oy + row * cellSize;

                // Slot background
                ctx.fillStyle = 'rgba(30,30,30,0.9)';
                ctx.fillRect(slotX, slotY, cellSize - 2, cellSize - 2);

                // Slot border
                ctx.strokeStyle = 'rgba(100,100,100,0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(slotX, slotY, cellSize - 2, cellSize - 2);

                var slot = inventory[idx];
                if (slot) {
                    var def = getFullItemDef(slot.itemId);
                    if (def) {
                        var itemCx = slotX + cellSize / 2 - 1;
                        var itemCy = slotY + cellSize / 2 - 1;

                        // Item icon
                        ctx.fillStyle = def.color;
                        ctx.shadowBlur = 4;
                        ctx.shadowColor = def.color;

                        if (def.icon === 'potion') {
                            ctx.fillRect(itemCx - 4, itemCy - 6, 8, 12);
                            ctx.fillRect(itemCx - 2, itemCy - 8, 4, 3);
                        } else if (def.icon === 'scroll') {
                            ctx.fillRect(itemCx - 5, itemCy - 4, 10, 8);
                        } else if (def.icon === 'compass') {
                            ctx.beginPath();
                            ctx.arc(itemCx, itemCy, 8, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(itemCx, itemCy - 6);
                            ctx.lineTo(itemCx, itemCy + 6);
                            ctx.moveTo(itemCx - 6, itemCy);
                            ctx.lineTo(itemCx + 6, itemCy);
                            ctx.stroke();
                        } else if (def.icon === 'map') {
                            ctx.fillRect(itemCx - 6, itemCy - 5, 12, 10);
                        } else if (def.icon === 'lantern') {
                            ctx.fillRect(itemCx - 3, itemCy - 6, 6, 12);
                            ctx.beginPath();
                            ctx.arc(itemCx, itemCy - 2, 3, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (def.icon === 'shield') {
                            ctx.beginPath();
                            ctx.moveTo(itemCx, itemCy - 7);
                            ctx.lineTo(itemCx + 7, itemCy - 3);
                            ctx.lineTo(itemCx + 5, itemCy + 5);
                            ctx.lineTo(itemCx, itemCy + 8);
                            ctx.lineTo(itemCx - 5, itemCy + 5);
                            ctx.lineTo(itemCx - 7, itemCy - 3);
                            ctx.closePath();
                            ctx.stroke();
                        } else if (def.icon === 'ring') {
                            ctx.beginPath();
                            ctx.arc(itemCx, itemCy, 7, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.arc(itemCx, itemCy - 7, 3, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        ctx.shadowBlur = 0;

                        // Rarity border
                        var style = RARITY_STYLES[def.rarity] || RARITY_STYLES.common;
                        ctx.strokeStyle = style.border;
                        ctx.lineWidth = style.glow > 0 ? 2 : 1;
                        ctx.strokeRect(slotX + 1, slotY + 1, cellSize - 4, cellSize - 4);
                    }
                }
            }
        }

        // Weight display
        var weight = getTotalWeight();
        ctx.fillStyle = weight > 10 ? '#ff8844' : '#888';
        ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText('负重: ' + weight + '/10' + (weight > 10 ? ' (减速中)' : ''), w / 2, oy + gridH + 20);

        // Active effects
        if (activeEffects.length > 0) {
            ctx.fillStyle = '#aaa';
            ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
            ctx.fillText('当前效果:', w / 2, oy + gridH + 40);
            for (var i = 0; i < activeEffects.length; i++) {
                var effect = activeEffects[i];
                var name = '';
                if (effect.type === 'light_boost') name = '光明增幅';
                else if (effect.type === 'speed_boost') name = '疾风增幅';
                else if (effect.type === 'reveal_hidden') name = '启示之眼';
                else name = effect.type;

                ctx.fillStyle = '#88ccff';
                ctx.fillText(name + ' (' + Math.ceil(effect.timeLeft) + 's)', w / 2, oy + gridH + 58 + i * 18);
            }
        }

        // Close prompt
        ctx.fillStyle = '#666';
        ctx.font = Math.round(13 * fs) + 'px "Noto Serif SC", serif';
        var closePrompt = (typeof Engine !== 'undefined' && Engine.isMobile) ? '点击关闭' : '按 I 关闭';
        ctx.fillText(closePrompt, w / 2, h - 30);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    function renderItemPickup(ctx, itemId) {
        // Visual-only: handled by pickupAnimations array in render()
    }

    function toggleInventory() {
        showInventory = !showInventory;
    }

    function isInventoryOpen() {
        return showInventory;
    }

    function getCollected() {
        return collected.slice();
    }

    function hasElement(element) {
        for (var i = 0; i < collected.length; i++) {
            if (collected[i] === element) return true;
        }
        return false;
    }

    function hasKey(keyId) {
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] === keyId) return true;
        }
        return false;
    }

    function removeKey(keyId) {
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] === keyId) {
                keys.splice(i, 1);
                return;
            }
        }
    }

    function getKeys() {
        return keys.slice();
    }

    function resetAll() {
        items = [];
        collected = [];
        keys = [];
        inventory = [];
        for (var i = 0; i < INVENTORY_SIZE; i++) {
            inventory[i] = null;
        }
        artifacts = {};
        activeEffects = [];
        chests = {};
        pickupAnimations = [];
        itemSparkles = [];
        showInventory = false;
    }

    return {
        init: init,
        update: update,
        render: render,
        getCollected: getCollected,
        hasElement: hasElement,
        hasKey: hasKey,
        removeKey: removeKey,
        getKeys: getKeys,
        resetAll: resetAll,
        // New API
        getInventory: getInventory,
        useItem: useItem,
        dropItem: dropItem,
        hasArtifact: hasArtifact,
        getActiveEffects: getActiveEffects,
        openChest: openChest,
        isChestOpened: isChestOpened,
        getItemDescription: getItemDescription,
        getInventoryCapacity: getInventoryCapacity,
        getTotalWeight: getTotalWeight,
        renderInventory: renderInventory,
        renderItemPickup: renderItemPickup,
        toggleInventory: toggleInventory,
        isInventoryOpen: isInventoryOpen
    };
})();

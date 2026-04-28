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

    var items = [];
    var collected = [];

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
    }

    function update(dt, playerGridPos) {
        if (!playerGridPos) return;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.collected) continue;

            // Animate
            item.animPhase += dt * 2;

            // Collision check
            if (item.x === playerGridPos.gx && item.y === playerGridPos.gy) {
                item.collected = true;
                collected.push(item.element);

                if (typeof UI !== 'undefined') {
                    UI.showPickup(ELEMENT_NAMES[item.element] || item.element);
                }

                // Show fragment dialogue
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

    function render(ctx) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.collected) continue;

            var cx = item.x * TILE_SIZE + TILE_SIZE / 2;
            var cy = item.y * TILE_SIZE + TILE_SIZE / 2;

            // Floating animation
            var floatY = Math.sin(item.animPhase) * 3;
            cy += floatY;

            var color = ELEMENT_COLORS[item.element] || '#d4c5a0';

            // Glow
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;
            ctx.fillStyle = color;

            // Diamond shape
            ctx.beginPath();
            ctx.moveTo(cx, cy - 8);
            ctx.lineTo(cx + 6, cy);
            ctx.lineTo(cx, cy + 8);
            ctx.lineTo(cx - 6, cy);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
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

    function resetAll() {
        items = [];
        collected = [];
    }

    return {
        init: init,
        update: update,
        render: render,
        getCollected: getCollected,
        hasElement: hasElement,
        resetAll: resetAll
    };
})();

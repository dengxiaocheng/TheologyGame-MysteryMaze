// 通向奥秘 - UI 模块

var UI = (function () {
    var levelName = '序章';

    // Pickup notification state
    var pickupText = '';
    var pickupAlpha = 0;
    var pickupTimer = 0;

    function init() {
        levelName = '序章';
        pickupText = '';
        pickupAlpha = 0;
        pickupTimer = 0;
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
    }

    function render(ctx) {
        // Dark bar at top
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, ctx.canvas.width, 36);

        // Fragment count (left side) - derive from Items
        var fragmentCount = (typeof Items !== 'undefined') ? Items.getCollected().length : 0;
        ctx.fillStyle = '#d4c5a0';
        ctx.font = '16px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('碎片: ' + fragmentCount + '/7', 12, 18);

        // Level name (right side)
        ctx.fillStyle = '#888';
        ctx.font = '14px "Noto Serif SC", serif';
        ctx.textAlign = 'right';
        ctx.fillText(levelName, ctx.canvas.width - 12, 18);

        // Pickup notification
        if (pickupAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = pickupAlpha;
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '14px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('获得碎片：' + pickupText, ctx.canvas.width / 2, 54);
            ctx.restore();
        }

        // Reset
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function setLevelName(name) {
        levelName = name;
    }

    function showPickup(elementName) {
        pickupText = elementName;
        pickupAlpha = 1;
        pickupTimer = 2;
    }

    return {
        init: init,
        render: render,
        update: update,
        setLevelName: setLevelName,
        showPickup: showPickup
    };
})();

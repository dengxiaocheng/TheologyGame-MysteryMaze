// 通向奥秘 - 光照/迷雾系统

var Lighting = (function () {
    var baseRadius = 160;  // 5 tiles * 32px
    var currentRadius = 160;
    var playerX = 0;
    var playerY = 0;
    var ambientTint = null;

    function init(levelConfig) {
        if (levelConfig && levelConfig.theme && levelConfig.theme.lightRadius) {
            baseRadius = levelConfig.theme.lightRadius;
        } else {
            baseRadius = 160;
        }
        currentRadius = baseRadius;

        if (levelConfig && levelConfig.theme && levelConfig.theme.ambientTint) {
            ambientTint = levelConfig.theme.ambientTint;
        } else {
            ambientTint = null;
        }
    }

    function update(playerPos) {
        if (playerPos) {
            playerX = playerPos.x;
            playerY = playerPos.y;
        }
    }

    function render(ctx) {
        ctx.save();

        // Ambient tint (applied before fog-of-war)
        if (ambientTint) {
            ctx.fillStyle = ambientTint;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Draw full-canvas black overlay
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Cut out the light circle using destination-out
        ctx.globalCompositeOperation = 'destination-out';

        var gradient = ctx.createRadialGradient(
            playerX, playerY, currentRadius * 0.6,
            playerX, playerY, currentRadius
        );
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(playerX, playerY, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function setRadius(r) {
        currentRadius = r;
    }

    function getRadius() {
        return currentRadius;
    }

    return {
        init: init,
        update: update,
        render: render,
        setRadius: setRadius,
        getRadius: getRadius
    };
})();

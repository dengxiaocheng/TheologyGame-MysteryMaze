// 通向奥秘 - 粒子系统

var Particles = (function () {
    var MAX_PARTICLES = 80;

    var THEME_CONFIGS = {
        prologue:  { color: '#ffffff', vy: -15, vxRange: 8,  life: 3, size: 1.5, density: 1,  gravity: 0 },
        knowledge: { color: '#80c0ff', vy: -25, vxRange: 12, life: 3, size: 2,   density: 2,  gravity: 0 },
        failure:   { color: '#ff6644', vy: 20,  vxRange: 10, life: 2.5, size: 2, density: 2,  gravity: 10 },
        solitude:  { color: '#8866aa', vy: -8,  vxRange: 5,  life: 5, size: 2.5, density: 1,  gravity: 0 },
        love:      { color: '#ffaacc', vy: -12, vxRange: 15, life: 3, size: 2,   density: 2,  gravity: 0 },
        prayer:    { color: '#ffdd88', vy: -30, vxRange: 10, life: 2.5, size: 2, density: 3,  gravity: 0 },
        death:     { color: '#888888', vy: 15,  vxRange: 6,  life: 4, size: 1.5, density: 1,  gravity: 5 },
        hope:      { color: '#aaffaa', vy: -35, vxRange: 18, life: 2, size: 2.5, density: 3,  gravity: -5 }
    };

    var particles = [];
    var config = null;
    var canvasW = 0;
    var canvasH = 0;
    var playerX = 0;
    var playerY = 0;

    function init(levelConfig) {
        particles = [];
        var element = levelConfig.element || 'prologue';
        config = THEME_CONFIGS[element] || THEME_CONFIGS.prologue;
    }

    function spawn() {
        if (!config) return;
        // Spawn around player position within visible radius
        var angle = Math.random() * Math.PI * 2;
        var dist = Math.random() * 160;
        var x = playerX + Math.cos(angle) * dist;
        var y = playerY + Math.sin(angle) * dist;

        var vx = (Math.random() - 0.5) * config.vxRange;
        var vy = config.vy + (Math.random() - 0.5) * 10;
        var life = config.life + (Math.random() - 0.5) * 1;

        particles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            life: life,
            maxLife: life,
            size: config.size + (Math.random() - 0.5) * 1,
            alpha: 0.6 + Math.random() * 0.4,
            color: config.color,
            gravity: config.gravity
        });
    }

    function update(dt) {
        if (!config) return;

        // Update canvas dimensions from context if available
        if (typeof Engine !== 'undefined' && Engine.getCanvas()) {
            canvasW = Engine.getCanvas().width;
            canvasH = Engine.getCanvas().height;
        }
        if (typeof Player !== 'undefined') {
            var pos = Player.getPlayerPos();
            playerX = pos.x;
            playerY = pos.y;
        }

        // Spawn new particles based on density
        var spawnCount = config.density;
        for (var s = 0; s < spawnCount; s++) {
            if (particles.length < MAX_PARTICLES) {
                spawn();
            }
        }

        // Update existing particles
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function render(ctx) {
        if (!config) return;

        ctx.save();
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var lifeRatio = p.life / p.maxLife;
            var alpha = p.alpha * lifeRatio;

            if (alpha <= 0.01) continue;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    return {
        init: init,
        update: update,
        render: render
    };
})();

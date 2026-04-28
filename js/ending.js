// 通向奥秘 - 结局系统

var Ending = (function () {
    var phase = 'intro';     // 'intro', 'question', 'ending_a', 'ending_b'
    var selectedOption = 0;
    var fadeIn = 0;

    function init() {
        phase = 'intro';
        selectedOption = 0;
        fadeIn = 0;
    }

    function handleInput(e) {
        var key = e.key;

        if (phase === 'intro') {
            if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                phase = 'question';
                fadeIn = 0;
            }
        } else if (phase === 'question') {
            if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                e.preventDefault();
                selectedOption = 0;
            } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
                e.preventDefault();
                selectedOption = 1;
            } else if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                phase = selectedOption === 0 ? 'ending_a' : 'ending_b';
                fadeIn = 0;
            }
        } else if (phase === 'ending_a' || phase === 'ending_b') {
            if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                if (fadeIn >= 0.95) {
                    location.reload();
                }
            }
        }
    }

    function update(dt) {
        if (fadeIn < 1) {
            fadeIn += dt * 0.5;
            if (fadeIn > 1) fadeIn = 1;
        }
    }

    function render(ctx) {
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        var cx = w / 2;
        var cy = h / 2;

        ctx.save();
        ctx.globalAlpha = Math.min(fadeIn, 1);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (phase === 'intro') {
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '22px "Noto Serif SC", serif';
            var lines = [
                '所有七个碎片都已收集。',
                '迷宫已走到尽头。',
                '但尽头……真的是终点吗？'
            ];
            for (var i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], cx, cy - 40 + i * 36);
            }

            ctx.fillStyle = '#666';
            ctx.font = '14px "Noto Serif SC", serif';
            ctx.fillText('按 Enter 继续', cx, h - 40);
        }

        else if (phase === 'question') {
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '20px "Noto Serif SC", serif';
            ctx.fillText('你站在最后的十字路口。', cx, cy - 80);

            // Option 0
            ctx.font = '18px "Noto Serif SC", serif';
            ctx.fillStyle = selectedOption === 0 ? '#d4c5a0' : '#555';
            ctx.fillText((selectedOption === 0 ? '▸ ' : '  ') + '继续探索 — 不放弃光芒', cx, cy - 10);

            // Option 1
            ctx.fillStyle = selectedOption === 1 ? '#d4c5a0' : '#555';
            ctx.fillText((selectedOption === 1 ? '▸ ' : '  ') + '放下光芒 — 拥抱未知', cx, cy + 30);

            ctx.fillStyle = '#555';
            ctx.font = '13px "Noto Serif SC", serif';
            ctx.fillText('↑↓ 选择   Enter 确认', cx, h - 40);
        }

        else if (phase === 'ending_a') {
            // Dark fade
            var darkness = fadeIn;
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0,0,0,' + (darkness * 0.3).toFixed(2) + ')';
            ctx.fillRect(0, 0, w, h);

            ctx.globalAlpha = fadeIn;
            ctx.fillStyle = '#888';
            ctx.font = '18px "Noto Serif SC", serif';
            var aLines = [
                '你拒绝放下灯笼。',
                '但灯笼的油已经耗尽。',
                '',
                '光芒从未属于你——它只属于旅程。',
                '',
                '你带着所有的地图，所有的光芒，所有的答案。',
                '但是没有问题的答案是什么？'
            ];
            for (var i = 0; i < aLines.length; i++) {
                ctx.fillText(aLines[i], cx, cy - 80 + i * 32);
            }

            if (fadeIn >= 0.95) {
                ctx.fillStyle = '#555';
                ctx.font = '13px "Noto Serif SC", serif';
                ctx.fillText('按 Enter 重新开始', cx, h - 40);
            }
        }

        else if (phase === 'ending_b') {
            // Golden fade
            var t = fadeIn;
            var r = Math.round(10 + t * 16);
            var g = Math.round(10 + t * 14);
            var b = Math.round(10 + t * 4);
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(0, 0, w, h);

            ctx.globalAlpha = fadeIn;
            ctx.fillStyle = '#d4c5a0';
            ctx.font = '18px "Noto Serif SC", serif';
            var bLines = [
                '你放下了光芒。',
                '不是为了投降，',
                '而是因为有些东西只有在黑暗中才能被看见。',
                '',
                '奥秘不是一个要被解决的问题。',
                '它是一个值得居住的地方。'
            ];
            for (var i = 0; i < bLines.length; i++) {
                ctx.fillText(bLines[i], cx, cy - 70 + i * 32);
            }

            if (fadeIn >= 0.95) {
                ctx.fillStyle = '#8a7a50';
                ctx.font = '13px "Noto Serif SC", serif';
                ctx.fillText('按 Enter 重新开始', cx, h - 40);
            }
        }

        ctx.restore();
    }

    return {
        init: init,
        handleInput: handleInput,
        update: update,
        render: render
    };
})();

// 通向奥秘 - 对话系统

var Dialogue = (function () {
    var lines = [];
    var currentLine = 0;
    var active = false;
    var callback = null;
    var promptBlink = 0;

    function show(linesArray, cb) {
        lines = linesArray || [];
        currentLine = 0;
        active = true;
        callback = cb || null;
        promptBlink = 0;

        if (typeof Engine !== 'undefined') {
            Engine.changeState('dialogue');
        }
    }

    function handleInput(e) {
        if (!active) return;

        var key = e.key;
        if (key === 'Enter' || key === ' ') {
            e.preventDefault();
            currentLine++;

            if (currentLine >= lines.length) {
                active = false;
                var cb = callback;
                callback = null;
                if (cb) {
                    cb();
                }
            }
        }
    }

    function render(ctx) {
        if (!active) return;

        var canvasW = ctx.canvas.width;
        var canvasH = ctx.canvas.height;
        var boxW = canvasW * 0.8;
        var boxH = 120;
        var boxX = (canvasW - boxW) / 2;
        var boxY = canvasH - boxH - 20;

        // Gold line above box
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX, boxY - 2);
        ctx.lineTo(boxX + boxW, boxY - 2);
        ctx.stroke();

        // Box background
        ctx.fillStyle = 'rgba(10,10,20,0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Gold border
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Text
        if (currentLine < lines.length) {
            ctx.fillStyle = '#e0e0e0';
            ctx.font = '18px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(lines[currentLine], boxX + 20, boxY + boxH / 2 - 8);
        }

        // Blinking prompt
        promptBlink += 0.05;
        var alpha = 0.4 + 0.6 * Math.abs(Math.sin(promptBlink));
        ctx.fillStyle = 'rgba(212,197,160,' + alpha.toFixed(2) + ')';
        ctx.font = '14px "Noto Serif SC", serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('▼', boxX + boxW - 15, boxY + boxH - 10);

        // Reset
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function isActive() {
        return active;
    }

    return {
        show: show,
        handleInput: handleInput,
        render: render,
        isActive: isActive
    };
})();

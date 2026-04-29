// 通向奥秘 - 对话系统（增强版）

var Dialogue = (function () {
    var lines = [];
    var currentLine = 0;
    var active = false;
    var callback = null;
    var promptBlink = 0;

    // Typewriter state
    var charIndex = 0;
    var charTimer = 0;
    var CHARS_PER_SEC = 30;
    var lineComplete = false;

    // --- Choice system ---
    var currentChoices = null;    // [{text, action, condition}]
    var selectedChoice = 0;
    var choiceCallback = null;    // called with choice index

    // --- Layout mode ---
    var layoutMode = 'bottom';    // 'bottom', 'center', 'fullscreen'
    var speakerName = '';
    var speakerEmotion = 'neutral'; // neutral, happy, sad, angry, surprised, thinking

    // --- Rich text rendering ---
    var WAVE_GROUP_SIZE = 5;
    var wavePhase = 0;

    // --- Dialogue history ---
    var dialogueHistory = [];     // [{speaker, text, choices}]
    var MAX_HISTORY = 100;
    var historyOpen = false;
    var historyScroll = 0;

    // --- Avatar rendering ---
    var AVATAR_SIZE = 48;
    var avatarAnimPhase = 0;

    // --- Emotion colors ---
    var EMOTION_COLORS = {
        neutral: '#d4c5a0',
        happy: '#ffdd88',
        sad: '#8888cc',
        angry: '#ff6644',
        surprised: '#ffaa44',
        thinking: '#88ccff'
    };

    // --- Speaker config ---
    var SPEAKER_CONFIGS = {
        knowledge_sage: { name: '智者', bodyColor: '#c0c0ff', eyeColor: '#8888ff' },
        solitude_echo_1: { name: '回声', bodyColor: '#8888aa', eyeColor: '#aaaacc', ghostly: true },
        solitude_echo_2: { name: '回声', bodyColor: '#8888aa', eyeColor: '#aaaacc', ghostly: true },
        prayer_monk: { name: '僧侣', bodyColor: '#ffffaa', eyeColor: '#cccc66', ghostly: true },
        death_shadow: { name: '影子', bodyColor: '#aa88aa', eyeColor: '#886688', ghostly: true },
        love_npc_1: { name: '旅人', bodyColor: '#ff88aa', eyeColor: '#ff6688' },
        love_npc_2: { name: '守护者', bodyColor: '#ffaacc', eyeColor: '#ff88aa' },
        love_npc_3: { name: '旧友', bodyColor: '#ffaacc', eyeColor: '#ff6688' },
        lore_stone: { name: '石碑', bodyColor: '#888', eyeColor: '#aaa' },
        system: { name: '', bodyColor: '#666', eyeColor: '#888' }
    };

    function show(linesArray, cb) {
        lines = linesArray || [];
        currentLine = 0;
        active = true;
        callback = cb || null;
        promptBlink = 0;
        charIndex = 0;
        charTimer = 0;
        lineComplete = false;
        currentChoices = null;
        selectedChoice = 0;
        choiceCallback = null;
        layoutMode = 'bottom';
        speakerName = '';
        speakerEmotion = 'neutral';

        if (typeof Engine !== 'undefined') {
            Engine.changeState('dialogue');
        }
    }

    function showWithChoices(linesArray, choices, cb, choiceCb) {
        show(linesArray, cb);
        currentChoices = choices || null;
        choiceCallback = choiceCb || null;
        selectedChoice = 0;
    }

    function showWithLayout(linesArray, layout, speaker, emotion, cb) {
        show(linesArray, cb);
        if (layout) layoutMode = layout;
        if (speaker) speakerName = speaker;
        if (emotion) speakerEmotion = emotion;
    }

    function update(dt) {
        if (!active || currentLine >= lines.length) return;

        if (!lineComplete) {
            charTimer += dt * CHARS_PER_SEC;
            var targetChar = Math.floor(charTimer);
            var maxChars = lines[currentLine].length;
            if (targetChar >= maxChars) {
                charIndex = maxChars;
                lineComplete = true;
            } else {
                charIndex = targetChar;
            }
        }

        promptBlink += dt * 3;
        wavePhase += dt * 4;
        avatarAnimPhase += dt * 2;
    }

    function handleInput(e) {
        if (historyOpen) {
            handleHistoryInput(e);
            return;
        }

        if (!active) return;

        // Choice navigation
        if (currentChoices && lineComplete) {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                selectedChoice = (selectedChoice - 1 + currentChoices.length) % currentChoices.length;
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                selectedChoice = (selectedChoice + 1) % currentChoices.length;
                return;
            }
        }

        var key = e.key;
        if (key === 'Enter' || key === ' ') {
            e.preventDefault();

            if (!lineComplete) {
                charIndex = lines[currentLine].length;
                lineComplete = true;
                return;
            }

            // If choices available, select current
            if (currentChoices && currentChoices.length > 0) {
                selectChoice(selectedChoice);
                return;
            }

            advanceLine();
        }
    }

    function selectChoice(index) {
        // Record choice in history
        addHistoryEntry(speakerName, '[选择] ' + currentChoices[index].text);

        if (choiceCallback) {
            choiceCallback(index);
        }

        // Execute choice action
        var choice = currentChoices[index];
        if (choice && choice.action) {
            executeAction(choice.action);
        }

        currentChoices = null;
        selectedChoice = 0;

        // Close dialogue or advance
        advanceLine();
    }

    function executeAction(action) {
        if (!action) return;
        switch (action.type) {
            case 'startQuest':
                if (typeof NPC !== 'undefined' && action.questId) {
                    NPC.acceptQuest(action.npcId || '');
                }
                break;
            case 'giveItem':
                if (typeof Items !== 'undefined' && action.itemId) {
                    // Items module handles item collection
                }
                break;
            case 'setFlag':
                // Store a dialogue flag for conditional branching
                dialogueFlags[action.flag] = true;
                break;
            case 'changeEmotion':
                if (action.emotion) speakerEmotion = action.emotion;
                break;
        }
    }

    var dialogueFlags = {};

    function advanceLine() {
        currentLine++;
        if (currentLine >= lines.length) {
            active = false;
            var cb = callback;
            callback = null;
            if (cb) {
                cb();
            }
        } else {
            charIndex = 0;
            charTimer = 0;
            lineComplete = false;
            // Record line in history
            addHistoryEntry(speakerName, lines[currentLine - 1]);
        }
    }

    function render(ctx) {
        if (historyOpen) {
            renderHistory(ctx);
            return;
        }

        if (!active) return;

        var canvasW = ctx.canvas.width;
        var canvasH = ctx.canvas.height;
        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;

        switch (layoutMode) {
            case 'fullscreen':
                renderFullscreen(ctx, canvasW, canvasH, fs);
                break;
            case 'center':
                renderCenter(ctx, canvasW, canvasH, fs);
                break;
            default:
                renderBottom(ctx, canvasW, canvasH, fs);
                break;
        }
    }

    // ========================
    // Bottom layout (NPC dialogue)
    // ========================
    function renderBottom(ctx, canvasW, canvasH, fs) {
        var boxW = canvasW * 0.8;
        var boxH = Math.round(140 * fs);
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
        ctx.fillStyle = 'rgba(10,10,20,0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Gold border
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Speaker name
        if (speakerName) {
            ctx.fillStyle = EMOTION_COLORS[speakerEmotion] || '#d4c5a0';
            ctx.font = 'bold ' + Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(speakerName, boxX + 20, boxY + 8);
        }

        // Avatar
        if (speakerName) {
            var avatarY = boxY + 8;
            renderAvatar(ctx, boxX + boxW - AVATAR_SIZE * fs - 15, avatarY, fs);
        }

        // Text with rich formatting
        var textY = speakerName ? boxY + 30 : boxY + boxH / 2 - 8;
        renderRichText(ctx, lines, currentLine, charIndex, lineComplete, boxX + 20, textY, Math.round(16 * fs), fs, boxW - 40);

        // Blinking prompt (only when line is complete and no choices)
        if (lineComplete && (!currentChoices || currentChoices.length === 0)) {
            var alpha = 0.4 + 0.6 * Math.abs(Math.sin(promptBlink));
            ctx.fillStyle = 'rgba(212,197,160,' + alpha.toFixed(2) + ')';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('▼', boxX + boxW - 15, boxY + boxH - 10);
        }

        // Choices
        if (currentChoices && lineComplete) {
            renderChoices(ctx, boxX, boxY + boxH, boxW, fs);
        }

        // Reset
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    // ========================
    // Center layout (reflection / prompts)
    // ========================
    function renderCenter(ctx, canvasW, canvasH, fs) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvasW, canvasH);

        var boxW = canvasW * 0.7;
        var boxH = Math.round(160 * fs);
        var boxX = (canvasW - boxW) / 2;
        var boxY = (canvasH - boxH) / 2;

        // Decorative corners
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 2;
        var cornerLen = 20;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + cornerLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + cornerLen, boxY);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - cornerLen);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + cornerLen, boxY + boxH);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
        ctx.stroke();

        // Box background
        ctx.fillStyle = 'rgba(10,10,20,0.9)';
        ctx.fillRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

        // Title
        if (speakerName) {
            ctx.fillStyle = '#d4c5a0';
            ctx.font = 'bold ' + Math.round(18 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(speakerName, canvasW / 2, boxY + 25);
        }

        var textY = speakerName ? boxY + 50 : boxY + boxH / 2 - 8;
        renderRichText(ctx, lines, currentLine, charIndex, lineComplete, boxX + 30, textY, Math.round(16 * fs), fs, boxW - 60);

        // Prompt
        if (lineComplete) {
            var alpha = 0.4 + 0.6 * Math.abs(Math.sin(promptBlink));
            ctx.fillStyle = 'rgba(212,197,160,' + alpha.toFixed(2) + ')';
            ctx.font = Math.round(13 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('▼', canvasW / 2, boxY + boxH - 12);
        }

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    // ========================
    // Fullscreen layout (lore stones)
    // ========================
    function renderFullscreen(ctx, canvasW, canvasH, fs) {
        // Full overlay
        ctx.fillStyle = 'rgba(5,5,15,0.92)';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Decorative border
        ctx.strokeStyle = 'rgba(212,197,160,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, canvasW - 40, canvasH - 40);

        // Double border
        ctx.strokeStyle = 'rgba(212,197,160,0.15)';
        ctx.strokeRect(28, 28, canvasW - 56, canvasH - 56);

        // Title / Speaker
        if (speakerName) {
            ctx.fillStyle = '#d4c5a0';
            ctx.font = 'bold ' + Math.round(22 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('— ' + speakerName + ' —', canvasW / 2, 60);
        }

        // Text
        var textY = speakerName ? 100 : canvasH / 2 - 30;
        renderRichText(ctx, lines, currentLine, charIndex, lineComplete, 60, textY, Math.round(18 * fs), fs, canvasW - 120);

        // Prompt
        if (lineComplete) {
            var alpha = 0.4 + 0.6 * Math.abs(Math.sin(promptBlink));
            ctx.fillStyle = 'rgba(212,197,160,' + alpha.toFixed(2) + ')';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('▼', canvasW / 2, canvasH - 40);
        }

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    // ========================
    // Rich text rendering with wave fade-in
    // ========================
    function renderRichText(ctx, lineArr, lineIdx, chars, complete, x, y, fontSize, fs, maxWidth) {
        if (lineIdx >= lineArr.length) return;

        var text = lineArr[lineIdx].substring(0, chars);
        ctx.save();

        // Parse rich text segments
        var segments = parseRichText(text);
        var drawX = x;
        var drawY = y;

        for (var si = 0; si < segments.length; si++) {
            var seg = segments[si];
            var segChars = seg.text;

            for (var ci = 0; ci < segChars.length; ci++) {
                var ch = segChars[ci];
                // Wave fade-in: group by WAVE_GROUP_SIZE
                var globalCharIdx = 0;
                for (var pi = 0; pi < si; pi++) {
                    globalCharIdx += segments[pi].text.length;
                }
                globalCharIdx += ci;

                var charAlpha = 1;
                if (!complete) {
                    var groupStart = Math.floor(globalCharIdx / WAVE_GROUP_SIZE) * WAVE_GROUP_SIZE;
                    var groupProgress = (chars - groupStart) / WAVE_GROUP_SIZE;
                    if (groupProgress < 0) groupProgress = 0;
                    if (groupProgress > 1) groupProgress = 1;
                    charAlpha = groupProgress;
                }

                ctx.save();
                ctx.globalAlpha = charAlpha;

                // Apply segment style
                ctx.font = (seg.italic ? 'italic ' : '') + fontSize + 'px "Noto Serif SC", serif';
                ctx.fillStyle = seg.color || '#e0e0e0';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                // Word wrap check
                var charW = ctx.measureText(ch).width;
                if (drawX + charW > x + maxWidth && ch !== '，' && ch !== '。' && ch !== '！' && ch !== '？') {
                    drawX = x;
                    drawY += fontSize + 4;
                }

                ctx.fillText(ch, drawX, drawY);
                drawX += charW;

                ctx.restore();
            }
        }

        ctx.restore();
    }

    function parseRichText(text) {
        var segments = [];
        var i = 0;
        var currentText = '';
        var currentItalic = false;
        var currentColor = '#e0e0e0';

        while (i < text.length) {
            // Check for markup
            if (text[i] === '*' && i + 1 < text.length) {
                // Italic toggle
                if (currentText) {
                    segments.push({ text: currentText, italic: currentItalic, color: currentColor });
                    currentText = '';
                }
                currentItalic = !currentItalic;
                i++;
                continue;
            }

            if (text[i] === '~' && i + 1 < text.length && text[i + 1] === '~') {
                // Pause (just skip, handled by typewriter speed)
                if (currentText) {
                    segments.push({ text: currentText, italic: currentItalic, color: currentColor });
                    currentText = '';
                }
                i += 2;
                continue;
            }

            if (text[i] === '[' && text.indexOf(']', i) > 0) {
                // Color tag [color_name]
                var endBracket = text.indexOf(']', i);
                var colorName = text.substring(i + 1, endBracket);
                var mappedColor = ELEMENT_COLOR_MAP[colorName];
                if (mappedColor) {
                    if (currentText) {
                        segments.push({ text: currentText, italic: currentItalic, color: currentColor });
                        currentText = '';
                    }
                    currentColor = mappedColor;
                }
                i = endBracket + 1;
                continue;
            }

            currentText += text[i];
            i++;
        }

        if (currentText) {
            segments.push({ text: currentText, italic: currentItalic, color: currentColor });
        }

        if (segments.length === 0) {
            segments.push({ text: '', italic: false, color: '#e0e0e0' });
        }

        return segments;
    }

    var ELEMENT_COLOR_MAP = {
        prologue: '#d4c5a0',
        knowledge: '#c0c0ff',
        failure: '#ff6666',
        solitude: '#8888cc',
        love: '#ff88aa',
        prayer: '#ffffaa',
        death: '#aa66aa',
        hope: '#88ff88'
    };

    // ========================
    // Choices rendering
    // ========================
    function renderChoices(ctx, x, baseY, width, fs) {
        if (!currentChoices) return;

        var choiceH = 32;
        var totalH = currentChoices.length * choiceH;
        var startY = baseY + 5;

        for (var i = 0; i < currentChoices.length; i++) {
            var cy = startY + i * choiceH;
            var isSelected = (i === selectedChoice);

            // Highlight selected
            if (isSelected) {
                ctx.fillStyle = 'rgba(212,197,160,0.15)';
                ctx.fillRect(x + 10, cy, width - 20, choiceH - 4);
                ctx.strokeStyle = 'rgba(212,197,160,0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 10, cy, width - 20, choiceH - 4);
            }

            // Choice text
            ctx.fillStyle = isSelected ? '#d4c5a0' : '#888';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText((isSelected ? '▸ ' : '  ') + currentChoices[i].text, x + 20, cy + (choiceH - 4) / 2);
        }
    }

    // ========================
    // Avatar rendering (procedural geometric)
    // ========================
    function renderAvatar(ctx, x, y, fs) {
        var config = SPEAKER_CONFIGS[speakerName] || { bodyColor: '#666', eyeColor: '#888' };
        var size = AVATAR_SIZE * fs;
        var cx = x + size / 2;
        var cy = y + size / 2;
        var r = size * 0.4;

        ctx.save();

        // Ghostly effect
        if (config.ghostly) {
            ctx.globalAlpha = 0.6 + Math.sin(avatarAnimPhase) * 0.2;
        }

        // Frame
        ctx.strokeStyle = EMOTION_COLORS[speakerEmotion] || '#d4c5a0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.fillStyle = config.bodyColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Eyes based on emotion
        renderAvatarEyes(ctx, cx, cy, r, config);

        // Mouth based on emotion
        renderAvatarMouth(ctx, cx, cy, r);

        ctx.restore();
    }

    function renderAvatarEyes(ctx, cx, cy, r, config) {
        var eyeY = cy - r * 0.15;
        var eyeSpacing = r * 0.3;
        var eyeSize = r * 0.12;

        ctx.fillStyle = config.eyeColor || '#fff';

        switch (speakerEmotion) {
            case 'happy':
                // Curved eyes (happy arcs)
                ctx.strokeStyle = config.eyeColor || '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx - eyeSpacing, eyeY, eyeSize, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + eyeSpacing, eyeY, eyeSize, Math.PI, 0);
                ctx.stroke();
                break;
            case 'sad':
                // Droopy eyes
                ctx.beginPath();
                ctx.arc(cx - eyeSpacing, eyeY + 2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + eyeSpacing, eyeY + 2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                // Sad eyebrow lines
                ctx.strokeStyle = config.eyeColor || '#fff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - eyeSpacing - eyeSize, eyeY - eyeSize - 3);
                ctx.lineTo(cx - eyeSpacing + eyeSize, eyeY - eyeSize);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeSpacing + eyeSize, eyeY - eyeSize - 3);
                ctx.lineTo(cx + eyeSpacing - eyeSize, eyeY - eyeSize);
                ctx.stroke();
                break;
            case 'angry':
                // Angry eyes
                ctx.beginPath();
                ctx.arc(cx - eyeSpacing, eyeY, eyeSize * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + eyeSpacing, eyeY, eyeSize * 0.8, 0, Math.PI * 2);
                ctx.fill();
                // Angry eyebrows
                ctx.strokeStyle = config.eyeColor || '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx - eyeSpacing - eyeSize, eyeY - eyeSize - 2);
                ctx.lineTo(cx - eyeSpacing + eyeSize, eyeY - eyeSize - 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeSpacing + eyeSize, eyeY - eyeSize - 2);
                ctx.lineTo(cx + eyeSpacing - eyeSize, eyeY - eyeSize - 5);
                ctx.stroke();
                break;
            case 'surprised':
                // Wide eyes
                ctx.beginPath();
                ctx.arc(cx - eyeSpacing, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + eyeSpacing, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'thinking':
                // One eye closed, one looking up
                ctx.beginPath();
                ctx.arc(cx - eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                // Line for closed eye
                ctx.strokeStyle = config.eyeColor || '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx + eyeSpacing - eyeSize, eyeY);
                ctx.lineTo(cx + eyeSpacing + eyeSize, eyeY);
                ctx.stroke();
                break;
            default:
                // Neutral - simple dots
                ctx.beginPath();
                ctx.arc(cx - eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    function renderAvatarMouth(ctx, cx, cy, r) {
        var mouthY = cy + r * 0.25;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;

        switch (speakerEmotion) {
            case 'happy':
                ctx.beginPath();
                ctx.arc(cx, mouthY - 2, r * 0.2, 0.1, Math.PI - 0.1);
                ctx.stroke();
                break;
            case 'sad':
                ctx.beginPath();
                ctx.arc(cx, mouthY + 6, r * 0.15, Math.PI + 0.2, -0.2);
                ctx.stroke();
                break;
            case 'angry':
                ctx.beginPath();
                ctx.moveTo(cx - r * 0.15, mouthY);
                ctx.lineTo(cx + r * 0.15, mouthY);
                ctx.stroke();
                break;
            case 'surprised':
                ctx.beginPath();
                ctx.arc(cx, mouthY, r * 0.08, 0, Math.PI * 2);
                ctx.stroke();
                break;
            default:
                ctx.beginPath();
                ctx.moveTo(cx - r * 0.12, mouthY);
                ctx.lineTo(cx + r * 0.12, mouthY);
                ctx.stroke();
                break;
        }
    }

    // ========================
    // Dialogue History
    // ========================
    function addHistoryEntry(speaker, text) {
        dialogueHistory.push({
            speaker: speaker || '',
            text: text || '',
            timestamp: Date.now()
        });
        if (dialogueHistory.length > MAX_HISTORY) {
            dialogueHistory.shift();
        }
    }

    function renderHistory(ctx) {
        var cw = ctx.canvas.width;
        var ch = ctx.canvas.height;
        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;

        // Full overlay
        ctx.fillStyle = 'rgba(5,5,15,0.95)';
        ctx.fillRect(0, 0, cw, ch);

        // Border
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, cw - 40, ch - 40);

        // Title
        ctx.fillStyle = '#d4c5a0';
        ctx.font = 'bold ' + Math.round(20 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('对话记录', cw / 2, 45);

        // Entries
        ctx.fillStyle = '#aaa';
        ctx.font = Math.round(13 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        var startY = 70 + historyScroll;
        var maxY = ch - 60;

        for (var i = 0; i < dialogueHistory.length; i++) {
            var entry = dialogueHistory[i];
            var ey = startY + i * 24;
            if (ey < 60 || ey > maxY) continue;

            if (entry.speaker) {
                ctx.fillStyle = '#d4c5a0';
                ctx.fillText(entry.speaker + ':', 40, ey);
                ctx.fillStyle = '#aaa';
                var speakerW = ctx.measureText(entry.speaker + ': ').width;
                // Truncate if too long
                var maxTextW = cw - 80 - speakerW;
                var displayText = entry.text;
                if (ctx.measureText(displayText).width > maxTextW) {
                    while (ctx.measureText(displayText + '...').width > maxTextW && displayText.length > 0) {
                        displayText = displayText.substring(0, displayText.length - 1);
                    }
                    displayText += '...';
                }
                ctx.fillText(displayText, 40 + speakerW, ey);
            } else {
                ctx.fillStyle = '#888';
                ctx.fillText(entry.text, 40, ey);
            }
        }

        if (dialogueHistory.length === 0) {
            ctx.fillStyle = '#555';
            ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无对话记录', cw / 2, ch / 2);
        }

        // Close hint
        ctx.fillStyle = '#555';
        ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        var hintText = (typeof Engine !== 'undefined' && Engine.isMobile) ? '点击关闭' : '按 H 关闭';
        ctx.fillText(hintText, cw / 2, ch - 30);

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function handleHistoryInput(e) {
        if (e.key === 'h' || e.key === 'H' || e.key === 'Escape') {
            historyOpen = false;
            return;
        }
        if (e.key === 'ArrowUp') {
            historyScroll = Math.min(0, historyScroll + 24);
        }
        if (e.key === 'ArrowDown') {
            historyScroll = Math.max(-(dialogueHistory.length * 24 - 200), historyScroll - 24);
        }
    }

    function toggleHistory() {
        historyOpen = !historyOpen;
        historyScroll = 0;
    }

    function isHistoryOpen() {
        return historyOpen;
    }

    // ========================
    // Handle tap (mobile)
    // ========================
    function handleTap() {
        if (historyOpen) {
            historyOpen = false;
            return;
        }

        if (!active) return;

        if (!lineComplete) {
            charIndex = lines[currentLine].length;
            lineComplete = true;
            return;
        }

        // If choices, select current
        if (currentChoices && currentChoices.length > 0) {
            selectChoice(selectedChoice);
            return;
        }

        advanceLine();
    }

    function isActive() {
        return active;
    }

    function getDialogueFlags() {
        return dialogueFlags;
    }

    function setSpeaker(name, emotion) {
        speakerName = name || '';
        if (emotion) speakerEmotion = emotion;
    }

    function setLayout(layout) {
        layoutMode = layout || 'bottom';
    }

    function setSpeed(charsPerSec) {
        CHARS_PER_SEC = charsPerSec || 30;
    }

    function getHistory() {
        return dialogueHistory;
    }

    function clearHistory() {
        dialogueHistory = [];
    }

    function hasFlag(flag) {
        return !!dialogueFlags[flag];
    }

    return {
        show: show,
        showWithChoices: showWithChoices,
        showWithLayout: showWithLayout,
        update: update,
        handleInput: handleInput,
        render: render,
        isActive: isActive,
        handleTap: handleTap,
        setSpeaker: setSpeaker,
        setLayout: setLayout,
        setSpeed: setSpeed,
        toggleHistory: toggleHistory,
        isHistoryOpen: isHistoryOpen,
        getHistory: getHistory,
        clearHistory: clearHistory,
        getDialogueFlags: getDialogueFlags,
        hasFlag: hasFlag,
        selectChoice: selectChoice
    };
})();

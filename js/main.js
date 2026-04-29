// 通向奥秘 - 主入口 & 全局系统模块

// ============================================================
// 1A. SaveManager — 存档管理
// ============================================================
var SaveManager = (function () {
    var SAVE_KEY = 'mystery_maze_save';
    var SETTINGS_KEY = 'mystery_maze_settings';

    function save() {
        var data = {
            levelIndex: -1,
            collected: [],
            keys: [],
            playerPos: { gx: 1, gy: 1 },
            explored: null,
            timestamp: Date.now()
        };

        if (typeof Levels !== 'undefined') {
            data.levelIndex = Levels.getCurrentLevelIndex();
        }
        if (typeof Items !== 'undefined') {
            data.collected = Items.getCollected().slice();
            data.keys = Items.getKeys().slice();
        }
        if (typeof Player !== 'undefined') {
            var gp = Player.getGridPos();
            data.playerPos = { gx: gp.gx, gy: gp.gy };
        }
        if (typeof Lighting !== 'undefined') {
            // Serialize explored array
            var map = (typeof Engine !== 'undefined') ? Engine.getMap() : null;
            if (map) {
                var rows = map.length;
                var cols = map[0].length;
                data.explored = [];
                for (var y = 0; y < rows; y++) {
                    data.explored[y] = [];
                    for (var x = 0; x < cols; x++) {
                        data.explored[y][x] = Lighting.isExplored(x, y);
                    }
                }
            }
        }

        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            return false;
        }
    }

    function load() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || typeof data.levelIndex !== 'number') return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function hasSave() {
        try {
            return localStorage.getItem(SAVE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }

    function deleteSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {
            // Silently fail
        }
    }

    function saveSettings(settingsObj) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsObj));
            return true;
        } catch (e) {
            return false;
        }
    }

    function loadSettings() {
        try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function getSaveInfo() {
        var data = load();
        if (!data) return null;
        var info = {
            levelIndex: data.levelIndex,
            collectedCount: data.collected ? data.collected.length : 0,
            keyCount: data.keys ? data.keys.length : 0,
            timestamp: data.timestamp || 0
        };
        if (info.timestamp > 0) {
            var d = new Date(info.timestamp);
            info.dateString = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
        } else {
            info.dateString = '未知';
        }
        return info;
    }

    return {
        save: save,
        load: load,
        hasSave: hasSave,
        deleteSave: deleteSave,
        saveSettings: saveSettings,
        loadSettings: loadSettings,
        getSaveInfo: getSaveInfo
    };
})();

// ============================================================
// 1B. AudioManager — 音频系统
// ============================================================
var AudioManager = (function () {
    var audioCtx = null;
    var masterGain = null;
    var musicGain = null;
    var sfxGain = null;
    var musicVolume = 0.5;
    var sfxVolume = 0.7;
    var currentMusic = null;
    var currentOscillators = [];
    var initialized = false;

    function init() {
        if (initialized) return;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            audioCtx = new AC();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 1.0;
            masterGain.connect(audioCtx.destination);
            musicGain = audioCtx.createGain();
            musicGain.gain.value = musicVolume;
            musicGain.connect(masterGain);
            sfxGain = audioCtx.createGain();
            sfxGain.gain.value = sfxVolume;
            sfxGain.connect(masterGain);
            initialized = true;
        } catch (e) {
            // Web Audio not available
        }
    }

    function ensureContext() {
        if (!initialized) init();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playNote(freq, duration, type, gainNode) {
        ensureContext();
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gainNode || sfxGain);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    }

    // Predefined SFX: ascending arpeggio for pickups
    function playCollectSound() {
        ensureContext();
        if (!audioCtx) return;
        var notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        for (var i = 0; i < notes.length; i++) {
            playNote(notes[i], 0.3, 'sine');
        }
    }

    // Short click for footsteps
    function playStepSound() {
        ensureContext();
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 80 + Math.random() * 40;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
    }

    // Low thud for doors
    function playDoorSound() {
        ensureContext();
        if (!audioCtx) return;
        playNote(60, 0.4, 'sine');
        playNote(45, 0.5, 'triangle');
    }

    // Locked door buzz
    function playLockedSound() {
        ensureContext();
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 120;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
    }

    // Transition whoosh using filtered noise
    function playTransitionSound() {
        ensureContext();
        if (!audioCtx) return;
        var bufferSize = audioCtx.sampleRate * 0.5;
        var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        var noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        var filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        var gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        noise.start(audioCtx.currentTime);
        noise.stop(audioCtx.currentTime + 0.5);
    }

    // Generic SFX dispatcher
    function playSFX(name) {
        switch (name) {
            case 'pickup':
            case 'fragment':
                playCollectSound();
                break;
            case 'door':
                playDoorSound();
                break;
            case 'locked':
                playLockedSound();
                break;
            case 'step':
                playStepSound();
                break;
            case 'transition':
                playTransitionSound();
                break;
            case 'key':
                playNote(880, 0.15, 'triangle');
                setTimeout(function () { playNote(1100, 0.2, 'triangle'); }, 100);
                break;
            default:
                playNote(440, 0.1, 'sine');
                break;
        }
    }

    // Ambient drone music per element
    var ELEMENT_FREQS = {
        prologue: { freq: 220, type: 'sine' },
        knowledge: { freq: 330, type: 'triangle' },
        failure: { freq: 165, type: 'sawtooth' },
        solitude: { freq: 196, type: 'sine' },
        love: { freq: 293, type: 'triangle' },
        prayer: { freq: 261, type: 'sine' },
        death: { freq: 110, type: 'sawtooth' },
        hope: { freq: 392, type: 'triangle' }
    };

    function playMusic(elementName) {
        ensureContext();
        if (!audioCtx) return;
        stopMusic();

        var cfg = ELEMENT_FREQS[elementName];
        if (!cfg) cfg = { freq: 220, type: 'sine' };

        // Create two detuned oscillators for a rich drone
        var osc1 = audioCtx.createOscillator();
        var osc2 = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        osc1.type = cfg.type;
        osc1.frequency.value = cfg.freq;
        osc2.type = cfg.type;
        osc2.frequency.value = cfg.freq * 1.005; // slight detune

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(musicGain);

        osc1.start();
        osc2.start();

        currentOscillators = [osc1, osc2];
        currentMusic = { gain: gain, element: elementName };
    }

    function stopMusic() {
        if (currentMusic && audioCtx) {
            try {
                currentMusic.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
                var oscs = currentOscillators;
                setTimeout(function () {
                    for (var i = 0; i < oscs.length; i++) {
                        try { oscs[i].stop(); } catch (e) { /* already stopped */ }
                    }
                }, 1100);
            } catch (e) {
                // Context may be closed
            }
        }
        currentMusic = null;
        currentOscillators = [];
    }

    function setMusicVolume(v) {
        musicVolume = v;
        if (musicGain) musicGain.gain.value = v;
    }

    function setSFXVolume(v) {
        sfxVolume = v;
        if (sfxGain) sfxGain.gain.value = v;
    }

    function isInitialized() {
        return initialized;
    }

    return {
        init: init,
        playSFX: playSFX,
        playMusic: playMusic,
        stopMusic: stopMusic,
        setMusicVolume: setMusicVolume,
        setSFXVolume: setSFXVolume,
        playStepSound: playStepSound,
        playCollectSound: playCollectSound,
        playDoorSound: playDoorSound,
        playTransitionSound: playTransitionSound,
        isInitialized: isInitialized
    };
})();

// ============================================================
// 1C. Settings — 设置管理
// ============================================================
var Settings = (function () {
    var STORAGE_KEY = 'mystery_maze_settings';

    var defaults = {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        textSpeed: 30,
        showMinimap: true,
        showParticles: true,
        screenShake: true,
        fontSize: 'normal'   // 'small', 'normal', 'large'
    };

    var settings = {};

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var loaded = JSON.parse(raw);
                for (var key in defaults) {
                    if (defaults.hasOwnProperty(key)) {
                        settings[key] = (loaded[key] !== undefined) ? loaded[key] : defaults[key];
                    }
                }
            } else {
                settings = shallowCopy(defaults);
            }
        } catch (e) {
            settings = shallowCopy(defaults);
        }
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            // Silently fail
        }
    }

    function shallowCopy(obj) {
        var copy = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) copy[key] = obj[key];
        }
        return copy;
    }

    function get(key) {
        if (settings.hasOwnProperty(key)) return settings[key];
        if (defaults.hasOwnProperty(key)) return defaults[key];
        return undefined;
    }

    function set(key, value) {
        settings[key] = value;
        save();
        // Live-apply audio settings
        if (key === 'musicVolume' && typeof AudioManager !== 'undefined') {
            AudioManager.setMusicVolume(value);
        }
        if (key === 'sfxVolume' && typeof AudioManager !== 'undefined') {
            AudioManager.setSFXVolume(value);
        }
    }

    function applyFontScale() {
        var size = settings.fontSize || 'normal';
        switch (size) {
            case 'small': return 0.85;
            case 'large': return 1.4;
            default: return 1.0;
        }
    }

    function reset() {
        settings = shallowCopy(defaults);
        save();
    }

    function getAll() {
        return shallowCopy(settings);
    }

    // Initialize on load
    load();

    return {
        load: load,
        save: save,
        get: get,
        set: set,
        applyFontScale: applyFontScale,
        reset: reset,
        getAll: getAll
    };
})();

// ============================================================
// 1D. GameStats — 游戏统计
// ============================================================
var GameStats = (function () {
    var STORAGE_KEY = 'mystery_maze_stats';

    var stats = {
        startTime: 0,
        playTime: 0,
        totalSteps: 0,
        levelsCompleted: 0,
        fragmentsCollected: 0,
        doorsOpened: 0,
        npcsTalkedTo: 0,
        mapsExpanded: 0,
        deathCount: 0,
        endingChosen: null,
        levelTimes: {},
        speedrunTime: null
    };

    var currentLevelStart = 0;
    var tracking = false;

    function init() {
        stats.startTime = Date.now();
        stats.playTime = 0;
        stats.totalSteps = 0;
        stats.levelsCompleted = 0;
        stats.fragmentsCollected = 0;
        stats.doorsOpened = 0;
        stats.npcsTalkedTo = 0;
        stats.mapsExpanded = 0;
        stats.deathCount = 0;
        stats.endingChosen = null;
        stats.levelTimes = {};
        stats.speedrunTime = null;
        currentLevelStart = 0;
        tracking = true;
    }

    function recordStep() {
        if (tracking) stats.totalSteps++;
    }

    function recordFragment() {
        if (tracking) stats.fragmentsCollected++;
    }

    function recordDoor() {
        if (tracking) stats.doorsOpened++;
    }

    function recordNPC() {
        if (tracking) stats.npcsTalkedTo++;
    }

    function recordExpansion() {
        if (tracking) stats.mapsExpanded++;
    }

    function recordDeath() {
        if (tracking) stats.deathCount++;
    }

    function startLevel(id) {
        currentLevelStart = Date.now();
        if (tracking && id) {
            stats.levelTimes[id] = 0;
        }
    }

    function endLevel(id) {
        if (currentLevelStart > 0 && id) {
            var elapsed = (Date.now() - currentLevelStart) / 1000;
            stats.levelTimes[id] = elapsed;
            stats.levelsCompleted++;
        }
        currentLevelStart = 0;
    }

    function setEnding(choice) {
        stats.endingChosen = choice;
        stats.playTime = getPlayTimeSeconds();
    }

    function getPlayTimeSeconds() {
        if (stats.startTime === 0) return 0;
        return (Date.now() - stats.startTime) / 1000;
    }

    function getPlayTime() {
        var seconds = getPlayTimeSeconds();
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    function getStats() {
        var copy = {};
        for (var key in stats) {
            if (stats.hasOwnProperty(key)) {
                if (typeof stats[key] === 'object') {
                    copy[key] = JSON.parse(JSON.stringify(stats[key]));
                } else {
                    copy[key] = stats[key];
                }
            }
        }
        return copy;
    }

    function save() {
        try {
            stats.playTime = getPlayTimeSeconds();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch (e) {
            // Silently fail
        }
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var loaded = JSON.parse(raw);
                for (var key in stats) {
                    if (stats.hasOwnProperty(key) && loaded[key] !== undefined) {
                        stats[key] = loaded[key];
                    }
                }
            }
        } catch (e) {
            // Use defaults
        }
    }

    function isTracking() {
        return tracking;
    }

    function setTracking(val) {
        tracking = !!val;
    }

    return {
        init: init,
        recordStep: recordStep,
        recordFragment: recordFragment,
        recordDoor: recordDoor,
        recordNPC: recordNPC,
        recordExpansion: recordExpansion,
        recordDeath: recordDeath,
        startLevel: startLevel,
        endLevel: endLevel,
        setEnding: setEnding,
        getPlayTime: getPlayTime,
        getPlayTimeSeconds: getPlayTimeSeconds,
        getStats: getStats,
        save: save,
        load: load,
        isTracking: isTracking,
        setTracking: setTracking
    };
})();

// ============================================================
// 1E. TutorialSystem — 教程系统
// ============================================================
var TutorialSystem = (function () {
    var STORAGE_KEY = 'mystery_maze_tutorial';

    var tutorialSteps = [
        { trigger: 'start', text: '欢迎来到迷宫。在迷雾中，你只能看到周围的一小片区域。', shown: false },
        { trigger: 'firstMove', text: '你可以使用方向键或屏幕上的按钮移动。', shown: false },
        { trigger: 'firstFragment', text: '你找到了一片碎片！每个碎片代表一种人生经验。', shown: false },
        { trigger: 'firstDoor', text: '有些门需要钥匙才能打开。在迷宫中寻找钥匙。', shown: false },
        { trigger: 'firstNPC', text: '你遇到了一个灵魂。靠近并按 E 交互来聆听他们的话。', shown: false },
        { trigger: 'firstHidden', text: '你感知到了隐藏的路径。失败的经历让你看到了别人看不到的路。', shown: false },
        { trigger: 'mapExpand', text: '迷宫在扩展……随着你收集更多碎片，新的区域会出现。', shown: false },
        { trigger: 'exitFound', text: '你找到了出口的光芒。走进去吧，前方还有更深的迷宫。', shown: false },
        { trigger: 'firstLore', text: '你发现了一段古老的文字。这个世界曾有人来过。', shown: false },
        { trigger: 'firstHazard', text: '小心！这片区域有些不寻常。注意你的视野变化。', shown: false },
        { trigger: 'firstSecret', text: '你发现了一个隐藏的房间！好奇心是最好的向导。', shown: false },
        { trigger: 'firstPuzzle', text: '这里有一个机关。观察周围的环境，找到解谜的方法。', shown: false }
    ];

    var tutorialQueue = [];
    var isShowing = false;
    var currentText = '';
    var displayAlpha = 0;
    var displayTimer = 0;
    var DISPLAY_DURATION = 4.0; // seconds to show each tutorial

    function trigger(eventName) {
        for (var i = 0; i < tutorialSteps.length; i++) {
            if (tutorialSteps[i].trigger === eventName && !tutorialSteps[i].shown) {
                tutorialSteps[i].shown = true;
                tutorialQueue.push(tutorialSteps[i].text);
                saveSeenFlags();
                break;
            }
        }
    }

    function update(dt) {
        if (isShowing) {
            // Fade in
            if (displayAlpha < 1) {
                displayAlpha += dt * 2;
                if (displayAlpha > 1) displayAlpha = 1;
            }
            displayTimer += dt;
            if (displayTimer >= DISPLAY_DURATION) {
                // Fade out
                displayAlpha -= dt * 2;
                if (displayAlpha <= 0) {
                    displayAlpha = 0;
                    isShowing = false;
                    currentText = '';
                    displayTimer = 0;
                }
            }
        } else if (tutorialQueue.length > 0) {
            // Start showing next tutorial
            currentText = tutorialQueue.shift();
            isShowing = true;
            displayAlpha = 0;
            displayTimer = 0;
        }
    }

    function render(ctx) {
        if (!isShowing || !currentText) return;

        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;
        var cw = ctx.canvas.width;
        var ch = ctx.canvas.height;

        ctx.save();
        ctx.globalAlpha = displayAlpha * 0.9;

        // Background bar at bottom
        var barH = Math.round(50 * fs);
        var barY = ch - barH - 10;
        ctx.fillStyle = 'rgba(10,10,20,0.85)';
        ctx.fillRect(0, barY, cw, barH);

        // Gold top border
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, barY);
        ctx.lineTo(cw, barY);
        ctx.stroke();

        // Tutorial icon
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(16 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖', 12, barY + barH / 2);

        // Tutorial text
        ctx.fillStyle = '#e0d8c0';
        ctx.font = Math.round(14 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentText, 40, barY + barH / 2);

        ctx.restore();
    }

    function isTutorialActive() {
        return isShowing || tutorialQueue.length > 0;
    }

    function reset() {
        for (var i = 0; i < tutorialSteps.length; i++) {
            tutorialSteps[i].shown = false;
        }
        tutorialQueue = [];
        isShowing = false;
        currentText = '';
        displayAlpha = 0;
        displayTimer = 0;
        saveSeenFlags();
    }

    function hasSeen(triggerName) {
        for (var i = 0; i < tutorialSteps.length; i++) {
            if (tutorialSteps[i].trigger === triggerName) {
                return tutorialSteps[i].shown;
            }
        }
        return false;
    }

    function saveSeenFlags() {
        try {
            var flags = {};
            for (var i = 0; i < tutorialSteps.length; i++) {
                flags[tutorialSteps[i].trigger] = tutorialSteps[i].shown;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
        } catch (e) {
            // Silently fail
        }
    }

    function loadSeenFlags() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var flags = JSON.parse(raw);
                for (var i = 0; i < tutorialSteps.length; i++) {
                    if (flags[tutorialSteps[i].trigger] === true) {
                        tutorialSteps[i].shown = true;
                    }
                }
            }
        } catch (e) {
            // Use defaults
        }
    }

    // Load on module init
    loadSeenFlags();

    return {
        trigger: trigger,
        update: update,
        render: render,
        isTutorialActive: isTutorialActive,
        reset: reset,
        hasSeen: hasSeen
    };
})();

// ============================================================
// 1F. AchievementSystem — 成就系统
// ============================================================
var AchievementSystem = (function () {
    var STORAGE_KEY = 'mystery_maze_achievements';

    var achievements = [
        { id: 'first_fragment', name: '初见光明', desc: '收集第一片碎片', unlocked: false },
        { id: 'all_fragments', name: '完整之环', desc: '收集所有碎片', unlocked: false },
        { id: 'speedRunner', name: '疾行者', desc: '在30分钟内完成游戏', unlocked: false },
        { id: 'explorer', name: '探索者', desc: '触发所有地图扩展', unlocked: false },
        { id: 'lonewolf', name: '独行侠', desc: '不与任何NPC对话完成游戏', unlocked: false },
        { id: 'listener', name: '倾听者', desc: '与所有NPC对话', unlocked: false },
        { id: 'cartographer', name: '制图师', desc: '探索90%以上的地图', unlocked: false },
        { id: 'brave', name: '勇者', desc: '选择拥抱未知', unlocked: false },
        { id: 'keeper', name: '守望者', desc: '选择继续探索', unlocked: false },
        { id: 'speed_demon', name: '闪电', desc: '在10分钟内完成游戏', unlocked: false },
        { id: 'completionist', name: '完美主义者', desc: '解锁所有其他成就', unlocked: false },
        { id: 'minimalist', name: '极简主义者', desc: '少于500步完成游戏', unlocked: false }
    ];

    var notificationQueue = [];
    var notifyAlpha = 0;
    var notifyText = '';
    var notifyName = '';
    var notifyTimer = 0;
    var NOTIFY_DURATION = 3.0;

    function unlock(id) {
        for (var i = 0; i < achievements.length; i++) {
            if (achievements[i].id === id && !achievements[i].unlocked) {
                achievements[i].unlocked = true;
                notificationQueue.push({ name: achievements[i].name, desc: achievements[i].desc });
                save();
                return true;
            }
        }
        return false;
    }

    function check(achievementId) {
        if (typeof GameStats === 'undefined') return;
        var s = GameStats.getStats();

        switch (achievementId) {
            case 'first_fragment':
                if (s.fragmentsCollected >= 1) unlock('first_fragment');
                break;
            case 'all_fragments':
                if (s.fragmentsCollected >= 8) unlock('all_fragments');
                break;
            case 'speedRunner':
                if (s.endingChosen && s.playTime > 0 && s.playTime <= 1800) unlock('speedRunner');
                break;
            case 'speed_demon':
                if (s.endingChosen && s.playTime > 0 && s.playTime <= 600) unlock('speed_demon');
                break;
            case 'explorer':
                if (s.mapsExpanded >= 5) unlock('explorer');
                break;
            case 'lonewolf':
                if (s.endingChosen && s.npcsTalkedTo === 0) unlock('lonewolf');
                break;
            case 'listener':
                if (s.npcsTalkedTo >= 8) unlock('listener');
                break;
            case 'minimalist':
                if (s.endingChosen && s.totalSteps > 0 && s.totalSteps < 500) unlock('minimalist');
                break;
            case 'brave':
                if (s.endingChosen === 'b') unlock('brave');
                break;
            case 'keeper':
                if (s.endingChosen === 'a') unlock('keeper');
                break;
            case 'completionist':
                var unlockedCount = 0;
                for (var i = 0; i < achievements.length; i++) {
                    if (achievements[i].id !== 'completionist' && achievements[i].unlocked) unlockedCount++;
                }
                if (unlockedCount >= achievements.length - 1) unlock('completionist');
                break;
        }
    }

    function checkAll() {
        var ids = [];
        for (var i = 0; i < achievements.length; i++) {
            ids.push(achievements[i].id);
        }
        for (var i = 0; i < ids.length; i++) {
            check(ids[i]);
        }
    }

    function update(dt) {
        if (notifyAlpha > 0) {
            if (notifyTimer < NOTIFY_DURATION - 0.5) {
                notifyTimer += dt;
            } else {
                notifyAlpha -= dt * 2;
                if (notifyAlpha <= 0) {
                    notifyAlpha = 0;
                    notifyText = '';
                    notifyName = '';
                    notifyTimer = 0;
                }
            }
        } else if (notificationQueue.length > 0) {
            var notif = notificationQueue.shift();
            notifyName = notif.name;
            notifyText = notif.desc;
            notifyAlpha = 1;
            notifyTimer = 0;
        }
    }

    function render(ctx) {
        if (notifyAlpha <= 0) return;

        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;
        var cw = ctx.canvas.width;

        ctx.save();
        ctx.globalAlpha = notifyAlpha;

        var boxW = Math.min(280, cw - 40);
        var boxH = Math.round(50 * fs);
        var boxX = (cw - boxW) / 2;
        var boxY = 50;

        // Background
        ctx.fillStyle = 'rgba(30,25,15,0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Gold border
        ctx.strokeStyle = '#d4c5a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Achievement icon
        ctx.fillStyle = '#d4c5a0';
        ctx.font = Math.round(16 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', boxX + 10, boxY + boxH / 2 - 2);

        // Title
        ctx.fillStyle = '#d4c5a0';
        ctx.font = 'bold ' + Math.round(14 * fs) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'left';
        ctx.fillText('成就解锁：' + notifyName, boxX + 36, boxY + boxH / 2 - 6);

        // Description
        ctx.fillStyle = '#999';
        ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
        ctx.fillText(notifyText, boxX + 36, boxY + boxH / 2 + 10);

        ctx.restore();
    }

    function getUnlocked() {
        var result = [];
        for (var i = 0; i < achievements.length; i++) {
            if (achievements[i].unlocked) result.push(achievements[i].id);
        }
        return result;
    }

    function getAll() {
        var result = [];
        for (var i = 0; i < achievements.length; i++) {
            result.push({
                id: achievements[i].id,
                name: achievements[i].name,
                desc: achievements[i].desc,
                unlocked: achievements[i].unlocked
            });
        }
        return result;
    }

    function save() {
        try {
            var data = {};
            for (var i = 0; i < achievements.length; i++) {
                data[achievements[i].id] = achievements[i].unlocked;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // Silently fail
        }
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var data = JSON.parse(raw);
                for (var i = 0; i < achievements.length; i++) {
                    if (data[achievements[i].id] === true) {
                        achievements[i].unlocked = true;
                    }
                }
            }
        } catch (e) {
            // Use defaults
        }
    }

    function reset() {
        for (var i = 0; i < achievements.length; i++) {
            achievements[i].unlocked = false;
        }
        notificationQueue = [];
        notifyAlpha = 0;
        save();
    }

    // Load on module init
    load();

    return {
        check: check,
        checkAll: checkAll,
        unlock: unlock,
        update: update,
        render: render,
        getUnlocked: getUnlocked,
        getAll: getAll,
        save: save,
        load: load,
        reset: reset
    };
})();

// ============================================================
// Main — 入口点
// ============================================================
var Main = (function () {
    document.addEventListener('DOMContentLoaded', function () {
        // Load settings and achievements before engine init
        Settings.load();
        AchievementSystem.load();
        GameStats.init();

        // Initialize engine (which starts the game)
        Engine.init();
    });
})();

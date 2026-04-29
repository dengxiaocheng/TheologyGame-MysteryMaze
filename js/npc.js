// 通向奥秘 - NPC 模块

var NPC = (function () {
    var TILE_SIZE = 32;

    var npcs = [];

    // ── NPC Type Definitions ──
    var NPC_TYPES = {
        traveler: {
            bodyColor: '#cc9966',
            glowColor: '#ddaa77',
            personality: 'passive',
            speed: 1.2,
            animStyle: 'walk'
        },
        gatekeeper: {
            bodyColor: '#888899',
            glowColor: '#aaaacc',
            personality: 'passive',
            speed: 0,
            animStyle: 'idle'
        },
        ghost: {
            bodyColor: '#8888cc',
            glowColor: '#aaaaee',
            personality: 'passive',
            speed: 0.8,
            animStyle: 'float',
            ghostly: true
        },
        merchant: {
            bodyColor: '#aa8844',
            glowColor: '#ccaa66',
            personality: 'passive',
            speed: 0.5,
            animStyle: 'idle'
        },
        guide: {
            bodyColor: '#88cc88',
            glowColor: '#aaeeaa',
            personality: 'passive',
            speed: 1.0,
            animStyle: 'walk'
        }
    };

    // ── Quest Definitions ──
    var QUEST_DEFS = {
        quest_lost_letter: {
            id: 'quest_lost_letter',
            type: 'fetch',
            description: '找到遗失的信件，交还给旅人。',
            objectives: [{ type: 'collect', target: 'lost_letter', count: 1 }],
            reward: { type: 'item', itemId: 'health_potion' },
            npcGiver: 'knowledge_sage',
            requiredLevel: 1
        },
        quest_silent_prayer: {
            id: 'quest_silent_prayer',
            type: 'dialogue',
            description: '在祈祷室中静默片刻，聆听内心的声音。',
            objectives: [{ type: 'interact', target: 'prayer_shrine', count: 1 }],
            reward: { type: 'effect', effect: 'light_boost', duration: 30 },
            npcGiver: 'prayer_monk',
            requiredLevel: 5
        },
        quest_remember_name: {
            id: 'quest_remember_name',
            type: 'dialogue',
            description: '帮助孤独的回声记起自己的名字。',
            objectives: [{ type: 'dialogue', target: 'solitude_echo_1', count: 3 }],
            reward: { type: 'item', itemId: 'compass' },
            npcGiver: 'solitude_echo_1',
            requiredLevel: 3
        },
        quest_beyond_door: {
            id: 'quest_beyond_door',
            type: 'exploration',
            description: '找到通往彼岸的门，直面死亡的真谛。',
            objectives: [{ type: 'reach', target: 'death_shrine', count: 1 }],
            reward: { type: 'item', itemId: 'lantern_shadows' },
            npcGiver: 'death_shadow',
            requiredLevel: 6
        },
        quest_last_light: {
            id: 'quest_last_light',
            type: 'fetch',
            description: '收集散落的希望之光碎片。',
            objectives: [{ type: 'collect', target: 'hope_shard', count: 3 }],
            reward: { type: 'effect', effect: 'speed_boost', duration: 60 },
            npcGiver: 'hope_guide',
            requiredLevel: 7
        }
    };

    // ── Quest State Tracking ──
    var activeQuests = [];
    var completedQuests = {};
    var questProgress = {};
    var MAX_ACTIVE_QUESTS = 3;

    // ── Dialogue Trees ──
    var DIALOGUE_TREES = {
        knowledge_sage: [
            {
                id: 'greeting',
                text: '你好，求知者。所有的知识都始于一个问题。',
                choices: [
                    { text: '请教我一些东西。', next: 'teach' },
                    { text: '你有任务给我吗？', next: 'quest_offer', condition: function () { return !completedQuests['quest_lost_letter']; } },
                    { text: '再见。', next: null }
                ]
            },
            {
                id: 'teach',
                text: '知识不是用来填满容器的，而是用来点燃火焰的。那些被记住的知识终将被遗忘，但被理解的知识会永远改变你。',
                choices: [
                    { text: '我明白了。', next: 'teach2' },
                    { text: '谢谢。', next: null }
                ]
            },
            {
                id: 'teach2',
                text: '追求知识不是为了让疑问消失，而是让疑问变得更深刻。这才是活着的证明。',
                choices: [
                    { text: '我会记住这些。', next: null }
                ]
            },
            {
                id: 'quest_offer',
                text: '我遗失了一封重要的信件。如果你能在迷宫中找到它……我会好好报答你的。',
                choices: [
                    { text: '我来帮你。', next: 'quest_accept', action: 'startQuest' },
                    { text: '抱歉，我现在没有时间。', next: null }
                ]
            },
            {
                id: 'quest_accept',
                text: '谢谢你。信件应该在某个书架附近。请仔细寻找。',
                choices: [
                    { text: '我会找到的。', next: null }
                ]
            }
        ],
        solitude_echo_1: [
            {
                id: 'greeting',
                text: '…是你吗？我在这里等了很久，久到忘记了在等谁。',
                choices: [
                    { text: '你是谁？', next: 'who' },
                    { text: '你为什么在这里？', next: 'why' },
                    { text: '你还好吗？', next: 'ok' }
                ]
            },
            {
                id: 'who',
                text: '我不记得了。也许我就是你——你内心深处的声音，从墙壁上弹回来。',
                choices: [
                    { text: '那你的声音和我的很像。', next: 'alike' },
                    { text: '我会帮你记起来。', next: 'quest_offer', condition: function () { return !completedQuests['quest_remember_name']; } }
                ]
            },
            {
                id: 'why',
                text: '因为孤独不是惩罚。它是一位严厉的老师，只给你真相。',
                choices: [
                    { text: '真相是什么？', next: 'truth' },
                    { text: '我理解。', next: null }
                ]
            },
            {
                id: 'ok',
                text: '倾听它吧，它比你以为的更温柔。在寂静中，你才能听见自己内心深处的声音。',
                choices: [
                    { text: '谢谢你。', next: null }
                ]
            },
            {
                id: 'alike',
                text: '也许吧。孤独像一面镜子，你在其中看到的永远是自己的倒影。',
                choices: [
                    { text: '我会记住这些的。', next: null }
                ]
            },
            {
                id: 'truth',
                text: '当你学会与孤独对话时，你会发现它其实很温柔。有些路只能一个人走。',
                choices: [
                    { text: '我正在学着接受。', next: null }
                ]
            },
            {
                id: 'quest_offer',
                text: '你愿意帮我记起自己的名字吗？也许多和我说几次话，我就能记起来了。',
                choices: [
                    { text: '我会的。', next: 'quest_accept', action: 'startQuest' },
                    { text: '也许下次吧。', next: null }
                ]
            },
            {
                id: 'quest_accept',
                text: '谢谢你……也许在对话中，我能找回自己。',
                choices: [
                    { text: '我会回来的。', next: null }
                ]
            }
        ],
        prayer_monk: [
            {
                id: 'greeting',
                text: '你来了。祈祷不是请求——是聆听。',
                choices: [
                    { text: '教我如何祈祷。', next: 'teach' },
                    { text: '你在等什么？', next: 'waiting' },
                    { text: '这里很安静。', next: 'silence' }
                ]
            },
            {
                id: 'teach',
                text: '当你停止说话，整个世界开始回应。跪下并不代表屈服，而是放下所有的盔甲。',
                choices: [
                    { text: '放下盔甲……', next: 'armor' },
                    { text: '我明白了。', next: null }
                ]
            },
            {
                id: 'waiting',
                text: '等待。不是等待某个人或某件事——而是等待自己准备好去聆听。',
                choices: [
                    { text: '我已经准备好了。', next: 'quest_offer', condition: function () { return !completedQuests['quest_silent_prayer']; } },
                    { text: '我会试试。', next: null }
                ]
            },
            {
                id: 'silence',
                text: '在真正的静默中，你会找到比语言更古老的东西。',
                choices: [
                    { text: '比语言更古老？', next: 'older' },
                    { text: '我感受到了。', next: null }
                ]
            },
            {
                id: 'armor',
                text: '是的。盔甲保护你不受伤，但也让你感受不到温暖。祈祷就是脱下盔甲的勇气。',
                choices: [
                    { text: '谢谢你，师父。', next: null }
                ]
            },
            {
                id: 'older',
                text: '沉默。存在本身的脉搏。当你安静下来时，你能听到整个宇宙在呼吸。',
                choices: [
                    { text: '我会记住这一刻。', next: null }
                ]
            },
            {
                id: 'quest_offer',
                text: '如果你愿意，去神龛前静默片刻。你会发现祈祷不需要语言，只需要安静。',
                choices: [
                    { text: '我愿意。', next: 'quest_accept', action: 'startQuest' },
                    { text: '让我考虑一下。', next: null }
                ]
            },
            {
                id: 'quest_accept',
                text: '去吧。在安静中，你会找到你需要的答案。',
                choices: [
                    { text: '谢谢。', next: null }
                ]
            }
        ],
        death_shadow: [
            {
                id: 'greeting',
                text: '你害怕吗？害怕是正常的。每个活着的生命都害怕终结。',
                choices: [
                    { text: '是的，我害怕。', next: 'afraid' },
                    { text: '死亡是什么？', next: 'what_is' },
                    { text: '我不怕。', next: 'brave' }
                ]
            },
            {
                id: 'afraid',
                text: '害怕不是懦弱。害怕证明你在乎。只有不在乎的人才会无所畏惧。',
                choices: [
                    { text: '但我不想消失。', next: 'disappear' },
                    { text: '你说得对。', next: null }
                ]
            },
            {
                id: 'what_is',
                text: '死亡不是终结——它是一扇门。你不会消失，你只是变成了别的什么。就像火焰熄灭后，热仍然留在空气里。',
                choices: [
                    { text: '变成什么？', next: 'become' },
                    { text: '这让我安心了一些。', next: null }
                ]
            },
            {
                id: 'brave',
                text: '勇敢和恐惧不是对立的。真正的勇敢，是带着恐惧继续前行。',
                choices: [
                    { text: '我明白了。', next: 'quest_offer', condition: function () { return !completedQuests['quest_beyond_door']; } },
                    { text: '谢谢你。', next: null }
                ]
            },
            {
                id: 'disappear',
                text: '你不会消失。你的痕迹留在每一面你触碰过的墙壁上，你的回声留在每一个你走过的转角。',
                choices: [
                    { text: '这让我感觉好了一些。', next: null }
                ]
            },
            {
                id: 'become',
                text: '变成灰烬中的种子。变成寂静中的回声。变成黑暗中的一缕热气。所有的新生都从灰烬开始。',
                choices: [
                    { text: '我会记住的。', next: null }
                ]
            },
            {
                id: 'quest_offer',
                text: '如果你愿意，找到通往彼岸的门。那里有你需要的答案。',
                choices: [
                    { text: '我会去找的。', next: 'quest_accept', action: 'startQuest' },
                    { text: '也许以后。', next: null }
                ]
            },
            {
                id: 'quest_accept',
                text: '去吧。不要害怕——我就在门的另一边。',
                choices: [
                    { text: '……再见。', next: null }
                ]
            }
        ],
        love_npc_1: [
            {
                id: 'greeting',
                text: '你并不孤单。每一条路都有人与你同行，只是你还没看见。',
                choices: [
                    { text: '谁在和我同行？', next: 'who' },
                    { text: '有时候我觉得很孤独。', next: 'lonely' },
                    { text: '谢谢你的安慰。', next: null }
                ]
            },
            {
                id: 'who',
                text: '每一个曾经走过这条路的人。他们的足迹还在，只是你还没有学会辨认。',
                choices: [
                    { text: '我会留意的。', next: null }
                ]
            },
            {
                id: 'lonely',
                text: '有时候我们以为自己在黑暗中独行，但其实那只是因为我们忘记回头看看。真正的爱，是甘愿成为别人路上的灯。',
                choices: [
                    { text: '我愿意成为那盏灯。', next: null }
                ]
            }
        ],
        love_npc_2: [
            {
                id: 'greeting',
                text: '光是礼物，但给予光比拥有光更需要勇气。你愿意照亮别人吗？',
                choices: [
                    { text: '即使那意味着站在阴影里？', next: 'shadow' },
                    { text: '我愿意。', next: 'willing' },
                    { text: '为什么这需要勇气？', next: 'courage' }
                ]
            },
            {
                id: 'shadow',
                text: '是的。即使那意味着你自己会站在阴影里。因为真正的光不是照亮自己——而是让别人也能看见。',
                choices: [
                    { text: '我理解了。', next: null }
                ]
            },
            {
                id: 'willing',
                text: '那就去吧。在这个迷宫中，总有人需要你的光。',
                choices: [
                    { text: '我会的。', next: null }
                ]
            },
            {
                id: 'courage',
                text: '因为当你照亮别人的路时，你可能看不清自己的。那需要信任——相信你给予的光终会回到你身上。',
                choices: [
                    { text: '我相信。', next: null }
                ]
            }
        ],
        love_npc_3: [
            {
                id: 'greeting',
                text: '你们在同一个迷宫里走了很久。走过同样的转角，错过同样的路口。',
                choices: [
                    { text: '我们终于相遇了。', next: 'meet' },
                    { text: '错过是注定的吗？', next: 'fate' }
                ]
            },
            {
                id: 'meet',
                text: '记住这一刻——不是所有的相遇都会重来。珍惜每一次交汇的光线。',
                choices: [
                    { text: '我会的。', next: null }
                ]
            },
            {
                id: 'fate',
                text: '不是注定错过——是注定在正确的时间相遇。每一步弯路都让你更接近这一刻。',
                choices: [
                    { text: '谢谢你。', next: null }
                ]
            }
        ],
        solitude_echo_2: [
            {
                id: 'greeting',
                text: '你听见了什么？寂静。然后是自己的脚步声。然后是心跳。',
                choices: [
                    { text: '然后是什么？', next: 'then' },
                    { text: '这里好安静。', next: 'quiet' }
                ]
            },
            {
                id: 'then',
                text: '然后是记忆深处，某个人的名字。孤独不是没有声音，是所有声音都变成了自己的。',
                choices: [
                    { text: '我会学着倾听。', next: null }
                ]
            },
            {
                id: 'quiet',
                text: '安静是另一种声音。当你学会了聆听寂静，你就不再孤独了。',
                choices: [
                    { text: '谢谢你。', next: null }
                ]
            }
        ]
    };

    // ── Per-NPC Memory ──
    var visitedFlags = {};
    var relationshipScores = {};
    var visitCounts = {};

    // ── Behavior State Machine ──
    // States: idle, wander, patrol, chase, flee
    var BEHAVIOR_COOLDOWNS = { idle: 3, wander: 5, patrol: 8 };

    // ── Merchant System ──
    var merchantStock = [];
    var MERCHANT_DISCOUNT_PER_REL = 0.5; // 0.5% per relationship point

    // ── A* Pathfinding ──
    function astarPath(map, startX, startY, endX, endY) {
        if (!map) return null;
        var rows = map.length;
        var cols = map[0].length;
        if (startX < 0 || startY < 0 || endX < 0 || endY < 0) return null;
        if (startX >= cols || startY >= rows || endX >= cols || endY >= rows) return null;

        // WALL = 0, cost infinity; PATH = 1, cost 1; WATER = 7, cost 3; others cost 1
        function tileCost(x, y) {
            if (y < 0 || y >= rows || x < 0 || x >= cols) return -1;
            var tile = map[y][x];
            if (tile === 0) return -1; // wall
            if (tile === 7) return 3; // water
            if (tile === 9) return 5; // trap
            return 1;
        }

        function heuristic(ax, ay, bx, by) {
            return Math.abs(ax - bx) + Math.abs(ay - by);
        }

        var open = [];
        var closed = {};
        var cameFrom = {};

        var startKey = startX + ',' + startY;
        var startNode = { x: startX, y: startY, g: 0, f: heuristic(startX, startY, endX, endY) };
        open.push(startNode);

        var maxIterations = 500;
        var iterations = 0;

        while (open.length > 0 && iterations < maxIterations) {
            iterations++;

            // Find lowest f in open
            var lowestIdx = 0;
            for (var oi = 1; oi < open.length; oi++) {
                if (open[oi].f < open[lowestIdx].f) lowestIdx = oi;
            }
            var current = open.splice(lowestIdx, 1)[0];
            var curKey = current.x + ',' + current.y;

            if (current.x === endX && current.y === endY) {
                // Reconstruct path
                var path = [];
                var node = curKey;
                while (node) {
                    var parts = node.split(',');
                    path.unshift({ x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) });
                    node = cameFrom[node] || null;
                }
                return path;
            }

            closed[curKey] = true;

            // 4-directional neighbors
            var neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (var ni = 0; ni < neighbors.length; ni++) {
                var nb = neighbors[ni];
                var nbKey = nb.x + ',' + nb.y;
                if (closed[nbKey]) continue;

                var cost = tileCost(nb.x, nb.y);
                if (cost < 0) continue;

                var g = current.g + cost;
                var h = heuristic(nb.x, nb.y, endX, endY);

                // Check if already in open with lower g
                var inOpen = false;
                for (var oi2 = 0; oi2 < open.length; oi2++) {
                    if (open[oi2].x === nb.x && open[oi2].y === nb.y) {
                        if (g < open[oi2].g) {
                            open[oi2].g = g;
                            open[oi2].f = g + h;
                            cameFrom[nbKey] = curKey;
                        }
                        inOpen = true;
                        break;
                    }
                }

                if (!inOpen) {
                    open.push({ x: nb.x, y: nb.y, g: g, f: g + h });
                    cameFrom[nbKey] = curKey;
                }
            }
        }

        return null; // no path found
    }

    // ── Behavior Functions ──
    function updatePatrol(npc, dt, map) {
        if (!npc.patrolPath || npc.patrolPath.length === 0) return;
        npc.patrolTimer -= dt;
        if (npc.patrolTimer <= 0) {
            npc.patrolIndex = (npc.patrolIndex + 1) % npc.patrolPath.length;
            npc.patrolTimer = 2.0;
            var wp = npc.patrolPath[npc.patrolIndex];
            npc.targetX = wp.x;
            npc.targetY = wp.y;
        }
        moveTowardTarget(npc, dt, map);
    }

    function updateWander(npc, dt, map) {
        npc.wanderTimer -= dt;
        if (npc.wanderTimer <= 0) {
            npc.wanderTimer = 3 + Math.random() * 4;
            var dirs = [
                { x: npc.x + 1, y: npc.y },
                { x: npc.x - 1, y: npc.y },
                { x: npc.x, y: npc.y + 1 },
                { x: npc.x, y: npc.y - 1 }
            ];
            var valid = [];
            for (var di = 0; di < dirs.length; di++) {
                var d = dirs[di];
                if (d.x >= 0 && d.y >= 0 && map && d.y < map.length && d.x < map[0].length) {
                    if (map[d.y][d.x] !== 0) valid.push(d);
                }
            }
            if (valid.length > 0) {
                var pick = valid[Math.floor(Math.random() * valid.length)];
                npc.targetX = pick.x;
                npc.targetY = pick.y;
            }
        }
        moveTowardTarget(npc, dt, map);
    }

    function updateChase(npc, dt, map, playerPos) {
        if (!playerPos) return;
        var dist = Math.abs(npc.x - playerPos.gx) + Math.abs(npc.y - playerPos.gy);
        if (dist > 8) {
            npc.behaviorState = 'wander';
            return;
        }
        var path = astarPath(map, npc.x, npc.y, playerPos.gx, playerPos.gy);
        if (path && path.length > 1) {
            npc.targetX = path[1].x;
            npc.targetY = path[1].y;
        }
        npc.moveSpeed = (npc.typeConfig && npc.typeConfig.speed) ? npc.typeConfig.speed * 0.6 : 0.6;
        moveTowardTarget(npc, dt, map);
    }

    function updateFlee(npc, dt, map, playerPos) {
        if (!playerPos) return;
        var dx = npc.x - playerPos.gx;
        var dy = npc.y - playerPos.gy;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) len = 1;
        var fx = Math.round(npc.x + dx / len * 2);
        var fy = Math.round(npc.y + dy / len * 2);
        if (map && fy >= 0 && fy < map.length && fx >= 0 && fx < map[0].length && map[fy][fx] !== 0) {
            npc.targetX = fx;
            npc.targetY = fy;
        }
        npc.moveSpeed = (npc.typeConfig && npc.typeConfig.speed) ? npc.typeConfig.speed * 1.5 : 1.5;
        moveTowardTarget(npc, dt, map);
    }

    function updateIdle(npc, dt) {
        npc.idleTimer -= dt;
        if (npc.idleTimer <= 0) {
            npc.idleTimer = 2 + Math.random() * 3;
            // Random transition: idle -> wander
            if (Math.random() < 0.4) {
                npc.behaviorState = 'wander';
                npc.wanderTimer = 0;
            }
        }
    }

    function moveTowardTarget(npc, dt, map) {
        if (npc.targetX < 0 || npc.targetY < 0) return;
        var dx = npc.targetX - npc.x;
        var dy = npc.targetY - npc.y;
        if (dx === 0 && dy === 0) return;

        var speed = npc.moveSpeed || 1.0;
        var step = speed * dt;

        // Check collision with other NPCs
        var blocked = false;
        for (var i = 0; i < npcs.length; i++) {
            if (npcs[i] === npc) continue;
            if (npcs[i].x === npc.targetX && npcs[i].y === npc.targetY) {
                blocked = true;
                break;
            }
        }
        if (blocked) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            npc.x += (dx > 0 ? 1 : -1) * Math.min(step, Math.abs(dx));
        } else {
            npc.y += (dy > 0 ? 1 : -1) * Math.min(step, Math.abs(dy));
        }

        // Snap when close
        if (Math.abs(npc.x - npc.targetX) < 0.1 && Math.abs(npc.y - npc.targetY) < 0.1) {
            npc.x = npc.targetX;
            npc.y = npc.targetY;
            npc.targetX = -1;
            npc.targetY = -1;
        }
    }

    // ── Merchant System ──
    function generateMerchantStock(levelIndex) {
        var stock = [];
        var possibleItems = ['health_potion', 'light_potion', 'speed_elixir', 'revelation_scroll'];
        for (var i = 0; i < 3; i++) {
            var pick = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            var price = 1 + Math.floor(Math.random() * 2);
            stock.push({ itemId: pick, price: price });
        }
        return stock;
    }

    function getMerchantPrice(basePrice, npcId) {
        var rel = relationshipScores[npcId] || 0;
        var discount = rel * MERCHANT_DISCOUNT_PER_REL;
        return Math.max(1, basePrice - Math.floor(discount / 100 * basePrice));
    }

    // ── Quest Functions ──
    function acceptQuest(npcId) {
        // Find quest for this NPC
        var quest = null;
        var questId = null;
        for (var qid in QUEST_DEFS) {
            if (QUEST_DEFS[qid].npcGiver === npcId && !completedQuests[qid]) {
                var alreadyActive = false;
                for (var ai = 0; ai < activeQuests.length; ai++) {
                    if (activeQuests[ai].id === qid) { alreadyActive = true; break; }
                }
                if (!alreadyActive) {
                    quest = QUEST_DEFS[qid];
                    questId = qid;
                    break;
                }
            }
        }
        if (!quest || activeQuests.length >= MAX_ACTIVE_QUESTS) return false;

        var activeQuest = {
            id: questId,
            type: quest.type,
            description: quest.description,
            objectives: [],
            reward: quest.reward,
            state: 'active'
        };
        for (var oi = 0; oi < quest.objectives.length; oi++) {
            activeQuest.objectives.push({
                type: quest.objectives[oi].type,
                target: quest.objectives[oi].target,
                count: quest.objectives[oi].count || 1,
                progress: 0
            });
        }
        activeQuests.push(activeQuest);
        questProgress[questId] = activeQuest;
        return true;
    }

    function updateQuestProgress(type, target) {
        for (var i = 0; i < activeQuests.length; i++) {
            var q = activeQuests[i];
            if (q.state !== 'active') continue;
            for (var j = 0; j < q.objectives.length; j++) {
                var obj = q.objectives[j];
                if (obj.type === type && obj.target === target && obj.progress < obj.count) {
                    obj.progress++;
                }
            }
            // Check if all objectives complete
            var allDone = true;
            for (var k = 0; k < q.objectives.length; k++) {
                if (q.objectives[k].progress < q.objectives[k].count) {
                    allDone = false;
                    break;
                }
            }
            if (allDone) {
                q.state = 'complete';
            }
        }
    }

    function completeQuest(questId) {
        for (var i = 0; i < activeQuests.length; i++) {
            if (activeQuests[i].id === questId) {
                activeQuests[i].state = 'complete';
                break;
            }
        }
    }

    function claimReward(questId) {
        var quest = null;
        var questIdx = -1;
        for (var i = 0; i < activeQuests.length; i++) {
            if (activeQuests[i].id === questId && activeQuests[i].state === 'complete') {
                quest = activeQuests[i];
                questIdx = i;
                break;
            }
        }
        if (!quest) return null;

        var reward = quest.reward;
        completedQuests[questId] = true;
        activeQuests.splice(questIdx, 1);
        delete questProgress[questId];

        // Apply reward
        if (reward.type === 'item' && typeof Items !== 'undefined') {
            Items.addToInventory(reward.itemId);
        }
        if (reward.type === 'effect' && typeof Player !== 'undefined') {
            // Could apply effects through Items system
        }

        return reward;
    }

    function getActiveQuests() {
        return activeQuests;
    }

    function getCompletedQuests() {
        return completedQuests;
    }

    // ── Dialogue Tree Evaluation ──
    function getDialogueForNpc(npcId) {
        var tree = DIALOGUE_TREES[npcId];
        if (!tree || tree.length === 0) return null;

        var visitCount = visitCounts[npcId] || 0;
        visitCounts[npcId] = visitCount + 1;

        // First visit: use first node; subsequent visits: pick based on state
        return tree[0]; // Always start from root
    }

    function getDialogueNode(npcId, nodeId) {
        var tree = DIALOGUE_TREES[npcId];
        if (!tree) return null;
        for (var i = 0; i < tree.length; i++) {
            if (tree[i].id === nodeId) return tree[i];
        }
        return null;
    }

    // Current dialogue state
    var currentDialogueNpc = null;
    var currentDialogueNode = null;

    // ── Core Functions ──
    function init(levelConfig) {
        npcs = [];
        var npcConfigs = levelConfig.npcs || [];
        for (var i = 0; i < npcConfigs.length; i++) {
            var c = npcConfigs[i];
            var npcType = c.type || (c.ghostly ? 'ghost' : 'traveler');
            var typeConfig = NPC_TYPES[npcType] || NPC_TYPES.traveler;

            npcs.push({
                x: c.x,
                y: c.y,
                id: c.id || ('npc_' + i),
                type: npcType,
                typeConfig: typeConfig,
                visible: true,
                lines: c.lines || ['...'],
                animPhase: Math.random() * Math.PI * 2,
                ghostly: !!c.ghostly || !!typeConfig.ghostly,
                // Behavior
                behaviorState: 'idle',
                moveSpeed: typeConfig.speed,
                targetX: -1,
                targetY: -1,
                patrolPath: c.patrolPath || [],
                patrolIndex: 0,
                patrolTimer: 2,
                wanderTimer: 0,
                idleTimer: 2 + Math.random() * 3,
                // Interaction
                interacted: false
            });
        }

        // Generate merchant stock if merchant present
        merchantStock = [];
        var levelIdx = (typeof Levels !== 'undefined') ? Levels.getCurrentLevelIndex() : 0;
        for (var j = 0; j < npcs.length; j++) {
            if (npcs[j].type === 'merchant') {
                merchantStock = generateMerchantStock(levelIdx);
            }
        }

        // Reset dialogue state
        currentDialogueNpc = null;
        currentDialogueNode = null;
    }

    function update(dt, playerGridPos) {
        var map = (typeof Engine !== 'undefined') ? Engine.getMap() : null;

        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            npc.animPhase += dt * 1.5;

            // Update behavior based on state
            var personality = npc.typeConfig ? npc.typeConfig.personality : 'passive';
            switch (npc.behaviorState) {
                case 'idle':
                    updateIdle(npc, dt);
                    break;
                case 'wander':
                    updateWander(npc, dt, map);
                    break;
                case 'patrol':
                    updatePatrol(npc, dt, map);
                    break;
                case 'chase':
                    updateChase(npc, dt, map, playerGridPos);
                    break;
                case 'flee':
                    updateFlee(npc, dt, map, playerGridPos);
                    break;
            }

            // Wander -> idle timeout
            if (npc.behaviorState === 'wander') {
                npc.wanderDuration -= dt;
                if (npc.wanderDuration <= 0) {
                    npc.behaviorState = 'idle';
                    npc.idleTimer = 2 + Math.random() * 3;
                }
            } else if (npc.behaviorState === 'idle' && !npc.wanderDuration) {
                // Initialize wander duration when switching to wander
            }
            if (npc.behaviorState === 'wander' && !npc.wanderDuration) {
                npc.wanderDuration = 5 + Math.random() * 5;
            }
        }

        // Check if player is facing an adjacent NPC for interaction hint
        var hintShown = false;
        if (playerGridPos && typeof Player !== 'undefined') {
            var dir = Player.getDirection();
            var tx = playerGridPos.gx;
            var ty = playerGridPos.gy;
            if (dir === 'up') ty -= 1;
            else if (dir === 'down') ty += 1;
            else if (dir === 'left') tx -= 1;
            else if (dir === 'right') tx += 1;

            var hasLove = (typeof Items !== 'undefined') && Items.hasElement('love');
            for (var j = 0; j < npcs.length; j++) {
                if (npcs[j].x === tx && npcs[j].y === ty) {
                    if (npcs[j].ghostly || hasLove) {
                        hintShown = true;
                    }
                    break;
                }
            }
        }
        if (typeof UI !== 'undefined') {
            UI.showInteractHint(hintShown);
        }
    }

    function render(ctx) {
        var hasLove = (typeof Items !== 'undefined') && Items.hasElement('love');

        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];

            // Ghostly NPCs are always visible; normal NPCs require love fragment
            if (!npc.ghostly && !hasLove) continue;

            var cx = npc.x * TILE_SIZE + TILE_SIZE / 2;
            var cy = npc.y * TILE_SIZE + TILE_SIZE / 2;
            var typeConfig = npc.typeConfig || NPC_TYPES.traveler;
            var animStyle = typeConfig.animStyle || 'float';

            // Animation offset
            var floatY = 0;
            if (animStyle === 'float') {
                floatY = Math.sin(npc.animPhase) * 3;
            } else if (animStyle === 'walk') {
                floatY = Math.sin(npc.animPhase * 2) * 1;
            }
            cy += floatY;

            ctx.save();

            if (npc.ghostly) {
                ctx.globalAlpha = 0.4;
            }

            var color = typeConfig.bodyColor || '#cc9966';
            var glowColor = typeConfig.glowColor || '#ddaa77';

            // Glow aura (pulsing)
            var auraSize = Math.sin(npc.animPhase * 0.8) * 3 + 8;
            ctx.shadowBlur = auraSize;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = 'rgba(' + hexToRgb(glowColor) + ',0.15)';
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 14, 0, Math.PI * 2);
            ctx.fill();

            // Body shape based on type
            ctx.shadowBlur = 10;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = color;

            // Head (oval)
            ctx.beginPath();
            ctx.ellipse(cx, cy - 6, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body with type-specific overlay
            if (npc.type === 'gatekeeper' || npc.type === 'prayer_monk' || npc.type === 'merchant') {
                // Robed figure (wider bottom)
                ctx.beginPath();
                ctx.moveTo(cx - 7, cy + 2);
                ctx.lineTo(cx - 3, cy - 2);
                ctx.lineTo(cx + 3, cy - 2);
                ctx.lineTo(cx + 7, cy + 2);
                ctx.lineTo(cx + 5, cy + 12);
                ctx.lineTo(cx - 5, cy + 12);
                ctx.closePath();
                ctx.fill();
            } else if (npc.type === 'guide') {
                // Cloaked figure
                ctx.beginPath();
                ctx.moveTo(cx - 6, cy + 2);
                ctx.lineTo(cx - 4, cy - 3);
                ctx.lineTo(cx, cy - 1);
                ctx.lineTo(cx + 4, cy - 3);
                ctx.lineTo(cx + 6, cy + 2);
                ctx.lineTo(cx + 4, cy + 10);
                ctx.lineTo(cx - 4, cy + 10);
                ctx.closePath();
                ctx.fill();
            } else {
                // Default body (trapezoid)
                ctx.beginPath();
                ctx.moveTo(cx - 6, cy + 2);
                ctx.lineTo(cx - 3, cy - 2);
                ctx.lineTo(cx + 3, cy - 2);
                ctx.lineTo(cx + 6, cy + 2);
                ctx.lineTo(cx + 4, cy + 10);
                ctx.lineTo(cx - 4, cy + 10);
                ctx.closePath();
                ctx.fill();
            }

            // Eyes (small dots)
            ctx.fillStyle = npc.ghostly ? '#ccccff' : '#fff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 7, 1, 0, Math.PI * 2);
            ctx.arc(cx + 2, cy - 7, 1, 0, Math.PI * 2);
            ctx.fill();

            // Merchant icon (coin)
            if (npc.type === 'merchant') {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(cx, cy + 4, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Quest indicator (exclamation mark)
            var hasQuest = false;
            for (var qid in QUEST_DEFS) {
                if (QUEST_DEFS[qid].npcGiver === npc.id && !completedQuests[qid]) {
                    var isOnQuest = false;
                    for (var qi = 0; qi < activeQuests.length; qi++) {
                        if (activeQuests[qi].id === qid) { isOnQuest = true; break; }
                    }
                    if (!isOnQuest) { hasQuest = true; break; }
                }
            }
            if (hasQuest) {
                var qAlpha = 0.6 + Math.sin(npc.animPhase * 3) * 0.4;
                ctx.globalAlpha = qAlpha;
                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 12px "Noto Serif SC", serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('!', cx, cy - 14);
            }

            ctx.restore();
        }
    }

    // Helper: hex to rgb string
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '128,128,128';
        return parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16);
    }

    function handleInteraction(gx, gy, dir) {
        // Determine the tile the player is facing
        var targetX = gx;
        var targetY = gy;
        if (dir === 'up') targetY -= 1;
        else if (dir === 'down') targetY += 1;
        else if (dir === 'left') targetX -= 1;
        else if (dir === 'right') targetX += 1;

        var hasLove = (typeof Items !== 'undefined') && Items.hasElement('love');

        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            if (npc.x === targetX && npc.y === targetY) {
                // Ghostly NPCs can always interact; normal NPCs require love
                if (!npc.ghostly && !hasLove) return;

                // Update relationship
                var npcId = npc.id;
                if (!relationshipScores[npcId]) relationshipScores[npcId] = 0;
                relationshipScores[npcId] = Math.min(100, relationshipScores[npcId] + 5);

                // Try dialogue tree first
                var dialogueNode = getDialogueForNpc(npcId);
                if (dialogueNode && typeof Dialogue !== 'undefined') {
                    currentDialogueNpc = npcId;
                    currentDialogueNode = dialogueNode;
                    showDialogueNode(dialogueNode, npcId);
                    return;
                }

                // Fallback: simple line-based dialogue
                if (typeof Dialogue !== 'undefined') {
                    Dialogue.show(npc.lines.slice(), function () {
                        if (typeof Engine !== 'undefined') {
                            Engine.changeState('exploring');
                        }
                    });
                }
                return;
            }
        }
    }

    function showDialogueNode(node, npcId) {
        if (!node) {
            // End dialogue
            currentDialogueNpc = null;
            currentDialogueNode = null;
            if (typeof Engine !== 'undefined') {
                Engine.changeState('exploring');
            }
            return;
        }

        // Build lines array with choices
        var lines = [node.text];
        var choices = node.choices || [];

        // Filter choices by condition
        var validChoices = [];
        for (var ci = 0; ci < choices.length; ci++) {
            if (choices[ci].condition && !choices[ci].condition()) continue;
            validChoices.push(choices[ci]);
        }

        if (validChoices.length > 0 && typeof Dialogue !== 'undefined') {
            // Add choice prompts
            for (var vi = 0; vi < validChoices.length; vi++) {
                lines.push('[' + (vi + 1) + '] ' + validChoices[vi].text);
            }
        }

        if (typeof Dialogue !== 'undefined') {
            Dialogue.show(lines, function () {
                // After dialogue, handle choice consequences
                if (validChoices.length > 0 && currentDialogueNpc) {
                    // Auto-pick first choice for now (full branching via Dialogue module)
                    var chosen = validChoices[0];
                    if (chosen.action === 'startQuest') {
                        acceptQuest(npcId);
                    }
                    if (chosen.next) {
                        var nextNode = getDialogueNode(npcId, chosen.next);
                        currentDialogueNode = nextNode;
                        if (nextNode) {
                            showDialogueNode(nextNode, npcId);
                            return;
                        }
                    }
                }
                currentDialogueNpc = null;
                currentDialogueNode = null;
                if (typeof Engine !== 'undefined') {
                    Engine.changeState('exploring');
                }
            });
        }
    }

    // ── Quest Log Rendering ──
    function renderQuestLog(ctx) {
        if (activeQuests.length === 0) return;

        var fs = (typeof Engine !== 'undefined' && Engine.mobileFontScale) ? Engine.mobileFontScale : 1;
        var cw = ctx.canvas.width;
        var startY = ctx.canvas.height - 80 - activeQuests.length * 24;

        for (var i = 0; i < activeQuests.length; i++) {
            var q = activeQuests[i];
            var y = startY + i * 24;

            // Quest name
            ctx.fillStyle = q.state === 'complete' ? '#88ff88' : '#d4c5a0';
            ctx.font = Math.round(12 * fs) + 'px "Noto Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(q.description.substring(0, 20) + (q.description.length > 20 ? '...' : ''), 8, y);

            // Progress bar
            var totalProgress = 0;
            var totalNeeded = 0;
            for (var j = 0; j < q.objectives.length; j++) {
                totalProgress += q.objectives[j].progress;
                totalNeeded += q.objectives[j].count;
            }
            var barW = 60;
            var barH = 6;
            var barX = cw - barW - 12;
            var pct = totalNeeded > 0 ? totalProgress / totalNeeded : 0;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, y + 4, barW, barH);
            ctx.fillStyle = q.state === 'complete' ? '#88ff88' : '#d4c5a0';
            ctx.fillRect(barX, y + 4, barW * pct, barH);
        }
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function isAdjacent(gx, gy, dx, dy) {
        var tx = gx + dx;
        var ty = gy + dy;
        var hasLove = (typeof Items !== 'undefined') && Items.hasElement('love');
        for (var i = 0; i < npcs.length; i++) {
            if (npcs[i].x === tx && npcs[i].y === ty) {
                if (npcs[i].ghostly || hasLove) return true;
                break;
            }
        }
        return false;
    }

    function getNpcs() {
        return npcs;
    }

    function getActiveDialogueNpc() {
        return currentDialogueNpc;
    }

    function getMerchantStock() {
        return merchantStock;
    }

    return {
        init: init,
        update: update,
        render: render,
        handleInteraction: handleInteraction,
        isAdjacent: isAdjacent,
        getNpcs: getNpcs,
        getActiveQuests: getActiveQuests,
        getCompletedQuests: getCompletedQuests,
        acceptQuest: acceptQuest,
        updateQuestProgress: updateQuestProgress,
        completeQuest: completeQuest,
        claimReward: claimReward,
        renderQuestLog: renderQuestLog,
        getActiveDialogueNpc: getActiveDialogueNpc,
        getMerchantStock: getMerchantStock,
        getRelationship: function (npcId) { return relationshipScores[npcId] || 0; }
    };
})();

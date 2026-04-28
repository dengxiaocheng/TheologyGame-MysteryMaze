// 通向奥秘 - 关卡定义

var Levels = (function () {
    var currentLevel = -1;

    var levels = [
        {
            id: 'prologue',
            name: '序章',
            subtitle: '最初的迷雾',
            width: 30,
            height: 20,
            entrance: { x: 1, y: 1 },
            exit: { x: 27, y: 17 },
            theme: {
                wallColor: '#222',
                pathColor: '#333',
                specialColor: '#2a2a3e',
                exitColor: '#3e3e2a',
                lightRadius: 160,
                ambientTint: 'rgba(0,0,0,0)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 15, y: 9 },
                { x: 25, y: 15 }
            ],
            doors: [],
            element: 'prologue',
            reflection: {
                title: '最初的迷雾',
                lines: [
                    '你踏入了第一片迷雾。',
                    '这里没有答案，只有问题。',
                    '但每一个问题，都是一扇门。'
                ]
            }
        },
        {
            id: 'knowledge',
            name: '知识',
            subtitle: '光所触及的边界',
            width: 35,
            height: 23,
            entrance: { x: 1, y: 1 },
            exit: { x: 33, y: 21 },
            theme: {
                wallColor: '#1a1a2e',
                pathColor: '#2a2a4a',
                specialColor: '#3a3a5e',
                exitColor: '#4a4a3a',
                lightRadius: 176,
                ambientTint: 'rgba(20,20,60,0.1)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 11, y: 11 },
                { x: 17, y: 5 },
                { x: 23, y: 15 },
                { x: 29, y: 9 }
            ],
            doors: [],
            element: 'knowledge',
            reflection: {
                title: '知识的边界',
                lines: [
                    '我们所知道的一切，都指向我们无法知道的事物。',
                    '光触及的每个边界，都在地平线上创造出新的边界。',
                    '知识不是终点——它是通往更深层疑问的阶梯。'
                ]
            }
        },
        {
            id: 'failure',
            name: '失败',
            subtitle: '破碎的回声',
            width: 33,
            height: 21,
            entrance: { x: 1, y: 19 },
            exit: { x: 31, y: 1 },
            theme: {
                wallColor: '#2e1a1a',
                pathColor: '#3e2a2a',
                specialColor: '#4e2a2a',
                exitColor: '#3e3e2a',
                lightRadius: 144,
                ambientTint: 'rgba(60,10,10,0.1)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 11, y: 15 },
                { x: 17, y: 9 },
                { x: 25, y: 3 }
            ],
            doors: [],
            element: 'failure',
            reflection: {
                title: '失败的回声',
                lines: [
                    '每一次跌倒都在大地上刻下痕迹，',
                    '而这些痕迹构成了河流的路径。',
                    '破碎不是毁灭——是重新塑造的起点。'
                ]
            }
        },
        {
            id: 'solitude',
            name: '孤独',
            subtitle: '无尽的回廊',
            width: 37,
            height: 25,
            entrance: { x: 1, y: 1 },
            exit: { x: 35, y: 23 },
            theme: {
                wallColor: '#1a1a2a',
                pathColor: '#252540',
                specialColor: '#303055',
                exitColor: '#3e3e2a',
                lightRadius: 128,
                ambientTint: 'rgba(10,10,40,0.15)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 13, y: 11 },
                { x: 19, y: 19 },
                { x: 25, y: 7 },
                { x: 31, y: 15 },
                { x: 11, y: 21 }
            ],
            doors: [],
            element: 'solitude',
            reflection: {
                title: '孤独的回廊',
                lines: [
                    '在无尽的寂静中，你开始听见自己的声音。',
                    '那不是回声——是你第一次真正聆听。',
                    '孤独不是惩罚，而是一种深层的邀请。'
                ]
            }
        },
        {
            id: 'love',
            name: '爱',
            subtitle: '交织的光线',
            width: 35,
            height: 23,
            entrance: { x: 1, y: 11 },
            exit: { x: 33, y: 11 },
            theme: {
                wallColor: '#2e1a2a',
                pathColor: '#3e2a3a',
                specialColor: '#4e3a4a',
                exitColor: '#3e3e2a',
                lightRadius: 192,
                ambientTint: 'rgba(60,10,40,0.08)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 5, y: 17 },
                { x: 17, y: 11 },
                { x: 25, y: 5 },
                { x: 25, y: 17 }
            ],
            doors: [],
            element: 'love',
            reflection: {
                title: '爱的光线',
                lines: [
                    '两条光线交汇时，阴影便有了形状。',
                    '爱不是消除黑暗，而是在黑暗中找到共同的轮廓。',
                    '当你看见另一个人的脆弱，你也照亮了自己。'
                ]
            }
        },
        {
            id: 'prayer',
            name: '祈祷',
            subtitle: '向上的阶梯',
            width: 39,
            height: 27,
            entrance: { x: 19, y: 25 },
            exit: { x: 19, y: 1 },
            theme: {
                wallColor: '#2a2a1a',
                pathColor: '#3a3a2a',
                specialColor: '#4a4a2a',
                exitColor: '#5a5a3a',
                lightRadius: 160,
                ambientTint: 'rgba(40,40,10,0.1)'
            },
            specialRooms: [
                { x: 7, y: 5 },
                { x: 15, y: 9 },
                { x: 23, y: 9 },
                { x: 31, y: 5 },
                { x: 11, y: 17 },
                { x: 27, y: 17 }
            ],
            doors: [],
            element: 'prayer',
            reflection: {
                title: '祈祷的阶梯',
                lines: [
                    '祈祷不是向外的呼唤——它是内心最深处的安静。',
                    '当你放下所有的言辞，剩下的就是祈祷本身。',
                    '不需要神殿，不需要祭坛。',
                    '只需要一个愿意跪下的灵魂。'
                ]
            }
        },
        {
            id: 'death',
            name: '死亡',
            subtitle: '最后的门槛',
            width: 33,
            height: 21,
            entrance: { x: 1, y: 1 },
            exit: { x: 31, y: 19 },
            theme: {
                wallColor: '#1a1a1a',
                pathColor: '#252525',
                specialColor: '#303030',
                exitColor: '#3a3a2a',
                lightRadius: 112,
                ambientTint: 'rgba(0,0,0,0.2)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 11, y: 11 },
                { x: 17, y: 17 },
                { x: 23, y: 7 },
                { x: 29, y: 13 }
            ],
            doors: [],
            element: 'death',
            reflection: {
                title: '最后的门槛',
                lines: [
                    '死亡不是终结——它是所有问题的沉默。',
                    '当所有的光都熄灭，你才发现：',
                    '黑暗本身也是一种光，只是眼睛还没有学会看见。',
                    '跨过这道门槛，不是结束，而是变形。'
                ]
            }
        },
        {
            id: 'hope',
            name: '希望',
            subtitle: '黎明前的最后一刻',
            width: 41,
            height: 27,
            entrance: { x: 1, y: 25 },
            exit: { x: 39, y: 1 },
            theme: {
                wallColor: '#1a2a1a',
                pathColor: '#2a3a2a',
                specialColor: '#3a4a3a',
                exitColor: '#4a5a3a',
                lightRadius: 208,
                ambientTint: 'rgba(10,40,10,0.08)'
            },
            specialRooms: [
                { x: 5, y: 5 },
                { x: 11, y: 15 },
                { x: 17, y: 25 },
                { x: 23, y: 9 },
                { x: 29, y: 19 },
                { x: 35, y: 5 }
            ],
            doors: [],
            element: 'hope',
            reflection: {
                title: '黎明前的最后一刻',
                lines: [
                    '希望不是光——它是光到来之前的那个决定。',
                    '在最深的黑暗中，你选择相信黎明。',
                    '不是因为看见了光，而是因为你记得它。',
                    '七个碎片，七道光，一个完整的圆。',
                    '你不是找到了答案——你成为了答案本身。'
                ]
            }
        }
    ];

    function getLevel(index) {
        if (index < 0 || index >= levels.length) return null;
        return levels[index];
    }

    function getTotalLevels() {
        return levels.length;
    }

    function nextLevel() {
        currentLevel++;
        if (currentLevel >= levels.length) {
            return null;
        }
        return levels[currentLevel];
    }

    function getCurrentLevelIndex() {
        return currentLevel;
    }

    function getCurrentLevel() {
        if (currentLevel < 0 || currentLevel >= levels.length) return null;
        return levels[currentLevel];
    }

    function reset() {
        currentLevel = -1;
    }

    return {
        getLevel: getLevel,
        getTotalLevels: getTotalLevels,
        nextLevel: nextLevel,
        getCurrentLevel: getCurrentLevel,
        getCurrentLevelIndex: getCurrentLevelIndex,
        reset: reset
    };
})();

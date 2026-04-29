// 通向奥秘 - 关卡定义

var Levels = (function () {
    var currentLevel = -1;

    var levels = [
        {
            id: 'prologue',
            name: '序章',
            subtitle: '最初的迷雾',
            description: '一切从这里开始。迷雾笼罩着你的双眼，脚下是冰冷的石板。你不知道自己从何而来，只知道前方有一道光。',
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
                { x: 11, y: 9 },
                { x: 15, y: 9 },
                { x: 19, y: 5 },
                { x: 23, y: 13 },
                { x: 25, y: 15 }
            ],
            doors: [],
            element: 'prologue',
            ambientTexts: [
                '迷雾中似乎有什么在移动。',
                '你听到了远处的水声。',
                '空气带着一股古老的味道。',
                '石壁上刻着模糊的符号。',
                '你的脚步声在回廊中回荡。',
                '一缕微风吹过，带来了什么气息？',
                '这里曾经有人来过。地上有模糊的足迹。',
                '你感觉到墙壁后面似乎有空间。'
            ],
            lore: [
                { title: '古老的铭文', text: '「走进来的人，请记住：迷宫不是用来困住你的。它是用来让你找到自己的。」' },
                { title: '破碎的石碑', text: '「第一道光来自于提问。当你问出第一个问题时，你已经开始走出迷雾。」' },
                { title: '墙上的涂鸦', text: '「如果你读到了这些文字，说明你还没有放弃。那就继续走吧。」' }
            ],
            wallDecorations: [
                { type: 'crack', frequency: 0.05 },
                { type: 'moss', frequency: 0.03 },
                { type: 'symbol', frequency: 0.01 }
            ],
            hazards: [],
            secretAreas: [
                { x: 7, y: 3, width: 3, height: 3, hint: '墙壁上的裂缝后面似乎有什么……' }
            ],
            puzzles: [],
            weather: { type: 'none' },
            interactionTriggers: [
                { x: 5, y: 5, type: 'inscription', text: '「这里是起点。也是一切问题的起源。」' }
            ],
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
            description: '蓝色光芒在墙壁上跳动。空气中弥漫着墨水和古老纸张的气息。书架般的石壁上刻满了文字，有些清晰，有些已经被时间侵蚀得无法辨认。',
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
                { x: 29, y: 9 },
                { x: 9, y: 19 },
                { x: 27, y: 3 }
            ],
            doors: [
                { x: 17, y: 1, keyId: 'knowledge_key_1' },
                { x: 33, y: 11, keyId: 'knowledge_key_2' }
            ],
            keyItems: [
                { x: 11, y: 17, keyId: 'knowledge_key_1' },
                { x: 29, y: 3, keyId: 'knowledge_key_2' }
            ],
            npcs: [
                { x: 17, y: 11, id: 'knowledge_sage', lines: ['所有的知识都始于一个问题。', '而每个答案又会生出新的问题。', '这不可怕——这是活着的证明。', '追求知识不是为了让疑问消失，而是让疑问变得更深刻。'] }
            ],
            element: 'knowledge',
            ambientTexts: [
                '书页翻动的声音从墙壁深处传来。',
                '蓝色的光芒在你靠近时变得更亮。',
                '石壁上刻满了古老的文字，有些你认得，有些不认识。',
                '空气中弥漫着墨水和纸张的气味。',
                '你看到了一行字：「知识是无限的，但求知的心只有一颗。」',
                '书架上的书籍在你经过时轻轻震动。',
                '某个角落里传来低声的呢喃，像是在朗读。',
                '地面上有一行用蓝色颜料写的字：「在这里，问题比答案更珍贵。」',
                '你感觉到知识像潮水一样涌来，又退去。',
                '石壁上的文字在你注视时似乎在缓慢变化。'
            ],
            lore: [
                { title: '知识之书·卷一', text: '「知识不是用来填满容器的，而是用来点燃火焰的。那些被记住的知识终将被遗忘，但被理解的知识会永远改变你。」' },
                { title: '学者的笔记', text: '「我已经在这里研究了无数年。我发现了无数个答案，但每一个答案都指向更多的问题。也许这就是知识本身的面貌——不是一座完整的建筑，而是一片永远在扩张的迷宫。」' },
                { title: '蓝色的碑文', text: '「我们用语言描绘世界，但世界远比语言广阔。当你意识到这一点时，你才真正开始了学习。」' },
                { title: '破损的卷轴', text: '「真正的知识不在于知道所有答案，而在于能够接受自己永远无法知道一切。这种接受本身就是一种智慧。」' }
            ],
            wallDecorations: [
                { type: 'bookshelf', frequency: 0.08 },
                { type: 'blue_rune', frequency: 0.04 },
                { type: 'crack', frequency: 0.02 },
                { type: 'scroll', frequency: 0.02 }
            ],
            hazards: [
                { type: 'illusion', x: 23, y: 9, radius: 3, message: '虚假的知识比无知更危险。' }
            ],
            secretAreas: [
                { x: 7, y: 3, width: 3, height: 3, hint: '书架后面似乎有一个暗室……' },
                { x: 31, y: 17, width: 3, height: 3, hint: '墙上的蓝色符文排列得有些奇怪。' }
            ],
            puzzles: [
                { type: 'sequence', x: 15, y: 7, description: '按正确的顺序触碰符文。', solution: ['blue', 'white', 'blue'] }
            ],
            weather: { type: 'pages', intensity: 0.3 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'bookshelf', text: '书架上摆满了古老的书籍。你翻开一本，上面写着：「当你读到这段文字时，你已经在思考了。这就是知识的开始。」' },
                { x: 29, y: 9, type: 'inscription', text: '石碑上刻着：「所有的知识都始于一个问题。」' }
            ],
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
            description: '红色的微光映照着破碎的石壁。空气中弥漫着铁锈和灰烬的味道。每一步都可能踏入陷阱，但失败本身就是通往真相的阶梯。',
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
                { x: 9, y: 15 },
                { x: 11, y: 15 },
                { x: 15, y: 9 },
                { x: 17, y: 9 },
                { x: 21, y: 5 },
                { x: 25, y: 3 },
                { x: 29, y: 17 }
            ],
            doors: [],
            hiddenPaths: [
                { x: 6, y: 4 },
                { x: 12, y: 14 },
                { x: 26, y: 2 },
                { x: 18, y: 8 },
                { x: 8, y: 16 },
                { x: 30, y: 4 }
            ],
            element: 'failure',
            ambientTexts: [
                '破碎的石块在你脚下嘎吱作响。',
                '你看到了墙壁上的裂缝——那是曾经的塌方留下的痕迹。',
                '空气中弥漫着灰烬的味道，仿佛这里曾经燃烧过什么。',
                '地面上有深深的裂痕，像是大地也在承受着什么。',
                '你听到了远处传来的回声，像是有人在叹息。',
                '红色的光芒在墙壁上投射出破碎的影子。',
                '一块石碑上写着：「每一次跌倒，大地都会记住。」',
                '你踩到了一些碎片——那是某个曾经完整的器物。',
                '墙壁上有抓痕，是某个曾经被困在这里的人留下的。',
                '失败的味道是苦涩的，但你已经学会了咽下去。'
            ],
            lore: [
                { title: '破碎者的日记', text: '「第无数次尝试。又是失败。但这次，我注意到了一些以前没有注意到的东西。也许失败的意义不在于结果，而在于它教会了我观察。」' },
                { title: '红色的碑文', text: '「没有人能一直站在光芒中。学会在黑暗中行走的人，才能走得更远。破碎不是你的耻辱——是你的勋章。」' },
                { title: '废墟中的信', text: '「亲爱的后来者：如果你读到了这封信，说明你也跌倒过。站起来吧。跌倒不可怕——可怕的是忘记了怎么站起来。」' },
                { title: '古老的谚语', text: '「矿石不知道自己会变成什么。它只知道火焰很热，锤子很重。但正是这些，将它变成了钢。」' }
            ],
            wallDecorations: [
                { type: 'crack', frequency: 0.1 },
                { type: 'scorch', frequency: 0.05 },
                { type: 'scratch', frequency: 0.03 },
                { type: 'rubble', frequency: 0.04 }
            ],
            hazards: [
                { type: 'collapse', x: 15, y: 9, radius: 2, message: '石壁在你面前坍塌了！' },
                { type: 'dead_end', x: 9, y: 3, radius: 1, message: '死路。但每一条死路都告诉你一些什么。' }
            ],
            secretAreas: [
                { x: 7, y: 7, width: 3, height: 3, hint: '坍塌的石壁后面似乎有通道……' },
                { x: 23, y: 11, width: 2, height: 2, hint: '地面上的裂缝比其他地方更深。' }
            ],
            puzzles: [
                { type: 'trial_and_error', x: 19, y: 13, description: '一条看似无法通过的路。尝试不同的方向。', solution: ['south', 'east', 'north', 'east'] }
            ],
            weather: { type: 'embers', intensity: 0.4 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'ruin', text: '这里的石壁上刻满了名字——每一个名字都是一次失败，也是一次尝试。' },
                { x: 25, y: 3, type: 'inscription', text: '「失败不是你的敌人。它是最诚实的老师。」' }
            ],
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
            description: '紫色的微光在空旷的回廊中若隐若现。这里的空间似乎比实际更大，每一步的回声都让你感觉有人在身后跟随。',
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
                { x: 9, y: 15 },
                { x: 13, y: 11 },
                { x: 17, y: 21 },
                { x: 19, y: 19 },
                { x: 25, y: 7 },
                { x: 29, y: 17 },
                { x: 31, y: 15 },
                { x: 11, y: 21 }
            ],
            doors: [],
            npcs: [
                { x: 19, y: 13, id: 'solitude_echo_1', ghostly: true, lines: ['…是你吗？', '我在这里等了很久，久到忘记了在等谁。', '也许每个人走到这里，都会听见同样的回声。', '但那不是别人——是你自己的声音，从墙壁上弹回来。', '倾听它吧，它比你以为的更温柔。'] },
                { x: 7, y: 7, id: 'solitude_echo_2', ghostly: true, lines: ['你听见了什么？', '寂静。然后是自己的脚步声。', '然后是心跳。', '然后是记忆深处，某个人的名字。', '孤独不是没有声音，是所有声音都变成了自己的。'] }
            ],
            element: 'solitude',
            ambientTexts: [
                '你的脚步声在空旷的回廊中回荡。',
                '寂静。只有你自己的呼吸声。',
                '你似乎听到了什么，但那只是风声。',
                '回廊延伸向远方，看不到尽头。',
                '紫色的光芒在你经过时变暗了一些。',
                '你感到了一种奇异的平静——或者那只是麻木？',
                '墙壁上倒映着你模糊的影子。',
                '时间在这里似乎变慢了。',
                '你不知道自己走了多久。',
                '在这片寂静中，你开始听见自己内心深处的声音。',
                '孤独像一件外套，沉重但温暖。',
                '你的心跳声在回廊里被放大了数倍。'
            ],
            lore: [
                { title: '独行者之歌', text: '「我走过了千条路，但每一条路上都只有我一个人的脚印。后来我明白了——那不是孤独，那是自由。当没有人在看你的时候，你才是真正的自己。」' },
                { title: '紫色的手稿', text: '「孤独是一位严厉的老师。它不给你安慰，只给你真相。但当你学会与孤独对话时，你会发现它其实很温柔。」' },
                { title: '回廊中的低语', text: '「所有伟大的旅程都是独自完成的。不是因为没有同伴，而是因为有些路只能一个人走。」' },
                { title: '镜中的文字', text: '「你看到的不是迷宫的墙壁。你看到的是你自己。迷宫是你内心的映射。孤独不是在迷宫中迷路——而是在迷宫中找到了自己。」' }
            ],
            wallDecorations: [
                { type: 'mirror', frequency: 0.02 },
                { type: 'purple_rune', frequency: 0.03 },
                { type: 'crack', frequency: 0.02 },
                { type: 'shadow', frequency: 0.04 }
            ],
            hazards: [
                { type: 'echo_maze', x: 15, y: 13, radius: 5, message: '你的回声误导了你。方向感消失了。' }
            ],
            secretAreas: [
                { x: 3, y: 9, width: 3, height: 3, hint: '回声在这里变得不太一样了……' },
                { x: 27, y: 21, width: 3, height: 3, hint: '紫色的光芒在这里特别浓。' },
                { x: 33, y: 11, width: 2, height: 2, hint: '寂静在这里更加深沉。' }
            ],
            puzzles: [
                { type: 'sound', x: 19, y: 9, description: '跟随回声的方向前进。', solution: ['echo_north', 'echo_east', 'echo_south'] }
            ],
            weather: { type: 'echo', intensity: 0.2 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'mirror', text: '你在墙壁上看到了自己的倒影。但你不确定那是不是现在的你。' },
                { x: 31, y: 15, type: 'inscription', text: '「当你学会与自己对话时，孤独就变成了一种陪伴。」' },
                { x: 13, y: 11, type: 'echo_point', text: '你在这里说了一句话。回声重复了三遍，每一遍听起来都像是一个不同的声音。' }
            ],
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
            description: '粉色的微光穿过石壁的缝隙，编织成复杂的光网。空气中弥漫着花和泪水的气息——甜蜜与苦涩交织在一起。',
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
                { x: 9, y: 11 },
                { x: 17, y: 7 },
                { x: 17, y: 15 },
                { x: 25, y: 5 },
                { x: 25, y: 17 },
                { x: 29, y: 11 }
            ],
            doors: [],
            npcs: [
                { x: 9, y: 11, id: 'love_npc_1', lines: ['你并不孤单。', '每一条路都有人与你同行，只是你还没看见。', '有时候我们以为自己在黑暗中独行，', '但其实那只是因为我们忘记回头看看。'] },
                { x: 21, y: 11, id: 'love_npc_2', lines: ['光是礼物，但给予光比拥有光更需要勇气。', '你愿意照亮别人吗？', '即使那意味着你自己会站在阴影里。', '真正的爱，是甘愿成为别人路上的灯。'] },
                { x: 29, y: 11, id: 'love_npc_3', lines: ['你们在同一个迷宫里走了很久。', '走过同样的转角，错过同样的路口。', '现在你终于看见了对方。', '记住这一刻——不是所有的相遇都会重来。'] }
            ],
            element: 'love',
            ambientTexts: [
                '光线在墙壁上交织成美丽的图案。',
                '你闻到了花的香气——从哪里来的？',
                '空气中似乎有某种温暖的东西在流动。',
                '粉色的光芒在你经过时变得更加明亮。',
                '你感到了一种牵引力，将你拉向某个方向。',
                '石壁上有两个手印，一大一小，紧紧相贴。',
                '你听到了远处的歌声，像是一首你曾经知道但已经忘记的歌。',
                '地面上有两条足迹，始终平行，但从未交汇。',
                '光线在某个角落汇聚成一个心形的图案。',
                '温暖。这里比其他地方都要温暖。',
                '你突然想起了某个人的笑容——是谁？'
            ],
            lore: [
                { title: '情书·第一封', text: '「我不知道你在哪里，但我知道你在某个地方。这就够了。距离不能阻止一颗心去爱——它只能让爱变得更加坚定。」' },
                { title: '交织的手稿', text: '「爱不是两束光合并成一束。爱是两束光交汇时创造的阴影——那些阴影定义了彼此的形状。没有阴影的光是盲目的。」' },
                { title: '粉色的碑文', text: '「世界上最远的距离不是生与死，而是我站在你面前，你却不知道我爱你。但即使如此，我依然选择站在你面前。」' },
                { title: '两条路的交汇', text: '「我们各自走过无数条路，经历了无数个转弯。每一次选择都让我们更接近或更远离彼此。但最终，我们在这里相遇了。这不是巧合——这是所有选择的必然。」' }
            ],
            wallDecorations: [
                { type: 'heart_rune', frequency: 0.02 },
                { type: 'intertwined_line', frequency: 0.04 },
                { type: 'flower', frequency: 0.03 },
                { type: 'handprint', frequency: 0.01 }
            ],
            hazards: [
                { type: 'separation', x: 17, y: 11, radius: 4, message: '光线突然分裂，你感到了一种撕扯感……' }
            ],
            secretAreas: [
                { x: 13, y: 9, width: 3, height: 3, hint: '光线在这里格外柔和……' },
                { x: 21, y: 13, width: 3, height: 3, hint: '墙上的手印似乎在指引着什么。' }
            ],
            puzzles: [
                { type: 'pair', x: 17, y: 11, description: '将两束光引导到同一个位置。', solution: ['north_mirror', 'south_mirror'] }
            ],
            weather: { type: 'petals', intensity: 0.3 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'inscription', text: '石壁上刻着两行字，但它们从不同的方向开始，在中间交汇成一个字：「爱」' },
                { x: 25, y: 17, type: 'handprint', text: '你将手放在墙壁的手印上。它出奇地温暖——仿佛有人刚刚触碰过。' },
                { x: 29, y: 11, type: 'viewpoint', text: '从这里望去，你能看到整个迷宫的全貌。所有的道路最终都交汇在一起。' }
            ],
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
            description: '金色的微光从上方洒落，仿佛穿过教堂的穹顶。空气中弥漫着香和烛蜡的气息。这里的空间向上延伸，让人忍不住想要仰望。',
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
                { x: 5, y: 5 },
                { x: 11, y: 9 },
                { x: 15, y: 9 },
                { x: 19, y: 13 },
                { x: 23, y: 9 },
                { x: 27, y: 17 },
                { x: 31, y: 5 },
                { x: 35, y: 21 },
                { x: 11, y: 21 }
            ],
            doors: [
                { x: 19, y: 9, keyId: 'prayer_key' }
            ],
            keyItems: [
                { x: 27, y: 17, keyId: 'prayer_key' }
            ],
            npcs: [
                { x: 15, y: 9, id: 'prayer_monk', ghostly: true, lines: ['你来了。', '祈祷不是请求——是聆听。', '当你停止说话，整个世界开始回应。', '跪下并不代表屈服，而是放下所有的盔甲。', '在真正的静默中，你会找到比语言更古老的东西。'] }
            ],
            element: 'prayer',
            ambientTexts: [
                '金色的光芒从上方洒落，温暖而柔和。',
                '你闻到了焚香的味道——檀香，或是更古老的东西。',
                '空气中充满了某种神圣的静谧。',
                '你听到了远处的钟声，沉稳而悠远。',
                '石壁上的金色纹路像是一道道祈祷的文字。',
                '你感到了一种安宁，仿佛所有的烦恼都在这里被消解。',
                '地面上的石板排列成某种图案，从上方俯瞰一定很美。',
                '这里的空间比其他地方更加高耸，让人不禁仰望。',
                '你感到了一种想要跪下的冲动——不是因为恐惧，而是因为敬畏。',
                '祈祷不需要语言。只需要安静。'
            ],
            lore: [
                { title: '僧侣的日记', text: '「我在这里修行了三十年。最初我祈求智慧，后来我祈求平静，最后我什么都不祈求了。那时我才真正开始聆听。原来沉默就是最好的祈祷。」' },
                { title: '金色的经文', text: '「跪下的膝盖碰到的不是冰冷的石板，而是大地本身。当你真正跪下时，你与万物相连。这不是屈服——这是回归。」' },
                { title: '祈祷室的碑文', text: '「祈祷不是让你得到想要的东西。祈祷是让你看清你真正需要的东西。这两者之间的距离，就是修行的路。」' },
                { title: '穹顶上的铭文', text: '「最高的地方不是最接近天空的地方，而是最接近内心的地方。向上仰望不是为了寻找神明，而是为了看见自己的倒影。」' }
            ],
            wallDecorations: [
                { type: 'golden_rune', frequency: 0.04 },
                { type: 'candle', frequency: 0.05 },
                { type: 'prayer_strip', frequency: 0.03 },
                { type: 'crack', frequency: 0.01 }
            ],
            hazards: [
                { type: 'silence_zone', x: 19, y: 17, radius: 3, message: '所有的声音都消失了。在绝对的寂静中，你听到了自己的心跳。' }
            ],
            secretAreas: [
                { x: 33, y: 9, width: 3, height: 3, hint: '金色的光芒在这里形成了十字形……' },
                { x: 7, y: 21, width: 3, height: 3, hint: '祈祷的经文在这里突然停止了。' }
            ],
            puzzles: [
                { type: 'offering', x: 19, y: 13, description: '在祭坛前停顿片刻。有些东西不需要做，只需要在。', solution: ['wait'] }
            ],
            weather: { type: 'golden_dust', intensity: 0.5 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'altar', text: '一个小小的祭坛。上面什么都没有，但你感觉到它不需要任何供品——只需要你在这里。' },
                { x: 31, y: 5, type: 'inscription', text: '「祈祷不是一种行为。它是一种存在方式。」' },
                { x: 19, y: 13, type: 'shrine', text: '你站在神龛前。没有神像，只有一束光。你闭上了眼睛。' },
                { x: 35, y: 21, type: 'bell', text: '一口古老的钟。你没有敲它，但它似乎在以某种方式回应你的存在。' }
            ],
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
            description: '这里的光线几乎完全消失了。灰色的墙壁像是用骨灰砌成。空气中没有温度，没有气味，只有一种令人窒息的虚无感。但在这虚无的深处，有什么东西在等待被发现。',
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
                { x: 9, y: 15 },
                { x: 11, y: 11 },
                { x: 17, y: 7 },
                { x: 17, y: 17 },
                { x: 23, y: 7 },
                { x: 27, y: 13 },
                { x: 29, y: 17 }
            ],
            doors: [],
            hiddenPaths: [
                { x: 6, y: 4 },
                { x: 12, y: 12 },
                { x: 30, y: 18 },
                { x: 18, y: 16 },
                { x: 24, y: 6 }
            ],
            npcs: [
                { x: 17, y: 11, id: 'death_shadow', ghostly: true, lines: ['你害怕吗？', '害怕是正常的。每个活着的生命都害怕终结。', '但死亡不是终结——它是一扇门。', '你不会消失，你只是变成了别的什么。', '就像火焰熄灭后，热仍然留在空气里。'] }
            ],
            element: 'death',
            ambientTexts: [
                '这里的光几乎消失了。你只能看到眼前的事物。',
                '空气冰冷，没有温度。',
                '你听到了什么？不，什么都没有。',
                '墙壁的质感像骨骼一样光滑。',
                '你的呼吸在这里变成了白色的雾气。',
                '地上有灰烬，但你看不到火源。',
                '时间在这里似乎停止了流动。',
                '你感到了一种平静——或者那是麻木？',
                '黑暗中有什么东西在注视着你。',
                '你踩到了一些东西。低头一看——是一朵枯萎的花。',
                '这里没有声音，没有气味，没有温度。只有存在本身。',
                '你开始思考：如果光消失了，黑暗还是黑暗吗？'
            ],
            lore: [
                { title: '亡者的低语', text: '「不要害怕。我就在门的另一边。当你穿过那扇门时，你会发现我一直在等你。不是以你想象的方式——而是以你一直寻找的方式。」' },
                { title: '灰色的碑文', text: '「生命是一束光。死亡不是光的消失——而是光变成了别的东西。就像星星陨落后，它的光还在旅途中。」' },
                { title: '最后的信', text: '「如果你读到了这封信，说明你已经站在了门槛前。跨过去需要勇气，但留在原地同样需要勇气。无论你做什么选择，都是对的。」' },
                { title: '骨灰中的文字', text: '「我们从灰烬中来，到灰烬中去。但灰烬不是虚无——它是种子。所有的新生都从灰烬开始。」' }
            ],
            wallDecorations: [
                { type: 'bone', frequency: 0.03 },
                { type: 'ash', frequency: 0.05 },
                { type: 'grey_rune', frequency: 0.02 },
                { type: 'crack', frequency: 0.06 }
            ],
            hazards: [
                { type: 'void', x: 17, y: 11, radius: 3, message: '虚无。你感觉自己正在被吞噬。但你没有消失。' },
                { type: 'cold', x: 9, y: 7, radius: 2, message: '刺骨的寒冷。你的灯笼火焰在颤抖。' }
            ],
            secretAreas: [
                { x: 3, y: 17, width: 3, height: 3, hint: '黑暗在这里似乎更加浓密，但更像是一种保护……' },
                { x: 25, y: 3, width: 2, height: 2, hint: '灰烬在这里形成了一个图案。' }
            ],
            puzzles: [
                { type: 'acceptance', x: 17, y: 11, description: '站在虚无面前，不要逃跑。', solution: ['stand_still'] }
            ],
            weather: { type: 'ash', intensity: 0.3 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'tomb', text: '一座无名的墓。没有名字，没有日期。只有一行字：「这里躺着所有还没准备好的人。」' },
                { x: 23, y: 7, type: 'inscription', text: '「死亡不是终结。它是所有问题的沉默。而在沉默中，答案终于有了声音。」' },
                { x: 29, y: 17, type: 'threshold', text: '你站在最后的门槛前。一侧是已知，一侧是未知。你深呼吸，然后——' }
            ],
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
            description: '绿色的微光从石缝中渗透出来，像是新生的嫩芽。空气中弥漫着泥土和露水的气息。这是最后一段路程，也是最艰难的一段。',
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
                { x: 9, y: 15 },
                { x: 13, y: 23 },
                { x: 17, y: 9 },
                { x: 21, y: 19 },
                { x: 25, y: 5 },
                { x: 29, y: 19 },
                { x: 33, y: 11 },
                { x: 37, y: 5 }
            ],
            doors: [],
            element: 'hope',
            ambientTexts: [
                '绿色的光芒越来越亮了。',
                '你闻到了泥土和露水的气息——这是生命的味道。',
                '石缝中冒出了嫩芽。在这黑暗的迷宫中，生命在顽强地生长。',
                '你感到了一种从未有过的力量在涌动。',
                '远处似乎有什么在发光——是出口吗？',
                '空气变得温暖了一些。不，是你在变温暖。',
                '你走过了这么远的路。你的脚步比任何时候都要坚定。',
                '地面上的石板开始出现裂缝，绿色的光从裂缝中渗出。',
                '你听到了鸟鸣——在这迷宫深处？',
                '前方的道路似乎在发光。不是你的灯笼，而是道路本身。',
                '你回望来时的路。虽然看不到起点，但你知道自己走了多远。',
                '希望不是一种感觉。它是一种选择。而你选择了继续前行。'
            ],
            lore: [
                { title: '黎明之歌', text: '「在最长最暗的夜晚之后，太阳依然会升起。不是因为夜晚短暂，而是因为地球在转动。希望也是这样——不是因为你看到了光，而是因为你选择了相信光会来。」' },
                { title: '绿色的种子', text: '「这颗种子在黑暗中等待了很久。它不知道外面是什么样子，但它一直在生长。这就是希望的本质——在看不见光明的时候，依然选择生长。」' },
                { title: '最后的铭文', text: '「八枚碎片，八道光。你收集的不是碎片——你收集的是勇气、知识、耐心、爱、信念、谦逊、和平静。现在，将它们合在一起。它们构成了一个完整的圆。」' },
                { title: '旅途的终点', text: '「迷宫的出口不是一个地方。它是一个时刻——你终于理解了自己为什么走进来的那一刻。答案不是在出口等待你，答案就是你走过的每一步路。」' }
            ],
            wallDecorations: [
                { type: 'vine', frequency: 0.06 },
                { type: 'green_rune', frequency: 0.03 },
                { type: 'sprout', frequency: 0.04 },
                { type: 'crack', frequency: 0.02 }
            ],
            hazards: [
                { type: 'false_hope', x: 25, y: 13, radius: 2, message: '光芒突然消失。但你知道这只是考验。真正的光从未熄灭。' }
            ],
            secretAreas: [
                { x: 35, y: 3, width: 3, height: 3, hint: '绿色的光芒在这里汇聚成了一扇门的形状……' },
                { x: 7, y: 21, width: 3, height: 3, hint: '石壁上刻着所有你已经走过的路。' },
                { x: 31, y: 23, width: 2, height: 2, hint: '一颗发光的种子嵌在石壁中。' }
            ],
            puzzles: [
                { type: 'final_path', x: 39, y: 1, description: '最后的选择。不是向左或向右——而是向前。', solution: ['forward'] }
            ],
            weather: { type: 'dawn_light', intensity: 0.6 },
            interactionTriggers: [
                { x: 5, y: 5, type: 'memorial', text: '墙壁上刻着你在每个关卡找到的碎片。它们排列在一起，形成了一幅完整的图案。' },
                { x: 21, y: 19, type: 'viewpoint', text: '你站在一个高点上。远处，你能看到整个迷宫的轮廓。它比你想的要美丽得多。' },
                { x: 37, y: 5, type: 'final_inscription', text: '「你做到了。不是因为你足够强大，而是因为你从未停下。这就是希望。」' }
            ],
            reflection: {
                title: '黎明前的最后一刻',
                lines: [
                    '希望不是光——它是光到来之前的那个决定。',
                    '在最深的黑暗中，你选择相信黎明。',
                    '不是因为看见了光，而是因为你记得它。',
                    '八枚碎片，八道光，一个完整的圆。',
                    '你不是找到了答案——你成为了答案本身。'
                ]
            }
        }
    ];

    // --- Helper / Lookup Functions ---

    /**
     * Get a random ambient text for the given level index.
     * @param {number} index
     * @returns {string}
     */
    function getAmbientText(index) {
        var level = getLevel(index);
        if (!level || !level.ambientTexts || level.ambientTexts.length === 0) return '';
        return level.ambientTexts[Math.floor(Math.random() * level.ambientTexts.length)];
    }

    /**
     * Get a specific lore entry by level index and lore index.
     * @param {number} levelIndex
     * @param {number} loreIndex
     * @returns {{ title: string, text: string }|null}
     */
    function getLore(levelIndex, loreIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.lore) return null;
        if (loreIndex < 0 || loreIndex >= level.lore.length) return null;
        return level.lore[loreIndex];
    }

    /**
     * Get all lore entries for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getAllLore(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.lore) return [];
        return level.lore;
    }

    /**
     * Get a random lore entry for the given level.
     * @param {number} levelIndex
     * @returns {{ title: string, text: string }|null}
     */
    function getRandomLore(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.lore || level.lore.length === 0) return null;
        return level.lore[Math.floor(Math.random() * level.lore.length)];
    }

    /**
     * Get hazards for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getHazards(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.hazards) return [];
        return level.hazards;
    }

    /**
     * Get weather configuration for a level.
     * @param {number} levelIndex
     * @returns {{ type: string, intensity: number }}
     */
    function getWeather(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.weather) return { type: 'none', intensity: 0 };
        return level.weather;
    }

    /**
     * Get puzzles for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getPuzzles(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.puzzles) return [];
        return level.puzzles;
    }

    /**
     * Get level description.
     * @param {number} levelIndex
     * @returns {string}
     */
    function getDescription(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.description) return '';
        return level.description;
    }

    /**
     * Get secret areas for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getSecretAreas(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.secretAreas) return [];
        return level.secretAreas;
    }

    /**
     * Get wall decorations for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getWallDecorations(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.wallDecorations) return [];
        return level.wallDecorations;
    }

    /**
     * Get interaction triggers for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getInteractionTriggers(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.interactionTriggers) return [];
        return level.interactionTriggers;
    }

    /**
     * Get all NPC data for a level.
     * @param {number} levelIndex
     * @returns {Array}
     */
    function getNPCs(levelIndex) {
        var level = getLevel(levelIndex);
        if (!level || !level.npcs) return [];
        return level.npcs;
    }

    /**
     * Find the interaction trigger at a given grid position.
     * @param {number} levelIndex
     * @param {number} gx
     * @param {number} gy
     * @returns {object|null}
     */
    function getTriggerAt(levelIndex, gx, gy) {
        var triggers = getInteractionTriggers(levelIndex);
        for (var i = 0; i < triggers.length; i++) {
            if (triggers[i].x === gx && triggers[i].y === gy) {
                return triggers[i];
            }
        }
        return null;
    }

    /**
     * Check if a hazard exists at a given position.
     * @param {number} levelIndex
     * @param {number} gx
     * @param {number} gy
     * @returns {object|null}
     */
    function getHazardAt(levelIndex, gx, gy) {
        var hazards = getHazards(levelIndex);
        for (var i = 0; i < hazards.length; i++) {
            var h = hazards[i];
            var dx = gx - h.x;
            var dy = gy - h.y;
            if (dx * dx + dy * dy <= h.radius * h.radius) {
                return h;
            }
        }
        return null;
    }

    /**
     * Check if a position is in a secret area.
     * @param {number} levelIndex
     * @param {number} gx
     * @param {number} gy
     * @returns {object|null}
     */
    function getSecretAreaAt(levelIndex, gx, gy) {
        var areas = getSecretAreas(levelIndex);
        for (var i = 0; i < areas.length; i++) {
            var a = areas[i];
            if (gx >= a.x && gx < a.x + a.width && gy >= a.y && gy < a.y + a.height) {
                return a;
            }
        }
        return null;
    }

    // --- Core Functions ---

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
        reset: reset,
        getAmbientText: getAmbientText,
        getLore: getLore,
        getAllLore: getAllLore,
        getRandomLore: getRandomLore,
        getHazards: getHazards,
        getWeather: getWeather,
        getPuzzles: getPuzzles,
        getDescription: getDescription,
        getSecretAreas: getSecretAreas,
        getWallDecorations: getWallDecorations,
        getInteractionTriggers: getInteractionTriggers,
        getNPCs: getNPCs,
        getTriggerAt: getTriggerAt,
        getHazardAt: getHazardAt,
        getSecretAreaAt: getSecretAreaAt
    };
})();

// ==================== 游戏核心状态 ====================
var gameState = {
    coins: 100,
    food: 50,
    materials: 0,
    research: 0,
    energy: 100,
    maxEnergy: 100,
    
    plots: [],
    monsters: [],
    expeditions: [],
    
    selectedMonster: null,
    
    technologies: {},
    
    nextMonsterId: 1,
    
    // 统计数据
    totalHarvests: 0,
    totalExplorations: 0,
    monstersBreed: 0,

    // 探索区域状态：{ [zoneId]: { unlocked, progress, assignedMonsters:[], autoTimer } }
    zoneStates: {},
    // 已购买通行证的区域
    purchasedZones: {}
};

// ==================== 常量定义 ====================
var monsterTypes = {
    // 基础五种
    slime:  { name: '史莱姆', color: '#4caf50', baseStats: { strength: 3, agility: 2, intelligence: 1, farming: 4 }, rarity: 'common' },
    goblin: { name: '哥布林', color: '#ff9800', baseStats: { strength: 4, agility: 3, intelligence: 2, farming: 2 }, rarity: 'common' },
    sprite: { name: '精灵',   color: '#2196f3', baseStats: { strength: 1, agility: 4, intelligence: 5, farming: 3 }, rarity: 'uncommon' },
    golem:  { name: '石像鬼', color: '#795548', baseStats: { strength: 5, agility: 1, intelligence: 1, farming: 3 }, rarity: 'uncommon' },
    wisp:   { name: '幽灵',   color: '#9c27b0', baseStats: { strength: 2, agility: 5, intelligence: 4, farming: 1 }, rarity: 'uncommon' },
    // 稀有种（通过深度区域探索获得）
    ifrit:  { name: '炎魔',   color: '#ff5722', baseStats: { strength: 7, agility: 4, intelligence: 3, farming: 1 }, rarity: 'rare' },
    toxfrog:{ name: '毒液蛙', color: '#8bc34a', baseStats: { strength: 3, agility: 6, intelligence: 4, farming: 2 }, rarity: 'rare' },
    crystal:{ name: '冰晶',   color: '#80deea', baseStats: { strength: 4, agility: 3, intelligence: 8, farming: 1 }, rarity: 'rare' },
    shadow: { name: '暗影',   color: '#37474f', baseStats: { strength: 6, agility: 7, intelligence: 5, farming: 0 }, rarity: 'epic' },
    ancient:{ name: '古龙',   color: '#ffd700', baseStats: { strength: 10,agility: 8, intelligence: 10,farming: 5 }, rarity: 'legendary' }
};

// ==================== 探索区域定义 ====================
var explorationZones = [
    {
        id: 'farm_edge',
        name: '农场边缘',
        icon: '🌿',
        desc: '农场旁边的草地，安全且容易探索。',
        unlockCondition: null,           // 默认开放
        energyCostManual: 5,             // 手动每次消耗能量
        progressPerClick: [12, 20],      // [min, max] 每次手动点击进度
        autoProgressPerSec: 0,           // 派遣时每秒进度（由怪兽属性动态计算，此为基础值）
        monsters: ['slime'],
        catchChance: 0.25,
        rewards: { coins: [15, 40], food: [10, 25], materials: [0, 5], research: [0, 0] }
    },
    {
        id: 'shallow_forest',
        name: '浅林',
        icon: '🌲',
        desc: '农场附近的小树林，有零散的资源。',
        unlockCondition: { type: 'coins', value: 200, label: '拥有金币 ≥ 200' },
        energyCostManual: 5,
        progressPerClick: [10, 18],
        monsters: ['goblin'],
        catchChance: 0.22,
        rewards: { coins: [30, 70], food: [5, 15], materials: [10, 25], research: [0, 5] }
    },
    {
        id: 'wild_plain',
        name: '野外草原',
        icon: '🏞',
        desc: '一望无际的草原，偶尔有精灵出没。',
        unlockCondition: { type: 'totalExplorations', value: 3, label: '完成探索 ≥ 3 次' },
        energyCostManual: 8,
        progressPerClick: [8, 16],
        monsters: ['sprite', 'slime'],
        catchChance: 0.20,
        rewards: { coins: [20, 60], food: [15, 30], materials: [5, 15], research: [8, 20] }
    },
    {
        id: 'rocky_hills',
        name: '碎石丘陵',
        icon: '🪨',
        desc: '坚硬的岩石地带，石像鬼在此栖息。',
        unlockCondition: { type: 'materials', value: 100, label: '拥有材料 ≥ 100' },
        energyCostManual: 8,
        progressPerClick: [8, 15],
        monsters: ['golem', 'goblin'],
        catchChance: 0.18,
        rewards: { coins: [40, 90], food: [0, 10], materials: [30, 60], research: [5, 15] }
    },
    {
        id: 'mist_forest',
        name: '迷雾森林',
        icon: '🌫',
        desc: '笼罩在神秘迷雾中的古老森林，幽灵在此游荡。',
        unlockCondition: { type: 'monsterCount', value: 3, label: '拥有怪兽 ≥ 3 只' },
        energyCostManual: 10,
        progressPerClick: [7, 14],
        monsters: ['wisp', 'sprite'],
        catchChance: 0.16,
        rewards: { coins: [30, 80], food: [0, 20], materials: [10, 30], research: [20, 45] }
    },
    {
        id: 'volcano_foot',
        name: '火山麓',
        icon: '🌋',
        desc: '炽热的火山脚下，危险但充满财富，炎魔在此栖息。',
        unlockCondition: { type: 'tech', value: 'exploration', label: '解锁科技「探索技术」' },
        energyCostManual: 12,
        progressPerClick: [6, 13],
        monsters: ['ifrit', 'golem'],
        catchChance: 0.14,
        rewards: { coins: [80, 180], food: [0, 5], materials: [20, 50], research: [10, 25] }
    },
    {
        id: 'swamp',
        name: '沼泽地带',
        icon: '🌊',
        desc: '泥泞危险的沼泽，毒液蛙在此繁衍。',
        unlockCondition: { type: 'totalExplorations', value: 15, label: '完成探索 ≥ 15 次' },
        energyCostManual: 12,
        progressPerClick: [6, 12],
        monsters: ['toxfrog', 'wisp'],
        catchChance: 0.13,
        rewards: { coins: [50, 120], food: [5, 20], materials: [40, 80], research: [15, 35] }
    },
    {
        id: 'snow_plateau',
        name: '雪域高原',
        icon: '❄️',
        desc: '白雪皑皑的高原，冰晶在极寒中修炼。',
        unlockCondition: { type: 'compound', conditions: [
            { type: 'monsterCount', value: 5, label: '拥有怪兽 ≥ 5 只' },
            { type: 'coins', value: 1000, label: '拥有金币 ≥ 1000' }
        ], label: '拥有 5 只怪兽且金币 ≥ 1000' },
        energyCostManual: 15,
        progressPerClick: [5, 11],
        monsters: ['crystal', 'sprite'],
        catchChance: 0.11,
        rewards: { coins: [60, 140], food: [0, 10], materials: [20, 60], research: [40, 80] }
    },
    {
        id: 'dark_cave',
        name: '暗黑洞窟',
        icon: '🌑',
        desc: '深入地下的漆黑洞窟，暗影在此沉眠。需要购买探险通行证。',
        unlockCondition: { type: 'purchase', value: 2000, label: '花费 2000 金币购买通行证' },
        energyCostManual: 18,
        progressPerClick: [4, 10],
        monsters: ['shadow', 'wisp'],
        catchChance: 0.10,
        rewards: { coins: [100, 220], food: [0, 15], materials: [50, 100], research: [50, 100] }
    },
    {
        id: 'ancient_ruins',
        name: '远古遗迹',
        icon: '🐉',
        desc: '传说中存在古龙的神秘遗迹，解锁需要强大的实力。',
        unlockCondition: { type: 'compound', conditions: [
            { type: 'allTech', label: '解锁全部科技' },
            { type: 'totalExplorations', value: 30, label: '完成探索 ≥ 30 次' }
        ], label: '解锁全部科技且完成探索 ≥ 30 次' },
        energyCostManual: 20,
        progressPerClick: [3, 8],
        monsters: ['ancient'],
        catchChance: 0.05,
        rewards: { coins: [200, 500], food: [20, 60], materials: [80, 150], research: [80, 150] }
    }
];

var cropTypes = [
    { 
        id: 'wheat', name: '小麦', growTime: 15000, yield: 5, value: 8, requiredTech: null,
        preferredMonster: 'goblin',   // 哥布林种小麦有加成
        desc: '基础粮食作物，生长快速',
        icon: 'plant'
    },
    { 
        id: 'corn', name: '玉米', growTime: 25000, yield: 8, value: 15, requiredTech: null,
        preferredMonster: 'golem',    // 石像鬼种玉米有加成
        desc: '高产作物，需要更长时间',
        icon: 'plant'
    },
    { 
        id: 'potato', name: '土豆', growTime: 20000, yield: 10, value: 10, requiredTech: null,
        preferredMonster: 'slime',    // 史莱姆种土豆有加成
        desc: '耐旱作物，产量稳定',
        icon: 'plant'
    },
    { 
        id: 'berry', name: '浆果', growTime: 30000, yield: 12, value: 25, requiredTech: 'advancedFarming',
        preferredMonster: 'sprite',   // 精灵种浆果有加成
        desc: '珍贵浆果，价值最高',
        icon: 'plant'
    },
    { 
        id: 'mushroom', name: '蘑菇', growTime: 40000, yield: 6, value: 35, requiredTech: 'advancedFarming',
        preferredMonster: 'wisp',     // 幽灵种蘑菇有加成
        desc: '神奇蘑菇，价值极高但难以种植',
        icon: 'plant'
    }
];

var technologies = {
    advancedFarming: {
        name: '高级农业',
        desc: '解锁高级作物和耕作技术',
        cost: { research: 50, coins: 200 },
        unlocked: false,
        effects: { cropYield: 1.2 }
    },
    irrigation: {
        name: '灌溉系统',
        desc: '减少作物生长时间20%',
        cost: { research: 30, materials: 50 },
        unlocked: false,
        effects: { growthSpeed: 1.25 }
    },
    monsterTraining: {
        name: '怪兽训练',
        desc: '提升怪兽属性成长',
        cost: { research: 80, coins: 300 },
        unlocked: false,
        effects: { statGrowth: 1.3 }
    },
    exploration: {
        name: '探索技术',
        desc: '增加探索收益和成功率',
        cost: { research: 60, materials: 100 },
        unlocked: false,
        effects: { explorationBonus: 1.5 }
    },
    breeding: {
        name: '繁殖技术',
        desc: '允许怪兽繁殖，培育更强后代',
        cost: { research: 100, coins: 500 },
        unlocked: false,
        effects: { breedingEnabled: true }
    },
    expansion: {
        name: '农场扩建',
        desc: '解锁更多农田',
        cost: { coins: 500, materials: 200 },
        unlocked: false,
        effects: { extraPlots: 3 }
    }
};

var randomEvents = {
    farming: [
        {
            title: '及时雨',
            desc: '一场及时雨降临农场，作物生长速度临时提升！',
            choices: [
                { text: '太好了！', effect: function() {
                    gameState.plots.forEach(function(plot) {
                        if (plot.crop) plot.growthBonus = 1.5;
                    });
                    setTimeout(function() {
                        gameState.plots.forEach(function(plot) { plot.growthBonus = 1; });
                    }, 30000);
                    showNotification('作物生长加速30秒！', 'success');
                }}
            ]
        },
        {
            title: '虫害',
            desc: '农场遭遇虫害！是否使用食物驱虫？',
            choices: [
                { 
                    text: '使用食物(20)', 
                    cost: { food: 20 },
                    effect: function() { showNotification('成功驱虫！', 'success'); }
                },
                { 
                    text: '忽略', 
                    effect: function() {
                        var plot = gameState.plots.find(function(p) { return p.crop; });
                        if (plot) {
                            plot.progress = Math.max(0, plot.progress - 30);
                            showNotification('作物生长受损...', 'error');
                        }
                    }
                }
            ]
        },
        {
            title: '大风',
            desc: '大风吹过农场，散落了一些材料',
            choices: [
                { text: '收集', effect: function() {
                    var gain = Math.floor(Math.random() * 20) + 10;
                    gameState.materials += gain;
                    updateResources();
                    showNotification('获得 ' + gain + ' 材料！', 'success');
                }}
            ]
        }
    ],
    exploration: [
        {
            title: '神秘商人',
            desc: '遇到神秘商人，愿意用材料交换金币',
            choices: [
                { 
                    text: '交易(材料-50 → 金币+150)', 
                    cost: { materials: 50 },
                    effect: function() {
                        gameState.coins += 150;
                        updateResources();
                        showNotification('交易成功！', 'success');
                    }
                },
                { text: '拒绝', effect: function() {} }
            ]
        },
        {
            title: '野生怪兽',
            desc: '遭遇野生怪兽！是否战斗捕获？',
            choices: [
                { 
                    text: '战斗', 
                    effect: function() {
                        if (Math.random() > 0.5) {
                            var types = Object.keys(monsterTypes);
                            var type = types[Math.floor(Math.random() * types.length)];
                            createMonster(type);
                            showNotification('捕获成功！获得新怪兽！', 'success');
                        } else {
                            gameState.energy = Math.max(0, gameState.energy - 20);
                            updateResources();
                            showNotification('捕获失败，消耗能量...', 'error');
                        }
                    }
                },
                { text: '逃跑', effect: function() {} }
            ]
        },
        {
            title: '宝藏',
            desc: '发现了一个宝箱！',
            choices: [
                { text: '打开', effect: function() {
                    var rewards = [
                        { coins: 100 },
                        { materials: 80 },
                        { research: 30 },
                        { food: 50 }
                    ];
                    var reward = rewards[Math.floor(Math.random() * rewards.length)];
                    Object.keys(reward).forEach(function(key) {
                        gameState[key] += reward[key];
                    });
                    updateResources();
                    showNotification('获得奖励：' + JSON.stringify(reward), 'success');
                }}
            ]
        }
    ],
    general: [
        {
            title: '意外之财',
            desc: '路过的旅行者给了你一些金币',
            choices: [
                { text: '收下', effect: function() {
                    gameState.coins += 50;
                    updateResources();
                    showNotification('获得 50 金币！', 'success');
                }}
            ]
        }
    ]
};

// ==================== 核心功能函数 ====================
function initGame() {
    // 创建初始地块（3块可用，其他锁定）
    for (var i = 0; i < 9; i++) {
        gameState.plots.push({
            id: i,
            locked: i >= 3,
            unlockCost: { coins: 100 * (i - 2), materials: 50 * (i - 2) },
            crop: null,
            plantedAt: null,
            progress: 0,
            assignedMonster: null,
            autoCrop: null,
            growthBonus: 1
        });
    }
    
    // 初始化科技
    Object.keys(technologies).forEach(function(key) {
        gameState.technologies[key] = false;
    });
    
    // 初始化UI
    initUI();

    renderAll();

    // 启动教学引导（新存档才触发）
    if (!checkTutorialDone()) {
        setTimeout(startTutorial, 600);
    }
}

function createMonster(type, parent1, parent2) {
    var typeData = monsterTypes[type];
    var baseStats = typeData.baseStats;
    
    var stats = {};
    Object.keys(baseStats).forEach(function(stat) {
        var value = baseStats[stat];
        
        if (parent1 && parent2) {
            var parent1Stat = parent1.stats[stat];
            var parent2Stat = parent2.stats[stat];
            value = Math.floor((parent1Stat + parent2Stat) / 2);
            
            if (Math.random() < 0.2) {
                value += Math.random() < 0.5 ? -1 : 1;
            }
        }
        
        value += Math.floor((Math.random() - 0.5) * 2 * (value * 0.2));
        stats[stat] = Math.max(1, value);
    });
    
    var monster = {
        id: gameState.nextMonsterId++,
        type: type,
        name: typeData.name + '#' + gameState.nextMonsterId,
        stats: stats,
        level: 1,
        exp: 0,
        maxExp: 100,
        assignment: null,
        status: 'idle',
        traits: generateTraits(),
        generation: parent1 ? Math.max(parent1.generation, parent2.generation) + 1 : 1
    };
    
    gameState.monsters.push(monster);
    return monster;
}

function generateTraits() {
    var allTraits = [
        { id: 'fast', name: '敏捷', effect: { agility: 1 } },
        { id: 'strong', name: '强壮', effect: { strength: 1 } },
        { id: 'smart', name: '聪慧', effect: { intelligence: 1 } },
        { id: 'farmer', name: '农夫', effect: { farming: 2 } },
        { id: 'lazy', name: '懒惰', effect: { farming: -1, agility: -1 } },
        { id: 'lucky', name: '幸运', effect: { luck: 1 } },
        { id: 'hardy', name: '顽强', effect: { strength: 1, agility: -1 } }
    ];
    
    var numTraits = Math.random() < 0.3 ? 2 : 1;
    var traits = [];
    
    for (var i = 0; i < numTraits; i++) {
        var trait = allTraits[Math.floor(Math.random() * allTraits.length)];
        if (!traits.find(function(t) { return t.id === trait.id; })) {
            traits.push(trait);
        }
    }
    
    return traits;
}

function gainExp(monster, amount) {
    monster.exp += amount;
    
    while (monster.exp >= monster.maxExp) {
        monster.exp -= monster.maxExp;
        monster.level++;
        monster.maxExp = Math.floor(monster.maxExp * 1.5);
        
        var statKeys = Object.keys(monster.stats);
        statKeys.forEach(function(key) {
            var increase = Math.random() < 0.5 ? 1 : 0;
            monster.stats[key] += increase;
        });
        
        showNotification(monster.name + ' 升级到 ' + monster.level + ' 级！', 'success');
    if (typeof briefLevelUp === 'function') briefLevelUp(monster.name, monster.level);
    }
}

function autoSave() {
    var saveData = {
        coins: gameState.coins,
        food: gameState.food,
        materials: gameState.materials,
        research: gameState.research,
        energy: gameState.energy,
        monsters: gameState.monsters.map(function(m) {
            return {
                ...m,
                assignment: null,
                status: 'idle'
            };
        }),
        technologies: gameState.technologies,
        plots: gameState.plots.map(function(p) {
            return {
                ...p,
                crop: null,
                assignedMonster: null,
                progress: 0
            };
        }),
        totalHarvests: gameState.totalHarvests,
        totalExplorations: gameState.totalExplorations,
        monstersBreed: gameState.monstersBreed,
        nextMonsterId: gameState.nextMonsterId
    };
    
    localStorage.setItem('monsterFarm_v1', JSON.stringify(saveData));
}

function loadGame() {
    var saved = localStorage.getItem('monsterFarm_v1');
    
    if (saved) {
        try {
            var saveData = JSON.parse(saved);
            
            gameState.coins = saveData.coins || 100;
            gameState.food = saveData.food || 50;
            gameState.materials = saveData.materials || 0;
            gameState.research = saveData.research || 0;
            gameState.energy = saveData.energy || 100;
            gameState.monsters = saveData.monsters || [];
            gameState.technologies = saveData.technologies || {};
            gameState.totalHarvests = saveData.totalHarvests || 0;
            gameState.totalExplorations = saveData.totalExplorations || 0;
            gameState.monstersBreed = saveData.monstersBreed || 0;
            gameState.nextMonsterId = saveData.nextMonsterId || 1;
            
            Object.keys(technologies).forEach(function(key) {
                if (!(key in gameState.technologies)) {
                    gameState.technologies[key] = false;
                }
            });
            
            showNotification('游戏加载成功！', 'success');
        } catch (e) {
            console.error('加载存档失败:', e);
            showNotification('加载存档失败，开始新游戏', 'warning');
        }
    }
}

function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        // 先重置内存状态，防止 beforeunload 的 autoSave 把旧数据重新写回
        gameState.coins = 100;
        gameState.food = 50;
        gameState.materials = 0;
        gameState.research = 0;
        gameState.energy = 100;
        gameState.monsters = [];
        gameState.plots = [];
        gameState.technologies = {};
        gameState.totalHarvests = 0;
        gameState.totalExplorations = 0;
        gameState.monstersBreed = 0;
        gameState.nextMonsterId = 1;
        gameState.zoneStates = {};
        gameState.purchasedZones = {};
        gameState.selectedMonster = null;

        // 清除所有相关 localStorage 数据
        localStorage.removeItem('monsterFarm_v1');
        localStorage.removeItem('mf_tutorial_done');

        location.reload();
    }
}

// ==================== 全局事件与定时器 ====================

// ── 资源循环核心（每10秒tick一次）──
setInterval(function() {
    var changed = false;

    // 1. 能量上限随怪兽数量动态扩容（基础100，每只怪兽+20，最多500）
    var newMax = Math.min(500, 100 + gameState.monsters.length * 20);
    if (newMax !== gameState.maxEnergy) {
        gameState.maxEnergy = newMax;
        changed = true;
    }

    // 2. 能量自然恢复：基础每10s+1；有食物时额外恢复：每10食物每10s+1（最多+5）
    if (gameState.energy < gameState.maxEnergy) {
        var baseRegen = 1;
        var foodRegen = Math.min(5, Math.floor(gameState.food / 10));
        var totalRegen = baseRegen + foodRegen;
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + totalRegen);
        changed = true;
    }

    // 3. 食物消耗：每只在岗怪兽每10s消耗0.5食物（取整计算，避免过于频繁的小数扣减）
    var busyMonsters = gameState.monsters.filter(function(m) {
        return m.status === 'farming' || m.status === 'exploring';
    }).length;
    if (busyMonsters > 0) {
        var foodCost = Math.ceil(busyMonsters * 0.5);
        var prevFood = gameState.food;
        gameState.food = Math.max(0, gameState.food - foodCost);
        // 食物耗尽警告
        if (prevFood > 0 && gameState.food === 0) {
            showNotification('⚠️ 食物已耗尽！怪兽效率下降50%！', 'warning');
        }
        changed = true;
    }

    // 4. 金币维护费：每块有怪兽驻守的地块每10s消耗0.3金币（每分钟约1.8金/地块）
    var activePlots = gameState.plots.filter(function(p) { return p.assignedMonster; }).length;
    if (activePlots > 0) {
        var maintainCost = parseFloat((activePlots * 0.3).toFixed(1));
        // 使用累计扣减，避免浮点数问题
        if (!gameState._maintainAcc) gameState._maintainAcc = 0;
        gameState._maintainAcc += maintainCost;
        if (gameState._maintainAcc >= 1) {
            var toDeduct = Math.floor(gameState._maintainAcc);
            gameState._maintainAcc -= toDeduct;
            var prevCoins = gameState.coins;
            gameState.coins = Math.max(0, gameState.coins - toDeduct);
            // 金币耗尽警告
            if (prevCoins > 0 && gameState.coins === 0) {
                showNotification('⚠️ 金币已耗尽！怪兽无法维持工作效率！', 'warning');
            }
        }
        changed = true;
    }

    // 5. 惩罚标志更新（食物OR金币耗尽则效率减半）
    var wasPenalized = gameState.penalized;
    gameState.penalized = (gameState.food === 0 || gameState.coins === 0);
    if (gameState.penalized !== wasPenalized) {
        changed = true;
        // 惩罚状态变化时刷新界面
        if (typeof renderFarm === 'function') renderFarm();
    }

    if (changed) updateResources();
}, 10000);

// 随机事件
setInterval(function() {
    if (Math.random() < 0.1) {
        triggerRandomEvent('general');
    }
}, 60000);

// 自动保存
setInterval(autoSave, 30000);

// 页面关闭前保存
window.addEventListener('beforeunload', autoSave);

// 点击模态框外部关闭
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 快捷键
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        autoSave();
        showNotification('游戏已保存！', 'success');
    }
    
    if (e.key === 'Escape') {
        closeModal();
    }
    
    var tabMap = {
        '1': 'farm',
        '2': 'monsters',
        '3': 'exploration',
        '4': 'breeding',
        '5': 'tech',
        '6': 'disposal'
    };
    
    if (tabMap[e.key] && !e.ctrlKey && !e.metaKey) {
        var tabs = document.querySelectorAll('.tab');
        var index = parseInt(e.key) - 1;
        if (tabs[index]) {
            tabs[index].click();
        }
    }
});

// ==================== 可拖拽设置球 ====================
(function() {
    var btn = document.createElement('div');
    btn.id = 'settingsBtn';
    btn.style.cssText = [
        'position:fixed',
        'bottom:20px',
        'right:20px',
        'width:48px',
        'height:48px',
        'background:#2d333b',
        'border-radius:50%',
        'box-shadow:0 4px 16px rgba(0,0,0,0.45)',
        'cursor:grab',
        'z-index:9999',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:box-shadow 0.2s,background 0.2s',
        'user-select:none'
    ].join(';');

    // 深灰色齿轮矢量图
    btn.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
             stroke="#8b949e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                   a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21
                   a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33
                   l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15
                   a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9
                   a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06
                   A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3
                   a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33
                   l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9
                   a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                   a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>`;

    document.body.appendChild(btn);

    // ── 拖拽逻辑 ──
    var dragging = false, hasMoved = false;
    var startX, startY, origRight, origBottom;

    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        hasMoved = false;
        btn.style.cursor = 'grabbing';
        btn.style.transition = 'box-shadow 0.2s,background 0.2s'; // 拖动时关掉位移动画

        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        // 记录当前 right/bottom（从 style 读，单位 px）
        origRight  = parseInt(btn.style.right)  || 20;
        origBottom = parseInt(btn.style.bottom) || 20;

        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!dragging) return;
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var dx = clientX - startX;
        var dy = clientY - startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

        var newRight  = Math.max(8, Math.min(window.innerWidth  - 56, origRight  - dx));
        var newBottom = Math.max(8, Math.min(window.innerHeight - 56, origBottom + dy));
        btn.style.right  = newRight  + 'px';
        btn.style.bottom = newBottom + 'px';
    }

    function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        btn.style.cursor = 'grab';

        if (!hasMoved) {
            // 视为点击，打开设置面板（优先使用含字体调整的 showSettingsModal）
            if (typeof showSettingsModal === 'function') {
                showSettingsModal();
            } else {
                openSettingsModal();
            }
        }
    }

    btn.addEventListener('mousedown',  onPointerDown);
    btn.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('mousemove',  onPointerMove);
    document.addEventListener('touchmove',  onPointerMove, { passive: false });
    document.addEventListener('mouseup',    onPointerUp);
    document.addEventListener('touchend',   onPointerUp);

    // hover 效果（非拖拽时）
    btn.addEventListener('mouseenter', function() {
        if (!dragging) {
            btn.style.background = '#373e47';
            btn.style.boxShadow = '0 6px 24px rgba(0,0,0,0.6)';
        }
    });
    btn.addEventListener('mouseleave', function() {
        if (!dragging) {
            btn.style.background = '#2d333b';
            btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.45)';
        }
    });

    // ── 设置面板内容 ──
    window.openSettingsModal = function() {
        var content = `
            <div class="modal-header">⚙️ 游戏设置</div>
            <div style="padding:6px 0;">

                <!-- 统计数据 -->
                <div style="margin-bottom:14px;">
                    <h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">📊 统计数据</h3>
                    <div style="background:#21262d;padding:12px 15px;border-radius:8px;font-size:13px;
                                display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <div>总收获：<strong style="color:#46d164;">${gameState.totalHarvests}</strong></div>
                        <div>总探索：<strong style="color:#58a6ff;">${gameState.totalExplorations}</strong></div>
                        <div>繁殖数：<strong style="color:#f0c53d;">${gameState.monstersBreed}</strong></div>
                        <div>怪兽数：<strong style="color:#e6edf3;">${gameState.monsters.length}</strong></div>
                    </div>
                </div>

                <!-- 快捷键 -->
                <div style="margin-bottom:14px;">
                    <h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">⌨️ 快捷键</h3>
                    <div style="background:#21262d;padding:12px 15px;border-radius:8px;font-size:12px;
                                color:#8b949e;display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                        <div><kbd style="background:#30363d;padding:1px 5px;border-radius:3px;">1~5</kbd> 切换标签页</div>
                        <div><kbd style="background:#30363d;padding:1px 5px;border-radius:3px;">Ctrl+S</kbd> 手动保存</div>
                        <div><kbd style="background:#30363d;padding:1px 5px;border-radius:3px;">Esc</kbd> 关闭弹窗</div>
                    </div>
                </div>
            </div>

            <div class="modal-buttons">
                <button class="btn btn-info" style="background:#1f6feb;border-color:#1f6feb;"
                        onclick="closeModal(); showTextTutorial();">
                    📖 游戏教程
                </button>
                <button class="btn btn-success"
                        onclick="autoSave(); showNotification('保存成功！','success'); closeModal();">
                    💾 手动保存
                </button>
                <button class="btn btn-danger" onclick="resetGame()">
                    🗑 重置游戏
                </button>
                <button class="btn btn-primary" onclick="closeModal()">关闭</button>
            </div>
        `;
        showModal(content);
    };

    // ── 文字版游戏教程 ──
    window.showTextTutorial = function() {
        var pages = [
            {
                title: '🎮 怪兽农场 · 新手教程（1/5）',
                content: `
                    <h3 style="color:#58a6ff;margin-bottom:10px;">🌟 游戏目标</h3>
                    <p>通过<strong>探索</strong>捕获野生怪兽，让怪兽帮你经营农场，实现全自动化生产！</p>
                    <hr style="border-color:#30363d;margin:12px 0;">
                    <h3 style="color:#f0c53d;margin-bottom:8px;">📦 资源说明</h3>
                    <ul style="line-height:2;font-size:13px;padding-left:18px;">
                        <li><strong style="color:#f0c53d;">💰 金币</strong> — 通用货币，收获作物、出售怪兽获得</li>
                        <li><strong style="color:#46d164;">🍎 食物</strong> — 收获作物获得，用于怪兽繁殖</li>
                        <li><strong style="color:#8b949e;">🪨 材料</strong> — 探索获得，用于解锁地块和科技</li>
                        <li><strong style="color:#58a6ff;">🔬 研究点</strong> — 探索和收获获得，用于解锁科技</li>
                        <li><strong style="color:#f0883e;">⚡ 能量</strong> — 手动探索消耗，每10秒自动恢复1点</li>
                    </ul>`
            },
            {
                title: '🗺 怪兽农场 · 新手教程（2/5）',
                content: `
                    <h3 style="color:#58a6ff;margin-bottom:10px;">🗺 探索系统</h3>
                    <p style="margin-bottom:8px;">点击顶部 <strong>🗺 探索</strong> 标签进入探索界面。</p>
                    <ul style="line-height:1.9;font-size:13px;padding-left:18px;">
                        <li>每个区域有 <strong style="color:#f0883e;">能量消耗</strong>，手动点击推进进度</li>
                        <li>进度达到 <strong style="color:#f0c53d;">100%</strong> 后自动结算，获得资源并有机会捕获怪兽</li>
                        <li>捕获的怪兽会加入你的 <strong style="color:#58a6ff;">怪兽团队</strong>（右侧面板）</li>
                        <li>也可以派怪兽前往区域 <strong style="color:#46d164;">自动探索</strong>，无需消耗能量</li>
                    </ul>
                    <hr style="border-color:#30363d;margin:10px 0;">
                    <p style="font-size:12px;color:#8b949e;">💡 满足解锁条件后，更多高级区域将陆续开放，有稀有怪兽出没！</p>`
            },
            {
                title: '🌾 怪兽农场 · 新手教程（3/5）',
                content: `
                    <h3 style="color:#46d164;margin-bottom:10px;">🌾 农场系统</h3>
                    <p style="margin-bottom:8px;">点击顶部 <strong>🌾 农场</strong> 标签进入农场界面。</p>
                    <h4 style="color:#8b949e;margin:8px 0;">地块状态：</h4>
                    <ul style="line-height:1.9;font-size:13px;padding-left:18px;">
                        <li>⬛ <strong>空地</strong> — 点击选择作物并种植</li>
                        <li>🟡 <strong>生长中</strong> — 等待进度条满 100%</li>
                        <li>🟢 <strong>可收获</strong> — 点击手动收获，获得食物和金币</li>
                    </ul>
                    <hr style="border-color:#30363d;margin:10px 0;">
                    <h4 style="color:#58a6ff;margin-bottom:6px;">💡 派遣怪兽驻守地块后：</h4>
                    <ul style="line-height:1.9;font-size:13px;padding-left:18px;">
                        <li>怪兽会 <strong style="color:#46d164;">自动种植+自动收获</strong>，无需玩家操作</li>
                        <li>每种怪兽有专长作物，带来 <strong style="color:#f0c53d;">额外速度和优质率加成</strong></li>
                    </ul>`
            },
            {
                title: '💕 怪兽农场 · 新手教程（4/5）',
                content: `
                    <h3 style="color:#e91e63;margin-bottom:10px;">💕 繁殖系统</h3>
                    <p style="margin-bottom:8px;">解锁 <strong style="color:#58a6ff;">繁殖技术</strong> 科技后，可在「繁殖」标签进行配对。</p>
                    <ul style="line-height:1.9;font-size:13px;padding-left:18px;">
                        <li>选择两只怪兽配对，后代会继承双亲属性的 <strong>平均值</strong></li>
                        <li>后代有几率获得 <strong style="color:#f0c53d;">特殊特性</strong>（如「农夫」「幸运」等）</li>
                        <li>繁殖消耗食物，世代越高的后代 <strong style="color:#46d164;">属性越强</strong></li>
                    </ul>
                    <hr style="border-color:#30363d;margin:10px 0;">
                    <h3 style="color:#58a6ff;margin-bottom:8px;">🔬 科技树</h3>
                    <ul style="line-height:1.9;font-size:13px;padding-left:18px;">
                        <li>消耗研究点和金币/材料解锁科技</li>
                        <li>科技效果包括：<strong>提升产量、加速生长、解锁高级作物、解锁繁殖</strong>等</li>
                        <li>「农场扩建」科技可额外解锁3块农田</li>
                    </ul>`
            },
            {
                title: '⚡ 怪兽农场 · 新手教程（5/5）',
                content: `
                    <h3 style="color:#f0c53d;margin-bottom:10px;">⚡ 进阶技巧</h3>
                    <ul style="line-height:2;font-size:13px;padding-left:18px;">
                        <li>🎯 优先派怪兽驻守农田，实现 <strong style="color:#46d164;">全自动收益</strong></li>
                        <li>🌟 每种怪兽有专长作物，搭配好可获得 <strong style="color:#f0c53d;">25% 速度加成</strong></li>
                        <li>🔄 定期检查各区域解锁条件，探索更多区域获取 <strong>稀有怪兽</strong></li>
                        <li>♻️ 多余的怪兽可在「处理」标签 <strong>出售、研究或放生</strong> 换取资源</li>
                        <li>💾 游戏每30秒自动保存，也可用左侧「手动存档」随时保存</li>
                    </ul>
                    <hr style="border-color:#30363d;margin:12px 0;">
                    <div style="text-align:center;padding:8px 0;font-size:14px;color:#46d164;">
                        🎉 祝你农场大丰收，捕获所有稀有怪兽！
                    </div>`
            }
        ];

        // 使用全局变量确保 onclick 字符串能访问
        window._tutPages = pages;
        window._tutPage  = 0;

        window._tutRender = function() {
            var idx  = window._tutPage;
            var p    = window._tutPages[idx];
            var last = window._tutPages.length - 1;
            showModal(
                '<div class="modal-header" style="font-size:14px;">' + p.title + '</div>' +
                '<div style="font-size:13px;line-height:1.7;color:#c9d1d9;max-height:58vh;overflow-y:auto;padding:4px 2px;">' +
                    p.content +
                '</div>' +
                '<div class="modal-buttons" style="justify-content:space-between;">' +
                    '<div>' +
                        (idx > 0
                            ? '<button class="btn btn-primary" onclick="window._tutPage--;window._tutRender();">← 上一页</button>'
                            : '<span></span>') +
                    '</div>' +
                    '<div style="display:flex;gap:8px;align-items:center;">' +
                        '<span style="font-size:12px;color:#8b949e;">' + (idx+1) + ' / ' + window._tutPages.length + '</span>' +
                        (idx < last
                            ? '<button class="btn btn-success" onclick="window._tutPage++;window._tutRender();">下一页 →</button>'
                            : '<button class="btn btn-success" onclick="closeModal()">✓ 完成</button>') +
                    '</div>' +
                '</div>'
            );
        };

        window._tutRender();
    };

})();

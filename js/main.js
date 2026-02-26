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
    monstersBreed: 0
};

// ==================== 常量定义 ====================
var monsterTypes = {
    slime: { name: '史莱姆', color: '#4caf50', baseStats: { strength: 3, agility: 2, intelligence: 1, farming: 4 } },
    goblin: { name: '哥布林', color: '#ff9800', baseStats: { strength: 4, agility: 3, intelligence: 2, farming: 2 } },
    sprite: { name: '精灵', color: '#2196f3', baseStats: { strength: 1, agility: 4, intelligence: 5, farming: 3 } },
    golem: { name: '石像鬼', color: '#795548', baseStats: { strength: 5, agility: 1, intelligence: 1, farming: 3 } },
    wisp: { name: '幽灵', color: '#9c27b0', baseStats: { strength: 2, agility: 5, intelligence: 4, farming: 1 } }
};

var cropTypes = [
    { id: 'wheat', name: '小麦', growTime: 15000, yield: 5, value: 8, requiredTech: null },
    { id: 'corn', name: '玉米', growTime: 25000, yield: 8, value: 15, requiredTech: null },
    { id: 'potato', name: '土豆', growTime: 20000, yield: 10, value: 10, requiredTech: null },
    { id: 'berry', name: '浆果', growTime: 30000, yield: 12, value: 25, requiredTech: 'advancedFarming' }
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
            growthBonus: 1
        });
    }
    
    // 初始化科技
    Object.keys(technologies).forEach(function(key) {
        gameState.technologies[key] = false;
    });
    
    // 创建初始怪兽
    createMonster('slime');
    
    // 初始化UI
    initUI();
    
    renderAll();
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
        localStorage.removeItem('monsterFarm_v1');
        location.reload();
    }
}

// ==================== 全局事件与定时器 ====================
// 能量恢复
setInterval(function() {
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 1);
        updateResources();
    }
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

// 添加设置按钮
var settingsButton = document.createElement('div');
settingsButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    padding: 12px;
    border-radius: 50%;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    cursor: pointer;
    z-index: 999;
    transition: all 0.3s;
`;
settingsButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m8.66-7.5l-5.2 3m-5.2 3l-5.2-3M1.34 16.5l5.2-3m5.2-3l5.2-3"></path>
    </svg>
`;

settingsButton.addEventListener('click', function() {
    var modalContent = `
        <div class="modal-header">游戏设置</div>
        <div style="padding: 10px 0;">
            <div style="margin-bottom: 15px;">
                <h3 style="margin-bottom: 10px;">统计数据</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 13px;">
                    <div>总收获次数: ${gameState.totalHarvests}</div>
                    <div>总探索次数: ${gameState.totalExplorations}</div>
                    <div>繁殖怪兽数: ${gameState.monstersBreed}</div>
                    <div>拥有怪兽数: ${gameState.monsters.length}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3 style="margin-bottom: 10px;">快捷键</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 12px;">
                    <div>1-6: 切换标签页</div>
                    <div>Ctrl/Cmd + S: 手动保存</div>
                    <div>Esc: 关闭弹窗</div>
                </div>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="btn btn-success" onclick="autoSave(); showNotification('保存成功！', 'success'); closeModal();">
                手动保存
            </button>
            <button class="btn btn-danger" onclick="resetGame()">
                重置游戏
            </button>
            <button class="btn btn-primary" onclick="closeModal()">
                关闭
            </button>
        </div>
    `;
    
    showModal(modalContent);
});

settingsButton.addEventListener('mouseenter', function() {
    settingsButton.style.transform = 'scale(1.1) rotate(45deg)';
});

settingsButton.addEventListener('mouseleave', function() {
    settingsButton.style.transform = 'scale(1) rotate(0deg)';
});

document.body.appendChild(settingsButton);
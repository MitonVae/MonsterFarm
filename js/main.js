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
// 所有游戏配置数据（cropTypes/monsterTypes/explorationZones/technologies/allTraits/gameStages/achievements）
// 现已统一由 js/gamedata.js 提供，如需修改配置参数请到 gamedata.js 中编辑。

var randomEvents = {
    farming: [
        {
            get title() { return T('farming_rain_title','events'); },
            get desc()  { return T('farming_rain_desc','events'); },
            choices: [
                { get text() { return T('farming_rain_choice','events'); }, effect: function() {
                    gameState.plots.forEach(function(plot) {
                        if (plot.crop) plot.growthBonus = 1.5;
                    });
                    setTimeout(function() {
                        gameState.plots.forEach(function(plot) { plot.growthBonus = 1; });
                    }, 30000);
                    showNotification(T('farming_rain_effect','events'), 'success');
                }}
            ]
        },
        {
            get title() { return T('farming_pest_title','events'); },
            get desc()  { return T('farming_pest_desc','events'); },
            choices: [
                { 
                    get text() { return T('farming_pest_choice1','events'); },
                    cost: { food: 20 },
                    effect: function() { showNotification(T('farming_pest_effect1','events'), 'success'); }
                },
                { 
                    get text() { return T('farming_pest_choice2','events'); },
                    effect: function() {
                        var plot = gameState.plots.find(function(p) { return p.crop; });
                        if (plot) {
                            plot.progress = Math.max(0, plot.progress - 30);
                            showNotification(T('farming_pest_effect2','events'), 'error');
                        }
                    }
                }
            ]
        },
        {
            get title() { return T('farming_wind_title','events'); },
            get desc()  { return T('farming_wind_desc','events'); },
            choices: [
                { get text() { return T('farming_wind_choice','events'); }, effect: function() {
                    var gain = Math.floor(Math.random() * 20) + 10;
                    gameState.materials += gain;
                    updateResources();
                    showNotification(T('farming_wind_effect','events').replace('{n}', gain), 'success');
                }}
            ]
        }
    ],
    exploration: [
        {
            get title() { return T('explore_merchant_title','events'); },
            get desc()  { return T('explore_merchant_desc','events'); },
            choices: [
                { 
                    get text() { return T('explore_merchant_choice1','events'); },
                    cost: { materials: 50 },
                    effect: function() {
                        gameState.coins += 150;
                        updateResources();
                        showNotification(T('explore_merchant_effect','events'), 'success');
                    }
                },
                { get text() { return T('explore_merchant_choice2','events'); }, effect: function() {} }
            ]
        },
        {
            get title() { return T('explore_monster_title','events'); },
            get desc()  { return T('explore_monster_desc','events'); },
            choices: [
                { 
                    get text() { return T('explore_monster_choice1','events'); },
                    effect: function() {
                        if (Math.random() > 0.5) {
                            var types = Object.keys(monsterTypes);
                            var type = types[Math.floor(Math.random() * types.length)];
                            createMonster(type);
                            showNotification(T('explore_monster_success','events'), 'success');
                        } else {
                            gameState.energy = Math.max(0, gameState.energy - 20);
                            updateResources();
                            showNotification(T('explore_monster_fail','events'), 'error');
                        }
                    }
                },
                { get text() { return T('explore_monster_choice2','events'); }, effect: function() {} }
            ]
        },
        {
            get title() { return T('explore_treasure_title','events'); },
            get desc()  { return T('explore_treasure_desc','events'); },
            choices: [
                { get text() { return T('explore_treasure_choice','events'); }, effect: function() {
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
                    showNotification(T('explore_treasure_effect','events').replace('{reward}', JSON.stringify(reward)), 'success');
                }}
            ]
        }
    ],
    general: [
        {
            get title() { return T('general_windfall_title','events'); },
            get desc()  { return T('general_windfall_desc','events'); },
            choices: [
                { get text() { return T('general_windfall_choice','events'); }, effect: function() {
                    gameState.coins += 50;
                    updateResources();
                    showNotification(T('general_windfall_effect','events'), 'success');
                }}
            ]
        }
    ]
};

// ==================== 核心功能函数 ====================
function initGame() {
    // 仅在没有存档地块时创建初始地块（避免覆盖 loadGame 恢复的地块）
    if (gameState.plots.length === 0) {
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
    }
    
    // 初始化科技
    Object.keys(technologies).forEach(function(key) {
        gameState.technologies[key] = false;
    });
    
    // 初始化UI
    initUI();

    renderAll();

    // 启动教学引导（新存档才触发，需等早期提示弹窗关闭后再启动）
    if (!checkTutorialDone()) {
        // 标记教程待启动，由 showEarlyAccessNotice 关闭时触发
        window._pendingTutorial = true;
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
    // 使用 gamedata.js 中的扩展特性库
    var pool = (typeof allTraits !== 'undefined') ? allTraits : [
        { id: 'fast', name: '敏捷', rarity:'common', effect: { agility: 1 } },
        { id: 'strong', name: '强壮', rarity:'common', effect: { strength: 1 } },
        { id: 'farmer', name: '农夫', rarity:'common', effect: { farming: 2 } }
    ];
    // 按稀有度加权抽取
    var rarityWeight = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
    var weightedPool = [];
    pool.forEach(function(t) {
        var w = rarityWeight[t.rarity] || 30;
        for (var i = 0; i < w; i++) weightedPool.push(t);
    });
    
    var numTraits = Math.random() < 0.3 ? 2 : 1;
    var traits = [];
    for (var i = 0; i < numTraits; i++) {
        var trait = weightedPool[Math.floor(Math.random() * weightedPool.length)];
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
    // 序列化 zoneStates，过滤掉无法序列化的 autoTimerId（定时器句柄）
    var zoneStatesData = {};
    Object.keys(gameState.zoneStates || {}).forEach(function(zid) {
        var zs = gameState.zoneStates[zid];
        zoneStatesData[zid] = {
            progress:           zs.progress || 0,
            assignedMonsterIds: (zs.assignedMonsterIds || []).slice(),
            unlocked:           !!zs.unlocked
            // autoTimerId 是运行时句柄，不保存
        };
    });

    var saveData = {
        savedAt: new Date().toISOString(),
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
            return { ...p };
        }),
        totalHarvests: gameState.totalHarvests,
        totalExplorations: gameState.totalExplorations,
        monstersBreed: gameState.monstersBreed,
        nextMonsterId: gameState.nextMonsterId,
        // ── 探索系统状态 ──
        zoneStates:     zoneStatesData,
        purchasedZones: Object.assign({}, gameState.purchasedZones || {}),
        expeditions:    JSON.parse(JSON.stringify(gameState.expeditions || []))
    };
    
    localStorage.setItem('monsterFarm_v1', JSON.stringify(saveData));
    // 登录状态下触发云端同步（节流3秒）
    if (typeof triggerCloudSync === 'function') triggerCloudSync();
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
            gameState.plots = saveData.plots || [];
            gameState.technologies = saveData.technologies || {};
            gameState.totalHarvests = saveData.totalHarvests || 0;
            gameState.totalExplorations = saveData.totalExplorations || 0;
            gameState.monstersBreed = saveData.monstersBreed || 0;
            gameState.nextMonsterId = saveData.nextMonsterId || 1;

            // ── 恢复探索系统状态 ──
            gameState.purchasedZones = saveData.purchasedZones || {};
            gameState.expeditions    = saveData.expeditions    || [];
            // zoneStates：恢复进度和派遣列表，autoTimerId 留空（重启后由 renderExploration 重启定时器）
            var savedZS = saveData.zoneStates || {};
            gameState.zoneStates = {};
            Object.keys(savedZS).forEach(function(zid) {
                var zs = savedZS[zid];
                gameState.zoneStates[zid] = {
                    progress:           zs.progress || 0,
                    assignedMonsterIds: zs.assignedMonsterIds || [],
                    unlocked:           !!zs.unlocked,
                    autoTimerId:        null   // 定时器在 renderExploration 时重启
                };
            });
            
            Object.keys(technologies).forEach(function(key) {
                if (!(key in gameState.technologies)) {
                    gameState.technologies[key] = false;
                }
            });
            
            // 加载成功静默（简报系统和设置面板已有反馈）
        } catch (e) {
            console.error('加载存档失败:', e);
            showNotification('加载存档失败，开始新游戏', 'warning');
        }
    }
}

function resetGame() {
    showConfirmModal({
        title: '⚠️ 确认重置游戏',
        content: '这将 <strong style="color:#f85149;">清除所有存档数据</strong>，包括：<br>' +
            '• 所有资源、怪兽、科技<br>' +
            '• 探索进度和农场地块<br>' +
            '• 所有统计数据<br><br>' +
            '<strong style="color:#f0c53d;">此操作不可撤销！</strong>',
        confirmText: '💣 确认重置',
        confirmClass: 'btn-danger',
        onConfirm: function() {
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
        }  // end onConfirm
    }); // end showConfirmModal
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
    // 如果有弹窗打开，屏蔽页签切换快捷键（避免输入数字时误触）
    var modalOpen = document.getElementById('modal') && document.getElementById('modal').classList.contains('active');

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        autoSave();
        showNotification('💾 游戏已保存！', 'success');
    }
    
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // 有弹窗时不响应数字快捷键
    if (modalOpen) return;

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
        var newBottom = Math.max(8, Math.min(window.innerHeight - 56, origBottom - dy));
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

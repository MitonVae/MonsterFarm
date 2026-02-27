// ==================== UI 渲染与交互模块 ====================

// 全局渲染入口
window.renderAll = function() {
    updateResources();
    renderFarm();
    renderMonsters();
    renderExploration();
    renderBreeding();
    renderTech();
    renderDisposal();
    renderMonsterSidebar();
    renderFarmSummary();
};

// 初始化界面
function initUI() {
    // 设置游戏标题
    var gameTitle = document.getElementById('gameTitle');
    if (gameTitle) {
        gameTitle.innerHTML = '<span style="display: inline-block; vertical-align: middle; margin-right: 10px;">' + 
                             createSVG('factory', 32) + '</span>怪兽农场';
    }
    
    // 初始化资源显示
    renderResourceCards();
}

// 渲染资源卡片
function renderResourceCards() {
    var resourcesContainer = document.getElementById('resources');
    if (!resourcesContainer) return;
    
    var resources = [
        { key: 'coins', label: T('coins', 'resources'), value: gameState.coins, icon: 'coin' },
        { key: 'food', label: T('food', 'resources'), value: gameState.food, icon: 'food' },
        { key: 'materials', label: T('materials', 'resources'), value: gameState.materials, icon: 'material' },
        { key: 'research', label: T('research', 'resources'), value: gameState.research, icon: 'research' },
        { key: 'energy', label: T('energy', 'resources'), value: gameState.energy + '/' + gameState.maxEnergy, icon: 'energy' },
        { key: 'land', label: T('land', 'resources'), value: gameState.plots.filter(function(p) { return !p.locked; }).length + '/' + gameState.plots.length, icon: 'land' }
    ];
    
    resourcesContainer.innerHTML = resources.map(function(res) {
        return `
            <div class="resource">
                <div class="resource-label">
                    <span style="display: inline-block; vertical-align: middle; margin-right: 5px;">${createSVG(res.icon, 20)}</span>
                    ${res.label}
                </div>
                <div class="resource-value" id="res-${res.key}">${res.value}</div>
            </div>
        `;
    }).join('');
}

// 更新资源显示 (侧边栏和顶部资源)
window.updateResources = function() {
    // 更新顶部资源（如果存在）
    var coinsEl = document.getElementById('res-coins');
    if (coinsEl) coinsEl.innerText = gameState.coins;
    
    var researchEl = document.getElementById('res-research');
    if (researchEl) researchEl.innerText = gameState.research;
    
    var landEl = document.getElementById('res-land');
    if (landEl) {
        var unlocked = gameState.plots.filter(function(p) { return !p.locked; }).length;
        landEl.innerText = unlocked + '/' + gameState.plots.length;
    }
    
    var foodEl = document.getElementById('res-food');
    if (foodEl) foodEl.innerText = gameState.food;
    
    var materialsEl = document.getElementById('res-materials');
    if (materialsEl) materialsEl.innerText = gameState.materials;
    
    var energyEl = document.getElementById('res-energy');
    if (energyEl) energyEl.innerText = gameState.energy + '/' + gameState.maxEnergy;
    
    // 更新侧边栏资源
    updateSidebarResources();
    // 更新侧边栏怪兽列表
    renderSidebarMonsters();
    // 同步刷新已展开的资源详情面板
    if (typeof refreshOpenResourceDetail === 'function') refreshOpenResourceDetail();
};

// 更新侧边栏资源显示
function updateSidebarResources() {
    var resources = [
        { id: 'coins', value: gameState.coins, icon: 'coin' },
        { id: 'food', value: gameState.food, icon: 'food' },
        { id: 'materials', value: gameState.materials, icon: 'material' },
        { id: 'research', value: gameState.research, icon: 'research' },
        { id: 'energy', value: gameState.energy + '/' + gameState.maxEnergy, icon: 'energy' }
    ];
    
    resources.forEach(function(res) {
        var iconEl = document.getElementById(res.id + 'Icon');
        var valueEl = document.getElementById(res.id);
        if (iconEl) iconEl.innerHTML = createSVG(res.icon, 20);
        if (valueEl) valueEl.innerText = res.value;
    });

    // 同步移动端顶部资源条（含速率显示）
    _updateMobTopbar();
}

// 格式化大数字（移动端紧凑显示）
function _fmtMobNum(n) {
    n = Math.floor(n);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

// 更新移动端顶部资源栏（包含速率 + 徽章）
function _updateMobTopbar() {
    // 图标（只在首次渲染时重绘，避免频繁 DOM 操作）
    var icons = [
        { id: 'mobCoinsIcon', key: 'coin' },
        { id: 'mobFoodIcon', key: 'food' },
        { id: 'mobMaterialsIcon', key: 'material' },
        { id: 'mobEnergyIcon', key: 'energy' }
    ];
    icons.forEach(function(ic) {
        var el = document.getElementById(ic.id);
        if (el && !el._iconSet) { el.innerHTML = createSVG(ic.key, 13); el._iconSet = true; }
    });

    // 资源值
    var el;
    el = document.getElementById('mob-coins'); if (el) el.textContent = _fmtMobNum(gameState.coins);
    el = document.getElementById('mob-food'); if (el) el.textContent = _fmtMobNum(gameState.food);
    el = document.getElementById('mob-materials'); if (el) el.textContent = _fmtMobNum(gameState.materials);
    el = document.getElementById('mob-energy'); if (el) el.textContent = gameState.energy + '/' + gameState.maxEnergy;

    // 资源速率（从 resource-detail 模块读取，若不可用则隐藏）
    function _setRate(elId, perMin) {
        var rateEl = document.getElementById(elId);
        if (!rateEl) return;
        if (perMin === undefined || perMin === null) { rateEl.textContent = ''; return; }
        var sign = perMin >= 0 ? '+' : '';
        rateEl.textContent = sign + _fmtMobNum(perMin) + '/m';
        rateEl.className = 'mob-res-rate ' + (perMin > 0 ? 'pos' : perMin < 0 ? 'neg' : '');
    }
    // 尝试从 getResourceRates 获取速率（如该函数存在）
    if (typeof getResourceRates === 'function') {
        var rates = getResourceRates();
        _setRate('mob-coins-rate', rates.coins);
        _setRate('mob-food-rate', rates.food);
        _setRate('mob-materials-rate', rates.materials);
        _setRate('mob-energy-rate', null); // 能量不显示速率
    } else {
        // 降级：不显示速率
        ['mob-coins-rate','mob-food-rate','mob-materials-rate','mob-energy-rate'].forEach(function(id) {
            var e = document.getElementById(id); if (e) e.textContent = '';
        });
    }

    // 怪兽数量徽章
    var monsterCountEl = document.getElementById('mob-monster-count');
    if (monsterCountEl && gameState.monsters) {
        monsterCountEl.textContent = gameState.monsters.length;
    }

    // 农场状态徽章（显示已种植/总数）
    var farmStatusEl = document.getElementById('mob-farm-status');
    if (farmStatusEl && gameState.plots) {
        var planted = gameState.plots.filter(function(p) { return p.crop && !p.locked; }).length;
        var unlocked = gameState.plots.filter(function(p) { return !p.locked; }).length;
        var ready = gameState.plots.filter(function(p) { return p.progress >= 100 && p.crop; }).length;
        if (ready > 0) {
            farmStatusEl.textContent = '✓' + ready + '可收';
            farmStatusEl.parentElement.style.color = '#46d164';
        } else {
            farmStatusEl.textContent = planted + '/' + unlocked + '种';
            farmStatusEl.parentElement.style.color = '';
        }
    }
}

// 渲染侧边栏怪兽列表
function renderSidebarMonsters() {
    var sidebarMonstersEl = document.getElementById('sidebarMonsters');
    if (!sidebarMonstersEl) return;
    
    if (gameState.monsters.length === 0) {
        sidebarMonstersEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #8b949e; font-size: 12px;">' + T('noMonsters', 'ui') + '</div>';
        return;
    }
    
    // 只显示前6只怪兽，避免侧边栏过长
    var displayMonsters = gameState.monsters.slice(0, 6);
    
    sidebarMonstersEl.innerHTML = displayMonsters.map(function(monster) {
        var isSelected = gameState.selectedMonster === monster.id;
        var isWorking = monster.status !== 'idle';
        var statusText = getStatusText(monster.status);
        
        return `
            <div class="sidebar-monster ${isSelected ? 'selected' : ''}" 
                 onclick="showMonsterDetailModal(${monster.id});" 
                 oncontextmenu="selectMonster(${monster.id}); return false;">
                <div class="sidebar-monster-icon">
                    ${createSVG(monster.type, 28)}
                </div>
                <div class="sidebar-monster-info">
                    <div class="sidebar-monster-name">${monster.name}</div>
                    <div class="sidebar-monster-status">
                        ${isWorking ? statusText : 'Lv.' + monster.level + ' · ' + T('idle', 'monsterStatus')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 如果有更多怪兽，显示提示
    if (gameState.monsters.length > 6) {
        sidebarMonstersEl.innerHTML += `
            <div style="text-align: center; padding: 10px; color: #8b949e; font-size: 11px; 
                        border-top: 1px solid #30363d; margin-top: 8px;">
                ${T('moreMonsters','ui').replace('{n}', gameState.monsters.length - 6)}
            </div>
        `;
    }
}

// 渲染农场（调用farm.js中的renderFarm，但renderFarm本身已定义为全局，这里直接调用）
window.renderFarm = function() {
    var farmGrid = document.getElementById('farmGrid');
    if (!farmGrid) return;
    
    farmGrid.innerHTML = gameState.plots.map(function(plot) {
        if (plot.locked) {
            return `
                <div class="plot locked" id="plot-${plot.id}" data-plot-id="${plot.id}" onclick="unlockPlot(${plot.id})">
                    ${createSVG('lock', 48)}
                    <div class="plot-text">
                        ${T('unlockNeeds','farm')}<br>
                        <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('coin', 12)}</span>${plot.unlockCost.coins}<br>
                        <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('material', 12)}</span>${plot.unlockCost.materials}
                    </div>
                </div>
            `;
        }
        
        if (plot.crop) {
            var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
            var isReady = plot.progress >= 100;
            var hasMonster = !!plot.assignedMonster;
            var monsterBadge = hasMonster
                ? `<div style="position:absolute;top:4px;right:4px;background:#1a3a2a;border:1px solid #46d164;border-radius:12px;padding:2px 6px;font-size:12px;display:flex;align-items:center;gap:3px;">
                       ${createSVG(plot.assignedMonster.type, 14)}<span style="color:#46d164;">自动</span>
                   </div>`
                : '';
            var autoCropBadge = plot.autoCrop && hasMonster
                ? `<div style="font-size:12px;color:#f0c53d;margin-top:2px;">▶ ${cropTypes.find(function(c){return c.id===plot.autoCrop;}).name}</div>`
                : '';
            var statusText = isReady
                ? (hasMonster ? '自动收获中...' : '点击收获')
                : cropType.name;
            
            return `
                <div class="plot planted ${isReady ? 'ready' : ''}" 
                     id="plot-${plot.id}" data-plot-id="${plot.id}"
                     onclick="handlePlotClick(${plot.id})"
                     style="position:relative;${isReady ? 'animation: pulse 1s infinite;' : ''}">
                    ${monsterBadge}
                    ${createSVG('plant', 40)}
                    <div class="plot-text">${statusText}${autoCropBadge}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${plot.progress}%"></div>
                    </div>
                </div>
            `;
        }
        
        var emptyMonster = plot.assignedMonster;
        return `
            <div class="plot" id="plot-${plot.id}" data-plot-id="${plot.id}"
                 onclick="handlePlotClick(${plot.id})"
                 style="position:relative;">
                ${emptyMonster ? `<div style="position:absolute;top:4px;right:4px;background:#1a3a2a;border:1px solid #46d164;border-radius:12px;padding:2px 6px;font-size:12px;display:flex;align-items:center;gap:3px;">${createSVG(emptyMonster.type, 14)}<span style="color:#46d164;">${T('preparing','monsterStatus')}</span></div>` : ''}
                ${createSVG('add', 40)}
                <div class="plot-text">${emptyMonster ? '点击设置作物' : '点击种植'}</div>
            </div>
        `;
    }).join('');
};

// 渲染怪兽（调用monster.js中的renderMonsters）
window.renderMonsters = function() {
    var monsterGrid = document.getElementById('monsterGrid');
    if (!monsterGrid) return;
    
    if (gameState.monsters.length === 0) {
        monsterGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8b949e;">还没有怪兽，去招募一些吧！</div>';
        return;
    }
    
    monsterGrid.innerHTML = gameState.monsters.map(function(monster) {
        var typeData = monsterTypes[monster.type];
        var isSelected = gameState.selectedMonster === monster.id;
        var isWorking = monster.status !== 'idle';
        
        return `
            <div class="monster-card ${isWorking ? 'working' : ''} ${isSelected ? 'selected' : ''}" 
                 onclick="selectMonster(${monster.id})">
                <div class="monster-header">
                    <div class="monster-icon-container">
                        ${createSVG(monster.type, 48)}
                    </div>
                    <div class="monster-info">
                        <div class="monster-name">${monster.name}</div>
                        <div class="monster-type" style="background: ${typeData.color}; color: white;">
                            ${typeData.name} Gen.${monster.generation}
                        </div>
                    </div>
                </div>
                
                <div class="monster-stats">
                    <div class="stat">
                        <span class="stat-label">力量</span>
                        <span class="stat-value">${monster.stats.strength}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">敏捷</span>
                        <span class="stat-value">${monster.stats.agility}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">智力</span>
                        <span class="stat-value">${monster.stats.intelligence}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">耕作</span>
                        <span class="stat-value">${monster.stats.farming}</span>
                    </div>
                </div>
                
                <div style="margin-top: 10px; font-size: 11px;">
                    <div style="color: #8b949e; margin-bottom: 3px;">特性: ${monster.traits.map(function(t) { return t.name; }).join(', ')}</div>
                    <div style="color: #8b949e;">等级: ${monster.level} (${monster.exp}/${monster.maxExp})</div>
                    ${isWorking ? '<div style="color: #2196f3; font-weight: bold; margin-top: 5px;"><span style="display: inline-block; vertical-align: middle; margin-right: 5px;">' + createSVG('work', 14) + '</span>' + getStatusText(monster.status) + '</div>' : ''}
                </div>
                
                ${isSelected ? `
                    <div style="margin-top: 10px; display: flex; gap: 5px;">
                        <button class="btn btn-primary" style="flex:1; padding: 5px; font-size: 11px;" 
                                onclick="event.stopPropagation(); assignToFarm(${monster.id})">
                            耕作
                        </button>
                        <button class="btn btn-warning" style="flex:1; padding: 5px; font-size: 11px;" 
                                onclick="event.stopPropagation(); assignToSelling(${monster.id})">
                            售卖
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
};

// 通知
window.showNotification = function(message, type) {
    type = type || 'info';
    var notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(function() { notification.remove(); }, 300);
    }, 3000);
};

// 模态框
window.showModal = function(content) {
    var modal = document.getElementById('modal');
    var modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = content;
    modal.classList.add('active');
};

window.closeModal = function() {
    var modal = document.getElementById('modal');
    modal.classList.remove('active');
};

// 事件面板
window.showEventPanel = function(event) {
    var oldEvent = document.querySelector('.event-panel');
    if (oldEvent) oldEvent.remove();
    
    var eventPanel = document.createElement('div');
    eventPanel.className = 'event-panel';
    
    eventPanel.innerHTML = `
        <div class="event-title">${event.title}</div>
        <div class="event-desc">${event.desc}</div>
        <div class="event-choices">
            ${event.choices.map(function(choice, index) {
                var canAfford = !choice.cost || Object.keys(choice.cost).every(function(r) {
                    return gameState[r] >= choice.cost[r];
                });
                
                return `
                    <button class="btn ${index === 0 ? 'btn-primary' : 'btn-warning'}" 
                            onclick="handleEventChoice(${index}, ${JSON.stringify(event).replace(/"/g, '&quot;')})"
                            ${!canAfford ? 'disabled' : ''}>
                        ${choice.text}
                    </button>
                `;
            }).join('')}
        </div>
    `;
    
    document.body.appendChild(eventPanel);
    
    setTimeout(function() {
        if (eventPanel.parentNode) {
            eventPanel.remove();
        }
    }, 30000);
};

window.handleEventChoice = function(choiceIndex, event) {
    var choice = event.choices[choiceIndex];
    
    if (choice.cost) {
        Object.keys(choice.cost).forEach(function(resource) {
            gameState[resource] -= choice.cost[resource];
        });
    }
    
    if (choice.effect) {
        choice.effect();
    }
    
    var eventPanel = document.querySelector('.event-panel');
    if (eventPanel) eventPanel.remove();
    
    updateResources();
};

// 招募功能已替换为「探索捕获」系统
// showRecruitModal → 重定向到探索标签页，保留函数名以兼容旧存档逻辑
window.showRecruitModal = function() {
    closeModal();
    switchTab('exploration');
    showNotification('🗺 通过探索各区域来捕获野生怪兽吧！', 'info');
};

// recruitMonster 保留但禁用（探索系统替代）
window.recruitMonster = function(typeId, cost) {
    showNotification('招募功能已移除，请通过「探索」捕获怪兽！', 'info');
    switchTab('exploration');
};

// 触发随机事件（调用utils中的triggerRandomEvent，已在main中引用）
window.triggerRandomEvent = function(category) {
    var eventPool = randomEvents[category] || [];
    
    if (eventPool.length === 0) {
        eventPool = randomEvents.general;
    }
    
    var event = eventPool[Math.floor(Math.random() * eventPool.length)];
    
    showEventPanel(event);
};

// 切换标签页
window.switchTab = function(tabName) {
    // 更新桌面端标签按钮
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    // 尝试获取点击的标签，如果不存在则使用第一个匹配的标签
    var clickedTab = event && event.target ? event.target : document.querySelector('.tab[onclick*="' + tabName + '"]');
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // 更新移动端底部导航按钮
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    var mobileNavItem = document.querySelector('.bottom-nav-item[data-tab="' + tabName + '"]');
    if (mobileNavItem) {
        mobileNavItem.classList.add('active');
    }
    
    // 更新内容
    document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // 刷新对应内容
    switch(tabName) {
        case 'farm':
            renderFarm();
            break;
        case 'monsters':
            renderMonsters();
            break;
        case 'exploration':
            renderExploration();
            break;
        case 'breeding':
            renderBreeding();
            break;
        case 'tech':
            renderTech();
            break;
        case 'disposal':
            renderDisposal();
            break;
    }
    
    // 初始化移动端导航图标
    initMobileNavIcons();
};

// 初始化移动端导航图标
function initMobileNavIcons() {
    // 图标类型映射（保证移动端与PC端完全一致）
    var iconMap = {
        farm:        'plant',
        exploration: 'explore',
        monsters:    'wisp',
        breeding:    'heart',
        tech:        'research',
        disposal:    'recycle'
    };

    // 移动端底部导航图标
    Object.keys(iconMap).forEach(function(key) {
        var el = document.getElementById(key + 'NavIcon');
        if (el) el.innerHTML = createSVG(iconMap[key], 24);
    });

    // PC 端顶部 Tab 图标（排除 monsters，PC 端无此 Tab）
    var pcTabs = ['farm', 'exploration', 'breeding', 'tech', 'disposal'];
    pcTabs.forEach(function(key) {
        var el = document.getElementById(key + 'TabIcon');
        if (el) el.innerHTML = createSVG(iconMap[key], 18);
    });
}

// 侧边栏切换（用于平板端）
window.toggleSidebar = function() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
};

// autoHarvestAll 和 autoPlantAll 由 farm.js 提供，此处不重复定义

// 怪兽详情弹窗 - 独立的怪兽操作界面
window.showMonsterDetailModal = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster) return;
    
    var typeData = monsterTypes[monster.type];
    var isWorking = monster.status !== 'idle';
    var statusText = getStatusText(monster.status);
    
    var modalContent = `
        <div class="modal-header">
            ${createSVG(monster.type, 32)} ${monster.name}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div class="monster-detail-section">
                <h4>基础信息</h4>
                <div class="monster-info-text">
                    <div><strong>类型：</strong> ${typeData.name}</div>
                    <div><strong>等级：</strong> ${monster.level}</div>
                    <div><strong>世代：</strong> ${monster.generation}</div>
                    <div><strong>经验：</strong> ${monster.exp}/${monster.maxExp}</div>
                    <div><strong>状态：</strong> <span class="${isWorking ? 'status-working' : 'status-idle'}">${isWorking ? statusText : T('idle','monsterStatus')}</span></div>
                </div>
            </div>
            
            <div class="monster-detail-section">
                <h4>属性值</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div class="monster-stat-item">
                        <span>力量</span>
                        <span class="monster-stat-value">${monster.stats.strength}</span>
                    </div>
                    <div class="monster-stat-item">
                        <span>敏捷</span>
                        <span class="monster-stat-value">${monster.stats.agility}</span>
                    </div>
                    <div class="monster-stat-item">
                        <span>智力</span>
                        <span class="monster-stat-value">${monster.stats.intelligence}</span>
                    </div>
                    <div class="monster-stat-item">
                        <span>耕作</span>
                        <span class="monster-stat-value">${monster.stats.farming}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="monster-detail-section">
            <h4>特殊能力</h4>
            <div class="monster-traits">
                ${monster.traits.length > 0 ? 
                    monster.traits.map(function(trait) { 
                        return '<span class="monster-trait-tag">' + trait.name + '</span>';
                    }).join('') : 
                    '<span>无特殊能力</span>'
                }
            </div>
        </div>
        
        <div class="modal-buttons">
            ${!isWorking ? `
                <button class="btn btn-primary" onclick="closeModal(); showAssignPlotPicker(${monster.id});">
                    ${createSVG('plant', 16)} 派驻农田
                </button>
                <button class="btn btn-warning" onclick="assignMonsterToExpedition(${monster.id}); closeModal();">
                    ${createSVG('explore', 16)} 派去探索
                </button>
                <button class="btn btn-danger" onclick="selectMonster(${monster.id}); switchTab('disposal'); closeModal();">
                    ${createSVG('trash', 16)} 处理怪兽
                </button>
            ` : `
                <button class="btn btn-warning" onclick="recallMonster(${monster.id}); closeModal();">
                    ${createSVG('work', 16)} 召回怪兽
                </button>
            `}
            <button class="btn btn-success" onclick="selectMonster(${monster.id}); closeModal();">
                ${createSVG('check', 16)} 选中
            </button>
            <button class="btn btn-primary" onclick="closeModal()">
                关闭
            </button>
        </div>
    `;
    
    showModal(modalContent);
};

// 获取怪兽状态文本（已接入 i18n）
window.getStatusText = function(status) {
    return T(status, 'monsterStatus') || T('unknown', 'common');
};

// 快速操作：派遣怪兽去耕作
window.assignMonsterToFarm = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster || monster.status !== 'idle') {
        showNotification('该怪兽不可用！', 'warning');
        return;
    }
    
    // 找到空闲的农田
    var availablePlot = gameState.plots.find(function(plot) {
        return !plot.locked && plot.crop && !plot.assignedMonster && plot.progress < 100;
    });
    
    if (!availablePlot) {
        showNotification('没有需要照看的作物！', 'warning');
        return;
    }
    
    // 分配怪兽到农田
    availablePlot.assignedMonster = monster;
    monster.status = 'farming';
    monster.assignment = 'plot-' + availablePlot.id;
    
    showNotification(monster.name + ' 被派去照看农田！', 'success');
    updateResources();
    renderFarm();
};

// 快速操作：派遣怪兽去探索
window.assignMonsterToExpedition = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster || monster.status !== 'idle') {
        showNotification('该怪兽不可用！', 'warning');
        return;
    }
    
    if (!gameState.expeditions[0]) {
        gameState.expeditions[0] = { members: [], status: 'preparing' };
    }
    
    var expedition = gameState.expeditions[0];
    
    if (expedition.members.length >= 4) {
        showNotification('探险队已满！', 'warning');
        return;
    }
    
    if (expedition.status === 'exploring') {
        showNotification('探险队正在探索中！', 'warning');
        return;
    }
    
    expedition.members.push(monster);
    monster.status = 'preparing';
    
    showNotification(monster.name + ' 加入探险队！', 'success');
    renderExploration();
};

// 快速操作：召回怪兽
window.recallMonster = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster || monster.status === 'idle') return;
    
    // 从农田召回
    if (monster.status === 'farming') {
        var plot = gameState.plots.find(function(p) { 
            return p.assignedMonster && p.assignedMonster.id === monster.id; 
        });
        if (plot) {
            plot.assignedMonster = null;
        }
    }
    
    // 从探险队召回
    if (monster.status === 'preparing') {
        var expedition = gameState.expeditions[0];
        if (expedition) {
            var index = expedition.members.findIndex(function(m) { return m.id === monster.id; });
            if (index > -1) {
                expedition.members.splice(index, 1);
            }
        }
    }
    
    monster.status = 'idle';
    monster.assignment = null;
    
    showNotification(monster.name + ' 已召回！', 'success');
    updateResources();
    renderFarm();
    renderExploration();
};

// ==================== 移动端检测工具 ====================
function isMobile() {
    return window.innerWidth <= 767;
}

// ==================== 移动端资源详情面板 ====================
window.showMobileResourcePanel = function() {
    var html = '<div class="modal-header">📊 资源状况</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">';
    var list = [
        { key: 'coins',     label: '金币',   icon: 'coin',     val: gameState.coins },
        { key: 'food',      label: '食物',   icon: 'food',     val: gameState.food },
        { key: 'materials', label: '材料',   icon: 'material', val: gameState.materials },
        { key: 'research',  label: '研究点', icon: 'research', val: gameState.research },
        { key: 'energy',    label: '能量',   icon: 'energy',   val: gameState.energy + '/' + gameState.maxEnergy }
    ];
    list.forEach(function(r) {
        html += '<div style="display:flex;align-items:center;gap:10px;background:#21262d;border:1px solid #30363d;border-radius:8px;padding:10px 14px;" ' +
            'onclick="closeModal();toggleResourceDetail(\'' + r.key + '\');switchTab(\'farm\');">' +
            '<span style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;">' + createSVG(r.icon, 22) + '</span>' +
            '<span style="flex:1;font-size:14px;">' + r.label + '</span>' +
            '<span style="font-size:15px;font-weight:700;color:#58a6ff;">' + r.val + '</span>' +
            '<span style="color:#8b949e;font-size:13px;">▾</span>' +
            '</div>';
    });
    html += '</div>' +
        '<div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:16px;">点击资源可查看详细说明（在农场页面左侧栏查看）</div>' +
        '<div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">关闭</button></div>';
    showModal(html);
};

// ==================== 设置弹窗（含字体大小）====================
window.showSettingsModal = function() {
    var cur = localStorage.getItem('mf_font_size') || 'medium';
    // 使用 i18n 翻译（兼容未加载 i18n.js 的情况）
    var _t = function(k, cat) { return (typeof i18n !== 'undefined') ? i18n.t(k, cat) : k; };
    var curLang = (typeof i18n !== 'undefined') ? i18n.currentLang : 'zh';

    var sizes = [
        { key: 'small',  label: _t('fontSmall','settings'),  desc: _t('fontSmallDesc','settings') },
        { key: 'medium', label: _t('fontMedium','settings'), desc: _t('fontMediumDesc','settings') },
        { key: 'large',  label: _t('fontLarge','settings'),  desc: _t('fontLargeDesc','settings') },
        { key: 'xlarge', label: _t('fontXLarge','settings'), desc: _t('fontXLargeDesc','settings') }
    ];

    // ── 语言选项 ──
    var langs = [
        { key: 'zh', label: '中文' },
        { key: 'en', label: 'English' },
        { key: 'ja', label: '日本語' }
    ];

    var html = '<div class="modal-header">' + _t('title','settings') + '</div>' +
        '<div style="padding:4px 0;">' +

        // 统计数据
        '<div style="margin-bottom:14px;">' +
        '<h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">' + _t('stats','settings') + '</h3>' +
        '<div style="background:#21262d;padding:12px 15px;border-radius:8px;font-size:13px;' +
            'display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
        '<div>' + _t('totalHarvests','settings') + '：<strong style="color:#46d164;">' + (window.gameState ? window.gameState.totalHarvests : 0) + '</strong></div>' +
        '<div>' + _t('totalExplorations','settings') + '：<strong style="color:#58a6ff;">' + (window.gameState ? window.gameState.totalExplorations : 0) + '</strong></div>' +
        '<div>' + _t('monstersBreed','settings') + '：<strong style="color:#f0c53d;">' + (window.gameState ? (window.gameState.monstersBreed || 0) : 0) + '</strong></div>' +
        '<div>' + _t('monsterCount','settings') + '：<strong style="color:#e6edf3;">' + (window.gameState ? window.gameState.monsters.length : 0) + '</strong></div>' +
        '</div></div>' +

        // 字体大小
        '<div style="margin-bottom:14px;">' +
        '<h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">' + _t('fontSize','settings') + '</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">';
    sizes.forEach(function(s) {
        var active = cur === s.key;
        html += '<div onclick="applyFontSize(\'' + s.key + '\')" ' +
            'class="font-size-opt' + (active ? ' active' : '') + '" ' +
            'data-size="' + s.key + '">' +
            '<div class="fs-label">' + s.label + '</div>' +
            '<div class="fs-desc">' + s.desc + '</div>' +
            '</div>';
    });
    html += '</div></div>' +

        // 语言选择
        '<div style="margin-bottom:14px;">' +
        '<h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">' + _t('language','settings') + '</h3>' +
        '<div style="display:flex;gap:8px;">';
    langs.forEach(function(l) {
        var active = curLang === l.key;
        html += '<div onclick="window._settingsSetLang(\'' + l.key + '\')" ' +
            'class="lang-opt" data-lang="' + l.key + '" ' +
            'style="flex:1;padding:9px 6px;background:' + (active ? '#1a3a1a' : '#21262d') + ';border:2px solid ' + (active ? '#46d164' : '#30363d') + ';' +
            'border-radius:8px;text-align:center;cursor:pointer;transition:all 0.15s;font-size:13px;font-weight:' + (active ? '700' : '400') + ';">' +
            l.label + '</div>';
    });
    html += '</div></div>' +

        // 存档操作
        '<div style="margin-bottom:14px;">' +
        '<h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">' + _t('save','settings') + '</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        '<button class="btn btn-primary" onclick="quickSave();closeModal();">' + _t('saveBtn','settings') + '</button>' +
        '<button class="btn btn-secondary" onclick="confirmRecallAll();">' + _t('recallBtn','settings') + '</button>' +
        '<button class="btn btn-warning" style="background:#9a6700;border-color:#9a6700;" onclick="window._settingsExportSave();">' + _t('exportBtn','settings') + '</button>' +
        '<button class="btn btn-secondary" style="border-color:#58a6ff;color:#58a6ff;" onclick="window._settingsImportSave();">' + _t('importBtn','settings') + '</button>' +
        '</div></div>' +

        // 云账号
        '<div style="margin-bottom:14px;">' +
        '<h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">☁️ 云账号 & 跨设备存档</h3>' +
        '<div id="authSection">' + (typeof _buildLoggedInUI !== 'undefined' && typeof getCurrentUser === 'function' && getCurrentUser() ? '' : '') + '</div>' +
        '</div>' +

        // 快捷键
        '<div style="margin-bottom:14px;">' +
        '<h3 style="margin-bottom:8px;font-size:13px;color:#8b949e;letter-spacing:.05em;">' + _t('shortcuts','settings') + '</h3>' +
        '<div style="background:#21262d;padding:12px 15px;border-radius:8px;font-size:12px;' +
            'color:#8b949e;display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;">' +
        '<div><kbd style="background:#30363d;padding:1px 5px;border-radius:3px;">1~5</kbd> ' + _t('shortcut15','settings') + '</div>' +
        '<div><kbd style="background:#30363d;padding:1px 5px;border-radius:3px;">Ctrl+S</kbd> ' + _t('shortcutCtrlS','settings') + '</div>' +
        '<div><kbd style="background:#30363d;padding:1px 5px;border-radius:3px;">Esc</kbd> ' + _t('shortcutEsc','settings') + '</div>' +
        '</div></div>' +

        '</div>' + // end padding wrapper

        // 底部按钮行
        '<div class="modal-buttons">' +
        '<button class="btn btn-info" style="background:#1f6feb;border-color:#1f6feb;" onclick="closeModal();if(typeof showTextTutorial===\'function\')showTextTutorial();">' + _t('tutorialBtn','settings') + '</button>' +
        (function() {
            var unread = (typeof getChangelogUnread === 'function') ? getChangelogUnread() : 0;
            var dot = unread ? '<span style="display:inline-block;width:7px;height:7px;background:#f85149;border-radius:50%;margin-left:5px;vertical-align:middle;"></span>' : '';
            return '<button class="btn btn-secondary" style="border-color:#46d164;color:#46d164;" onclick="closeModal();if(typeof showChangelog===\'function\')showChangelog();">📋 更新公告' + dot + '</button>';
        })() +
        '<button class="btn btn-danger" onclick="if(typeof resetGame===\'function\')resetGame();">' + _t('resetBtn','settings') + '</button>' +
        '<button class="btn btn-primary" onclick="closeModal()">' + _t('closeBtn','settings') + '</button>' +
        '</div>' +

        // 隐藏版本号（长按2秒进入GM面板）
        '<div id="gmVersionHint" ' +
            'style="text-align:center;margin-top:8px;font-size:10px;color:#30363d;cursor:default;user-select:none;letter-spacing:0.3px;">' +
            'v0.9.3' +
        '</div>';

    showModal(html);
    // 填充账号登录区（auth.js 提供）
    setTimeout(function() {
        if (typeof refreshAuthUI === 'function') refreshAuthUI();
    }, 0);
    // 为版本号注册 GM 入口事件：
    //   · 已验证 → 单击直接打开
    //   · 未验证 → 长按2秒激活
    setTimeout(function() {
        var hint = document.getElementById('gmVersionHint');
        if (!hint) return;

        // 判断是否已通过验证（sessionStorage）
        var authed = false;
        try { authed = sessionStorage.getItem('mf_gm_auth') === '1'; } catch(e) {}

        if (authed) {
            // 已验证：直接点击/触碰打开，并更新样式提示
            hint.style.color = '#f0c53d';
            hint.style.cursor = 'pointer';
            hint.title = 'GM面板';
            function openGM(e) {
                e.stopPropagation();
                closeModal();
                if (typeof window.openGMPanel === 'function') window.openGMPanel();
            }
            hint.addEventListener('click', openGM);
            hint.addEventListener('touchend', openGM, { passive: true });
        } else {
            // 未验证：长按2秒激活
            var _pressTimer = null;
            function startPress() {
                hint.style.color = '#58a6ff';
                _pressTimer = setTimeout(function() {
                    hint.style.color = '#f0c53d';
                    setTimeout(function() {
                        closeModal();
                        if (typeof window.openGMPanel === 'function') window.openGMPanel();
                    }, 200);
                }, 2000);
            }
            function cancelPress() {
                if (_pressTimer) { clearTimeout(_pressTimer); _pressTimer = null; }
                hint.style.color = '#30363d';
            }
            hint.addEventListener('mousedown', startPress);
            hint.addEventListener('touchstart', startPress, { passive: true });
            hint.addEventListener('mouseup', cancelPress);
            hint.addEventListener('mouseleave', cancelPress);
            hint.addEventListener('touchend', cancelPress);
            hint.addEventListener('touchcancel', cancelPress);
        }
    }, 100);
};

// 切换语言并重新渲染设置面板
window._settingsSetLang = function(lang) {
    if (typeof i18n === 'undefined') return;
    i18n.setLang(lang);
    // 更新语言按钮样式（无需重开整个 modal，只更新 lang-opt 样式）
    document.querySelectorAll('.lang-opt').forEach(function(el) {
        var isActive = el.getAttribute('data-lang') === lang;
        el.style.background    = isActive ? '#1a3a1a' : '#21262d';
        el.style.borderColor   = isActive ? '#46d164' : '#30363d';
        el.style.fontWeight    = isActive ? '700' : '400';
    });
    // 重新渲染设置面板以刷新其他翻译文字
    closeModal();
    setTimeout(showSettingsModal, 80);
};

// 应用字体大小（全局 CSS 变量方案，移动端同步生效）
window.applyFontSize = function(size) {
    var sizeMap = { small: '12px', medium: '14px', large: '16px', xlarge: '18px' };
    var px = sizeMap[size] || '14px';
    // 1. 修改 CSS 自定义变量，所有使用 rem/em 的元素自动跟随
    document.documentElement.style.setProperty('--base-fs', px);
    // 2. 同步设置 html / body 字号（兜底，覆盖部分不用变量的场景）
    document.documentElement.style.fontSize = px;
    document.body.style.fontSize = px;
    // 3. 持久化
    try { localStorage.setItem('mf_font_size', size); } catch(e) {}
    // 4. 立即刷新设置面板内的字体选项按钮激活状态（无需重开面板）
    document.querySelectorAll('.font-size-opt').forEach(function(el) {
        var isActive = el.getAttribute('data-size') === size;
        if (isActive) { el.classList.add('active'); }
        else           { el.classList.remove('active'); }
    });
};

// ==================== 右侧怪兽侧边栏渲染 ====================
window.renderMonsterSidebar = function() {
    var listEl = document.getElementById('monsterSidebarList');
    var footerEl = document.getElementById('monsterSidebarFooter');
    if (!listEl) return;

    if (gameState.monsters.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:30px 15px;color:#8b949e;font-size:12px;line-height:1.8;">' +
            '<div style="font-size:32px;margin-bottom:8px;">�</div>' +
            '<div>还没有怪兽</div><div style="margin-top:4px;">前往探索区域捕获野生怪兽！</div></div>';
        if (footerEl) footerEl.innerHTML = '';
        return;
    }

    var statusLabels = {
        'idle':      [T('idle','monsterStatus'),      'msb-status-idle'],
        'farming':   [T('farming','monsterStatus'),   'msb-status-farming'],
        'exploring': [T('exploring','monsterStatus'), 'msb-status-exploring'],
        'preparing': [T('preparing','monsterStatus'), 'msb-status-exploring'],
        'breeding':  [T('breeding','monsterStatus'),  'msb-status-breeding']
    };

    listEl.innerHTML = gameState.monsters.map(function(monster) {
        var sl = statusLabels[monster.status] || ['未知', 'msb-status-idle'];
        var statusCls = monster.status || 'idle';
        var assignInfo = '';
        if (monster.status === 'farming') {
            var farmPlot = gameState.plots.find(function(p) { return p.assignedMonster && p.assignedMonster.id === monster.id; });
            if (farmPlot) assignInfo = '<div style="font-size:12px;color:#46d164;margin-top:4px;">🌱 地块 #' + (farmPlot.id + 1) + (farmPlot.autoCrop ? ' · 自动' : '') + '</div>';
        } else if (monster.status === 'exploring' || monster.status === 'preparing') {
            assignInfo = '<div style="font-size:12px;color:#f0c53d;margin-top:4px;">🗺 探索队</div>';
        }

        // 判断操作按钮
        var actionBtns = '';
        if (monster.status === 'idle') {
            actionBtns = '<button class="msb-action-btn msb-btn-detail" onclick="event.stopPropagation();showMonsterDetailModal(' + monster.id + ')">详情</button>' +
                '<button class="msb-action-btn msb-btn-assign" onclick="event.stopPropagation();closeModal&&closeModal();showAssignPlotPicker(' + monster.id + ')">派驻农田</button>';
        } else if (monster.status === 'farming') {
            var farmPlot2 = gameState.plots.find(function(p) { return p.assignedMonster && p.assignedMonster.id === monster.id; });
            var plotId = farmPlot2 ? farmPlot2.id : -1;
            actionBtns = '<button class="msb-action-btn msb-btn-detail" onclick="event.stopPropagation();showMonsterDetailModal(' + monster.id + ')">详情</button>' +
                (plotId >= 0 ? '<button class="msb-action-btn msb-btn-recall" onclick="event.stopPropagation();removeMonsterFromPlot(' + plotId + ');renderMonsterSidebar();">撤回</button>' : '');
        } else {
            actionBtns = '<button class="msb-action-btn msb-btn-detail" onclick="event.stopPropagation();showMonsterDetailModal(' + monster.id + ')">详情</button>' +
                '<button class="msb-action-btn msb-btn-recall" onclick="event.stopPropagation();recallMonster(' + monster.id + ');">召回</button>';
        }

        return '<div class="msb-monster-card ' + statusCls + '" onclick="showMonsterDetailModal(' + monster.id + ')">' +
            '<div class="msb-monster-top">' +
            '<div class="msb-monster-icon">' + createSVG(monster.type, 28) + '</div>' +
            '<div class="msb-monster-meta">' +
            '<div class="msb-monster-name">' + monster.name + '</div>' +
            '<div class="msb-monster-level">Lv.' + monster.level + ' · ' + (monsterTypes[monster.type] ? monsterTypes[monster.type].name : monster.type) + '</div>' +
            assignInfo +
            '</div>' +
            '<span class="msb-monster-status ' + sl[1] + '">' + sl[0] + '</span>' +
            '</div>' +
            '<div class="msb-monster-stats">' +
            '<div class="msb-stat"><span class="msb-stat-label">力量</span><span class="msb-stat-value">' + monster.stats.strength + '</span></div>' +
            '<div class="msb-stat"><span class="msb-stat-label">耕作</span><span class="msb-stat-value">' + monster.stats.farming + '</span></div>' +
            '<div class="msb-stat"><span class="msb-stat-label">经验</span><span class="msb-stat-value">' + monster.exp + '/' + monster.maxExp + '</span></div>' +
            '</div>' +
            '<div class="msb-monster-actions">' + actionBtns + '</div>' +
            '</div>';
    }).join('');

    // 底部统计
    var statsHtml = '';
    if (gameState.monsters.length > 0) {
        var total = gameState.monsters.length;
        var idle = gameState.monsters.filter(function(m) { return m.status === 'idle'; }).length;
        var farming = gameState.monsters.filter(function(m) { return m.status === 'farming'; }).length;
        var exploring = gameState.monsters.filter(function(m) { return m.status === 'exploring' || m.status === 'preparing'; }).length;
        statsHtml = '<div style="display:flex;justify-content:space-between;">' +
            '<span>共 <strong style="color:#e6edf3;">' + total + '</strong> 只</span>' +
            '<span style="color:#46d164;">' + T('farming','monsterStatus') + ' ' + farming + '</span>' +
            '<span style="color:#f0c53d;">' + T('exploring','monsterStatus') + ' ' + exploring + '</span>' +
            '<span style="color:#8b949e;">' + T('idle','monsterStatus') + ' ' + idle + '</span>' +
            '</div>';
    }
    if (footerEl) footerEl.innerHTML = statsHtml;

    // ── 同步移动端怪兽 tab ──
    var mobListEl = document.getElementById('mobileMonsterList');
    var mobFooterEl = document.getElementById('mobileMonsterFooter');
    if (mobListEl) mobListEl.innerHTML = listEl.innerHTML;
    if (mobFooterEl) mobFooterEl.innerHTML = statsHtml;
};

// ==================== 左侧农场概况渲染 ====================
window.renderFarmSummary = function() {
    var summaryEl = document.getElementById('farmSummary');
    if (!summaryEl) return;
    var plots = gameState.plots;
    var unlocked = plots.filter(function(p) { return !p.locked; }).length;
    var growing = plots.filter(function(p) { return p.crop && p.progress < 100; }).length;
    var ready = plots.filter(function(p) { return p.crop && p.progress >= 100; }).length;
    var auto = plots.filter(function(p) { return p.assignedMonster; }).length;
    var empty = plots.filter(function(p) { return !p.locked && !p.crop; }).length;
    summaryEl.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:6px;">' +
        '<div style="display:flex;justify-content:space-between;"><span>已解锁地块</span><strong style="color:#58a6ff;">' + unlocked + ' / ' + plots.length + '</strong></div>' +
        '<div style="display:flex;justify-content:space-between;"><span>自动化地块</span><strong style="color:#46d164;">' + auto + '</strong></div>' +
        '<div style="display:flex;justify-content:space-between;"><span>生长中</span><strong style="color:#f0c53d;">' + growing + '</strong></div>' +
        (ready > 0 ? '<div style="display:flex;justify-content:space-between;"><span>待收获 ⚡</span><strong style="color:#f85149;">' + ready + '</strong></div>' : '') +
        '<div style="display:flex;justify-content:space-between;"><span>空闲地块</span><strong style="color:#8b949e;">' + empty + '</strong></div>' +
        '</div>';
};

// ==================== 平板端右侧栏切换 ====================
window.toggleMonsterSidebar = function() {
    var sidebar = document.getElementById('monsterSidebar');
    if (sidebar) sidebar.classList.toggle('open');
};

// ==================== 移动端怪兽面板（底部弹出）====================
window.showMobileMonsterPanel = function() {
    var html = '<div class="modal-header">👾 怪兽团队</div>' +
        '<div style="margin-bottom:12px;">' +
        '<button class="btn btn-explore" style="width:100%;font-size:13px;" onclick="closeModal();switchTab(\'exploration\');">🗺 前往探索捕获怪兽</button>' +
        '</div>';

    if (gameState.monsters.length === 0) {
        html += '<div style="text-align:center;padding:30px;color:#8b949e;">还没有怪兽，前往探索区域捕获吧！</div>';
    } else {
        html += '<div style="max-height:60vh;overflow-y:auto;">';
        gameState.monsters.forEach(function(monster) {
            var statusMap = {
                idle: T('idle','monsterStatus'),
                farming: T('farming','monsterStatus'),
                exploring: T('exploring','monsterStatus'),
                preparing: T('preparing','monsterStatus')
            };
            var statusColor = { idle: '#8b949e', farming: '#46d164', exploring: '#f0c53d', preparing: '#f0c53d' };
            var st = monster.status || 'idle';
            html += '<div style="background:#21262d;border:1px solid #30363d;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;" onclick="closeModal();showMonsterDetailModal(' + monster.id + ');">' +
                '<div style="background:#0d1117;border-radius:8px;padding:4px;">' + createSVG(monster.type, 32) + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="font-weight:700;font-size:13px;">' + monster.name + '</div>' +
                '<div style="font-size:13px;color:#8b949e;">Lv.' + monster.level + ' · ' + (monsterTypes[monster.type] ? monsterTypes[monster.type].name : '') + '</div>' +
                '</div>' +
                '<span style="font-size:13px;color:' + (statusColor[st] || '#8b949e') + ';font-weight:600;">' + (statusMap[st] || st) + '</span>' +
                '</div>';
        });
        html += '</div>';
    }
    html += '<div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">关闭</button></div>';
    showModal(html);
};

// ==================== 存档导出 / 导入（设置面板）====================

window._settingsExportSave = function() {
    try {
        var data = localStorage.getItem('monsterFarmSave') || '{}';
        // 生成带时间戳的文件名
        var now = new Date();
        var ts = now.getFullYear() + '-' +
            String(now.getMonth()+1).padStart(2,'0') + '-' +
            String(now.getDate()).padStart(2,'0') + '_' +
            String(now.getHours()).padStart(2,'0') +
            String(now.getMinutes()).padStart(2,'0');
        var blob = new Blob([data], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href   = url;
        a.download = 'monsterfarm_' + ts + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
        showNotification(T('ntfExported','gm'), 'success');
    } catch(e) {
        showNotification(T('ntfExportFail','gm').replace('{err}', e.message), 'error');
    }
};

window._settingsImportSave = function() {
    // 弹出确认框，用户确认后再触发文件选择
    var _t = function(k, cat) { return (typeof i18n !== 'undefined') ? i18n.t(k, cat) : k; };
    var confirmHtml =
        '<div class="modal-header" style="color:#f0c53d;">' + _t('importConfirmTitle','settings') + '</div>' +
        '<div style="margin-bottom:18px;font-size:1rem;line-height:1.8;color:#e6edf3;">' +
            _t('importConfirmDesc','settings') +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="btn btn-primary" onclick="window._settingsDoImport();">' + _t('importConfirmOk','settings') + '</button>' +
            '<button class="btn btn-secondary" onclick="closeModal();setTimeout(showSettingsModal,80);">' + T('cancel','common') + '</button>' +
        '</div>';
    showModal(confirmHtml);
};

// 实际触发文件选择 → 读取 → 写入 localStorage → 刷新
window._settingsDoImport = function() {
    var _t = function(k, cat) { return (typeof i18n !== 'undefined') ? i18n.t(k, cat) : k; };
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', function() {
        var file = input.files[0];
        if (!file) { document.body.removeChild(input); return; }
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                // 验证 JSON 是否合法
                var parsed = JSON.parse(e.target.result);
                if (typeof parsed !== 'object' || parsed === null) throw new Error('invalid format');
                // 写入存档
                localStorage.setItem('monsterFarmSave', e.target.result);
                closeModal();
                showNotification(_t('importSuccess','settings'), 'success');
                // 短暂延迟后重载游戏以应用新存档
                setTimeout(function() { location.reload(); }, 800);
            } catch(err) {
                showNotification(_t('importFail','settings').replace('{err}', err.message), 'error');
                closeModal();
                setTimeout(showSettingsModal, 80);
            }
        };
        reader.readAsText(file);
        document.body.removeChild(input);
    });

    // 触发文件选择对话框
    input.click();
    // 关闭确认弹窗
    closeModal();
};

// 初始化UI - 在页面加载时调用
window.addEventListener('load', function() {
    // 恢复字体大小偏好
    var savedSize = localStorage.getItem('mf_font_size');
    if (savedSize) applyFontSize(savedSize);

    // 初始化移动端导航图标
    initMobileNavIcons();
    
    // 绑定侧边栏切换事件
    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // 初始化快捷操作按钮图标
    var saveIconEl = document.getElementById('quickSaveIcon');
    if (saveIconEl) saveIconEl.innerHTML = createSVG('save', 16);
    var recallIconEl = document.getElementById('recallIcon');
    if (recallIconEl) recallIconEl.innerHTML = createSVG('recall', 16);
});

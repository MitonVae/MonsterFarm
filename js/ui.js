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
        { key: 'coins', label: '金币', value: gameState.coins, icon: 'coin' },
        { key: 'food', label: '食物', value: gameState.food, icon: 'food' },
        { key: 'materials', label: '材料', value: gameState.materials, icon: 'material' },
        { key: 'research', label: '研究点', value: gameState.research, icon: 'research' },
        { key: 'energy', label: '能量', value: gameState.energy + '/' + gameState.maxEnergy, icon: 'energy' },
        { key: 'land', label: '土地', value: gameState.plots.filter(function(p) { return !p.locked; }).length + '/' + gameState.plots.length, icon: 'land' }
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
}

// 渲染侧边栏怪兽列表
function renderSidebarMonsters() {
    var sidebarMonstersEl = document.getElementById('sidebarMonsters');
    if (!sidebarMonstersEl) return;
    
    if (gameState.monsters.length === 0) {
        sidebarMonstersEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #8b949e; font-size: 12px;">暂无怪兽</div>';
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
                 onclick="selectMonster(${monster.id}); switchTab('monsters');">
                <div class="sidebar-monster-icon">
                    ${createSVG(monster.type, 28)}
                </div>
                <div class="sidebar-monster-info">
                    <div class="sidebar-monster-name">${monster.name}</div>
                    <div class="sidebar-monster-status">
                        ${isWorking ? statusText : 'Lv.' + monster.level + ' · 空闲中'}
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
                还有 ${gameState.monsters.length - 6} 只怪兽...
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
                        解锁需要:<br>
                        <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('coin', 12)}</span>${plot.unlockCost.coins}<br>
                        <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('material', 12)}</span>${plot.unlockCost.materials}
                    </div>
                </div>
            `;
        }
        
        if (plot.crop) {
            var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
            var isReady = plot.progress >= 100;
            
            return `
                <div class="plot planted ${isReady ? 'ready' : ''}" 
                     id="plot-${plot.id}" data-plot-id="${plot.id}"
                     onclick="${isReady ? 'harvest(' + plot.id + ')' : ''}"
                     style="${isReady ? 'animation: pulse 1s infinite;' : ''}">
                    ${createSVG('plant', 48)}
                    <div class="plot-text">${cropType.name}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${plot.progress}%"></div>
                    </div>
                    ${plot.assignedMonster ? `
                        <div style="margin-top: 5px;">
                            ${createSVG(plot.assignedMonster.type, 24)}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        return `
            <div class="plot" id="plot-${plot.id}" data-plot-id="${plot.id}" onclick="showPlantMenu(${plot.id})">
                ${createSVG('add', 48)}
                <div class="plot-text">点击种植</div>
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

// 招募模态框
window.showRecruitModal = function() {
    var recruitOptions = Object.keys(monsterTypes).map(function(typeId) {
        var typeData = monsterTypes[typeId];
        var baseCost = 50;
        var typeCosts = {
            slime: 50,
            goblin: 80,
            sprite: 120,
            golem: 150,
            wisp: 200
        };
        var cost = typeCosts[typeId] || baseCost;
        
        return `
            <div style="padding: 15px; margin: 10px 0; background: #21262d; border-radius: 10px; border: 2px solid #30363d; cursor: pointer;"
                 onclick="recruitMonster('${typeId}', ${cost})"
                 onmouseover="this.style.borderColor='${typeData.color}'"
                 onmouseout="this.style.borderColor='#30363d'">
                <div style="display: flex; align-items: center;">
                    ${createSVG(typeId, 50)}
                    <div style="margin-left: 15px; flex: 1;">
                        <div style="font-weight: bold; font-size: 16px; color: ${typeData.color};">
                            ${typeData.name}
                        </div>
                        <div style="font-size: 12px; color: #8b949e; margin-top: 5px;">
                            基础属性：
                            力量 ${typeData.baseStats.strength} | 
                            敏捷 ${typeData.baseStats.agility} | 
                            智力 ${typeData.baseStats.intelligence} | 
                            耕作 ${typeData.baseStats.farming}
                        </div>
                        <div style="font-size: 14px; color: #f0c53d; margin-top: 8px; font-weight: bold;">
                            <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('coin', 14)}</span>${cost} 金币
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    var modalContent = `
        <div class="modal-header">招募怪兽</div>
        <div style="max-height: 500px; overflow-y: auto;">
            ${recruitOptions}
        </div>
        <div class="modal-buttons">
            <button class="btn btn-primary" onclick="closeModal()">取消</button>
        </div>
    `;
    
    showModal(modalContent);
};

window.recruitMonster = function(typeId, cost) {
    if (gameState.coins < cost) {
        showNotification('金币不足！', 'error');
        return;
    }
    
    if (gameState.monsters.length >= 20) {
        showNotification('怪兽数量已达上限（20只）！', 'warning');
        return;
    }
    
    gameState.coins -= cost;
    var monster = createMonster(typeId);
    
    closeModal();
    showNotification('成功招募 ' + monster.name + '！', 'success');
    updateResources();
    renderMonsters();
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
    var farmNavIcon = document.getElementById('farmNavIcon');
    var monstersNavIcon = document.getElementById('monstersNavIcon');
    var explorationNavIcon = document.getElementById('explorationNavIcon');
    var breedingNavIcon = document.getElementById('breedingNavIcon');
    var techNavIcon = document.getElementById('techNavIcon');
    var disposalNavIcon = document.getElementById('disposalNavIcon');
    
    if (farmNavIcon) farmNavIcon.innerHTML = createSVG('plant', 24);
    if (monstersNavIcon) monstersNavIcon.innerHTML = createSVG('slime', 24);
    if (explorationNavIcon) explorationNavIcon.innerHTML = createSVG('explore', 24);
    if (breedingNavIcon) breedingNavIcon.innerHTML = createSVG('heart', 24);
    if (techNavIcon) techNavIcon.innerHTML = createSVG('research', 24);
    if (disposalNavIcon) disposalNavIcon.innerHTML = createSVG('trash', 24);
}

// 侧边栏切换（用于平板端）
window.toggleSidebar = function() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
};

// 一键收获功能
window.autoHarvestAll = function() {
    var harvested = 0;
    gameState.plots.forEach(function(plot) {
        if (plot.crop && plot.progress >= 100) {
            harvest(plot.id);
            harvested++;
        }
    });
    
    if (harvested > 0) {
        showNotification('一键收获了 ' + harvested + ' 个作物！', 'success');
    } else {
        showNotification('没有可收获的作物', 'info');
    }
};

// 自动种植功能
window.autoPlantAll = function() {
    var planted = 0;
    var availableCrops = cropTypes.filter(function(crop) {
        return gameState.food >= crop.cost && gameState.research >= (crop.requiredTech || 0);
    });
    
    if (availableCrops.length === 0) {
        showNotification('没有可种植的作物', 'info');
        return;
    }
    
    var cropToPlant = availableCrops[0]; // 种植第一个可用作物
    
    gameState.plots.forEach(function(plot) {
        if (!plot.locked && !plot.crop && gameState.food >= cropToPlant.cost) {
            gameState.food -= cropToPlant.cost;
            plot.crop = cropToPlant.id;
            plot.progress = 0;
            planted++;
        }
    });
    
    if (planted > 0) {
        showNotification('自动种植了 ' + planted + ' 个 ' + cropToPlant.name + '！', 'success');
        updateResources();
        renderFarm();
    } else {
        showNotification('没有空余的土地或资源不足', 'info');
    }
};

// 初始化UI - 在页面加载时调用
window.addEventListener('load', function() {
    // 初始化移动端导航图标
    initMobileNavIcons();
    
    // 绑定侧边栏切换事件
    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // 初始化快捷操作按钮图标
    var quickActionBtns = document.querySelectorAll('.quick-action-btn .quick-action-icon');
    quickActionBtns.forEach(function(icon, index) {
        if (index === 0) {
            icon.innerHTML = createSVG('harvest', 16);
        } else if (index === 1) {
            icon.innerHTML = createSVG('plant', 16);
        }
    });
});

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

// 更新资源显示
window.updateResources = function() {
    // 更新资源数字（根据你的HTML结构调整元素ID）
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
    
    // 如果你有额外元素可以在这里更新
};

// 渲染农场（调用farm.js中的renderFarm，但renderFarm本身已定义为全局，这里直接调用）
window.renderFarm = function() {
    var farmGrid = document.getElementById('farmGrid');
    if (!farmGrid) return;
    
    farmGrid.innerHTML = gameState.plots.map(function(plot) {
        if (plot.locked) {
            return `
                <div class="plot locked" onclick="unlockPlot(${plot.id})">
                    ${createSVG('lock', 48)}
                    <div class="plot-text">
                        解锁需要:<br>
                        💰${plot.unlockCost.coins}<br>
                        🔨${plot.unlockCost.materials}
                    </div>
                </div>
            `;
        }
        
        if (plot.crop) {
            var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
            var isReady = plot.progress >= 100;
            
            return `
                <div class="plot planted ${isReady ? 'ready' : ''}" 
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
            <div class="plot" onclick="showPlantMenu(${plot.id})">
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
        monsterGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">还没有怪兽，去招募一些吧！</div>';
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
                    <div style="color: #666; margin-bottom: 3px;">特性: ${monster.traits.map(function(t) { return t.name; }).join(', ')}</div>
                    <div style="color: #666;">等级: ${monster.level} (${monster.exp}/${monster.maxExp})</div>
                    ${isWorking ? '<div style="color: #2196f3; font-weight: bold; margin-top: 5px;">⚙️ ' + getStatusText(monster.status) + '</div>' : ''}
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
            <div style="padding: 15px; margin: 10px 0; background: #f5f5f5; border-radius: 10px; border: 2px solid #ddd; cursor: pointer;"
                 onclick="recruitMonster('${typeId}', ${cost})"
                 onmouseover="this.style.borderColor='${typeData.color}'"
                 onmouseout="this.style.borderColor='#ddd'">
                <div style="display: flex; align-items: center;">
                    ${createSVG(typeId, 50)}
                    <div style="margin-left: 15px; flex: 1;">
                        <div style="font-weight: bold; font-size: 16px; color: ${typeData.color};">
                            ${typeData.name}
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            基础属性：
                            力量 ${typeData.baseStats.strength} | 
                            敏捷 ${typeData.baseStats.agility} | 
                            智力 ${typeData.baseStats.intelligence} | 
                            耕作 ${typeData.baseStats.farming}
                        </div>
                        <div style="font-size: 14px; color: #ff9800; margin-top: 8px; font-weight: bold;">
                            💰 ${cost} 金币
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
    // 更新标签按钮
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
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
};
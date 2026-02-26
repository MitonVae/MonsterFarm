// ==================== 探索模块 ====================

window.renderExploration = function() {
    var explorationArea = document.getElementById('explorationArea');
    if (!explorationArea) return;
    
    explorationArea.innerHTML = `
        <h2>野外探索</h2>
        <p style="color: #8b949e; margin: 10px 0;">派遣怪兽探索野外，获取资源和新怪兽</p>
        
        <div class="expedition-panel">
            <h3>当前探险队</h3>
            <div class="expedition-slots" id="expeditionSlots"></div>
            <div class="expedition-actions">
                <button class="btn btn-primary" onclick="addToExpedition()">
                    添加怪兽
                </button>
                <button class="btn btn-warning" onclick="autoFillExpedition()">
                    智能组队
                </button>
                <button class="btn btn-danger" onclick="clearExpedition()">
                    清空队伍
                </button>
                <button class="btn btn-success" onclick="startExpedition()" id="startExpeditionBtn">
                    开始探索 (消耗20能量)
                </button>
            </div>
        </div>
        
        <div style="margin-top: 20px; background: #21262d; padding: 15px; border-radius: 10px;">
            <h3>探索记录</h3>
            <div id="expeditionHistory" style="max-height: 200px; overflow-y: auto;">
                ${gameState.totalExplorations === 0 ? 
                    '<div style="color: #8b949e; text-align: center; padding: 20px;">还没有探索记录</div>' :
                    '历史记录显示在这里'}
            </div>
        </div>
    `;
    
    renderExpeditionSlots();
};

function renderExpeditionSlots() {
    var slots = document.getElementById('expeditionSlots');
    if (!slots) return;
    
    var maxSlots = 4;
    var currentExpedition = gameState.expeditions[0] || { members: [] };
    
    slots.innerHTML = Array(maxSlots).fill(0).map(function(_, i) {
        var monster = currentExpedition.members[i];
        
        if (monster) {
            return `
                <div class="expedition-slot filled" onclick="removeFromExpedition(${i})">
                    ${createSVG(monster.type, 60)}
                    <div style="font-size: 10px; margin-top: 5px;">${monster.name}</div>
                </div>
            `;
        }
        
        return `
            <div class="expedition-slot">
                ${createSVG('add', 40)}
            </div>
        `;
    }).join('');
}

window.addToExpedition = function() {
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
    
    var availableMonsters = gameState.monsters.filter(function(m) {
        return m.status === 'idle' && !expedition.members.find(function(em) { return em.id === m.id; });
    });
    
    if (availableMonsters.length === 0) {
        showNotification('没有可用的怪兽！', 'warning');
        return;
    }
    
    var modalContent = `
        <div class="modal-header">选择探险怪兽</div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${availableMonsters.map(function(monster) {
                var typeData = monsterTypes[monster.type];
                return `
                    <div style="padding: 10px; margin: 5px 0; background: #21262d; border-radius: 8px; cursor: pointer; border: 2px solid #30363d;"
                         onclick="selectMonsterForExpedition(${monster.id})"
                         onmouseover="this.style.borderColor='#58a6ff'"
                         onmouseout="this.style.borderColor='#30363d'">
                        <div style="display: flex; align-items: center;">
                            ${createSVG(monster.type, 40)}
                            <div style="margin-left: 10px; flex: 1;">
                                <div style="font-weight: bold;">${monster.name}</div>
                                <div style="font-size: 11px; color: #8b949e;">
                                    ${typeData.name} Lv.${monster.level} | 
                                    力量:${monster.stats.strength} 敏捷:${monster.stats.agility} 智力:${monster.stats.intelligence}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="modal-buttons">
            <button class="btn btn-primary" onclick="closeModal()">取消</button>
        </div>
    `;
    
    showModal(modalContent);
};

window.selectMonsterForExpedition = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    var expedition = gameState.expeditions[0];
    
    expedition.members.push(monster);
    monster.status = 'preparing';
    
    closeModal();
    renderExpeditionSlots();
    showNotification(monster.name + ' 加入探险队！', 'success');
};

window.removeFromExpedition = function(index) {
    var expedition = gameState.expeditions[0];
    if (!expedition || expedition.status === 'exploring') return;
    
    var monster = expedition.members[index];
    if (monster) {
        monster.status = 'idle';
        expedition.members.splice(index, 1);
        renderExpeditionSlots();
        showNotification(monster.name + ' 离开探险队', 'success');
    }
};

window.startExpedition = function() {
    var expedition = gameState.expeditions[0];
    
    if (!expedition || expedition.members.length === 0) {
        showNotification('探险队是空的！', 'warning');
        return;
    }
    
    if (gameState.energy < 20) {
        showNotification('能量不足！需要20点能量', 'error');
        return;
    }
    
    gameState.energy -= 20;
    expedition.status = 'exploring';
    expedition.startTime = Date.now();
    
    expedition.members.forEach(function(m) { m.status = 'exploring'; });
    
    updateResources();
    showNotification('探险队出发了！', 'success');
    
    var expeditionTime = 60000;
    
    setTimeout(function() {
        completeExpedition();
    }, expeditionTime);
    
    setTimeout(function() {
        if (Math.random() < 0.4) {
            triggerRandomEvent('exploration');
        }
    }, expeditionTime / 2);
};

// 智能组队：自动选择最适合探索的怪兽
window.autoFillExpedition = function() {
    if (!gameState.expeditions[0]) {
        gameState.expeditions[0] = { members: [], status: 'preparing' };
    }
    
    var expedition = gameState.expeditions[0];
    
    if (expedition.status === 'exploring') {
        showNotification('探险队正在探索中！', 'warning');
        return;
    }
    
    var availableMonsters = gameState.monsters.filter(function(m) {
        return m.status === 'idle' && !expedition.members.find(function(em) { return em.id === m.id; });
    });
    
    if (availableMonsters.length === 0) {
        showNotification('没有可用的怪兽！', 'warning');
        return;
    }
    
    // 按战斗力排序（力量+敏捷+智力）
    availableMonsters.sort(function(a, b) {
        var aPower = a.stats.strength + a.stats.agility + a.stats.intelligence;
        var bPower = b.stats.strength + b.stats.agility + b.stats.intelligence;
        return bPower - aPower;
    });
    
    // 填满探险队（最多4个）
    var slotsToFill = 4 - expedition.members.length;
    var monstersToAdd = availableMonsters.slice(0, slotsToFill);
    
    monstersToAdd.forEach(function(monster) {
        expedition.members.push(monster);
        monster.status = 'preparing';
    });
    
    renderExpeditionSlots();
    showNotification('智能组队完成！添加了 ' + monstersToAdd.length + ' 只怪兽', 'success');
};

// 清空探险队
window.clearExpedition = function() {
    if (!gameState.expeditions[0]) return;
    
    var expedition = gameState.expeditions[0];
    
    if (expedition.status === 'exploring') {
        showNotification('探险队正在探索中，无法清空！', 'warning');
        return;
    }
    
    if (expedition.members.length === 0) {
        showNotification('探险队已经是空的！', 'info');
        return;
    }
    
    expedition.members.forEach(function(monster) {
        monster.status = 'idle';
    });
    
    expedition.members = [];
    renderExpeditionSlots();
    showNotification('探险队已清空', 'success');
};

function completeExpedition() {
    var expedition = gameState.expeditions[0];
    if (!expedition || expedition.status !== 'exploring') return;
    
    var totalStrength = 0, totalAgility = 0, totalIntelligence = 0;
    
    expedition.members.forEach(function(m) {
        totalStrength += m.stats.strength;
        totalAgility += m.stats.agility;
        totalIntelligence += m.stats.intelligence;
    });
    
    var teamPower = totalStrength + totalAgility + totalIntelligence;
    
    var coinsReward = 50 + Math.floor(Math.random() * 100) + teamPower * 5;
    var materialsReward = 20 + Math.floor(Math.random() * 50) + Math.floor(teamPower * 0.5);
    var researchReward = 10 + Math.floor(Math.random() * 20) + Math.floor(totalIntelligence * 2);
    
    if (gameState.technologies.exploration) {
        coinsReward = Math.floor(coinsReward * technologies.exploration.effects.explorationBonus);
        materialsReward = Math.floor(materialsReward * technologies.exploration.effects.explorationBonus);
        researchReward = Math.floor(researchReward * technologies.exploration.effects.explorationBonus);
    }
    
    gameState.coins += coinsReward;
    gameState.materials += materialsReward;
    gameState.research += researchReward;
    gameState.totalExplorations++;
    
    expedition.members.forEach(function(m) {
        gainExp(m, 25 + Math.floor(Math.random() * 15));
        m.status = 'idle';
    });
    
    if (Math.random() < 0.3) {
        var types = Object.keys(monsterTypes);
        var randomType = types[Math.floor(Math.random() * types.length)];
        var newMonster = createMonster(randomType);
        showNotification('发现了野生的 ' + newMonster.name + '！', 'success');
    }
    
    showNotification(
        '探险完成！获得：金币 ' + coinsReward + ' 材料 ' + materialsReward + ' 研究点 ' + researchReward,
        'success'
    );
    
    expedition.members = [];
    expedition.status = 'preparing';
    
    updateResources();
    renderExploration();
    renderMonsters();
}
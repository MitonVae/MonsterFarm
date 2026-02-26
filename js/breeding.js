// ==================== 繁殖模块 ====================

window.renderBreeding = function() {
    var breedingContainer = document.getElementById('breedingContainer');
    if (!breedingContainer) return;
    
    if (!gameState.technologies.breeding) {
        breedingContainer.innerHTML = `
            <h2>繁殖中心</h2>
            <div style="text-align: center; padding: 60px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
                <div>需要解锁"繁殖技术"才能使用</div>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="switchTab('tech')">
                    前往科技树
                </button>
            </div>
        `;
        return;
    }
    
    breedingContainer.innerHTML = `
        <h2>繁殖中心</h2>
        <p style="color: #666; margin: 10px 0;">选择两只怪兽进行繁殖，培育更强的后代</p>
        
        <div class="breeding-slots">
            <div class="breeding-slot" id="breedSlot1" onclick="selectBreedingMonster(1)">
                ${gameState.breedingSlot1 ? 
                    createSVG(gameState.breedingSlot1.type, 60) +
                    '<div style="font-size: 12px; margin-top: 10px;">' + gameState.breedingSlot1.name + '</div>' :
                    createSVG('add', 60) + '<div style="font-size: 12px; margin-top: 10px;">选择怪兽</div>'
                }
            </div>
            
            <div class="breeding-arrow">+</div>
            
            <div class="breeding-slot" id="breedSlot2" onclick="selectBreedingMonster(2)">
                ${gameState.breedingSlot2 ? 
                    createSVG(gameState.breedingSlot2.type, 60) +
                    '<div style="font-size: 12px; margin-top: 10px;">' + gameState.breedingSlot2.name + '</div>' :
                    createSVG('add', 60) + '<div style="font-size: 12px; margin-top: 10px;">选择怪兽</div>'
                }
            </div>
            
            <div class="breeding-arrow">=</div>
            
            <div class="breeding-slot" style="border-color: #4caf50; background: #e8f5e9;">
                ${createSVG('breeding', 60)}
                <div style="font-size: 12px; margin-top: 10px;">后代</div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <button class="btn btn-success" onclick="startBreeding()" 
                    ${!gameState.breedingSlot1 || !gameState.breedingSlot2 ? 'disabled' : ''}>
                开始繁殖 (消耗100食物，30能量)
            </button>
            <button class="btn btn-primary" onclick="clearBreedingSlots()" 
                    style="margin-left: 10px;">
                清空
            </button>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin-top: 20px;">
            <h3>繁殖说明</h3>
            <ul style="margin-left: 20px; color: #666; font-size: 13px; line-height: 1.8;">
                <li>后代会继承父母的平均属性</li>
                <li>有20%概率发生属性突变</li>
                <li>后代类型随机继承父母之一</li>
                <li>特性会随机遗传</li>
                <li>代数为父母最高代数+1</li>
            </ul>
        </div>
    `;
};

window.selectBreedingMonster = function(slotNumber) {
    var availableMonsters = gameState.monsters.filter(function(m) {
        return m.status === 'idle' && 
               m.id !== (gameState.breedingSlot1 ? gameState.breedingSlot1.id : null) && 
               m.id !== (gameState.breedingSlot2 ? gameState.breedingSlot2.id : null);
    });
    
    if (availableMonsters.length === 0) {
        showNotification('没有可用的怪兽！', 'warning');
        return;
    }
    
    var modalContent = `
        <div class="modal-header">选择怪兽 (槽位 ${slotNumber})</div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${availableMonsters.map(function(monster) {
                var typeData = monsterTypes[monster.type];
                return `
                    <div style="padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 8px; cursor: pointer; border: 2px solid #ddd;"
                         onclick="assignBreedingMonster(${slotNumber}, ${monster.id})"
                         onmouseover="this.style.borderColor='#667eea'"
                         onmouseout="this.style.borderColor='#ddd'">
                        <div style="display: flex; align-items: center;">
                            ${createSVG(monster.type, 40)}
                            <div style="margin-left: 10px; flex: 1;">
                                <div style="font-weight: bold;">${monster.name}</div>
                                <div style="font-size: 11px; color: #666;">
                                    ${typeData.name} Lv.${monster.level} Gen.${monster.generation}
                                </div>
                                <div style="font-size: 10px; color: #999; margin-top: 3px;">
                                    力:${monster.stats.strength} 敏:${monster.stats.agility} 
                                    智:${monster.stats.intelligence} 农:${monster.stats.farming}
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

window.assignBreedingMonster = function(slotNumber, monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    
    if (slotNumber === 1) {
        gameState.breedingSlot1 = monster;
    } else {
        gameState.breedingSlot2 = monster;
    }
    
    monster.status = 'preparing';
    
    closeModal();
    renderBreeding();
    showNotification(monster.name + ' 进入繁殖槽位', 'success');
};

window.clearBreedingSlots = function() {
    if (gameState.breedingSlot1) {
        gameState.breedingSlot1.status = 'idle';
        gameState.breedingSlot1 = null;
    }
    if (gameState.breedingSlot2) {
        gameState.breedingSlot2.status = 'idle';
        gameState.breedingSlot2 = null;
    }
    renderBreeding();
};

window.startBreeding = function() {
    if (!gameState.breedingSlot1 || !gameState.breedingSlot2) {
        showNotification('请选择两只怪兽！', 'warning');
        return;
    }
    
    if (gameState.food < 100) {
        showNotification('食物不足！需要100食物', 'error');
        return;
    }
    
    if (gameState.energy < 30) {
        showNotification('能量不足！需要30点能量', 'error');
        return;
    }
    
    gameState.food -= 100;
    gameState.energy -= 30;
    
    var parent1 = gameState.breedingSlot1;
    var parent2 = gameState.breedingSlot2;
    
    parent1.status = 'breeding';
    parent2.status = 'breeding';
    
    showNotification('开始繁殖...', 'success');
    updateResources();
    
    setTimeout(function() {
        var childType = Math.random() < 0.5 ? parent1.type : parent2.type;
        
        var child = createMonster(childType, parent1, parent2);
        
        parent1.status = 'idle';
        parent2.status = 'idle';
        
        gameState.breedingSlot1 = null;
        gameState.breedingSlot2 = null;
        gameState.monstersBreed++;
        
        showNotification('繁殖成功！获得新怪兽：' + child.name, 'success');
        renderBreeding();
        renderMonsters();
    }, 45000);
};

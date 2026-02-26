// ==================== 农场模块 ====================

window.unlockPlot = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.locked) return;
    
    var cost = plot.unlockCost;
    
    if (gameState.coins >= cost.coins && gameState.materials >= cost.materials) {
        if (confirm('解锁这块农田需要：\n💰 ' + cost.coins + ' 金币\n🔨 ' + cost.materials + ' 材料\n\n确定解锁吗？')) {
            gameState.coins -= cost.coins;
            gameState.materials -= cost.materials;
            plot.locked = false;
            
            showNotification('解锁成功！', 'success');
            renderAll();
        }
    } else {
        showNotification('资源不足！', 'error');
    }
};

window.showPlantMenu = function(plotId) {
    var plot = gameState.plots[plotId];
    if (plot.locked || plot.crop) return;
    
    var availableCrops = cropTypes.filter(function(crop) {
        return !crop.requiredTech || gameState.technologies[crop.requiredTech];
    });
    
    var modalContent = `
        <div class="modal-header">选择要种植的作物</div>
        <div style="display: grid; gap: 10px;">
            ${availableCrops.map(function(crop) {
                return `
                    <div style="padding: 15px; background: #f5f5f5; border-radius: 8px; cursor: pointer; border: 2px solid #ddd;"
                         onclick="plantCrop(${plotId}, '${crop.id}')"
                         onmouseover="this.style.borderColor='#667eea'"
                         onmouseout="this.style.borderColor='#ddd'">
                        <div style="font-weight: bold; margin-bottom: 5px;">${crop.name}</div>
                        <div style="font-size: 12px; color: #666;">
                            生长时间: ${crop.growTime/1000}秒<br>
                            产量: ${crop.yield} 食物<br>
                            售价: ${crop.value} 金币
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

window.plantCrop = function(plotId, cropId) {
    var plot = gameState.plots[plotId];
    var cropType = cropTypes.find(function(c) { return c.id === cropId; });
    
    closeModal();
    
    plot.crop = cropId;
    plot.plantedAt = Date.now();
    plot.progress = 0;
    
    showNotification('种植了 ' + cropType.name, 'success');
    renderFarm();
    
    growCrop(plotId);
};

function growCrop(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.crop) return;
    
    var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
    
    var growInterval = setInterval(function() {
        if (!plot.crop) {
            clearInterval(growInterval);
            return;
        }
        
        var speedMultiplier = 1;
        
        if (plot.assignedMonster) {
            speedMultiplier *= (1 + plot.assignedMonster.stats.farming * 0.1);
        }
        
        if (gameState.technologies.irrigation) {
            speedMultiplier *= technologies.irrigation.effects.growthSpeed;
        }
        
        speedMultiplier *= plot.growthBonus;
        
        var elapsed = Date.now() - plot.plantedAt;
        plot.progress = Math.min(100, (elapsed / cropType.growTime) * 100 * speedMultiplier);
        
        renderFarm();
        
        if (plot.progress >= 100) {
            clearInterval(growInterval);
            showNotification(cropType.name + ' 成熟了！', 'success');
            
            if (plot.assignedMonster) {
                gainExp(plot.assignedMonster, 10);
            }
        }
    }, 100);
}

window.harvest = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.crop || plot.progress < 100) return;
    
    var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
    
    var yieldAmount = cropType.yield;
    var valueAmount = cropType.value;
    
    if (gameState.technologies.advancedFarming) {
        yieldAmount *= technologies.advancedFarming.effects.cropYield;
        valueAmount *= technologies.advancedFarming.effects.cropYield;
    }
    
    yieldAmount = Math.floor(yieldAmount);
    valueAmount = Math.floor(valueAmount);
    
    gameState.food += yieldAmount;
    gameState.coins += valueAmount;
    gameState.totalHarvests++;
    
    if (Math.random() < 0.3) {
        var research = Math.floor(Math.random() * 5) + 1;
        gameState.research += research;
    }
    
    showNotification('收获 ' + cropType.name + '！获得 ' + yieldAmount + ' 食物和 ' + valueAmount + ' 金币', 'success');
    
    var assignedMonster = plot.assignedMonster;
    if (assignedMonster) {
        assignedMonster.status = 'idle';
        assignedMonster.assignment = null;
    }
    
    plot.crop = null;
    plot.plantedAt = null;
    plot.progress = 0;
    plot.assignedMonster = null;
    
    renderAll();
};

// 自动种植（简化，可后续实现）
window.autoPlantAll = function() {
    showNotification('自动种植功能暂未实现', 'warning');
};
// ==================== 农场模块 ====================

window.unlockPlot = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.locked) return;
    
    var cost = plot.unlockCost;
    
    if (gameState.coins >= cost.coins && gameState.materials >= cost.materials) {
        if (confirm('解锁这块农田需要：\n金币 ' + cost.coins + '\n材料 ' + cost.materials + '\n\n确定解锁吗？')) {
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
                    <div style="padding: 15px; background: #21262d; border-radius: 8px; cursor: pointer; border: 2px solid #30363d;"
                         onclick="plantCrop(${plotId}, '${crop.id}')"
                         onmouseover="this.style.borderColor='#58a6ff'"
                         onmouseout="this.style.borderColor='#30363d'">
                        <div style="font-weight: bold; margin-bottom: 5px;">${crop.name}</div>
                        <div style="font-size: 12px; color: #8b949e;">
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
        
        // 只更新特定地块的进度条，而不是重新渲染整个农场
        updatePlotProgress(plotId);
        
        if (plot.progress >= 100) {
            clearInterval(growInterval);
            
            // 进度完成时更新地块状态
            updatePlotAppearance(plotId);
            
            showNotification(cropType.name + ' 成熟了！', 'success');
            
            if (plot.assignedMonster) {
                gainExp(plot.assignedMonster, 10);
            }
        }
    }, 100);
}

// 只更新特定地块的进度条
function updatePlotProgress(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.crop) return;
    
    // 使用ID直接找到地块元素
    var plotElement = document.getElementById('plot-' + plotId);
    if (!plotElement) return;
    
    var progressFill = plotElement.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = plot.progress + '%';
    }
}

// 更新地块外观（用于状态变化时）
function updatePlotAppearance(plotId) {
    var plot = gameState.plots[plotId];
    var plotElement = document.getElementById('plot-' + plotId);
    
    if (!plotElement || !plot.crop) return;
    
    var isReady = plot.progress >= 100;
    
    if (isReady) {
        plotElement.classList.add('ready');
        plotElement.onclick = function() { harvest(plotId); };
        plotElement.style.animation = 'pulse 1s infinite';
        
        // 更新文本内容以显示可收获状态
        var plotText = plotElement.querySelector('.plot-text');
        if (plotText) {
            var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
            plotText.innerHTML = cropType.name + '<br><small style="color: #46d164;">点击收获</small>';
        }
    } else {
        plotElement.classList.remove('ready');
        plotElement.onclick = null;
        plotElement.style.animation = '';
    }
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
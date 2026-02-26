// ==================== 农场模块 ====================

// 地块生长计时器集合（plotId -> intervalId）
var growIntervals = {};

// ==================== 地块解锁 ====================
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

// ==================== 地块点击处理（核心入口）====================
window.handlePlotClick = function(plotId) {
    var plot = gameState.plots[plotId];
    if (plot.locked) { unlockPlot(plotId); return; }

    if (plot.assignedMonster) {
        showPlotManagePanel(plotId);
        return;
    }
    if (!plot.crop) {
        showPlantMenu(plotId);
    } else if (plot.progress >= 100) {
        harvest(plotId);
    }
    // 生长中且无怪兽：不可操作
};

// ==================== 地块管理面板（有怪兽时）====================
window.showPlotManagePanel = function(plotId) {
    var plot = gameState.plots[plotId];
    var monster = plot.assignedMonster;
    var availableCrops = cropTypes.filter(function(crop) {
        return !crop.requiredTech || gameState.technologies[crop.requiredTech];
    });
    var cropListHtml = availableCrops.map(function(crop) {
        var isSelected = plot.autoCrop === crop.id;
        var speedMult = calcSpeedMultiplier(plot, monster);
        var qualityChance = calcQualityChance(monster, crop);
        var isPreferred = crop.preferredMonster === monster.type;
        var bonusTag = isPreferred ? '<span style="color:#f0c53d;font-size:12px;margin-left:5px;">★ 专长加成</span>' : '';
        return '<div onclick="setAutoCrop(' + plotId + ', \'' + crop.id + '\')"' +
            ' style="padding:12px 15px;margin-bottom:8px;background:' + (isSelected ? '#1a3a2a' : '#0d1117') + ';' +
            'border:2px solid ' + (isSelected ? '#46d164' : '#30363d') + ';border-radius:8px;cursor:pointer;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div><span style="font-weight:bold;">' + crop.name + '</span>' + bonusTag +
            '<div style="font-size:13px;color:#8b949e;margin-top:3px;">' + crop.desc + '</div></div>' +
            (isSelected ? '<span style="color:#46d164;font-size:18px;">✓</span>' : '') +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px;font-size:13px;">' +
            '<div style="background:#21262d;padding:4px 6px;border-radius:4px;text-align:center;"><div style="color:#8b949e;">速度倍率</div><div style="color:#58a6ff;">' + speedMult.toFixed(1) + 'x</div></div>' +
            '<div style="background:#21262d;padding:4px 6px;border-radius:4px;text-align:center;"><div style="color:#8b949e;">优质率</div><div style="color:#f0c53d;">' + (qualityChance * 100).toFixed(0) + '%</div></div>' +
            '<div style="background:#21262d;padding:4px 6px;border-radius:4px;text-align:center;"><div style="color:#8b949e;">售价</div><div style="color:#46d164;">' + crop.value + '金</div></div>' +
            '</div></div>';
    }).join('');
    var content = '<div class="modal-header">地块 #' + (plotId + 1) + ' · ' + monster.name + ' 驻守</div>' +
        '<div style="background:#21262d;padding:12px 15px;border-radius:8px;margin-bottom:15px;font-size:12px;display:flex;gap:15px;flex-wrap:wrap;">' +
        '<span>耕作力: <strong style="color:#58a6ff;">' + monster.stats.farming + '</strong></span>' +
        '<span>等级: <strong style="color:#f0c53d;">Lv.' + monster.level + '</strong></span>' +
        '<span>专长作物: <strong style="color:#f0c53d;">' + getCropNameByMonster(monster.type) + '</strong></span>' +
        '</div>' +
        '<div style="font-size:13px;color:#8b949e;margin-bottom:10px;">选择自动种植的作物（怪兽将循环种植并自动收获）：</div>' +
        '<div style="max-height:320px;overflow-y:auto;">' + cropListHtml + '</div>' +
        '<div class="modal-buttons" style="margin-top:15px;">' +
        (plot.autoCrop && !plot.crop ? '<button class="btn btn-success" onclick="startAutoCycle(' + plotId + ');closeModal();">立即开始</button>' : '') +
        '<button class="btn btn-danger" onclick="removeMonsterFromPlot(' + plotId + ');closeModal();">撤回怪兽</button>' +
        '<button class="btn btn-primary" onclick="closeModal()">关闭</button></div>';
    showModal(content);
};

function getCropNameByMonster(monsterType) {
    var crop = cropTypes.find(function(c) { return c.preferredMonster === monsterType; });
    return crop ? crop.name : '无';
}

window.showPlantMenu = function(plotId) {
    var plot = gameState.plots[plotId];
    if (plot.locked || plot.crop) return;
    
    var availableCrops = cropTypes.filter(function(crop) {
        return !crop.requiredTech || gameState.technologies[crop.requiredTech];
    });
    
    var modalContent = '<div class="modal-header">选择要种植的作物</div>' +
        '<div style="font-size:12px;color:#8b949e;margin-bottom:12px;padding:8px 12px;background:#21262d;border-radius:6px;">' +
        '💡 手动种植需手动收获。如需自动化，请先派遣怪兽驻守此地块。</div>' +
        '<div style="display: grid; gap: 10px;">' +
        availableCrops.map(function(crop) {
            return '<div style="padding: 15px; background: #21262d; border-radius: 8px; cursor: pointer; border: 2px solid #30363d;"' +
                ' onclick="plantCrop(' + plotId + ', \'' + crop.id + '\')"' +
                ' onmouseover="this.style.borderColor=\'#58a6ff\'"' +
                ' onmouseout="this.style.borderColor=\'#30363d\'">' +
                '<div style="font-weight: bold; margin-bottom: 5px;">' + crop.name + '</div>' +
                '<div style="font-size: 12px; color: #8b949e;">' +
                '生长时间: ' + crop.growTime/1000 + '秒 | 产量: ' + crop.yield + ' 食物 | 售价: ' + crop.value + ' 金币' +
                '</div><div style="font-size:13px;color:#58a6ff;margin-top:4px;">' + crop.desc + '</div>' +
                '</div>';
        }).join('') +
        '</div><div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">取消</button></div>';
    
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
    startGrowTimer(plotId);
};

// ==================== 自动种植作物设置 ====================
window.setAutoCrop = function(plotId, cropId) {
    var plot = gameState.plots[plotId];
    plot.autoCrop = cropId;
    var cropName = cropTypes.find(function(c){return c.id===cropId;}).name;
    if (!plot.crop) {
        startAutoCycle(plotId);
        closeModal();
        showNotification('已设置自动种植：' + cropName, 'success');
    } else {
        closeModal();
        showNotification('下一轮将自动种植：' + cropName, 'info');
    }
    renderFarm();
};

window.startAutoCycle = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.autoCrop || !plot.assignedMonster) return;
    var cropType = cropTypes.find(function(c) { return c.id === plot.autoCrop; });
    if (!cropType) return;
    if (!plot.crop) {
        plot.crop = plot.autoCrop;
        plot.plantedAt = Date.now();
        plot.progress = 0;
    }
    startGrowTimer(plotId);
    renderFarm();
};

// ==================== 速度/品质计算 ====================
function calcSpeedMultiplier(plot, monster) {
    var mult = 1;
    if (monster) {
        mult *= (1 + monster.stats.farming * 0.08);
        mult *= (1 + (monster.level - 1) * 0.03);
        var crop = cropTypes.find(function(c) { return c.id === (plot.autoCrop || plot.crop); });
        if (crop && crop.preferredMonster === monster.type) mult *= 1.25;
        if (monster.traits) {
            monster.traits.forEach(function(trait) {
                if (trait.id === 'farmer') mult *= 1.15;
            });
        }
    }
    if (gameState.technologies && gameState.technologies.irrigation) {
        mult *= technologies.irrigation.effects.growthSpeed;
    }
    mult *= (plot.growthBonus || 1);
    return mult;
}

function calcQualityChance(monster, crop) {
    if (!monster) return 0;
    var base = 0.05 + monster.stats.farming * 0.03 + (monster.level - 1) * 0.01;
    if (crop && crop.preferredMonster === monster.type) base += 0.15;
    if (monster.traits) {
        monster.traits.forEach(function(trait) {
            if (trait.id === 'lucky') base += 0.1;
            if (trait.id === 'farmer') base += 0.05;
        });
    }
    return Math.min(base, 0.6);
}

// ==================== 生长计时器（核心）====================
function startGrowTimer(plotId) {
    if (growIntervals[plotId]) {
        clearInterval(growIntervals[plotId]);
        delete growIntervals[plotId];
    }
    var plot = gameState.plots[plotId];
    if (!plot || !plot.crop) return;
    var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });

    var interval = setInterval(function() {
        var p = gameState.plots[plotId];
        if (!p || !p.crop) {
            clearInterval(interval);
            delete growIntervals[plotId];
            return;
        }
        var ct = cropTypes.find(function(c) { return c.id === p.crop; });
        var speedMult = calcSpeedMultiplier(p, p.assignedMonster);
        var elapsed = Date.now() - p.plantedAt;
        p.progress = Math.min(100, (elapsed / ct.growTime) * 100 * speedMult);
        updatePlotProgress(plotId);

        if (p.progress >= 100) {
            clearInterval(interval);
            delete growIntervals[plotId];
            updatePlotAppearance(plotId, true);
            showNotification(ct.name + ' 成熟了！', 'success');
            if (p.assignedMonster && p.autoCrop) {
                setTimeout(function() { autoHarvestPlot(plotId); }, 800);
            }
        }
    }, 100);
    growIntervals[plotId] = interval;
}

// ==================== 自动收获（怪兽驱动）====================
function autoHarvestPlot(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.crop || plot.progress < 100) return;
    var monster = plot.assignedMonster;
    var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
    var yieldAmt = cropType.yield;
    var valueAmt = cropType.value;
    if (gameState.technologies && gameState.technologies.advancedFarming) {
        yieldAmt *= technologies.advancedFarming.effects.cropYield;
        valueAmt *= technologies.advancedFarming.effects.cropYield;
    }
    var isQuality = false;
    if (monster) {
        var qChance = calcQualityChance(monster, cropType);
        if (Math.random() < qChance) {
            isQuality = true;
            yieldAmt *= 2;
            valueAmt *= 1.5;
        }
    }
    yieldAmt = Math.floor(yieldAmt);
    valueAmt = Math.floor(valueAmt);
    gameState.food += yieldAmt;
    gameState.coins += valueAmt;
    gameState.totalHarvests++;
    if (Math.random() < 0.25) gameState.research += Math.floor(Math.random() * 4) + 1;
    var msg = (isQuality ? '✨ 优质 ' : '') + cropType.name + ' 自动收获！+' + yieldAmt + '食 +' + valueAmt + '金';
    showNotification(msg, isQuality ? 'success' : 'info');
    if (typeof briefHarvest === 'function') briefHarvest((isQuality ? '✨优质' : '') + cropType.name, valueAmt, yieldAmt, monster ? monster.name : null);
    if (monster) {
        var expGain = 10 + Math.floor(monster.stats.farming * 0.5);
        gainExp(monster, expGain);
    }
    plot.crop = null;
    plot.plantedAt = null;
    plot.progress = 0;
    updateResources();
    renderFarm();
    if (plot.autoCrop && plot.assignedMonster) {
        setTimeout(function() { startAutoCycle(plotId); }, 500);
    }
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

// 更新地块外观（状态变化时调用）
function updatePlotAppearance(plotId, isReady) {
    var plot = gameState.plots[plotId];
    var plotElement = document.getElementById('plot-' + plotId);
    if (!plotElement || !plot.crop) return;
    var hasMonster = !!plot.assignedMonster;
    if (isReady) {
        plotElement.classList.add('ready');
        plotElement.style.animation = hasMonster ? 'pulse 0.8s infinite' : 'pulse 1s infinite';
        if (!hasMonster) {
            plotElement.onclick = function() { harvest(plotId); };
        }
        var plotText = plotElement.querySelector('.plot-text');
        if (plotText) {
            var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
            plotText.innerHTML = cropType.name + '<br><small style="color:#46d164;">' +
                (hasMonster ? '自动收获中...' : '点击收获') + '</small>';
        }
    } else {
        plotElement.classList.remove('ready');
        plotElement.style.animation = '';
    }
}

// ==================== 手动收获 ====================
window.harvest = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.crop || plot.progress < 100) return;
    if (plot.assignedMonster) {
        showNotification('怪兽正在管理此地块，会自动收获', 'info');
        return;
    }
    var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
    var yieldAmount = cropType.yield;
    var valueAmount = cropType.value;
    if (gameState.technologies && gameState.technologies.advancedFarming) {
        yieldAmount *= technologies.advancedFarming.effects.cropYield;
        valueAmount *= technologies.advancedFarming.effects.cropYield;
    }
    yieldAmount = Math.floor(yieldAmount);
    valueAmount = Math.floor(valueAmount);
    gameState.food += yieldAmount;
    gameState.coins += valueAmount;
    gameState.totalHarvests++;
    if (Math.random() < 0.3) gameState.research += Math.floor(Math.random() * 5) + 1;
    showNotification('收获 ' + cropType.name + '！+' + yieldAmount + '食物 +' + valueAmount + '金币', 'success');
    if (typeof briefHarvest === 'function') briefHarvest(cropType.name, valueAmount, yieldAmount, null);
    plot.crop = null;
    plot.plantedAt = null;
    plot.progress = 0;
    updateResources();
    renderFarm();
};

// ==================== 从地块撤回怪兽 ====================
window.removeMonsterFromPlot = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.assignedMonster) return;
    var monster = plot.assignedMonster;
    monster.status = 'idle';
    monster.assignment = null;
    plot.assignedMonster = null;
    plot.autoCrop = null;
    if (growIntervals[plotId]) {
        clearInterval(growIntervals[plotId]);
        delete growIntervals[plotId];
    }
    // 若有作物正在生长，保留进度，以手动模式继续
    if (plot.crop && plot.progress < 100) {
        var ct = cropTypes.find(function(c){return c.id===plot.crop;});
        plot.plantedAt = Date.now() - (plot.progress / 100) * ct.growTime;
        startGrowTimer(plotId);
    }
    showNotification(monster.name + ' 已从地块撤回', 'info');
    renderFarm();
    renderSidebarMonsters();
};

// ==================== 分配怪兽到地块（从外部调用）====================
window.assignMonsterToPlot = function(monsterId, plotId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    var plot = gameState.plots[plotId];
    if (!monster || !plot || plot.locked || plot.assignedMonster) return false;
    if (monster.status !== 'idle') {
        showNotification('该怪兽当前不空闲！', 'warning');
        return false;
    }
    plot.assignedMonster = monster;
    monster.status = 'farming';
    monster.assignment = 'plot-' + plotId;
    if (plot.crop && plot.progress < 100) {
        var ct = cropTypes.find(function(c){return c.id===plot.crop;});
        plot.plantedAt = Date.now() - (plot.progress / 100) * ct.growTime;
        if (growIntervals[plotId]) clearInterval(growIntervals[plotId]);
        startGrowTimer(plotId);
    }
    showNotification(monster.name + ' 驻守地块 #' + (plotId+1), 'success');
    // 引导钩子：Step4 选择地块 → Step5
    if (typeof onTutorialPlotPicked === 'function') onTutorialPlotPicked();
    renderFarm();
    renderSidebarMonsters();
    return true;
};

// ==================== 选择地块派怪兽（地块选择器）====================
window.showAssignPlotPicker = function(monsterId) {
    var availablePlots = gameState.plots.filter(function(p) {
        return !p.locked && !p.assignedMonster;
    });
    if (availablePlots.length === 0) {
        showNotification('没有空闲的地块可以分配！', 'warning');
        return;
    }
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    var html = '<div class="modal-header">选择要驻守的地块</div>' +
        '<div style="font-size:12px;color:#8b949e;margin-bottom:12px;">派遣 <strong style="color:#58a6ff;">' + monster.name + '</strong> 驻守后，可设置自动种植作物</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">' +
        availablePlots.map(function(plot) {
            var status = plot.crop ? '生长中 ' + Math.floor(plot.progress) + '%' : '空闲';
            return '<div onclick="assignMonsterToPlot(' + monsterId + ',' + plot.id + ');closeModal();"' +
                ' style="aspect-ratio:1;background:#21262d;border:2px dashed #30363d;border-radius:10px;' +
                'display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:10px;text-align:center;"' +
                ' onmouseover="this.style.borderColor=\'#58a6ff\';this.style.background=\'#30363d\'"' +
                ' onmouseout="this.style.borderColor=\'#30363d\';this.style.background=\'#21262d\'">' +
                '<div style="font-size:20px;margin-bottom:5px;">🌱</div>' +
                '<div style="font-size:12px;font-weight:bold;">地块 #' + (plot.id+1) + '</div>' +
                '<div style="font-size:13px;color:#8b949e;">' + status + '</div></div>';
        }).join('') +
        '</div><div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">取消</button></div>';
    showModal(html);
};

// ==================== 一键收获（手动地块）====================
window.autoHarvestAll = function() {
    var harvested = 0;
    gameState.plots.forEach(function(plot) {
        if (plot.crop && plot.progress >= 100 && !plot.assignedMonster) {
            harvest(plot.id);
            harvested++;
        }
    });
    if (harvested === 0) showNotification('没有可手动收获的作物', 'info');
};

// ==================== 快捷操作：手动存档 ====================
window.quickSave = function() {
    autoSave();
    showNotification('✅ 存档成功！', 'success');
    if (typeof briefSave === 'function') briefSave(false);
};

// ==================== 快捷操作：一键召回所有怪兽 ====================
window.recallAllMonsters = function() {
    var recalled = 0;

    // 从农田召回
    gameState.plots.forEach(function(plot) {
        if (plot.assignedMonster) {
            var m = plot.assignedMonster;
            // 停止自动循环（清除定时器由 removeMonsterFromPlot 处理）
            plot.assignedMonster = null;
            plot.autoCrop = null;
            if (growIntervals[plot.id]) {
                clearInterval(growIntervals[plot.id]);
                delete growIntervals[plot.id];
            }
            // 重置怪兽状态
            m.status = 'idle';
            m.assignment = null;
            recalled++;
        }
    });

    // 从探索队召回（zoneStates 中派遣的怪兽）
    Object.keys(gameState.zoneStates).forEach(function(zoneId) {
        var zs = gameState.zoneStates[zoneId];
        if (zs && zs.assignedMonsters && zs.assignedMonsters.length > 0) {
            zs.assignedMonsters.forEach(function(m) {
                m.status = 'idle';
                m.assignment = null;
                recalled++;
            });
            if (zs.autoTimer) {
                clearInterval(zs.autoTimer);
                zs.autoTimer = null;
            }
            zs.assignedMonsters = [];
        }
    });

    if (recalled === 0) {
        showNotification('没有正在工作的怪兽', 'info');
    } else {
        showNotification('已召回 ' + recalled + ' 只怪兽', 'success');
        renderAll();
    }
};

// ==================== 一键种植（手动地块）====================
window.autoPlantAll = function() {
    var availableCrops = cropTypes.filter(function(crop) {
        return !crop.requiredTech || gameState.technologies[crop.requiredTech];
    });
    if (availableCrops.length === 0) { showNotification('没有可种植的作物', 'info'); return; }
    var cropToPlant = availableCrops[0];
    var planted = 0;
    gameState.plots.forEach(function(plot) {
        if (!plot.locked && !plot.crop && !plot.assignedMonster) {
            plot.crop = cropToPlant.id;
            plot.plantedAt = Date.now();
            plot.progress = 0;
            planted++;
            startGrowTimer(plot.id);
        }
    });
    if (planted > 0) {
        showNotification('种植了 ' + planted + ' 块地（' + cropToPlant.name + '）', 'success');
        renderFarm();
    } else {
        showNotification('没有空闲的手动地块', 'info');
    }
};

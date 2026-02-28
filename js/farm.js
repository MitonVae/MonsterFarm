// ==================== 农场模块 ====================

// 地块生长计时器集合（plotId -> intervalId）
var growIntervals = {};

// ==================== 地块解锁 ====================
window.unlockPlot = function(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.locked) return;

    var cost = plot.unlockCost;
    var canAffordCoins = gameState.coins >= cost.coins;
    var canAffordMats  = gameState.materials >= cost.materials;
    var canUnlock = canAffordCoins && canAffordMats;

    var coinsLine = '<span style="color:' + (canAffordCoins ? '#f0c53d' : '#f85149') + ';">' +
        '💰 金币 ' + cost.coins +
        (!canAffordCoins ? ' <span style="font-size:12px;">（差 ' + (cost.coins - gameState.coins) + '）</span>' : ' ✓') +
        '</span>';
    var matsLine = '<span style="color:' + (canAffordMats ? '#c9d1d9' : '#f85149') + ';">' +
        '🪨 材料 ' + cost.materials +
        (!canAffordMats ? ' <span style="font-size:12px;">（差 ' + (cost.materials - gameState.materials) + '）</span>' : ' ✓') +
        '</span>';

    if (canUnlock) {
        showConfirmModal({
            title: '🔓 解锁农田',
            content: '解锁这块农田需要：<br><br>' + coinsLine + '<br>' + matsLine + '<br><br>确定解锁吗？',
            confirmText: '确认解锁',
            confirmClass: 'btn-primary',
            onConfirm: function() {
                gameState.coins -= cost.coins;
                gameState.materials -= cost.materials;
                plot.locked = false;
                showNotification('🔓 农田解锁成功！', 'success');
                renderAll();
            }
        });
    } else {
        showConfirmModal({
            title: '🔒 资源不足',
            content: '解锁此地块需要：<br><br>' + coinsLine + '<br>' + matsLine +
                '<br><br><span style="color:#8b949e;font-size:13px;">💡 通过探索区域获取材料，收获作物积累金币。</span>',
            confirmText: '知道了',
            confirmClass: 'btn-secondary',
            onConfirm: function() {}
        });
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
        // 空地块：弹出"种植 or 指派怪兽"二选一菜单
        showEmptyPlotMenu(plotId);
    } else if (plot.progress >= 100) {
        harvest(plotId);
    } else {
        // 生长中且无怪兽：可指派怪兽加速
        showGrowingPlotMenu(plotId);
    }
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

// ==================== 空地块菜单（种植 or 指派怪兽）====================
window.showEmptyPlotMenu = function(plotId) {
    var hasIdleMonsters = gameState.monsters.some(function(m) { return m.status === 'idle'; });
    var html =
        '<div class="modal-header">🌱 地块 #' + (plotId + 1) + ' · 空闲</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0 10px;">' +
        // ── 选项1：指派怪兽（自动化）──
        '<div onclick="closeModal();showPickMonsterForPlot(' + plotId + ');" style="padding:14px 16px;background:#1a2a1a;' +
            'border:2px solid #46d164;border-radius:10px;cursor:pointer;transition:background 0.15s;"' +
            ' onmouseover="this.style.background=\'#223322\'" onmouseout="this.style.background=\'#1a2a1a\'">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span style="font-size:28px;">🐾</span>' +
                '<div>' +
                    '<div style="font-weight:700;color:#46d164;font-size:14px;">指派怪兽驻守</div>' +
                    '<div style="font-size:12px;color:#8b949e;margin-top:3px;">自动化生产，支持设置专属作物，有专长加成</div>' +
                    (hasIdleMonsters ? '' : '<div style="font-size:11px;color:#f85149;margin-top:4px;">⚠ 当前没有空闲怪兽</div>') +
                '</div>' +
            '</div>' +
        '</div>' +
        // ── 选项2：手动种植 ──
        '<div onclick="closeModal();showPlantMenu(' + plotId + ');" style="padding:14px 16px;background:#21262d;' +
            'border:2px solid #30363d;border-radius:10px;cursor:pointer;transition:background 0.15s;"' +
            ' onmouseover="this.style.background=\'#30363d\'" onmouseout="this.style.background=\'#21262d\'">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span style="font-size:28px;">🌾</span>' +
                '<div>' +
                    '<div style="font-weight:700;color:#e6edf3;font-size:14px;">手动种植</div>' +
                    '<div style="font-size:12px;color:#8b949e;margin-top:3px;">成熟后需手动收获，无自动化加成</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-buttons"><button class="btn btn-secondary" onclick="closeModal()">取消</button></div>';
    showModal(html);
};

// ==================== 生长中地块菜单（可指派怪兽加速）====================
window.showGrowingPlotMenu = function(plotId) {
    var plot = gameState.plots[plotId];
    var ct   = cropTypes.find(function(c){ return c.id === plot.crop; });
    var hasIdleMonsters = gameState.monsters.some(function(m) { return m.status === 'idle'; });
    var html =
        '<div class="modal-header">🌿 地块 #' + (plotId + 1) + ' · 生长中</div>' +
        '<div style="background:#21262d;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:12px;color:#8b949e;">' +
            '<span style="color:#e6edf3;font-weight:700;">' + (ct ? ct.name : plot.crop) + '</span>' +
            ' · 进度 <span style="color:#58a6ff;">' + Math.floor(plot.progress) + '%</span>' +
        '</div>' +
        '<div onclick="closeModal();showPickMonsterForPlot(' + plotId + ');" style="padding:14px 16px;background:#1a2a1a;' +
            'border:2px solid #46d164;border-radius:10px;cursor:pointer;margin-bottom:10px;transition:background 0.15s;"' +
            ' onmouseover="this.style.background=\'#223322\'" onmouseout="this.style.background=\'#1a2a1a\'">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span style="font-size:28px;">🐾</span>' +
                '<div>' +
                    '<div style="font-weight:700;color:#46d164;font-size:14px;">派遣怪兽接管（加速生长）</div>' +
                    '<div style="font-size:12px;color:#8b949e;margin-top:3px;">派遣后提升耕作速度，成熟时自动收获</div>' +
                    (hasIdleMonsters ? '' : '<div style="font-size:11px;color:#f85149;margin-top:4px;">⚠ 当前没有空闲怪兽</div>') +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="modal-buttons"><button class="btn btn-secondary" onclick="closeModal()">取消</button></div>';
    showModal(html);
};

// ==================== 从地块入口选怪（含加成高亮）====================
// 让玩家直接从地块选怪兽，选完后指派到该地块
window.showPickMonsterForPlot = function(plotId) {
    var plot = gameState.plots[plotId];
    // 确定参考作物（用于加成排序）
    var cropId = plot.autoCrop || plot.crop || null;

    // 检查是否有空闲怪兽
    var idleMonsters = gameState.monsters.filter(function(m){ return m.status === 'idle'; });
    if (idleMonsters.length === 0) {
        showNotification('没有空闲怪兽！先去探索捕捉怪兽吧。', 'warning');
        return;
    }

    // 构建 cropId 对应的作物提示
    var cropHint = '';
    if (cropId) {
        var ct = cropTypes.find(function(c){ return c.id === cropId; });
        if (ct) {
            cropHint = '<div style="background:#161b22;border:1px solid #30363d;border-radius:6px;' +
                'padding:8px 12px;margin-bottom:8px;font-size:12px;color:#8b949e;">' +
                '当前作物：<span style="color:#e6edf3;font-weight:700;">' + ct.name + '</span>' +
                (ct.preferredMonster
                    ? '　专长怪兽：<span style="color:#46d164;font-weight:700;">' +
                      (monsterTypes[ct.preferredMonster] ? monsterTypes[ct.preferredMonster].name : ct.preferredMonster) +
                      '</span>　<span style="color:#46d164;">速度×1.25 优质率+15%</span>'
                    : '') +
                '</div>';
        }
    }

    // 使用 showMonsterPickModal（含筛选器）
    // 先用 showModal 注入提示 + 再调用选怪弹窗
    showMonsterPickModal({
        ctx:        'farm_plot_' + plotId,
        title:      '🐾 为地块 #' + (plotId + 1) + ' 选择驻守怪兽',
        monsters:   idleMonsters,
        pinCropType: cropId,
        showLineage: true,
        onSelect:   function(monsterId) {
            var ok = assignMonsterToPlot(monsterId, plotId);
            if (ok && !plot.autoCrop) {
                // 指派后弹出作物设置面板
                setTimeout(function(){ showPlotManagePanel(plotId); }, 200);
            }
        }
    });
};

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
            // 展示有加成的怪兽提示
            var prefMonster = crop.preferredMonster ? monsterTypes[crop.preferredMonster] : null;
            var bonusTip = prefMonster
                ? '<div style="font-size:11px;color:#46d164;margin-top:4px;">★ ' + prefMonster.name + ' 派驻可获得专长加成</div>'
                : '';
            return '<div style="padding: 15px; background: #21262d; border-radius: 8px; cursor: pointer; border: 2px solid #30363d;"' +
                ' onclick="plantCrop(' + plotId + ', \'' + crop.id + '\')"' +
                ' onmouseover="this.style.borderColor=\'#58a6ff\'"' +
                ' onmouseout="this.style.borderColor=\'#30363d\'">' +
                '<div style="font-weight: bold; margin-bottom: 5px;">' + crop.name + '</div>' +
                '<div style="font-size: 12px; color: #8b949e;">' +
                '生长时间: ' + crop.growTime/1000 + '秒 | 产量: ' + crop.yield + ' 食物 | 售价: ' + crop.value + ' 金币' +
                '</div><div style="font-size:13px;color:#58a6ff;margin-top:4px;">' + crop.desc + '</div>' +
                bonusTip +
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
    // 种植静默（简报已有记录）
    renderFarm();
    startGrowTimer(plotId);
};

// ==================== 自动种植作物设置 ====================
window.setAutoCrop = function(plotId, cropId) {
    var plot = gameState.plots[plotId];
    var oldCrop = plot.autoCrop;
    plot.autoCrop = cropId;
    var cropName = cropTypes.find(function(c){return c.id===cropId;}).name;
    if (!plot.crop) {
        // 地块空闲，直接启动自动循环
        startAutoCycle(plotId);
        closeModal();
        // 自动种植设置静默
    } else if (plot.crop !== cropId && plot.progress < 100) {
        // 切换了不同作物且当前作物未成熟：重置计时，种新作物
        plot.crop = cropId;
        plot.plantedAt = Date.now();
        plot.progress = 0;
        startGrowTimer(plotId);
        closeModal();
        // 切换作物静默
    } else if (plot.progress >= 100) {
        // 作物已成熟：立即触发收获（重启 timer 可重置 harvestScheduled 标志）
        startGrowTimer(plotId);
        closeModal();
        // 静默
    } else {
        // 相同作物且未成熟：仅更新 autoCrop，当前 timer 继续，下轮生效
        closeModal();
        // 静默
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
    // 惩罚：食物或金币耗尽时，自动耕作速度降低50%
    if (gameState.penalized && plot.assignedMonster) {
        mult *= 0.5;
    }
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
// 设计原则：timer 在整个作物生命周期内持续运行，不在成熟时停止。
// 这样无论用户打开/关闭面板、renderFarm 重建 DOM，下次 tick 都能
// 正确检测状态，避免"成熟后卡死闪烁"问题。
function startGrowTimer(plotId) {
    // 先清除已有 timer，防止重复
    if (growIntervals[plotId]) {
        clearInterval(growIntervals[plotId]);
        delete growIntervals[plotId];
    }
    var plot = gameState.plots[plotId];
    if (!plot || !plot.crop) return;

    // 记录启动时的作物 ID，用于检测"中途换作物"后的失效 timer
    var timerCrop = plot.crop;
    // 防止成熟后多次触发收获的标志
    var harvestScheduled = false;

    var intervalId = setInterval(function() {
        var p = gameState.plots[plotId];

        // 地块已清空或作物被换掉 → 此 timer 已过期，自毁
        if (!p || !p.crop || p.crop !== timerCrop) {
            clearInterval(intervalId);
            if (growIntervals[plotId] === intervalId) delete growIntervals[plotId];
            return;
        }

        var ct = cropTypes.find(function(c) { return c.id === p.crop; });
        if (!ct) {
            clearInterval(intervalId);
            if (growIntervals[plotId] === intervalId) delete growIntervals[plotId];
            return;
        }

        // ── 未成熟：更新进度 ──
        if (p.progress < 100) {
            harvestScheduled = false; // 重置标志（以防万一）
            var speedMult = calcSpeedMultiplier(p, p.assignedMonster);
            var elapsed = Date.now() - p.plantedAt;
            p.progress = Math.min(100, (elapsed / ct.growTime) * 100 * speedMult);
            updatePlotProgress(plotId);
            return;
        }

        // ── 已成熟 ──
        p.progress = 100; // 确保精确值

        if (!p.assignedMonster) {
            // 无怪兽：保持成熟等待手动收获；只在首次成熟时更新外观和通知
            if (!harvestScheduled) {
                harvestScheduled = true;
                updatePlotAppearance(plotId, true);
                // 成熟提示已由地块 UI 高亮显示，无需右上角弹窗
            }
            return; // timer 继续跑，以便状态恢复后能重新检测
        }

        if (!p.autoCrop) {
            // 有怪兽但未设置 autoCrop：同样保持成熟
            if (!harvestScheduled) {
                harvestScheduled = true;
                updatePlotAppearance(plotId, true);
            }
            return;
        }

        // 有怪兽且设置了 autoCrop：触发一次自动收获，之后停止此 timer
        if (!harvestScheduled) {
            harvestScheduled = true;
            updatePlotAppearance(plotId, true);
            // 停止当前 timer（收获完毕后 startAutoCycle 会启动新 timer）
            clearInterval(intervalId);
            if (growIntervals[plotId] === intervalId) delete growIntervals[plotId];
            autoHarvestPlot(plotId);
        }
    }, 500);  // 500ms 足够流畅，减少 CPU 唤醒次数
    growIntervals[plotId] = intervalId;
}

// ==================== 自动收获（怪兽驱动）====================
function autoHarvestPlot(plotId) {
    var plot = gameState.plots[plotId];
    if (!plot.crop || plot.progress < 100) return;
    var monster = plot.assignedMonster;
    var cropType = cropTypes.find(function(c) { return c.id === plot.crop; });
    var yieldAmt = cropType.yield;
    var valueAmt = cropType.value;
    // 全局产量倍率（考虑所有已解锁科技）
    var yieldMult = calcGlobalYieldMult();
    yieldAmt = yieldAmt * yieldMult;
    valueAmt = valueAmt * yieldMult;
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
    // 材料和研究点（来自作物特殊字段）
    var matYield = Math.floor((cropType.materialYield || 0) * yieldMult);
    var resYield = Math.floor((cropType.researchYield || 0) * yieldMult);
    gameState.food += yieldAmt;
    gameState.coins += valueAmt;
    if (matYield > 0) gameState.materials += matYield;
    gameState.research += resYield + (Math.random() < 0.25 ? Math.floor(Math.random() * 4) + 1 : 0);
    gameState.totalHarvests++;
    checkMilestones();
    var extras = (matYield > 0 ? ' +' + matYield + '材' : '') + (resYield > 0 ? ' +' + resYield + '研' : '');
    var msg = (isQuality ? '✨ 优质 ' : '') + cropType.name + ' 自动收获！+' + yieldAmt + '食 +' + valueAmt + '金' + extras;
    // 自动收获只推简报，优质品才弹通知
    if (isQuality) showNotification('✨ 优质 ' + cropType.name + ' 收获！+' + yieldAmt + '食 +' + valueAmt + '金', 'success');
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
    var yieldMult = calcGlobalYieldMult();
    var yieldAmount = Math.floor(cropType.yield * yieldMult);
    var valueAmount = Math.floor(cropType.value * yieldMult);
    var matYield    = Math.floor((cropType.materialYield  || 0) * yieldMult);
    var resYield    = Math.floor((cropType.researchYield  || 0) * yieldMult);
    gameState.food      += yieldAmount;
    gameState.coins     += valueAmount;
    gameState.materials += matYield;
    gameState.research  += resYield + (Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 1 : 0);
    gameState.totalHarvests++;
    checkMilestones();
    var extras = (matYield > 0 ? ' +' + matYield + '材料' : '') + (resYield > 0 ? ' +' + resYield + '研究' : '');
    // 手动收获：只走简报，不弹右上角通知
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
    // 撤回走简报，不弹右上角
    if (typeof briefSystem === 'function') briefSystem(monster.name + ' 已从地块撤回');
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
    // 派驻走简报，不弹右上角
    if (typeof briefSystem === 'function') briefSystem(monster.name + ' 驻守地块 #' + (plotId+1));
    // 引导钩子：Step4 选择地块 → Step5
    if (typeof onTutorialPlotPicked === 'function') onTutorialPlotPicked();
    renderFarm();
    renderSidebarMonsters();
    return true;
};

// ==================== 选择地块派怪兽（地块选择器）====================
window.showAssignPlotPicker = function(monsterId) {
    // ── 引导钩子：点击"派驻农田"→ Step3 assign_farm → Step4 pick_plot ──
    // 无论从侧边栏按钮还是详情弹窗触发，均在此统一处理
    if (typeof onTutorialAssignFarm === 'function') onTutorialAssignFarm();

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
        availablePlots.map(function(plot, idx) {
            var status = plot.crop ? '生长中 ' + Math.floor(plot.progress) + '%' : '空闲';
            // 引导模式下，第一个地块加 id 供高亮聚焦
            var isTut = (typeof tutorialState !== 'undefined' && tutorialState.active && tutorialState.waitingForPlotPick);
            var idAttr = (isTut && idx === 0) ? ' id="tut-first-plot"' : '';
            return '<div' + idAttr + ' onclick="assignMonsterToPlot(' + monsterId + ',' + plot.id + ');closeModal();"' +
                ' style="aspect-ratio:1;background:#21262d;border:2px dashed #30363d;border-radius:10px;' +
                'display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:10px;text-align:center;"' +
                ' onmouseover="this.style.borderColor=\'#58a6ff\';this.style.background=\'#30363d\'"' +
                ' onmouseout="this.style.borderColor=\'#30363d\';this.style.background=\'#21262d\'">' +
                '<div style="font-size:20px;margin-bottom:5px;">🌱</div>' +
                '<div style="font-size:12px;font-weight:bold;">地块 #' + (plot.id+1) + '</div>' +
                '<div style="font-size:13px;color:#8b949e;">' + status + '</div></div>';
        }).join('') +
        // 引导模式下隐藏取消按钮，强制玩家选择地块
        '</div>' + ((typeof tutorialState !== 'undefined' && tutorialState.active && tutorialState.waitingForPlotPick)
            ? ''
            : '<div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">取消</button></div>');
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
    // 保存走简报，不弹右上角
    if (typeof briefSave === 'function') briefSave(false);
};

// ==================== 一键召回：二次确认弹窗 ====================
window.confirmRecallAll = function() {
    // 统计当前在岗怪兽数量
    var count = 0;
    gameState.plots.forEach(function(p) { if (p.assignedMonster) count++; });
    Object.keys(gameState.zoneStates || {}).forEach(function(zid) {
        var zs = gameState.zoneStates[zid];
        if (zs && zs.assignedMonsters) count += zs.assignedMonsters.length;
    });

    if (count === 0) {
        showModal(
            '<div style="text-align:center;padding:24px 16px;">' +
            '<div style="font-size:36px;margin-bottom:12px;">😴</div>' +
            '<div style="font-size:15px;font-weight:600;color:#e6edf3;margin-bottom:6px;">没有在岗的怪兽</div>' +
            '<div style="font-size:13px;color:#8b949e;margin-bottom:20px;">所有怪兽当前都处于待机状态。</div>' +
            '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>' +
            '</div>'
        );
        return;
    }

    showModal(
        '<div style="text-align:center;padding:24px 16px;">' +
        '<div style="font-size:36px;margin-bottom:12px;">⚠️</div>' +
        '<div style="font-size:15px;font-weight:600;color:#e6edf3;margin-bottom:8px;">确认一键召回？</div>' +
        '<div style="font-size:13px;color:#8b949e;margin-bottom:20px;">' +
        '当前共有 <span style="color:#f0c53d;font-weight:700;">' + count + '</span> 只怪兽正在作业，<br>' +
        '召回后所有进行中的任务将<span style="color:#f85149;">立即中断</span>。' +
        '</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;">' +
        '<button class="btn btn-secondary" onclick="closeModal()" style="min-width:90px;">取消</button>' +
        '<button class="btn btn-warning" onclick="recallAllMonsters();closeModal();" style="min-width:90px;">确认召回</button>' +
        '</div>' +
        '</div>'
    );
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

// ==================== 存档恢复：重启所有生长计时器 ====================
// 在 loadGame() 之后调用，恢复所有正在生长/等待收获的地块计时器
window.restoreGrowTimers = function() {
    gameState.plots.forEach(function(plot) {
        if (plot.locked) return;

        // ── 特殊情况：crop 为空但有怪兽+autoCrop ──
        // 说明存档恰好发生在 autoHarvestPlot 清空 crop 后、startAutoCycle 执行前的 500ms 窗口
        // 直接重启自动循环即可
        if (!plot.crop) {
            if (plot.assignedMonster && plot.autoCrop) {
                var delay = plot.id * 300;
                setTimeout(function() { startAutoCycle(plot.id); }, delay);
            }
            return;
        }

        if (plot.progress >= 100) {
            // 已成熟：无论有无怪兽，都启动 timer。
            // timer 内部会处理：有怪兽→自动收获，无怪兽→保持成熟显示。
            // 这样可确保 renderFarm 重建 DOM 后外观也能被 timer 持续修正。
            startGrowTimer(plot.id);
        } else {
            // 仍在生长中：补偿离线时间后重启计时器
            // plantedAt 已保存，elapsed 自动包含离线时长，progress 会在 timer 首次 tick 时更新
            startGrowTimer(plot.id);
        }
    });
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

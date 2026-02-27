// ==================== 探索模块（区域探索版）====================

// ── 工具：检查区域解锁条件 ──
function checkZoneCondition(zone) {
    var cond = zone.unlockCondition;
    if (!cond) return true;

    function checkSingle(c) {
        switch (c.type) {
            case 'coins':            return gameState.coins >= c.value;
            case 'materials':        return gameState.materials >= c.value;
            case 'research':         return gameState.research >= c.value;
            case 'totalExplorations':return gameState.totalExplorations >= c.value;
            case 'monsterCount':     return gameState.monsters.length >= c.value;
            case 'tech':             return !!gameState.technologies[c.value];
            case 'allTech':          return Object.keys(technologies).every(function(k) { return gameState.technologies[k]; });
            case 'purchase':         return !!gameState.purchasedZones[zone.id];
            default: return false;
        }
    }

    if (cond.type === 'compound') {
        return cond.conditions.every(checkSingle);
    }
    if (cond.type === 'purchase') {
        return !!gameState.purchasedZones[zone.id];
    }
    return checkSingle(cond);
}

// ── 工具：获取或初始化区域状态 ──
function getZoneState(zoneId) {
    if (!gameState.zoneStates[zoneId]) {
        gameState.zoneStates[zoneId] = {
            progress: 0,
            assignedMonsterIds: [],
            autoTimerId: null
        };
    }
    return gameState.zoneStates[zoneId];
}

// ── 工具：计算区域自动探索速度（进度/秒）──
function calcAutoSpeed(zone, monsterIds) {
    var base = 1.5; // 基础每秒进度
    var total = base;
    monsterIds.forEach(function(mid) {
        var m = gameState.monsters.find(function(x) { return x.id === mid; });
        if (!m) return;
        // 力量+敏捷+智力 合计，每10点加1进度/秒
        var power = (m.stats.strength || 0) + (m.stats.agility || 0) + (m.stats.intelligence || 0);
        total += power / 10;
    });
    // 探索科技加成 +50%
    if (gameState.technologies['exploration']) total *= 1.5;
    return total;
}

// ── 核心：探索结算 ──
function settleZone(zone) {
    var zs = getZoneState(zone.id);
    var r = zone.rewards;

    // 基础奖励
    var coins    = Math.floor(Math.random() * (r.coins[1]    - r.coins[0]    + 1)) + r.coins[0];
    var food     = Math.floor(Math.random() * (r.food[1]     - r.food[0]     + 1)) + r.food[0];
    var mats     = Math.floor(Math.random() * (r.materials[1]- r.materials[1]  + 1)) + r.materials[0];
    var research = Math.floor(Math.random() * (r.research[1] - r.research[0] + 1)) + r.research[0];

    // 派遣加成：怪兽数量 * 10%
    var bonus = 1 + zs.assignedMonsterIds.length * 0.1;
    if (gameState.technologies['exploration']) bonus *= 1.5;

    coins    = Math.floor(coins    * bonus);
    food     = Math.floor(food     * bonus);
    mats     = Math.floor(mats     * bonus);
    research = Math.floor(research * bonus);

    gameState.coins    += coins;
    gameState.food     += food;
    gameState.materials+= mats;
    gameState.research += research;
    gameState.totalExplorations++;

    // 怪兽经验
    zs.assignedMonsterIds.forEach(function(mid) {
        var m = gameState.monsters.find(function(x) { return x.id === mid; });
        if (m) gainExp(m, 20 + Math.floor(Math.random() * 15));
    });

    // 捕获判定（引导第一步必定捕获）
    var caught = null;
    var catchRoll = (typeof tutorialState !== 'undefined' && tutorialState.guaranteeCatch)
        ? 1.0 : Math.random();
    if (catchRoll < zone.catchChance || tutorialState && tutorialState.guaranteeCatch) {
        var typeId = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
        caught = createMonster(typeId);
    }

    // 通知
    var rewardText = '金币+' + coins;
    if (food     > 0) rewardText += ' 食物+'  + food;
    if (mats     > 0) rewardText += ' 材料+'  + mats;
    if (research > 0) rewardText += ' 研究+'  + research;
    showNotification(zone.icon + ' ' + zone.name + ' 探索完成！' + rewardText, 'success');

    // 简报：探索结算（取派遣怪兽之一的名字作代表，或标为手动）
    var repMonsterName = null;
    if (zs.assignedMonsterIds && zs.assignedMonsterIds.length > 0) {
        var repM = gameState.monsters.find(function(x) { return x.id === zs.assignedMonsterIds[0]; });
        if (repM) repMonsterName = repM.name;
    }
    if (typeof briefExplore === 'function') briefExplore(zone.name, { coins: coins, food: food, materials: mats, research: research }, repMonsterName);

    if (caught) {
        var rarity = monsterTypes[caught.type].rarity;
        var rarityLabel = { common:'普通', uncommon:'优良', rare:'稀有', epic:'史诗', legendary:'传说' }[rarity] || '';
        showNotification('🎉 捕获了 [' + rarityLabel + '] ' + caught.name + '！', 'success');
        if (typeof briefCatch === 'function') briefCatch(caught.name + '（' + rarityLabel + '）', zone.name);
        // 触发引导系统钩子
        if (typeof onTutorialMonsterCaught === 'function') onTutorialMonsterCaught();
    }

    // 重置进度
    zs.progress = 0;
    updateResources();
    renderMonsterSidebar();
    renderExploration();
}

// ── 手动点击探索 ──
window.manualExplore = function(zoneId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone) return;
    if (!checkZoneCondition(zone)) { showNotification('区域尚未解锁！', 'warning'); return; }

    var zs = getZoneState(zoneId);
    // 有派遣怪兽时不允许手动（自动中）
    if (zs.assignedMonsterIds.length > 0) {
        showNotification('已有怪兽在此自动探索，无需手动点击。', 'info');
        return;
    }
    if (gameState.energy < zone.energyCostManual) {
        showNotification('能量不足！需要 ' + zone.energyCostManual + ' 点能量', 'error');
        return;
    }

    gameState.energy -= zone.energyCostManual;
    var gain = zone.progressPerClick[0] + Math.floor(Math.random() * (zone.progressPerClick[1] - zone.progressPerClick[0] + 1));
    zs.progress = Math.min(100, zs.progress + gain);

    if (zs.progress >= 100) {
        settleZone(zone);
    } else {
        updateResources();
        renderExploration();
    }
};

// ── 派遣怪兽到区域 ──
window.assignMonsterToZone = function(zoneId, monsterId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone || !checkZoneCondition(zone)) { showNotification('区域尚未解锁！', 'warning'); return; }

    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster || monster.status !== 'idle') { showNotification('该怪兽不可用！', 'warning'); return; }

    var zs = getZoneState(zoneId);
    if (zs.assignedMonsterIds.indexOf(monsterId) !== -1) return;
    if (zs.assignedMonsterIds.length >= 4) { showNotification('该区域最多派遣4只怪兽！', 'warning'); return; }

    zs.assignedMonsterIds.push(monsterId);
    monster.status = 'exploring';
    monster.assignment = 'zone-' + zoneId;

    // 启动自动计时器
    startZoneAutoTimer(zone);
    // 派遣探索静默
    renderMonsterSidebar();
    renderExploration();
};

// ── 召回怪兽（从区域）──
window.recallMonsterFromZone = function(zoneId, monsterId) {
    var zs = getZoneState(zoneId);
    var idx = zs.assignedMonsterIds.indexOf(monsterId);
    if (idx === -1) return;
    zs.assignedMonsterIds.splice(idx, 1);

    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (monster) { monster.status = 'idle'; monster.assignment = null; }

    // 若无怪兽则停止计时器
    if (zs.assignedMonsterIds.length === 0) {
        stopZoneAutoTimer(zs);
    }

    // 召回探索静默
    renderMonsterSidebar();
    renderExploration();
};

// ── 自动计时器管理 ──
function startZoneAutoTimer(zone) {
    var zs = getZoneState(zone.id);
    if (zs.autoTimerId) return; // 已在运行

    zs.autoTimerId = setInterval(function() {
        if (zs.assignedMonsterIds.length === 0) {
            stopZoneAutoTimer(zs);
            return;
        }
        var speed = calcAutoSpeed(zone, zs.assignedMonsterIds);
        zs.progress += speed;
        if (zs.progress >= 100) {
            zs.progress = 0;
            settleZone(zone);
        } else {
            // 只刷新进度条，不重绘整页（避免抖动）
            var barEl = document.getElementById('zone-bar-' + zone.id);
            var pctEl = document.getElementById('zone-pct-' + zone.id);
            if (barEl) barEl.style.width = Math.min(100, zs.progress).toFixed(1) + '%';
            if (pctEl) pctEl.textContent  = Math.floor(zs.progress) + '%';
        }
    }, 1000);
}

function stopZoneAutoTimer(zs) {
    if (zs.autoTimerId) {
        clearInterval(zs.autoTimerId);
        zs.autoTimerId = null;
    }
}

// ── 购买通行证 ──
window.purchaseZonePass = function(zoneId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone || zone.unlockCondition.type !== 'purchase') return;
    var cost = zone.unlockCondition.value;
    if (gameState.coins < cost) { showNotification('金币不足！需要 ' + cost + ' 金币', 'error'); return; }
    gameState.coins -= cost;
    gameState.purchasedZones[zoneId] = true;
    showNotification('已购买 ' + zone.icon + zone.name + ' 探险通行证！', 'success');
    updateResources();
    renderExploration();
};

// ── 主渲染函数 ──
window.renderExploration = function() {
    var el = document.getElementById('explorationArea');
    if (!el) return;

    var rarityColor = { common:'#8b949e', uncommon:'#2196f3', rare:'#ff9800', epic:'#9c27b0', legendary:'#ffd700' };
    var rarityName  = { common:'普通', uncommon:'优良', rare:'稀有', epic:'史诗', legendary:'传说' };

    var html = '<div class="expl-header"><h2>🗺 野外探索</h2>' +
        '<p style="color:#8b949e;font-size:13px;margin:4px 0 0;">探索各区域可获得资源，并有机会捕获野生怪兽。手动点击或派遣怪兽自动探索。</p>' +
        '<div class="expl-stats">' +
        '<span>⚡ 能量：<strong style="color:#58a6ff;">' + gameState.energy + '/' + gameState.maxEnergy + '</strong></span>' +
        '<span>📊 总探索：<strong style="color:#46d164;">' + gameState.totalExplorations + '</strong></span>' +
        '</div></div>';

    html += '<div class="expl-zone-grid">';

    explorationZones.forEach(function(zone, idx) {
        var isUnlocked = checkZoneCondition(zone);
        var zs = getZoneState(zone.id);
        var progress = Math.min(100, zs.progress);
        var assigned = zs.assignedMonsterIds.map(function(mid) {
            return gameState.monsters.find(function(m) { return m.id === mid; });
        }).filter(Boolean);
        var isAutoRunning = assigned.length > 0;
        var speed = isAutoRunning ? calcAutoSpeed(zone, zs.assignedMonsterIds).toFixed(1) : 0;

        // 未解锁区域
        if (!isUnlocked) {
            var cond = zone.unlockCondition;
            var condHtml = '';
            if (cond.type === 'compound') {
                condHtml = cond.conditions.map(function(c) {
                    var met = checkZoneCondition({ unlockCondition: c });
                    return '<div class="expl-cond ' + (met ? 'met' : '') + '">' + (met ? '✅' : '🔒') + ' ' + c.label + '</div>';
                }).join('');
            } else if (cond.type === 'purchase') {
                condHtml = '<div class="expl-cond">💰 ' + cond.label + '</div>' +
                    '<button class="btn btn-warning expl-purchase-btn" onclick="purchaseZonePass(\'' + zone.id + '\')">' +
                    '花费 ' + cond.value + ' 金币解锁</button>';
            } else {
                var met = checkZoneCondition(zone);
                condHtml = '<div class="expl-cond ' + (met ? 'met' : '') + '">' + (met ? '✅' : '🔒') + ' ' + cond.label + '</div>';
            }

            html += '<div class="expl-zone locked">' +
                '<div class="expl-zone-header">' +
                '<span class="expl-zone-icon">' + zone.icon + '</span>' +
                '<div><div class="expl-zone-name locked-name">' + zone.name + '</div>' +
                '<div class="expl-zone-depth">深度 ' + (idx + 1) + '/10</div></div>' +
                '</div>' +
                '<div class="expl-lock-info"><div style="color:#8b949e;font-size:12px;margin-bottom:8px;">解锁条件：</div>' +
                condHtml + '</div>' +
                '</div>';
            return;
        }

        // 可遇怪兽标签
        var monsterTags = zone.monsters.map(function(tid) {
            var td = monsterTypes[tid];
            if (!td) return '';
            var rc = rarityColor[td.rarity] || '#8b949e';
            var rn = rarityName[td.rarity]  || '';
            return '<span class="expl-monster-tag" style="border-color:' + rc + ';color:' + rc + ';">' +
                td.name + ' <span style="opacity:.7;font-size:12px;">[' + rn + ']</span></span>';
        }).join('');

        // 已派遣怪兽
        var assignedHtml = '';
        if (assigned.length > 0) {
            assignedHtml = '<div class="expl-assigned">' +
                assigned.map(function(m) {
                    var td = monsterTypes[m.type];
                    return '<div class="expl-assigned-item" title="点击召回">' +
                        '<span style="color:' + (td ? td.color : '#fff') + ';">' + createSVG(m.type, 20) + '</span>' +
                        '<span class="expl-assigned-name">' + m.name + '</span>' +
                        '<span class="expl-assigned-lv">Lv.' + m.level + '</span>' +
                        '<button class="expl-recall-btn" onclick="event.stopPropagation();recallMonsterFromZone(\'' + zone.id + '\',' + m.id + ')">召回</button>' +
                        '</div>';
                }).join('') +
                '</div>';
        }

        // 派遣按钮
        var dispatchBtn = '';
        if (assigned.length < 4) {
            var idleMonsters = gameState.monsters.filter(function(m) { return m.status === 'idle'; });
            if (idleMonsters.length > 0) {
                dispatchBtn = '<button class="btn btn-warning expl-dispatch-btn" onclick="showDispatchPicker(\'' + zone.id + '\')">' +
                    '+ 派遣怪兽</button>';
            } else {
                dispatchBtn = '<button class="btn expl-dispatch-btn" disabled style="opacity:.4;">无可用怪兽</button>';
            }
        }

        // 手动按钮（无派遣时显示）
        var manualBtn = '';
        if (!isAutoRunning) {
            var canClick = gameState.energy >= zone.energyCostManual;
            manualBtn = '<button class="btn btn-primary expl-manual-btn ' + (canClick ? '' : 'disabled') + '" ' +
                'onclick="manualExplore(\'' + zone.id + '\')" ' + (canClick ? '' : 'disabled') + '>' +
                '⚡ 探索 (-' + zone.energyCostManual + '能量)' +
                '</button>';
        }

        // 速度提示
        var speedHtml = isAutoRunning
            ? '<span class="expl-speed">⚙ 自动 ' + speed + '%/s</span>'
            : '<span class="expl-speed">手动模式</span>';

        html += '<div class="expl-zone ' + (isAutoRunning ? 'auto-running' : '') + '">' +
            // 头部
            '<div class="expl-zone-header">' +
            '<span class="expl-zone-icon">' + zone.icon + '</span>' +
            '<div style="flex:1;">' +
            '<div class="expl-zone-name">' + zone.name + '</div>' +
            '<div class="expl-zone-depth">深度 ' + (idx + 1) + '/10 · 遭遇：' + monsterTags + '</div>' +
            '</div>' +
            speedHtml +
            '</div>' +
            // 描述
            '<div class="expl-zone-desc">' + zone.desc + '</div>' +
            // 奖励预览
            '<div class="expl-rewards">' +
            (zone.rewards.coins[1]    > 0 ? '<span>🪙 ' + zone.rewards.coins[0]    + '~' + zone.rewards.coins[1]    + '</span>' : '') +
            (zone.rewards.food[1]     > 0 ? '<span>🌾 ' + zone.rewards.food[0]     + '~' + zone.rewards.food[1]     + '</span>' : '') +
            (zone.rewards.materials[1]> 0 ? '<span>🔩 ' + zone.rewards.materials[0]+ '~' + zone.rewards.materials[1]+ '</span>' : '') +
            (zone.rewards.research[1] > 0 ? '<span>🔬 ' + zone.rewards.research[0] + '~' + zone.rewards.research[1] + '</span>' : '') +
            '</div>' +
            // 进度条
            '<div class="expl-progress-wrap">' +
            '<div class="expl-progress-track">' +
            '<div class="expl-progress-fill ' + (isAutoRunning ? 'auto' : '') + '" id="zone-bar-' + zone.id + '" style="width:' + progress.toFixed(1) + '%;"></div>' +
            '</div>' +
            '<span class="expl-progress-pct" id="zone-pct-' + zone.id + '">' + Math.floor(progress) + '%</span>' +
            '</div>' +
            // 已派遣
            assignedHtml +
            // 操作按钮行
            '<div class="expl-actions">' + manualBtn + dispatchBtn + '</div>' +
            '</div>';
    });

    html += '</div>';
    el.innerHTML = html;

    // 恢复自动计时器（切换标签页后重挂）
    explorationZones.forEach(function(zone) {
        var zs = getZoneState(zone.id);
        if (zs.assignedMonsterIds.length > 0 && !zs.autoTimerId) {
            startZoneAutoTimer(zone);
        }
    });
};

// ── 弹出派遣选择器 ──
window.showDispatchPicker = function(zoneId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone) return;
    var idleMonsters = gameState.monsters.filter(function(m) { return m.status === 'idle'; });

    var html = '<div class="modal-header">' + zone.icon + ' 派遣怪兽前往 ' + zone.name + '</div>' +
        '<p style="color:#8b949e;font-size:12px;margin:0 0 12px;">派遣怪兽后将自动探索，每只怪兽提升10%奖励并加快进度速度。</p>' +
        '<div style="max-height:380px;overflow-y:auto;">';

    if (idleMonsters.length === 0) {
        html += '<div style="text-align:center;padding:30px;color:#8b949e;">所有怪兽都在忙碌中</div>';
    } else {
        html += idleMonsters.map(function(m) {
            var td = monsterTypes[m.type];
            var power = (m.stats.strength || 0) + (m.stats.agility || 0) + (m.stats.intelligence || 0);
            var speedContrib = (power / 10).toFixed(1);
            return '<div class="expl-picker-item" onclick="assignMonsterToZone(\'' + zoneId + '\',' + m.id + ');closeModal();">' +
                '<div style="background:#0d1117;border-radius:8px;padding:4px;">' + createSVG(m.type, 32) + '</div>' +
                '<div style="flex:1;margin-left:10px;">' +
                '<div style="font-weight:700;">' + m.name + '</div>' +
                '<div style="font-size:13px;color:#8b949e;">Lv.' + m.level + ' · ' + (td ? td.name : m.type) +
                ' · 力量' + m.stats.strength + ' 敏捷' + m.stats.agility + ' 智力' + m.stats.intelligence + '</div>' +
                '</div>' +
                '<div style="text-align:right;font-size:13px;">' +
                '<div style="color:#58a6ff;">+' + speedContrib + '%/s</div>' +
                '<div style="color:#46d164;">奖励+10%</div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    html += '</div><div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">取消</button></div>';
    showModal(html);
};

// ── 兼容旧的 assignMonsterToExpedition（保留接口，重定向到区域0）──
window.assignMonsterToExpedition = function(monsterId) {
    showDispatchPicker('farm_edge');
};
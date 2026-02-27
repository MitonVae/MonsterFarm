// ==================== 探索模块（区域探索版）====================

// ── 工具：根据条件对象生成可读文字描述 ──
function _condLabel(c) {
    if (c.label) return c.label;
    switch (c.type) {
        case 'coins':             return '金币 ≥ ' + c.value;
        case 'materials':         return '材料 ≥ ' + c.value;
        case 'research':          return '研究点 ≥ ' + c.value;
        case 'food':              return '食物 ≥ ' + c.value;
        case 'totalExplorations': return '完成探索 ≥ ' + c.value + ' 次';
        case 'monsterCount':      return '拥有怪兽 ≥ ' + c.value + ' 只';
        case 'monstersBreed':     return '怪兽繁殖 ≥ ' + c.value + ' 次';
        case 'tech': {
            var td = (typeof technologies !== 'undefined') && technologies[c.value];
            return '解锁科技「' + (td ? td.name : c.value) + '」';
        }
        case 'allTech':           return c.label || '解锁全部科技';
        case 'purchase':          return '花费 ' + c.value + ' 金币购买通行证';
        default:                  return c.type + (c.value !== undefined ? ' ≥ ' + c.value : '');
    }
}

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
    // 探索结算走简报，不弹右上角

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

// ── 一键派遣：将所有空闲怪兽分配到有空位的已解锁区域 ──
window.dispatchAllIdle = function() {
    var idleMonsters = gameState.monsters.filter(function(m) { return m.status === 'idle'; });
    if (idleMonsters.length === 0) { showNotification('没有空闲怪兽可派遣！', 'info'); return; }

    var unlockedZones = explorationZones.filter(function(z) {
        if (!checkZoneCondition(z)) return false;
        var zs = getZoneState(z.id);
        return zs.assignedMonsterIds.length < 4;
    });
    if (unlockedZones.length === 0) { showNotification('所有已解锁区域均已满员！', 'info'); return; }

    var dispatched = 0;
    var zi = 0; // zone index
    idleMonsters.forEach(function(m) {
        // 找下一个有空位的区域
        while (zi < unlockedZones.length) {
            var zs = getZoneState(unlockedZones[zi].id);
            if (zs.assignedMonsterIds.length < 4) break;
            zi++;
        }
        if (zi >= unlockedZones.length) return;
        assignMonsterToZone(unlockedZones[zi].id, m.id);
        dispatched++;
        // 如果该区域已满，移向下一个
        var zs2 = getZoneState(unlockedZones[zi].id);
        if (zs2.assignedMonsterIds.length >= 4) zi++;
    });

    if (dispatched > 0) {
        showNotification('已一键派遣 ' + dispatched + ' 只怪兽前往探索！', 'success');
        renderExploration();
    } else {
        showNotification('派遣失败，请检查区域或怪兽状态。', 'warning');
    }
};

// ── 一键驻守：将所有空闲怪兽全部送往同一个指定区域 ──
window.garrisonAllToZone = function(zoneId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone || !checkZoneCondition(zone)) { showNotification('区域尚未解锁！', 'warning'); return; }

    var zs = getZoneState(zoneId);
    var idleMonsters = gameState.monsters.filter(function(m) { return m.status === 'idle'; });
    if (idleMonsters.length === 0) { showNotification('没有空闲怪兽可派遣！', 'info'); return; }

    var dispatched = 0;
    idleMonsters.forEach(function(m) {
        if (zs.assignedMonsterIds.length >= 4) return;
        assignMonsterToZone(zoneId, m.id);
        dispatched++;
    });

    if (dispatched > 0) {
        showNotification('已将 ' + dispatched + ' 只怪兽驻守至 ' + zone.icon + zone.name + '！', 'success');
    } else {
        showNotification('该区域已满员（最多4只）！', 'info');
    }
};

// ── 一键召回：从所有区域召回全部怪兽 ──
window.recallAllMonsters = function() {
    var recalled = 0;
    explorationZones.forEach(function(zone) {
        var zs = getZoneState(zone.id);
        var toRecall = zs.assignedMonsterIds.slice(); // 复制避免边改边迭代
        toRecall.forEach(function(mid) {
            recallMonsterFromZone(zone.id, mid);
            recalled++;
        });
    });
    if (recalled > 0) {
        showNotification('已召回全部 ' + recalled + ' 只探索中的怪兽！', 'success');
    } else {
        showNotification('当前没有派遣中的怪兽。', 'info');
    }
};

// ── 主渲染函数 ──
window.renderExploration = function() {
    var el = document.getElementById('explorationArea');
    if (!el) return;

    var rarityColor = { common:'#8b949e', uncommon:'#2196f3', rare:'#ff9800', epic:'#9c27b0', legendary:'#ffd700' };
    var rarityName  = { common:'普通', uncommon:'优良', rare:'稀有', epic:'史诗', legendary:'传说' };
    var layout = getLayoutPref('exploration');

    // 统计状态数字
    var totalAssigned  = 0;
    var totalIdle      = gameState.monsters.filter(function(m){ return m.status === 'idle'; }).length;
    explorationZones.forEach(function(z){ totalAssigned += getZoneState(z.id).assignedMonsterIds.length; });

    // ── 工具栏 ──
    var html = renderLayoutToolbar(
        'exploration',
        '🗺 野外探索',
        [],
        'renderExploration'
    );
    // 副标题+状态 + 一键操作按钮
    html += '<div style="padding:0 20px 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
        '<span style="color:#8b949e;font-size:0.8571rem;">探索各区域可获得资源，并有机会捕获野生怪兽</span>' +
        '<span style="color:#8b949e;font-size:0.8571rem;">⚡ <strong style="color:#58a6ff;">' + gameState.energy + '/' + gameState.maxEnergy + '</strong>' +
        ' &nbsp;📊 <strong style="color:#46d164;">' + gameState.totalExplorations + '</strong>' +
        ' &nbsp;🐾 探索中 <strong style="color:#e0a02f;">' + totalAssigned + '</strong>' +
        ' / 空闲 <strong style="color:#46d164;">' + totalIdle + '</strong></span>' +
        // 一键操作按钮组
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;">' +
            (totalIdle > 0
                ? '<button class="btn btn-warning" style="font-size:12px;padding:4px 12px;" ' +
                  'onclick="dispatchAllIdle()" title="将所有空闲怪兽依次分配到有空位的已解锁区域">⚡ 一键派遣(' + totalIdle + ')</button>'
                : '') +
            (totalAssigned > 0
                ? '<button class="btn btn-secondary" style="font-size:12px;padding:4px 12px;border-color:#da3633;color:#f85149;" ' +
                  'onclick="recallAllMonsters()" title="召回所有探索中的怪兽">↩ 全部召回(' + totalAssigned + ')</button>'
                : '') +
        '</div>' +
        '</div>';

    if (layout === 'compact') {
        // ────────── 紧凑模式 ──────────
        html += '<div class="compact-list">';
        explorationZones.forEach(function(zone, idx) {
            var isUnlocked = checkZoneCondition(zone);
            var zs = getZoneState(zone.id);
            var progress = Math.min(100, zs.progress);
            var assigned = zs.assignedMonsterIds.map(function(mid) {
                return gameState.monsters.find(function(m) { return m.id === mid; });
            }).filter(Boolean);
            var isAutoRunning = assigned.length > 0;
            var speed = isAutoRunning ? calcAutoSpeed(zone, zs.assignedMonsterIds).toFixed(1) : 0;

            if (!isUnlocked) {
                html += '<div class="compact-card locked">' +
                    '<span class="compact-icon-emoji">' + zone.icon + '</span>' +
                    '<span class="compact-name" style="color:#8b949e;">' + zone.name + '</span>' +
                    '<span class="compact-sub">深度 ' + (idx+1) + '/10</span>' +
                    '<div class="compact-spacer"></div>' +
                    '<span class="compact-status locked">🔒 未解锁</span>' +
                    '</div>';
                return;
            }

            // 已解锁区域
            var statusLabel = isAutoRunning
                ? '<span class="compact-status auto">⚙ ' + speed + '%/s · ' + assigned.length + '只</span>'
                : '<span class="compact-status idle">手动</span>';

            var canClick = gameState.energy >= zone.energyCostManual;
            var actionHtml = '<div class="compact-actions" onclick="event.stopPropagation();">';
            if (!isAutoRunning) {
                actionHtml += '<button class="compact-btn' + (canClick ? '' : ' disabled') + '" ' +
                    (canClick ? 'onclick="manualExplore(\'' + zone.id + '\')"' : 'disabled') + '>⚡-' + zone.energyCostManual + '</button>';
            } else {
                // 召回第一只
                actionHtml += '<button class="compact-btn danger" onclick="recallMonsterFromZone(\'' + zone.id + '\',' + assigned[0].id + ')">召回</button>';
            }
            // 派遣按钮（未满4时显示）
            if (assigned.length < 4 && gameState.monsters.some(function(m){return m.status==='idle';})) {
                actionHtml += '<button class="compact-btn warn" onclick="showDispatchPicker(\'' + zone.id + '\')">+ 派遣</button>';
            }
            actionHtml += '</div>';

            var rewardsHtml = '<div class="compact-rewards">' +
                (zone.rewards.coins[1]    > 0 ? '<span class="compact-reward-tag">🪙' + zone.rewards.coins[0]    + '~' + zone.rewards.coins[1] + '</span>' : '') +
                (zone.rewards.materials[1]> 0 ? '<span class="compact-reward-tag">�' + zone.rewards.materials[0]+ '~' + zone.rewards.materials[1] + '</span>' : '') +
                '</div>';

            html += '<div class="compact-card ' + (isAutoRunning ? 'auto-running' : '') + '" onclick="showZoneDetailModal(\'' + zone.id + '\')">' +
                '<span class="compact-icon-emoji">' + zone.icon + '</span>' +
                '<div style="display:flex;flex-direction:column;min-width:0;flex:1;">' +
                '<span class="compact-name">' + zone.name + '</span>' +
                '<span class="compact-sub">深度 ' + (idx+1) + ' · ' + (zone.monsters.length > 0 ? monsterTypes[zone.monsters[0]].name : '') + (zone.monsters.length > 1 ? '等' : '') + '</span>' +
                '</div>' +
                rewardsHtml +
                '<div class="compact-progress" title="' + Math.floor(progress) + '%"><div class="compact-progress-fill ' + (isAutoRunning?'auto':'') + '" id="zone-bar-' + zone.id + '" style="width:' + progress.toFixed(1) + '%;"></div></div>' +
                statusLabel +
                actionHtml +
                '</div>';
        });
        html += '</div>';
    } else {
        // ────────── 大卡模式（原有逻辑）──────────
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
                    return '<div class="expl-cond ' + (met ? 'met' : '') + '">' + (met ? '✅' : '🔒') + ' ' + _condLabel(c) + '</div>';
                }).join('');
            } else if (cond.type === 'purchase') {
                var canBuy = gameState.coins >= cond.value;
                var shortage = cond.value - gameState.coins;
                condHtml = '<div class="expl-cond ' + (canBuy ? 'met' : '') + '">' +
                    (canBuy ? '✅' : '💰') + ' ' + _condLabel(cond) +
                    (!canBuy ? ' <span style="color:#f85149;font-size:11px;">（差 ' + shortage + '）</span>' : '') +
                    '</div>' +
                    '<button class="btn ' + (canBuy ? 'btn-warning' : 'btn-secondary') + ' expl-purchase-btn"' +
                    (canBuy ? '' : ' disabled style="opacity:0.5;cursor:not-allowed;"') +
                    ' onclick="purchaseZonePass(\'' + zone.id + '\')">' +
                    (canBuy ? '✅ 花费 ' + cond.value + ' 金币解锁' : '💰 需 ' + cond.value + ' 金币') +
                    '</button>';
            } else {
                var met = checkZoneCondition(zone);
                condHtml = '<div class="expl-cond ' + (met ? 'met' : '') + '">' + (met ? '✅' : '🔒') + ' ' + _condLabel(cond) + '</div>';
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
                    '+ 派遣怪兽</button>' +
                    (idleMonsters.length > 1
                        ? '<button class="btn expl-dispatch-btn" style="border-color:#e0a02f;color:#e0a02f;" ' +
                          'onclick="garrisonAllToZone(\'' + zone.id + '\')" title="将所有空闲怪兽全部派往此区域（最多4只）">' +
                          '⚡ 驻守(' + idleMonsters.length + ')</button>'
                        : '');
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

        html += '</div>'; // end expl-zone-grid
    } // end else (large layout)

    el.innerHTML = html;

    // 恢复自动计时器（切换标签页后重挂）
    explorationZones.forEach(function(zone) {
        var zs = getZoneState(zone.id);
        if (zs.assignedMonsterIds.length > 0 && !zs.autoTimerId) {
            startZoneAutoTimer(zone);
        }
    });
};

// ── 区域详情弹窗（小卡模式点击后展开）──
window.showZoneDetailModal = function(zoneId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone || !checkZoneCondition(zone)) return;
    var rarityColor = { common:'#8b949e', uncommon:'#2196f3', rare:'#ff9800', epic:'#9c27b0', legendary:'#ffd700' };
    var rarityName  = { common:'普通', uncommon:'优良', rare:'稀有', epic:'史诗', legendary:'传说' };
    var zs = getZoneState(zone.id);
    var progress = Math.min(100, zs.progress);
    var assigned = zs.assignedMonsterIds.map(function(mid) {
        return gameState.monsters.find(function(m) { return m.id === mid; });
    }).filter(Boolean);
    var isAutoRunning = assigned.length > 0;
    var speed = isAutoRunning ? calcAutoSpeed(zone, zs.assignedMonsterIds).toFixed(1) : 0;

    var monsterTags = zone.monsters.map(function(tid) {
        var td = monsterTypes[tid];
        if (!td) return '';
        var rc = rarityColor[td.rarity] || '#8b949e';
        var rn = rarityName[td.rarity]  || '';
        return '<span style="border:1px solid ' + rc + ';color:' + rc + ';border-radius:4px;padding:2px 7px;font-size:12px;display:inline-block;margin:2px;">' +
            td.name + ' [' + rn + ']</span>';
    }).join('');

    var assignedHtml = assigned.length > 0
        ? assigned.map(function(m) {
            return '<div style="display:flex;align-items:center;gap:8px;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:6px 10px;font-size:13px;">' +
                createSVG(m.type, 20) +
                '<span style="flex:1;font-weight:600;">' + m.name + '</span>' +
                '<span style="color:#8b949e;">Lv.' + m.level + '</span>' +
                '<button style="background:#3a1a1a;color:#f85149;border:1px solid #da3633;border-radius:5px;padding:2px 8px;font-size:12px;cursor:pointer;" ' +
                'onclick="recallMonsterFromZone(\'' + zone.id + '\',' + m.id + ');closeModal();">召回</button>' +
                '</div>';
        }).join('')
        : '<div style="color:#8b949e;font-size:13px;padding:8px 0;">暂无派遣怪兽</div>';

    var canClick = gameState.energy >= zone.energyCostManual;
    var btnHtml = '';
    if (!isAutoRunning) {
        btnHtml += '<button class="btn btn-primary" ' + (canClick ? 'onclick="manualExplore(\'' + zone.id + '\');closeModal();"' : 'disabled') + '>' +
            '⚡ 探索 (-' + zone.energyCostManual + '能量)</button>';
    }
    if (assigned.length < 4 && gameState.monsters.some(function(m){return m.status==='idle';})) {
        btnHtml += '<button class="btn btn-warning" onclick="closeModal();showDispatchPicker(\'' + zone.id + '\');">+ 派遣怪兽</button>';
    }
    btnHtml += '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>';

    var html = '<div class="modal-header">' + zone.icon + ' ' + zone.name + '</div>' +
        '<div style="font-size:13px;line-height:1.7;color:#c9d1d9;margin-bottom:12px;">' + zone.desc + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">' +
            (zone.rewards.coins[1]    > 0 ? '<span style="background:#21262d;border:1px solid #30363d;border-radius:6px;padding:2px 8px;font-size:13px;">🪙 ' + zone.rewards.coins[0]    + '~' + zone.rewards.coins[1] + '</span>' : '') +
            (zone.rewards.food[1]     > 0 ? '<span style="background:#21262d;border:1px solid #30363d;border-radius:6px;padding:2px 8px;font-size:13px;">🌾 ' + zone.rewards.food[0]     + '~' + zone.rewards.food[1] + '</span>' : '') +
            (zone.rewards.materials[1]> 0 ? '<span style="background:#21262d;border:1px solid #30363d;border-radius:6px;padding:2px 8px;font-size:13px;">🔩 ' + zone.rewards.materials[0]+ '~' + zone.rewards.materials[1] + '</span>' : '') +
            (zone.rewards.research[1] > 0 ? '<span style="background:#21262d;border:1px solid #30363d;border-radius:6px;padding:2px 8px;font-size:13px;">🔬 ' + zone.rewards.research[0] + '~' + zone.rewards.research[1] + '</span>' : '') +
        '</div>' +
        '<div style="margin-bottom:8px;font-size:12px;color:#8b949e;">可遇怪兽：' + monsterTags + '</div>' +
        // 进度条
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
            '<div style="flex:1;height:8px;background:#21262d;border-radius:4px;overflow:hidden;">' +
            '<div style="height:100%;background:' + (isAutoRunning ? 'linear-gradient(90deg,#46d164,#58a6ff)' : '#58a6ff') + ';width:' + progress.toFixed(1) + '%;border-radius:4px;transition:width 0.3s;"></div>' +
            '</div>' +
            '<span style="font-size:13px;color:#8b949e;min-width:36px;text-align:right;">' + Math.floor(progress) + '%</span>' +
        '</div>' +
        // 已派遣
        '<div style="margin-bottom:12px;">' +
            '<div style="font-size:12px;color:#8b949e;margin-bottom:6px;">已派遣怪兽 (' + assigned.length + '/4)' + (isAutoRunning ? '&nbsp;⚙ ' + speed + '%/s' : '') + '</div>' +
            '<div style="display:flex;flex-direction:column;gap:5px;">' + assignedHtml + '</div>' +
        '</div>' +
        '<div class="modal-buttons">' + btnHtml + '</div>';

    showModal(html);
};

// ── 弹出派遣选择器（接入统一筛选器）──
window.showDispatchPicker = function(zoneId) {
    var zone = explorationZones.find(function(z) { return z.id === zoneId; });
    if (!zone) return;

    showMonsterPickModal({
        ctx:         'explore_' + zoneId,
        title:       zone.icon + ' 派遣怪兽 → ' + TName(zoneId, 'zones'),
        showLineage: false,
        extraInfo: function(m) {
            // 展示对该区域的探索贡献
            var power = (m.stats.strength || 0) + (m.stats.agility || 0) + (m.stats.intelligence || 0);
            var speedContrib = (power / 10).toFixed(1);
            return '<div style="font-size:11px;color:#58a6ff;margin-top:2px;">' +
                '速度 +' + speedContrib + '%/s　<span style="color:#46d164;">奖励 +10%</span></div>';
        },
        onSelect: function(monsterId) {
            assignMonsterToZone(zoneId, monsterId);
        }
    });
};

// ── 从怪兽详情弹窗"派去探索"：先弹区域选择器，再派遣 ──
window.showZoneDispatchPicker = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster || monster.status !== 'idle') {
        showNotification('该怪兽当前不可用！', 'warning');
        return;
    }

    // 过滤出已解锁且未满员（<4只）的区域
    var availableZones = explorationZones.filter(function(z) {
        if (!checkZoneCondition(z)) return false;
        var zs = getZoneState(z.id);
        return zs.assignedMonsterIds.length < 4;
    });

    if (availableZones.length === 0) {
        showNotification('当前没有可派遣的探索区域！', 'warning');
        return;
    }

    var html = '<div class="modal-header">🗺 选择探索区域</div>' +
        '<p style="color:#8b949e;font-size:12px;margin:0 0 12px;">选择要将 <strong style="color:#58a6ff;">' + monster.name + '</strong> 派往的区域：</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto;">';

    html += availableZones.map(function(z) {
        var zs = getZoneState(z.id);
        var slots = zs.assignedMonsterIds.length;
        return '<div onclick="assignMonsterToZone(\'' + z.id + '\',' + monsterId + ');closeModal();"' +
            ' style="display:flex;align-items:center;gap:12px;padding:12px;background:#21262d;border:1px solid #30363d;' +
            'border-radius:10px;cursor:pointer;"' +
            ' onmouseover="this.style.borderColor=\'#58a6ff\';this.style.background=\'#30363d\'"' +
            ' onmouseout="this.style.borderColor=\'#30363d\';this.style.background=\'#21262d\'">' +
            '<div style="font-size:28px;width:36px;text-align:center;">' + z.icon + '</div>' +
            '<div style="flex:1;">' +
            '<div style="font-weight:700;color:#e6edf3;">' + TName(z.id, 'zones') + '</div>' +
            '<div style="font-size:12px;color:#8b949e;margin-top:2px;">' + TDesc(z.id, 'zones') + '</div>' +
            '</div>' +
            '<div style="font-size:12px;color:#8b949e;text-align:right;white-space:nowrap;">' +
            slots + '/4 只<br><span style="color:#46d164;">可派遣</span></div>' +
            '</div>';
    }).join('');

    html += '</div><div class="modal-buttons"><button class="btn btn-primary" onclick="closeModal()">取消</button></div>';
    showModal(html);
};

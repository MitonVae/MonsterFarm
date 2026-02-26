// ==================== 科技树模块 ====================

// 科技分类配置
var TECH_CATEGORIES = [
    { id: 'farming',     label: '🌾 农业', color: '#46d164' },
    { id: 'exploration', label: '🗺 探索', color: '#58a6ff' },
    { id: 'monster',     label: '👾 怪兽', color: '#9c27b0' },
    { id: 'breeding',    label: '💕 繁殖', color: '#e91e63' },
    { id: 'expansion',   label: '🏠 扩建', color: '#f0883e' }
];

var _activeTechCategory = 'farming';

window.renderTech = function() {
    var techTree = document.getElementById('techTree');
    if (!techTree) return;

    // ── 分类 Tab 头 ──
    var tabsHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' +
        TECH_CATEGORIES.map(function(cat) {
            var isActive = _activeTechCategory === cat.id;
            var catTechs = Object.keys(technologies).filter(function(k){ return technologies[k].category === cat.id; });
            var unlockedCount = catTechs.filter(function(k){ return gameState.technologies[k]; }).length;
            return '<button onclick="switchTechCategory(\'' + cat.id + '\')" style="' +
                'padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;' +
                'border:2px solid ' + (isActive ? cat.color : '#30363d') + ';' +
                'background:' + (isActive ? cat.color + '22' : 'transparent') + ';' +
                'color:' + (isActive ? cat.color : '#8b949e') + ';">' +
                cat.label + ' <span style="font-size:11px;opacity:0.8;">(' + unlockedCount + '/' + catTechs.length + ')</span>' +
                '</button>';
        }).join('') +
        '</div>';

    // ── 当前分类的科技列表 ──
    var filteredTechs = Object.keys(technologies).filter(function(k) {
        return technologies[k].category === _activeTechCategory;
    });

    // 按 tier 排序
    filteredTechs.sort(function(a, b) {
        return (technologies[a].tier || 1) - (technologies[b].tier || 1);
    });

    var techHtml = filteredTechs.map(function(techId) {
        var tech = technologies[techId];
        var unlocked = gameState.technologies[techId];

        // 前置科技检查
        var prereqMet = !tech.prereq || tech.prereq.length === 0 || tech.prereq.every(function(p) {
            return gameState.technologies[p];
        });
        var canAfford = Object.keys(tech.cost).every(function(resource) {
            return gameState[resource] >= tech.cost[resource];
        });
        var canUnlock = prereqMet && canAfford;
        var tierColor = ['','#8b949e','#46d164','#58a6ff','#f0883e','#9c27b0','#ffd700'][tech.tier||1] || '#8b949e';

        var prereqBlock = '';
        if (!prereqMet && tech.prereq && tech.prereq.length > 0) {
            prereqBlock = '<div style="font-size:11px;color:#f85149;margin-top:6px;">⚠ 需要先解锁：' +
                tech.prereq.map(function(p){ return technologies[p] ? technologies[p].name : p; }).join('、') + '</div>';
        }

        return '<div class="tech-item ' + (unlocked ? 'unlocked' : 'locked') + '" style="' +
            'border-left:3px solid ' + tierColor + ';opacity:' + (!prereqMet && !unlocked ? '0.55' : '1') + ';">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
            '<div class="tech-title" style="margin:0;">' +
                '<span style="display:inline-block;vertical-align:middle;margin-right:4px;">' +
                (unlocked ? createSVG('check',13) : createSVG('locked_tech',13)) + '</span>' + tech.name +
            '</div>' +
            '<span style="font-size:10px;background:' + tierColor + '22;color:' + tierColor + ';padding:1px 6px;border-radius:8px;">Tier ' + (tech.tier||1) + '</span>' +
            '</div>' +
            '<div class="tech-desc">' + tech.desc + '</div>' +
            prereqBlock +
            (!unlocked ? (
                '<div class="tech-cost" style="margin-top:8px;">需要：' +
                Object.keys(tech.cost).map(function(r) {
                    var have = gameState[r] || 0;
                    var need = tech.cost[r];
                    var ok = have >= need;
                    return '<span style="color:' + (ok?'#46d164':'#f85149') + ';">' + getResourceIcon(r,12) + need + '</span>';
                }).join(' ') + '</div>' +
                '<button class="btn btn-primary" style="margin-top:8px;" onclick="unlockTech(\'' + techId + '\')" ' +
                (!canUnlock ? 'disabled' : '') + '>' +
                (unlocked ? '已解锁' : (canUnlock ? '解锁' : (!prereqMet ? '前置未满足' : '资源不足'))) +
                '</button>'
            ) : (
                '<div style="color:#46d164;font-weight:bold;margin-top:8px;font-size:13px;">✓ 已解锁</div>'
            )) +
            '</div>';
    }).join('');

    // ── 怪兽属性突破区域 ──
    var breakthroughHtml = renderMonsterBreakthroughSection();

    techTree.innerHTML = tabsHtml + techHtml + breakthroughHtml;
};

window.switchTechCategory = function(catId) {
    _activeTechCategory = catId;
    renderTech();
};

// 渲染怪兽属性突破面板
function renderMonsterBreakthroughSection() {
    var BREAKTHROUGH_COST = 50; // 每次突破消耗研究点
    var canAfford = gameState.research >= BREAKTHROUGH_COST;

    if (gameState.monsters.length === 0) {
        return '<div class="tech-item" style="margin-top:20px;border-top:2px solid #30363d;padding-top:16px;">' +
            '<div class="tech-title">🧬 怪兽属性突破</div>' +
            '<div class="tech-desc" style="color:#8b949e;">消耗 ' + BREAKTHROUGH_COST + ' 研究点为怪兽强制提升一项属性（不受等级上限限制）。<br>让研究点在解锁全部科技后依然有价值。</div>' +
            '<div style="color:#8b949e;font-size:13px;margin-top:8px;">（先去探索捕获怪兽吧！）</div>' +
            '</div>';
    }

    var statLabels = { strength: '力量', agility: '敏捷', intelligence: '智力', farming: '耕作' };
    var monsterOptions = gameState.monsters.filter(function(m) { return m.status === 'idle'; })
        .map(function(m) {
            return '<option value="' + m.id + '">' + m.name + ' (Lv.' + m.level + ')</option>';
        }).join('');

    if (!monsterOptions) {
        monsterOptions = '<option disabled>所有怪兽正在作业中，请先召回</option>';
    }

    return '<div class="tech-item" style="margin-top:20px;border-top:2px solid #30363d;padding-top:16px;">' +
        '<div class="tech-title">🧬 怪兽属性突破 <span style="font-size:12px;color:#8b949e;font-weight:400;">（研究点持续用途）</span></div>' +
        '<div class="tech-desc">消耗 <strong style="color:#58a6ff;">' + BREAKTHROUGH_COST + ' 研究点</strong> 为指定怪兽强制提升一项属性+1，不受等级上限限制。</div>' +
        '<div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div><div style="font-size:12px;color:#8b949e;margin-bottom:4px;">选择怪兽</div>' +
        '<select id="bt-monster-select" style="width:100%;background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 10px;font-size:13px;">' +
        monsterOptions + '</select></div>' +
        '<div><div style="font-size:12px;color:#8b949e;margin-bottom:4px;">提升属性</div>' +
        '<select id="bt-stat-select" style="width:100%;background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 10px;font-size:13px;">' +
        Object.keys(statLabels).map(function(k) {
            return '<option value="' + k + '">' + statLabels[k] + '</option>';
        }).join('') +
        '</select></div></div>' +
        '<div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;">' +
        '<span style="font-size:13px;color:' + (canAfford ? '#46d164' : '#f85149') + ';">当前研究点：<strong>' + gameState.research + '</strong></span>' +
        '<button class="btn btn-primary" onclick="performBreakthrough()" ' + (canAfford ? '' : 'disabled') + ' style="' + (canAfford ? '' : 'opacity:0.5;') + '">' +
        (canAfford ? '✨ 执行突破 (-' + BREAKTHROUGH_COST + ')' : '研究点不足') + '</button>' +
        '</div></div>';
}

// 执行属性突破
window.performBreakthrough = function() {
    var COST = 50;
    if (gameState.research < COST) { showNotification('研究点不足！', 'error'); return; }
    var monsterSelect = document.getElementById('bt-monster-select');
    var statSelect = document.getElementById('bt-stat-select');
    if (!monsterSelect || !statSelect) return;
    var mid = parseInt(monsterSelect.value);
    var stat = statSelect.value;
    var monster = gameState.monsters.find(function(m) { return m.id === mid; });
    if (!monster) { showNotification('找不到怪兽！', 'error'); return; }
    if (monster.status !== 'idle') { showNotification('该怪兽正在作业中！', 'warning'); return; }
    gameState.research -= COST;
    monster.stats[stat] = (monster.stats[stat] || 0) + 1;
    var statLabels = { strength: '力量', agility: '敏捷', intelligence: '智力', farming: '耕作' };
    showNotification('✨ ' + monster.name + ' 的' + (statLabels[stat] || stat) + '提升至 ' + monster.stats[stat] + '！', 'success');
    updateResources();
    renderTech();
    renderMonsterSidebar();
};

window.unlockTech = function(techId) {
    var tech = technologies[techId];
    if (!tech) return;

    // 前置检查
    var prereqMet = !tech.prereq || tech.prereq.length === 0 || tech.prereq.every(function(p) {
        return gameState.technologies[p];
    });
    if (!prereqMet) { showNotification('前置科技未满足！', 'error'); return; }

    var canAfford = Object.keys(tech.cost).every(function(resource) {
        return gameState[resource] >= tech.cost[resource];
    });
    if (!canAfford) { showNotification('资源不足！', 'error'); return; }

    // 扣除费用
    Object.keys(tech.cost).forEach(function(resource) {
        gameState[resource] -= tech.cost[resource];
    });
    gameState.technologies[techId] = true;

    // 应用效果
    var effects = tech.effects || {};

    // 扩建类：解锁农田
    if (effects.extraPlots) {
        var currentUnlocked = gameState.plots.filter(function(p){ return !p.locked; }).length;
        var toUnlock = effects.extraPlots;
        var unlockCount = 0;
        for (var i = currentUnlocked; i < gameState.plots.length && unlockCount < toUnlock; i++) {
            if (gameState.plots[i].locked) { gameState.plots[i].locked = false; unlockCount++; }
        }
        // 如果现有格子不够，动态扩展（支持 unlimitedPlots 科技后逻辑）
        while (unlockCount < toUnlock) {
            var newPlotId = gameState.plots.length;
            gameState.plots.push({
                id: newPlotId, locked: false,
                unlockCost: { coins: 0, materials: 0 },
                crop: null, plantedAt: null, progress: 0,
                assignedMonster: null, autoCrop: null, growthBonus: 1
            });
            unlockCount++;
        }
    }

    // 能量上限提升（暂由 main.js tick 动态计算，此处可额外存标记）
    if (effects.maxLevel) {
        // 存入 gameState 让怪兽培养逻辑读取
        if (!gameState.maxMonsterLevel || gameState.maxMonsterLevel < effects.maxLevel) {
            gameState.maxMonsterLevel = effects.maxLevel;
        }
    }
    if (effects.maxMonsters) {
        gameState.maxMonstersCapacity = effects.maxMonsters;
    }

    showNotification('✅ 解锁：' + tech.name + '！', 'success');
    if (typeof briefTech === 'function') briefTech(tech.name);
    updateResources();
    renderTech();
    renderFarm();
};

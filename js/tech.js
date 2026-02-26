// ==================== 科技树模块 ====================

window.renderTech = function() {
    var techTree = document.getElementById('techTree');
    if (!techTree) return;
    
    var techHtml = Object.keys(technologies).map(function(techId) {
        var tech = technologies[techId];
        var unlocked = gameState.technologies[techId];
        
        var canUnlock = Object.keys(tech.cost).every(function(resource) {
            return gameState[resource] >= tech.cost[resource];
        });
        
        return `
            <div class="tech-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="tech-title">
                    <span style="display: inline-block; vertical-align: middle; margin-right: 5px;">${unlocked ? createSVG('check', 14) : createSVG('locked_tech', 14)}</span>${tech.name}
                </div>
                <div class="tech-desc">${tech.desc}</div>
                ${!unlocked ? `
                    <div class="tech-cost">
                        需要: ${Object.keys(tech.cost).map(function(r) {
                            return getResourceIcon(r) + tech.cost[r];
                        }).join(' ')}
                    </div>
                    <button class="btn btn-primary" 
                            onclick="unlockTech('${techId}')"
                            ${!canUnlock ? 'disabled' : ''}>
                        ${canUnlock ? '解锁' : '资源不足'}
                    </button>
                ` : `
                    <div style="color: #4caf50; font-weight: bold; margin-top: 10px;">
                        <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('check', 14)}</span>已解锁
                    </div>
                    <div style="font-size: 11px; color: #8b949e; margin-top: 5px;">
                        ${Object.keys(tech.effects).map(function(e) {
                            return e + ': ' + tech.effects[e];
                        }).join(', ')}
                    </div>
                `}
            </div>
        `;
    }).join('');

    // ── 怪兽属性突破区域（研究点永不废弃）──
    var breakthroughHtml = renderMonsterBreakthroughSection();

    techTree.innerHTML = techHtml + breakthroughHtml;
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
    
    var canUnlock = Object.keys(tech.cost).every(function(resource) {
        return gameState[resource] >= tech.cost[resource];
    });
    
    if (!canUnlock) {
        showNotification('资源不足！', 'error');
        return;
    }
    
    Object.keys(tech.cost).forEach(function(resource) {
        gameState[resource] -= tech.cost[resource];
    });
    
    gameState.technologies[techId] = true;
    
    if (techId === 'expansion') {
        gameState.plots.slice(3, 3 + tech.effects.extraPlots).forEach(function(plot) {
            plot.locked = false;
        });
    }
    
    showNotification('成功解锁：' + tech.name + '！', 'success');
    if (typeof briefTech === 'function') briefTech(tech.name);
    updateResources();
    renderTech();
    renderFarm();
};
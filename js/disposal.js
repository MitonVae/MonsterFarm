// ==================== 处理中心模块 ====================

window.renderDisposal = function() {
    var disposalContainer = document.getElementById('disposalContainer');
    if (!disposalContainer) return;

    var layout = getLayoutPref('disposal');
    var sel = gameState.selectedMonster
        ? gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; })
        : null;

    // ── 工具栏（标题 + 布局切换）──
    var toolbarHtml = renderLayoutToolbar('disposal', '怪兽处理中心',
        [{ label: '全选空闲', onclick: 'selectAllIdleForDisposal()', cls: '' }],
        'renderDisposal');

    // ── 怪兽列表区域 ──
    var idleMonsters = gameState.monsters.filter(function(m) { return m.status === 'idle'; });
    var listHtml = '';

    if (gameState.monsters.length === 0) {
        listHtml = '<div style="text-align:center;padding:40px 20px;color:#8b949e;">' +
            '<div style="font-size:40px;margin-bottom:10px;">🐾</div>' +
            '<div>还没有怪兽</div></div>';
    } else if (layout === 'compact') {
        // ── 紧凑模式：行式列表 ──
        listHtml = '<div class="compact-list" style="padding:8px 0 8px;">' +
            gameState.monsters.map(function(m) {
                var isSel = sel && sel.id === m.id;
                var isIdle = m.status === 'idle';
                var statusColor = { idle: '#8b949e', farming: '#46d164', exploring: '#f0c53d',
                    preparing: '#f0c53d', breeding: '#e040fb' }[m.status] || '#8b949e';
                var statusLabel = { idle: '空闲', farming: '耕作', exploring: '探索',
                    preparing: '准备', breeding: '繁殖' }[m.status] || m.status;
                return '<div class="compact-card disposal' + (isSel ? ' selected' : '') + (isIdle ? '' : ' locked') + '" ' +
                    (isIdle ? 'onclick="selectDisposalMonster(' + m.id + ')" style="cursor:pointer;"' :
                              'style="opacity:0.5;cursor:not-allowed;"') + '>' +
                    '<div style="width:26px;height:26px;flex-shrink:0;">' + createSVG(m.type, 26) + '</div>' +
                    '<div style="display:flex;flex-direction:column;min-width:0;flex:1;gap:1px;">' +
                        '<span class="compact-name">' + m.name + (isSel ? ' ✓' : '') + '</span>' +
                        '<span class="compact-sub">Lv.' + m.level + ' 代' + m.generation + ' · 力' + m.stats.strength + ' 耕' + m.stats.farming + '</span>' +
                    '</div>' +
                    '<span style="font-size:11px;color:' + statusColor + ';flex-shrink:0;">' + statusLabel + '</span>' +
                    '</div>';
            }).join('') +
            '</div>';
    } else {
        // ── 大卡模式 ──
        listHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;padding:12px 0;">' +
            gameState.monsters.map(function(m) {
                var isSel = sel && sel.id === m.id;
                var isIdle = m.status === 'idle';
                var statusLabel = { idle: '空闲', farming: '耕作', exploring: '探索',
                    preparing: '准备', breeding: '繁殖' }[m.status] || m.status;
                var statusColor = { idle: '#8b949e', farming: '#46d164', exploring: '#f0c53d',
                    preparing: '#f0c53d', breeding: '#e040fb' }[m.status] || '#8b949e';
                var totalStats = Object.values(m.stats).reduce(function(a, b) { return a + b; }, 0);
                return '<div style="' +
                    'background:' + (isSel ? '#1a2740' : '#161b22') + ';' +
                    'border:2px solid ' + (isSel ? '#58a6ff' : (isIdle ? '#30363d' : '#21262d')) + ';' +
                    'border-radius:10px;padding:12px;' +
                    'cursor:' + (isIdle ? 'pointer' : 'not-allowed') + ';' +
                    'opacity:' + (isIdle ? '1' : '0.5') + ';' +
                    'transition:border-color 0.15s,background 0.15s;"' +
                    (isIdle ? ' onclick="selectDisposalMonster(' + m.id + ')"' : '') +
                    (isIdle ? ' onmouseover="if(!this.classList.contains(\'sel-hover\'))this.style.borderColor=\'' + (isSel?'#58a6ff':'#444c56') + '\'"' +
                               ' onmouseout="this.style.borderColor=\'' + (isSel?'#58a6ff':'#30363d') + '\'"' : '') + '>' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                        '<div style="flex-shrink:0;">' + createSVG(m.type, 32) + '</div>' +
                        '<div style="min-width:0;flex:1;">' +
                            '<div style="font-weight:700;color:' + (isSel?'#58a6ff':'#e6edf3') + ';font-size:0.9286rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                                m.name + (isSel ? ' ✓' : '') + '</div>' +
                            '<div style="font-size:11px;color:#8b949e;">Lv.' + m.level + ' · 第' + m.generation + '代</div>' +
                        '</div>' +
                        '<span style="font-size:11px;color:' + statusColor + ';font-weight:600;flex-shrink:0;">' + statusLabel + '</span>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:#8b949e;">' +
                        '<span>力 <strong style="color:#e6edf3;">' + m.stats.strength + '</strong></span>' +
                        '<span>敏 <strong style="color:#e6edf3;">' + m.stats.agility + '</strong></span>' +
                        '<span>智 <strong style="color:#e6edf3;">' + m.stats.intelligence + '</strong></span>' +
                        '<span>耕 <strong style="color:#e6edf3;">' + m.stats.farming + '</strong></span>' +
                    '</div>' +
                    '<div style="margin-top:6px;font-size:11px;color:#8b949e;">综合 <strong style="color:#58a6ff;">' + totalStats + '</strong></div>' +
                    '</div>';
            }).join('') +
            '</div>';
    }

    // ── 操作面板：仅在选择了怪兽时显示 ──
    var panelHtml = '';
    if (sel) {
        var totalStats = Object.values(sel.stats).reduce(function(a, b) { return a + b; }, 0);
        var releaseReward  = sel.level * 5;
        var sacrificeReward= sel.level * 10 + totalStats * 2;
        var decompMat      = sel.level * 8 + sel.stats.strength * 3;
        var decompFood     = sel.level * 5 + sel.stats.farming * 2;
        var researchReward = sel.level * 15 + totalStats * 3;
        var sellReward     = sel.level * 20 + totalStats * 5 + sel.generation * 10;

        panelHtml =
            '<div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px 16px;margin-top:12px;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
                '<div>' + createSVG(sel.type, 36) + '</div>' +
                '<div>' +
                    '<div style="font-weight:700;font-size:1.0714rem;color:#58a6ff;">' + sel.name + '</div>' +
                    '<div style="font-size:12px;color:#8b949e;">Lv.' + sel.level + ' · 第' + sel.generation + '代 · 综合 ' + totalStats + '</div>' +
                '</div>' +
                '<button onclick="selectDisposalMonster(null)" style="margin-left:auto;background:none;border:none;color:#8b949e;cursor:pointer;font-size:18px;padding:4px;" title="取消选择">✕</button>' +
            '</div>' +
            '<div class="disposal-options" style="gap:8px;">' +
                _disposalOptionBtn('🌿', '放生', '材料 ×' + releaseReward, 'success', 'releaseMonster()') +
                _disposalOptionBtn('🔮', '献祭', '研究 ×' + sacrificeReward, 'danger', 'sacrificeMonster()') +
                _disposalOptionBtn('🧪', '研究', '研究 ×' + researchReward, 'danger', 'researchMonster()') +
                _disposalOptionBtn('⚙️', '分解', '材料+食物', 'warn', 'decomposeMonster()') +
                _disposalOptionBtn('💰', '出售', '金币 ×' + sellReward, 'primary', 'sellMonster()') +
            '</div>' +
            '<div style="margin-top:10px;font-size:11px;color:#f85149;padding:6px 10px;background:#1a0e0e;border-radius:6px;">' +
                '⚠️ 操作不可逆，怪兽将永久消失' +
            '</div>' +
            '</div>';
    } else {
        panelHtml = '<div style="text-align:center;padding:16px;color:#8b949e;font-size:13px;background:#161b22;border:1px dashed #30363d;border-radius:10px;margin-top:12px;">' +
            (idleMonsters.length > 0
                ? '👆 点击上方空闲怪兽选择处置对象'
                : '<span style="color:#f85149;">当前所有怪兽都在工作中</span>') +
            '</div>';
    }

    disposalContainer.innerHTML =
        '<div style="padding:0 20px 20px;">' +
        toolbarHtml +
        listHtml +
        panelHtml +
        '</div>';
};

// 内部辅助：生成处置操作按钮
function _disposalOptionBtn(emoji, label, reward, cls, onclick) {
    var colors = { success: '#46d164', danger: '#f85149', warn: '#f0c53d', primary: '#58a6ff' };
    var col = colors[cls] || '#8b949e';
    return '<div class="disposal-option" onclick="' + onclick + '" style="' +
        'min-width:80px;flex:1;padding:10px 6px;cursor:pointer;' +
        'border:1.5px solid #30363d;border-radius:10px;background:#21262d;' +
        'transition:border-color 0.15s,background 0.15s;text-align:center;"' +
        ' onmouseover="this.style.borderColor=\'' + col + '\';this.style.background=\'#1c2128\'"' +
        ' onmouseout="this.style.borderColor=\'#30363d\';this.style.background=\'#21262d\'">' +
        '<div style="font-size:22px;">' + emoji + '</div>' +
        '<div style="font-weight:700;color:#e6edf3;font-size:13px;margin:3px 0;">' + label + '</div>' +
        '<div style="font-size:11px;color:' + col + ';">' + reward + '</div>' +
        '</div>';
}

// 选择处置目标（monsterId 为 null 则取消选择）
window.selectDisposalMonster = function(monsterId) {
    gameState.selectedMonster = monsterId || null;
    renderDisposal();
};

// 全选空闲怪兽（逻辑上选第一个空闲）
window.selectAllIdleForDisposal = function() {
    var idle = gameState.monsters.filter(function(m) { return m.status === 'idle'; });
    if (idle.length === 0) { showNotification('没有空闲怪兽！', 'warning'); return; }
    // 显示批量处置选择弹窗
    showBatchDisposalModal(idle);
};

// ── 批量处置弹窗 ──
window.showBatchDisposalModal = function(idle) {
    var checked = {}; // monsterId -> bool
    idle.forEach(function(m) { checked[m.id] = false; });

    function buildContent() {
        return '<div class="modal-header">⚙️ 批量处置怪兽</div>' +
            '<div style="margin-bottom:10px;font-size:13px;color:#8b949e;">选择要批量处置的空闲怪兽：</div>' +
            '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
                '<button class="btn btn-primary" style="font-size:12px;padding:4px 10px;" onclick="batchDisposalToggleAll(true)">全选</button>' +
                '<button class="btn" style="font-size:12px;padding:4px 10px;" onclick="batchDisposalToggleAll(false)">全不选</button>' +
            '</div>' +
            '<div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;" id="batchDisposalList">' +
            idle.map(function(m) {
                return '<label style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#21262d;border-radius:8px;cursor:pointer;">' +
                    '<input type="checkbox" id="bdCk_' + m.id + '" style="width:15px;height:15px;" ' + (checked[m.id]?'checked':'') + ' onchange="batchDisposalCheck(' + m.id + ',this.checked)">' +
                    '<div style="flex-shrink:0;">' + createSVG(m.type, 24) + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-weight:600;color:#e6edf3;font-size:13px;">' + m.name + '</div>' +
                        '<div style="font-size:11px;color:#8b949e;">Lv.' + m.level + ' 代' + m.generation + ' · 综合' + Object.values(m.stats).reduce(function(a,b){return a+b;},0) + '</div>' +
                    '</div>' +
                    '</label>';
            }).join('') +
            '</div>' +
            '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">' +
                '<button class="btn btn-success" onclick="executeBatchDisposal(\'release\')">🌿 批量放生</button>' +
                '<button class="btn btn-danger" onclick="executeBatchDisposal(\'sacrifice\')">🔮 批量献祭</button>' +
                '<button class="btn btn-warning" onclick="executeBatchDisposal(\'decompose\')">⚙️ 批量分解</button>' +
                '<button class="btn btn-primary" onclick="executeBatchDisposal(\'sell\')">💰 批量出售</button>' +
            '</div>' +
            '<div class="modal-buttons"><button class="btn" onclick="closeModal()">关闭</button></div>';
    }

    window._batchDisposalChecked = checked;
    window._batchDisposalIdle = idle;
    showModal(buildContent());
};

window.batchDisposalToggleAll = function(val) {
    window._batchDisposalIdle.forEach(function(m) {
        window._batchDisposalChecked[m.id] = val;
        var ck = document.getElementById('bdCk_' + m.id);
        if (ck) ck.checked = val;
    });
};
window.batchDisposalCheck = function(id, val) {
    window._batchDisposalChecked[id] = val;
};

window.executeBatchDisposal = function(action) {
    var targets = (window._batchDisposalIdle || []).filter(function(m) {
        return window._batchDisposalChecked && window._batchDisposalChecked[m.id];
    });
    if (targets.length === 0) { showNotification('未选择任何怪兽！', 'warning'); return; }

    var actionMap = {
        release:   { label: '放生',  btn: '确认放生',  cls: 'btn-success' },
        sacrifice: { label: '献祭',  btn: '确认献祭',  cls: 'btn-danger' },
        decompose: { label: '分解',  btn: '确认分解',  cls: 'btn-warning' },
        sell:      { label: '出售',  btn: '确认出售',  cls: 'btn-primary' }
    };
    var info = actionMap[action] || { label: action, btn: '确认', cls: 'btn-danger' };

    var totalMat = 0, totalFood = 0, totalResearch = 0, totalCoins = 0;
    targets.forEach(function(m) {
        var ts = Object.values(m.stats).reduce(function(a,b){return a+b;},0);
        if (action === 'release')   totalMat      += m.level * 5;
        if (action === 'sacrifice') totalResearch += m.level * 10 + ts * 2;
        if (action === 'decompose') { totalMat += m.level*8+m.stats.strength*3; totalFood += m.level*5+m.stats.farming*2; }
        if (action === 'sell')      totalCoins    += m.level * 20 + ts * 5 + m.generation * 10;
    });

    var rewardDesc = '';
    if (totalMat)      rewardDesc += '🪨 材料 ' + totalMat + '  ';
    if (totalFood)     rewardDesc += '🍎 食物 ' + totalFood + '  ';
    if (totalResearch) rewardDesc += '🔬 研究 ' + totalResearch + '  ';
    if (totalCoins)    rewardDesc += '💰 金币 ' + totalCoins;

    showConfirmModal({
        title: info.label + ' ' + targets.length + ' 只怪兽',
        content: '共选择 <strong style="color:#58a6ff;">' + targets.length + '</strong> 只怪兽进行' + info.label + '。<br><br>' +
            '预计获得：<br><span style="color:#e6edf3;">' + rewardDesc + '</span><br><br>' +
            '<span style="color:#f85149;">⚠️ 操作不可逆！</span>',
        confirmText: info.btn,
        confirmClass: info.cls,
        onConfirm: function() {
            closeModal();
            targets.forEach(function(m) {
                var ts = Object.values(m.stats).reduce(function(a,b){return a+b;},0);
                if (action === 'release')   { gameState.materials += m.level * 5; }
                if (action === 'sacrifice') { gameState.research  += m.level * 10 + ts * 2; }
                if (action === 'decompose') { gameState.materials += m.level*8+m.stats.strength*3; gameState.food += m.level*5+m.stats.farming*2; }
                if (action === 'sell')      { gameState.coins     += m.level * 20 + ts * 5 + m.generation * 10; }
                var idx = gameState.monsters.findIndex(function(x){ return x.id === m.id; });
                if (idx >= 0) gameState.monsters.splice(idx, 1);
            });
            if (gameState.selectedMonster && !gameState.monsters.find(function(m){ return m.id === gameState.selectedMonster; })) {
                gameState.selectedMonster = null;
            }
            showNotification('已' + info.label + ' ' + targets.length + ' 只怪兽！', 'success');
            updateResources();
            renderMonsterSidebar();
            renderDisposal();
        }
    });
};

// ==================== 单只处置操作（沿用原逻辑）====================

window.releaseMonster = function() {
    if (!gameState.selectedMonster) { showNotification('请先选择怪兽！', 'warning'); return; }
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    if (!monster || monster.status !== 'idle') { showNotification('该怪兽正在工作中！', 'warning'); return; }
    var reward = monster.level * 5;
    showConfirmModal({
        title: '🌿 放生怪兽',
        content: '确定要放生 <strong style="color:#58a6ff;">' + monster.name + '</strong> 吗？<br><br>' +
            '获得 <span style="color:#c9d1d9;">🪨 材料 ' + reward + '</span>',
        confirmText: '确认放生', confirmClass: 'btn-success',
        onConfirm: function() {
            gameState.materials += reward;
            gameState.monsters.splice(gameState.monsters.findIndex(function(m){ return m.id === monster.id; }), 1);
            gameState.selectedMonster = null;
            showNotification('放生了 ' + monster.name + '，获得 ' + reward + ' 材料', 'success');
            updateResources(); renderMonsterSidebar(); renderDisposal();
        }
    });
};

window.sacrificeMonster = function() {
    if (!gameState.selectedMonster) { showNotification('请先选择怪兽！', 'warning'); return; }
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    if (!monster || monster.status !== 'idle') { showNotification('该怪兽正在工作中！', 'warning'); return; }
    var totalStats = Object.values(monster.stats).reduce(function(a, b) { return a + b; }, 0);
    var reward = monster.level * 10 + totalStats * 2;
    showConfirmModal({
        title: '🔮 献祭怪兽',
        content: '确定要献祭 <strong style="color:#58a6ff;">' + monster.name + '</strong> 吗？<br><br>' +
            '获得 <span style="color:#58a6ff;">🔬 研究点 ' + reward + '</span><br><br>' +
            '<span style="color:#f85149;">⚠️ 不可逆！</span>',
        confirmText: '确认献祭', confirmClass: 'btn-danger',
        onConfirm: function() {
            gameState.research += reward;
            gameState.monsters.splice(gameState.monsters.findIndex(function(m){ return m.id === monster.id; }), 1);
            gameState.selectedMonster = null;
            showNotification('献祭了 ' + monster.name + '，获得 ' + reward + ' 研究点', 'success');
            updateResources(); renderMonsterSidebar(); renderDisposal();
        }
    });
};

window.decomposeMonster = function() {
    if (!gameState.selectedMonster) { showNotification('请先选择怪兽！', 'warning'); return; }
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    if (!monster || monster.status !== 'idle') { showNotification('该怪兽正在工作中！', 'warning'); return; }
    var materialsReward = monster.level * 8 + monster.stats.strength * 3;
    var foodReward      = monster.level * 5 + monster.stats.farming * 2;
    showConfirmModal({
        title: '⚙️ 分解怪兽',
        content: '确定要分解 <strong style="color:#58a6ff;">' + monster.name + '</strong> 吗？<br><br>' +
            '将获得：<br>' +
            '<span style="color:#c9d1d9;">🪨 材料 ' + materialsReward + '</span><br>' +
            '<span style="color:#46d164;">🍎 食物 ' + foodReward + '</span>',
        confirmText: '确认分解', confirmClass: 'btn-warning',
        onConfirm: function() {
            gameState.materials += materialsReward;
            gameState.food += foodReward;
            gameState.monsters.splice(gameState.monsters.findIndex(function(m){ return m.id === monster.id; }), 1);
            gameState.selectedMonster = null;
            showNotification('分解了 ' + monster.name, 'success');
            updateResources(); renderMonsterSidebar(); renderDisposal();
        }
    });
};

window.researchMonster = function() {
    if (!gameState.selectedMonster) { showNotification('请先选择怪兽！', 'warning'); return; }
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    if (!monster || monster.status !== 'idle') { showNotification('该怪兽正在工作中！', 'warning'); return; }
    var totalStats = Object.values(monster.stats).reduce(function(a, b) { return a + b; }, 0);
    var reward = monster.level * 15 + totalStats * 3;
    showConfirmModal({
        title: '🧪 研究实验',
        content: '确定要让 <strong style="color:#58a6ff;">' + monster.name + '</strong> 参与研究吗？<br><br>' +
            '获得 <span style="color:#58a6ff;">🔬 研究点 ' + reward + '</span><br><br>' +
            '<span style="color:#f85149;">⚠️ 怪兽将永远消失！</span>',
        confirmText: '确认实验', confirmClass: 'btn-danger',
        onConfirm: function() {
            gameState.research += reward;
            gameState.monsters.splice(gameState.monsters.findIndex(function(m){ return m.id === monster.id; }), 1);
            gameState.selectedMonster = null;
            showNotification('让 ' + monster.name + ' 参与了研究，获得 ' + reward + ' 研究点', 'success');
            updateResources(); renderMonsterSidebar(); renderDisposal();
        }
    });
};

window.sellMonster = function() {
    if (!gameState.selectedMonster) { showNotification('请先选择怪兽！', 'warning'); return; }
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    if (!monster || monster.status !== 'idle') { showNotification('该怪兽正在工作中！', 'warning'); return; }
    var totalStats = Object.values(monster.stats).reduce(function(a, b) { return a + b; }, 0);
    var reward = monster.level * 20 + totalStats * 5 + monster.generation * 10;
    showConfirmModal({
        title: '💰 出售怪兽',
        content: '确定要出售 <strong style="color:#58a6ff;">' + monster.name + '</strong> 吗？<br><br>' +
            '获得 <span style="color:#f0c53d;">💰 金币 ' + reward + '</span>',
        confirmText: '确认出售', confirmClass: 'btn-primary',
        onConfirm: function() {
            gameState.coins += reward;
            gameState.monsters.splice(gameState.monsters.findIndex(function(m){ return m.id === monster.id; }), 1);
            gameState.selectedMonster = null;
            showNotification('出售了 ' + monster.name + '，获得 ' + reward + ' 金币', 'success');
            updateResources(); renderMonsterSidebar(); renderDisposal();
        }
    });
};
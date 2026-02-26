// ==================== 资源详情展开模块 ====================

// 资源静态描述数据
var RESOURCE_INFO = {
    coins: {
        name: '金币',
        color: '#f0c53d',
        valueColor: '#f0c53d',
        desc: '农场的主要货币。用于解锁新区域、购买科技升级和扩展农田。',
        sources: [
            '收获作物后自动获得售卖收益',
            '派遣怪兽售卖（30秒后返回并带回金币）',
            '探索区域结算时的奖励',
        ],
        uses: [
            '解锁锁定的农田地块',
            '购买探索区域通行证',
            '研究科技树中的升级项',
        ],
        tip: '💡 派遣农耕能力强的怪兽，可大幅提升作物售价。'
    },
    food: {
        name: '食物',
        color: '#46d164',
        valueColor: '#46d164',
        desc: '农场产出的粮食。是维持怪兽健康与执行特殊任务的消耗品。',
        sources: [
            '收获作物（每块地每次收获产出食物）',
            '探索某些区域会带回少量食物',
        ],
        uses: [
            '派遣怪兽外出售卖时消耗 10 食物',
            '未来可用于繁殖加成（规划中）',
        ],
        tip: '💡 种植生长快的作物（如萝卜）可快速积累食物储量。'
    },
    materials: {
        name: '材料',
        color: '#8b949e',
        valueColor: '#c9d1d9',
        desc: '从野外探索中获取的建筑材料。用于解锁高级地块和某些科技。',
        sources: [
            '探索碎石丘陵、深邃洞穴等区域获得',
            '特定探索区域结算奖励',
        ],
        uses: [
            '解锁高编号的农田地块（通常需要大量材料）',
            '解锁部分科技树节点的前置条件',
        ],
        tip: '💡 派遣力量属性高的怪兽探索，材料收益加成更显著。'
    },
    research: {
        name: '研究点',
        color: '#58a6ff',
        valueColor: '#58a6ff',
        desc: '科学研究的积累值。解锁科技树中的各项技术升级所需的核心资源。',
        sources: [
            '手动收获作物时小概率获得',
            '探索野外草原、迷雾森林等区域',
            '智力属性高的怪兽探索时加成明显',
        ],
        uses: [
            '研究灌溉系统（加速作物生长）',
            '研究先进农业（提升产量）',
            '解锁探索强化、繁殖加速等科技',
        ],
        tip: '💡 科技 > 探索强化 解锁后，所有探索奖励（含研究点）提升 50%。'
    },
    energy: {
        name: '能量',
        color: '#2ea043',
        valueColor: '#46d164',
        desc: '玩家手动操作消耗的行动力。每次手动点击探索都会消耗能量，会自动缓慢恢复。',
        sources: [
            '每 8 秒自动恢复 1 点能量',
            '上限由基础值 100 决定（暂不可提升）',
        ],
        uses: [
            '手动点击探索按钮时消耗（每次 5~8 点）',
            '派遣怪兽自动探索则不消耗能量',
        ],
        tip: '💡 能量耗尽时，派遣怪兽自动探索即可，无需等待恢复。'
    }
};

// 当前展开的资源 key
var _openResDetail = null;

// 切换展开/收起
window.toggleResourceDetail = function(key) {
    var detailEl  = document.getElementById('detail-' + key);
    var chevronEl = document.getElementById('chevron-' + key);
    if (!detailEl) return;

    var isOpen = detailEl.classList.contains('open');

    // 先关闭所有
    Object.keys(RESOURCE_INFO).forEach(function(k) {
        var d = document.getElementById('detail-' + k);
        var c = document.getElementById('chevron-' + k);
        if (d) d.classList.remove('open');
        if (c) c.classList.remove('open');
    });

    if (!isOpen) {
        // 填充内容（动态读取当前值）
        _fillDetail(key, detailEl);
        detailEl.classList.add('open');
        if (chevronEl) chevronEl.classList.add('open');
        _openResDetail = key;
    } else {
        _openResDetail = null;
    }
};

// 填充详情 HTML
function _fillDetail(key, el) {
    var info = RESOURCE_INFO[key];
    if (!info) return;

    // 读取当前值（来自游戏状态）
    var currentVal = '—';
    var extraLine  = '';
    if (typeof gameState !== 'undefined') {
        switch (key) {
            case 'coins':    currentVal = gameState.coins;    break;
            case 'food':     currentVal = gameState.food;     break;
            case 'materials':currentVal = gameState.materials;break;
            case 'research': currentVal = gameState.research; break;
            case 'energy':
                currentVal = gameState.energy + ' / ' + gameState.maxEnergy;
                var pct = Math.round(gameState.energy / gameState.maxEnergy * 100);
                extraLine = '<div style="margin-top:6px;margin-bottom:2px;">' +
                    '<div style="height:4px;background:#21262d;border-radius:2px;overflow:hidden;">' +
                    '<div style="width:' + pct + '%;height:100%;background:#2ea043;border-radius:2px;transition:width 0.3s;"></div>' +
                    '</div></div>';
                break;
        }
    }

    var sourcesHtml = info.sources.map(function(s) {
        return '<li>' + s + '</li>';
    }).join('');

    var usesHtml = info.uses.map(function(u) {
        return '<li>' + u + '</li>';
    }).join('');

    el.innerHTML =
        '<div class="res-detail-inner">' +
            // 当前数值
            '<div class="res-detail-current">' +
                '<span class="res-detail-current-label">当前数量</span>' +
                '<span class="res-detail-current-value" style="color:' + info.valueColor + ';">' + currentVal + '</span>' +
            '</div>' +
            extraLine +
            // 描述
            '<div class="res-detail-desc">' + info.desc + '</div>' +
            // 来源 & 用途
            '<div class="res-detail-rows">' +
                '<div class="res-detail-row">' +
                    '<span class="res-detail-row-label">📥 获取</span>' +
                    '<ul class="res-detail-row-text" style="margin:0;padding-left:14px;">' + sourcesHtml + '</ul>' +
                '</div>' +
                '<div class="res-detail-row">' +
                    '<span class="res-detail-row-label">📤 用途</span>' +
                    '<ul class="res-detail-row-text" style="margin:0;padding-left:14px;">' + usesHtml + '</ul>' +
                '</div>' +
                '<div class="res-detail-row" style="margin-top:4px;padding-top:6px;border-top:1px solid #21262d;">' +
                    '<span style="font-size:11.5px;color:#8b949e;line-height:1.5;">' + info.tip + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// 若当前有展开的详情，在资源更新时刷新其数值
window.refreshOpenResourceDetail = function() {
    if (_openResDetail) {
        var el = document.getElementById('detail-' + _openResDetail);
        if (el && el.classList.contains('open')) {
            _fillDetail(_openResDetail, el);
        }
    }
};

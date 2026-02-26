// ==================== 实时简报系统 ====================
// 类型 → { icon, label }
var BRIEFING_TYPES = {
    catch:   { icon: '🎉', label: '捕获' },
    levelup: { icon: '⬆️', label: '升级' },
    harvest: { icon: '🌾', label: '收获' },
    explore: { icon: '🗺', label: '探索' },
    event:   { icon: '⚡', label: '事件' },
    tech:    { icon: '🔬', label: '科技' },
    breed:   { icon: '💕', label: '繁殖' },
    save:    { icon: '💾', label: '保存' },
    system:  { icon: 'ℹ️', label: '系统' }
};

var _briefingLog   = [];   // 完整历史
var _MAX_LOG       = 50;   // 最多保留条数
var _badgeTimer    = null;

/**
 * 添加一条简报
 * @param {string} type   - 见 BRIEFING_TYPES
 * @param {string} text   - 支持 <strong> 等简单 HTML
 */
function addBriefing(type, text) {
    var meta = BRIEFING_TYPES[type] || BRIEFING_TYPES.system;
    var now  = new Date();
    var timeStr = _padZ(now.getHours()) + ':' + _padZ(now.getMinutes()) + ':' + _padZ(now.getSeconds());

    var entry = { type: type, icon: meta.icon, text: text, time: timeStr };
    _briefingLog.unshift(entry);           // 最新在顶部
    if (_briefingLog.length > _MAX_LOG) _briefingLog.pop();

    _renderBriefing(entry);
    _flashBadge();
}

function _padZ(n) { return n < 10 ? '0' + n : '' + n; }

// 将单条记录插入 DOM（最新插在最顶部）
function _renderBriefing(entry) {
    var list = document.getElementById('briefingList');
    if (!list) return;

    // 移除"暂无动态"占位符
    var empty = list.querySelector('.briefing-empty');
    if (empty) empty.remove();

    // 超出上限时移除末尾旧条目
    var items = list.querySelectorAll('.briefing-item');
    if (items.length >= _MAX_LOG) {
        list.removeChild(items[items.length - 1]);
    }

    var div = document.createElement('div');
    div.className = 'briefing-item type-' + entry.type;
    div.innerHTML =
        '<span class="briefing-icon">' + entry.icon + '</span>' +
        '<span class="briefing-text">'  + entry.text + '</span>' +
        '<span class="briefing-time">'  + entry.time + '</span>';

    // 插到最前面（最新在顶）
    list.insertBefore(div, list.firstChild);
}

// NEW 角标：出现 3 秒后消失
function _flashBadge() {
    var badge = document.getElementById('briefingBadge');
    if (!badge) return;
    badge.style.display = 'inline-block';
    if (_badgeTimer) clearTimeout(_badgeTimer);
    _badgeTimer = setTimeout(function() {
        badge.style.display = 'none';
    }, 3000);
}

// ==================== 各模块的快捷推送函数 ====================

/** 捕获怪兽 */
function briefCatch(monsterName, zoneName) {
    addBriefing('catch', '在 <strong>' + zoneName + '</strong> 捕获了 <strong>' + monsterName + '</strong>！');
}

/** 怪兽升级 */
function briefLevelUp(monsterName, level) {
    addBriefing('levelup', '<strong>' + monsterName + '</strong> 升到了 <strong>Lv.' + level + '</strong>！');
}

/** 作物收获（含怪兽自动收获）*/
function briefHarvest(cropName, coins, food, byMonster) {
    var who = byMonster ? ('<strong>' + byMonster + '</strong> 自动') : '手动';
    addBriefing('harvest', who + '收获 <strong>' + cropName + '</strong>，+' + coins + '💰 +' + food + '🍎');
}

/** 探索区域结算 */
function briefExplore(zoneName, rewards, monsterName) {
    var rewardStr = _fmtRewards(rewards);
    var who = monsterName ? '<strong>' + monsterName + '</strong> 在' : '在';
    addBriefing('explore', who + ' <strong>' + zoneName + '</strong> 完成探索，获得 ' + rewardStr);
}

/** 随机事件 */
function briefEvent(title, result) {
    addBriefing('event', '随机事件「<strong>' + title + '</strong>」—— ' + result);
}

/** 科技解锁 */
function briefTech(techName) {
    addBriefing('tech', '解锁科技「<strong>' + techName + '</strong>」！');
}

/** 繁殖后代 */
function briefBreed(childName, parents) {
    addBriefing('breed', '<strong>' + parents + '</strong> 繁殖出 <strong>' + childName + '</strong>！');
}

/** 手动 / 自动保存 */
function briefSave(auto) {
    addBriefing('save', auto ? '自动存档完成。' : '手动存档完成。');
}

/** 系统消息（如怪兽被召回、地块解锁等）*/
function briefSystem(msg) {
    addBriefing('system', msg);
}

// 格式化奖励对象为短字符串
function _fmtRewards(rewards) {
    var parts = [];
    if (rewards.coins    > 0) parts.push('+' + rewards.coins    + '💰');
    if (rewards.food     > 0) parts.push('+' + rewards.food     + '🍎');
    if (rewards.materials> 0) parts.push('+' + rewards.materials+ '🪨');
    if (rewards.research > 0) parts.push('+' + rewards.research + '🔬');
    return parts.length ? parts.join(' ') : '无';
}

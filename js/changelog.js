// ==================== 更新公告系统 ====================
// 每次更新后在此数组开头添加新条目，最新版本在最上方
// version: 版本号  date: 日期(YYYY-MM-DD)  tag: 标签类型(new/fix/improve/balance)
// changes: 更新内容数组，每项 { tag, text }

var CHANGELOG = [
    {
        version: '0.9.5',
        date:    '2026-02-27',
        title:   '移动端体验改善',
        changes: [
            { tag: 'new',     text: '移动端首次访问时弹出体验提示，告知当前为移动端模式并建议使用 PC 端游玩' },
            { tag: 'fix',     text: '修复移动端底部导航栏"怪兽"页签图标显示为绿色史莱姆，改为与 PC 端一致的紫色图标' },
            { tag: 'improve', text: '底部导航栏各页签图标容器尺寸统一，确保六个图标垂直对齐一致' }
        ]
    },
    {
        version: '0.9.4',
        date:    '2026-02-27',
        title:   '更新公告日期修正',
        changes: [
            { tag: 'fix',     text: '修正更新公告中所有历史版本的虚构日期，统一更正为实际开发日期（2026-02-26 / 27）' }
        ]
    },
    {
        version: '0.9.3',
        date:    '2026-02-27',
        title:   '存档系统重大修复',
        changes: [
            { tag: 'fix',     text: '修复手动"拉取云档"按钮有时弹出"本地已同步"而非选择弹窗的逻辑错误' },
            { tag: 'fix',     text: '修复探索区域的派遣编队、区域进度、通行证等状态不会被存入存档的问题，换设备后将正确恢复' },
            { tag: 'new',     text: '新增更新公告系统，在设置面板可查看历次版本变化' }
        ]
    },
    {
        version: '0.9.2',
        date:    '2026-02-27',
        title:   '云存档稳定性修复',
        changes: [
            { tag: 'fix',     text: '修复应用云端存档时因页面重载触发自动保存，导致刚写入的云端数据被旧内存数据覆盖的问题' },
            { tag: 'fix',     text: '修复农场地块作物状态（生长进度、作物种类等）在自动保存时被清空的问题' },
            { tag: 'fix',     text: '修复读档后地块数据未被恢复，及初始化时重复创建空地块的问题' },
            { tag: 'fix',     text: '修复登录触发自动同步时时间戳比较逻辑错误，导致云端存档判断失误' },
            { tag: 'improve', text: '手动"拉取云档"时无论时间戳新旧，均会弹窗让玩家选择，防止误操作覆盖本地进度' }
        ]
    },
    {
        version: '0.9.1',
        date:    '2026-02-26',
        title:   '账号与通知优化',
        changes: [
            { tag: 'fix',     text: '修复魔法链接重定向到 localhost 导致无法打开页面的问题' },
            { tag: 'fix',     text: '修复游戏通知（邮件发送/登录成功等）被设置弹窗遮挡、显示置灰的问题' },
            { tag: 'improve', text: '通知层级提升至最顶层，在任何弹窗打开时均可正常显示' }
        ]
    },
    {
        version: '0.9.0',
        date:    '2026-02-26',
        title:   '云存档 & 账号系统上线',
        changes: [
            { tag: 'new',     text: '新增云账号系统，支持邮箱密码注册/登录、魔法链接免密登录' },
            { tag: 'new',     text: '新增云端存档功能，登录后可在多设备之间同步游戏进度' },
            { tag: 'new',     text: '新增存档冲突弹窗，当云端与本地存档不一致时由玩家选择保留哪份' },
            { tag: 'new',     text: '新增"立即同步"与"拉取云档"按钮，可在设置面板操作' }
        ]
    },
    {
        version: '0.8.5',
        date:    '2026-02-26',
        title:   '探索系统扩展',
        changes: [
            { tag: 'new',     text: '新增多个高级探索区域，解锁后可遇到稀有怪兽' },
            { tag: 'new',     text: '探索区域支持购买通行证永久解锁，无需反复消耗金币' },
            { tag: 'improve', text: '自动探索速度公式优化，派遣怪兽数量越多效率提升越明显' },
            { tag: 'balance', text: '手动探索的能量消耗小幅降低，早期游戏体验更顺畅' }
        ]
    },
    {
        version: '0.8.0',
        date:    '2026-02-26',
        title:   '多语言 & 字体支持',
        changes: [
            { tag: 'new',     text: '游戏新增多语言支持，可在设置中切换中文/英文/日文' },
            { tag: 'new',     text: '新增字体大小调节（小/中/大/超大），适配不同屏幕和视力需求' },
            { tag: 'improve', text: '设置面板整体重新设计，存档导入导出更方便' }
        ]
    },
    {
        version: '0.7.0',
        date:    '2026-02-26',
        title:   '科技树 & 繁殖系统',
        changes: [
            { tag: 'new',     text: '新增科技树系统，解锁后可提升产量、加速作物生长、解锁高级作物' },
            { tag: 'new',     text: '新增怪兽繁殖系统，后代继承双亲平均属性并可能获得特殊特性' },
            { tag: 'new',     text: '新增怪兽特性系统（农夫/幸运/勤劳等），影响农场和探索效率' },
            { tag: 'balance', text: '怪兽升级所需经验值曲线调整，中后期成长更具节奏感' }
        ]
    },
    {
        version: '0.6.0',
        date:    '2026-02-26',
        title:   '农场自动化',
        changes: [
            { tag: 'new',     text: '怪兽可被派遣驻守农田，实现自动播种与自动收获' },
            { tag: 'new',     text: '不同怪兽对专长作物有速度和优质率加成' },
            { tag: 'new',     text: '新增随机事件系统（暴雨增产、虫害、商人等）' },
            { tag: 'improve', text: '农场地块解锁条件调整，前三块免费，后续需金币+材料解锁' }
        ]
    }
];

// ── Tag 样式映射 ──
var _changelogTagStyle = {
    'new':     { bg: '#1a3a1a', border: '#46d164', color: '#46d164', label: '新增' },
    'fix':     { bg: '#3a1a1a', border: '#f85149', color: '#f85149', label: '修复' },
    'improve': { bg: '#1a2a3a', border: '#58a6ff', color: '#58a6ff', label: '优化' },
    'balance': { bg: '#3a2d0a', border: '#f0c53d', color: '#f0c53d', label: '调整' }
};

// ── 打开更新公告弹窗 ──
window.showChangelog = function() {
    var UNREAD_KEY = 'mf_changelog_read';
    var lastRead   = localStorage.getItem(UNREAD_KEY) || '';

    var html = '<div class="modal-header">📋 更新公告</div>' +
        '<div style="max-height:65vh;overflow-y:auto;padding:2px 4px 8px;">';

    CHANGELOG.forEach(function(entry, idx) {
        var isNew = (idx === 0 && entry.version !== lastRead);
        var newBadge = isNew
            ? '<span style="background:#1f6feb;color:#fff;font-size:10px;padding:1px 7px;border-radius:10px;margin-left:8px;vertical-align:middle;">NEW</span>'
            : '';

        html += '<div style="margin-bottom:16px;background:#161b22;border:1px solid #30363d;border-radius:10px;overflow:hidden;">' +
            // 版本标题栏
            '<div style="background:#21262d;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">' +
                '<div style="font-size:14px;font-weight:700;color:#e6edf3;">v' + entry.version +
                    ' · ' + entry.title + newBadge + '</div>' +
                '<div style="font-size:12px;color:#8b949e;">' + entry.date + '</div>' +
            '</div>' +
            // 更新条目
            '<ul style="margin:0;padding:10px 14px 10px 14px;list-style:none;">';

        entry.changes.forEach(function(c) {
            var ts = _changelogTagStyle[c.tag] || _changelogTagStyle['improve'];
            html += '<li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;font-size:13px;color:#c9d1d9;line-height:1.5;">' +
                '<span style="flex-shrink:0;margin-top:1px;font-size:11px;font-weight:600;padding:1px 7px;border-radius:10px;' +
                    'background:' + ts.bg + ';border:1px solid ' + ts.border + ';color:' + ts.color + ';">' +
                    ts.label +
                '</span>' +
                '<span>' + c.text + '</span>' +
                '</li>';
        });

        html += '</ul></div>';
    });

    html += '</div>' +
        '<div class="modal-buttons">' +
        '<button class="btn btn-primary" onclick="closeModal()">关闭</button>' +
        '</div>';

    showModal(html);

    // 标记最新版本已读
    if (CHANGELOG.length > 0) {
        localStorage.setItem(UNREAD_KEY, CHANGELOG[0].version);
    }
};

// ── 计算未读数（有新版本时返回 1，否则 0）──
window.getChangelogUnread = function() {
    var lastRead = localStorage.getItem('mf_changelog_read') || '';
    return (CHANGELOG.length > 0 && CHANGELOG[0].version !== lastRead) ? 1 : 0;
};

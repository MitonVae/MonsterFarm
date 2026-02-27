// ==================== 怪兽筛选 / 排序 / 系谱 模块 ====================
// 统一管理所有"选择怪兽"弹窗的筛选、排序逻辑
// 对外暴露：
//   buildFilterBar(opts)         → HTML 字符串，工具栏 + 搜索
//   applyFilter(monsters, state) → 过滤后的怪兽数组
//   sortMonsters(monsters, key)  → 排序后的怪兽数组
//   renderMonsterPickList(...)   → 完整的列表 HTML（含筛选器）
//   showMonsterPickModal(opts)   → 统一的选怪弹窗入口
//   getLineage(monster)          → 获取血统文本
//   getLineageTree(monster)      → 获取文字系谱树
// =====================================================================

(function() {
    'use strict';

    // ── 稀有度颜色 ──
    var RARITY_COLOR = {
        common:    '#8b949e',
        uncommon:  '#46d164',
        rare:      '#58a6ff',
        epic:      '#bc8cff',
        legendary: '#f0c53d'
    };
    var RARITY_LABEL = {
        common: '普通', uncommon: '稀有', rare: '珍贵', epic: '史诗', legendary: '传说'
    };

    // ── 排序键定义 ──
    var SORT_OPTIONS = [
        { key: 'default',      label: '默认顺序' },
        { key: 'level_desc',   label: '等级 ↓' },
        { key: 'level_asc',    label: '等级 ↑' },
        { key: 'farming_desc', label: '耕作 ↓' },
        { key: 'strength_desc',label: '力量 ↓' },
        { key: 'agility_desc', label: '敏捷 ↓' },
        { key: 'intelligence_desc', label: '智力 ↓' },
        { key: 'total_desc',   label: '综合 ↓' },
        { key: 'generation_asc',  label: '代数 ↑' },
        { key: 'generation_desc', label: '代数 ↓' },
        { key: 'rarity_desc',  label: '稀有度 ↓' },
        { key: 'name_asc',     label: '名称 A-Z' }
    ];

    // ── 筛选器状态存储（按 context 区分，如 'farm', 'explore', 'breeding'）──
    var _filterState = {};

    function getFS(ctx) {
        if (!_filterState[ctx]) {
            _filterState[ctx] = {
                search: '',
                rarity: 'all',
                type:   'all',
                minLevel: 0,
                maxLevel: 99,
                minGen:   0,
                maxGen:   99,
                trait:  'all',
                sort:   'default',
                statusFilter: 'idle'  // idle | all
            };
        }
        return _filterState[ctx];
    }
    window._mfGetFilterState = getFS;

    // ── 应用筛选 ──
    window.applyMonsterFilter = function(monsters, ctx) {
        var s = getFS(ctx);
        return monsters.filter(function(m) {
            // 状态筛选
            if (s.statusFilter === 'idle' && m.status !== 'idle') return false;

            // 搜索（名字或类型名）
            if (s.search) {
                var q = s.search.toLowerCase();
                var typeName = (monsterTypes[m.type] ? monsterTypes[m.type].name : '').toLowerCase();
                if (m.name.toLowerCase().indexOf(q) === -1 && typeName.indexOf(q) === -1) return false;
            }

            // 稀有度
            if (s.rarity !== 'all') {
                var td = monsterTypes[m.type];
                if (!td || td.rarity !== s.rarity) return false;
            }

            // 品种
            if (s.type !== 'all' && m.type !== s.type) return false;

            // 等级
            if (m.level < s.minLevel || m.level > s.maxLevel) return false;

            // 代数
            if ((m.generation || 1) < s.minGen || (m.generation || 1) > s.maxGen) return false;

            // 特性
            if (s.trait !== 'all') {
                var hasTrait = m.traits && m.traits.some(function(t) { return t.id === s.trait; });
                if (!hasTrait) return false;
            }

            return true;
        });
    };

    // ── 排序 ──
    window.sortMonsterList = function(monsters, sortKey) {
        var arr = monsters.slice();
        var rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        function totalStats(m) {
            return m.stats.strength + m.stats.agility + m.stats.intelligence + m.stats.farming;
        }
        switch (sortKey) {
            case 'level_desc':   arr.sort(function(a,b){ return b.level - a.level; }); break;
            case 'level_asc':    arr.sort(function(a,b){ return a.level - b.level; }); break;
            case 'farming_desc': arr.sort(function(a,b){ return b.stats.farming - a.stats.farming; }); break;
            case 'strength_desc':arr.sort(function(a,b){ return b.stats.strength - a.stats.strength; }); break;
            case 'agility_desc': arr.sort(function(a,b){ return b.stats.agility - a.stats.agility; }); break;
            case 'intelligence_desc': arr.sort(function(a,b){ return b.stats.intelligence - a.stats.intelligence; }); break;
            case 'total_desc':   arr.sort(function(a,b){ return totalStats(b) - totalStats(a); }); break;
            case 'generation_asc':  arr.sort(function(a,b){ return (a.generation||1) - (b.generation||1); }); break;
            case 'generation_desc': arr.sort(function(a,b){ return (b.generation||1) - (a.generation||1); }); break;
            case 'rarity_desc':  arr.sort(function(a,b){
                var ra = rarityOrder[(monsterTypes[a.type] || {}).rarity] || 0;
                var rb = rarityOrder[(monsterTypes[b.type] || {}).rarity] || 0;
                return rb - ra;
            }); break;
            case 'name_asc': arr.sort(function(a,b){ return a.name.localeCompare(b.name); }); break;
            default: break; // 保持原顺序
        }
        return arr;
    };

    // ── 构建筛选工具栏 HTML ──
    // opts: { ctx, pinCropType, showBonusFirst, extraHtml }
    // pinCropType: 如果设置，顶部显示对该作物有加成的怪兽
    window.buildMonsterFilterBar = function(opts) {
        opts = opts || {};
        var ctx   = opts.ctx || 'default';
        var s     = getFS(ctx);

        // 收集所有可用特性
        var traitPool = {};
        (gameState.monsters || []).forEach(function(m) {
            (m.traits || []).forEach(function(t) { traitPool[t.id] = t.name; });
        });
        var traitOpts = '<option value="all">全部特性</option>' +
            Object.keys(traitPool).map(function(id) {
                return '<option value="' + id + '"' + (s.trait === id ? ' selected' : '') + '>' + traitPool[id] + '</option>';
            }).join('');

        // 品种选项
        var typeOpts = '<option value="all">全部品种</option>' +
            Object.keys(monsterTypes).map(function(k) {
                var t = monsterTypes[k];
                return '<option value="' + k + '"' + (s.type === k ? ' selected' : '') + '>' + t.name + '</option>';
            }).join('');

        // 稀有度选项
        var rarityOpts = '<option value="all">全部稀有度</option>' +
            ['common','uncommon','rare','epic','legendary'].map(function(r) {
                return '<option value="' + r + '"' + (s.rarity === r ? ' selected' : '') + '>' + RARITY_LABEL[r] + '</option>';
            }).join('');

        // 排序选项
        var sortOpts = SORT_OPTIONS.map(function(o) {
            return '<option value="' + o.key + '"' + (s.sort === o.key ? ' selected' : '') + '>' + o.label + '</option>';
        }).join('');

        var idPfx = 'mf_' + ctx;

        return [
            '<div class="mf-filterbar" data-ctx="' + ctx + '">',
            // ── 第一行：搜索 + 排序 ──
            '<div class="mf-row">',
            '<input class="mf-search" id="' + idPfx + '_search" type="text" placeholder="搜索名字/品种…"',
            ' value="' + (s.search || '') + '"',
            ' oninput="window._mfUpdate(\'' + ctx + '\',\'search\',this.value)">',
            '<select class="mf-select" id="' + idPfx + '_sort" onchange="window._mfUpdate(\'' + ctx + '\',\'sort\',this.value)">',
            sortOpts, '</select>',
            '</div>',
            // ── 第二行：稀有度 + 品种 + 特性 ──
            '<div class="mf-row">',
            '<select class="mf-select" id="' + idPfx + '_rarity" onchange="window._mfUpdate(\'' + ctx + '\',\'rarity\',this.value)">', rarityOpts, '</select>',
            '<select class="mf-select" id="' + idPfx + '_type"   onchange="window._mfUpdate(\'' + ctx + '\',\'type\',this.value)">', typeOpts, '</select>',
            '<select class="mf-select" id="' + idPfx + '_trait"  onchange="window._mfUpdate(\'' + ctx + '\',\'trait\',this.value)">', traitOpts, '</select>',
            '</div>',
            // ── 第三行：等级 + 代数范围 ──
            '<div class="mf-row mf-row-range">',
            '<label>等级</label>',
            '<input type="number" min="1" max="99" class="mf-range-input" value="' + (s.minLevel||1) + '" placeholder="最低" onchange="window._mfUpdate(\'' + ctx + '\',\'minLevel\',+this.value)">',
            '<span>~</span>',
            '<input type="number" min="1" max="99" class="mf-range-input" value="' + (s.maxLevel||99) + '" placeholder="最高" onchange="window._mfUpdate(\'' + ctx + '\',\'maxLevel\',+this.value)">',
            '<label style="margin-left:12px;">代数</label>',
            '<input type="number" min="1" max="99" class="mf-range-input" value="' + (s.minGen||1) + '" placeholder="最低" onchange="window._mfUpdate(\'' + ctx + '\',\'minGen\',+this.value)">',
            '<span>~</span>',
            '<input type="number" min="1" max="99" class="mf-range-input" value="' + (s.maxGen||99) + '" placeholder="最高" onchange="window._mfUpdate(\'' + ctx + '\',\'maxGen\',+this.value)">',
            '<button class="mf-reset-btn" onclick="window._mfReset(\'' + ctx + '\')">重置</button>',
            '</div>',
            '</div>'
        ].join('');
    };

    // ── 筛选器更新回调（由 HTML onchange/oninput 调用）──
    window._mfUpdate = function(ctx, key, val) {
        var s = getFS(ctx);
        if (key === 'minLevel' || key === 'maxLevel' || key === 'minGen' || key === 'maxGen') {
            s[key] = isNaN(val) ? (key.indexOf('min') === 0 ? 1 : 99) : Math.max(1, Math.min(99, val));
        } else {
            s[key] = val;
        }
        // 触发对应上下文的列表刷新
        if (typeof window['_mfRefresh_' + ctx] === 'function') {
            window['_mfRefresh_' + ctx]();
        }
    };

    // ── 重置筛选 ──
    window._mfReset = function(ctx) {
        _filterState[ctx] = null;
        getFS(ctx); // 重新初始化
        if (typeof window['_mfRefresh_' + ctx] === 'function') {
            window['_mfRefresh_' + ctx]();
        }
    };

    // ==================== 系谱 / 血统 ====================

    /**
     * 获取一只怪兽的简短血统描述文本
     * @param {object} monster
     * @returns {string}
     */
    window.getMonsterLineage = function(monster) {
        if (!monster) return '—';
        var gen = monster.generation || 1;
        if (gen === 1) return '野生原种（第 1 代）';
        var p1 = monster.parent1Name || '未知';
        var p2 = monster.parent2Name || '未知';
        return '第 ' + gen + ' 代 · 父母：' + p1 + ' × ' + p2;
    };

    /**
     * 递归查找祖先，生成文字系谱树（最多3层）
     * 返回多行字符串（每行带缩进前缀）
     */
    window.getMonsterLineageTree = function(monster, depth, prefix) {
        depth  = depth  === undefined ? 0 : depth;
        prefix = prefix === undefined ? ''  : prefix;
        if (!monster || depth > 3) return '';

        var indent = prefix;
        var nameStr = '<span style="color:#e6edf3;font-weight:' + (depth === 0 ? '700' : '400') + ';">' + monster.name + '</span>';
        var typeStr = '<span style="color:#8b949e;">' + (monsterTypes[monster.type] ? monsterTypes[monster.type].name : monster.type) + '</span>';
        var lvStr   = '<span style="color:#58a6ff;">Lv.' + monster.level + '</span>';
        var genStr  = '<span style="color:#f0c53d;">G' + (monster.generation || 1) + '</span>';
        var lines   = [indent + nameStr + ' ' + typeStr + ' ' + lvStr + ' ' + genStr];

        if (monster.generation > 1 && (monster.parent1Id || monster.parent2Id)) {
            var childPrefix = prefix + '│ ';
            var lastPrefix  = prefix + '  ';
            // 找父母
            var p1 = monster.parent1Id ? gameState.monsters.find(function(m){ return m.id === monster.parent1Id; }) : null;
            var p2 = monster.parent2Id ? gameState.monsters.find(function(m){ return m.id === monster.parent2Id; }) : null;
            var p1Name = p1 ? null : (monster.parent1Name || null);
            var p2Name = p2 ? null : (monster.parent2Name || null);

            if (p1 || p1Name) {
                var p1Label = p1 ? null : ('<span style="color:#8b949e;">' + p1Name + '（已离队）</span>');
                lines.push(prefix + '├─ ' + (p1 ? '' : '') );
                if (p1) {
                    var sub = getMonsterLineageTree(p1, depth + 1, childPrefix);
                    if (sub) lines[lines.length - 1] = prefix + '├─ ' + sub.replace(childPrefix, '');
                } else {
                    lines[lines.length - 1] = prefix + '├─ ' + p1Label;
                }
            }
            if (p2 || p2Name) {
                var p2Label = p2 ? null : ('<span style="color:#8b949e;">' + p2Name + '（已离队）</span>');
                if (p2) {
                    var sub2 = getMonsterLineageTree(p2, depth + 1, lastPrefix);
                    lines.push(prefix + '└─ ' + sub2.replace(lastPrefix, ''));
                } else {
                    lines.push(prefix + '└─ ' + p2Label);
                }
            }
        }
        return lines.join('<br>');
    };

    // ── 显示系谱弹窗 ──
    window.showLineageModal = function(monsterId) {
        var monster = gameState.monsters.find(function(m){ return m.id === monsterId; });
        if (!monster) return;
        var tree = getMonsterLineageTree(monster);
        var html =
            '<div class="modal-header">🧬 ' + monster.name + ' 的系谱</div>' +
            '<div style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:14px;' +
                'font-family:monospace;font-size:12px;line-height:2;max-height:50vh;overflow-y:auto;">' +
            (tree || '<span style="color:#8b949e;">野生原种，无繁殖记录</span>') +
            '</div>' +
            '<div style="margin-top:12px;font-size:12px;color:#8b949e;line-height:1.8;">' +
                '代数：<strong style="color:#f0c53d;">' + (monster.generation||1) + '</strong>　' +
                '品种：<strong style="color:#e6edf3;">' + (monsterTypes[monster.type]? monsterTypes[monster.type].name : monster.type) + '</strong>　' +
                '稀有度：<strong style="color:' + (RARITY_COLOR[(monsterTypes[monster.type]||{}).rarity]||'#8b949e') + ';">' + (RARITY_LABEL[(monsterTypes[monster.type]||{}).rarity]||'—') + '</strong>' +
            '</div>' +
            '<div class="modal-buttons"><button class="btn btn-secondary" onclick="closeModal()">关闭</button></div>';
        showModal(html);
    };

    // ==================== 通用选怪弹窗 ====================
    /**
     * opts:
     *   ctx         — 上下文标识（'farm'|'explore'|'breeding_1'|'breeding_2'）
     *   title       — 弹窗标题
     *   monsters    — 候选怪兽数组
     *   onSelect    — function(monsterId) 选择回调
     *   pinCropType — 作物 id（用于高亮有加成的怪兽）
     *   excludeIds  — 排除的怪兽 id 数组
     *   showLineage — 是否显示血统按钮
     *   extraInfo   — function(m) → HTML 字符串，额外信息列
     */
    window.showMonsterPickModal = function(opts) {
        opts = opts || {};
        var ctx         = opts.ctx       || 'default';
        var title       = opts.title     || '选择怪兽';
        var candidatePool = (opts.monsters || gameState.monsters).filter(function(m) {
            if (m.status !== 'idle') return false;
            if (opts.excludeIds && opts.excludeIds.indexOf(m.id) !== -1) return false;
            return true;
        });
        var pinCropType = opts.pinCropType || null;
        var showLineage = opts.showLineage !== false;

        if (candidatePool.length === 0) {
            showNotification('没有可用的空闲怪兽！', 'warning');
            return;
        }

        // 注册刷新钩子
        window['_mfRefresh_' + ctx] = function() {
            var bodyEl = document.getElementById('mf_body_' + ctx);
            if (bodyEl) bodyEl.innerHTML = _renderPickList(ctx, candidatePool, opts);
        };

        var html =
            '<div class="modal-header">' + title + '</div>' +
            buildMonsterFilterBar({ ctx: ctx }) +
            '<div id="mf_body_' + ctx + '" style="max-height:52vh;overflow-y:auto;margin-top:6px;">' +
                _renderPickList(ctx, candidatePool, opts) +
            '</div>' +
            '<div class="modal-buttons"><button class="btn btn-secondary" onclick="closeModal()">取消</button></div>';

        showModal(html);
    };

    // ── 渲染怪兽选择列表（内部）──
    function _renderPickList(ctx, pool, opts) {
        var s          = getFS(ctx);
        var pinCropType= opts.pinCropType || null;
        var showLineage= opts.showLineage !== false;
        var onSelectFn = 'window._mfOnSelect_' + ctx;

        // 注册选择回调
        window['_mfOnSelect_' + ctx] = function(id) {
            closeModal();
            delete window['_mfOnSelect_' + ctx];
            delete window['_mfRefresh_' + ctx];
            if (opts.onSelect) opts.onSelect(id);
        };

        var filtered = applyMonsterFilter(pool, ctx);
        var sorted   = sortMonsterList(filtered, s.sort);

        // 若有作物类型，优先把有加成的放前面
        if (pinCropType) {
            var cropData = typeof cropTypes !== 'undefined' ? cropTypes.find(function(c){ return c.id === pinCropType; }) : null;
            var preferredType = cropData ? cropData.preferredMonster : null;
            if (preferredType) {
                var bonus   = sorted.filter(function(m){ return m.type === preferredType; });
                var noBonus = sorted.filter(function(m){ return m.type !== preferredType; });
                sorted = bonus.concat(noBonus);
            }
        }

        if (sorted.length === 0) {
            return '<div style="text-align:center;padding:30px;color:#8b949e;">没有符合条件的怪兽</div>';
        }

        var layout = (typeof getLayoutPref === 'function') ? getLayoutPref('monsters') : 'large';

        if (layout === 'compact') {
            return _renderCompact(sorted, ctx, pinCropType, showLineage, onSelectFn, opts);
        }
        return _renderLarge(sorted, ctx, pinCropType, showLineage, onSelectFn, opts);
    }

    function _renderLarge(sorted, ctx, pinCropType, showLineage, onSelectFn, opts) {
        var cropData = pinCropType && typeof cropTypes !== 'undefined'
            ? cropTypes.find(function(c){ return c.id === pinCropType; }) : null;
        var preferredMonsterType = cropData ? cropData.preferredMonster : null;

        return '<div style="display:flex;flex-direction:column;gap:6px;">' +
            sorted.map(function(m) {
                var td = monsterTypes[m.type] || {};
                var ts = m.stats.strength + m.stats.agility + m.stats.intelligence + m.stats.farming;
                var rc = RARITY_COLOR[td.rarity] || '#8b949e';
                var rl = RARITY_LABEL[td.rarity] || '';
                var isBonus = preferredMonsterType && m.type === preferredMonsterType;
                var farmBonus = '';
                if (isBonus && pinCropType) {
                    farmBonus = '<span style="background:#1a3a1a;color:#46d164;border:1px solid #46d164;' +
                        'font-size:10px;padding:1px 6px;border-radius:10px;margin-left:6px;">★ 专长加成</span>';
                }
                // 计算对当前作物的速度倍率（如果有 plot 上下文）
                var bonusDetail = '';
                if (isBonus) {
                    bonusDetail = '<div style="font-size:11px;color:#46d164;margin-top:3px;">耕作速度 ×1.25 · 优质率 +15%</div>';
                }
                // 额外信息
                var extra = opts.extraInfo ? opts.extraInfo(m) : '';
                // 代数 + 血统
                var lineageTag = (m.generation || 1) > 1
                    ? '<span style="color:#f0c53d;font-size:11px;">G' + m.generation + '</span> '
                    : '<span style="color:#8b949e;font-size:11px;">野生</span> ';

                var lineageBtn = showLineage
                    ? '<button class="btn btn-secondary" style="font-size:11px;padding:3px 8px;margin-right:4px;" ' +
                      'onclick="event.stopPropagation();showLineageModal(' + m.id + ');">🧬 系谱</button>'
                    : '';

                return '<div style="padding:10px 12px;background:#21262d;border-radius:8px;cursor:pointer;' +
                    'border:2px solid ' + (isBonus ? '#46d164' : '#30363d') + ';transition:border-color 0.15s;"' +
                    ' onclick="' + onSelectFn + '(' + m.id + ')"' +
                    ' onmouseover="this.style.borderColor=\'' + rc + '\'" onmouseout="this.style.borderColor=\'' + (isBonus ? '#46d164' : '#30363d') + '\'">' +
                    '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<div style="flex-shrink:0;">' + createSVG(m.type, 40) + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">' +
                                '<span style="font-weight:700;color:#e6edf3;">' + m.name + '</span>' +
                                '<span style="color:' + rc + ';font-size:11px;border:1px solid ' + rc + ';padding:0 5px;border-radius:10px;">' + rl + '</span>' +
                                lineageTag + farmBonus +
                            '</div>' +
                            '<div style="font-size:11px;color:#8b949e;margin-top:2px;">' +
                                td.name + ' · Lv.' + m.level + ' · 综合 <span style="color:#58a6ff;">' + ts + '</span>' +
                            '</div>' +
                            '<div style="font-size:11px;color:#8b949e;margin-top:2px;">' +
                                '力<b style="color:#e6edf3;">' + m.stats.strength + '</b> ' +
                                '敏<b style="color:#e6edf3;">' + m.stats.agility + '</b> ' +
                                '智<b style="color:#e6edf3;">' + m.stats.intelligence + '</b> ' +
                                '耕<b style="color:#46d164;">' + m.stats.farming + '</b>' +
                                (m.traits && m.traits.length ? ' · ' + m.traits.map(function(t){
                                    return '<span style="color:#bc8cff;">' + t.name + '</span>';
                                }).join(' ') : '') +
                            '</div>' +
                            bonusDetail + extra +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">' +
                            lineageBtn +
                        '</div>' +
                    '</div>' +
                    '</div>';
            }).join('') +
            '</div>';
    }

    function _renderCompact(sorted, ctx, pinCropType, showLineage, onSelectFn, opts) {
        var cropData = pinCropType && typeof cropTypes !== 'undefined'
            ? cropTypes.find(function(c){ return c.id === pinCropType; }) : null;
        var preferredMonsterType = cropData ? cropData.preferredMonster : null;

        return '<div class="compact-list" style="padding:4px 0;">' +
            sorted.map(function(m) {
                var td = monsterTypes[m.type] || {};
                var ts = m.stats.strength + m.stats.agility + m.stats.intelligence + m.stats.farming;
                var rc = RARITY_COLOR[td.rarity] || '#8b949e';
                var isBonus = preferredMonsterType && m.type === preferredMonsterType;
                var lineageBtn = showLineage
                    ? '<button class="compact-btn" onclick="event.stopPropagation();showLineageModal(' + m.id + ');" title="查看系谱">🧬</button>'
                    : '';
                return '<div class="compact-card" onclick="' + onSelectFn + '(' + m.id + ')" ' +
                    'style="border-color:' + (isBonus ? '#46d164' : '') + '">' +
                    '<div style="flex-shrink:0;">' + createSVG(m.type, 26) + '</div>' +
                    '<div style="display:flex;flex-direction:column;min-width:0;flex:1;gap:1px;">' +
                        '<span class="compact-name">' + m.name +
                            (isBonus ? ' <span style="color:#46d164;font-size:10px;">★</span>' : '') + '</span>' +
                        '<span class="compact-sub" style="color:' + rc + ';">' + td.name +
                            ' Lv.' + m.level + ' G' + (m.generation||1) + ' · 综合' + ts + '</span>' +
                    '</div>' +
                    '<span class="compact-sub" style="flex-shrink:0;">耕<b style="color:#46d164;">' + m.stats.farming + '</b></span>' +
                    lineageBtn +
                    '</div>';
            }).join('') +
            '</div>';
    }

    // ==================== CSS 注入 ====================
    var style = document.createElement('style');
    style.textContent = [
        // 筛选栏
        '.mf-filterbar{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:8px 10px;margin-bottom:4px;display:flex;flex-direction:column;gap:6px;}',
        '.mf-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}',
        '.mf-row-range{font-size:12px;color:#8b949e;}',
        '.mf-search{flex:1;min-width:120px;padding:6px 10px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-size:12px;}',
        '.mf-select{padding:5px 8px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-size:12px;cursor:pointer;}',
        '.mf-range-input{width:48px;padding:4px 6px;background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font-size:12px;text-align:center;}',
        '.mf-reset-btn{margin-left:auto;padding:4px 10px;background:none;border:1px solid #f85149;border-radius:5px;color:#f85149;font-size:11px;cursor:pointer;}',
        '.mf-reset-btn:hover{background:#f85149;color:#fff;}',
    ].join('\n');
    document.head.appendChild(style);

})();

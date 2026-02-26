/**
 * resizer.js - 三栏 Grid 布局可拖拽分隔条（全新方案）
 *
 * 架构：把 .app-container 改为 CSS Grid，列定义为：
 *   [左栏] [左手柄4px] [中栏1fr] [右手柄4px] [右栏]
 *
 * 手柄是 Grid 子项，物理上就夹在两栏之间，天然对齐，无需任何坐标计算。
 * 拖拽时只修改 grid-template-columns 中的左栏/右栏像素值。
 */

(function () {
    'use strict';

    var CONFIG = {
        LEFT:  { min: 160, max: 400, def: 260, key: 'grd_left_w'  },
        RIGHT: { min: 180, max: 450, def: 280, key: 'grd_right_w' },
        CENTER_MIN: 320,
        HANDLE_PX: 8,
        BREAKPOINT: 1024,
        BRIEFING: { min: 80, max: 500, def: 180, key: 'grd_briefing_h' }
    };

    var leftW  = CONFIG.LEFT.def;
    var rightW = CONFIG.RIGHT.def;

    var dragging = false;
    var side     = null;
    var startX   = 0;
    var startW   = 0;

    // 垂直拖拽状态
    var vDragging = false;
    var vStartY   = 0;
    var vStartH   = 0;
    var briefingH = CONFIG.BRIEFING.def;

    var appEl, leftSidebar, rightSidebar, mainEl;
    var leftHandle, rightHandle;
    var briefingPanel, briefingVResizer, mainContent;

    /* ── 初始化 ── */
    function init() {
        appEl        = document.querySelector('.app-container');
        leftSidebar  = document.getElementById('sidebar');
        rightSidebar = document.getElementById('monsterSidebar');
        mainEl       = document.querySelector('.main-container');

        if (!appEl || !leftSidebar || !rightSidebar || !mainEl) return;

        // 读取存储宽度
        var sl = parseInt(localStorage.getItem(CONFIG.LEFT.key));
        var sr = parseInt(localStorage.getItem(CONFIG.RIGHT.key));
        if (sl >= CONFIG.LEFT.min  && sl <= CONFIG.LEFT.max)  leftW  = sl;
        if (sr >= CONFIG.RIGHT.min && sr <= CONFIG.RIGHT.max) rightW = sr;

        // app-container 改为 grid（直接设置各属性，避免 cssText 追加时旧 display:flex 优先级更高的问题）
        appEl.style.setProperty('display', 'grid', 'important');
        appEl.style.height     = '100vh';
        appEl.style.overflow   = 'hidden';
        appEl.style.minHeight  = 'unset';

        // 侧边栏：脱离 fixed，成为 grid 列子项
        leftSidebar.style.setProperty('position', 'relative', 'important');
        leftSidebar.style.setProperty('left', 'unset', 'important');
        leftSidebar.style.setProperty('top', 'unset', 'important');
        leftSidebar.style.height   = '100vh';
        leftSidebar.style.overflowY = 'auto';
        leftSidebar.style.width    = 'auto';
        leftSidebar.style.zIndex   = 'auto';

        rightSidebar.style.setProperty('position', 'relative', 'important');
        rightSidebar.style.setProperty('right', 'unset', 'important');
        rightSidebar.style.setProperty('top', 'unset', 'important');
        rightSidebar.style.height    = '100vh';
        rightSidebar.style.overflowY = 'hidden';
        rightSidebar.style.width     = 'auto';
        rightSidebar.style.zIndex    = 'auto';

        mainEl.style.setProperty('margin', '0', 'important');
        mainEl.style.height    = '100vh';
        mainEl.style.minHeight = 'unset';
        mainEl.style.overflow  = 'hidden';

        // mobile-bottom-nav 排除在 grid 列之外（用 position:fixed 固定在底部）
        var mobileNav = document.querySelector('.mobile-bottom-nav');
        if (mobileNav) {
            mobileNav.style.position = 'fixed';
            // 给 grid 设置 grid-column:1/-1 让它不占列，实际我们直接让它不参与 grid 行
            mobileNav.style.gridColumn = '1 / -1';
            mobileNav.style.gridRow    = '2';
        }

        // 创建两个手柄，插入到 DOM 正确位置
        leftHandle  = makeHandle('grd-left-resizer');
        rightHandle = makeHandle('grd-right-resizer');

        // Grid 顺序：leftSidebar | leftHandle | mainEl | rightHandle | rightSidebar
        appEl.insertBefore(leftHandle,  mainEl);
        appEl.insertBefore(rightHandle, rightSidebar);

        // 事件绑定
        leftHandle.addEventListener ('mousedown', function(e){ startDrag(e, 'left');  });
        rightHandle.addEventListener('mousedown', function(e){ startDrag(e, 'right'); });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);

        leftHandle.addEventListener ('touchstart', function(e){ startDrag(e.touches[0], 'left');  }, { passive: false });
        rightHandle.addEventListener('touchstart', function(e){ startDrag(e.touches[0], 'right'); }, { passive: false });
        document.addEventListener('touchmove', function(e){ onMove(e.touches[0]); }, { passive: true });
        document.addEventListener('touchend', onUp);

        window.addEventListener('resize', applyGrid);

        applyGrid();

        // ── 简报面板垂直拖拽 ──
        briefingPanel   = document.getElementById('briefingSection');
        briefingVResizer = document.getElementById('briefingVResizer');
        mainContent      = document.querySelector('.main-content');

        if (briefingPanel && briefingVResizer) {
            // 读取存储高度
            var sbh = parseInt(localStorage.getItem(CONFIG.BRIEFING.key));
            if (sbh >= CONFIG.BRIEFING.min && sbh <= CONFIG.BRIEFING.max) briefingH = sbh;

            applyBriefingHeight();

            briefingVResizer.addEventListener('mousedown', startVDrag);
            document.addEventListener('mousemove', onVMove);
            document.addEventListener('mouseup', onVUp);

            briefingVResizer.addEventListener('touchstart', function(e){
                startVDrag(e.touches[0]);
            }, { passive: false });
            document.addEventListener('touchmove', function(e){
                if (vDragging) onVMove(e.touches[0]);
            }, { passive: true });
            document.addEventListener('touchend', onVUp);
        }
    }

    /* ── 创建手柄 ── */
    function makeHandle(id) {
        var el = document.createElement('div');
        el.id = id;
        el.className = 'grd-resizer';
        el.title = '拖拽调整面板宽度';
        return el;
    }

    /* ── 开始拖拽 ── */
    function startDrag(e, which) {
        if (window.innerWidth < CONFIG.BREAKPOINT) return;
        dragging = true;
        side     = which;
        startX   = e.clientX;
        startW   = which === 'left' ? leftW : rightW;
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        (which === 'left' ? leftHandle : rightHandle).classList.add('active');
        e.preventDefault && e.preventDefault();
    }

    /* ── 拖拽中 ── */
    function onMove(e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        var vw = window.innerWidth;
        if (side === 'left') {
            var w = clamp(startW + dx, CONFIG.LEFT.min, CONFIG.LEFT.max);
            if (vw - w - rightW < CONFIG.CENTER_MIN) {
                w = Math.max(CONFIG.LEFT.min, vw - rightW - CONFIG.CENTER_MIN);
            }
            leftW = w;
        } else {
            var w2 = clamp(startW - dx, CONFIG.RIGHT.min, CONFIG.RIGHT.max);
            if (vw - leftW - w2 < CONFIG.CENTER_MIN) {
                w2 = Math.max(CONFIG.RIGHT.min, vw - leftW - CONFIG.CENTER_MIN);
            }
            rightW = w2;
        }
        applyGrid();
    }

    /* ── 结束拖拽 ── */
    function onUp() {
        if (!dragging) return;
        dragging = false;
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        leftHandle.classList.remove('active');
        rightHandle.classList.remove('active');
        localStorage.setItem(CONFIG.LEFT.key,  leftW);
        localStorage.setItem(CONFIG.RIGHT.key, rightW);
        side = null;
    }

    /* ── 应用 Grid 列宽 ── */
    function applyGrid() {
        var isMobile = window.innerWidth < CONFIG.BREAKPOINT;
        var hp = CONFIG.HANDLE_PX;

        if (isMobile) {
            // 移动端退回单列，手柄隐藏
            appEl.style.gridTemplateColumns = '1fr';
            leftHandle.style.display  = 'none';
            rightHandle.style.display = 'none';
            leftSidebar.style.display  = 'none';
            rightSidebar.style.display = 'none';
        } else {
            leftHandle.style.display  = '';
            rightHandle.style.display = '';
            leftSidebar.style.display  = '';
            rightSidebar.style.display = '';
            // 五列：左栏 手柄 中栏(弹性) 手柄 右栏
            appEl.style.gridTemplateColumns =
                leftW + 'px ' + hp + 'px 1fr ' + hp + 'px ' + rightW + 'px';
        }
    }

    /* ── 垂直拖拽：开始 ── */
    function startVDrag(e) {
        if (briefingPanel.classList.contains('collapsed')) return;
        vDragging = true;
        vStartY   = e.clientY;
        vStartH   = briefingH;
        document.body.style.cursor     = 'row-resize';
        document.body.style.userSelect = 'none';
        briefingVResizer.classList.add('active');
        e.preventDefault && e.preventDefault();
    }

    /* ── 垂直拖拽：拖拽中 ── */
    function onVMove(e) {
        if (!vDragging) return;
        // 向上拖拽 → 增大高度，向下拖拽 → 减小高度
        var dy = vStartY - e.clientY;
        var mainH = mainEl ? mainEl.clientHeight : window.innerHeight;
        var newH = clamp(vStartH + dy, CONFIG.BRIEFING.min, Math.min(CONFIG.BRIEFING.max, mainH * 0.6));
        briefingH = newH;
        applyBriefingHeight();
    }

    /* ── 垂直拖拽：结束 ── */
    function onVUp() {
        if (!vDragging) return;
        vDragging = false;
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        if (briefingVResizer) briefingVResizer.classList.remove('active');
        localStorage.setItem(CONFIG.BRIEFING.key, briefingH);
    }

    /* ── 应用简报面板高度 ── */
    function applyBriefingHeight() {
        if (!briefingPanel) return;
        if (!briefingPanel.classList.contains('collapsed')) {
            briefingPanel.style.height = briefingH + 'px';
        }
    }

    /* ── 折叠/展开简报面板（全局函数）── */
    window.toggleBriefingPanel = function() {
        if (!briefingPanel) return;
        var isCollapsed = briefingPanel.classList.toggle('collapsed');
        if (isCollapsed) {
            briefingPanel.style.height = '';  // CSS min-height 控制折叠高度
        } else {
            briefingPanel.style.height = briefingH + 'px';
        }
        // 隐藏/显示拖拽手柄
        if (briefingVResizer) {
            briefingVResizer.style.display = isCollapsed ? 'none' : '';
        }
    };

    function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

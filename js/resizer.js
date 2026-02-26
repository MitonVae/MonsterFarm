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
        HANDLE_PX: 4,
        BREAKPOINT: 1024
    };

    var leftW  = CONFIG.LEFT.def;
    var rightW = CONFIG.RIGHT.def;

    var dragging = false;
    var side     = null;
    var startX   = 0;
    var startW   = 0;

    var appEl, leftSidebar, rightSidebar, mainEl;
    var leftHandle, rightHandle;

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

        // 把三个已有子元素改为 Grid 流
        // app-container 原来是 flex，现改为 grid
        appEl.style.display = 'grid';
        appEl.style.height  = '100vh';
        appEl.style.overflow = 'hidden';

        // 侧边栏从 fixed 改为 grid 子项（普通流）
        leftSidebar.style.position  = 'relative';
        leftSidebar.style.left      = '';
        leftSidebar.style.top       = '';
        leftSidebar.style.height    = '100vh';
        leftSidebar.style.overflowY = 'auto';
        leftSidebar.style.zIndex    = '';

        rightSidebar.style.position  = 'relative';
        rightSidebar.style.right     = '';
        rightSidebar.style.top       = '';
        rightSidebar.style.height    = '100vh';
        rightSidebar.style.overflowY = 'hidden';
        rightSidebar.style.zIndex    = '';

        mainEl.style.margin   = '0';
        mainEl.style.minHeight = '100vh';
        mainEl.style.overflow  = 'hidden auto';

        // 创建两个手柄，插入到 DOM 正确位置
        leftHandle  = makeHandle('grd-left-resizer');
        rightHandle = makeHandle('grd-right-resizer');

        // Grid 顺序：leftSidebar | leftHandle | mainEl | rightHandle | rightSidebar
        // 用 insertBefore 把手柄插到正确位置
        appEl.insertBefore(leftHandle,  mainEl);          // leftSidebar → leftHandle → mainEl
        appEl.insertBefore(rightHandle, rightSidebar);    // mainEl → rightHandle → rightSidebar

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

    function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
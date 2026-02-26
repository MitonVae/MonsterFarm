/**
 * resizer.js - 三栏布局可拖拽分隔条
 *
 * 核心机制：通过修改 :root 上的 CSS 自定义变量
 *   --left-width 和 --right-width 来驱动布局，
 *   彻底绕开内联样式优先级问题。
 *
 * 拖拽上下限：左栏 [160, 400]px，右栏 [180, 450]px
 * 中栏最小宽度保护：320px
 * 宽度持久化到 localStorage
 * 移动端（≤1023px）自动隐藏手柄
 */

(function () {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        LEFT:  { min: 160, max: 400, default: 260, key: 'panel_left_width'  },
        RIGHT: { min: 180, max: 450, default: 280, key: 'panel_right_width' },
        CENTER_MIN: 320,
        BREAKPOINT: 1024   // 小于此宽度禁用拖拽（移动/平板）
    };

    // ========== 运行时状态 ==========
    let leftW  = CONFIG.LEFT.default;
    let rightW = CONFIG.RIGHT.default;

    let dragging    = false;
    let side        = null;   // 'left' | 'right'
    let dragStartX  = 0;
    let dragStartW  = 0;

    // DOM
    let leftHandle, rightHandle;
    const root = document.documentElement;

    // ========== 初始化 ==========
    function init() {
        // 恢复存储的宽度
        const sl = parseInt(localStorage.getItem(CONFIG.LEFT.key));
        const sr = parseInt(localStorage.getItem(CONFIG.RIGHT.key));
        if (sl >= CONFIG.LEFT.min  && sl <= CONFIG.LEFT.max)  leftW  = sl;
        if (sr >= CONFIG.RIGHT.min && sr <= CONFIG.RIGHT.max) rightW = sr;

        // 创建手柄
        leftHandle  = makeHandle('panel-resizer-left');
        rightHandle = makeHandle('panel-resizer-right');
        document.body.appendChild(leftHandle);
        document.body.appendChild(rightHandle);

        // 鼠标事件
        leftHandle.addEventListener ('mousedown', (e) => beginDrag(e, 'left'));
        rightHandle.addEventListener('mousedown', (e) => beginDrag(e, 'right'));
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);

        // 触摸事件
        leftHandle.addEventListener ('touchstart', (e) => beginDrag(e.touches[0], 'left'),  { passive: false });
        rightHandle.addEventListener('touchstart', (e) => beginDrag(e.touches[0], 'right'), { passive: false });
        document.addEventListener('touchmove', (e) => onMove(e.touches[0]), { passive: true });
        document.addEventListener('touchend',  onUp);

        window.addEventListener('resize', () => applyLayout());

        applyLayout();
    }

    // ========== 创建手柄 DOM ==========
    function makeHandle(id) {
        const el = document.createElement('div');
        el.id = id;
        el.className = 'panel-resizer';
        el.title = '拖拽调整面板宽度';
        return el;
    }

    // ========== 开始拖拽 ==========
    function beginDrag(e, which) {
        if (window.innerWidth < CONFIG.BREAKPOINT) return;
        dragging   = true;
        side       = which;
        dragStartX = e.clientX;
        dragStartW = which === 'left' ? leftW : rightW;

        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        (which === 'left' ? leftHandle : rightHandle).classList.add('dragging');

        e.preventDefault && e.preventDefault();
    }

    // ========== 拖拽中 ==========
    function onMove(e) {
        if (!dragging) return;

        const dx = e.clientX - dragStartX;
        const vw = window.innerWidth;

        if (side === 'left') {
            let w = clamp(dragStartW + dx, CONFIG.LEFT.min, CONFIG.LEFT.max);
            // 中栏保护
            if (vw - w - rightW < CONFIG.CENTER_MIN) {
                w = Math.max(CONFIG.LEFT.min, vw - rightW - CONFIG.CENTER_MIN);
            }
            leftW = w;
        } else {
            // 右侧：鼠标向左 → dx 负 → 宽度增大，反之减小
            let w = clamp(dragStartW - dx, CONFIG.RIGHT.min, CONFIG.RIGHT.max);
            // 中栏保护
            if (vw - leftW - w < CONFIG.CENTER_MIN) {
                w = Math.max(CONFIG.RIGHT.min, vw - leftW - CONFIG.CENTER_MIN);
            }
            rightW = w;
        }

        applyLayout(true);
    }

    // ========== 结束拖拽 ==========
    function onUp() {
        if (!dragging) return;
        dragging = false;

        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        leftHandle.classList.remove('dragging');
        rightHandle.classList.remove('dragging');

        localStorage.setItem(CONFIG.LEFT.key,  leftW);
        localStorage.setItem(CONFIG.RIGHT.key, rightW);

        side = null;
        applyLayout(false);
    }

    // ========== 应用布局（更新 CSS 变量 + 手柄位置）==========
    function applyLayout(instant) {
        const isMobile = window.innerWidth < CONFIG.BREAKPOINT;

        // 手柄可见性
        leftHandle.style.display  = isMobile ? 'none' : '';
        rightHandle.style.display = isMobile ? 'none' : '';

        if (isMobile) return;

        // 更新 CSS 变量 → 驱动所有依赖它的布局
        root.style.setProperty('--left-width',  leftW  + 'px');
        root.style.setProperty('--right-width', rightW + 'px');

        // 手柄定位：左手柄紧贴左栏右边缘，右手柄紧贴右栏左边缘
        leftHandle.style.left   = (leftW - 3) + 'px';
        leftHandle.style.right  = '';

        // 右手柄用 left 定位（= 视口宽度 - 右栏宽度 - 3）
        rightHandle.style.left  = (window.innerWidth - rightW - 3) + 'px';
        rightHandle.style.right = '';
    }

    // ========== 工具函数 ==========
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    // ========== 等待 DOM 就绪 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
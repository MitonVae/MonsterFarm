/**
 * resizer.js - 三栏布局可拖拽分隔条
 * 
 * 功能：
 *   - 左栏右边缘、右栏左边缘可拖拽调节宽度
 *   - 拖拽上下限：左栏 [160, 400]px，右栏 [180, 450]px
 *   - 中栏最小宽度保护：320px
 *   - 拖拽完成后自动保存到 localStorage，刷新后恢复
 *   - 移动端 (≤1023px) 禁用拖拽
 */

(function () {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        LEFT: {
            min: 160,
            max: 400,
            default: 260,
            storageKey: 'panel_left_width'
        },
        RIGHT: {
            min: 180,
            max: 450,
            default: 280,
            storageKey: 'panel_right_width'
        },
        CENTER_MIN: 320,        // 中栏最小宽度
        MOBILE_BREAKPOINT: 1023 // 小于等于此宽度时禁用拖拽
    };

    // ========== 状态 ==========
    let leftWidth = CONFIG.LEFT.default;
    let rightWidth = CONFIG.RIGHT.default;
    let isDragging = false;
    let activeResizer = null;  // 'left' | 'right'
    let startX = 0;
    let startWidth = 0;

    // ========== DOM 引用 ==========
    let sidebar, monsterSidebar, mainContainer;
    let leftResizer, rightResizer;

    // ========== 初始化 ==========
    function init() {
        sidebar = document.querySelector('.sidebar');
        monsterSidebar = document.querySelector('.monster-sidebar');
        mainContainer = document.querySelector('.main-container');

        if (!sidebar || !monsterSidebar || !mainContainer) return;

        // 从 localStorage 恢复宽度
        const savedLeft = parseInt(localStorage.getItem(CONFIG.LEFT.storageKey));
        const savedRight = parseInt(localStorage.getItem(CONFIG.RIGHT.storageKey));
        if (savedLeft && savedLeft >= CONFIG.LEFT.min && savedLeft <= CONFIG.LEFT.max) {
            leftWidth = savedLeft;
        }
        if (savedRight && savedRight >= CONFIG.RIGHT.min && savedRight <= CONFIG.RIGHT.max) {
            rightWidth = savedRight;
        }

        // 创建拖拽手柄
        leftResizer = createResizer('leftResizer');
        rightResizer = createResizer('rightResizer');
        document.body.appendChild(leftResizer);
        document.body.appendChild(rightResizer);

        // 绑定事件
        leftResizer.addEventListener('mousedown', (e) => startDrag(e, 'left'));
        rightResizer.addEventListener('mousedown', (e) => startDrag(e, 'right'));

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // 触摸支持
        leftResizer.addEventListener('touchstart', (e) => startDrag(e.touches[0], 'left'), { passive: true });
        rightResizer.addEventListener('touchstart', (e) => startDrag(e.touches[0], 'right'), { passive: true });
        document.addEventListener('touchmove', (e) => onMouseMove(e.touches[0]), { passive: true });
        document.addEventListener('touchend', onMouseUp);

        // 初始应用宽度
        applyLayout(false);

        // 窗口大小变化时更新
        window.addEventListener('resize', onWindowResize);
    }

    // ========== 创建手柄元素 ==========
    function createResizer(id) {
        const el = document.createElement('div');
        el.id = id;
        el.className = 'panel-resizer';
        el.title = '拖拽调整面板宽度';
        return el;
    }

    // ========== 开始拖拽 ==========
    function startDrag(e, side) {
        if (window.innerWidth <= CONFIG.MOBILE_BREAKPOINT) return;

        isDragging = true;
        activeResizer = side;
        startX = e.clientX;
        startWidth = side === 'left' ? leftWidth : rightWidth;

        // 添加拖拽样式
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        (side === 'left' ? leftResizer : rightResizer).classList.add('dragging');

        // 防止文字选中
        e.preventDefault && e.preventDefault();
    }

    // ========== 拖拽移动 ==========
    function onMouseMove(e) {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const viewportWidth = window.innerWidth;

        if (activeResizer === 'left') {
            let newWidth = startWidth + dx;

            // 左上限
            newWidth = Math.max(CONFIG.LEFT.min, Math.min(CONFIG.LEFT.max, newWidth));

            // 中栏最小宽度保护
            const availableForCenter = viewportWidth - newWidth - rightWidth;
            if (availableForCenter < CONFIG.CENTER_MIN) {
                newWidth = viewportWidth - rightWidth - CONFIG.CENTER_MIN;
                newWidth = Math.max(CONFIG.LEFT.min, newWidth);
            }

            leftWidth = newWidth;

        } else if (activeResizer === 'right') {
            let newWidth = startWidth - dx;  // 注意右侧是反向的

            // 右上限
            newWidth = Math.max(CONFIG.RIGHT.min, Math.min(CONFIG.RIGHT.max, newWidth));

            // 中栏最小宽度保护
            const availableForCenter = viewportWidth - leftWidth - newWidth;
            if (availableForCenter < CONFIG.CENTER_MIN) {
                newWidth = viewportWidth - leftWidth - CONFIG.CENTER_MIN;
                newWidth = Math.max(CONFIG.RIGHT.min, newWidth);
            }

            rightWidth = newWidth;
        }

        applyLayout(true);
    }

    // ========== 结束拖拽 ==========
    function onMouseUp() {
        if (!isDragging) return;

        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (leftResizer) leftResizer.classList.remove('dragging');
        if (rightResizer) rightResizer.classList.remove('dragging');

        // 保存到 localStorage
        localStorage.setItem(CONFIG.LEFT.storageKey, leftWidth);
        localStorage.setItem(CONFIG.RIGHT.storageKey, rightWidth);

        activeResizer = null;
    }

    // ========== 应用布局 ==========
    function applyLayout(instant) {
        if (window.innerWidth <= CONFIG.MOBILE_BREAKPOINT) {
            // 移动端：隐藏手柄，不干预布局
            if (leftResizer) leftResizer.style.display = 'none';
            if (rightResizer) rightResizer.style.display = 'none';
            return;
        }

        if (leftResizer) leftResizer.style.display = '';
        if (rightResizer) rightResizer.style.display = '';

        // 禁用/启用过渡动画（拖拽时禁用，避免卡顿）
        const transition = instant ? 'none' : '';
        sidebar.style.transition = instant ? 'none' : 'transform 0.3s ease';
        monsterSidebar.style.transition = instant ? 'none' : 'transform 0.3s ease';
        mainContainer.style.transition = instant ? 'none' : 'margin 0.05s linear';

        // 设置侧栏宽度
        sidebar.style.width = leftWidth + 'px';
        monsterSidebar.style.width = rightWidth + 'px';

        // 设置主内容区 margin
        mainContainer.style.marginLeft = leftWidth + 'px';
        mainContainer.style.marginRight = rightWidth + 'px';

        // 定位拖拽手柄
        leftResizer.style.left = (leftWidth - 3) + 'px';   // 居中于左栏右边缘
        rightResizer.style.right = (rightWidth - 3) + 'px'; // 居中于右栏左边缘
    }

    // ========== 窗口大小变化处理 ==========
    function onWindowResize() {
        applyLayout(false);
    }

    // ========== 等待 DOM 就绪后初始化 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ==================== 教学引导系统 ====================

// 引导步骤定义
// focusSelector: CSS 选择器，指定聚光灯镂空区域（null = 无镂空，只显示遮罩+气泡）
// allowInteract:  true = 镂空区域可交互（玩家需自行操作）
//                false = 镂空区域仅高亮展示，操作由气泡按钮驱动
var tutorialSteps = [
    {
        id: 'welcome',
        title: '👋 欢迎来到怪兽农场！',
        content: '这里是你的怪兽农场。<br><br>' +
            '你需要 <strong style="color:#58a6ff;">捕获怪兽</strong> 来帮助你耕作，同时探索更多区域获取资源。<br><br>' +
            '让我们先去探索一下，看看能不能抓到第一只怪兽吧！',
        focusSelector: '.tab[onclick*="exploration"]',
        allowInteract: false,
        btnText: '前往探索 →',
        action: function() { switchTab('exploration'); }
    },
    {
        id: 'explore_first',
        title: '🌿 开始探索农场边缘',
        content: '这是最近的探索区域——<strong style="color:#46d164;">农场边缘</strong>。<br><br>' +
            '点击下方的 <strong style="color:#58a6ff;">⚡ 探索</strong> 按钮，消耗能量推进探索进度，达到100%后结算奖励，并有机会 <strong style="color:#f0c53d;">捕获野生怪兽</strong>！',
        focusSelector: '#explorationArea',
        allowInteract: true,   // 玩家需要自己点探索按钮
        btnText: null,          // 等待捕获，不显示下一步按钮
        action: null
    },
    {
        id: 'got_monster',
        title: '🎉 恭喜捕获第一只怪兽！',
        content: '太棒了！你成功捕获了一只怪兽。<br><br>' +
            '怪兽可以帮你做很多事情：<br>' +
            '🌱 <strong style="color:#46d164;">派驻农田</strong> — 自动种植和收获作物<br>' +
            '🗺 <strong style="color:#f0c53d;">参与探索</strong> — 加快探索速度并提升奖励<br><br>' +
            '现在去右侧的怪兽面板，点击「<strong style="color:#46d164;">派驻农田</strong>」按钮吧！',
        focusSelector: '#monsterSidebar',
        allowInteract: true,
        btnText: '我已派遣 →',
        action: function() { switchTab('farm'); }
    },
    {
        id: 'farm_intro',
        title: '🏡 农场操作说明',
        content: '农场地块有三种状态：<br>' +
            '⬛ <strong>空地</strong> — 点击选择作物手动种植<br>' +
            '🟡 <strong>生长中</strong> — 等待作物成熟<br>' +
            '🟢 <strong>可收获</strong> — 点击收获或等怪兽自动收获<br><br>' +
            '💡 <strong style="color:#58a6ff;">提示</strong>：多抓怪兽、多派遣，农场就能全自动运转！',
        focusSelector: '#farmGrid',
        allowInteract: true,
        btnText: '明白了！开始游戏 ✓',
        action: function() { completeTutorial(); }
    }
];

// 当前引导状态
var tutorialState = {
    active: false,
    currentStep: 0,
    completed: false,
    waitingForMonster: false
};

// ── 启动引导 ──
window.startTutorial = function() {
    tutorialState.active = true;
    tutorialState.currentStep = 0;
    tutorialState.completed = false;
    showTutorialStep(0);
};

// ── 显示引导步骤 ──
function showTutorialStep(index) {
    if (index >= tutorialSteps.length) {
        completeTutorial();
        return;
    }
    var step = tutorialSteps[index];
    tutorialState.currentStep = index;

    renderOverlay(step);
    renderTutorialBubble(step);
}

// ── 渲染聚光灯遮罩 ──
function renderOverlay(step) {
    // 移除旧遮罩
    var old = document.getElementById('tutorialOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'tutorialOverlay';

    if (step.focusSelector) {
        var target = document.querySelector(step.focusSelector);
        if (target) {
            var rect = target.getBoundingClientRect();
            var pad = 8; // 镂空区域比元素稍大一圈

            // 用 SVG clipPath + foreignObject 实现镂空遮罩
            // 更简单：用四块绝对定位的遮罩拼接
            overlay.innerHTML =
                // 上
                '<div class="tut-mask tut-mask-top" style="' +
                    'top:0;left:0;right:0;height:' + Math.max(0, rect.top - pad) + 'px;"></div>' +
                // 下
                '<div class="tut-mask tut-mask-bottom" style="' +
                    'top:' + (rect.bottom + pad) + 'px;left:0;right:0;bottom:0;"></div>' +
                // 左
                '<div class="tut-mask tut-mask-left" style="' +
                    'top:' + Math.max(0, rect.top - pad) + 'px;' +
                    'left:0;width:' + Math.max(0, rect.left - pad) + 'px;' +
                    'height:' + (rect.height + pad * 2) + 'px;"></div>' +
                // 右
                '<div class="tut-mask tut-mask-right" style="' +
                    'top:' + Math.max(0, rect.top - pad) + 'px;' +
                    'left:' + (rect.right + pad) + 'px;right:0;' +
                    'height:' + (rect.height + pad * 2) + 'px;"></div>' +
                // 镂空边框高亮
                '<div class="tut-focus-border" style="' +
                    'top:' + Math.max(0, rect.top - pad) + 'px;' +
                    'left:' + Math.max(0, rect.left - pad) + 'px;' +
                    'width:' + (rect.width + pad * 2) + 'px;' +
                    'height:' + (rect.height + pad * 2) + 'px;' +
                    (step.allowInteract ? 'pointer-events:none;' : 'pointer-events:none;') +
                '"></div>';

            // 若不允许交互，在镂空区域上再盖一层拦截层
            if (!step.allowInteract) {
                overlay.innerHTML +=
                    '<div style="' +
                        'position:fixed;' +
                        'top:' + Math.max(0, rect.top - pad) + 'px;' +
                        'left:' + Math.max(0, rect.left - pad) + 'px;' +
                        'width:' + (rect.width + pad * 2) + 'px;' +
                        'height:' + (rect.height + pad * 2) + 'px;' +
                        'z-index:3999;cursor:not-allowed;' +
                    '"></div>';
            }
        } else {
            // 找不到目标时，全屏遮罩
            overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;"></div>';
        }
    } else {
        // 无焦点选择器：全屏遮罩（中央信息步骤）
        overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;"></div>';
    }

    document.body.appendChild(overlay);
}

// ── 渲染引导气泡 ──
function renderTutorialBubble(step) {
    var existing = document.getElementById('tutorialBubble');
    if (existing) existing.remove();

    var isWaiting = (step.btnText === null);

    var bubble = document.createElement('div');
    bubble.id = 'tutorialBubble';
    bubble.innerHTML =
        '<div class="tut-header">' +
            '<span class="tut-title">' + step.title + '</span>' +
            '<button class="tut-skip" onclick="skipTutorial()" title="跳过引导">✕ 跳过</button>' +
        '</div>' +
        '<div class="tut-body">' + step.content +
            (isWaiting ? '<div class="tut-waiting-hint">⏳ 请在上方探索区域中点击探索按钮，直到捕获怪兽…</div>' : '') +
        '</div>' +
        '<div class="tut-footer">' +
            '<span class="tut-progress">' + (tutorialState.currentStep + 1) + ' / ' + tutorialSteps.length + '</span>' +
            (isWaiting
                ? '<span class="tut-waiting-label">等待捕获中…</span>'
                : '<button class="tut-btn" onclick="tutorialNext()">' + step.btnText + '</button>'
            ) +
        '</div>';

    document.body.appendChild(bubble);

    // 调整气泡位置：避免遮挡焦点区域
    positionBubble(bubble, step);

    requestAnimationFrame(function() {
        bubble.classList.add('tut-show');
    });
}

// ── 气泡智能定位：优先放在焦点区域下方，放不下则放上方，再不行放右侧 ──
function positionBubble(bubble, step) {
    // 默认居中底部
    bubble.style.bottom = '28px';
    bubble.style.left = '50%';
    bubble.style.transform = 'translateX(-50%) translateY(30px)';
    bubble.style.top = '';
    bubble.style.right = '';

    if (!step.focusSelector) return;
    var target = document.querySelector(step.focusSelector);
    if (!target) return;

    var rect = target.getBoundingClientRect();
    var bw = 360; // 气泡宽度
    var bh = 220; // 气泡估算高度
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var margin = 16;

    // 尝试放在焦点区域下方
    if (rect.bottom + bh + margin < vh) {
        bubble.style.bottom = '';
        bubble.style.top = (rect.bottom + margin) + 'px';
        var cx = rect.left + rect.width / 2 - bw / 2;
        cx = Math.max(margin, Math.min(vw - bw - margin, cx));
        bubble.style.left = cx + 'px';
        bubble.style.transform = 'translateY(30px)';
        bubble.style.setProperty('--tut-show-transform', 'translateY(0)');
        return;
    }

    // 放在上方
    if (rect.top - bh - margin > 0) {
        bubble.style.bottom = '';
        bubble.style.top = (rect.top - bh - margin) + 'px';
        var cx2 = rect.left + rect.width / 2 - bw / 2;
        cx2 = Math.max(margin, Math.min(vw - bw - margin, cx2));
        bubble.style.left = cx2 + 'px';
        bubble.style.transform = 'translateY(30px)';
        bubble.style.setProperty('--tut-show-transform', 'translateY(0)');
        return;
    }

    // 放右侧
    if (rect.right + bw + margin < vw) {
        bubble.style.bottom = '';
        bubble.style.top = Math.max(margin, rect.top) + 'px';
        bubble.style.left = (rect.right + margin) + 'px';
        bubble.style.transform = 'translateY(30px)';
        bubble.style.setProperty('--tut-show-transform', 'translateY(0)');
        return;
    }

    // fallback: 底部居中（保持默认 translateX(-50%) translateY(0)）
    bubble.style.setProperty('--tut-show-transform', 'translateX(-50%) translateY(0)');
}

// ── 下一步 ──
window.tutorialNext = function() {
    var step = tutorialSteps[tutorialState.currentStep];
    if (step.action) step.action();

    // explore_first 步骤：等待捕获，不手动推进
    if (step.id === 'explore_first') {
        tutorialState.waitingForMonster = true;
        return;
    }

    showTutorialStep(tutorialState.currentStep + 1);
};

// ── 捕获事件钩子（由 exploration.js settleZone 调用）──
window.onTutorialMonsterCaught = function() {
    if (!tutorialState.active || !tutorialState.waitingForMonster) return;
    tutorialState.waitingForMonster = false;
    setTimeout(function() {
        showTutorialStep(2); // got_monster
    }, 1500);
};

// ── 高亮标签（遮罩之外的额外视觉提示）──
function highlightTab(tabName) {
    document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.remove('tut-highlight');
    });
    var target = document.querySelector('.tab[onclick*="' + tabName + '"]');
    if (target) target.classList.add('tut-highlight');
}

// ── 完成引导 ──
window.completeTutorial = function() {
    tutorialState.active = false;
    tutorialState.completed = true;

    document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.remove('tut-highlight');
    });

    var overlay = document.getElementById('tutorialOverlay');
    if (overlay) overlay.remove();

    var bubble = document.getElementById('tutorialBubble');
    if (bubble) {
        bubble.classList.remove('tut-show');
        setTimeout(function() { bubble.remove(); }, 400);
    }

    showNotification('🎓 引导完成！祝你农场大丰收～', 'success');
    try { localStorage.setItem('mf_tutorial_done', '1'); } catch(e) {}
};

// ── 跳过引导 ──
window.skipTutorial = function() {
    completeTutorial();
};

// ── 检查是否已完成引导 ──
window.checkTutorialDone = function() {
    try { return localStorage.getItem('mf_tutorial_done') === '1'; } catch(e) { return false; }
};

// ── 窗口resize时刷新遮罩位置 ──
window.addEventListener('resize', function() {
    if (!tutorialState.active) return;
    var step = tutorialSteps[tutorialState.currentStep];
    renderOverlay(step);
    var bubble = document.getElementById('tutorialBubble');
    if (bubble) positionBubble(bubble, step);
});
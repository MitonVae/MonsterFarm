// ==================== 教学引导系统（强引导·聚光灯遮罩版）====================

// 引导步骤定义
// focusSelector: CSS 选择器，指定聚光灯镂空区域（null = 无镂空，只显示遮罩+气泡）
// allowInteract:  true = 镂空区域可交互（玩家需自行操作）
//                false = 镂空区域仅高亮展示，操作由气泡按钮驱动
// onShow: 气泡出现前的回调
// onNext: 气泡消失后的回调，可传入 done 回调让引导系统等待
var tutorialSteps = [
    {
        id: 'welcome',
        title: '👋 欢迎来到怪兽农场！',
        content: '这里是你的怪兽农场。<br><br>' +
            '你需要 <strong style="color:#58a6ff;">捕获怪兽</strong> 来帮助耕作，同时探索获取资源。<br><br>' +
            '首先，点击顶部的 <strong style="color:#f0c53d;">🗺 探索</strong> 标签前往探索界面！',
        // 高亮探索标签
        focusSelector: '.tab[onclick*="exploration"]',
        allowInteract: false,
        btnText: '前往探索 →',
        onShow: null,
        onNext: function(done) {
            switchTab('exploration');
            // 等待 tab 切换动画完成再进入下一步
            setTimeout(done, 400);
        }
    },
    {
        id: 'explore_first',
        title: '🌿 点击「⚡ 探索」开始探索',
        content: '这是最近的区域——<strong style="color:#46d164;">农场边缘</strong>。<br><br>' +
            '每次点击 <strong style="color:#58a6ff;">⚡ 探索</strong> 按钮消耗能量推进进度，<br>' +
            '进度达到 <strong style="color:#f0c53d;">100%</strong> 后结算，<br>并有机会 <strong style="color:#f0c53d;">捕获野生怪兽</strong>！<br><br>' +
            '现在开始点击探索吧，直到捕获一只怪兽～',
        focusSelector: '#explorationArea',
        allowInteract: true,
        btnText: null,         // 等待捕获，不显示按钮
        onShow: function() {
            tutorialState.waitingForMonster = true;
        },
        onNext: null
    },
    {
        id: 'got_monster',
        title: '🎉 恭喜捕获第一只怪兽！',
        content: '太棒了！你成功捕获了一只怪兽。<br><br>' +
            '右侧面板就是你的 <strong style="color:#58a6ff;">怪兽团队</strong>。<br>' +
            '点击怪兽卡片上的 <strong style="color:#46d164;">派驻农田</strong> 按钮，<br>' +
            '让它自动帮你种植和收获作物！',
        focusSelector: '#monsterSidebar',
        allowInteract: true,
        btnText: '已了解，去看农场 →',
        onShow: null,
        onNext: function(done) {
            switchTab('farm');
            setTimeout(done, 400);
        }
    },
    {
        id: 'farm_intro',
        title: '🏡 这是你的农场',
        content: '地块有三种状态：<br>' +
            '⬛ <strong>空地</strong> — 点击选择作物种植<br>' +
            '🟡 <strong>生长中</strong> — 等待作物成熟<br>' +
            '🟢 <strong>可收获</strong> — 点击手动收获<br><br>' +
            '💡 派遣怪兽后，它会 <strong style="color:#46d164;">自动种植和收获</strong>，让农场全程运转！',
        focusSelector: '#farmGrid',
        allowInteract: true,
        btnText: '明白了！开始游戏 ✓',
        onShow: null,
        onNext: function(done) {
            completeTutorial();
            done();
        }
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
    tutorialState.waitingForMonster = false;
    showTutorialStep(0);
};

// ── 显示某步骤 ──
function showTutorialStep(index) {
    if (index >= tutorialSteps.length) { completeTutorial(); return; }

    var step = tutorialSteps[index];
    tutorialState.currentStep = index;
    tutorialState.waitingForMonster = false;

    // 先清旧元素，再渲染新的
    removeTutorialDOM();

    // 如果有 onShow 钩子，调用它
    if (step.onShow) step.onShow();

    // 延一帧再渲染，确保 DOM 稳定（特别是 tab 切换后）
    requestAnimationFrame(function() {
        renderOverlay(step);
        renderBubble(step);
    });
}

// ── 清除引导 DOM ──
function removeTutorialDOM() {
    var o = document.getElementById('tutorialOverlay');
    var b = document.getElementById('tutorialBubble');
    if (o) o.remove();
    if (b) b.remove();
}

// ── 渲染聚光灯遮罩（四块拼接法）──
function renderOverlay(step) {
    var old = document.getElementById('tutorialOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'tutorialOverlay';
    document.body.appendChild(overlay);

    if (!step.focusSelector) {
        // 全屏纯遮罩
        overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;position:fixed;"></div>';
        return;
    }

    var target = document.querySelector(step.focusSelector);
    if (!target) {
        overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;position:fixed;"></div>';
        return;
    }

    var rect = target.getBoundingClientRect();

    // 如果目标不可见（宽高为0，说明 display:none），回退全屏遮罩
    if (rect.width === 0 && rect.height === 0) {
        overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;position:fixed;"></div>';
        return;
    }

    var pad = 8;
    var top    = Math.max(0, rect.top    - pad);
    var left   = Math.max(0, rect.left   - pad);
    var bottom = rect.bottom + pad;
    var right  = rect.right  + pad;
    var w      = rect.width  + pad * 2;
    var h      = rect.height + pad * 2;

    // 四块遮罩拼接
    overlay.innerHTML =
        '<div class="tut-mask" style="top:0;left:0;right:0;height:' + top + 'px;position:fixed;"></div>' +
        '<div class="tut-mask" style="top:' + bottom + 'px;left:0;right:0;bottom:0;position:fixed;"></div>' +
        '<div class="tut-mask" style="top:' + top + 'px;left:0;width:' + left + 'px;height:' + h + 'px;position:fixed;"></div>' +
        '<div class="tut-mask" style="top:' + top + 'px;left:' + right + 'px;right:0;height:' + h + 'px;position:fixed;"></div>' +
        '<div class="tut-focus-border" style="top:' + top + 'px;left:' + left + 'px;width:' + w + 'px;height:' + h + 'px;position:fixed;pointer-events:none;"></div>';

    // allowInteract=false 时在镂空区加拦截层
    if (!step.allowInteract) {
        overlay.innerHTML +=
            '<div style="position:fixed;top:' + top + 'px;left:' + left + 'px;width:' + w + 'px;height:' + h + 'px;z-index:4050;cursor:not-allowed;"></div>';
    }
}

// ── 渲染引导气泡 ──
function renderBubble(step) {
    var old = document.getElementById('tutorialBubble');
    if (old) old.remove();

    var isWaiting = (step.btnText === null);

    var bubble = document.createElement('div');
    bubble.id = 'tutorialBubble';
    bubble.innerHTML =
        '<div class="tut-header">' +
            '<span class="tut-title">' + step.title + '</span>' +
            '<button class="tut-skip" onclick="skipTutorial()">✕ 跳过</button>' +
        '</div>' +
        '<div class="tut-body">' + step.content + '</div>' +
        '<div class="tut-footer">' +
            '<span class="tut-progress">' + (tutorialState.currentStep + 1) + ' / ' + tutorialSteps.length + '</span>' +
            (isWaiting
                ? '<span class="tut-waiting-label">⏳ 等待捕获怪兽…</span>'
                : '<button class="tut-btn" onclick="tutorialNext()">' + step.btnText + '</button>'
            ) +
        '</div>';

    document.body.appendChild(bubble);
    positionBubble(bubble, step);

    // 触发入场动画
    requestAnimationFrame(function() {
        bubble.classList.add('tut-show');
    });
}

// ── 气泡智能定位 ──
function positionBubble(bubble, step) {
    // 默认底部居中
    bubble.style.cssText = 'bottom:24px;left:50%;transform:translateX(-50%) translateY(30px);';

    if (!step.focusSelector) return;
    var target = document.querySelector(step.focusSelector);
    if (!target) return;

    var rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    var BW = 370, BH = 240;
    var vw = window.innerWidth, vh = window.innerHeight;
    var mg = 16;

    function setPos(top, cx) {
        cx = Math.max(mg, Math.min(vw - BW - mg, cx));
        bubble.style.cssText =
            'position:fixed;' +
            'top:' + top + 'px;' +
            'left:' + cx + 'px;' +
            'transform:translateY(20px);' +
            'width:' + BW + 'px;';
        bubble.style.setProperty('--tut-show-transform', 'translateY(0)');
    }

    var cx0 = rect.left + rect.width / 2 - BW / 2;
    // 优先放下方
    if (rect.bottom + BH + mg < vh) { setPos(rect.bottom + mg, cx0); return; }
    // 放上方
    if (rect.top - BH - mg > 0)     { setPos(rect.top - BH - mg, cx0); return; }
    // 放右侧
    if (rect.right + BW + mg < vw)  {
        bubble.style.cssText =
            'position:fixed;top:' + Math.max(mg, rect.top) + 'px;' +
            'left:' + (rect.right + mg) + 'px;' +
            'transform:translateY(20px);width:' + BW + 'px;';
        bubble.style.setProperty('--tut-show-transform', 'translateY(0)');
        return;
    }
    // fallback 底部居中
    bubble.style.setProperty('--tut-show-transform', 'translateX(-50%) translateY(0)');
}

// ── 点击「下一步」按钮 ──
window.tutorialNext = function() {
    var step = tutorialSteps[tutorialState.currentStep];
    if (!step) return;

    // explore_first 是纯等待步骤，按钮不存在，此处不应被调用
    if (step.id === 'explore_first') return;

    if (step.onNext) {
        // onNext 提供 done 回调，完成后再进入下一步
        step.onNext(function() {
            var nextIdx = tutorialState.currentStep + 1;
            // got_monster / farm_intro 等步骤 onNext 里可能已调 completeTutorial
            if (tutorialState.active) showTutorialStep(nextIdx);
        });
    } else {
        showTutorialStep(tutorialState.currentStep + 1);
    }
};

// ── 捕获事件钩子（exploration.js 调用）──
window.onTutorialMonsterCaught = function() {
    if (!tutorialState.active || !tutorialState.waitingForMonster) return;
    tutorialState.waitingForMonster = false;
    // 稍作延迟，让捕获通知先显示
    setTimeout(function() {
        showTutorialStep(2); // got_monster
    }, 1200);
};

// ── 完成引导 ──
window.completeTutorial = function() {
    tutorialState.active = false;
    tutorialState.completed = true;
    removeTutorialDOM();
    showNotification('🎓 引导完成！祝你农场大丰收～', 'success');
    try { localStorage.setItem('mf_tutorial_done', '1'); } catch(e) {}
};

// ── 跳过引导 ──
window.skipTutorial = function() {
    completeTutorial();
};

// ── 是否已完成引导 ──
window.checkTutorialDone = function() {
    try { return localStorage.getItem('mf_tutorial_done') === '1'; } catch(e) { return false; }
};

// ── resize 时刷新遮罩 ──
window.addEventListener('resize', function() {
    if (!tutorialState.active) return;
    var step = tutorialSteps[tutorialState.currentStep];
    if (!step) return;
    renderOverlay(step);
    var bubble = document.getElementById('tutorialBubble');
    if (bubble) positionBubble(bubble, step);
});
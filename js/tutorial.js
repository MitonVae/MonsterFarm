// ==================== 教学引导系统（强引导·聚光灯遮罩版）====================

// 引导步骤定义
// focusSelector: CSS 选择器，指定聚光灯镂空区域（null = 无镂空，只显示遮罩+气泡）
// allowInteract:  true = 镂空区域可交互（玩家需自行操作）
//                false = 镂空区域仅高亮展示，操作由气泡按钮驱动
// onShow: 气泡出现前的回调
// onNext: 气泡消失后的回调，可传入 done 回调让引导系统等待
var tutorialSteps = [
    // ── Step 0：欢迎 ──
    {
        id: 'welcome',
        title: '👋 欢迎来到怪兽农场！',
        content: '这里是你的怪兽农场。<br><br>' +
            '你需要 <strong style="color:#58a6ff;">捕获怪兽</strong> 来帮助耕作，同时探索获取资源。<br><br>' +
            '首先，点击顶部的 <strong style="color:#f0c53d;">🗺 探索</strong> 标签前往探索界面！',
        focusSelector: '.tab[onclick*="exploration"]',
        allowInteract: false,
        btnText: '前往探索 →',
        onShow: null,
        onNext: function(done) {
            switchTab('exploration');
            setTimeout(done, 400);
        }
    },

    // ── Step 1：手动探索，必定捕获 ──
    {
        id: 'explore_first',
        title: '🌿 点击「⚡ 探索」开始探索',
        content: '这是 <strong style="color:#46d164;">农场边缘</strong> 区域。<br><br>' +
            '点击下方高亮的 <strong style="color:#58a6ff;">⚡ 探索</strong> 按钮，<br>' +
            '消耗能量推进进度，达到 <strong style="color:#f0c53d;">100%</strong> 后结算。<br><br>' +
            '💡 本次探索 <strong style="color:#f0c53d;">必定捕获</strong> 一只怪兽！',
        focusSelector: 'button.expl-manual-btn[onclick*="farm_edge"]',
        allowInteract: true,
        btnText: null,      // 等待系统触发
        onShow: function() {
            tutorialState.waitingForMonster = true;
            // 标记"必定捕获"
            tutorialState.guaranteeCatch = true;
            // 等 DOM 渲染完后刷新遮罩
            setTimeout(function() {
                if (tutorialState.active && tutorialState.currentStep === 1) {
                    var step = tutorialSteps[1];
                    renderOverlay(step);
                    var bubble = document.getElementById('tutorialBubble');
                    if (bubble) positionBubble(bubble, step);
                }
            }, 300);
        },
        onNext: null
    },

    // ── Step 2：捕获成功，指引点击怪兽卡片 ──
    {
        id: 'select_monster',
        title: '🎉 成功捕获怪兽！',
        content: '太棒了！你已经捕获了第一只怪兽。<br><br>' +
            '现在请 <strong style="color:#f0c53d;">点击右侧怪兽卡片</strong> 将它选中，' +
            '卡片下方会出现操作按钮。',
        focusSelector: '#monsterSidebar .monster-card',
        allowInteract: true,
        btnText: null,      // 等玩家点击怪兽卡片后触发钩子推进
        onShow: function() {
            tutorialState.waitingForMonsterSelect = true;
            setTimeout(function() {
                if (tutorialState.active && tutorialState.currentStep === 2) {
                    renderOverlay(tutorialSteps[2]);
                    var b = document.getElementById('tutorialBubble');
                    if (b) positionBubble(b, tutorialSteps[2]);
                }
            }, 300);
        },
        onNext: null
    },

    // ── Step 3：点击「耕作」按钮（强引导） ──
    {
        id: 'assign_farm',
        title: '🌾 派遣怪兽驻守农田',
        content: '太棒了！怪兽卡片上出现了操作按钮。<br><br>' +
            '现在请点击高亮的 <strong style="color:#46d164;">耕作</strong> 按钮，<br>' +
            '让怪兽驻守地块，实现 <strong style="color:#58a6ff;">自动种植和收获</strong>！',
        // 动态更新：onShow 时重新计算
        focusSelector: '#monsterSidebar .monster-card .btn-primary',
        allowInteract: true,
        btnText: null,      // 等玩家点击耕作按钮后触发钩子推进
        onShow: function() {
            tutorialState.waitingForAssign = true;
            setTimeout(function() {
                if (tutorialState.active && tutorialState.currentStep === 3) {
                    renderOverlay(tutorialSteps[3]);
                    var b = document.getElementById('tutorialBubble');
                    if (b) positionBubble(b, tutorialSteps[3]);
                }
            }, 300);
        },
        onNext: null
    },

    // ── Step 4：选择地块（强引导，等模态框出现后高亮） ──
    {
        id: 'pick_plot',
        title: '📋 选择一个地块',
        content: '弹出了地块选择界面！<br><br>' +
            '请点击任意一个 <strong style="color:#f0c53d;">地块格子</strong>，<br>' +
            '让怪兽驻守进去开始工作。',
        focusSelector: '#modal .modal-content',
        allowInteract: true,
        btnText: null,      // 等玩家选择地块后触发钩子推进
        onShow: function() {
            tutorialState.waitingForPlotPick = true;
            // 等模态框动画完成后刷新
            setTimeout(function() {
                if (tutorialState.active && tutorialState.currentStep === 4) {
                    renderOverlay(tutorialSteps[4]);
                    var b = document.getElementById('tutorialBubble');
                    if (b) positionBubble(b, tutorialSteps[4]);
                }
            }, 350);
        },
        onNext: null
    },

    // ── Step 5：前往农场 ──
    {
        id: 'go_farm',
        title: '✅ 怪兽已驻守！',
        content: '怪兽已经开始驻守地块了！<br><br>' +
            '它会自动种植并收获作物，为你积累资源。<br><br>' +
            '现在点击按钮切换到 <strong style="color:#f0c53d;">🏡 农场</strong> 查看效果！',
        focusSelector: null,
        allowInteract: false,
        btnText: '前往农场 →',
        onShow: null,
        onNext: function(done) {
            switchTab('farm');
            setTimeout(done, 400);
        }
    },

    // ── Step 6：农场介绍，完成引导 ──
    {
        id: 'farm_intro',
        title: '🏡 这是你的农场',
        content: '地块有三种状态：<br>' +
            '⬛ <strong>空地</strong> — 点击可手动种植作物<br>' +
            '🟡 <strong>生长中</strong> — 等待作物成熟<br>' +
            '🟢 <strong>可收获</strong> — 点击手动收获<br><br>' +
            '💡 驻守的怪兽会 <strong style="color:#46d164;">自动种植和收获</strong>！',
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
    waitingForMonster: false,
    guaranteeCatch: false,
    waitingForMonsterSelect: false,
    waitingForAssign: false,
    waitingForPlotPick: false
};

// ── 启动引导 ──
window.startTutorial = function() {
    tutorialState.active = true;
    tutorialState.currentStep = 0;
    tutorialState.completed = false;
    tutorialState.waitingForMonster = false;
    tutorialState.guaranteeCatch = false;
    tutorialState.waitingForMonsterSelect = false;
    tutorialState.waitingForAssign = false;
    tutorialState.waitingForPlotPick = false;
    showTutorialStep(0);
};

// ── 显示某步骤 ──
function showTutorialStep(index) {
    if (index >= tutorialSteps.length) { completeTutorial(); return; }

    var step = tutorialSteps[index];
    tutorialState.currentStep = index;
    // 重置所有等待标志
    tutorialState.waitingForMonster = false;
    tutorialState.waitingForMonsterSelect = false;
    tutorialState.waitingForAssign = false;
    tutorialState.waitingForPlotPick = false;

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
        overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;position:fixed;"></div>';
        return;
    }

    var target = document.querySelector(step.focusSelector);
    if (!target) {
        overlay.innerHTML = '<div class="tut-mask" style="top:0;left:0;right:0;bottom:0;position:fixed;"></div>';
        return;
    }

    var rect = target.getBoundingClientRect();

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

    overlay.innerHTML =
        '<div class="tut-mask" style="top:0;left:0;right:0;height:' + top + 'px;position:fixed;"></div>' +
        '<div class="tut-mask" style="top:' + bottom + 'px;left:0;right:0;bottom:0;position:fixed;"></div>' +
        '<div class="tut-mask" style="top:' + top + 'px;left:0;width:' + left + 'px;height:' + h + 'px;position:fixed;"></div>' +
        '<div class="tut-mask" style="top:' + top + 'px;left:' + right + 'px;right:0;height:' + h + 'px;position:fixed;"></div>' +
        '<div class="tut-focus-border" style="top:' + top + 'px;left:' + left + 'px;width:' + w + 'px;height:' + h + 'px;position:fixed;pointer-events:none;"></div>';

    if (!step.allowInteract) {
        overlay.innerHTML +=
            '<div style="position:fixed;top:' + top + 'px;left:' + left + 'px;width:' + w + 'px;height:' + h + 'px;z-index:4050;cursor:not-allowed;"></div>';
    }
}

// ── 渲染引导气泡 ──
function renderBubble(step) {
    var old = document.getElementById('tutorialBubble');
    if (old) old.remove();

    // btnText 为 null 时显示等待提示
    var waitingLabel = '';
    if (step.btnText === null) {
        if (step.id === 'explore_first')    waitingLabel = '⏳ 探索并捕获怪兽中…';
        else if (step.id === 'select_monster') waitingLabel = '👆 请点击右侧怪兽卡片…';
        else if (step.id === 'assign_farm') waitingLabel = '👆 请点击高亮的「耕作」按钮…';
        else if (step.id === 'pick_plot')   waitingLabel = '👆 请在弹窗中选择地块…';
        else waitingLabel = '⏳ 等待操作…';
    }

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
            (step.btnText === null
                ? '<span class="tut-waiting-label">' + waitingLabel + '</span>'
                : '<button class="tut-btn" onclick="tutorialNext()">' + step.btnText + '</button>'
            ) +
        '</div>';

    document.body.appendChild(bubble);
    positionBubble(bubble, step);

    requestAnimationFrame(function() {
        bubble.classList.add('tut-show');
    });
}

// ── 气泡智能定位 ──
function positionBubble(bubble, step) {
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
    if (rect.bottom + BH + mg < vh) { setPos(rect.bottom + mg, cx0); return; }
    if (rect.top - BH - mg > 0)     { setPos(rect.top - BH - mg, cx0); return; }
    if (rect.right + BW + mg < vw)  {
        bubble.style.cssText =
            'position:fixed;top:' + Math.max(mg, rect.top) + 'px;' +
            'left:' + (rect.right + mg) + 'px;' +
            'transform:translateY(20px);width:' + BW + 'px;';
        bubble.style.setProperty('--tut-show-transform', 'translateY(0)');
        return;
    }
    bubble.style.setProperty('--tut-show-transform', 'translateX(-50%) translateY(0)');
}

// ── 点击「下一步」按钮 ──
window.tutorialNext = function() {
    var step = tutorialSteps[tutorialState.currentStep];
    if (!step) return;
    if (step.btnText === null) return; // 等待型步骤不响应

    if (step.onNext) {
        step.onNext(function() {
            var nextIdx = tutorialState.currentStep + 1;
            if (tutorialState.active) showTutorialStep(nextIdx);
        });
    } else {
        showTutorialStep(tutorialState.currentStep + 1);
    }
};

// ── 捕获事件钩子（exploration.js 调用）── Step1 → Step2
window.onTutorialMonsterCaught = function() {
    if (!tutorialState.active || !tutorialState.waitingForMonster) return;
    tutorialState.waitingForMonster = false;
    tutorialState.guaranteeCatch = false;
    setTimeout(function() {
        showTutorialStep(2); // select_monster
    }, 1200);
};

// ── 点击怪兽卡片钩子（monster.js 中 selectMonster 调用）── Step2 → Step3
window.onTutorialMonsterSelected = function() {
    if (!tutorialState.active || !tutorialState.waitingForMonsterSelect) return;
    tutorialState.waitingForMonsterSelect = false;
    // 等待 DOM 重新渲染（卡片展开出现耕作按钮）
    setTimeout(function() {
        showTutorialStep(3); // assign_farm
    }, 350);
};

// ── 点击耕作按钮钩子（monster.js 中 assignToFarm 调用）── Step3 → Step4
window.onTutorialAssignFarm = function() {
    if (!tutorialState.active || !tutorialState.waitingForAssign) return;
    tutorialState.waitingForAssign = false;
    // 等待 showAssignPlotPicker 模态框渲染完毕
    setTimeout(function() {
        showTutorialStep(4); // pick_plot
    }, 350);
};

// ── 选择地块钩子（farm.js 中 assignMonsterToPlot 调用）── Step4 → Step5
window.onTutorialPlotPicked = function() {
    if (!tutorialState.active || !tutorialState.waitingForPlotPick) return;
    tutorialState.waitingForPlotPick = false;
    setTimeout(function() {
        showTutorialStep(5); // go_farm
    }, 400);
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
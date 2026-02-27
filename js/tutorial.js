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
        get title()   { return T('step0_title',   'tutorial'); },
        get content() { return T('step0_content', 'tutorial'); },
        focusSelector: '.tab[onclick*="exploration"]',
        allowInteract: false,
        get btnText() { return T('step0_btn', 'tutorial'); },
        onShow: null,
        onNext: function(done) {
            switchTab('exploration');
            setTimeout(done, 400);
        }
    },

    // ── Step 1：手动探索，必定捕获 ──
    {
        id: 'explore_first',
        get title()   { return T('step1_title',   'tutorial'); },
        get content() { return T('step1_content', 'tutorial'); },
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
        get title()   { return T('step2_title',   'tutorial'); },
        get content() { return T('step2_content', 'tutorial'); },
        focusSelector: '#monsterSidebar .msb-monster-card',
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

    // ── Step 3：点击「派驻农田」按钮（强引导） ──
    {
        id: 'assign_farm',
        get title()   { return T('step3_title',   'tutorial'); },
        get content() { return T('step3_content', 'tutorial'); },
        focusSelector: '#monsterSidebar .msb-btn-assign',
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
        get title()   { return T('step4_title',   'tutorial'); },
        get content() { return T('step4_content', 'tutorial'); },
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
        get title()   { return T('step5_title',   'tutorial'); },
        get content() { return T('step5_content', 'tutorial'); },
        focusSelector: null,
        allowInteract: false,
        get btnText() { return T('step5_btn', 'tutorial'); },
        onShow: null,
        onNext: function(done) {
            switchTab('farm');
            setTimeout(done, 400);
        }
    },

    // ── Step 6：农场介绍，完成引导 ──
    {
        id: 'farm_intro',
        get title()   { return T('step6_title',   'tutorial'); },
        get content() { return T('step6_content', 'tutorial'); },
        focusSelector: '#farmGrid',
        allowInteract: true,
        get btnText() { return T('step6_btn', 'tutorial'); },
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
        if (step.id === 'explore_first')       waitingLabel = T('wait_explore',      'tutorial');
        else if (step.id === 'select_monster') waitingLabel = T('wait_select',       'tutorial');
        else if (step.id === 'assign_farm')    waitingLabel = T('wait_assign',       'tutorial');
        else if (step.id === 'pick_plot')      waitingLabel = T('wait_plot',         'tutorial');
        else                                   waitingLabel = T('wait_generic',      'tutorial');
    }

    var bubble = document.createElement('div');
    bubble.id = 'tutorialBubble';
    bubble.innerHTML =
        '<div class="tut-header">' +
            '<span class="tut-title">' + step.title + '</span>' +
            '<button class="tut-skip" onclick="skipTutorial()">' + T('skip_btn','tutorial') + '</button>' +
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
    showNotification(T('complete_notify', 'tutorial'), 'success');
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
// ==================== 教学引导系统 ====================
// 引导步骤定义
var tutorialSteps = [
    {
        id: 'welcome',
        title: '👋 欢迎来到怪兽农场！',
        content: '这里是你的怪兽农场。<br><br>' +
            '你需要 <strong style="color:#58a6ff;">捕获怪兽</strong> 来帮助你耕作，同时探索更多区域获取资源。<br><br>' +
            '让我们先去探索一下，看看能不能抓到第一只怪兽吧！',
        highlight: 'exploration',   // 高亮哪个标签
        btnText: '前往探索 →',
        action: function() { switchTab('exploration'); }
    },
    {
        id: 'explore_first',
        title: '🌿 探索农场边缘',
        content: '这是最近的探索区域——<strong style="color:#46d164;">农场边缘</strong>。<br><br>' +
            '点击 <strong style="color:#58a6ff;">⚡ 探索</strong> 按钮消耗能量来推进探索进度，进度达到100%就会结算奖励，并有机会 <strong style="color:#f0c53d;">捕获野生怪兽</strong>！',
        highlight: 'exploration',
        btnText: '我知道了，去探索！',
        action: null
    },
    {
        id: 'got_monster',
        title: '🎉 恭喜捕获第一只怪兽！',
        content: '太棒了！你成功捕获了一只怪兽。<br><br>' +
            '怪兽可以帮你做很多事情：<br>' +
            '🌱 <strong style="color:#46d164;">派驻农田</strong> — 自动种植和收获作物<br>' +
            '🗺 <strong style="color:#f0c53d;">参与探索</strong> — 加快探索速度并提升奖励<br><br>' +
            '现在去怪兽团队看看你抓到的怪兽吧！',
        highlight: 'monsters',
        btnText: '查看怪兽 →',
        action: function() { switchTab('monsters'); }
    },
    {
        id: 'assign_farm',
        title: '🌱 让怪兽去耕作',
        content: '点击右侧怪兽侧边栏中的 <strong style="color:#46d164;">派驻农田</strong>，或点击怪兽卡片后选择「派驻农田」。<br><br>' +
            '怪兽驻守地块后，你可以设置 <strong style="color:#f0c53d;">自动种植作物</strong>，它会循环种植并自动收获，完全解放双手！',
        highlight: 'farm',
        btnText: '去农场看看 →',
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
        highlight: 'farm',
        btnText: '明白了！开始游戏 ✓',
        action: function() { completeTutorial(); }
    }
];

// 当前引导步骤索引
var tutorialState = {
    active: false,
    currentStep: 0,
    completed: false,
    waitingForMonster: false   // 是否在等待玩家捕获第一只怪兽
};

// 启动引导
window.startTutorial = function() {
    tutorialState.active = true;
    tutorialState.currentStep = 0;
    tutorialState.completed = false;
    showTutorialStep(0);
};

// 显示引导步骤
function showTutorialStep(index) {
    if (index >= tutorialSteps.length) {
        completeTutorial();
        return;
    }
    var step = tutorialSteps[index];
    tutorialState.currentStep = index;

    // 高亮对应标签
    if (step.highlight) {
        highlightTab(step.highlight);
    }

    // 渲染引导气泡
    renderTutorialBubble(step);
}

// 渲染引导气泡（右下角固定提示框）
function renderTutorialBubble(step) {
    var existing = document.getElementById('tutorialBubble');
    if (existing) existing.remove();

    var bubble = document.createElement('div');
    bubble.id = 'tutorialBubble';
    bubble.innerHTML =
        '<div class="tut-header">' +
            '<span class="tut-title">' + step.title + '</span>' +
            '<button class="tut-skip" onclick="skipTutorial()" title="跳过引导">✕ 跳过</button>' +
        '</div>' +
        '<div class="tut-body">' + step.content + '</div>' +
        '<div class="tut-footer">' +
            '<span class="tut-progress">' + (tutorialState.currentStep + 1) + ' / ' + tutorialSteps.length + '</span>' +
            '<button class="tut-btn" onclick="tutorialNext()">' + step.btnText + '</button>' +
        '</div>';

    document.body.appendChild(bubble);

    // 入场动画
    requestAnimationFrame(function() {
        bubble.classList.add('tut-show');
    });
}

// 下一步
window.tutorialNext = function() {
    var step = tutorialSteps[tutorialState.currentStep];

    // 执行步骤动作
    if (step.action) step.action();

    var nextIndex = tutorialState.currentStep + 1;

    // 第1步完成后（"前往探索"之后）开始监听捕获事件
    if (step.id === 'explore_first') {
        tutorialState.waitingForMonster = true;
        // 关闭气泡，等捕获后自动触发下一步
        var bubble = document.getElementById('tutorialBubble');
        if (bubble) {
            bubble.classList.add('tut-waiting');
            var bodyEl = bubble.querySelector('.tut-body');
            var footerEl = bubble.querySelector('.tut-footer .tut-btn');
            if (bodyEl) bodyEl.innerHTML += '<br><div class="tut-waiting-hint">⏳ 等待你捕获第一只怪兽...</div>';
            if (footerEl) footerEl.disabled = true;
        }
        return;
    }

    showTutorialStep(nextIndex);
};

// 捕获事件钩子（在 settleZone 捕获成功后调用）
window.onTutorialMonsterCaught = function() {
    if (!tutorialState.active || !tutorialState.waitingForMonster) return;
    tutorialState.waitingForMonster = false;
    // 短暂延迟后显示下一步，让玩家看到捕获通知
    setTimeout(function() {
        showTutorialStep(2); // got_monster 步骤
    }, 1500);
};

// 高亮标签
function highlightTab(tabName) {
    document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.remove('tut-highlight');
    });
    var target = document.querySelector('.tab[onclick*="' + tabName + '"]');
    if (target) target.classList.add('tut-highlight');
}

// 完成引导
window.completeTutorial = function() {
    tutorialState.active = false;
    tutorialState.completed = true;

    // 清除高亮
    document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.remove('tut-highlight');
    });

    var bubble = document.getElementById('tutorialBubble');
    if (bubble) {
        bubble.classList.remove('tut-show');
        setTimeout(function() { bubble.remove(); }, 400);
    }

    showNotification('🎓 引导完成！祝你农场大丰收～', 'success');
    // 持久化引导完成状态
    try { localStorage.setItem('mf_tutorial_done', '1'); } catch(e) {}
};

// 跳过引导
window.skipTutorial = function() {
    completeTutorial();
};

// 检查是否已完成引导（用于存档加载后跳过）
window.checkTutorialDone = function() {
    try { return localStorage.getItem('mf_tutorial_done') === '1'; } catch(e) { return false; }
};

// ==================== 怪兽管理模块 ====================

window.selectMonster = function(monsterId) {
    gameState.selectedMonster = gameState.selectedMonster === monsterId ? null : monsterId;
    renderMonsters();
    // 引导钩子：Step2 点击怪兽卡片 → Step3
    if (gameState.selectedMonster === monsterId) {
        if (typeof onTutorialMonsterSelected === 'function') onTutorialMonsterSelected();
    }
};

window.assignToFarm = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster) return;
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在忙碌中！', 'warning');
        return;
    }

    // 引导期间直接弹出地块选择器（钩子已统一在 showAssignPlotPicker 入口触发）
    if (typeof tutorialState !== 'undefined' && tutorialState.active && tutorialState.waitingForAssign) {
        showAssignPlotPicker(monsterId);
        return;
    }

    // 非引导期间的原有逻辑
    var availablePlot = gameState.plots.find(function(p) { return p.crop && !p.assignedMonster && !p.locked; });
    
    if (!availablePlot) {
        showNotification('没有可分配的农田！请先种植作物', 'warning');
        return;
    }
    
    availablePlot.assignedMonster = monster;
    monster.assignment = { type: 'farm', target: availablePlot.id };
    monster.status = 'working';
    
    // 派驻静默
    renderAll();
    
    if (Math.random() < 0.15) {
        setTimeout(function() { triggerRandomEvent('farming'); }, 2000);
    }
};

window.assignToSelling = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster) return;
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在忙碌中！', 'warning');
        return;
    }
    
    if (gameState.food < 10) {
        showNotification('食物不足！需要10食物', 'error');
        return;
    }
    
    gameState.food -= 10;
    monster.status = 'selling';
    
    // 售卖静默
    
    setTimeout(function() {
        var earnings = 20 + Math.floor(Math.random() * 30) + monster.stats.intelligence * 2;
        gameState.coins += earnings;
        
        gainExp(monster, 15);
        
        monster.status = 'idle';
        updateResources();
        renderMonsters();
        showNotification('💰 ' + monster.name + ' 回来了！赚了 ' + earnings + ' 金币', 'success');
    }, 30000);
    
    renderAll();
};
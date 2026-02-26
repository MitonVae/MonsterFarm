// ==================== 怪兽管理模块 ====================

window.selectMonster = function(monsterId) {
    gameState.selectedMonster = gameState.selectedMonster === monsterId ? null : monsterId;
    renderMonsters();
};

window.assignToFarm = function(monsterId) {
    var monster = gameState.monsters.find(function(m) { return m.id === monsterId; });
    if (!monster) return;
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在忙碌中！', 'warning');
        return;
    }
    
    var availablePlot = gameState.plots.find(function(p) { return p.crop && !p.assignedMonster && !p.locked; });
    
    if (!availablePlot) {
        showNotification('没有可分配的农田！请先种植作物', 'warning');
        return;
    }
    
    availablePlot.assignedMonster = monster;
    monster.assignment = { type: 'farm', target: availablePlot.id };
    monster.status = 'working';
    
    showNotification(monster.name + ' 开始在农田工作！', 'success');
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
    
    showNotification(monster.name + ' 出门售卖了...', 'success');
    
    setTimeout(function() {
        var earnings = 20 + Math.floor(Math.random() * 30) + monster.stats.intelligence * 2;
        gameState.coins += earnings;
        
        gainExp(monster, 15);
        
        monster.status = 'idle';
        updateResources();
        renderMonsters();
        showNotification(monster.name + ' 回来了！赚了 ' + earnings + ' 金币', 'success');
    }, 30000);
    
    renderAll();
};
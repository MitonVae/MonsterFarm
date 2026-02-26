// ==================== 处理中心模块 ====================

window.renderDisposal = function() {
    var disposalContainer = document.getElementById('disposalContainer');
    if (!disposalContainer) return;
    
    disposalContainer.innerHTML = `
        <h2>怪兽处理中心</h2>
        <p style="color: #8b949e; margin: 10px 0;">管理多余的怪兽（选择怪兽后可进行处理）</p>
        
        ${gameState.selectedMonster ? `
            <div style="background: #fff3e0; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ff9800;">
                <strong>已选择：</strong> ${gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; })?.name || '无'}
            </div>
        ` : `
            <div style="background: #21262d; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; color: #8b949e;">
                请先在"怪兽"标签页选择要处理的怪兽
            </div>
        `}
        
        <div class="disposal-options">
            <div class="disposal-option" onclick="releaseMonster()">
                <div style="font-size: 48px;">${createSVG('release', 48)}</div>
                <div class="disposal-title">放生</div>
                <div class="disposal-desc">
                    将怪兽放归自然<br>
                    获得少量材料
                </div>
            </div>
            
            <div class="disposal-option" onclick="showSacrificePanel()">
                <div style="font-size: 48px;">${createSVG('sacrifice', 48)}</div>
                <div class="disposal-title">献祭仪式</div>
                <div class="disposal-desc">献祭怪兽获得大量研究点</div>
            </div>
            
            <div class="disposal-option" onclick="showLaboratoryPanel()">
                <div style="font-size: 48px;">${createSVG('laboratory', 48)}</div>
                <div class="disposal-title">研究实验</div>
                <div class="disposal-desc">让怪兽参与实验获得科技点数</div>
            </div>
            
            <div class="disposal-option" onclick="showRecyclePanel()">
                <div style="font-size: 48px;">${createSVG('repair', 48)}</div>
                <div class="disposal-title">分解回收</div>
                <div class="disposal-desc">分解怪兽获得材料和食物</div>
            </div>
            
            <div class="disposal-option" onclick="showSellPanel()">
                <div style="font-size: 48px;">${createSVG('sell', 48)}</div>
                <div class="disposal-title">售卖交易</div>
                <div class="disposal-desc">将怪兽卖给商人获得金币</div>
            </div>
        </div>
        
        <div style="background: #21262d; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #f85149;">
            <strong style="color: #f85149;">${createSVG('warning', 16)} 警告：</strong>
            <span style="color: #e6edf3;">被释放的怪兽将永远消失，请谨慎操作！</span>
        </div>
    `;
};

window.releaseMonster = function() {
    if (!gameState.selectedMonster) {
        showNotification('请先选择怪兽！', 'warning');
        return;
    }
    
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在工作中！', 'warning');
        return;
    }
    
    if (confirm('确定要放生 ' + monster.name + ' 吗？\n\n这将获得 ' + (monster.level * 5) + ' 材料')) {
        var reward = monster.level * 5;
        gameState.materials += reward;
        
        var index = gameState.monsters.findIndex(function(m) { return m.id === monster.id; });
        gameState.monsters.splice(index, 1);
        
        gameState.selectedMonster = null;
        
        showNotification('放生了 ' + monster.name + '，获得 ' + reward + ' 材料', 'success');
        updateResources();
        renderMonsters();
        renderDisposal();
    }
};

window.sacrificeMonster = function() {
    if (!gameState.selectedMonster) {
        showNotification('请先选择怪兽！', 'warning');
        return;
    }
    
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在工作中！', 'warning');
        return;
    }
    
    var totalStats = Object.values(monster.stats).reduce(function(a, b) { return a + b; }, 0);
    var reward = monster.level * 10 + totalStats * 2;
    
    if (confirm('确定要献祭 ' + monster.name + ' 吗？\n\n这将获得 ' + reward + ' 研究点\n\n⚠️ 此操作不可逆！')) {
        gameState.research += reward;
        
        var index = gameState.monsters.findIndex(function(m) { return m.id === monster.id; });
        gameState.monsters.splice(index, 1);
        
        gameState.selectedMonster = null;
        
        showNotification('献祭了 ' + monster.name + '，获得 ' + reward + ' 研究点', 'success');
        updateResources();
        renderMonsters();
        renderDisposal();
    }
};

window.decomposeMonster = function() {
    if (!gameState.selectedMonster) {
        showNotification('请先选择怪兽！', 'warning');
        return;
    }
    
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在工作中！', 'warning');
        return;
    }
    
    var materialsReward = monster.level * 8 + monster.stats.strength * 3;
    var foodReward = monster.level * 5 + monster.stats.farming * 2;
    
    if (confirm('确定要分解 ' + monster.name + ' 吗？\n\n将获得：\n材料 ' + materialsReward + '\n食物 ' + foodReward)) {
        gameState.materials += materialsReward;
        gameState.food += foodReward;
        
        var index = gameState.monsters.findIndex(function(m) { return m.id === monster.id; });
        gameState.monsters.splice(index, 1);
        
        gameState.selectedMonster = null;
        
        showNotification('分解了 ' + monster.name, 'success');
        updateResources();
        renderMonsters();
        renderDisposal();
    }
};

window.sellMonster = function() {
    if (!gameState.selectedMonster) {
        showNotification('请先选择怪兽！', 'warning');
        return;
    }
    
    var monster = gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; });
    
    if (monster.status !== 'idle') {
        showNotification('该怪兽正在工作中！', 'warning');
        return;
    }
    
    var totalStats = Object.values(monster.stats).reduce(function(a, b) { return a + b; }, 0);
    var reward = monster.level * 20 + totalStats * 5 + monster.generation * 10;
    
    if (confirm('确定要出售 ' + monster.name + ' 吗？\n\n将获得 ' + reward + ' 金币')) {
        gameState.coins += reward;
        
        var index = gameState.monsters.findIndex(function(m) { return m.id === monster.id; });
        gameState.monsters.splice(index, 1);
        
        gameState.selectedMonster = null;
        
        showNotification('出售了 ' + monster.name + '，获得 ' + reward + ' 金币', 'success');
        updateResources();
        renderMonsters();
        renderDisposal();
    }
};
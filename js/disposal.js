// ==================== 处理中心模块 ====================

window.renderDisposal = function() {
    var disposalContainer = document.getElementById('disposalContainer');
    if (!disposalContainer) return;
    
    disposalContainer.innerHTML = `
        <h2>怪兽处理中心</h2>
        <p style="color: #666; margin: 10px 0;">管理多余的怪兽（选择怪兽后可进行处理）</p>
        
        ${gameState.selectedMonster ? `
            <div style="background: #fff3e0; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ff9800;">
                <strong>已选择：</strong> ${gameState.monsters.find(function(m) { return m.id === gameState.selectedMonster; })?.name || '无'}
            </div>
        ` : `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; color: #999;">
                请先在"怪兽"标签页选择要处理的怪兽
            </div>
        `}
        
        <div class="disposal-options">
            <div class="disposal-option" onclick="releaseMonster()">
                <div style="font-size: 48px;">🌊</div>
                <div class="disposal-title">放生</div>
                <div class="disposal-desc">
                    将怪兽放归自然<br>
                    获得少量材料
                </div>
            </div>
            
            <div class="disposal-option" onclick="sacrificeMonster()">
                <div style="font-size: 48px;">⚗️</div>
                <div class="disposal-title">献祭</div>
                <div class="disposal-desc">
                    献祭怪兽<br>
                    获得大量研究点
                </div>
            </div>
            
            <div class="disposal-option" onclick="decomposeMonster()">
                <div style="font-size: 48px;">🔧</div>
                <div class="disposal-title">分解</div>
                <div class="disposal-desc">
                    分解怪兽<br>
                    获得材料和食物
                </div>
            </div>
            
            <div class="disposal-option" onclick="sellMonster()">
                <div style="font-size: 48px;">💸</div>
                <div class="disposal-title">出售</div>
                <div class="disposal-desc">
                    卖给商人<br>
                    获得大量金币
                </div>
            </div>
        </div>
        
        <div style="background: #ffebee; padding: 15px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #f44336;">
            <strong>⚠️ 警告：</strong> 所有处理操作都是不可逆的，请谨慎操作！
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
    
    if (confirm('确定要分解 ' + monster.name + ' 吗？\n\n将获得：\n🔨 ' + materialsReward + ' 材料\n🌾 ' + foodReward + ' 食物')) {
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
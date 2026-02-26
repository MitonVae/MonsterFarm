// ==================== 科技树模块 ====================

window.renderTech = function() {
    var techTree = document.getElementById('techTree');
    if (!techTree) return;
    
    techTree.innerHTML = Object.keys(technologies).map(function(techId) {
        var tech = technologies[techId];
        var unlocked = gameState.technologies[techId];
        
        var canUnlock = Object.keys(tech.cost).every(function(resource) {
            return gameState[resource] >= tech.cost[resource];
        });
        
        return `
            <div class="tech-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="tech-title">
                    <span style="display: inline-block; vertical-align: middle; margin-right: 5px;">${unlocked ? createSVG('check', 16) : createSVG('locked_tech', 16)}</span>${tech.name}
                </div>
                <div class="tech-desc">${tech.desc}</div>
                ${!unlocked ? `
                    <div class="tech-cost">
                        需要: ${Object.keys(tech.cost).map(function(r) {
                            return getResourceIcon(r) + tech.cost[r];
                        }).join(' ')}
                    </div>
                    <button class="btn btn-primary" 
                            onclick="unlockTech('${techId}')"
                            ${!canUnlock ? 'disabled' : ''}>
                        ${canUnlock ? '解锁' : '资源不足'}
                    </button>
                ` : `
                    <div style="color: #4caf50; font-weight: bold; margin-top: 10px;">
                        <span style="display: inline-block; vertical-align: middle; margin-right: 3px;">${createSVG('check', 14)}</span>已解锁
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 5px;">
                        ${Object.keys(tech.effects).map(function(e) {
                            return e + ': ' + tech.effects[e];
                        }).join(', ')}
                    </div>
                `}
            </div>
        `;
    }).join('');
};

window.unlockTech = function(techId) {
    var tech = technologies[techId];
    
    var canUnlock = Object.keys(tech.cost).every(function(resource) {
        return gameState[resource] >= tech.cost[resource];
    });
    
    if (!canUnlock) {
        showNotification('资源不足！', 'error');
        return;
    }
    
    Object.keys(tech.cost).forEach(function(resource) {
        gameState[resource] -= tech.cost[resource];
    });
    
    gameState.technologies[techId] = true;
    
    if (techId === 'expansion') {
        gameState.plots.slice(3, 3 + tech.effects.extraPlots).forEach(function(plot) {
            plot.locked = false;
        });
    }
    
    showNotification('成功解锁：' + tech.name + '！', 'success');
    updateResources();
    renderTech();
    renderFarm();
};
// ==================== 工具函数 ====================

function createSVG(type, size) {
    size = size || 48;
    var svgs = {
        lock: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`,
        
        add: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>`,
        
        plant: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <path d="M12 2v20"/>
        </svg>`,
        
        slime: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24">
            <ellipse cx="12" cy="16" rx="8" ry="6" fill="#4caf50" opacity="0.8"/>
            <circle cx="9" cy="14" r="1.5" fill="#fff"/>
            <circle cx="15" cy="14" r="1.5" fill="#fff"/>
            <circle cx="9" cy="14" r="0.7" fill="#000"/>
            <circle cx="15" cy="14" r="0.7" fill="#000"/>
        </svg>`,
        
        goblin: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="7" fill="#ff9800" opacity="0.8"/>
            <polygon points="8,8 9,5 11,8" fill="#ff9800"/>
            <polygon points="16,8 15,5 13,8" fill="#ff9800"/>
            <circle cx="9" cy="12" r="1.2" fill="#fff"/>
            <circle cx="15" cy="12" r="1.2" fill="#fff"/>
            <circle cx="9" cy="12" r="0.6" fill="#000"/>
            <circle cx="15" cy="12" r="0.6" fill="#000"/>
            <path d="M 9 15 Q 12 17 15 15" stroke="#000" stroke-width="1" fill="none"/>
        </svg>`,
        
        sprite: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" fill="#2196f3" opacity="0.6"/>
            <path d="M 8 10 L 6 8 L 8 9" stroke="#2196f3" stroke-width="1.5" fill="none"/>
            <path d="M 16 10 L 18 8 L 16 9" stroke="#2196f3" stroke-width="1.5" fill="none"/>
            <circle cx="10" cy="11" r="1" fill="#fff"/>
            <circle cx="14" cy="11" r="1" fill="#fff"/>
            <path d="M 10 14 Q 12 15 14 14" stroke="#fff" stroke-width="1" fill="none"/>
        </svg>`,
        
        golem: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24">
            <rect x="7" y="7" width="10" height="12" fill="#795548" opacity="0.8" rx="2"/>
            <rect x="8" y="10" width="2" height="2" fill="#ffeb3b"/>
            <rect x="14" y="10" width="2" height="2" fill="#ffeb3b"/>
            <rect x="10" y="15" width="4" height="1" fill="#000"/>
        </svg>`,
        
        wisp: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" fill="#9c27b0" opacity="0.5"/>
            <circle cx="12" cy="10" r="4" fill="#ce93d8" opacity="0.7"/>
            <circle cx="10" cy="10" r="1" fill="#fff"/>
            <circle cx="14" cy="10" r="1" fill="#fff"/>
            <path d="M 10 18 Q 12 20 14 18" stroke="#9c27b0" stroke-width="1" fill="none" opacity="0.5"/>
        </svg>`,
        
        explore: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>`,
        
        breeding: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`,
        
        recycle: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
            <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
            <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>`
    };
    
    return svgs[type] || svgs.slime;
}

function getResourceIcon(resource) {
    var icons = {
        coins: '💰',
        food: '🌾',
        materials: '🔨',
        research: '🔬',
        energy: '⚡'
    };
    return icons[resource] || '';
}

function getStatusText(status) {
    var statusMap = {
        idle: '空闲',
        working: '工作中',
        exploring: '探索中',
        breeding: '繁殖中',
        selling: '售卖中'
    };
    return statusMap[status] || status;
}
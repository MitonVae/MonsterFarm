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
        </svg>`,
        
        // 资源图标
        coin: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f0c53d" stroke-width="2">
            <circle cx="12" cy="12" r="9" fill="#f0c53d" opacity="0.2"/>
            <circle cx="12" cy="12" r="6" stroke="#f0c53d" stroke-width="2" fill="none"/>
            <path d="M9 12h6" stroke="#f0c53d" stroke-width="2"/>
            <path d="M12 9v6" stroke="#f0c53d" stroke-width="2"/>
        </svg>`,
        
        food: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#46d164" stroke-width="2">
            <path d="M3 12h18" stroke="#46d164"/>
            <path d="M3 6h18" stroke="#46d164"/>
            <path d="M3 18h18" stroke="#46d164"/>
            <path d="M8 6v12" stroke="#46d164"/>
            <path d="M16 6v12" stroke="#46d164"/>
        </svg>`,
        
        material: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c.552 0 1-.449 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1v6c0 .551.448 1 1 1h6z"/>
            <path d="M3 12c.552 0 1-.449 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1v6c0 .551.448 1 1 1h6z"/>
            <rect x="6" y="14" width="12" height="6" rx="1" fill="#8b949e" opacity="0.3"/>
        </svg>`,
        
        research: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2">
            <circle cx="12" cy="12" r="3" fill="none" stroke="#58a6ff"/>
            <path d="M12 1v6m0 6v6m8.66-7.5l-5.2 3m-5.2 3l-5.2-3M1.34 16.5l5.2-3m5.2-3l5.2-3"/>
        </svg>`,
        
        energy: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f0883e" stroke-width="2">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#f0883e" opacity="0.3"/>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#f0883e"/>
        </svg>`,
        
        // 随机事件图标
        rain: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2">
            <cloud cx="6" cy="8" r="4" fill="#58a6ff" opacity="0.3"/>
            <cloud cx="14" cy="8" r="6" fill="#58a6ff" opacity="0.3"/>
            <path d="M16 13v8m-8-6v6m4-4v8"/>
        </svg>`,
        
        bug: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#e57373" stroke-width="2">
            <ellipse cx="12" cy="14" rx="5" ry="7" fill="#e57373" opacity="0.3"/>
            <path d="M7 13c0-3.866 2.686-7 6-7s6 3.134 6 7"/>
            <path d="M7 21c0-3.866 2.686-7 6-7s6 3.134 6 7"/>
            <circle cx="10" cy="12" r="1" fill="#e57373"/>
            <circle cx="14" cy="12" r="1" fill="#e57373"/>
        </svg>`,
        
        wind: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2">
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
        </svg>`,
        
        map: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f0883e" stroke-width="2">
            <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
        </svg>`,
        
        battle: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#e57373" stroke-width="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
        </svg>`,
        
        treasure: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f0c53d" stroke-width="2">
            <rect x="2" y="8" width="20" height="10" rx="2" ry="2" fill="#f0c53d" opacity="0.2"/>
            <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <circle cx="12" cy="13" r="2" fill="#f0c53d" opacity="0.5"/>
        </svg>`,
        
        gift: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#46d164" stroke-width="2">
            <polyline points="20,12 20,22 4,22 4,12"/>
            <rect x="2" y="7" width="20" height="5"/>
            <line x1="12" y1="22" x2="12" y2="7"/>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>`,
        
        // 处理操作图标  
        sacrifice: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
            <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26"/>
        </svg>`,
        
        laboratory: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2">
            <path d="M9 2v6l-3 7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l-3-7V2"/>
            <line x1="7" y1="2" x2="17" y2="2"/>
            <circle cx="12" cy="12" r="2" fill="#58a6ff" opacity="0.3"/>
        </svg>`,
        
        repair: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>`,
        
        sell: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#46d164" stroke-width="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>`,
        
        release: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#46d164" stroke-width="2">
            <path d="M7 4V2a1 1 0 0 1 2 0v2h6V2a1 1 0 0 1 2 0v2h3a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2h3z"/>
            <circle cx="12" cy="16" r="6"/>
            <path d="M12 12v4m0 0l-2-2m2 2l2-2"/>
        </svg>`,
        
        warning: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f85149" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`,
        
        egg: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2">
            <path d="M12 22c5.523 0 8-4.477 8-10S17.523 2 12 2s-8 4.477-8 10 2.477 10 8 10z"/>
        </svg>`,
        
        breeding: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f85149" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>`,
        
        // 工厂图标
        factory: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2">
            <rect x="2" y="12" width="20" height="10"/>
            <path d="M2 12V8a2 2 0 0 1 2-2h4"/>
            <path d="M12 12V6a2 2 0 0 1 2-2h6"/>
            <path d="M6 2v4"/>
            <path d="M10 2v4"/>
            <path d="M14 2v4"/>
            <path d="M18 2v4"/>
        </svg>`,
        
        // 状态图标
        work: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m8.66-7.5l-5.2 3m-5.2 3l-5.2-3M1.34 16.5l5.2-3m5.2-3l5.2-3"/>
        </svg>`,
        
        unlock: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#46d164" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
        </svg>`,
        
        locked_tech: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#e57373" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <line x1="9" y1="16" x2="15" y2="16"/>
        </svg>`,
        
        check: `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#46d164" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
        </svg>`
    };
    
    return svgs[type] || svgs.slime;
}

function getResourceIcon(resource) {
    var iconMap = {
        coins: 'coin',
        food: 'food', 
        materials: 'material',
        research: 'research',
        energy: 'energy'
    };
    var iconType = iconMap[resource];
    return iconType ? createSVG(iconType, 16) : '';
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
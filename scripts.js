// 游戏核心变量
const game = {
    map: null,
    ctx: null,
    nations: [],
    selectedNation: null,
    year: 2023,
    isSimulating: false,
    simulationSpeed: 1000, // 模拟速度，毫秒/年
    simulationInterval: null,
    mapWidth: 2000,
    mapHeight: 1500,
    viewportX: 0,
    viewportY: 0,
    scale: 1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    terrainGrid: [],
    gridSize: 10, // 地形网格大小
    terrainTypes: {
        WATER: { name: '水域', color: '#3498db', fertility: 0, habitability: 0 },
        PLAINS: { name: '平原', color: '#2ecc71', fertility: 0.8, habitability: 0.9 },
        MOUNTAINS: { name: '山脉', color: '#95a5a6', fertility: 0.2, habitability: 0.3 },
        DESERT: { name: '沙漠', color: '#f1c40f', fertility: 0.1, habitability: 0.2 },
        FOREST: { name: '森林', color: '#27ae60', fertility: 0.7, habitability: 0.6 }
    },
    // 保存槽位
    saveSlots: [],
    currentSaveSlot: null,
    // 自然灾害系统
    naturalDisasters: {
        types: [
            {
                name: '地震',
                probability: 0.05,
                effects: (nation, severity) => {
                    // 人口损失
                    const populationLoss = nation.population * 0.02 * severity;
                    nation.population -= populationLoss;
                    
                    // 资源损失
                    nation.resources.minerals -= 10 * severity;
                    nation.resources.gold -= 50 * severity;
                    
                    // 稳定度下降
                    nation.stability -= 0.05 * severity;
                    
                    return {
                        message: `发生${severity > 1 ? '严重' : '轻微'}地震，造成${populationLoss.toFixed(1)}百万人口死亡，损失矿物资源和基础设施。`,
                        populationLoss: populationLoss,
                        resourceLoss: { minerals: 10 * severity, gold: 50 * severity },
                        stabilityLoss: 0.05 * severity
                    };
                }
            },
            {
                name: '洪水',
                probability: 0.08,
                effects: (nation, severity) => {
                    // 人口损失
                    const populationLoss = nation.population * 0.01 * severity;
                    nation.population -= populationLoss;
                    
                    // 食物减产
                    nation.resources.food -= 20 * severity;
                    
                    // 稳定度下降
                    nation.stability -= 0.03 * severity;
                    
                    return {
                        message: `发生${severity > 1 ? '严重' : '轻微'}洪水，淹没农田，造成${populationLoss.toFixed(1)}百万人口死亡，食物减产。`,
                        populationLoss: populationLoss,
                        resourceLoss: { food: 20 * severity },
                        stabilityLoss: 0.03 * severity
                    };
                }
            },
            {
                name: '干旱',
                probability: 0.06,
                effects: (nation, severity) => {
                    // 食物严重减产
                    nation.resources.food -= 30 * severity;
                    
                    // 稳定度大幅下降
                    nation.stability -= 0.08 * severity;
                    
                    return {
                        message: `发生${severity > 1 ? '严重' : '轻微'}干旱，粮食产量大幅下降，民众生活困难。`,
                        resourceLoss: { food: 30 * severity },
                        stabilityLoss: 0.08 * severity
                    };
                }
            },
            {
                name: '瘟疫',
                probability: 0.04,
                effects: (nation, severity) => {
                    // 人口大量损失
                    const populationLoss = nation.population * 0.04 * severity;
                    nation.population -= populationLoss;
                    
                    // 稳定度急剧下降
                    nation.stability -= 0.1 * severity;
                    
                    return {
                        message: `爆发${severity > 1 ? '严重' : '轻微'}瘟疫，造成${populationLoss.toFixed(1)}百万人口死亡，社会动荡不安。`,
                        populationLoss: populationLoss,
                        stabilityLoss: 0.1 * severity
                    };
                }
            },
            {
                name: '火灾',
                probability: 0.07,
                effects: (nation, severity) => {
                    // 资源损失
                    nation.resources.minerals -= 15 * severity;
                    nation.resources.gold -= 30 * severity;
                    
                    // 稳定度下降
                    nation.stability -= 0.04 * severity;
                    
                    return {
                        message: `发生${severity > 1 ? '严重' : '轻微'}火灾，烧毁基础设施和仓库，造成资源损失。`,
                        resourceLoss: { minerals: 15 * severity, gold: 30 * severity },
                        stabilityLoss: 0.04 * severity
                    };
                }
            }
        ]
    },
    // 随机事件系统
    randomEvents: {
        types: [
            {
                name: '技术突破',
                probability: 0.05,
                effects: (nation) => {
                    // 技术提升
                    nation.resources.technology += 1;
                    
                    // 稳定度小幅提升
                    nation.stability += 0.02;
                    
                    return {
                        message: `科学家取得重大技术突破，国家科技水平显著提升！`,
                        technologyGain: 1,
                        stabilityGain: 0.02
                    };
                }
            },
            {
                name: '经济繁荣',
                probability: 0.06,
                effects: (nation) => {
                    // 黄金增加
                    const goldGain = Math.floor(Math.random() * 100) + 50;
                    nation.resources.gold += goldGain;
                    
                    // 稳定度提升
                    nation.stability += 0.03;
                    
                    return {
                        message: `经济繁荣发展，国库收入增加${goldGain}黄金！`,
                        goldGain: goldGain,
                        stabilityGain: 0.03
                    };
                }
            },
            {
                name: '丰收年',
                probability: 0.08,
                effects: (nation) => {
                    // 食物大幅增加
                    const foodGain = Math.floor(Math.random() * 100) + 50;
                    nation.resources.food += foodGain;
                    
                    // 稳定度提升
                    nation.stability += 0.04;
                    
                    return {
                        message: `风调雨顺，农业大丰收，食物储备增加${foodGain}！`,
                        foodGain: foodGain,
                        stabilityGain: 0.04
                    };
                }
            },
            {
                name: '民众起义',
                probability: 0.03,
                effects: (nation) => {
                    // 稳定度大幅下降
                    nation.stability -= 0.15;
                    
                    // 资源损失
                    nation.resources.gold -= 50;
                    
                    return {
                        message: `民众不满现状，爆发起义，政府花费大量资源镇压，社会动荡不安。`,
                        stabilityLoss: 0.15,
                        goldLoss: 50
                    };
                }
            },
            {
                name: '外来移民',
                probability: 0.07,
                effects: (nation) => {
                    // 人口增加
                    const populationGain = Math.random() * 2 + 1;
                    nation.population += populationGain;
                    
                    return {
                        message: `大量移民涌入，人口增加${populationGain.toFixed(1)}百万！`,
                        populationGain: populationGain
                    };
                }
            },
            {
                name: '发现矿藏',
                probability: 0.04,
                effects: (nation) => {
                    // 矿物资源大幅增加
                    const mineralsGain = Math.floor(Math.random() * 100) + 50;
                    nation.resources.minerals += mineralsGain;
                    
                    return {
                        message: `国内发现大型矿藏，矿物资源增加${mineralsGain}！`,
                        mineralsGain: mineralsGain
                    };
                }
            },
            {
                name: '政治改革',
                probability: 0.03,
                effects: (nation) => {
                    // 稳定度大幅提升
                    nation.stability += 0.1;
                    
                    return {
                        message: `政府推行成功的政治改革，民众满意度大幅提升，社会稳定繁荣。`,
                        stabilityGain: 0.1
                    };
                }
            }
        ]
    },
    // 外交系统
    diplomacy: {
        relationTypes: {
            ALLIANCE: { name: '同盟', color: '#2ecc71', value: 80 },
            FRIENDLY: { name: '友好', color: '#27ae60', value: 50 },
            NEUTRAL: { name: '中立', color: '#95a5a6', value: 0 },
            TENSE: { name: '紧张', color: '#e67e22', value: -30 },
            WAR: { name: '战争', color: '#e74c3c', value: -100 }
        },
        treaties: [] // 存储国家间的条约
    },
    // 战争系统
    warfare: {
        activeWars: [], // 当前活跃的战争
        battleHistory: [] // 战争历史记录
    },
    // 贸易系统
    trade: {
        tradeRoutes: [], // 贸易路线
        globalMarket: { // 全球市场价格
            food: 1.0,
            minerals: 1.0,
            technology: 10.0
        }
    },
    // 当前界面模式
    currentMode: 'normal', // normal, diplomacy, trade, war
    notifications: [] // 游戏通知
};

// 国家类
class Nation {
    constructor(name, color, government, economy, population, militaryStrength) {
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        this.name = name;
        this.color = color;
        this.government = government;
        this.economy = economy;
        this.population = population; // 百万
        this.militaryStrength = militaryStrength; // 1-10
        this.territories = []; // 领土坐标数组
        this.relations = {}; // 与其他国家的关系
        this.resources = {
            food: 100,
            minerals: 100,
            technology: 1,
            gold: 1000 // 新增：黄金/货币资源
        };
        this.growthRate = 0.01; // 人口增长率
        this.stability = 0.8; // 稳定度 0-1
        
        // 外交系统
        this.diplomaticActions = []; // 外交行动历史
        this.treaties = {}; // 与其他国家的条约
        
        // 战争系统
        this.atWar = false; // 是否处于战争状态
        this.warWith = []; // 与哪些国家交战
        this.militaryUnits = {
            infantry: Math.floor(militaryStrength * 2), // 步兵单位
            cavalry: Math.floor(militaryStrength * 0.5), // 骑兵单位
            artillery: Math.floor(militaryStrength * 0.2) // 炮兵单位
        };
        this.casualties = 0; // 战争伤亡
        
        // 贸易系统
        this.tradeRoutes = []; // 贸易路线
        this.tradeSurplus = 0; // 贸易顺差
        this.tradeDeficit = 0; // 贸易逆差
        this.economicGrowth = 0.01; // 经济增长率
        this.tariffs = 0.1; // 关税率
    }

    // 计算国力
    calculatePower() {
        return (this.population * 0.5) + (this.militaryStrength * 2) + 
               (this.resources.technology * 3) + (this.territories.length * 0.2);
    }

    // 更新国家状态
    update() {
        // 人口增长
        const growthModifier = this.calculateGrowthModifier();
        this.population *= (1 + (this.growthRate * growthModifier));
        this.population = Math.round(this.population * 100) / 100;

        // 资源更新
        this.updateResources();

        // 稳定度更新
        this.updateStability();

        // 技术进步
        if (Math.random() < 0.1 * (this.resources.minerals / 100)) {
            this.resources.technology += 0.1;
        }
        
        // 处理贸易
        this.processTrade();
        
        // 战争影响
        this.handleWarEffects();
        
        // 军事单位恢复
        this.recoverMilitaryUnits();
        
        // 外交关系自然变化
        this.updateDiplomaticRelations();
    }
    
    // 处理战争影响
    handleWarEffects() {
        if (!this.atWar) return;
        
        // 战争降低稳定度
        this.stability -= 0.02;
        
        // 战争消耗资源
        const warCost = this.warWith.length * 5;
        this.resources.gold -= warCost;
        
        // 如果资金耗尽，可能被迫议和
        if (this.resources.gold < 0) {
            this.resources.gold = 0;
            
            // 随机选择一个交战国议和
            if (this.warWith.length > 0 && Math.random() < 0.5) {
                const randomEnemyIndex = Math.floor(Math.random() * this.warWith.length);
                const enemyId = this.warWith[randomEnemyIndex];
                
                this.endWar(enemyId);
                
                game.notifications.push({
                    type: 'FORCED_PEACE',
                    message: `${this.name} 因资金耗尽被迫与敌国议和！`,
                    year: game.year
                });
            }
        }
    }
    
    // 军事单位恢复
    recoverMilitaryUnits() {
        // 基于人口和资源恢复军事单位
        const recoveryRate = 0.05; // 每年恢复5%
        const maxInfantry = Math.floor(this.population * 0.1) + (this.militaryStrength * 2);
        const maxCavalry = Math.floor(maxInfantry * 0.3);
        const maxArtillery = Math.floor(maxInfantry * 0.1);
        
        // 计算恢复量
        const infantryRecovery = Math.floor((maxInfantry - this.militaryUnits.infantry) * recoveryRate);
        const cavalryRecovery = Math.floor((maxCavalry - this.militaryUnits.cavalry) * recoveryRate);
        const artilleryRecovery = Math.floor((maxArtillery - this.militaryUnits.artillery) * recoveryRate);
        
        // 恢复军事单位
        this.militaryUnits.infantry += infantryRecovery;
        this.militaryUnits.cavalry += cavalryRecovery;
        this.militaryUnits.artillery += artilleryRecovery;
        
        // 确保不超过最大值
        this.militaryUnits.infantry = Math.min(this.militaryUnits.infantry, maxInfantry);
        this.militaryUnits.cavalry = Math.min(this.militaryUnits.cavalry, maxCavalry);
        this.militaryUnits.artillery = Math.min(this.militaryUnits.artillery, maxArtillery);
    }
    
    // 更新外交关系
    updateDiplomaticRelations() {
        for (const nationId in this.relations) {
            // 关系自然趋于中立
            const currentRelation = this.relations[nationId];
            
            if (currentRelation > 0) {
                // 友好关系略微下降
                this.relations[nationId] = Math.max(0, currentRelation - 0.5);
            } else if (currentRelation < 0) {
                // 敌对关系略微改善
                this.relations[nationId] = Math.min(0, currentRelation + 0.5);
            }
            
            // 同盟和战争状态不会自然改变
            if (this.treaties[nationId] === 'ALLIANCE') {
                this.relations[nationId] = game.diplomacy.relationTypes.ALLIANCE.value;
            } else if (this.warWith.includes(parseInt(nationId))) {
                this.relations[nationId] = game.diplomacy.relationTypes.WAR.value;
            }
        }
    }

    calculateGrowthModifier() {
        // 基于经济、稳定度和资源的人口增长修正
        let modifier = 1;
        
        // 经济类型影响
        switch(this.economy) {
            case 'capitalist': modifier *= 1.1; break;
            case 'socialist': modifier *= 0.9; break;
            case 'mixed': modifier *= 1; break;
        }
        
        // 稳定度影响
        modifier *= this.stability;
        
        // 食物资源影响
        modifier *= (this.resources.food / 100);
        
        return modifier;
    }

    updateResources() {
        // 更新食物资源
        const foodProduction = this.territories.length * 0.5;
        const foodConsumption = this.population * 0.3;
        this.resources.food += (foodProduction - foodConsumption);
        this.resources.food = Math.max(0, Math.min(this.resources.food, 1000));
        
        // 更新矿物资源
        const mineralProduction = this.territories.length * 0.3;
        this.resources.minerals += mineralProduction;
        this.resources.minerals = Math.max(0, Math.min(this.resources.minerals, 1000));
    }

    updateStability() {
        // 食物短缺会降低稳定度
        if (this.resources.food < this.population * 0.2) {
            this.stability -= 0.05;
        } else {
            this.stability += 0.01;
        }
        
        // 政府类型影响稳定度
        switch(this.government) {
            case 'democracy': 
                this.stability += 0.02; 
                break;
            case 'dictatorship': 
                if (Math.random() < 0.1) {
                    this.stability -= 0.05;
                }
                break;
        }
        
        // 限制稳定度范围
        this.stability = Math.max(0, Math.min(this.stability, 1));
    }

    // 添加领土
    addTerritory(x, y) {
        this.territories.push({x, y});
    }

    // 设置与其他国家的关系
    setRelation(nationId, value) {
        this.relations[nationId] = value; // -100 到 100
    }
    
    // 外交系统方法
    
    // 提议外交行动
    proposeDiplomaticAction(targetNation, actionType, terms = {}) {
        const action = {
            id: Date.now(),
            from: this.id,
            to: targetNation.id,
            type: actionType, // ALLIANCE, TRADE_AGREEMENT, PEACE_TREATY, WAR_DECLARATION
            terms: terms,
            proposedAt: game.year,
            status: 'pending' // pending, accepted, rejected
        };
        
        this.diplomaticActions.push(action);
        game.diplomacy.treaties.push(action);
        
        return action;
    }
    
    // 接受外交提议
    acceptDiplomaticAction(actionId) {
        const action = game.diplomacy.treaties.find(t => t.id === actionId && t.to === this.id);
        if (!action) return false;
        
        action.status = 'accepted';
        action.acceptedAt = game.year;
        
        // 根据行动类型执行不同操作
        switch(action.type) {
            case 'ALLIANCE':
                this.setRelation(action.from, game.diplomacy.relationTypes.ALLIANCE.value);
                const allyNation = game.nations.find(n => n.id === action.from);
                if (allyNation) {
                    allyNation.setRelation(this.id, game.diplomacy.relationTypes.ALLIANCE.value);
                    this.treaties[action.from] = 'ALLIANCE';
                    allyNation.treaties[this.id] = 'ALLIANCE';
                }
                break;
                
            case 'TRADE_AGREEMENT':
                this.createTradeRoute(action.from, action.terms.resource, action.terms.amount);
                break;
                
            case 'PEACE_TREATY':
                this.endWar(action.from);
                break;
        }
        
        return true;
    }
    
    // 拒绝外交提议
    rejectDiplomaticAction(actionId) {
        const action = game.diplomacy.treaties.find(t => t.id === actionId && t.to === this.id);
        if (!action) return false;
        
        action.status = 'rejected';
        action.rejectedAt = game.year;
        
        // 拒绝可能导致关系恶化
        const fromNation = game.nations.find(n => n.id === action.from);
        if (fromNation) {
            const currentRelation = this.relations[action.from] || 0;
            this.setRelation(action.from, Math.max(-100, currentRelation - 10));
            fromNation.setRelation(this.id, Math.max(-100, (fromNation.relations[this.id] || 0) - 10));
        }
        
        return true;
    }
    
    // 宣战
    declareWar(targetNationId) {
        const targetNation = game.nations.find(n => n.id === targetNationId);
        if (!targetNation) return false;
        
        // 创建战争记录
        const war = {
            id: Date.now(),
            aggressor: this.id,
            defender: targetNationId,
            startYear: game.year,
            status: 'active',
            battles: [],
            casualties: {
                [this.id]: 0,
                [targetNationId]: 0
            }
        };
        
        game.warfare.activeWars.push(war);
        
        // 更新双方状态
        this.atWar = true;
        this.warWith.push(targetNationId);
        this.setRelation(targetNationId, game.diplomacy.relationTypes.WAR.value);
        
        targetNation.atWar = true;
        targetNation.warWith.push(this.id);
        targetNation.setRelation(this.id, game.diplomacy.relationTypes.WAR.value);
        
        // 添加通知
        game.notifications.push({
            type: 'WAR_DECLARATION',
            message: `${this.name} 向 ${targetNation.name} 宣战！`,
            year: game.year
        });
        
        return war;
    }
    
    // 结束战争
    endWar(targetNationId) {
        const warIndex = game.warfare.activeWars.findIndex(
            w => (w.aggressor === this.id && w.defender === targetNationId) || 
                 (w.aggressor === targetNationId && w.defender === this.id)
        );
        
        if (warIndex === -1) return false;
        
        const war = game.warfare.activeWars[warIndex];
        war.status = 'ended';
        war.endYear = game.year;
        
        // 移动到历史记录
        game.warfare.battleHistory.push(war);
        game.warfare.activeWars.splice(warIndex, 1);
        
        // 更新双方状态
        this.warWith = this.warWith.filter(id => id !== targetNationId);
        if (this.warWith.length === 0) {
            this.atWar = false;
        }
        
        const targetNation = game.nations.find(n => n.id === targetNationId);
        if (targetNation) {
            targetNation.warWith = targetNation.warWith.filter(id => id !== this.id);
            if (targetNation.warWith.length === 0) {
                targetNation.atWar = false;
            }
            
            // 设置关系为紧张
            this.setRelation(targetNationId, game.diplomacy.relationTypes.TENSE.value);
            targetNation.setRelation(this.id, game.diplomacy.relationTypes.TENSE.value);
        }
        
        // 添加通知
        game.notifications.push({
            type: 'WAR_ENDED',
            message: `${this.name} 和 ${targetNation ? targetNation.name : '未知国家'} 之间的战争结束了！`,
            year: game.year
        });
        
        return true;
    }
    
    // 贸易系统方法
    
    // 创建贸易路线
    createTradeRoute(targetNationId, resource, amount) {
        const targetNation = game.nations.find(n => n.id === targetNationId);
        if (!targetNation) return false;
        
        // 检查是否已有相同的贸易路线
        const existingRoute = this.tradeRoutes.find(
            r => r.partner === targetNationId && r.resource === resource
        );
        
        if (existingRoute) {
            existingRoute.amount = amount;
            return existingRoute;
        }
        
        // 创建新贸易路线
        const tradeRoute = {
            id: Date.now(),
            partner: targetNationId,
            resource: resource,
            amount: amount,
            price: game.trade.globalMarket[resource] || 1.0,
            established: game.year
        };
        
        this.tradeRoutes.push(tradeRoute);
        
        // 在目标国家也添加对应的贸易路线
        const reverseRoute = {
            id: tradeRoute.id,
            partner: this.id,
            resource: resource,
            amount: -amount, // 负数表示出口
            price: tradeRoute.price,
            established: game.year
        };
        
        targetNation.tradeRoutes.push(reverseRoute);
        
        // 添加到全局贸易路线
        game.trade.tradeRoutes.push(tradeRoute);
        
        return tradeRoute;
    }
    
    // 取消贸易路线
    cancelTradeRoute(routeId) {
        const routeIndex = this.tradeRoutes.findIndex(r => r.id === routeId);
        if (routeIndex === -1) return false;
        
        const route = this.tradeRoutes[routeIndex];
        this.tradeRoutes.splice(routeIndex, 1);
        
        // 移除目标国家的对应贸易路线
        const targetNation = game.nations.find(n => n.id === route.partner);
        if (targetNation) {
            const targetRouteIndex = targetNation.tradeRoutes.findIndex(r => r.id === routeId);
            if (targetRouteIndex !== -1) {
                targetNation.tradeRoutes.splice(targetRouteIndex, 1);
            }
        }
        
        // 从全局贸易路线中移除
        const globalRouteIndex = game.trade.tradeRoutes.findIndex(r => r.id === routeId);
        if (globalRouteIndex !== -1) {
            game.trade.tradeRoutes.splice(globalRouteIndex, 1);
        }
        
        return true;
    }
    
    // 处理贸易
    processTrade() {
        let tradeSurplus = 0;
        
        for (const route of this.tradeRoutes) {
            const resource = route.resource;
            const amount = route.amount;
            const price = route.price;
            
            if (amount > 0) { // 进口
                // 支付金钱，获得资源
                const cost = amount * price;
                if (this.resources.gold >= cost) {
                    this.resources.gold -= cost;
                    this.resources[resource] += amount;
                    tradeSurplus -= cost;
                } else {
                    // 资金不足，取消贸易
                    this.cancelTradeRoute(route.id);
                    game.notifications.push({
                        type: 'TRADE_CANCELED',
                        message: `${this.name} 因资金不足取消了与 ${game.nations.find(n => n.id === route.partner)?.name || '未知国家'} 的贸易！`,
                        year: game.year
                    });
                }
            } else { // 出口
                // 获得金钱，失去资源
                const gain = Math.abs(amount) * price;
                if (this.resources[resource] >= Math.abs(amount)) {
                    this.resources.gold += gain;
                    this.resources[resource] -= Math.abs(amount);
                    tradeSurplus += gain;
                } else {
                    // 资源不足，取消贸易
                    this.cancelTradeRoute(route.id);
                    game.notifications.push({
                        type: 'TRADE_CANCELED',
                        message: `${this.name} 因资源不足取消了与 ${game.nations.find(n => n.id === route.partner)?.name || '未知国家'} 的贸易！`,
                        year: game.year
                    });
                }
            }
        }
        
        // 更新贸易顺差/逆差
        if (tradeSurplus > 0) {
            this.tradeSurplus = tradeSurplus;
            this.tradeDeficit = 0;
        } else {
            this.tradeSurplus = 0;
            this.tradeDeficit = Math.abs(tradeSurplus);
        }
        
        // 贸易影响经济增长
        this.economicGrowth = 0.01 + (this.tradeSurplus * 0.0001) - (this.tradeDeficit * 0.0001);
        
        return tradeSurplus;
    }
    
    // 战争系统方法
    
    // 进行军事行动
    conductMilitaryAction(targetNationId, type, commitment = 0.5) {
        const targetNation = game.nations.find(n => n.id === targetNationId);
        if (!targetNation || !this.atWar || !this.warWith.includes(targetNationId)) return false;
        
        // 计算投入的军事力量
        const committedForce = {
            infantry: Math.floor(this.militaryUnits.infantry * commitment),
            cavalry: Math.floor(this.militaryUnits.cavalry * commitment),
            artillery: Math.floor(this.militaryUnits.artillery * commitment)
        };
        
        // 目标国家的防御力量
        const defenseForce = {
            infantry: Math.floor(targetNation.militaryUnits.infantry * 0.7), // 假设70%用于防御
            cavalry: Math.floor(targetNation.militaryUnits.cavalry * 0.7),
            artillery: Math.floor(targetNation.militaryUnits.artillery * 0.7)
        };
        
        // 计算战斗结果
        const attackPower = (committedForce.infantry * 1) + 
                           (committedForce.cavalry * 2) + 
                           (committedForce.artillery * 3);
                           
        const defensePower = (defenseForce.infantry * 1.2) + // 防御方有优势
                            (defenseForce.cavalry * 1.5) + 
                            (defenseForce.artillery * 2.5);
        
        // 随机因素
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 到 1.2 之间
        
        const battleResult = {
            id: Date.now(),
            year: game.year,
            attacker: this.id,
            defender: targetNationId,
            type: type,
            attackerForce: committedForce,
            defenderForce: defenseForce,
            attackPower: attackPower,
            defensePower: defensePower,
            randomFactor: randomFactor,
            outcome: null,
            territoriesChanged: [],
            attackerCasualties: 0,
            defenderCasualties: 0
        };
        
        // 决定战斗结果
        if (attackPower * randomFactor > defensePower) {
            // 进攻方胜利
            battleResult.outcome = 'attacker_victory';
            
            // 计算伤亡
            battleResult.attackerCasualties = Math.floor(committedForce.infantry * 0.1) + 
                                            Math.floor(committedForce.cavalry * 0.15) + 
                                            Math.floor(committedForce.artillery * 0.05);
                                            
            battleResult.defenderCasualties = Math.floor(defenseForce.infantry * 0.3) + 
                                            Math.floor(defenseForce.cavalry * 0.25) + 
                                            Math.floor(defenseForce.artillery * 0.2);
            
            // 更新军事单位
            this.militaryUnits.infantry -= battleResult.attackerCasualties;
            this.militaryUnits.cavalry -= Math.floor(battleResult.attackerCasualties * 0.2);
            this.militaryUnits.artillery -= Math.floor(battleResult.attackerCasualties * 0.1);
            
            targetNation.militaryUnits.infantry -= battleResult.defenderCasualties;
            targetNation.militaryUnits.cavalry -= Math.floor(battleResult.defenderCasualties * 0.2);
            targetNation.militaryUnits.artillery -= Math.floor(battleResult.defenderCasualties * 0.1);
            
            // 如果是领土战，夺取领土
            if (type === 'TERRITORY') {
                // 找到目标国家的一块领土
                if (targetNation.territories.length > 0) {
                    const territoryIndex = Math.floor(Math.random() * targetNation.territories.length);
                    const territory = targetNation.territories[territoryIndex];
                    
                    // 将领土转移给进攻方
                    targetNation.territories.splice(territoryIndex, 1);
                    this.territories.push(territory);
                    
                    battleResult.territoriesChanged.push(territory);
                }
            }
            
            // 添加通知
            game.notifications.push({
                type: 'BATTLE_RESULT',
                message: `${this.name} 在与 ${targetNation.name} 的战斗中取得胜利！`,
                year: game.year
            });
        } else {
            // 防御方胜利
            battleResult.outcome = 'defender_victory';
            
            // 计算伤亡
            battleResult.attackerCasualties = Math.floor(committedForce.infantry * 0.3) + 
                                            Math.floor(committedForce.cavalry * 0.25) + 
                                            Math.floor(committedForce.artillery * 0.2);
                                            
            battleResult.defenderCasualties = Math.floor(defenseForce.infantry * 0.1) + 
                                            Math.floor(defenseForce.cavalry * 0.15) + 
                                            Math.floor(defenseForce.artillery * 0.05);
            
            // 更新军事单位
            this.militaryUnits.infantry -= battleResult.attackerCasualties;
            this.militaryUnits.cavalry -= Math.floor(battleResult.attackerCasualties * 0.2);
            this.militaryUnits.artillery -= Math.floor(battleResult.attackerCasualties * 0.1);
            
            targetNation.militaryUnits.infantry -= battleResult.defenderCasualties;
            targetNation.militaryUnits.cavalry -= Math.floor(battleResult.defenderCasualties * 0.2);
            targetNation.militaryUnits.artillery -= Math.floor(battleResult.defenderCasualties * 0.1);
            
            // 添加通知
            game.notifications.push({
                type: 'BATTLE_RESULT',
                message: `${targetNation.name} 成功抵御了 ${this.name} 的进攻！`,
                year: game.year
            });
        }
        
        // 更新总伤亡
        this.casualties += battleResult.attackerCasualties;
        targetNation.casualties += battleResult.defenderCasualties;
        
        // 更新战争记录
        const war = game.warfare.activeWars.find(
            w => (w.aggressor === this.id && w.defender === targetNationId) || 
                 (w.aggressor === targetNationId && w.defender === this.id)
        );
        
        if (war) {
            war.battles.push(battleResult);
            war.casualties[this.id] = (war.casualties[this.id] || 0) + battleResult.attackerCasualties;
            war.casualties[targetNationId] = (war.casualties[targetNationId] || 0) + battleResult.defenderCasualties;
        }
        
        return battleResult;
    }
}

// 初始化函数
function init() {
    // 获取画布和上下文
    game.map = document.getElementById('map-canvas');
    game.ctx = game.map.getContext('2d');
    
    // 设置画布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化地形
    initializeTerrain();
    
    // 绑定事件
    bindEvents();
    
    // 首次渲染
    render();
}

// 调整画布大小
function resizeCanvas() {
    const mapContainer = document.querySelector('.map-container');
    game.map.width = mapContainer.clientWidth;
    game.map.height = mapContainer.clientHeight;
    render();
}

// 初始化地形
function initializeTerrain() {
    // 创建地形网格
    const cols = Math.ceil(game.mapWidth / game.gridSize);
    const rows = Math.ceil(game.mapHeight / game.gridSize);
    
    // 使用柏林噪声生成自然地形
    const noise = generateSimpleNoise(cols, rows);
    
    for (let y = 0; y < rows; y++) {
        game.terrainGrid[y] = [];
        for (let x = 0; x < cols; x++) {
            const noiseValue = noise[y][x];
            let terrainType;
            
            if (noiseValue < 0.3) {
                terrainType = 'WATER';
            } else if (noiseValue < 0.5) {
                terrainType = 'PLAINS';
            } else if (noiseValue < 0.7) {
                terrainType = 'FOREST';
            } else if (noiseValue < 0.85) {
                terrainType = 'MOUNTAINS';
            } else {
                terrainType = 'DESERT';
            }
            
            game.terrainGrid[y][x] = terrainType;
        }
    }
}

// 简单噪声生成函数（替代柏林噪声）
function generateSimpleNoise(width, height) {
    const noise = [];
    
    // 初始化随机值
    for (let y = 0; y < height; y++) {
        noise[y] = [];
        for (let x = 0; x < width; x++) {
            noise[y][x] = Math.random();
        }
    }
    
    // 平滑处理
    const smoothNoise = [];
    for (let y = 0; y < height; y++) {
        smoothNoise[y] = [];
        for (let x = 0; x < width; x++) {
            // 获取周围点的平均值
            let sum = 0;
            let count = 0;
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        sum += noise[ny][nx];
                        count++;
                    }
                }
            }
            
            smoothNoise[y][x] = sum / count;
        }
    }
    
    return smoothNoise;
}

// 保存游戏
function saveGame() {
    try {
        // 停止模拟
        if (game.isSimulating) {
            stopSimulation();
        }
        
        // 准备保存数据
        const saveData = {
            timestamp: Date.now(),
            date: new Date().toLocaleString(),
            year: game.year,
            nations: game.nations.map(nation => {
                // 深拷贝国家对象
                return JSON.parse(JSON.stringify(nation));
            }),
            diplomacy: JSON.parse(JSON.stringify(game.diplomacy)),
            warfare: JSON.parse(JSON.stringify(game.warfare)),
            trade: JSON.parse(JSON.stringify(game.trade)),
            terrainGrid: JSON.parse(JSON.stringify(game.terrainGrid)),
            notifications: JSON.parse(JSON.stringify(game.notifications))
        };
        
        // 生成唯一ID
        const saveId = Date.now().toString();
        
        // 保存到localStorage
        localStorage.setItem(`nationalWar_save_${saveId}`, JSON.stringify(saveData));
        
        // 更新保存槽位列表
        updateSaveSlots();
        
        // 显示成功消息
        showNotification('游戏保存成功！', 'success');
        
        return saveId;
    } catch (error) {
        console.error('保存游戏失败:', error);
        showNotification('保存游戏失败，请重试', 'error');
        return null;
    }
}

// 加载游戏
function loadGame(saveId) {
    try {
        // 停止模拟
        if (game.isSimulating) {
            stopSimulation();
        }
        
        // 从localStorage获取保存数据
        const saveDataStr = localStorage.getItem(`nationalWar_save_${saveId}`);
        if (!saveDataStr) {
            showNotification('找不到保存文件', 'error');
            return false;
        }
        
        // 解析保存数据
        const saveData = JSON.parse(saveDataStr);
        
        // 验证数据完整性
        if (!validateSaveData(saveData)) {
            showNotification('保存文件已损坏', 'error');
            return false;
        }
        
        // 恢复游戏状态
        game.year = saveData.year;
        game.terrainGrid = saveData.terrainGrid;
        game.diplomacy = saveData.diplomacy;
        game.warfare = saveData.warfare;
        game.trade = saveData.trade;
        game.notifications = saveData.notifications;
        
        // 恢复国家对象
        game.nations = [];
        for (const nationData of saveData.nations) {
            // 创建新的国家实例
            const nation = new Nation(
                nationData.name,
                nationData.color,
                nationData.government,
                nationData.economy,
                nationData.population,
                nationData.militaryStrength
            );
            
            // 恢复其他属性
            Object.assign(nation, nationData);
            game.nations.push(nation);
        }
        
        // 清除当前选中的国家
        game.selectedNation = null;
        
        // 更新显示
        updateWorldStats();
        updateNationInfo(null);
        render();
        
        // 更新当前保存槽位
        game.currentSaveSlot = saveId;
        
        // 显示成功消息
        showNotification(`游戏加载成功！当前年份: ${game.year}`, 'success');
        
        return true;
    } catch (error) {
        console.error('加载游戏失败:', error);
        showNotification('加载游戏失败，请重试', 'error');
        return false;
    }
}

// 验证保存数据
function validateSaveData(data) {
    // 检查必要的字段是否存在
    const requiredFields = ['year', 'nations', 'diplomacy', 'warfare', 'trade', 'terrainGrid'];
    return requiredFields.every(field => data.hasOwnProperty(field));
}

// 更新保存槽位列表
function updateSaveSlots() {
    game.saveSlots = [];
    
    // 遍历localStorage查找保存文件
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nationalWar_save_')) {
            try {
                const saveId = key.replace('nationalWar_save_', '');
                const saveData = JSON.parse(localStorage.getItem(key));
                game.saveSlots.push({
                    id: saveId,
                    date: saveData.date,
                    year: saveData.year,
                    nationCount: saveData.nations.length
                });
            } catch (error) {
                console.warn('无效的保存文件:', key);
            }
        }
    }
    
    // 按时间降序排序
    game.saveSlots.sort((a, b) => b.id - a.id);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 设置样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: 'white',
        fontWeight: 'bold',
        zIndex: '1000',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        backgroundColor: type === 'success' ? '#2ecc71' : 
                         type === 'error' ? '#e74c3c' : '#3498db'
    });
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 创建保存/加载模态框
function createSaveLoadModal() {
    // 检查是否已存在
    if (document.getElementById('save-load-modal')) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'save-load-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-tabs">
                <button id="save-tab" class="tab-btn active">保存游戏</button>
                <button id="load-tab" class="tab-btn">加载游戏</button>
            </div>
            <div id="save-content" class="tab-content active">
                <p>点击保存按钮即可保存当前游戏状态。</p>
                <div class="save-info">
                    <p><strong>当前年份:</strong> <span id="current-save-year">2023</span></p>
                    <p><strong>国家数量:</strong> <span id="current-save-nations">0</span></p>
                    <p><strong>保存时间:</strong> <span id="current-save-time">${new Date().toLocaleString()}</span></p>
                </div>
                <button id="confirm-save" class="btn-primary">保存</button>
            </div>
            <div id="load-content" class="tab-content">
                <p>选择要加载的游戏存档:</p>
                <div id="save-slots-list" class="save-slots-list">
                    <!-- 保存槽位将在这里动态生成 -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 设置样式
    const style = document.createElement('style');
    style.textContent = `
        .modal-tabs {
            display: flex;
            margin-bottom: 20px;
        }
        .tab-btn {
            padding: 10px 20px;
            background: #f0f0f0;
            border: none;
            cursor: pointer;
            transition: background 0.3s;
        }
        .tab-btn.active {
            background: #3498db;
            color: white;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .save-info {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .save-slots-list {
            max-height: 300px;
            overflow-y: auto;
        }
        .save-slot {
            background: #f9f9f9;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .save-slot-info {
            flex: 1;
        }
        .save-slot-actions {
            margin-left: 15px;
        }
        .btn-primary {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .btn-primary:hover {
            background: #2980b9;
        }
        .btn-danger {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .btn-danger:hover {
            background: #c0392b;
        }
    `;
    document.head.appendChild(style);
    
    // 绑定事件
    document.querySelector('#save-load-modal .close').addEventListener('click', hideSaveLoadModal);
    
    // 标签切换
    document.getElementById('save-tab').addEventListener('click', () => {
        switchTab('save');
    });
    
    document.getElementById('load-tab').addEventListener('click', () => {
        switchTab('load');
        updateSaveSlotsList();
    });
    
    // 保存按钮
    document.getElementById('confirm-save').addEventListener('click', () => {
        saveGame();
        hideSaveLoadModal();
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideSaveLoadModal();
        }
    });
}

// 切换标签
function switchTab(tabName) {
    // 更新标签按钮
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // 更新内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    // 如果是保存标签，更新保存信息
    if (tabName === 'save') {
        document.getElementById('current-save-year').textContent = game.year;
        document.getElementById('current-save-nations').textContent = game.nations.length;
        document.getElementById('current-save-time').textContent = new Date().toLocaleString();
    }
}

// 更新保存槽位列表
function updateSaveSlotsList() {
    const listElement = document.getElementById('save-slots-list');
    listElement.innerHTML = '';
    
    // 更新保存槽位
    updateSaveSlots();
    
    if (game.saveSlots.length === 0) {
        listElement.innerHTML = '<p class="no-saves">没有找到保存文件</p>';
        return;
    }
    
    // 创建保存槽位元素
    for (const slot of game.saveSlots) {
        const slotElement = document.createElement('div');
        slotElement.className = 'save-slot';
        
        slotElement.innerHTML = `
            <div class="save-slot-info">
                <p><strong>年份:</strong> ${slot.year}</p>
                <p><strong>国家数量:</strong> ${slot.nationCount}</p>
                <p><small>保存时间: ${slot.date}</small></p>
            </div>
            <div class="save-slot-actions">
                <button class="btn-primary load-btn" data-id="${slot.id}">加载</button>
                <button class="btn-danger delete-btn" data-id="${slot.id}">删除</button>
            </div>
        `;
        
        listElement.appendChild(slotElement);
    }
    
    // 绑定加载按钮事件
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const saveId = btn.getAttribute('data-id');
            if (confirm('确定要加载这个存档吗？当前未保存的进度将会丢失。')) {
                if (loadGame(saveId)) {
                    hideSaveLoadModal();
                }
            }
        });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const saveId = btn.getAttribute('data-id');
            if (confirm('确定要删除这个存档吗？此操作无法撤销。')) {
                deleteSave(saveId);
                updateSaveSlotsList();
            }
        });
    });
}

// 删除存档
function deleteSave(saveId) {
    try {
        localStorage.removeItem(`nationalWar_save_${saveId}`);
        showNotification('存档已删除', 'info');
    } catch (error) {
        console.error('删除存档失败:', error);
        showNotification('删除存档失败', 'error');
    }
}

// 显示保存/加载模态框
function showSaveLoadModal() {
    createSaveLoadModal();
    document.getElementById('save-load-modal').style.display = 'block';
    switchTab('save');
}

// 隐藏保存/加载模态框
function hideSaveLoadModal() {
    const modal = document.getElementById('save-load-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 绑定事件
function bindEvents() {
    // 地图拖动和缩放
    game.map.addEventListener('mousedown', startDrag);
    game.map.addEventListener('mousemove', drag);
    game.map.addEventListener('mouseup', endDrag);
    game.map.addEventListener('wheel', zoom);
    
    // 地图点击
    game.map.addEventListener('click', handleMapClick);
    
    // 按钮事件
    const bindButton = (id, handler) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', handler);
        } else {
            console.error(`Button with id ${id} not found`);
        }
    };
    
    bindButton('create-nation', showNationModal);
    bindButton('edit-map', toggleEditMode);
    bindButton('simulate', startSimulation);
    bindButton('stop-simulation', stopSimulation);
    bindButton('save-game', showSaveLoadModal);
    bindButton('load-game', () => {
        showSaveLoadModal();
        switchTab('load');
        updateSaveSlotsList();
    });
    bindButton('zoom-in', () => zoomMap(1.2));
    bindButton('zoom-out', () => zoomMap(0.8));
    bindButton('diplomacy-overview', () => {
        if (game.selectedNation) {
            showDiplomacyPanel(game.selectedNation);
        } else {
            alert('请先选择一个国家');
        }
    });
    bindButton('trade-overview', () => {
        if (game.selectedNation) {
            showTradePanel(game.selectedNation);
        } else {
            alert('请先选择一个国家');
        }
    });
    bindButton('war-overview', () => {
        if (game.selectedNation) {
            showWarPanel(game.selectedNation);
        } else {
            alert('请先选择一个国家');
        }
    });
    
    // 模态框事件
    document.querySelector('.close').addEventListener('click', hideNationModal);
    document.getElementById('nation-form').addEventListener('submit', createNation);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('nation-modal');
        if (e.target === modal) {
            hideNationModal();
        }
    });
}

// 开始拖动
function startDrag(e) {
    game.isDragging = true;
    game.lastMouseX = e.clientX;
    game.lastMouseY = e.clientY;
    game.map.style.cursor = 'grabbing';
}

// 拖动
function drag(e) {
    if (!game.isDragging) return;
    
    const dx = e.clientX - game.lastMouseX;
    const dy = e.clientY - game.lastMouseY;
    
    game.viewportX -= dx / game.scale;
    game.viewportY -= dy / game.scale;
    
    // 限制视口范围
    game.viewportX = Math.max(0, Math.min(game.viewportX, game.mapWidth - game.map.width / game.scale));
    game.viewportY = Math.max(0, Math.min(game.viewportY, game.mapHeight - game.map.height / game.scale));
    
    game.lastMouseX = e.clientX;
    game.lastMouseY = e.clientY;
    
    render();
}

// 结束拖动
function endDrag() {
    game.isDragging = false;
    game.map.style.cursor = 'grab';
}

// 缩放
function zoom(e) {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    zoomMap(zoomFactor, e.clientX, e.clientY);
}

// 缩放地图
function zoomMap(factor, x, y) {
    const oldScale = game.scale;
    
    // 更新缩放比例
    game.scale *= factor;
    game.scale = Math.max(0.5, Math.min(game.scale, 5)); // 限制缩放范围
    
    // 如果提供了鼠标坐标，则以鼠标位置为中心缩放
    if (x !== undefined && y !== undefined) {
        const mouseXBeforeZoom = game.viewportX + x / oldScale;
        const mouseYBeforeZoom = game.viewportY + y / oldScale;
        
        game.viewportX = mouseXBeforeZoom - x / game.scale;
        game.viewportY = mouseYBeforeZoom - y / game.scale;
    }
    
    // 限制视口范围
    game.viewportX = Math.max(0, Math.min(game.viewportX, game.mapWidth - game.map.width / game.scale));
    game.viewportY = Math.max(0, Math.min(game.viewportY, game.mapHeight - game.map.height / game.scale));
    
    render();
}

// 处理地图点击
function handleMapClick(e) {
    // 计算点击在地图上的实际坐标
    const rect = game.map.getBoundingClientRect();
    const x = (e.clientX - rect.left) / game.scale + game.viewportX;
    const y = (e.clientY - rect.top) / game.scale + game.viewportY;
    
    // 检查是否点击了某个国家的领土
    for (const nation of game.nations) {
        for (const territory of nation.territories) {
            const dx = territory.x - x;
            const dy = territory.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < game.gridSize) {
                selectNation(nation);
                return;
            }
        }
    }
    
    // 如果在编辑模式下，为选中的国家添加领土
    if (game.editMode && game.selectedNation) {
        // 将坐标转换为网格坐标
        const gridX = Math.floor(x / game.gridSize);
        const gridY = Math.floor(y / game.gridSize);
        
        // 检查该网格是否已被占领
        let isOccupied = false;
        for (const nation of game.nations) {
            for (const territory of nation.territories) {
                const tGridX = Math.floor(territory.x / game.gridSize);
                const tGridY = Math.floor(territory.y / game.gridSize);
                
                if (tGridX === gridX && tGridY === gridY) {
                    isOccupied = true;
                    break;
                }
            }
            if (isOccupied) break;
        }
        
        // 如果未被占领，添加领土
        if (!isOccupied) {
            game.selectedNation.addTerritory(gridX * game.gridSize, gridY * game.gridSize);
            render();
            updateNationInfo(game.selectedNation);
        }
    }
}

// 显示国家创建模态框
function showNationModal() {
    document.getElementById('nation-modal').style.display = 'block';
}

// 隐藏国家创建模态框
function hideNationModal() {
    document.getElementById('nation-modal').style.display = 'none';
}

// 切换编辑模式
function toggleEditMode() {
    game.editMode = !game.editMode;
    const button = document.getElementById('edit-map');
    button.textContent = game.editMode ? '退出编辑' : '编辑地图';
    button.style.backgroundColor = game.editMode ? '#e74c3c' : '#3498db';
}

// 创建国家
function createNation(e) {
    e.preventDefault();
    
    const name = document.getElementById('nation-name').value;
    const color = document.getElementById('nation-color').value;
    const government = document.getElementById('government-type').value;
    const economy = document.getElementById('economy-type').value;
    const population = parseFloat(document.getElementById('initial-population').value);
    const militaryStrength = parseInt(document.getElementById('military-strength').value);
    
    const nation = new Nation(name, color, government, economy, population, militaryStrength);
    game.nations.push(nation);
    
    // 自动选择新创建的国家
    selectNation(nation);
    
    // 更新世界统计
    updateWorldStats();
    
    // 隐藏模态框
    hideNationModal();
    
    // 自动进入编辑模式
    if (!game.editMode) {
        toggleEditMode();
    }
}

// 选择国家
function selectNation(nation) {
    game.selectedNation = nation;
    updateNationInfo(nation);
}

// 更新国家信息显示
function updateNationInfo(nation) {
    const infoElement = document.getElementById('selected-nation-info');
    
    if (!nation) {
        infoElement.innerHTML = '<p>未选择国家</p>';
        return;
    }
    
    const power = nation.calculatePower().toFixed(1);
    
    // 计算军事单位总数
    const totalMilitaryUnits = nation.militaryUnits.infantry + 
                              nation.militaryUnits.cavalry + 
                              nation.militaryUnits.artillery;
    
    // 获取外交状态
    let diplomaticStatus = '';
    if (nation.atWar) {
        diplomaticStatus = `<span style="color: #e74c3c;">战争中</span>`;
    } else if (Object.values(nation.treaties).includes('ALLIANCE')) {
        diplomaticStatus = `<span style="color: #2ecc71;">同盟</span>`;
    } else {
        diplomaticStatus = `<span style="color: #95a5a6;">和平</span>`;
    }
    
    // 获取贸易状态
    let tradeStatus = '';
    if (nation.tradeRoutes.length > 0) {
        if (nation.tradeSurplus > 0) {
            tradeStatus = `<span style="color: #2ecc71;">贸易顺差: ${nation.tradeSurplus.toFixed(1)}</span>`;
        } else if (nation.tradeDeficit > 0) {
            tradeStatus = `<span style="color: #e74c3c;">贸易逆差: ${nation.tradeDeficit.toFixed(1)}</span>`;
        } else {
            tradeStatus = `<span style="color: #95a5a6;">贸易平衡</span>`;
        }
    } else {
        tradeStatus = `<span style="color: #95a5a6;">无贸易</span>`;
    }
    
    infoElement.innerHTML = `
        <h3 style="color: ${nation.color}">${nation.name}</h3>
        <p>人口: ${nation.population.toFixed(1)} 百万</p>
        <p>政府: ${getGovernmentName(nation.government)}</p>
        <p>经济: ${getEconomyName(nation.economy)}</p>
        <p>军事实力: ${nation.militaryStrength}/10</p>
        <p>军事单位: ${totalMilitaryUnits} (步兵: ${nation.militaryUnits.infantry}, 骑兵: ${nation.militaryUnits.cavalry}, 炮兵: ${nation.militaryUnits.artillery})</p>
        <p>领土: ${nation.territories.length} 格</p>
        <p>稳定度: ${(nation.stability * 100).toFixed(0)}%</p>
        <p>国力指数: ${power}</p>
        <p>资源:</p>
        <ul>
            <li>食物: ${nation.resources.food.toFixed(0)}</li>
            <li>矿物: ${nation.resources.minerals.toFixed(0)}</li>
            <li>技术: ${nation.resources.technology.toFixed(1)}</li>
            <li>黄金: ${nation.resources.gold.toFixed(0)}</li>
        </ul>
        <p>外交状态: ${diplomaticStatus}</p>
        <p>贸易状态: ${tradeStatus}</p>
        ${nation.atWar ? `<p>战争伤亡: ${nation.casualties}</p>` : ''}
        ${nation.warWith.length > 0 ? `<p>交战国家: ${nation.warWith.map(id => game.nations.find(n => n.id === id)?.name || '未知').join(', ')}</p>` : ''}
    `;
    
    // 添加外交和贸易按钮
    if (game.nations.length > 1) {
        const diplomaticActions = document.createElement('div');
        diplomaticActions.className = 'diplomatic-actions';
        diplomaticActions.innerHTML = `
            <h4>外交行动</h4>
            <button id="diplomacy-btn" class="action-btn">外交</button>
            <button id="trade-btn" class="action-btn">贸易</button>
            ${!nation.atWar ? `<button id="war-btn" class="action-btn war-btn">宣战</button>` : ''}
        `;
        infoElement.appendChild(diplomaticActions);
        
        // 绑定按钮事件
        document.getElementById('diplomacy-btn').addEventListener('click', () => showDiplomacyPanel(nation));
        document.getElementById('trade-btn').addEventListener('click', () => showTradePanel(nation));
        if (!nation.atWar) {
            document.getElementById('war-btn').addEventListener('click', () => showWarPanel(nation));
        }
    }
}

// 获取政府类型名称
function getGovernmentName(type) {
    const names = {
        'monarchy': '君主制',
        'republic': '共和制',
        'dictatorship': '独裁制',
        'democracy': '民主制'
    };
    return names[type] || type;
}

// 获取经济类型名称
function getEconomyName(type) {
    const names = {
        'capitalist': '资本主义',
        'socialist': '社会主义',
        'mixed': '混合经济'
    };
    return names[type] || type;
}

// 更新世界统计
function updateWorldStats() {
    document.getElementById('year').textContent = game.year;
    
    let totalPopulation = 0;
    let totalTerritories = 0;
    let totalWars = game.warfare.activeWars.length;
    let totalTradeRoutes = game.trade.tradeRoutes.length;
    
    for (const nation of game.nations) {
        totalPopulation += nation.population;
        totalTerritories += nation.territories.length;
    }
    
    const statsContent = document.getElementById('world-stats-content');
    statsContent.innerHTML = `
        <p>年份: <span id="year">${game.year}</span></p>
        <p>总人口: <span id="total-population">${totalPopulation.toFixed(1)} 百万</span></p>
        <p>国家数量: <span id="nation-count">${game.nations.length}</span></p>
        <p>已占领领土: ${totalTerritories} 格</p>
        <p>活跃战争: ${totalWars}</p>
        <p>贸易路线: ${totalTradeRoutes}</p>
        <p>市场价格:</p>
        <ul>
            <li>食物: ${game.trade.globalMarket.food.toFixed(2)}</li>
            <li>矿物: ${game.trade.globalMarket.minerals.toFixed(2)}</li>
            <li>技术: ${game.trade.globalMarket.technology.toFixed(2)}</li>
        </ul>
    `;
    
    // 添加通知面板
    if (game.notifications.length > 0) {
        const notificationsDiv = document.createElement('div');
        notificationsDiv.className = 'notifications';
        notificationsDiv.innerHTML = '<h2>最新消息</h2>';
        
        const notificationsList = document.createElement('ul');
        notificationsList.className = 'notifications-list';
        
        // 显示最近5条通知
        for (let i = game.notifications.length - 1; i >= Math.max(0, game.notifications.length - 5); i--) {
            const notification = game.notifications[i];
            const notificationItem = document.createElement('li');
            
            // 根据通知类型设置样式
            let notificationClass = '';
            switch(notification.type) {
                case 'WAR_DECLARATION':
                case 'BATTLE_RESULT':
                    notificationClass = 'war-notification';
                    break;
                case 'DIPLOMATIC_PROPOSAL':
                case 'PEACE_PROPOSAL':
                    notificationClass = 'diplomacy-notification';
                    break;
                case 'TRADE_ESTABLISHED':
                case 'TRADE_CANCELED':
                    notificationClass = 'trade-notification';
                    break;
                case 'NATURAL_DISASTER':
                    notificationClass = 'disaster-notification';
                    break;
                case 'RANDOM_EVENT':
                    notificationClass = 'event-notification';
                    break;
            }
            
            notificationItem.className = notificationClass;
            notificationItem.textContent = `${game.year - notification.year}年前: ${notification.message}`;
            notificationsList.appendChild(notificationItem);
        }
        
        notificationsDiv.appendChild(notificationsList);
        
        // 检查是否已存在通知面板
        const existingNotifications = document.querySelector('.notifications');
        if (existingNotifications) {
            existingNotifications.parentNode.replaceChild(notificationsDiv, existingNotifications);
        } else {
            statsContent.parentNode.appendChild(notificationsDiv);
        }
    }
}

// 开始模拟
function startSimulation() {
    if (game.isSimulating) return;
    
    game.isSimulating = true;
    document.getElementById('simulate').disabled = true;
    document.getElementById('stop-simulation').disabled = false;
    
    // 如果在编辑模式，自动退出
    if (game.editMode) {
        toggleEditMode();
    }
    
    game.simulationInterval = setInterval(() => {
        simulateYear();
    }, game.simulationSpeed);
}

// 停止模拟
function stopSimulation() {
    if (!game.isSimulating) return;
    
    game.isSimulating = false;
    document.getElementById('simulate').disabled = false;
    document.getElementById('stop-simulation').disabled = true;
    
    clearInterval(game.simulationInterval);
}

// 模拟自然灾害
function simulateNaturalDisasters() {
    // 每个国家都有可能遭遇自然灾害
    for (const nation of game.nations) {
        // 跳过没有领土的国家
        if (nation.territories.length === 0) continue;
        
        for (const disasterType of game.naturalDisasters.types) {
            // 检查是否发生灾害
            if (Math.random() < disasterType.probability) {
                // 确定灾害严重程度 (1-2)
                const severity = Math.random() > 0.7 ? 2 : 1;
                
                // 应用灾害效果
                const result = disasterType.effects(nation, severity);
                
                // 限制数值范围
                nation.population = Math.max(0.1, nation.population);
                nation.stability = Math.max(0, Math.min(1, nation.stability));
                for (const resource in nation.resources) {
                    nation.resources[resource] = Math.max(0, nation.resources[resource]);
                }
                
                // 添加通知
                game.notifications.push({
                    type: 'NATURAL_DISASTER',
                    message: `${nation.name} ${result.message}`,
                    year: game.year
                });
                
                // 灾害具有连锁效应，可能引发其他灾害
                if (severity === 2 && Math.random() < 0.3) {
                    // 大地震可能引发火灾或洪水
                    const secondaryDisaster = Math.random() > 0.5 ? 
                        game.naturalDisasters.types.find(d => d.name === '火灾') : 
                        game.naturalDisasters.types.find(d => d.name === '洪水');
                    
                    if (secondaryDisaster) {
                        const secondaryResult = secondaryDisaster.effects(nation, 1);
                        
                        // 再次限制数值范围
                        nation.population = Math.max(0.1, nation.population);
                        nation.stability = Math.max(0, Math.min(1, nation.stability));
                        for (const resource in nation.resources) {
                            nation.resources[resource] = Math.max(0, nation.resources[resource]);
                        }
                        
                        // 添加次生灾害通知
                        game.notifications.push({
                            type: 'NATURAL_DISASTER',
                            message: `${nation.name} 次生灾害: ${secondaryResult.message}`,
                            year: game.year
                        });
                    }
                }
                
                break; // 一个国家每年最多发生一种主要灾害
            }
        }
    }
}

// 模拟随机事件
function simulateRandomEvents() {
    // 每个国家都有可能发生随机事件
    for (const nation of game.nations) {
        // 跳过没有领土的国家
        if (nation.territories.length === 0) continue;
        
        for (const eventType of game.randomEvents.types) {
            // 检查是否发生事件
            if (Math.random() < eventType.probability) {
                // 应用事件效果
                const result = eventType.effects(nation);
                
                // 限制数值范围
                nation.population = Math.max(0.1, nation.population);
                nation.stability = Math.max(0, Math.min(1, nation.stability));
                for (const resource in nation.resources) {
                    nation.resources[resource] = Math.max(0, nation.resources[resource]);
                }
                
                // 添加通知
                game.notifications.push({
                    type: 'RANDOM_EVENT',
                    message: `${nation.name} ${result.message}`,
                    year: game.year
                });
                
                break; // 一个国家每年最多发生一种随机事件
            }
        }
    }
}

// 模拟一年
function simulateYear() {
    // 增加年份
    game.year++;
    
    // 更新每个国家
    for (const nation of game.nations) {
        nation.update();
    }
    
    // 模拟国家间互动
    simulateInteractions();
    
    // 模拟自然灾害
    simulateNaturalDisasters();
    
    // 模拟随机事件
    simulateRandomEvents();
    
    // 更新全球市场价格
    updateGlobalMarket();
    
    // 处理通知
    processNotifications();
    
    // 更新显示
    updateWorldStats();
    if (game.selectedNation) {
        updateNationInfo(game.selectedNation);
    }
    render();
}

// 模拟国家间互动
function simulateInteractions() {
    // 如果国家数量少于2，无法互动
    if (game.nations.length < 2) return;
    
    // 随机选择一个国家作为主动方
    const activeNationIndex = Math.floor(Math.random() * game.nations.length);
    const activeNation = game.nations[activeNationIndex];
    
    // 随机选择另一个国家作为目标
    let targetNationIndex;
    do {
        targetNationIndex = Math.floor(Math.random() * game.nations.length);
    } while (targetNationIndex === activeNationIndex);
    
    const targetNation = game.nations[targetNationIndex];
    
    // 获取当前关系
    const currentRelation = activeNation.relations[targetNation.id] || 0;
    
    // 根据关系决定可能的互动
    if (currentRelation <= -50) {
        // 敌对关系，可能宣战
        if (!activeNation.atWar && !activeNation.warWith.includes(targetNation.id) && Math.random() < 0.1) {
            activeNation.declareWar(targetNation.id);
        }
    } else if (currentRelation >= 50) {
        // 友好关系，可能提议同盟或贸易协定
        if (Math.random() < 0.2) {
            // 提议贸易协定
            const resources = ['food', 'minerals', 'technology'];
            const randomResource = resources[Math.floor(Math.random() * resources.length)];
            const amount = Math.floor(Math.random() * 10) + 1;
            
            activeNation.proposeDiplomaticAction(targetNation, 'TRADE_AGREEMENT', {
                resource: randomResource,
                amount: amount
            });
            
            game.notifications.push({
                type: 'DIPLOMATIC_PROPOSAL',
                message: `${activeNation.name} 向 ${targetNation.name} 提议建立贸易协定！`,
                year: game.year
            });
        } else if (Math.random() < 0.1) {
            // 提议同盟
            activeNation.proposeDiplomaticAction(targetNation, 'ALLIANCE');
            
            game.notifications.push({
                type: 'DIPLOMATIC_PROPOSAL',
                message: `${activeNation.name} 向 ${targetNation.name} 提议建立同盟！`,
                year: game.year
            });
        }
    } else {
        // 中立关系，随机改变关系
        const relationChange = Math.floor(Math.random() * 11) - 5; // -5 到 5
        activeNation.setRelation(targetNation.id, Math.max(-100, Math.min(100, currentRelation + relationChange)));
    }
    
    // 处理战争中的国家
    for (const war of game.warfare.activeWars) {
        const aggressor = game.nations.find(n => n.id === war.aggressor);
        const defender = game.nations.find(n => n.id === war.defender);
        
        if (!aggressor || !defender) continue;
        
        // 随机决定是否发生战斗
        if (Math.random() < 0.3) {
            // 进攻方发起军事行动
            const actionTypes = ['TERRITORY', 'BATTLE', 'RAID'];
            const randomType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
            const commitment = 0.3 + (Math.random() * 0.4); // 30% 到 70% 的投入
            
            aggressor.conductMilitaryAction(defender.id, randomType, commitment);
        }
        
        // 检查是否应该结束战争
        const aggressorPower = aggressor.calculatePower();
        const defenderPower = defender.calculatePower();
        
        // 如果一方实力大幅超过另一方，可能结束战争
        if (aggressorPower > defenderPower * 2 && Math.random() < 0.2) {
            // 进攻方明显占优，防守方可能投降
            defender.endWar(aggressor.id);
            
            game.notifications.push({
                type: 'WAR_SURRENDER',
                message: `${defender.name} 向 ${aggressor.name} 投降！`,
                year: game.year
            });
        } else if (defenderPower > aggressorPower * 2 && Math.random() < 0.2) {
            // 防守方明显占优，进攻方可能撤军
            aggressor.endWar(defender.id);
            
            game.notifications.push({
                type: 'WAR_RETREAT',
                message: `${aggressor.name} 从与 ${defender.name} 的战争中撤退！`,
                year: game.year
            });
        } else if (war.battles.length > 10 && Math.random() < 0.1) {
            // 战争持续时间长，可能和谈
            if (Math.random() < 0.5) {
                aggressor.endWar(defender.id);
            } else {
                defender.endWar(aggressor.id);
            }
            
            game.notifications.push({
                type: 'WAR_PEACE',
                message: `${aggressor.name} 和 ${defender.name} 达成和平协议！`,
                year: game.year
            });
        }
    }
}

// 更新全球市场价格
function updateGlobalMarket() {
    // 基于供需关系调整价格
    const nations = game.nations;
    const totalDemand = {
        food: 0,
        minerals: 0,
        technology: 0
    };
    
    const totalSupply = {
        food: 0,
        minerals: 0,
        technology: 0
    };
    
    // 计算总需求和总供应
    for (const nation of nations) {
        // 简化计算，假设人口决定食物需求
        totalDemand.food += nation.population * 0.3;
        // 假设领土数量决定矿物需求
        totalDemand.minerals += nation.territories.length * 0.2;
        // 假设技术水平决定技术需求
        totalDemand.technology += nation.resources.technology * 0.5;
        
        // 计算供应
        totalSupply.food += nation.territories.length * 0.5;
        totalSupply.minerals += nation.territories.length * 0.3;
        totalSupply.technology += nation.resources.technology * 0.1;
    }
    
    // 调整价格
    for (const resource in game.trade.globalMarket) {
        if (totalDemand[resource] && totalSupply[resource]) {
            const supplyDemandRatio = totalSupply[resource] / totalDemand[resource];
            
            // 供不应求，价格上涨
            if (supplyDemandRatio < 0.8) {
                game.trade.globalMarket[resource] *= (1 + Math.random() * 0.1);
            } 
            // 供过于求，价格下跌
            else if (supplyDemandRatio > 1.2) {
                game.trade.globalMarket[resource] *= (1 - Math.random() * 0.1);
            }
            // 供需平衡，价格小幅波动
            else {
                game.trade.globalMarket[resource] *= (0.95 + Math.random() * 0.1);
            }
            
            // 确保价格在合理范围内
            if (resource === 'technology') {
                game.trade.globalMarket[resource] = Math.max(5, Math.min(20, game.trade.globalMarket[resource]));
            } else {
                game.trade.globalMarket[resource] = Math.max(0.5, Math.min(5, game.trade.globalMarket[resource]));
            }
            
            // 四舍五入到两位小数
            game.trade.globalMarket[resource] = Math.round(game.trade.globalMarket[resource] * 100) / 100;
        }
    }
}

// 处理通知
function processNotifications() {
    // 限制通知数量，只保留最近的20条
    if (game.notifications.length > 20) {
        game.notifications = game.notifications.slice(-20);
    }
}

// 渲染函数
function render() {
    const ctx = game.ctx;
    const width = game.map.width;
    const height = game.map.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 保存当前状态
    ctx.save();
    
    // 应用缩放和平移
    ctx.scale(game.scale, game.scale);
    ctx.translate(-game.viewportX, -game.viewportY);
    
    // 绘制地形
    renderTerrain();
    
    // 绘制国家领土
    renderNations();
    
    // 绘制网格线（可选）
    if (game.showGrid) {
        renderGrid();
    }
    
    // 恢复状态
    ctx.restore();
}

// 渲染地形
function renderTerrain() {
    const ctx = game.ctx;
    const startCol = Math.floor(game.viewportX / game.gridSize);
    const endCol = Math.ceil((game.viewportX + game.map.width / game.scale) / game.gridSize);
    const startRow = Math.floor(game.viewportY / game.gridSize);
    const endRow = Math.ceil((game.viewportY + game.map.height / game.scale) / game.gridSize);
    
    for (let y = startRow; y < endRow; y++) {
        if (y >= game.terrainGrid.length) continue;
        
        for (let x = startCol; x < endCol; x++) {
            if (x >= game.terrainGrid[0].length) continue;
            
            const terrainType = game.terrainGrid[y][x];
            const terrain = game.terrainTypes[terrainType];
            
            ctx.fillStyle = terrain.color;
            ctx.fillRect(x * game.gridSize, y * game.gridSize, game.gridSize, game.gridSize);
        }
    }
}

// 渲染国家领土
function renderNations() {
    const ctx = game.ctx;
    
    for (const nation of game.nations) {
        ctx.fillStyle = nation.color;
        
        for (const territory of nation.territories) {
            // 检查是否在视口内
            if (territory.x + game.gridSize < game.viewportX || 
                territory.x > game.viewportX + game.map.width / game.scale ||
                territory.y + game.gridSize < game.viewportY || 
                territory.y > game.viewportY + game.map.height / game.scale) {
                continue;
            }
            
            ctx.fillRect(territory.x, territory.y, game.gridSize, game.gridSize);
            
            // 绘制边框
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(territory.x, territory.y, game.gridSize, game.gridSize);
        }
    }
    
    // 高亮显示选中的国家
    if (game.selectedNation) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        
        for (const territory of game.selectedNation.territories) {
            // 检查是否在视口内
            if (territory.x + game.gridSize < game.viewportX || 
                territory.x > game.viewportX + game.map.width / game.scale ||
                territory.y + game.gridSize < game.viewportY || 
                territory.y > game.viewportY + game.map.height / game.scale) {
                continue;
            }
            
            ctx.strokeRect(territory.x, territory.y, game.gridSize, game.gridSize);
        }
    }
}

// 渲染网格
function renderGrid() {
    const ctx = game.ctx;
    const startX = Math.floor(game.viewportX / game.gridSize) * game.gridSize;
    const endX = Math.ceil((game.viewportX + game.map.width / game.scale) / game.gridSize) * game.gridSize;
    const startY = Math.floor(game.viewportY / game.gridSize) * game.gridSize;
    const endY = Math.ceil((game.viewportY + game.map.height / game.scale) / game.gridSize) * game.gridSize;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.5;
    
    // 垂直线
    for (let x = startX; x <= endX; x += game.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }
    
    // 水平线
    for (let y = startY; y <= endY; y += game.gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
}

// 页面加载完成后初始化
window.addEventListener('load', init);

// 外交系统界面
function showDiplomacyPanel(nation) {
    // 切换到外交模式
    game.currentMode = 'diplomacy';
    
    // 创建外交面板
    const diplomacyPanel = document.createElement('div');
    diplomacyPanel.className = 'modal';
    diplomacyPanel.id = 'diplomacy-modal';
    diplomacyPanel.style.display = 'block';
    
    let panelContent = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${nation.name} 的外交面板</h2>
            <div class="diplomatic-relations">
                <h3>外交关系</h3>
                <table class="relations-table">
                    <thead>
                        <tr>
                            <th>国家</th>
                            <th>关系</th>
                            <th>条约</th>
                            <th>行动</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // 添加与其他国家的关系
    for (const otherNation of game.nations) {
        if (otherNation.id === nation.id) continue;
        
        const relation = nation.relations[otherNation.id] || 0;
        let relationText = '';
        let relationColor = '';
        
        if (relation >= 80) {
            relationText = '同盟';
            relationColor = '#2ecc71';
        } else if (relation >= 50) {
            relationText = '友好';
            relationColor = '#27ae60';
        } else if (relation >= -30) {
            relationText = '中立';
            relationColor = '#95a5a6';
        } else if (relation >= -80) {
            relationText = '紧张';
            relationColor = '#e67e22';
        } else {
            relationText = '敌对';
            relationColor = '#e74c3c';
        }
        
        // 获取条约状态
        let treatyText = nation.treaties[otherNation.id] || '无';
        if (nation.warWith.includes(otherNation.id)) {
            treatyText = '战争中';
        }
        
        // 可用的外交行动
        let actions = '';
        
        if (!nation.warWith.includes(otherNation.id)) {
            if (relation >= 50 && !nation.treaties[otherNation.id]) {
                actions += `<button class="action-btn alliance-btn" data-nation="${otherNation.id}">提议同盟</button>`;
            }
            
            if (relation >= -30) {
                actions += `<button class="action-btn trade-btn" data-nation="${otherNation.id}">贸易协定</button>`;
            }
            
            if (relation < 0) {
                actions += `<button class="action-btn war-btn" data-nation="${otherNation.id}">宣战</button>`;
            }
        } else {
            actions += `<button class="action-btn peace-btn" data-nation="${otherNation.id}">议和</button>`;
        }
        
        panelContent += `
            <tr>
                <td style="color: ${otherNation.color}">${otherNation.name}</td>
                <td style="color: ${relationColor}">${relationText} (${relation})</td>
                <td>${treatyText}</td>
                <td>${actions}</td>
            </tr>
        `;
    }
    
    panelContent += `
                    </tbody>
                </table>
            </div>
            <div class="diplomatic-history">
                <h3>外交历史</h3>
                <ul class="history-list">
    `;
    
    // 添加外交历史
    const relevantTreaties = game.diplomacy.treaties.filter(
        t => t.from === nation.id || t.to === nation.id
    ).sort((a, b) => b.proposedAt - a.proposedAt);
    
    for (const treaty of relevantTreaties.slice(0, 10)) {
        const fromNation = game.nations.find(n => n.id === treaty.from);
        const toNation = game.nations.find(n => n.id === treaty.to);
        
        if (!fromNation || !toNation) continue;
        
        let actionText = '';
        switch(treaty.type) {
            case 'ALLIANCE':
                actionText = '同盟提议';
                break;
            case 'TRADE_AGREEMENT':
                actionText = '贸易协定';
                break;
            case 'PEACE_TREATY':
                actionText = '和平协议';
                break;
            case 'WAR_DECLARATION':
                actionText = '宣战';
                break;
        }
        
        let statusText = '';
        switch(treaty.status) {
            case 'pending':
                statusText = '<span style="color: #f39c12;">待处理</span>';
                break;
            case 'accepted':
                statusText = '<span style="color: #2ecc71;">已接受</span>';
                break;
            case 'rejected':
                statusText = '<span style="color: #e74c3c;">已拒绝</span>';
                break;
        }
        
        panelContent += `
            <li>
                ${game.year - treaty.proposedAt}年前: ${fromNation.name} 向 ${toNation.name} 提出${actionText} - ${statusText}
            </li>
        `;
    }
    
    panelContent += `
                </ul>
            </div>
        </div>
    `;
    
    diplomacyPanel.innerHTML = panelContent;
    document.body.appendChild(diplomacyPanel);
    
    // 绑定关闭按钮
    diplomacyPanel.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(diplomacyPanel);
        game.currentMode = 'normal';
    });
    
    // 绑定外交行动按钮
    diplomacyPanel.querySelectorAll('.alliance-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = parseInt(btn.dataset.nation);
            const targetNation = game.nations.find(n => n.id === targetId);
            if (targetNation) {
                nation.proposeDiplomaticAction(targetNation, 'ALLIANCE');
                document.body.removeChild(diplomacyPanel);
                game.currentMode = 'normal';
                
                game.notifications.push({
                    type: 'DIPLOMATIC_PROPOSAL',
                    message: `${nation.name} 向 ${targetNation.name} 提议建立同盟！`,
                    year: game.year
                });
            }
        });
    });
    
    diplomacyPanel.querySelectorAll('.trade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = parseInt(btn.dataset.nation);
            showTradeAgreementPanel(nation, targetId);
            document.body.removeChild(diplomacyPanel);
        });
    });
    
    diplomacyPanel.querySelectorAll('.war-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = parseInt(btn.dataset.nation);
            const targetNation = game.nations.find(n => n.id === targetId);
            if (targetNation && confirm(`确定要向 ${targetNation.name} 宣战吗？`)) {
                nation.declareWar(targetId);
                document.body.removeChild(diplomacyPanel);
                game.currentMode = 'normal';
            }
        });
    });
    
    diplomacyPanel.querySelectorAll('.peace-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = parseInt(btn.dataset.nation);
            const targetNation = game.nations.find(n => n.id === targetId);
            if (targetNation) {
                nation.proposeDiplomaticAction(targetNation, 'PEACE_TREATY');
                document.body.removeChild(diplomacyPanel);
                game.currentMode = 'normal';
                
                game.notifications.push({
                    type: 'PEACE_PROPOSAL',
                    message: `${nation.name} 向 ${targetNation.name} 提议和平！`,
                    year: game.year
                });
            }
        });
    });
}

// 贸易协定面板
function showTradeAgreementPanel(nation, targetId) {
    const targetNation = game.nations.find(n => n.id === targetId);
    if (!targetNation) return;
    
    // 切换到贸易模式
    game.currentMode = 'trade';
    
    // 创建贸易面板
    const tradePanel = document.createElement('div');
    tradePanel.className = 'modal';
    tradePanel.id = 'trade-modal';
    tradePanel.style.display = 'block';
    
    tradePanel.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>与 ${targetNation.name} 建立贸易协定</h2>
            <form id="trade-form">
                <div class="form-group">
                    <label for="trade-resource">资源类型:</label>
                    <select id="trade-resource">
                        <option value="food">食物</option>
                        <option value="minerals">矿物</option>
                        <option value="technology">技术</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="trade-direction">贸易方向:</label>
                    <select id="trade-direction">
                        <option value="import">进口</option>
                        <option value="export">出口</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="trade-amount">数量:</label>
                    <input type="number" id="trade-amount" min="1" max="50" value="5">
                </div>
                <div class="market-info">
                    <h3>市场价格</h3>
                    <p>食物: ${game.trade.globalMarket.food.toFixed(2)}</p>
                    <p>矿物: ${game.trade.globalMarket.minerals.toFixed(2)}</p>
                    <p>技术: ${game.trade.globalMarket.technology.toFixed(2)}</p>
                </div>
                <button type="submit">提议贸易</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(tradePanel);
    
    // 绑定关闭按钮
    tradePanel.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(tradePanel);
        game.currentMode = 'normal';
    });
    
    // 绑定表单提交
    document.getElementById('trade-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const resource = document.getElementById('trade-resource').value;
        const direction = document.getElementById('trade-direction').value;
        let amount = parseInt(document.getElementById('trade-amount').value);
        
        // 如果是出口，将数量设为负数
        if (direction === 'export') {
            amount = -amount;
        }
        
        // 创建贸易协定
        nation.proposeDiplomaticAction(targetNation, 'TRADE_AGREEMENT', {
            resource: resource,
            amount: amount
        });
        
        // 自动接受（简化处理）
        targetNation.acceptDiplomaticAction(
            game.diplomacy.treaties[game.diplomacy.treaties.length - 1].id
        );
        
        game.notifications.push({
            type: 'TRADE_ESTABLISHED',
            message: `${nation.name} 与 ${targetNation.name} 建立了贸易协定！`,
            year: game.year
        });
        
        document.body.removeChild(tradePanel);
        game.currentMode = 'normal';
    });
}

// 贸易面板
function showTradePanel(nation) {
    // 切换到贸易模式
    game.currentMode = 'trade';
    
    // 创建贸易面板
    const tradePanel = document.createElement('div');
    tradePanel.className = 'modal';
    tradePanel.id = 'trade-panel-modal';
    tradePanel.style.display = 'block';
    
    let panelContent = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${nation.name} 的贸易面板</h2>
            <div class="trade-info">
                <h3>贸易路线</h3>
                <table class="trade-table">
                    <thead>
                        <tr>
                            <th>贸易伙伴</th>
                            <th>资源</th>
                            <th>数量</th>
                            <th>价格</th>
                            <th>总价值</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // 添加贸易路线
    for (const route of nation.tradeRoutes) {
        const partner = game.nations.find(n => n.id === route.partner);
        if (!partner) continue;
        
        const direction = route.amount > 0 ? '进口' : '出口';
        const directionColor = route.amount > 0 ? '#e74c3c' : '#2ecc71';
        const totalValue = Math.abs(route.amount) * route.price;
        
        panelContent += `
            <tr>
                <td style="color: ${partner.color}">${partner.name}</td>
                <td>${getResourceName(route.resource)}</td>
                <td style="color: ${directionColor}">${direction} ${Math.abs(route.amount)}</td>
                <td>${route.price.toFixed(2)}</td>
                <td>${totalValue.toFixed(2)}</td>
                <td><button class="cancel-trade-btn" data-route="${route.id}">取消</button></td>
            </tr>
        `;
    }
    
    panelContent += `
                    </tbody>
                </table>
            </div>
            <div class="market-info">
                <h3>全球市场价格</h3>
                <p>食物: ${game.trade.globalMarket.food.toFixed(2)}</p>
                <p>矿物: ${game.trade.globalMarket.minerals.toFixed(2)}</p>
                <p>技术: ${game.trade.globalMarket.technology.toFixed(2)}</p>
            </div>
            <div class="trade-stats">
                <h3>贸易统计</h3>
                <p>贸易路线数量: ${nation.tradeRoutes.length}</p>
                <p>贸易顺差: ${nation.tradeSurplus.toFixed(2)}</p>
                <p>贸易逆差: ${nation.tradeDeficit.toFixed(2)}</p>
                <p>经济增长率: ${(nation.economicGrowth * 100).toFixed(2)}%</p>
            </div>
            <button id="new-trade-btn">新建贸易路线</button>
        </div>
    `;
    
    tradePanel.innerHTML = panelContent;
    document.body.appendChild(tradePanel);
    
    // 绑定关闭按钮
    tradePanel.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(tradePanel);
        game.currentMode = 'normal';
    });
    
    // 绑定取消贸易按钮
    tradePanel.querySelectorAll('.cancel-trade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const routeId = parseInt(btn.dataset.route);
            nation.cancelTradeRoute(routeId);
            document.body.removeChild(tradePanel);
            showTradePanel(nation); // 重新显示面板
        });
    });
    
    // 绑定新建贸易按钮
    document.getElementById('new-trade-btn').addEventListener('click', () => {
        document.body.removeChild(tradePanel);
        showNewTradePanel(nation);
    });
}

// 新建贸易面板
function showNewTradePanel(nation) {
    // 创建新贸易面板
    const newTradePanel = document.createElement('div');
    newTradePanel.className = 'modal';
    newTradePanel.id = 'new-trade-modal';
    newTradePanel.style.display = 'block';
    
    let panelContent = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>新建贸易路线</h2>
            <form id="new-trade-form">
                <div class="form-group">
                    <label for="trade-partner">贸易伙伴:</label>
                    <select id="trade-partner" required>
    `;
    
    // 添加可选的贸易伙伴
    for (const otherNation of game.nations) {
        if (otherNation.id === nation.id) continue;
        
        // 只有非敌对国家才能贸易
        if ((nation.relations[otherNation.id] || 0) >= -30) {
            panelContent += `<option value="${otherNation.id}">${otherNation.name}</option>`;
        }
    }
    
    panelContent += `
                    </select>
                </div>
                <div class="form-group">
                    <label for="trade-resource">资源类型:</label>
                    <select id="trade-resource">
                        <option value="food">食物</option>
                        <option value="minerals">矿物</option>
                        <option value="technology">技术</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="trade-direction">贸易方向:</label>
                    <select id="trade-direction">
                        <option value="import">进口</option>
                        <option value="export">出口</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="trade-amount">数量:</label>
                    <input type="number" id="trade-amount" min="1" max="50" value="5">
                </div>
                <div class="market-info">
                    <h3>市场价格</h3>
                    <p>食物: ${game.trade.globalMarket.food.toFixed(2)}</p>
                    <p>矿物: ${game.trade.globalMarket.minerals.toFixed(2)}</p>
                    <p>技术: ${game.trade.globalMarket.technology.toFixed(2)}</p>
                </div>
                <button type="submit">创建贸易路线</button>
            </form>
        </div>
    `;
    
    newTradePanel.innerHTML = panelContent;
    document.body.appendChild(newTradePanel);
    
    // 绑定关闭按钮
    newTradePanel.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(newTradePanel);
        showTradePanel(nation); // 返回贸易面板
    });
    
    // 绑定表单提交
    document.getElementById('new-trade-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const partnerId = parseInt(document.getElementById('trade-partner').value);
        const resource = document.getElementById('trade-resource').value;
        const direction = document.getElementById('trade-direction').value;
        let amount = parseInt(document.getElementById('trade-amount').value);
        
        // 如果是出口，将数量设为负数
        if (direction === 'export') {
            amount = -amount;
        }
        
        const partner = game.nations.find(n => n.id === partnerId);
        if (partner) {
            nation.createTradeRoute(partnerId, resource, amount);
            
            game.notifications.push({
                type: 'TRADE_ESTABLISHED',
                message: `${nation.name} 与 ${partner.name} 建立了贸易路线！`,
                year: game.year
            });
        }
        
        document.body.removeChild(newTradePanel);
        showTradePanel(nation); // 返回贸易面板
    });
}

// 战争面板
function showWarPanel(nation) {
    // 切换到战争模式
    game.currentMode = 'war';
    
    // 创建战争面板
    const warPanel = document.createElement('div');
    warPanel.className = 'modal';
    warPanel.id = 'war-panel-modal';
    warPanel.style.display = 'block';
    
    let panelContent = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>宣战</h2>
            <p>选择要向哪个国家宣战：</p>
            <div class="nation-list">
    `;
    
    // 添加可宣战的国家
    for (const otherNation of game.nations) {
        if (otherNation.id === nation.id) continue;
        
        // 已经在战争中的国家不能再宣战
        if (!nation.warWith.includes(otherNation.id)) {
            panelContent += `
                <div class="nation-item">
                    <span style="color: ${otherNation.color}">${otherNation.name}</span>
                    <button class="declare-war-btn" data-nation="${otherNation.id}">宣战</button>
                </div>
            `;
        }
    }
    
    panelContent += `
            </div>
        </div>
    `;
    
    warPanel.innerHTML = panelContent;
    document.body.appendChild(warPanel);
    
    // 绑定关闭按钮
    warPanel.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(warPanel);
        game.currentMode = 'normal';
    });
    
    // 绑定宣战按钮
    warPanel.querySelectorAll('.declare-war-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = parseInt(btn.dataset.nation);
            const targetNation = game.nations.find(n => n.id === targetId);
            
            if (targetNation && confirm(`确定要向 ${targetNation.name} 宣战吗？`)) {
                nation.declareWar(targetId);
                document.body.removeChild(warPanel);
                game.currentMode = 'normal';
                updateNationInfo(nation);
            }
        });
    });
}

// 获取资源名称
function getResourceName(resource) {
    const names = {
        'food': '食物',
        'minerals': '矿物',
        'technology': '技术'
    };
    return names[resource] || resource;
}

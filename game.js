const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// 设置画布大小
canvas.width = 500;
canvas.height = 700;

// 游戏配置
const GAME_CONFIG = {
    // 玩家设置
    MOVE_SPEED: 4,           // 降低移动速度
    JUMP_POWER: 12,         // 降低跳跃力度
    GRAVITY: 0.35,          // 降低重力
    PLAYER_SIZE: 30,        // 玩家大小
    
    // 平台设置
    PLATFORM_WIDTH: 80,
    PLATFORM_HEIGHT: 15,
    PLATFORM_GAP: 110,      // 减小平台间距
    MIN_PLATFORM_Y: 100,
    
    // 游戏设置
    CAMERA_OFFSET: 350,
    PLATFORM_COUNT: 6,
    
    // 金币设置
    COIN_SIZE: 15,          // 金币大小
    COIN_SPAWN_RATE: 0.5    // 金币生成概率
};

// 添加游戏状态常量
const GAME_STATES = {
    MENU: 'menu',
    GAME: 'game',
    SHOP: 'shop'
};

// 扩展游戏状态
const gameState = {
    score: 0,
    coins: 0,
    highScore: 0,
    currentSkin: 'default',
    currentState: GAME_STATES.MENU,
    availableSkins: {
        'default': {
            name: '红色妖姬',
            color: '#FF6B6B',
            shape: 'square',
            price: 0,
            owned: true
        },
        'circle': {
            name: '藍色法师',
            color: '#4A90E2',
            shape: 'circle',
            price: 100,
            owned: false
        },
        'triangle': {
            name: '綠色小帽',
            color: '#2ECC71',
            shape: 'triangle',
            price: 150,
            owned: false
        },
        'star': {
            name: '金色钱钱',
            color: '#F1C40F',
            shape: 'star',
            price: 200,
            owned: false
        },
        'heart': {
            name: '粉色爱你',
            color: '#E91E63',
            shape: 'heart',
            price: 250,
            owned: false
        }
    }
};

// DOM 元素
const mainMenu = document.getElementById('mainMenu');
const shopMenu = document.getElementById('shopMenu');
const gameUI = document.getElementById('gameUI');
const totalCoinsDisplay = document.getElementById('totalCoins');
const skinContainer = document.getElementById('skinContainer');
const returnButton = document.getElementById('returnButton');
const highScoreDisplay = document.getElementById('highScore');
const restartButton = document.getElementById('restartButton');

// 玩家对象
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: GAME_CONFIG.PLAYER_SIZE,
    height: GAME_CONFIG.PLAYER_SIZE,
    speedX: 0,
    speedY: 0,
    isJumping: false,
    moveLeft: false,
    moveRight: false
};

// 平台数组
let platforms = [];

// 添加金币数组
let coins = [];

// 添加背景配置
const BACKGROUNDS = {
    SKY: {
        startHeight: 0,
        endHeight: 5000,
        color: '#87CEEB',
        elements: [
            { type: 'cloud', frequency: 0.4 }
        ]
    },
    SPACE: {
        startHeight: 5000,
        endHeight: Infinity,
        color: '#1a1a3a',
        elements: [
            { type: 'star', frequency: 0.8 }
        ]
    }
};

// 添加背景元素数组
let backgroundElements = [];

// 初始化游戏
function init() {
    // 重置玩家位置
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;
    
    // 清空并创建初始平台
    platforms = [];
    
    // 创建起始平台
    platforms.push({
        x: canvas.width / 2 - GAME_CONFIG.PLATFORM_WIDTH / 2,
        y: canvas.height - 50,
        width: GAME_CONFIG.PLATFORM_WIDTH,
        height: GAME_CONFIG.PLATFORM_HEIGHT
    });

    // 生成初始平台组
    for (let i = 1; i < GAME_CONFIG.PLATFORM_COUNT; i++) {
        createPlatform(i);
    }

    // 重置游戏状态
    gameState.score = 0;
    coins = [];
    updateScore();
}

// 创建新平台
function createPlatform(index) {
    const minX = 50;
    const maxX = canvas.width - GAME_CONFIG.PLATFORM_WIDTH - 50;
    const x = Math.random() * (maxX - minX) + minX;
    const y = canvas.height - (index * GAME_CONFIG.PLATFORM_GAP);
    
    platforms.push({
        x: x,
        y: y,
        width: GAME_CONFIG.PLATFORM_WIDTH,
        height: GAME_CONFIG.PLATFORM_HEIGHT,
        touched: false  // 标记平台是否被踩过
    });

    // 生成金币
    if (Math.random() < GAME_CONFIG.COIN_SPAWN_RATE) {
        coins.push({
            x: x + GAME_CONFIG.PLATFORM_WIDTH / 2,
            y: y - GAME_CONFIG.COIN_SIZE - 10,
            size: GAME_CONFIG.COIN_SIZE,
            collected: false
        });
    }
}

// 更新游戏状态
function update() {
    // 处理左右移动
    if (player.moveLeft) {
        player.speedX = -GAME_CONFIG.MOVE_SPEED;
    } else if (player.moveRight) {
        player.speedX = GAME_CONFIG.MOVE_SPEED;
    } else {
        player.speedX = 0;
    }

    // 更新玩家位置
    player.x += player.speedX;
    player.y += player.speedY;
    player.speedY += GAME_CONFIG.GRAVITY;

    // 边界检查
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    // 平台碰撞检测
    platforms.forEach((platform, index) => {
        if (player.speedY > 0 && // 下落时
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + 10
        ) {
            player.isJumping = false;
            player.y = platform.y - player.height;
            player.speedY = 0;

            // 计分（仅对未踩过的平台计分）
            if (!platform.touched) {
                gameState.score += 10;
                platform.touched = true;
                updateScore();
            }
        }
    });

    // 金币碰撞检测
    coins.forEach(coin => {
        if (!coin.collected &&
            player.x + player.width > coin.x - coin.size &&
            player.x < coin.x + coin.size &&
            player.y + player.height > coin.y - coin.size &&
            player.y < coin.y + coin.size
        ) {
            coin.collected = true;
            if (gameState.currentState === GAME_STATES.GAME) {
                gameState.coins++;  // 只在游戏进行时才增加金币
                updateScore();  // 更新游戏界面显示
                updateCoinsDisplay();  // 更新主菜单显示
            }
        }
    });

    // 相机跟随时同时移动金币
    if (player.y < GAME_CONFIG.CAMERA_OFFSET) {
        const diff = GAME_CONFIG.CAMERA_OFFSET - player.y;
        player.y += diff;
        platforms.forEach(platform => {
            platform.y += diff;
        });
        coins.forEach(coin => {
            coin.y += diff;
        });

        // 清理离开屏幕的对象
        if (platforms[0].y > canvas.height) {
            platforms.shift();
            createPlatform(GAME_CONFIG.PLATFORM_COUNT);
        }
        coins = coins.filter(coin => coin.y < canvas.height + 50);
    }

    // 游戏结束检查
    if (player.y > canvas.height) {
        gameOver();
    }

    // 更新背景元素
    updateBackgroundElements();
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    drawBackground();
    
    // 绘制平台
    platforms.forEach(platform => {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // 绘制金币
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // 绘制玩家
    drawPlayer();
}

// 添加背景绘制函数
function drawBackground() {
    const height = Math.abs(calculateTotalHeight());
    let currentBg;
    
    // 确定当前背景
    if (height < BACKGROUNDS.SKY.endHeight) {
        currentBg = BACKGROUNDS.SKY;
    } else {
        currentBg = BACKGROUNDS.SPACE;
    }

    // 绘制背景颜色
    ctx.fillStyle = currentBg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制背景元素
    backgroundElements.forEach(element => {
        if (element.type === 'cloud') {
            drawCloud(element);
        } else if (element.type === 'star') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// 计算总高度
function calculateTotalHeight() {
    return -(platforms[0].y - canvas.height);
}

// 绘制背景元素
function drawBackgroundElement(element) {
    ctx.save();
    switch(element.type) {
        case 'cloud':
            drawCloud(element);
            break;
        case 'building':
            drawBuilding(element);
            break;
        case 'star':
            drawStar(element.x, element.y, element.size);
            break;
        case 'planet':
            drawPlanet(element);
            break;
    }
    ctx.restore();
}

// 背景元素绘制函数
function drawCloud(cloud) {
    ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
}

function drawBuilding(building) {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(building.x, building.y, building.width, building.height);
    // 添加窗户
    for (let i = 0; i < building.height; i += 30) {
        for (let j = 5; j < building.width - 10; j += 20) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(building.x + j, building.y + i, 10, 20);
        }
    }
}

function drawPlanet(planet) {
    const gradient = ctx.createRadialGradient(
        planet.x, planet.y, 0,
        planet.x, planet.y, planet.size
    );
    gradient.addColorStop(0, planet.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
    ctx.fill();
}

// 更新背景元素
function updateBackgroundElements() {
    const height = Math.abs(calculateTotalHeight());
    
    // 根据高度生成新的背景元素
    if (Math.random() < 0.05) {
        let element;
        if (height < BACKGROUNDS.SKY.endHeight) {
            element = createCloud();
        } else {
            element = createStar();
        }
        if (element) {
            backgroundElements.push(element);
        }
    }

    // 移动和移除背景元素
    backgroundElements = backgroundElements.filter(element => {
        element.y += element.speed;
        return element.y < canvas.height + 100;
    });
}

// 创建背景元素的辅助函数
function createCloud() {
    return {
        type: 'cloud',
        x: Math.random() * canvas.width,
        y: -50,
        size: 30 + Math.random() * 40,
        speed: 0.3 + Math.random() * 0.4,
        opacity: 0.4 + Math.random() * 0.3
    };
}

function createBuilding() {
    return {
        type: 'building',
        x: Math.random() * canvas.width,
        y: -200,
        width: 40 + Math.random() * 60,
        height: 100 + Math.random() * 100,
        speed: 0.5
    };
}

function createStar() {
    return {
        type: 'star',
        x: Math.random() * canvas.width,
        y: -10,
        size: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.3
    };
}

function createPlanet() {
    const colors = ['#FF6B6B', '#4A90E2', '#FFB900', '#9B59B6'];
    return {
        type: 'planet',
        x: Math.random() * canvas.width,
        y: -50,
        size: 20 + Math.random() * 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.3
    };
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !player.isJumping) {
        player.isJumping = true;
        player.speedY = -GAME_CONFIG.JUMP_POWER;
    }
    if (e.code === 'KeyA') player.moveLeft = true;
    if (e.code === 'KeyD') player.moveRight = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA') player.moveLeft = false;
    if (e.code === 'KeyD') player.moveRight = false;
});

// 游戏循环
let isGameRunning = false;

function gameLoop() {
    if (gameState.currentState === GAME_STATES.GAME) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// 启动游戏
init();
gameLoop();

// 修改更新分数显示函数
function updateScore() {
    scoreElement.textContent = `分數：${gameState.score} | 金幣：${gameState.coins}`;  // 同时显示分数和金币
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
}

// 修改更新金币显示函数
function updateCoins() {
    // 游戏界面中的金币显示已经包含在updateScore中
    totalCoinsDisplay.textContent = `金幣: ${gameState.coins}`;  // 只更新主菜单中的金币显示
}

// 游戏结束时
function gameOver() {
    // 只在游戏状态为GAME时才计算和添加金币
    if (gameState.currentState === GAME_STATES.GAME) {
        const earnedCoins = Math.floor(gameState.score/10);
        gameState.coins += earnedCoins;
    }
    
    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
    
    // 更新显示
    updateCoinsDisplay();
    updateHighScore();
    
    // 显示按钮
    returnButton.style.display = 'block';
    restartButton.style.display = 'block';
    
    // 停止游戏循环
    gameState.currentState = GAME_STATES.MENU;
}

// 添加更新最高分显示函数
function updateHighScore() {
    highScoreDisplay.textContent = `最高分：${gameState.highScore}`;
}

// 添加重置游戏函数
function resetGame() {
    // 重置玩家状态
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;
    player.moveLeft = false;
    player.moveRight = false;
    
    // 重置游戏状态
    gameState.score = 0;
    platforms = [];
    coins = [];
    backgroundElements = [];
    
    // 返回主菜单
    showMenu();
    
    // 重新初始化游戏（但不立即开始）
    init();
}

// 修改开始游戏函数
function startGame() {
    mainMenu.style.display = 'none';
    gameUI.style.display = 'block';
    returnButton.style.display = 'none';
    restartButton.style.display = 'none';  // 添加这行
    gameState.currentState = GAME_STATES.GAME;
    
    // 重置游戏状态
    gameState.score = 0;
    updateScore();
    
    // 重新初始化游戏
    init();
    
    // 开始游戏循环
    gameLoop();
}

// 修改游戏循环函数
function gameLoop() {
    if (gameState.currentState === GAME_STATES.GAME) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// 修改showMenu函数
function showMenu() {
    mainMenu.style.display = 'block';
    shopMenu.style.display = 'none';
    gameUI.style.display = 'none';
    returnButton.style.display = 'none';
    restartButton.style.display = 'none';  // 添加这行
    gameState.currentState = GAME_STATES.MENU;
    
    // 更新显示
    updateHighScore();
    updateCoinsDisplay();
}

// 初始化界面
function initializeUI() {
    // 绑定按钮事件
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('shopButton').addEventListener('click', openShop);
    document.getElementById('backButton').addEventListener('click', closeShop);
    returnButton.addEventListener('click', returnToMenu);
    restartButton.addEventListener('click', restartGame);  // 添加重启按钮事件监听
    
    // 初始化显示
    initializeShop();
    updateCoinsDisplay();
    updateHighScore();
    showMenu();
}

// 添加返回主菜单函数
function returnToMenu() {
    // 隐藏按钮
    returnButton.style.display = 'none';
    restartButton.style.display = 'none';
    
    // 保存当前金币数
    const currentCoins = gameState.coins;
    
    // 重置游戏
    resetGame();
    
    // 恢复金币数
    gameState.coins = currentCoins;
    
    // 更新显示
    updateCoinsDisplay();
    updateScore();
}

// 打开商店
function openShop() {
    mainMenu.style.display = 'none';
    shopMenu.style.display = 'block';
    gameState.currentState = GAME_STATES.SHOP;
}

// 关闭商店
function closeShop() {
    shopMenu.style.display = 'none';
    mainMenu.style.display = 'block';
    gameState.currentState = GAME_STATES.MENU;
}

// 初始化商店
function initializeShop() {
    skinContainer.innerHTML = '';
    
    Object.entries(gameState.availableSkins).forEach(([id, skin]) => {
        const skinElement = document.createElement('div');
        skinElement.className = 'skin-item';
        skinElement.innerHTML = `
            <div class="skin-preview" style="background-color: ${skin.color}"></div>
            <div class="skin-info">
                <h3>${skin.name}</h3>
                <p>${skin.owned ? '已擁有' : `價格: ${skin.price} 金幣`}</p>
            </div>
            <button class="skin-button ${skin.owned ? 'equipped' : ''}" 
                    ${skin.owned ? '' : `data-price="${skin.price}"`}>
                ${skin.owned ? (gameState.currentSkin === id ? '已裝備' : '裝備') : '購買'}
            </button>
        `;

        const button = skinElement.querySelector('button');
        button.addEventListener('click', () => handleSkinButton(id, skin));
        
        skinContainer.appendChild(skinElement);
    });
}

// 处理皮肤按钮点击
function handleSkinButton(skinId, skin) {
    if (skin.owned) {
        gameState.currentSkin = skinId;
        initializeShop();
    } else if (gameState.coins >= skin.price) {
        gameState.coins -= skin.price;
        skin.owned = true;
        gameState.currentSkin = skinId;
        updateCoinsDisplay();
        initializeShop();
    } else {
        alert('金幣不足！');
    }
}

// 更新金币显示
function updateCoinsDisplay() {
    totalCoinsDisplay.textContent = `金幣: ${gameState.coins}`;
}

// 修改绘制玩家函数
function drawPlayer() {
    const skin = gameState.availableSkins[gameState.currentSkin];
    ctx.fillStyle = skin.color;
    
    switch(skin.shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(
                player.x + player.width/2,
                player.y + player.height/2,
                player.width/2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            break;
            
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(player.x + player.width/2, player.y);
            ctx.lineTo(player.x + player.width, player.y + player.height);
            ctx.lineTo(player.x, player.y + player.height);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 'star':
            drawStar(
                player.x + player.width/2,
                player.y + player.height/2,
                player.width/2
            );
            break;
            
        case 'heart':
            drawHeart(
                player.x + player.width/2,
                player.y + player.height/2,
                player.width/2
            );
            break;
            
        default: // square
            ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

// 添加重启游戏函数
function restartGame() {
    // 隐藏按钮
    returnButton.style.display = 'none';
    restartButton.style.display = 'none';
    
    // 重置游戏状态（保持当前金币数不变）
    const currentCoins = gameState.coins;
    
    // 重置游戏
    init();
    
    // 恢复金币数
    gameState.coins = currentCoins;
    
    // 更新显示
    updateScore();
    updateCoinsDisplay();
    
    // 设置游戏状态并开始游戏循环
    gameState.currentState = GAME_STATES.GAME;
    gameLoop();
}

// 在页面加载时初始化UI
window.addEventListener('load', initializeUI);

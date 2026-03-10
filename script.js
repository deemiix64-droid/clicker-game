// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    nickname: '',
    balance: 0,
    totalClicks: 0,
    totalEarned: 0,
    autoclickers: 0,
    power: 1,
    casesOpened: 0,
    bestCaseWin: 0,
    daysActive: 1,
    skin: 'red',
    ownedSkins: ['red'],
    title: 'Новичок',
    titles: ['Новичок'],
    lastDaily: null,
    lastGift: null,
    usedCodes: [],
    
    // ===== НОВОЕ: КЛИК-ПАСС =====
    pass: {
        level: 1,
        xp: 0,
        maxXP: 100,
        season: 1,
        claimedRewards: [],
        quests: {
            daily: [],
            weekly: [],
            seasonal: []
        },
        lastQuestReset: Date.now()
    },
    
    settings: {
        notifications: true,
        vibration: true,
        autoSave: true,
        sounds: true
    },
    autoClicker: {
        enabled: false,
        timeLeft: 0,
        maxTime: 120,
        level: 1
    },
    turbo: {
        active: false,
        timeLeft: 0,
        maxTime: 30,
        multiplier: 2
    },
    version: '6.0'
};

// ========== СИСТЕМА КВЕСТОВ ==========
const questTemplates = {
    // Ежедневные квесты
    daily: [
        { id: 'daily_clicks_1', name: 'Кликер-новичок', desc: 'Сделайте 100 кликов', icon: '👆', 
          target: 100, type: 'clicks', reward: 50, xp: 10 },
        { id: 'daily_clicks_2', name: 'Кликер-любитель', desc: 'Сделайте 500 кликов', icon: '✋',
          target: 500, type: 'clicks', reward: 100, xp: 20 },
        { id: 'daily_clicks_3', name: 'Кликер-профи', desc: 'Сделайте 1000 кликов', icon: '👊',
          target: 1000, type: 'clicks', reward: 200, xp: 30 },
        
        { id: 'daily_earn_1', name: 'Заработок', desc: 'Заработайте 1000 монет', icon: '💰',
          target: 1000, type: 'earn', reward: 100, xp: 15 },
        { id: 'daily_earn_2', name: 'Накопитель', desc: 'Заработайте 5000 монет', icon: '💎',
          target: 5000, type: 'earn', reward: 250, xp: 25 },
        
        { id: 'daily_auto_1', name: 'Автоматизация', desc: 'Купите автокликер', icon: '🤖',
          target: 1, type: 'buy_auto', reward: 50, xp: 10 },
        { id: 'daily_auto_2', name: 'Механизатор', desc: 'Купите 3 автокликера', icon: '⚙️',
          target: 3, type: 'buy_auto', reward: 150, xp: 20 },
        
        { id: 'daily_case_1', name: 'Открыватель', desc: 'Откройте кейс', icon: '📦',
          target: 1, type: 'open_case', reward: 50, xp: 10 },
        { id: 'daily_case_2', name: 'Халявщик', desc: 'Откройте 3 кейса', icon: '🎁',
          target: 3, type: 'open_case', reward: 150, xp: 20 },
        
        { id: 'daily_turbo', name: 'Ускоритель', desc: 'Активируйте турбо', icon: '⚡',
          target: 1, type: 'use_turbo', reward: 100, xp: 15 }
    ],
    
    // Еженедельные квесты
    weekly: [
        { id: 'weekly_clicks', name: 'Чемпион кликов', desc: 'Сделайте 10000 кликов', icon: '👑',
          target: 10000, type: 'clicks', reward: 1000, xp: 100 },
        { id: 'weekly_earn', name: 'Миллионер', desc: 'Заработайте 50000 монет', icon: '💵',
          target: 50000, type: 'earn', reward: 2000, xp: 150 },
        { id: 'weekly_auto', name: 'Фабрика', desc: 'Купите 20 автокликеров', icon: '🏭',
          target: 20, type: 'buy_auto', reward: 1500, xp: 120 },
        { id: 'weekly_cases', name: 'Кейс-мастер', desc: 'Откройте 30 кейсов', icon: '🎰',
          target: 30, type: 'open_case', reward: 1500, xp: 120 },
        { id: 'weekly_turbo', name: 'Турбо-режим', desc: 'Активируйте турбо 5 раз', icon: '⚡',
          target: 5, type: 'use_turbo', reward: 1000, xp: 100 }
    ],
    
    // Сезонные квесты
    seasonal: [
        { id: 'season_clicks', name: 'Легенда клика', desc: 'Сделайте 100000 кликов', icon: '👑',
          target: 100000, type: 'clicks', reward: 10000, xp: 500 },
        { id: 'season_earn', name: 'Миллиардер', desc: 'Заработайте 1 миллион монет', icon: '💶',
          target: 1000000, type: 'earn', reward: 20000, xp: 1000 },
        { id: 'season_auto', name: 'Повелитель машин', desc: 'Купите 100 автокликеров', icon: '🤖',
          target: 100, type: 'buy_auto', reward: 15000, xp: 800 },
        { id: 'season_cases', name: 'Король кейсов', desc: 'Откройте 500 кейсов', icon: '👑',
          target: 500, type: 'open_case', reward: 15000, xp: 800 },
        { id: 'season_days', name: 'Ветеран', desc: 'Играйте 30 дней', icon: '📆',
          target: 30, type: 'days', reward: 10000, xp: 500 },
        { id: 'season_title', name: 'Коллекционер', desc: 'Соберите 20 титулов', icon: '🏆',
          target: 20, type: 'titles', reward: 10000, xp: 500 }
    ]
};

// Награды за уровни пасса
const passRewards = [
    { level: 1, reward: '🎁 100 монет', icon: '💰' },
    { level: 2, reward: '⚡ Турбо', icon: '⚡' },
    { level: 3, reward: '🎨 Случайный скин', icon: '🎨' },
    { level: 4, reward: '💰 500 монет', icon: '💰' },
    { level: 5, reward: '🤖 Автокликер', icon: '🤖' },
    { level: 6, reward: '🎁 1000 монет', icon: '💰' },
    { level: 7, reward: '⚡ Турбо x2', icon: '⚡' },
    { level: 8, reward: '🔑 Ключ от кейса', icon: '🔑' },
    { level: 9, reward: '💰 2000 монет', icon: '💰' },
    { level: 10, reward: '👑 Эксклюзивный титул', icon: '👑' }
];

// Инициализация квестов
function initQuests() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Сброс ежедневных квестов
    if (now - gameState.pass.lastQuestReset > dayInMs) {
        gameState.pass.quests.daily = generateQuests('daily', 5);
        gameState.pass.lastQuestReset = now;
    }
    
    // Если нет квестов - создаем
    if (gameState.pass.quests.daily.length === 0) {
        gameState.pass.quests.daily = generateQuests('daily', 5);
    }
    if (gameState.pass.quests.weekly.length === 0) {
        gameState.pass.quests.weekly = generateQuests('weekly', 3);
    }
    if (gameState.pass.quests.seasonal.length === 0) {
        gameState.pass.quests.seasonal = generateQuests('seasonal', 3);
    }
}

// Генерация случайных квестов
function generateQuests(type, count) {
    const templates = questTemplates[type];
    const shuffled = [...templates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    return selected.map(t => ({
        ...t,
        progress: 0,
        completed: false,
        claimed: false
    }));
}

// Обновление прогресса квестов
function updateQuestProgress(questType, progressType, value = 1) {
    let updated = false;
    
    ['daily', 'weekly', 'seasonal'].forEach(type => {
        gameState.pass.quests[type].forEach(quest => {
            if (quest.completed || quest.claimed) return;
            
            if (quest.type === progressType) {
                quest.progress = Math.min(quest.progress + value, quest.target);
                
                if (quest.progress >= quest.target && !quest.completed) {
                    quest.completed = true;
                    showNotif('✅ Квест выполнен!', quest.name, 'success');
                    updated = true;
                }
            }
        });
    });
    
    if (updated) {
        renderQuests('daily');
        saveGame();
    }
}

// Получение награды за квест
function claimQuestReward(type, questId) {
    const quest = gameState.pass.quests[type].find(q => q.id === questId);
    
    if (!quest || !quest.completed || quest.claimed) {
        showNotif('❌ Ошибка', 'Награда уже получена', 'error');
        return;
    }
    
    // Добавляем награду
    gameState.balance += quest.reward;
    gameState.pass.xp += quest.xp;
    
    // Проверяем повышение уровня
    while (gameState.pass.xp >= gameState.pass.maxXP) {
        gameState.pass.xp -= gameState.pass.maxXP;
        gameState.pass.level++;
        gameState.pass.maxXP = Math.floor(gameState.pass.maxXP * 1.2);
        
        showNotif('⬆️ Уровень пасса повышен!', `Уровень ${gameState.pass.level}`, 'warning');
        
        // Выдаем награду за уровень
        const reward = passRewards.find(r => r.level === gameState.pass.level);
        if (reward) {
            grantPassReward(reward);
        }
    }
    
    quest.claimed = true;
    
    showNotif('🎁 Награда получена!', `+${quest.reward}💰, +${quest.xp} XP`, 'success');
    
    renderQuests(type);
    updatePassUI();
    saveGame();
}

// Выдача награды за уровень пасса
function grantPassReward(reward) {
    switch(reward.level) {
        case 1:
            gameState.balance += 100;
            break;
        case 2:
            gameState.turbo.active = true;
            gameState.turbo.timeLeft = gameState.turbo.maxTime;
            break;
        case 3:
            // Случайный скин
            const skins = ['red', 'blue', 'green'];
            const newSkin = skins.find(s => !gameState.ownedSkins.includes(s));
            if (newSkin) {
                gameState.ownedSkins.push(newSkin);
                showNotif('🎨 Новый скин!', `Получен ${newSkin} скин`, 'success');
            }
            break;
        case 4:
            gameState.balance += 500;
            break;
        case 5:
            gameState.autoclickers++;
            break;
        case 6:
            gameState.balance += 1000;
            break;
        case 7:
            gameState.turbo.active = true;
            gameState.turbo.timeLeft = gameState.turbo.maxTime * 2;
            break;
        case 8:
            localStorage.setItem('hasKey', 'true');
            break;
        case 9:
            gameState.balance += 2000;
            break;
        case 10:
            if (!gameState.titles.includes('👑 Ветеран пасса')) {
                gameState.titles.push('👑 Ветеран пасса');
                gameState.title = '👑 Ветеран пасса';
            }
            break;
    }
}

// Отображение квестов
function renderQuests(type = 'daily') {
    const container = document.getElementById('questsContainer');
    if (!container) return;
    
    const quests = gameState.pass.quests[type];
    
    container.innerHTML = quests.map(quest => {
        const progressPercent = (quest.progress / quest.target) * 100;
        const isCompleted = quest.completed;
        const isClaimed = quest.claimed;
        
        let buttonText = 'Получить награду';
        let buttonDisabled = !isCompleted || isClaimed;
        
        if (isClaimed) {
            buttonText = '✓ Получено';
        } else if (!isCompleted) {
            buttonText = 'В процессе';
        }
        
        return `
            <div class="quest-card ${isCompleted ? 'completed' : ''}">
                <div class="quest-header">
                    <span class="quest-name">
                        <span class="quest-icon">${quest.icon}</span>
                        ${quest.name}
                    </span>
                    <span class="quest-reward">+${quest.reward}💰 ${quest.xp}XP</span>
                </div>
                <div class="quest-desc">${quest.desc}</div>
                <div class="quest-progress">
                    <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="quest-stats">
                    <span>Прогресс: ${quest.progress}/${quest.target}</span>
                    <span>${Math.round(progressPercent)}%</span>
                </div>
                <button class="quest-claim-btn ${isClaimed ? 'claimed' : ''}" 
                        onclick="claimQuestReward('${type}', '${quest.id}')"
                        ${buttonDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');
}

// Обновление UI пасса
function updatePassUI() {
    document.getElementById('passLevel').textContent = gameState.pass.level;
    document.getElementById('passXP').textContent = gameState.pass.xp;
    document.getElementById('passMaxXP').textContent = gameState.pass.maxXP;
    
    const progressPercent = (gameState.pass.xp / gameState.pass.maxXP) * 100;
    document.getElementById('passProgress').style.width = progressPercent + '%';
    
    // Отображение наград
    const rewardsGrid = document.getElementById('passRewards');
    if (rewardsGrid) {
        rewardsGrid.innerHTML = passRewards.map(r => {
            const isCurrent = r.level === gameState.pass.level;
            const isClaimed = gameState.pass.claimedRewards.includes(r.level);
            
            return `
                <div class="reward-item ${isCurrent ? 'current' : ''}">
                    <div class="reward-level">Ур.${r.level}</div>
                    <div class="reward-icon">${r.icon}</div>
                    <div class="reward-name">${r.reward}</div>
                </div>
            `;
        }).join('');
    }
}

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
let leaderboardDB = [];

function loadLeaderboard() {
    const saved = localStorage.getItem('leaderboard_db');
    if (saved) {
        try {
            leaderboardDB = JSON.parse(saved);
            
            // Фильтрация реальных игроков
            leaderboardDB = leaderboardDB.filter(player => {
                if (!player || !player.name) return false;
                
                const name = player.name.toLowerCase().trim();
                const bannedNames = [
                    'бот', 'bot', 'test', 'тест', 'demo', 'демо',
                    'player', 'игрок', 'user', 'пользователь',
                    'admin', 'админ', 'moder', 'модер'
                ];
                
                for (let banned of bannedNames) {
                    if (name.includes(banned)) return false;
                }
                
                return name.length >= 3 && !/^\d+$/.test(name) && !isNaN(player.score) && player.score >= 0;
            });
            
            // Удаляем дубликаты
            const uniquePlayers = new Map();
            leaderboardDB.forEach(player => {
                const existing = uniquePlayers.get(player.name);
                if (!existing || player.score > existing.score) {
                    uniquePlayers.set(player.name, player);
                }
            });
            
            leaderboardDB = Array.from(uniquePlayers.values());
            
        } catch (e) {
            console.error('Ошибка загрузки лидеров:', e);
            leaderboardDB = [];
        }
    } else {
        leaderboardDB = [];
    }
    
    leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    if (leaderboardDB.length > 20) {
        leaderboardDB = leaderboardDB.slice(0, 20);
    }
    
    saveLeaderboard();
    renderLeaderboard();
}

function saveLeaderboard() {
    try {
        if (gameState.nickname && gameState.nickname.length >= 3) {
            
            const name = gameState.nickname.toLowerCase();
            const bannedNames = ['бот', 'bot', 'test', 'тест', 'demo', 'демо', 'admin'];
            let isReal = true;
            
            for (let banned of bannedNames) {
                if (name.includes(banned)) {
                    isReal = false;
                    break;
                }
            }
            
            if (isReal) {
                const playerScore = isNaN(gameState.balance) ? 0 : Math.floor(gameState.balance);
                
                leaderboardDB = leaderboardDB.filter(p => p.name !== gameState.nickname);
                
                leaderboardDB.push({
                    name: gameState.nickname,
                    score: playerScore,
                    title: gameState.title,
                    passLevel: gameState.pass.level,
                    lastUpdate: Date.now()
                });
            }
        }
        
        // Финальная фильтрация
        leaderboardDB = leaderboardDB.filter(p => {
            if (!p || !p.name) return false;
            
            const name = p.name.toLowerCase();
            const bannedNames = ['бот', 'bot', 'test', 'тест', 'demo', 'демо'];
            
            for (let banned of bannedNames) {
                if (name.includes(banned)) return false;
            }
            
            return p.name.length >= 3 && !isNaN(p.score) && p.score >= 0;
        });
        
        leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        if (leaderboardDB.length > 20) {
            leaderboardDB = leaderboardDB.slice(0, 20);
        }
        
        localStorage.setItem('leaderboard_db', JSON.stringify(leaderboardDB));
        renderLeaderboard();
    } catch (e) {
        console.error('Ошибка сохранения лидеров:', e);
    }
}

function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    
    if (!leaderboardDB || leaderboardDB.length === 0) {
        board.innerHTML = `
            <div class="leader-row">
                <span class="leader-name" style="text-align: center; width: 100%;">👥 Пока нет игроков</span>
            </div>
            <div class="leader-row">
                <span class="leader-name" style="text-align: center; width: 100%;">Будьте первым!</span>
            </div>
        `;
        return;
    }
    
    board.innerHTML = leaderboardDB.map((player, index) => {
        const score = !isNaN(player.score) && player.score >= 0 ? player.score : 0;
        let rankClass = '';
        
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';
        
        return `
            <div class="leader-row">
                <span class="leader-rank ${rankClass}">${index + 1}</span>
                <span class="leader-name">
                    ${player.name || 'Игрок'}
                    ${player.title ? `<span class="leader-title">${player.title}</span>` : ''}
                    ${player.passLevel ? `<span class="leader-title">Ур.${player.passLevel}</span>` : ''}
                </span>
                <span class="leader-score">💰 ${formatNumber(score)}</span>
            </div>
        `;
    }).join('');
}

// ========== ФОРМАТИРОВАНИЕ ЧИСЕЛ ==========
function formatNumber(num) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ========== СОХРАНЕНИЕ ==========
function saveGame() {
    try {
        gameState.balance = isNaN(gameState.balance) ? 0 : gameState.balance;
        gameState.totalClicks = isNaN(gameState.totalClicks) ? 0 : gameState.totalClicks;
        gameState.totalEarned = isNaN(gameState.totalEarned) ? 0 : gameState.totalEarned;
        gameState.autoclickers = isNaN(gameState.autoclickers) ? 0 : gameState.autoclickers;
        gameState.power = isNaN(gameState.power) ? 1 : gameState.power;
        gameState.casesOpened = isNaN(gameState.casesOpened) ? 0 : gameState.casesOpened;
        gameState.bestCaseWin = isNaN(gameState.bestCaseWin) ? 0 : gameState.bestCaseWin;
        gameState.daysActive = isNaN(gameState.daysActive) ? 1 : gameState.daysActive;
        
        localStorage.setItem('clicker_save', JSON.stringify(gameState));
        saveLeaderboard();
        return true;
    } catch (e) {
        console.error('Ошибка сохранения:', e);
        return false;
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('clicker_save');
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'number' && isNaN(data[key])) {
                    data[key] = 0;
                }
            });
            gameState = { ...gameState, ...data };
            
            // Инициализируем квесты
            initQuests();
            
            return true;
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
    return false;
}

// ========== ЗАГРУЗКА ФАЙЛА ==========
function loadClickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.click,.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    document.getElementById('loading').style.display = 'flex';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) {
            document.getElementById('loading').style.display = 'none';
            document.body.removeChild(input);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                Object.keys(data).forEach(key => {
                    if (typeof data[key] === 'number' && isNaN(data[key])) {
                        data[key] = 0;
                    }
                });
                
                gameState = { ...gameState, ...data };
                initQuests();
                
                document.getElementById('playerName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('profileName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                updateUI();
                updateTurboUI();
                renderShop();
                renderSkins();
                renderCases();
                renderPromoList();
                renderTitles();
                renderQuests('daily');
                updatePassUI();
                saveLeaderboard();
                
                showNotif('✅ Успешно', 'Игра загружена');
            } catch (error) {
                showNotif('❌ Ошибка', 'Неверный файл', 'error');
            } finally {
                document.getElementById('loading').style.display = 'none';
                document.body.removeChild(input);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ========== ЗВУКИ ==========
function playSound(type) {
    if (!gameState.settings.sounds) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'turbo':
                oscillator.frequency.value = 1200;
                gainNode.gain.value = 0.2;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'upgrade':
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.15;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'case':
                oscillator.frequency.value = 400;
                gainNode.gain.value = 0.2;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
        }
    } catch (e) {
        // Игнорируем ошибки звука
    }
}

// ========== ТУРБО РЕЖИМ ==========
function activateTurbo() {
    const turboPrice = 50;
    
    if (gameState.balance < turboPrice) {
        showNotif('❌ Недостаточно', `Нужно ${turboPrice}💰`, 'error');
        return false;
    }
    
    gameState.balance -= turboPrice;
    gameState.turbo.active = true;
    gameState.turbo.timeLeft = gameState.turbo.maxTime;
    
    playSound('turbo');
    
    const indicator = document.getElementById('turboIndicator');
    indicator.style.display = 'block';
    indicator.classList.add('turbo-activate');
    setTimeout(() => indicator.classList.remove('turbo-activate'), 500);
    
    document.getElementById('clickBtn').classList.add('turbo-active');
    
    // Обновляем прогресс квеста
    updateQuestProgress(null, 'use_turbo', 1);
    
    showNotif('⚡ ТУРБО АКТИВИРОВАН!', 'x2 на 30 секунд', 'warning');
    
    checkTitles();
    
    updateUI();
    updateTurboUI();
    saveGame();
    return true;
}

function updateTurboUI() {
    const turboSection = document.getElementById('turboSection');
    const turboStatus = document.getElementById('turboStatus');
    const turboTimer = document.getElementById('turboTimer');
    const turboProgress = document.getElementById('turboProgress');
    const turboIndicator = document.getElementById('turboIndicator');
    const clicker = document.getElementById('clickBtn');
    
    if (!turboSection || !turboStatus || !turboTimer || !turboProgress) return;
    
    if (gameState.turbo.active && gameState.turbo.timeLeft > 0) {
        turboStatus.innerHTML = `
            <span class="turbo-icon">⚡</span>
            <span>Турбо АКТИВЕН (x2)</span>
        `;
        
        const seconds = gameState.turbo.timeLeft;
        turboTimer.textContent = `0:${seconds.toString().padStart(2, '0')}`;
        
        const progress = (seconds / gameState.turbo.maxTime) * 100;
        turboProgress.style.width = progress + '%';
        
        if (turboIndicator) turboIndicator.style.display = 'block';
        if (clicker) clicker.classList.add('turbo-active');
    } else {
        turboStatus.innerHTML = `
            <span class="turbo-icon">⚡</span>
            <span>Турбо выключен</span>
        `;
        turboTimer.textContent = '0:00';
        turboProgress.style.width = '0%';
        
        if (turboIndicator) turboIndicator.style.display = 'none';
        if (clicker) clicker.classList.remove('turbo-active');
    }
}

// ========== СИСТЕМА ТИТУЛОВ ==========
const titles = [
    { id: 'novice', name: '👆 Новичок', requirement: 0, type: 'clicks' },
    { id: 'clicker', name: '🤚 Кликер', requirement: 100, type: 'clicks' },
    { id: 'pro', name: '✋ Профи', requirement: 1000, type: 'clicks' },
    { id: 'master', name: '👊 Мастер', requirement: 5000, type: 'clicks' },
    { id: 'legend', name: '👑 Легенда', requirement: 10000, type: 'clicks' },
    { id: 'god', name: '⚡ Бог клика', requirement: 50000, type: 'clicks' },
    
    { id: 'poor', name: '💰 Бедняк', requirement: 0, type: 'balance' },
    { id: 'rich', name: '💎 Богач', requirement: 10000, type: 'balance' },
    { id: 'million', name: '💵 Миллионер', requirement: 100000, type: 'balance' },
    { id: 'billion', name: '💶 Миллиардер', requirement: 1000000, type: 'balance' },
    
    { id: 'auto_noob', name: '🤖 Юзер', requirement: 0, type: 'autoclickers' },
    { id: 'auto_pro', name: '⚙️ Механик', requirement: 10, type: 'autoclickers' },
    { id: 'auto_master', name: '🦾 Киберпанк', requirement: 50, type: 'autoclickers' },
    { id: 'auto_god', name: '🤖 Повелитель машин', requirement: 100, type: 'autoclickers' },
    
    { id: 'case_noob', name: '🎁 Новичок', requirement: 0, type: 'cases' },
    { id: 'case_pro', name: '🎰 Игрок', requirement: 10, type: 'cases' },
    { id: 'case_master', name: '🎲 Шулер', requirement: 50, type: 'cases' },
    { id: 'case_god', name: '👑 Король удачи', requirement: 100, type: 'cases' },
    
    { id: 'day1', name: '📅 Новичок', requirement: 1, type: 'days' },
    { id: 'day7', name: '📆 Завсегдатай', requirement: 7, type: 'days' },
    { id: 'day30', name: '🗓️ Ветеран', requirement: 30, type: 'days' },
    { id: 'day365', name: '🎂 Легенда', requirement: 365, type: 'days' },
    
    { id: 'turbo', name: '⚡ Турбо', requirement: 1, type: 'special_turbo' },
    { id: 'lucky', name: '🍀 Счастливчик', requirement: 1000, type: 'special_lucky' },
    { id: 'collector', name: '🎨 Коллекционер', requirement: 3, type: 'special_collector' },
    { id: 'pass_master', name: '🎫 Мастер пасса', requirement: 10, type: 'special_pass' }
];

function checkTitles() {
    const newTitles = [];
    
    titles.forEach(title => {
        if (gameState.titles.includes(title.name)) return;
        
        let earned = false;
        
        switch(title.type) {
            case 'clicks':
                if (gameState.totalClicks >= title.requirement) earned = true;
                break;
            case 'balance':
                if (gameState.balance >= title.requirement) earned = true;
                break;
            case 'autoclickers':
                if (gameState.autoclickers >= title.requirement) earned = true;
                break;
            case 'cases':
                if (gameState.casesOpened >= title.requirement) earned = true;
                break;
            case 'days':
                if (gameState.daysActive >= title.requirement) earned = true;
                break;
            case 'special_turbo':
                if (gameState.turbo.active) earned = true;
                break;
            case 'special_lucky':
                if (gameState.bestCaseWin >= 1000) earned = true;
                break;
            case 'special_collector':
                if (gameState.ownedSkins.length >= 3) earned = true;
                break;
            case 'special_pass':
                if (gameState.pass.level >= 10) earned = true;
                break;
        }
        
        if (earned) {
            newTitles.push(title.name);
            gameState.titles.push(title.name);
            showNotif('🏆 Новый титул!', `Вы получили: ${title.name}`, 'warning');
            
            updateQuestProgress(null, 'titles', 1);
            
            if (isTitleBetter(title.name, gameState.title)) {
                gameState.title = title.name;
            }
        }
    });
    
    if (newTitles.length > 0) {
        renderTitles();
        saveGame();
    }
}

function isTitleBetter(newTitle, oldTitle) {
    const titleOrder = [
        '👆 Новичок', '🤚 Кликер', '✋ Профи', '👊 Мастер', '👑 Легенда', '⚡ Бог клика',
        '💰 Бедняк', '💎 Богач', '💵 Миллионер', '💶 Миллиардер',
        '🤖 Юзер', '⚙️ Механик', '🦾 Киберпанк', '🤖 Повелитель машин',
        '🎁 Новичок', '🎰 Игрок', '🎲 Шулер', '👑 Король удачи',
        '📅 Новичок', '📆 Завсегдатай', '🗓️ Ветеран', '🎂 Легенда',
        '⚡ Турбо', '🍀 Счастливчик', '🎨 Коллекционер', '🎫 Мастер пасса'
    ];
    
    const newIndex = titleOrder.indexOf(newTitle);
    const oldIndex = titleOrder.indexOf(oldTitle);
    
    return newIndex > oldIndex;
}

function renderTitles() {
    const container = document.getElementById('profileTitles');
    if (!container) return;
    
    container.innerHTML = `
        <div class="current-title">
            <span class="title-label">Текущий титул:</span>
            <span class="title-value">${gameState.title}</span>
        </div>
        <div class="titles-list">
            <span class="titles-label">Все титулы (${gameState.titles.length}/${titles.length}):</span>
            <div class="titles-grid">
                ${titles.map(title => {
                    const has = gameState.titles.includes(title.name);
                    return `
                        <div class="title-item ${has ? 'owned' : ''}" 
                             onclick="${has ? `selectTitle('${title.name}')` : ''}">
                            ${title.name}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

window.selectTitle = (titleName) => {
    if (gameState.titles.includes(titleName)) {
        gameState.title = titleName;
        renderTitles();
        showNotif('✅ Титул надет!', titleName, 'success');
        saveGame();
    }
};

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    
    if (loadGame() && gameState.nickname && gameState.nickname.length >= 3) {
        document.getElementById('playerName').textContent = gameState.nickname;
        document.getElementById('profileName').textContent = gameState.nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    }
    
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '🌙' : '☀️';
    
    initEvents();
    
    renderShop();
    renderSkins();
    renderCases();
    renderPromoList();
    renderTitles();
    renderQuests('daily');
    updatePassUI();
    
    updateTurboUI();
    startLoop();
});

// ========== СОБЫТИЯ ==========
function initEvents() {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const name = document.getElementById('loginInput').value.trim();
        if (name.length < 3) {
            showNotif('❌ Ошибка', 'Минимум 3 символа', 'error');
            return;
        }
        
        gameState.nickname = name;
        document.getElementById('playerName').textContent = name;
        document.getElementById('profileName').textContent = name;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        initQuests();
        leaderboardDB = [];
        checkTitles();
        saveLeaderboard();
        
        showNotif('✅ Добро пожаловать!', `Привет, ${name}!`);
    });
    
    document.getElementById('loadGameFile').addEventListener('click', loadClickFile);
    
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sideMenu').classList.add('active');
    });
    
    document.getElementById('closeMenu').addEventListener('click', () => {
        document.getElementById('sideMenu').classList.remove('active');
    });
    
    document.getElementById('profileBtn').addEventListener('click', () => {
        document.querySelector('[data-tab="profile"]').click();
        renderTitles();
    });
    
    document.getElementById('casesBtn').addEventListener('click', () => {
        document.querySelector('[data-tab="cases"]').click();
    });
    
    document.getElementById('passBtn').addEventListener('click', () => {
        document.querySelector('[data-tab="pass"]').click();
        renderQuests('daily');
        updatePassUI();
    });
    
    document.getElementById('autoMenuBtn').addEventListener('click', () => {
        document.getElementById('autoMenu').classList.add('active');
        updateAutoMenu();
    });
    
    document.getElementById('closeAutoMenu').addEventListener('click', () => {
        document.getElementById('autoMenu').classList.remove('active');
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const tab = item.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            
            document.getElementById('sideMenu').classList.remove('active');
            
            if (tab === 'leaders') {
                renderLeaderboard();
            } else if (tab === 'profile') {
                renderTitles();
            } else if (tab === 'pass') {
                renderQuests('daily');
                updatePassUI();
            }
        });
    });
    
    document.querySelectorAll('.pass-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pass-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderQuests(tab.dataset.pass);
        });
    });
    
    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        document.getElementById('themeToggle').textContent = next === 'dark' ? '🌙' : '☀️';
    });
    
    document.getElementById('clickBtn').addEventListener('click', () => {
        const multiplier = gameState.turbo.active ? gameState.turbo.multiplier : 1;
        const gain = (isNaN(gameState.power) ? 1 : gameState.power) * multiplier;
        
        gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + gain;
        gameState.totalClicks = (isNaN(gameState.totalClicks) ? 0 : gameState.totalClicks) + 1;
        gameState.totalEarned = (isNaN(gameState.totalEarned) ? 0 : gameState.totalEarned) + gain;
        
        const btn = document.getElementById('clickBtn');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
        
        // Обновляем прогресс квестов
        updateQuestProgress(null, 'clicks', 1);
        updateQuestProgress(null, 'earn', gain);
        
        checkTitles();
        
        updateUI();
    });
    
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + 500;
            gameState.lastDaily = today;
            gameState.daysActive = (isNaN(gameState.daysActive) ? 1 : gameState.daysActive) + 1;
            showNotif('📅 Награда!', '+500 монет');
            
            checkTitles();
            
            saveGame();
            saveLeaderboard();
            updateUI();
        } else {
            showNotif('⏰ Уже получали', 'Завтра будет снова', 'warning');
        }
    });
    
    document.getElementById('floatingGift').addEventListener('click', () => {
        const now = Date.now();
        const last = gameState.lastGift || 0;
        
        if (now - last >= 86400000) {
            gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + 50;
            gameState.lastGift = now;
            showNotif('🎁 Подарок!', '+50 монет');
            updateUI();
            saveGame();
            saveLeaderboard();
        } else {
            const left = 86400000 - (now - last);
            const hours = Math.floor(left / 3600000);
            const mins = Math.floor((left % 3600000) / 60000);
            showNotif('⏰ Ожидайте', `${hours}ч ${mins}м`, 'info');
        }
    });
    
    document.getElementById('saveToFile').addEventListener('click', () => {
        try {
            const data = JSON.stringify(gameState, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${gameState.nickname || 'game'}_${Date.now()}.click`;
            a.click();
            URL.revokeObjectURL(url);
            showNotif('💾 Сохранено', 'Файл готов');
        } catch (e) {
            showNotif('❌ Ошибка', 'Не удалось сохранить', 'error');
        }
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        saveGame();
        saveLeaderboard();
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('loginInput').value = '';
        gameState.nickname = '';
    });
    
    document.getElementById('closeCaseAnimation').addEventListener('click', () => {
        document.getElementById('caseAnimation').style.display = 'none';
    });
    
    document.getElementById('activatePromo').addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.toUpperCase().trim();
        
        if (!code) {
            showNotif('❌ Ошибка', 'Введите промокод', 'error');
            return;
        }
        
        if (gameState.usedCodes.includes(code)) {
            showNotif('❌ Уже использован', '', 'error');
            return;
        }
        
        let success = false;
        let msg = '';
        
        switch(code) {
            case 'START':
                gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + 100;
                msg = '+100💰';
                success = true;
                break;
            case 'GIFT':
                gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + 300;
                msg = '+300💰';
                success = true;
                break;
            case 'POWER':
                gameState.power = (isNaN(gameState.power) ? 1 : gameState.power) + 1;
                msg = 'Сила +1';
                success = true;
                break;
            case 'TURBO':
                if (activateTurbo()) {
                    msg = 'Турбо активирован!';
                    success = true;
                }
                break;
            default:
                showNotif('❌ Неверный код', '', 'error');
                return;
        }
        
        if (success) {
            gameState.usedCodes.push(code);
            document.getElementById('promoInput').value = '';
            showNotif('✅ Промокод!', msg);
            checkTitles();
            updateUI();
            saveGame();
            saveLeaderboard();
        }
    });
    
    document.getElementById('notificationsCheck').addEventListener('change', (e) => {
        gameState.settings.notifications = e.target.checked;
    });
    
    document.getElementById('vibrationCheck').addEventListener('change', (e) => {
        gameState.settings.vibration = e.target.checked;
    });
    
    document.getElementById('autosaveCheck').addEventListener('change', (e) => {
        gameState.settings.autoSave = e.target.checked;
    });
    
    document.getElementById('soundsCheck').addEventListener('change', (e) => {
        gameState.settings.sounds = e.target.checked;
    });
    
    document.getElementById('autoMenuStart').addEventListener('click', () => {
        if (gameState.autoclickers === 0 || isNaN(gameState.autoclickers)) {
            showNotif('❌ Ошибка', 'Купите автокликер', 'error');
            return;
        }
        
        if (gameState.autoClicker.enabled) {
            gameState.autoClicker.enabled = false;
            showNotif('⏸️ Автокликер остановлен', '', 'info');
        } else {
            gameState.autoClicker.enabled = true;
            gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime;
            playSound('upgrade');
            showNotif('▶️ Автокликер запущен', `Будет работать ${gameState.autoClicker.maxTime} сек`, 'success');
        }
        
        updateAutoMenu();
        saveGame();
    });
    
    document.getElementById('autoMenuUpgrade').addEventListener('click', () => {
        const level = isNaN(gameState.autoClicker.level) ? 1 : gameState.autoClicker.level;
        const price = 100 * level;
        
        if (gameState.balance >= price) {
            gameState.balance -= price;
            gameState.autoClicker.level = level + 1;
            gameState.autoClicker.maxTime = (gameState.autoClicker.maxTime || 120) + 30;
            playSound('upgrade');
            showNotif('⬆️ Улучшено!', `Уровень ${gameState.autoClicker.level}, время +30 сек`, 'success');
            
            updateQuestProgress(null, 'buy_auto', 1);
            checkTitles();
            
            updateUI();
            updateAutoMenu();
            saveGame();
            saveLeaderboard();
        } else {
            showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        }
    });
    
    document.getElementById('autoMenuTurbo').addEventListener('click', () => {
        activateTurbo();
        updateTurboUI();
    });
}

// ========== ОБНОВЛЕНИЕ МЕНЮ АВТОКЛИКЕРА ==========
function updateAutoMenu() {
    const level = isNaN(gameState.autoClicker.level) ? 1 : gameState.autoClicker.level;
    const count = isNaN(gameState.autoclickers) ? 0 : gameState.autoclickers;
    const power = isNaN(gameState.power) ? 1 : gameState.power;
    
    document.getElementById('autoMenuLevel').textContent = level;
    document.getElementById('autoMenuCount').textContent = count;
    document.getElementById('autoMenuIncome').textContent = `${level * power}/сек`;
    document.getElementById('upgradePrice').textContent = `${100 * level}💰`;
    
    const startBtn = document.getElementById('autoMenuStart');
    if (startBtn) {
        startBtn.innerHTML = gameState.autoClicker.enabled ? 
            '<span>⏹️</span><span>Остановить</span>' : 
            '<span>▶️</span><span>Запустить</span>';
    }
    
    if (gameState.autoClicker.enabled) {
        const timeLeft = isNaN(gameState.autoClicker.timeLeft) ? 0 : gameState.autoClicker.timeLeft;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('autoMenuTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const maxTime = isNaN(gameState.autoClicker.maxTime) ? 120 : gameState.autoClicker.maxTime;
        const progress = maxTime > 0 ? ((maxTime - timeLeft) / maxTime) * 100 : 0;
        document.getElementById('autoMenuProgress').style.width = Math.min(100, Math.max(0, progress)) + '%';
    } else {
        const maxTime = isNaN(gameState.autoClicker.maxTime) ? 120 : gameState.autoClicker.maxTime;
        const minutes = Math.floor(maxTime / 60);
        const seconds = maxTime % 60;
        document.getElementById('autoMenuTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('autoMenuProgress').style.width = '0%';
    }
    
    updateTurboUI();
}

// ========== УВЕДОМЛЕНИЯ ==========
function showNotif(title, msg, type = 'success') {
    if (!gameState.settings.notifications && type !== 'error') return;
    
    const box = document.getElementById('notifications');
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.innerHTML = `<strong>${title}</strong><br>${msg}`;
    box.appendChild(n);
    
    setTimeout(() => {
        n.style.animation = 'notificationSlide 0.3s reverse';
        setTimeout(() => n.remove(), 300);
    }, 3000);
    
    if (gameState.settings.vibration && type === 'success') {
        navigator.vibrate?.(50);
    }
}

// ========== МАГАЗИН ==========
function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="shop-card">
            <span class="card-icon">🤖</span>
            <span class="card-title">Автокликер</span>
            <span class="card-desc">+1/сек</span>
            <span class="card-price">50💰</span>
            <button class="card-btn" onclick="buyItem('auto')">Купить</button>
        </div>
        <div class="shop-card">
            <span class="card-icon">💪</span>
            <span class="card-title">Сила</span>
            <span class="card-desc">+1 к силе</span>
            <span class="card-price">100💰</span>
            <button class="card-btn" onclick="buyItem('power')">Купить</button>
        </div>
        <div class="shop-card">
            <span class="card-icon">⚡</span>
            <span class="card-title">Турбо</span>
            <span class="card-desc">x2 на 30 сек</span>
            <span class="card-price">50💰</span>
            <button class="card-btn" onclick="buyItem('turbo')">Купить</button>
        </div>
    `;
}

window.buyItem = (type) => {
    const balance = isNaN(gameState.balance) ? 0 : gameState.balance;
    
    if (type === 'auto' && balance >= 50) {
        gameState.balance = balance - 50;
        gameState.autoclickers = (isNaN(gameState.autoclickers) ? 0 : gameState.autoclickers) + 1;
        showNotif('✅ Куплено!', `Автокликер +${gameState.autoclickers}`);
        playSound('upgrade');
        
        updateQuestProgress(null, 'buy_auto', 1);
    } else if (type === 'power' && balance >= 100) {
        gameState.balance = balance - 100;
        gameState.power = (isNaN(gameState.power) ? 1 : gameState.power) + 1;
        showNotif('✅ Куплено!', `Сила +${gameState.power}`);
        playSound('upgrade');
    } else if (type === 'turbo' && balance >= 50) {
        gameState.balance = balance - 50;
        if (activateTurbo()) {
            updateTurboUI();
        }
    } else {
        showNotif('❌ Недостаточно', '', 'error');
        return;
    }
    
    checkTitles();
    updateUI();
    updateAutoMenu();
    saveGame();
    saveLeaderboard();
};

// ========== СКИНЫ ==========
function renderSkins() {
    const grid = document.getElementById('skinsGrid');
    if (!grid) return;
    
    const skins = [
        { id: 'red', name: 'Красный', price: 200 },
        { id: 'blue', name: 'Синий', price: 200 },
        { id: 'green', name: 'Зеленый', price: 200 }
    ];
    
    grid.innerHTML = skins.map(s => {
        const owned = gameState.ownedSkins.includes(s.id);
        return `
            <div class="skin-card" data-skin="${s.id}" data-price="${s.price}">
                <div class="skin-preview skin-${s.id}"></div>
                <div class="skin-name">${s.name}</div>
                <div class="skin-price">${owned ? '✓ Владеете' : s.price + '💰'}</div>
                <button class="skin-btn" ${owned ? 'disabled' : ''}>
                    ${owned ? 'В коллекции' : 'Купить'}
                </button>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.skin-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            const id = card.dataset.skin;
            const price = parseInt(card.dataset.price);
            const balance = isNaN(gameState.balance) ? 0 : gameState.balance;
            
            if (gameState.ownedSkins.includes(id)) {
                gameState.skin = id;
                document.getElementById('clickBtn').className = `clicker skin-${id}`;
                renderSkins();
                showNotif('🎨 Скин надет!');
            } else if (balance >= price) {
                gameState.balance = balance - price;
                gameState.ownedSkins.push(id);
                gameState.skin = id;
                renderSkins();
                updateUI();
                showNotif('✅ Скин куплен!');
                playSound('upgrade');
                
                checkTitles();
                
                saveGame();
                saveLeaderboard();
            } else {
                showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
            }
        });
    });
}

// ========== КЕЙСЫ ==========
function renderCases() {
    const grid = document.getElementById('casesGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="case-card">
            <div class="case-icon">📦</div>
            <div class="case-name">Обычный</div>
            <div class="case-price">100💰</div>
            <button class="case-btn" onclick="openCase('normal')">Открыть</button>
        </div>
        <div class="case-card rare">
            <div class="case-icon">💎</div>
            <div class="case-name">Редкий</div>
            <div class="case-price">500💰</div>
            <button class="case-btn" onclick="openCase('rare')">Открыть</button>
        </div>
        <div class="case-card epic">
            <div class="case-icon">👑</div>
            <div class="case-name">Эпический</div>
            <div class="case-price">1000💰</div>
            <button class="case-btn" onclick="openCase('epic')">Открыть</button>
        </div>
    `;
}

window.openCase = (type) => {
    let price, reward;
    const balance = isNaN(gameState.balance) ? 0 : gameState.balance;
    
    if (type === 'normal') {
        price = 100;
        const r = Math.random();
        if (r < 0.5) reward = 50;
        else if (r < 0.8) reward = 100;
        else if (r < 0.95) reward = 200;
        else reward = 500;
    } else if (type === 'rare') {
        price = 500;
        const r = Math.random();
        if (r < 0.4) reward = 100;
        else if (r < 0.7) reward = 250;
        else if (r < 0.9) reward = 500;
        else reward = 1000;
    } else {
        price = 1000;
        const r = Math.random();
        if (r < 0.5) reward = 500;
        else if (r < 0.8) reward = 1000;
        else if (r < 0.95) reward = 2000;
        else reward = 5000;
    }
    
    if (balance < price) {
        showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        return;
    }
    
    showCaseAnimation(type, () => {
        gameState.balance = balance - price;
        gameState.casesOpened = (isNaN(gameState.casesOpened) ? 0 : gameState.casesOpened) + 1;
        gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + reward;
        
        if (reward > (isNaN(gameState.bestCaseWin) ? 0 : gameState.bestCaseWin)) {
            gameState.bestCaseWin = reward;
        }
        
        document.getElementById('caseResult').innerHTML = `+${formatNumber(reward)}💰`;
        document.getElementById('caseText').textContent = 'Вы выиграли!';
        playSound('case');
        
        updateQuestProgress(null, 'open_case', 1);
        checkTitles();
        
        updateUI();
        saveGame();
        saveLeaderboard();
    });
};

function showCaseAnimation(type, callback) {
    const anim = document.getElementById('caseAnimation');
    const box = document.getElementById('caseBox');
    const text = document.getElementById('caseText');
    const result = document.getElementById('caseResult');
    
    if (!anim || !box || !text || !result) return;
    
    box.className = 'case-box';
    box.textContent = type === 'normal' ? '📦' : type === 'rare' ? '💎' : '👑';
    text.textContent = 'Открываем...';
    result.innerHTML = '';
    
    anim.style.display = 'flex';
    
    setTimeout(() => {
        box.classList.add('opening');
    }, 100);
    
    setTimeout(() => {
        callback();
    }, 1500);
}

// ========== ПРОМОКОДЫ ==========
function renderPromoList() {
    const list = document.getElementById('promoList');
    if (!list) return;
    
    list.innerHTML = `
        <div class="promo-item">
            <span class="promo-code">START</span>
            <span class="promo-reward">+100💰</span>
        </div>
        <div class="promo-item">
            <span class="promo-code">GIFT</span>
            <span class="promo-reward">+300💰</span>
        </div>
        <div class="promo-item">
            <span class="promo-code">POWER</span>
            <span class="promo-reward">Сила +1</span>
        </div>
        <div class="promo-item">
            <span class="promo-code">TURBO</span>
            <span class="promo-reward">Бесплатный турбо</span>
        </div>
    `;
}

// ========== ТАЙМЕР ПОДАРКА ==========
function updateGiftTimer() {
    const timer = document.getElementById('giftTimer');
    const gift = document.getElementById('floatingGift');
    
    if (!timer || !gift) return;
    
    if (!gameState.lastGift) {
        timer.textContent = 'Готов!';
        gift.classList.add('available');
        return;
    }
    
    const left = 86400000 - (Date.now() - gameState.lastGift);
    
    if (left <= 0) {
        timer.textContent = 'Готов!';
        gift.classList.add('available');
    } else {
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        timer.textContent = `${h}:${m.toString().padStart(2,'0')}`;
        gift.classList.remove('available');
    }
}

// ========== ИГРОВОЙ ЦИКЛ ==========
function startLoop() {
    setInterval(() => {
        if (!gameState.nickname) return;
        
        // Обновление турбо
        if (gameState.turbo.active && gameState.turbo.timeLeft > 0) {
            gameState.turbo.timeLeft--;
            
            if (gameState.turbo.timeLeft <= 0) {
                gameState.turbo.active = false;
                showNotif('⚡ Турбо закончился', 'Режим x2 отключен', 'info');
                updateTurboUI();
            }
        }
        
        // Автокликер
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            const count = isNaN(gameState.autoclickers) ? 0 : gameState.autoclickers;
            const level = isNaN(gameState.autoClicker.level) ? 1 : gameState.autoClicker.level;
            const power = isNaN(gameState.power) ? 1 : gameState.power;
            const multiplier = gameState.turbo.active ? gameState.turbo.multiplier : 1;
            
            if (count > 0) {
                const inc = level * power * multiplier;
                gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + inc;
                gameState.totalEarned = (isNaN(gameState.totalEarned) ? 0 : gameState.totalEarned) + inc;
                
                updateQuestProgress(null, 'earn', inc);
            }
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
                showNotif('⏸️ Автокликер остановлен', 'Время вышло', 'info');
            }
            
            updateAutoMenu();
        }
        
        updateUI();
    }, 1000);
    
    setInterval(() => {
        if (gameState.autoClicker.enabled) {
            updateAutoMenu();
        }
        updateTurboUI();
    }, 500);
    
    setInterval(updateGiftTimer, 60000);
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    document.getElementById('balance').textContent = formatNumber(gameState.balance);
    document.getElementById('power').textContent = formatNumber(gameState.power);
    document.getElementById('cps').textContent = formatNumber(gameState.autoclickers);
    
    document.getElementById('totalClicks').textContent = formatNumber(gameState.totalClicks);
    document.getElementById('totalEarned').textContent = formatNumber(gameState.totalEarned);
    document.getElementById('totalCases').textContent = formatNumber(gameState.casesOpened);
    document.getElementById('bestWin').textContent = formatNumber(gameState.bestCaseWin) + '💰';
    document.getElementById('totalDays').textContent = formatNumber(gameState.daysActive);
    
    const lvl = Math.floor((isNaN(gameState.totalClicks) ? 0 : gameState.totalClicks) / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${lvl}`;
    document.getElementById('profileLevel').textContent = `Уровень ${lvl}`;
    
    updateGiftTimer();
    updateTurboUI();
    
    if (gameState.settings.autoSave && gameState.nickname) {
        saveGame();
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
window.claimQuestReward = claimQuestReward;
window.selectTitle = selectTitle;
window.buyItem = buyItem;
window.openCase = openCase;

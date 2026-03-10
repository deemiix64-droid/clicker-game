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
    title: '👆 Новичок',
    titles: ['👆 Новичок'],
    lastDaily: null,
    lastGift: null,
    usedCodes: [],
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
    version: '6.2'
};

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
let leaderboardDB = [];

function loadLeaderboard() {
    const saved = localStorage.getItem('leaderboard_db');
    if (saved) {
        try {
            leaderboardDB = JSON.parse(saved);
            leaderboardDB = leaderboardDB.filter(player => {
                if (!player || !player.name) return false;
                const name = player.name.toLowerCase().trim();
                const bannedNames = ['бот', 'bot', 'test', 'тест', 'demo', 'демо'];
                for (let banned of bannedNames) {
                    if (name.includes(banned)) return false;
                }
                return name.length >= 3 && !isNaN(player.score) && player.score >= 0;
            });
        } catch (e) {
            leaderboardDB = [];
        }
    } else {
        leaderboardDB = [];
    }
    
    leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
    if (leaderboardDB.length > 20) leaderboardDB = leaderboardDB.slice(0, 20);
    saveLeaderboard();
    renderLeaderboard();
}

function saveLeaderboard() {
    try {
        if (gameState.nickname && gameState.nickname.length >= 3) {
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
        
        leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
        if (leaderboardDB.length > 20) leaderboardDB = leaderboardDB.slice(0, 20);
        
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

// ========== ТИТУЛЫ ==========
const titles = [
    { name: '👆 Новичок', clicks: 0 },
    { name: '🤚 Кликер', clicks: 100 },
    { name: '✋ Профи', clicks: 500 },
    { name: '👊 Мастер', clicks: 1000 },
    { name: '👑 Легенда', clicks: 5000 },
    { name: '⚡ Бог клика', clicks: 10000 }
];

function checkTitles() {
    let newTitle = null;
    
    for (let i = titles.length - 1; i >= 0; i--) {
        if (gameState.totalClicks >= titles[i].clicks) {
            if (!gameState.titles.includes(titles[i].name)) {
                gameState.titles.push(titles[i].name);
                newTitle = titles[i].name;
            }
            if (gameState.title !== titles[i].name) {
                gameState.title = titles[i].name;
            }
            break;
        }
    }
    
    if (newTitle) {
        showNotif('🏆 Новый титул!', newTitle, 'warning');
        renderTitles();
        saveGame();
    }
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
                        <div class="title-item ${has ? 'owned' : ''}">
                            ${title.name}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ========== КВЕСТЫ ==========
const questTemplates = {
    daily: [
        { id: 'daily_clicks', name: 'Кликер', desc: 'Сделайте 100 кликов', icon: '👆', target: 100, reward: 50, xp: 10 },
        { id: 'daily_earn', name: 'Заработок', desc: 'Заработайте 500 монет', icon: '💰', target: 500, reward: 50, xp: 10 },
        { id: 'daily_case', name: 'Открыватель', desc: 'Откройте 1 кейс', icon: '📦', target: 1, reward: 50, xp: 10 }
    ],
    weekly: [
        { id: 'weekly_clicks', name: 'Чемпион', desc: 'Сделайте 1000 кликов', icon: '👑', target: 1000, reward: 200, xp: 50 },
        { id: 'weekly_earn', name: 'Богач', desc: 'Заработайте 5000 монет', icon: '💎', target: 5000, reward: 200, xp: 50 }
    ],
    seasonal: [
        { id: 'season_clicks', name: 'Легенда', desc: 'Сделайте 10000 кликов', icon: '🏆', target: 10000, reward: 1000, xp: 200 }
    ]
};

function initQuests() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - gameState.pass.lastQuestReset > dayInMs) {
        gameState.pass.quests.daily = generateQuests('daily');
        gameState.pass.lastQuestReset = now;
    }
    
    if (gameState.pass.quests.daily.length === 0) {
        gameState.pass.quests.daily = generateQuests('daily');
    }
    if (gameState.pass.quests.weekly.length === 0) {
        gameState.pass.quests.weekly = generateQuests('weekly');
    }
    if (gameState.pass.quests.seasonal.length === 0) {
        gameState.pass.quests.seasonal = generateQuests('seasonal');
    }
}

function generateQuests(type) {
    const templates = questTemplates[type];
    return templates.map(t => ({
        ...t,
        progress: 0,
        completed: false,
        claimed: false
    }));
}

function updateQuestProgress(progressType, value = 1) {
    let updated = false;
    
    ['daily', 'weekly', 'seasonal'].forEach(type => {
        gameState.pass.quests[type].forEach(quest => {
            if (quest.completed || quest.claimed) return;
            
            if (progressType === 'clicks' && quest.id.includes('clicks')) {
                quest.progress = Math.min(quest.progress + value, quest.target);
            }
            if (progressType === 'earn' && quest.id.includes('earn')) {
                quest.progress = Math.min(quest.progress + value, quest.target);
            }
            if (progressType === 'case' && quest.id.includes('case')) {
                quest.progress = Math.min(quest.progress + value, quest.target);
            }
            
            if (quest.progress >= quest.target && !quest.completed) {
                quest.completed = true;
                showNotif('✅ Квест выполнен!', quest.name, 'success');
                updated = true;
            }
        });
    });
    
    if (updated) {
        renderQuests('daily');
        saveGame();
    }
}

function claimQuestReward(type, questId) {
    const quest = gameState.pass.quests[type].find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;
    
    gameState.balance += quest.reward;
    gameState.pass.xp += quest.xp;
    
    while (gameState.pass.xp >= gameState.pass.maxXP) {
        gameState.pass.xp -= gameState.pass.maxXP;
        gameState.pass.level++;
        gameState.pass.maxXP = Math.floor(gameState.pass.maxXP * 1.2);
        showNotif('⬆️ Уровень пасса повышен!', `Уровень ${gameState.pass.level}`, 'warning');
        
        if (gameState.pass.level <= 10) {
            grantPassReward(gameState.pass.level);
        }
    }
    
    quest.claimed = true;
    showNotif('🎁 Награда получена!', `+${quest.reward}💰, +${quest.xp} XP`, 'success');
    
    renderQuests(type);
    updatePassUI();
    saveGame();
}

function grantPassReward(level) {
    switch(level) {
        case 1: gameState.balance += 100; break;
        case 2: gameState.turbo.active = true; gameState.turbo.timeLeft = gameState.turbo.maxTime; break;
        case 3: if (!gameState.ownedSkins.includes('gold')) gameState.ownedSkins.push('gold'); break;
        case 4: gameState.balance += 500; break;
        case 5: gameState.autoclickers++; break;
        case 6: gameState.balance += 1000; break;
        case 7: gameState.turbo.active = true; gameState.turbo.timeLeft = gameState.turbo.maxTime * 2; break;
        case 8: localStorage.setItem('hasKey', 'true'); break;
        case 9: gameState.balance += 2000; break;
        case 10: 
            if (!gameState.titles.includes('🎫 Мастер пасса')) {
                gameState.titles.push('🎫 Мастер пасса');
                gameState.title = '🎫 Мастер пасса';
            }
            break;
    }
}

function renderQuests(type = 'daily') {
    const container = document.getElementById('questsContainer');
    if (!container) return;
    
    const quests = gameState.pass.quests[type];
    if (!quests || quests.length === 0) return;
    
    container.innerHTML = quests.map(quest => {
        const progressPercent = (quest.progress / quest.target) * 100;
        const isCompleted = quest.completed;
        const isClaimed = quest.claimed;
        
        let buttonText = 'Получить';
        let buttonDisabled = !isCompleted || isClaimed;
        
        if (isClaimed) buttonText = '✓ Получено';
        else if (!isCompleted) buttonText = 'В процессе';
        
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
                    <span>${quest.progress}/${quest.target}</span>
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

function updatePassUI() {
    document.getElementById('passLevel').textContent = gameState.pass.level;
    document.getElementById('passXP').textContent = gameState.pass.xp;
    document.getElementById('passMaxXP').textContent = gameState.pass.maxXP;
    
    const progressPercent = (gameState.pass.xp / gameState.pass.maxXP) * 100;
    document.getElementById('passProgress').style.width = progressPercent + '%';
    
    const rewardsGrid = document.getElementById('passRewards');
    if (rewardsGrid) {
        const passRewards = [
            { level: 1, icon: '💰', name: '100 монет' },
            { level: 2, icon: '⚡', name: 'Турбо' },
            { level: 3, icon: '🎨', name: 'Золотой скин' },
            { level: 4, icon: '💰', name: '500 монет' },
            { level: 5, icon: '🤖', name: 'Автокликер' },
            { level: 6, icon: '💰', name: '1000 монет' },
            { level: 7, icon: '⚡', name: 'Турбо x2' },
            { level: 8, icon: '🔑', name: 'Ключ' },
            { level: 9, icon: '💰', name: '2000 монет' },
            { level: 10, icon: '👑', name: 'Мастер пасса' }
        ];
        
        rewardsGrid.innerHTML = passRewards.map(r => {
            const isCurrent = r.level === gameState.pass.level;
            return `
                <div class="reward-item ${isCurrent ? 'current' : ''}">
                    <div class="reward-level">Ур.${r.level}</div>
                    <div class="reward-icon">${r.icon}</div>
                    <div class="reward-name">${r.name}</div>
                </div>
            `;
        }).join('');
    }
}

// ========== ФОРМАТИРОВАНИЕ ЧИСЕЛ ==========
function formatNumber(num) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ========== СОХРАНЕНИЕ ==========
function saveGame() {
    try {
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
            gameState = { ...gameState, ...data };
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
                gameState = { ...gameState, ...data };
                initQuests();
                
                document.getElementById('playerName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('profileName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                updateUI();
                renderShop();
                renderSkins();
                renderCases();
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

// ========== УВЕДОМЛЕНИЯ ==========
function showNotif(title, msg, type = 'success') {
    const box = document.getElementById('notifications');
    if (!box) return;
    
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.innerHTML = `<strong>${title}</strong><br>${msg}`;
    box.appendChild(n);
    
    setTimeout(() => {
        n.style.animation = 'notificationSlide 0.3s reverse';
        setTimeout(() => n.remove(), 300);
    }, 3000);
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
    
    const indicator = document.getElementById('turboIndicator');
    if (indicator) indicator.style.display = 'block';
    
    const clicker = document.getElementById('clickBtn');
    if (clicker) clicker.classList.add('turbo-active');
    
    showNotif('⚡ ТУРБО!', 'x2 на 30 секунд', 'warning');
    
    updateUI();
    updateTurboUI();
    saveGame();
    return true;
}

function updateTurboUI() {
    const turboStatus = document.getElementById('turboStatus');
    const turboTimer = document.getElementById('turboTimer');
    const turboProgress = document.getElementById('turboProgress');
    const turboIndicator = document.getElementById('turboIndicator');
    const clicker = document.getElementById('clickBtn');
    
    if (!turboStatus || !turboTimer || !turboProgress) return;
    
    if (gameState.turbo.active && gameState.turbo.timeLeft > 0) {
        turboStatus.innerHTML = `<span class="turbo-icon">⚡</span><span>Турбо АКТИВЕН (x2)</span>`;
        const seconds = gameState.turbo.timeLeft;
        turboTimer.textContent = `0:${seconds.toString().padStart(2, '0')}`;
        const progress = (seconds / gameState.turbo.maxTime) * 100;
        turboProgress.style.width = progress + '%';
        if (turboIndicator) turboIndicator.style.display = 'block';
        if (clicker) clicker.classList.add('turbo-active');
    } else {
        turboStatus.innerHTML = `<span class="turbo-icon">⚡</span><span>Турбо выключен</span>`;
        turboTimer.textContent = '0:00';
        turboProgress.style.width = '0%';
        if (turboIndicator) turboIndicator.style.display = 'none';
        if (clicker) clicker.classList.remove('turbo-active');
    }
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Игра запускается...');
    
    loadLeaderboard();
    
    if (loadGame() && gameState.nickname) {
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
        saveGame();
        saveLeaderboard();
        showNotif('✅ Добро пожаловать!', `Привет, ${name}!`);
        updateUI();
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
            
            if (tab === 'leaders') renderLeaderboard();
            else if (tab === 'profile') renderTitles();
            else if (tab === 'pass') {
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
        const gain = gameState.power * multiplier;
        
        gameState.balance += gain;
        gameState.totalClicks++;
        gameState.totalEarned += gain;
        
        const btn = document.getElementById('clickBtn');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
        
        checkTitles();
        updateQuestProgress('clicks', 1);
        updateQuestProgress('earn', gain);
        
        updateUI();
    });
    
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance += 500;
            gameState.lastDaily = today;
            gameState.daysActive++;
            showNotif('📅 Награда!', '+500 монет');
            updateUI();
            saveGame();
            saveLeaderboard();
        } else {
            showNotif('⏰ Уже получали', 'Завтра будет снова', 'warning');
        }
    });
    
    document.getElementById('floatingGift').addEventListener('click', () => {
        const now = Date.now();
        const last = gameState.lastGift || 0;
        
        if (now - last >= 86400000) {
            gameState.balance += 50;
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
        
        let msg = '';
        
        switch(code) {
            case 'START':
                gameState.balance += 100;
                msg = '+100💰';
                break;
            case 'GIFT':
                gameState.balance += 300;
                msg = '+300💰';
                break;
            case 'POWER':
                gameState.power++;
                msg = 'Сила +1';
                break;
            case 'TURBO':
                activateTurbo();
                msg = 'Турбо активирован!';
                break;
            default:
                showNotif('❌ Неверный код', '', 'error');
                return;
        }
        
        gameState.usedCodes.push(code);
        document.getElementById('promoInput').value = '';
        showNotif('✅ Промокод!', msg);
        checkTitles();
        updateUI();
        saveGame();
        saveLeaderboard();
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
        if (gameState.autoclickers === 0) {
            showNotif('❌ Ошибка', 'Купите автокликер', 'error');
            return;
        }
        
        if (gameState.autoClicker.enabled) {
            gameState.autoClicker.enabled = false;
            showNotif('⏸️ Автокликер остановлен', '', 'info');
        } else {
            gameState.autoClicker.enabled = true;
            gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime;
            showNotif('▶️ Автокликер запущен', `Будет работать ${gameState.autoClicker.maxTime} сек`, 'success');
        }
        
        updateAutoMenu();
        saveGame();
    });
    
    document.getElementById('autoMenuUpgrade').addEventListener('click', () => {
        const level = gameState.autoClicker.level;
        const price = 100 * level;
        
        if (gameState.balance >= price) {
            gameState.balance -= price;
            gameState.autoClicker.level = level + 1;
            gameState.autoClicker.maxTime += 30;
            showNotif('⬆️ Улучшено!', `Уровень ${gameState.autoClicker.level}`, 'success');
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
    });
}

// ========== ОБНОВЛЕНИЕ МЕНЮ АВТОКЛИКЕРА ==========
function updateAutoMenu() {
    const level = gameState.autoClicker.level;
    const count = gameState.autoclickers;
    const power = gameState.power;
    
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
        const timeLeft = gameState.autoClicker.timeLeft;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('autoMenuTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const maxTime = gameState.autoClicker.maxTime;
        const progress = maxTime > 0 ? ((maxTime - timeLeft) / maxTime) * 100 : 0;
        document.getElementById('autoMenuProgress').style.width = Math.min(100, Math.max(0, progress)) + '%';
    } else {
        const maxTime = gameState.autoClicker.maxTime;
        const minutes = Math.floor(maxTime / 60);
        const seconds = maxTime % 60;
        document.getElementById('autoMenuTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('autoMenuProgress').style.width = '0%';
    }
    
    updateTurboUI();
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
    if (type === 'auto' && gameState.balance >= 50) {
        gameState.balance -= 50;
        gameState.autoclickers++;
        showNotif('✅ Куплено!', `Автокликер +${gameState.autoclickers}`);
        updateQuestProgress('auto', 1);
    } else if (type === 'power' && gameState.balance >= 100) {
        gameState.balance -= 100;
        gameState.power++;
        showNotif('✅ Куплено!', `Сила +${gameState.power}`);
    } else if (type === 'turbo' && gameState.balance >= 50) {
        gameState.balance -= 50;
        activateTurbo();
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
        { id: 'green', name: 'Зеленый', price: 200 },
        { id: 'gold', name: 'Золотой', price: 500 }
    ];
    
    grid.innerHTML = skins.map(s => {
        const owned = gameState.ownedSkins.includes(s.id);
        return `
            <div class="skin-card" data-skin="${s.id}" data-price="${s.price}">
                <div class="skin-preview skin-${s.id}"></div>
                <div class="skin-name">${s.name}</div>
                <div class="skin-price">${owned ? '✓ Есть' : s.price + '💰'}</div>
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
            
            if (gameState.ownedSkins.includes(id)) {
                gameState.skin = id;
                document.getElementById('clickBtn').className = `clicker skin-${id}`;
                renderSkins();
                showNotif('🎨 Скин надет!');
            } else if (gameState.balance >= price) {
                gameState.balance -= price;
                gameState.ownedSkins.push(id);
                gameState.skin = id;
                renderSkins();
                updateUI();
                showNotif('✅ Скин куплен!');
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
    
    if (gameState.balance < price) {
        showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        return;
    }
    
    showCaseAnimation(type, () => {
        gameState.balance -= price;
        gameState.casesOpened++;
        gameState.balance += reward;
        
        if (reward > gameState.bestCaseWin) {
            gameState.bestCaseWin = reward;
        }
        
        document.getElementById('caseResult').innerHTML = `+${formatNumber(reward)}💰`;
        document.getElementById('caseText').textContent = 'Вы выиграли!';
        
        updateQuestProgress('case', 1);
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
        
        if (gameState.turbo.active && gameState.turbo.timeLeft > 0) {
            gameState.turbo.timeLeft--;
            if (gameState.turbo.timeLeft <= 0) {
                gameState.turbo.active = false;
                updateTurboUI();
            }
        }
        
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            const multiplier = gameState.turbo.active ? gameState.turbo.multiplier : 1;
            const gain = gameState.autoClicker.level * gameState.power * multiplier;
            
            gameState.balance += gain;
            gameState.totalEarned += gain;
            
            updateQuestProgress('earn', gain);
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
            }
            
            updateAutoMenu();
        }
        
        updateUI();
    }, 1000);
    
    setInterval(() => {
        if (gameState.autoClicker.enabled) updateAutoMenu();
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
    
    const lvl = Math.floor(gameState.totalClicks / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${lvl}`;
    document.getElementById('profileLevel').textContent = `Уровень ${lvl}`;
    
    updateGiftTimer();
    
    if (gameState.settings.autoSave && gameState.nickname) {
        saveGame();
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
window.claimQuestReward = claimQuestReward;
window.buyItem = buyItem;
window.openCase = openCase;

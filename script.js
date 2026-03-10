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
    friends: [],
    lastDaily: null,
    lastGift: null,
    usedCodes: [],
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
    version: '6.5'
};

// ========== БАЗА ДАННЫХ ИГРОКОВ ==========
let playersDB = [];
let leaderboardDB = [];

function loadPlayersDB() {
    const saved = localStorage.getItem('players_db');
    if (saved) {
        try {
            playersDB = JSON.parse(saved);
        } catch (e) {
            playersDB = [];
        }
    } else {
        playersDB = [];
    }
}

function savePlayersDB() {
    localStorage.setItem('players_db', JSON.stringify(playersDB));
}

function isNicknameUnique(nickname) {
    return !playersDB.some(p => p.name.toLowerCase() === nickname.toLowerCase());
}

function registerPlayer(nickname) {
    const playerData = {
        name: nickname,
        registered: Date.now(),
        lastSeen: Date.now(),
        balance: gameState.balance,
        totalClicks: gameState.totalClicks,
        totalEarned: gameState.totalEarned,
        autoclickers: gameState.autoclickers,
        power: gameState.power,
        casesOpened: gameState.casesOpened,
        bestCaseWin: gameState.bestCaseWin,
        daysActive: gameState.daysActive,
        skin: gameState.skin,
        ownedSkins: gameState.ownedSkins,
        title: gameState.title,
        titles: gameState.titles,
        autoClickerLevel: gameState.autoClicker.level
    };
    
    playersDB.push(playerData);
    savePlayersDB();
}

function updatePlayerData() {
    const index = playersDB.findIndex(p => p.name === gameState.nickname);
    if (index >= 0) {
        playersDB[index] = {
            ...playersDB[index],
            lastSeen: Date.now(),
            balance: gameState.balance,
            totalClicks: gameState.totalClicks,
            totalEarned: gameState.totalEarned,
            autoclickers: gameState.autoclickers,
            power: gameState.power,
            casesOpened: gameState.casesOpened,
            bestCaseWin: gameState.bestCaseWin,
            daysActive: gameState.daysActive,
            skin: gameState.skin,
            ownedSkins: gameState.ownedSkins,
            title: gameState.title,
            titles: gameState.titles,
            autoClickerLevel: gameState.autoClicker.level
        };
        savePlayersDB();
    }
}

// ========== ПРОСМОТР ПРОФИЛЯ ИГРОКА ==========
function viewPlayerProfile(playerName) {
    const player = playersDB.find(p => p.name === playerName);
    if (!player) {
        showNotif('❌ Ошибка', 'Игрок не найден', 'error');
        return;
    }
    
    const level = Math.floor(player.totalClicks / 100) + 1;
    
    const profileHTML = `
        <div class="player-profile-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <div class="profile-modal-avatar">👤</div>
                    <div class="profile-modal-info">
                        <h2>${player.name}</h2>
                        <div class="profile-modal-title">${player.title}</div>
                    </div>
                    <button class="profile-modal-close" onclick="closeProfileModal()">✕</button>
                </div>
                
                <div class="profile-modal-stats">
                    <div class="profile-stat-row">
                        <span>Уровень:</span>
                        <span class="stat-value">${level}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>💰 Баланс:</span>
                        <span class="stat-value">${formatNumber(player.balance)}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>👆 Всего кликов:</span>
                        <span class="stat-value">${formatNumber(player.totalClicks)}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>📈 Заработано:</span>
                        <span class="stat-value">${formatNumber(player.totalEarned)}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>🤖 Автокликеров:</span>
                        <span class="stat-value">${player.autoclickers}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>⚡ Сила клика:</span>
                        <span class="stat-value">${player.power}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>🎁 Кейсов открыто:</span>
                        <span class="stat-value">${player.casesOpened}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>🏆 Лучший выигрыш:</span>
                        <span class="stat-value">${formatNumber(player.bestCaseWin)}💰</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>📅 Дней в игре:</span>
                        <span class="stat-value">${player.daysActive}</span>
                    </div>
                </div>
                
                <div class="profile-modal-titles">
                    <h4>Полученные титулы (${player.titles.length})</h4>
                    <div class="profile-titles-grid">
                        ${player.titles.map(title => `
                            <div class="profile-title-item">${title}</div>
                        `).join('')}
                    </div>
                </div>
                
                ${player.name !== gameState.nickname ? `
                    <div class="profile-modal-actions">
                        <button class="btn-primary" onclick="addFriend('${player.name}')">➕ Добавить в друзья</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'profileModal';
    modalContainer.innerHTML = profileHTML;
    document.body.appendChild(modalContainer);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.remove();
}

function addFriend(playerName) {
    if (!gameState.friends) gameState.friends = [];
    if (gameState.friends.includes(playerName)) {
        showNotif('❌ Уже в друзьях', '', 'error');
        return;
    }
    gameState.friends.push(playerName);
    showNotif('✅ Добавлен в друзья', playerName, 'success');
    closeProfileModal();
    saveGame();
}

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
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
            <div class="leader-row" onclick="viewPlayerProfile('${player.name}')">
                <span class="leader-rank ${rankClass}">${index + 1}</span>
                <span class="leader-name">
                    ${player.name || 'Игрок'}
                    ${player.title ? `<span class="leader-title">${player.title}</span>` : ''}
                </span>
                <span class="leader-score">💰 ${formatNumber(score)}</span>
            </div>
        `;
    }).join('');
}

// ========== ТИТУЛЫ ==========
const titles = [
    { id: 'novice', name: '👆 Новичок', desc: 'Начать играть', clicks: 0, icon: '👆' },
    { id: 'clicker', name: '🤚 Кликер', desc: 'Сделать 100 кликов', clicks: 100, icon: '🤚' },
    { id: 'tapper', name: '👆 Тапёр', desc: 'Сделать 250 кликов', clicks: 250, icon: '👆' },
    { id: 'pro', name: '✋ Профи', desc: 'Сделать 500 кликов', clicks: 500, icon: '✋' },
    { id: 'expert', name: '🖐️ Эксперт', desc: 'Сделать 1000 кликов', clicks: 1000, icon: '🖐️' },
    { id: 'master', name: '👊 Мастер', desc: 'Сделать 2500 кликов', clicks: 2500, icon: '👊' },
    { id: 'grandmaster', name: '🥊 Грандмастер', desc: 'Сделать 5000 кликов', clicks: 5000, icon: '🥊' },
    { id: 'legend', name: '👑 Легенда', desc: 'Сделать 10000 кликов', clicks: 10000, icon: '👑' },
    { id: 'mythic', name: '⚡ Мифический', desc: 'Сделать 25000 кликов', clicks: 25000, icon: '⚡' },
    { id: 'god', name: '✨ Бог клика', desc: 'Сделать 50000 кликов', clicks: 50000, icon: '✨' },
    { id: 'almighty', name: '🔥 Всемогущий', desc: 'Сделать 100000 кликов', clicks: 100000, icon: '🔥' },
    { id: 'poor', name: '🥉 Бедняк', desc: 'Иметь 0 монет', balance: 0, icon: '🥉' },
    { id: 'rich', name: '🥈 Богач', desc: 'Накопить 10000 монет', balance: 10000, icon: '🥈' },
    { id: 'millionaire', name: '🥇 Миллионер', desc: 'Накопить 100000 монет', balance: 100000, icon: '🥇' },
    { id: 'billionaire', name: '💎 Миллиардер', desc: 'Накопить 1000000 монет', balance: 1000000, icon: '💎' },
    { id: 'oligarch', name: '👑 Олигарх', desc: 'Накопить 10000000 монет', balance: 10000000, icon: '👑' },
    { id: 'auto_noob', name: '⚙️ Механик', desc: 'Купить 1 автокликер', autoclickers: 1, icon: '⚙️' },
    { id: 'auto_pro', name: '🔧 Инженер', desc: 'Купить 10 автокликеров', autoclickers: 10, icon: '🔧' },
    { id: 'auto_master', name: '🛠️ Техник', desc: 'Купить 25 автокликеров', autoclickers: 25, icon: '🛠️' },
    { id: 'auto_expert', name: '⚡ Кибернетик', desc: 'Купить 50 автокликеров', autoclickers: 50, icon: '⚡' },
    { id: 'auto_god', name: '🤖 Повелитель машин', desc: 'Купить 100 автокликеров', autoclickers: 100, icon: '🤖' },
    { id: 'case_noob', name: '🎲 Игрок', desc: 'Открыть 1 кейс', cases: 1, icon: '🎲' },
    { id: 'case_pro', name: '🎰 Шулер', desc: 'Открыть 10 кейсов', cases: 10, icon: '🎰' },
    { id: 'case_master', name: '🎯 Азартный', desc: 'Открыть 25 кейсов', cases: 25, icon: '🎯' },
    { id: 'case_expert', name: '💫 Везунчик', desc: 'Открыть 50 кейсов', cases: 50, icon: '💫' },
    { id: 'case_god', name: '👑 Король удачи', desc: 'Открыть 100 кейсов', cases: 100, icon: '👑' },
    { id: 'day1', name: '📅 Новичок', desc: 'Играть 1 день', days: 1, icon: '📅' },
    { id: 'day7', name: '📆 Завсегдатай', desc: 'Играть 7 дней', days: 7, icon: '📆' },
    { id: 'day30', name: '🗓️ Ветеран', desc: 'Играть 30 дней', days: 30, icon: '🗓️' },
    { id: 'day100', name: '📅 Старожил', desc: 'Играть 100 дней', days: 100, icon: '📅' },
    { id: 'day365', name: '🎂 Легенда', desc: 'Играть 365 дней', days: 365, icon: '🎂' }
];

function checkTitles() {
    let newTitles = [];
    
    titles.forEach(title => {
        if (gameState.titles.includes(title.name)) return;
        
        let earned = false;
        
        if (title.clicks !== undefined && gameState.totalClicks >= title.clicks) earned = true;
        if (title.balance !== undefined && gameState.balance >= title.balance) earned = true;
        if (title.autoclickers !== undefined && gameState.autoclickers >= title.autoclickers) earned = true;
        if (title.cases !== undefined && gameState.casesOpened >= title.cases) earned = true;
        if (title.days !== undefined && gameState.daysActive >= title.days) earned = true;
        
        if (earned) {
            newTitles.push(title.name);
            gameState.titles.push(title.name);
            showNotif('🏆 Новый титул!', title.name, 'warning');
        }
    });
    
    if (newTitles.length > 0) {
        renderTitles();
        saveGame();
        updatePlayerData();
    }
}

function selectTitle(titleName) {
    if (gameState.titles.includes(titleName)) {
        gameState.title = titleName;
        renderTitles();
        showNotif('✅ Титул надет!', titleName, 'success');
        saveGame();
        updatePlayerData();
        saveLeaderboard();
    }
}

function renderTitles() {
    const container = document.getElementById('profileTitles');
    if (!container) return;
    
    const clickTitles = titles.filter(t => t.clicks !== undefined);
    const balanceTitles = titles.filter(t => t.balance !== undefined);
    const autoTitles = titles.filter(t => t.autoclickers !== undefined);
    const caseTitles = titles.filter(t => t.cases !== undefined);
    const dayTitles = titles.filter(t => t.days !== undefined);
    
    container.innerHTML = `
        <div class="current-title" onclick="selectTitle('${gameState.title}')">
            <span class="title-label">Текущий титул:</span>
            <span class="title-value">${gameState.title}</span>
        </div>
        
        <div class="titles-category">
            <h4>🏆 За клики</h4>
            <div class="titles-grid">
                ${clickTitles.map(title => {
                    const has = gameState.titles.includes(title.name);
                    const isCurrent = gameState.title === title.name;
                    return `
                        <div class="title-item ${has ? 'owned' : ''} ${isCurrent ? 'current' : ''}" 
                             onclick="${has ? `selectTitle('${title.name}')` : ''}"
                             title="${title.desc}">
                            <span class="title-icon">${title.icon}</span>
                            <span class="title-name">${title.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="titles-category">
            <h4>💰 За монеты</h4>
            <div class="titles-grid">
                ${balanceTitles.map(title => {
                    const has = gameState.titles.includes(title.name);
                    const isCurrent = gameState.title === title.name;
                    return `
                        <div class="title-item ${has ? 'owned' : ''} ${isCurrent ? 'current' : ''}" 
                             onclick="${has ? `selectTitle('${title.name}')` : ''}"
                             title="${title.desc}">
                            <span class="title-icon">${title.icon}</span>
                            <span class="title-name">${title.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="titles-category">
            <h4>🤖 За автокликеры</h4>
            <div class="titles-grid">
                ${autoTitles.map(title => {
                    const has = gameState.titles.includes(title.name);
                    const isCurrent = gameState.title === title.name;
                    return `
                        <div class="title-item ${has ? 'owned' : ''} ${isCurrent ? 'current' : ''}" 
                             onclick="${has ? `selectTitle('${title.name}')` : ''}"
                             title="${title.desc}">
                            <span class="title-icon">${title.icon}</span>
                            <span class="title-name">${title.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="titles-category">
            <h4>🎁 За кейсы</h4>
            <div class="titles-grid">
                ${caseTitles.map(title => {
                    const has = gameState.titles.includes(title.name);
                    const isCurrent = gameState.title === title.name;
                    return `
                        <div class="title-item ${has ? 'owned' : ''} ${isCurrent ? 'current' : ''}" 
                             onclick="${has ? `selectTitle('${title.name}')` : ''}"
                             title="${title.desc}">
                            <span class="title-icon">${title.icon}</span>
                            <span class="title-name">${title.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="titles-category">
            <h4>📅 За дни</h4>
            <div class="titles-grid">
                ${dayTitles.map(title => {
                    const has = gameState.titles.includes(title.name);
                    const isCurrent = gameState.title === title.name;
                    return `
                        <div class="title-item ${has ? 'owned' : ''} ${isCurrent ? 'current' : ''}" 
                             onclick="${has ? `selectTitle('${title.name}')` : ''}"
                             title="${title.desc}">
                            <span class="title-icon">${title.icon}</span>
                            <span class="title-name">${title.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
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
        updatePlayerData();
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
                
                document.getElementById('playerName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('profileName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                updateUI();
                renderShop();
                renderSkins();
                renderCases();
                renderTitles();
                updatePlayerData();
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
    if (!gameState.settings.notifications && type !== 'error') return;
    
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
    
    if (gameState.settings.vibration && type === 'success') {
        navigator.vibrate?.(50);
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
    
    loadPlayersDB();
    loadLeaderboard();
    
    if (loadGame() && gameState.nickname) {
        document.getElementById('playerName').textContent = gameState.nickname;
        document.getElementById('profileName').textContent = gameState.nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        updatePlayerData();
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
        
        if (!isNicknameUnique(name)) {
            showNotif('❌ Ошибка', 'Этот ник уже занят', 'error');
            return;
        }
        
        gameState.nickname = name;
        document.getElementById('playerName').textContent = name;
        document.getElementById('profileName').textContent = name;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        registerPlayer(name);
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
        
        updateUI();
    });
    
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance += 500;
            gameState.lastDaily = today;
            gameState.daysActive++;
            showNotif('📅 Награда!', '+500 монет');
            checkTitles();
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

window.buyItem = function(type) {
    if (type === 'auto') {
        if (gameState.balance >= 50) {
            gameState.balance -= 50;
            gameState.autoclickers++;
            showNotif('✅ Куплено!', `Автокликер +${gameState.autoclickers}`);
            checkTitles();
        } else {
            showNotif('❌ Недостаточно', 'Нужно 50💰', 'error');
            return;
        }
    } else if (type === 'power') {
        if (gameState.balance >= 100) {
            gameState.balance -= 100;
            gameState.power++;
            showNotif('✅ Куплено!', `Сила +${gameState.power}`);
        } else {
            showNotif('❌ Недостаточно', 'Нужно 100💰', 'error');
            return;
        }
    } else if (type === 'turbo') {
        if (gameState.balance >= 50) {
            gameState.balance -= 50;
            activateTurbo();
        } else {
            showNotif('❌ Недостаточно', 'Нужно 50💰', 'error');
            return;
        }
    }
    
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

window.openCase = function(type) {
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
window.buyItem = buyItem;
window.openCase = openCase;
window.selectTitle = selectTitle;
window.viewPlayerProfile = viewPlayerProfile;
window.closeProfileModal = closeProfileModal;
window.addFriend = addFriend;

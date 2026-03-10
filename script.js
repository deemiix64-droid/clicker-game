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
    lastDaily: null,
    lastGift: null,
    usedCodes: [],
    settings: {
        notifications: true,
        vibration: true,
        autoSave: true
    },
    autoClicker: {
        enabled: false,
        timeLeft: 0,
        maxTime: 120,
        level: 1
    },
    version: '4.9'
};

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
let leaderboardDB = [];

// Загрузка лидеров
function loadLeaderboard() {
    const saved = localStorage.getItem('leaderboard_db');
    if (saved) {
        try {
            leaderboardDB = JSON.parse(saved);
            // Фильтруем только реальных игроков
            leaderboardDB = leaderboardDB.filter(player => 
                player.name && 
                player.name !== 'Бот' && 
                player.name !== 'Игрок' &&
                player.name.length >= 3
            );
        } catch (e) {
            leaderboardDB = [];
        }
    } else {
        leaderboardDB = [];
    }
    
    // Сортируем по убыванию
    leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
    // Оставляем только топ-20
    if (leaderboardDB.length > 20) leaderboardDB = leaderboardDB.slice(0, 20);
    
    saveLeaderboard();
    renderLeaderboard();
}

// Сохранение лидеров
function saveLeaderboard() {
    try {
        if (gameState.nickname && gameState.nickname.length >= 3) {
            const playerScore = isNaN(gameState.balance) ? 0 : Math.floor(gameState.balance);
            
            const existingIndex = leaderboardDB.findIndex(p => p.name === gameState.nickname);
            
            if (existingIndex >= 0) {
                leaderboardDB[existingIndex].score = playerScore;
                leaderboardDB[existingIndex].lastUpdate = Date.now();
            } else {
                leaderboardDB.push({
                    name: gameState.nickname,
                    score: playerScore,
                    joined: Date.now(),
                    lastUpdate: Date.now()
                });
            }
            
            // Удаляем игроков с NaN или отрицательным score
            leaderboardDB = leaderboardDB.filter(p => 
                p.name && 
                p.name.length >= 3 && 
                !isNaN(p.score) && 
                p.score >= 0
            );
            
            // Сортируем
            leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
            
            // Оставляем топ-20
            if (leaderboardDB.length > 20) {
                leaderboardDB = leaderboardDB.slice(0, 20);
            }
        }
        
        localStorage.setItem('leaderboard_db', JSON.stringify(leaderboardDB));
        renderLeaderboard();
    } catch (e) {
        console.error('Ошибка сохранения лидеров:', e);
    }
}

// Отображение лидеров
function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    
    if (!leaderboardDB || leaderboardDB.length === 0) {
        board.innerHTML = `
            <div class="leader-row">
                <span class="leader-name">Пока нет игроков</span>
            </div>
            <div class="leader-row">
                <span class="leader-name">Будьте первым!</span>
            </div>
        `;
        return;
    }
    
    board.innerHTML = leaderboardDB.map((player, index) => {
        const score = !isNaN(player.score) && player.score >= 0 ? player.score : 0;
        
        return `
            <div class="leader-row">
                <span class="rank ${index < 3 ? 'top' : ''}">${index + 1}</span>
                <span class="leader-name">${player.name || 'Игрок'}</span>
                <span class="leader-score">💰 ${formatNumber(score)}</span>
            </div>
        `;
    }).join('');
}

// Форматирование чисел
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
                
                document.getElementById('playerName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('profileName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                updateUI();
                renderShop();
                renderSkins();
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
        
        leaderboardDB = leaderboardDB.filter(p => p.name && p.name.length >= 3);
        
        saveGame();
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
            
            if (tab === 'leaders') {
                renderLeaderboard();
            }
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
        const gain = isNaN(gameState.power) ? 1 : gameState.power;
        
        gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + gain;
        gameState.totalClicks = (isNaN(gameState.totalClicks) ? 0 : gameState.totalClicks) + 1;
        gameState.totalEarned = (isNaN(gameState.totalEarned) ? 0 : gameState.totalEarned) + gain;
        
        const btn = document.getElementById('clickBtn');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
        
        updateUI();
    });
    
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + 500;
            gameState.lastDaily = today;
            gameState.daysActive = (isNaN(gameState.daysActive) ? 1 : gameState.daysActive) + 1;
            showNotif('📅 Награда!', '+500 монет');
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
            default:
                showNotif('❌ Неверный код', '', 'error');
                return;
        }
        
        if (success) {
            gameState.usedCodes.push(code);
            document.getElementById('promoInput').value = '';
            showNotif('✅ Промокод!', msg);
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
    
    document.getElementById('autoMenuStart').addEventListener('click', () => {
        if (gameState.autoclickers === 0 || isNaN(gameState.autoclickers)) {
            showNotif('❌ Ошибка', 'Купите автокликер', 'error');
            return;
        }
        
        if (gameState.autoClicker.enabled) {
            gameState.autoClicker.enabled = false;
        } else {
            gameState.autoClicker.enabled = true;
            gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime || 120;
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
            showNotif('⬆️ Улучшено!', `Уровень ${gameState.autoClicker.level}`);
            updateUI();
            updateAutoMenu();
            saveGame();
            saveLeaderboard();
        } else {
            showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        }
    });
    
    document.getElementById('autoMenuBoost').addEventListener('click', () => {
        showNotif('⚡ Турбо', 'Скоро будет доступно', 'info');
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
    startBtn.innerHTML = gameState.autoClicker.enabled ? 
        '<span>⏹️</span><span>Остановить</span>' : 
        '<span>▶️</span><span>Запустить</span>';
    
    if (gameState.autoClicker.enabled) {
        const timeLeft = isNaN(gameState.autoClicker.timeLeft) ? 0 : gameState.autoClicker.timeLeft;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('autoMenuTimer').textContent = `${m}:${s.toString().padStart(2,'0')}`;
        const maxTime = isNaN(gameState.autoClicker.maxTime) ? 120 : gameState.autoClicker.maxTime;
        const progress = maxTime > 0 ? (timeLeft / maxTime) * 100 : 0;
        document.getElementById('autoMenuProgress').style.width = Math.max(0, Math.min(100, progress)) + '%';
    } else {
        const maxTime = isNaN(gameState.autoClicker.maxTime) ? 120 : gameState.autoClicker.maxTime;
        const m = Math.floor(maxTime / 60);
        const s = maxTime % 60;
        document.getElementById('autoMenuTimer').textContent = `${m}:${s.toString().padStart(2,'0')}`;
        document.getElementById('autoMenuProgress').style.width = '100%';
    }
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
        n.style.animation = 'slide 0.3s reverse';
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
        <div class="shop-item">
            <span>🤖</span>
            <span>Автокликер</span>
            <span>+1/сек</span>
            <button onclick="buyItem('auto')">50💰</button>
        </div>
        <div class="shop-item">
            <span>💪</span>
            <span>Сила</span>
            <span>+1 к силе</span>
            <button onclick="buyItem('power')">100💰</button>
        </div>
    `;
}

window.buyItem = (type) => {
    const balance = isNaN(gameState.balance) ? 0 : gameState.balance;
    
    if (type === 'auto' && balance >= 50) {
        gameState.balance = balance - 50;
        gameState.autoclickers = (isNaN(gameState.autoclickers) ? 0 : gameState.autoclickers) + 1;
        showNotif('✅ Куплено!', `Автокликер +${gameState.autoclickers}`);
    } else if (type === 'power' && balance >= 100) {
        gameState.balance = balance - 100;
        gameState.power = (isNaN(gameState.power) ? 1 : gameState.power) + 1;
        showNotif('✅ Куплено!', `Сила +${gameState.power}`);
    } else {
        showNotif('❌ Недостаточно', '', 'error');
        return;
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
            <div class="skin-item" data-skin="${s.id}" data-price="${s.price}">
                <div class="skin-preview skin-${s.id}"></div>
                <div class="skin-name">${s.name}</div>
                <div class="skin-price">${owned ? '✓ Есть' : s.price + '💰'}</div>
                <button ${owned ? 'disabled' : ''}>${owned ? 'В коллекции' : 'Купить'}</button>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.skin-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.skin;
            const price = parseInt(item.dataset.price);
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
            <button onclick="openCase('normal')">Открыть</button>
        </div>
        <div class="case-card rare">
            <div class="case-icon">💎</div>
            <div class="case-name">Редкий</div>
            <div class="case-price">500💰</div>
            <button onclick="openCase('rare')">Открыть</button>
        </div>
        <div class="case-card epic">
            <div class="case-icon">👑</div>
            <div class="case-name">Эпический</div>
            <div class="case-price">1000💰</div>
            <button onclick="openCase('epic')">Открыть</button>
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
    
    showCaseAnim(type, () => {
        gameState.balance = balance - price;
        gameState.casesOpened = (isNaN(gameState.casesOpened) ? 0 : gameState.casesOpened) + 1;
        gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + reward;
        
        if (reward > (isNaN(gameState.bestCaseWin) ? 0 : gameState.bestCaseWin)) {
            gameState.bestCaseWin = reward;
        }
        
        document.getElementById('caseResult').innerHTML = `+${formatNumber(reward)}💰`;
        document.getElementById('caseText').textContent = 'Вы выиграли!';
        
        updateUI();
        saveGame();
        saveLeaderboard();
    });
};

function showCaseAnim(type, cb) {
    const anim = document.getElementById('caseAnimation');
    const box = document.getElementById('caseBox');
    const text = document.getElementById('caseText');
    const result = document.getElementById('caseResult');
    
    box.className = 'case-box';
    box.textContent = type === 'normal' ? '📦' : type === 'rare' ? '💎' : '👑';
    text.textContent = 'Открываем...';
    result.innerHTML = '';
    
    anim.style.display = 'flex';
    
    setTimeout(() => {
        box.classList.add('opening');
    }, 100);
    
    setTimeout(() => {
        cb();
    }, 1500);
}

// ========== ПРОМОКОДЫ ==========
function renderPromoList() {
    const list = document.getElementById('promoList');
    if (!list) return;
    
    list.innerHTML = `
        <div class="promo-item"><span>START</span><span>+100💰</span></div>
        <div class="promo-item"><span>GIFT</span><span>+300💰</span></div>
        <div class="promo-item"><span>POWER</span><span>Сила +1</span></div>
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
        
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            const count = isNaN(gameState.autoclickers) ? 0 : gameState.autoclickers;
            const level = isNaN(gameState.autoClicker.level) ? 1 : gameState.autoClicker.level;
            const power = isNaN(gameState.power) ? 1 : gameState.power;
            
            if (count > 0) {
                const inc = level * power;
                gameState.balance = (isNaN(gameState.balance) ? 0 : gameState.balance) + inc;
                gameState.totalEarned = (isNaN(gameState.totalEarned) ? 0 : gameState.totalEarned) + inc;
            }
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
            }
            
            updateAutoMenu();
        }
        
        updateUI();
    }, 1000);
    
    setInterval(() => {
        if (gameState.autoClicker.enabled) {
            updateAutoMenu();
        }
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
    
    const lvl = Math.floor((isNaN(gameState.totalClicks) ? 0 : gameState.totalClicks) / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${lvl}`;
    document.getElementById('profileLevel').textContent = `Уровень ${lvl}`;
    
    updateGiftTimer();
    
    if (gameState.settings.autoSave && gameState.nickname) {
        saveGame();
    }
}

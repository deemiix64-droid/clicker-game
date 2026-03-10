// Состояние игры
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
    version: '4.8'
};

// База лидеров
let leaderboardDB = [];

// Загрузка лидеров
function loadLeaderboard() {
    const saved = localStorage.getItem('leaderboard_db');
    if (saved) {
        leaderboardDB = JSON.parse(saved);
    } else {
        // Демо данные
        leaderboardDB = [
            { name: 'Киберпанкер', score: 15420 },
            { name: 'КликерМастер', score: 12350 },
            { name: 'Игрок2026', score: 9870 },
            { name: 'Новичок', score: 5430 },
            { name: 'Профи', score: 3210 }
        ];
    }
    renderLeaderboard();
}

// Сохранение лидеров
function saveLeaderboard() {
    // Добавляем текущего игрока
    if (gameState.nickname) {
        const existing = leaderboardDB.findIndex(l => l.name === gameState.nickname);
        if (existing >= 0) {
            leaderboardDB[existing].score = gameState.balance;
        } else {
            leaderboardDB.push({ name: gameState.nickname, score: gameState.balance });
        }
        
        // Сортируем
        leaderboardDB.sort((a, b) => b.score - a.score);
        // Оставляем топ-20
        if (leaderboardDB.length > 20) leaderboardDB = leaderboardDB.slice(0, 20);
    }
    
    localStorage.setItem('leaderboard_db', JSON.stringify(leaderboardDB));
    renderLeaderboard();
}

// Отображение лидеров
function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    
    if (leaderboardDB.length === 0) {
        board.innerHTML = '<div class="leader-row"><span class="leader-name">Пока нет игроков</span></div>';
        return;
    }
    
    board.innerHTML = leaderboardDB.map((player, index) => `
        <div class="leader-row">
            <span class="rank">${index + 1}</span>
            <span class="leader-name">${player.name}</span>
            <span class="leader-score">💰 ${player.score}</span>
        </div>
    `).join('');
}

// Сохранение
function saveGame() {
    localStorage.setItem('clicker_save', JSON.stringify(gameState));
    saveLeaderboard();
}

function loadGame() {
    const saved = localStorage.getItem('clicker_save');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState = { ...gameState, ...data };
            return true;
        } catch (e) {}
    }
    return false;
}

// Загрузка файла
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

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем лидеров
    loadLeaderboard();
    
    // Загружаем сохранение
    if (loadGame() && gameState.nickname) {
        document.getElementById('playerName').textContent = gameState.nickname;
        document.getElementById('profileName').textContent = gameState.nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    }
    
    // Тема
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '🌙' : '☀️';
    
    // Инициализация
    initEvents();
    
    renderShop();
    renderSkins();
    renderCases();
    renderPromoList();
    
    startLoop();
});

// События
function initEvents() {
    // Вход
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
        
        saveGame();
        saveLeaderboard();
        showNotif('✅ Добро пожаловать!', `Привет, ${name}!`);
    });
    
    // Загрузка файла
    document.getElementById('loadGameFile').addEventListener('click', loadClickFile);
    
    // Меню
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
    
    // Меню автокликера
    document.getElementById('autoMenuBtn').addEventListener('click', () => {
        document.getElementById('autoMenu').classList.add('active');
        updateAutoMenu();
    });
    
    document.getElementById('closeAutoMenu').addEventListener('click', () => {
        document.getElementById('autoMenu').classList.remove('active');
    });
    
    // Табы
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const tab = item.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            
            document.getElementById('sideMenu').classList.remove('active');
            
            // Обновляем лидеров при открытии
            if (tab === 'leaders') {
                renderLeaderboard();
            }
        });
    });
    
    // Тема
    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        document.getElementById('themeToggle').textContent = next === 'dark' ? '🌙' : '☀️';
    });
    
    // Клик
    document.getElementById('clickBtn').addEventListener('click', () => {
        gameState.balance += gameState.power;
        gameState.totalClicks++;
        gameState.totalEarned += gameState.power;
        
        const btn = document.getElementById('clickBtn');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
        
        updateUI();
    });
    
    // День
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance += 500;
            gameState.lastDaily = today;
            gameState.daysActive++;
            showNotif('📅 Награда!', '+500 монет');
            saveGame();
            saveLeaderboard();
            updateUI();
        } else {
            showNotif('⏰ Уже получали', 'Завтра будет снова', 'warning');
        }
    });
    
    // Подарок
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
    
    // Сохранить
    document.getElementById('saveToFile').addEventListener('click', () => {
        const data = JSON.stringify(gameState, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${gameState.nickname || 'game'}_${Date.now()}.click`;
        a.click();
        URL.revokeObjectURL(url);
        showNotif('💾 Сохранено', 'Файл готов');
    });
    
    // Выход
    document.getElementById('logoutBtn').addEventListener('click', () => {
        saveGame();
        saveLeaderboard();
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('loginInput').value = '';
        gameState.nickname = '';
    });
    
    // Кейс анимация
    document.getElementById('closeCaseAnimation').addEventListener('click', () => {
        document.getElementById('caseAnimation').style.display = 'none';
    });
    
    // Промокод
    document.getElementById('activatePromo').addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.toUpperCase().trim();
        
        if (gameState.usedCodes.includes(code)) {
            showNotif('❌ Уже использован', '', 'error');
            return;
        }
        
        let msg = '';
        if (code === 'START') { gameState.balance += 100; msg = '+100💰'; }
        else if (code === 'GIFT') { gameState.balance += 300; msg = '+300💰'; }
        else if (code === 'POWER') { gameState.power++; msg = 'Сила +1'; }
        else { showNotif('❌ Неверный код', '', 'error'); return; }
        
        gameState.usedCodes.push(code);
        document.getElementById('promoInput').value = '';
        showNotif('✅ Промокод!', msg);
        updateUI();
        saveGame();
        saveLeaderboard();
    });
    
    // Настройки
    document.getElementById('notificationsCheck').addEventListener('change', (e) => {
        gameState.settings.notifications = e.target.checked;
    });
    
    document.getElementById('vibrationCheck').addEventListener('change', (e) => {
        gameState.settings.vibration = e.target.checked;
    });
    
    document.getElementById('autosaveCheck').addEventListener('change', (e) => {
        gameState.settings.autoSave = e.target.checked;
    });
    
    // Управление автокликером из меню
    document.getElementById('autoMenuStart').addEventListener('click', () => {
        if (gameState.autoclickers === 0) {
            showNotif('❌ Ошибка', 'Купите автокликер', 'error');
            return;
        }
        
        if (gameState.autoClicker.enabled) {
            gameState.autoClicker.enabled = false;
        } else {
            gameState.autoClicker.enabled = true;
            gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime;
        }
        
        updateAutoMenu();
        saveGame();
    });
    
    document.getElementById('autoMenuUpgrade').addEventListener('click', () => {
        const price = 100 * gameState.autoClicker.level;
        if (gameState.balance >= price) {
            gameState.balance -= price;
            gameState.autoClicker.level++;
            gameState.autoClicker.maxTime += 30;
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

// Обновление меню автокликера
function updateAutoMenu() {
    document.getElementById('autoMenuLevel').textContent = gameState.autoClicker.level;
    document.getElementById('autoMenuCount').textContent = gameState.autoclickers;
    document.getElementById('autoMenuIncome').textContent = 
        `${gameState.autoClicker.level * gameState.power}/сек`;
    document.getElementById('upgradePrice').textContent = 
        `${100 * gameState.autoClicker.level}💰`;
    
    const startBtn = document.getElementById('autoMenuStart');
    startBtn.innerHTML = gameState.autoClicker.enabled ? 
        '<span>⏹️</span><span>Остановить</span>' : 
        '<span>▶️</span><span>Запустить</span>';
    
    if (gameState.autoClicker.enabled) {
        const m = Math.floor(gameState.autoClicker.timeLeft / 60);
        const s = gameState.autoClicker.timeLeft % 60;
        document.getElementById('autoMenuTimer').textContent = 
            `${m}:${s.toString().padStart(2,'0')}`;
        const progress = (gameState.autoClicker.timeLeft / gameState.autoClicker.maxTime) * 100;
        document.getElementById('autoMenuProgress').style.width = progress + '%';
    } else {
        const m = Math.floor(gameState.autoClicker.maxTime / 60);
        const s = gameState.autoClicker.maxTime % 60;
        document.getElementById('autoMenuTimer').textContent = 
            `${m}:${s.toString().padStart(2,'0')}`;
        document.getElementById('autoMenuProgress').style.width = '100%';
    }
}

// Уведомления
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

// Магазин
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
    if (type === 'auto' && gameState.balance >= 50) {
        gameState.balance -= 50;
        gameState.autoclickers++;
        showNotif('✅ Куплено!', `Автокликер +1`);
    } else if (type === 'power' && gameState.balance >= 100) {
        gameState.balance -= 100;
        gameState.power++;
        showNotif('✅ Куплено!', `Сила +1`);
    } else {
        showNotif('❌ Недостаточно', '', 'error');
        return;
    }
    updateUI();
    updateAutoMenu();
    saveGame();
    saveLeaderboard();
};

// Скины
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
                saveGame();
                saveLeaderboard();
            } else {
                showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
            }
        });
    });
}

// Кейсы
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
    
    showCaseAnim(type, () => {
        gameState.balance -= price;
        gameState.casesOpened++;
        gameState.balance += reward;
        
        if (reward > gameState.bestCaseWin) {
            gameState.bestCaseWin = reward;
        }
        
        document.getElementById('caseResult').innerHTML = `+${reward}💰`;
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

// Промокоды
function renderPromoList() {
    const list = document.getElementById('promoList');
    if (!list) return;
    
    list.innerHTML = `
        <div class="promo-item"><span>START</span><span>+100💰</span></div>
        <div class="promo-item"><span>GIFT</span><span>+300💰</span></div>
        <div class="promo-item"><span>POWER</span><span>Сила +1</span></div>
    `;
}

// Таймер подарка
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

// Игровой цикл
function startLoop() {
    setInterval(() => {
        if (!gameState.nickname) return;
        
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            if (gameState.autoclickers > 0) {
                const inc = gameState.autoClicker.level * gameState.power;
                gameState.balance += inc;
                gameState.totalEarned += inc;
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

// Обновление UI
function updateUI() {
    document.getElementById('balance').textContent = Math.floor(gameState.balance);
    document.getElementById('power').textContent = gameState.power;
    document.getElementById('cps').textContent = gameState.autoclickers;
    
    document.getElementById('totalClicks').textContent = gameState.totalClicks;
    document.getElementById('totalEarned').textContent = Math.floor(gameState.totalEarned);
    document.getElementById('totalCases').textContent = gameState.casesOpened;
    document.getElementById('bestWin').textContent = gameState.bestCaseWin + '💰';
    
    const lvl = Math.floor(gameState.totalClicks / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${lvl}`;
    document.getElementById('profileLevel').textContent = `Уровень ${lvl}`;
    
    updateGiftTimer();
    
    if (gameState.settings.autoSave && gameState.nickname) {
        saveGame();
    }
}

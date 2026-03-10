// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    nickname: '',
    balance: 0,
    totalClicks: 0,
    totalEarned: 0,
    autoclickers: 0,
    power: 1,
    boxesOpened: 0,
    daysActive: 1,
    skin: 'red',
    ownedSkins: ['red'],
    lastDaily: null,
    usedCodes: [],
    friends: [],
    club: null,
    settings: {
        notifications: true,
        sounds: true,
        vibration: true,
        autoSave: true
    },
    booster: { active: false, timeLeft: 0 },
    turbo: { active: false, timeLeft: 0 },
    autoClicker: { enabled: false, timeLeft: 0, maxTime: 120 },
    autoPosition: { x: window.innerWidth - 110, y: window.innerHeight - 150 },
    version: '3.7'
};

// ========== БАЗА ДАННЫХ НИКОВ ==========
let nicknamesDB = new Set();

// Загрузка существующих ников из localStorage
function loadNicknamesDB() {
    const saved = localStorage.getItem('nicknames_db');
    if (saved) {
        nicknamesDB = new Set(JSON.parse(saved));
    } else {
        // Добавляем тестовые ники
        nicknamesDB.add('admin');
        nicknamesDB.add('test');
        nicknamesDB.add('player1');
    }
}

// Сохранение базы ников
function saveNicknamesDB() {
    localStorage.setItem('nicknames_db', JSON.stringify([...nicknamesDB]));
}

// Проверка уникальности ника
function isNicknameUnique(nickname) {
    return !nicknamesDB.has(nickname.toLowerCase());
}

// Добавление нового ника
function addNickname(nickname) {
    nicknamesDB.add(nickname.toLowerCase());
    saveNicknamesDB();
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 CLICKER 3.7 загружается...');
    
    loadNicknamesDB();
    
    // Загружаем тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    // Инициализация
    initEventListeners();
    checkWindowSize();
    
    // Следим за изменением размера окна
    window.addEventListener('resize', checkWindowSize);
});

// ========== ПРОВЕРКА РАЗМЕРА ЭКРАНА ==========
function checkWindowSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Адаптация для планшетов
    if (width >= 768 && width <= 1024) {
        document.body.classList.add('tablet');
    } else {
        document.body.classList.remove('tablet');
    }
    
    // Для очень маленьких телефонов
    if (width <= 360) {
        document.body.classList.add('x-small');
    } else {
        document.body.classList.remove('x-small');
    }
    
    // Для поворота экрана
    if (width > height) {
        document.body.classList.add('landscape');
    } else {
        document.body.classList.remove('landscape');
    }
}

// ========== УСТАНОВКА ТЕМЫ ==========
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.getElementById('themeToggle').textContent = 
        theme === 'dark' ? '🌙' : 
        theme === 'light' ? '☀️' : 
        theme === 'neon' ? '🌈' : '🌲';
}

// Переключение темы
document.getElementById('themeToggle').addEventListener('click', () => {
    const themes = ['dark', 'light', 'neon', 'forest'];
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    setTheme(next);
    showNotification('Тема изменена', `Активирована ${next} тема`, 'info');
});

// ========== ПРОВЕРКА НИКА В РЕАЛЬНОМ ВРЕМЕНИ ==========
document.getElementById('loginInput').addEventListener('input', (e) => {
    const nickname = e.target.value.trim();
    const hint = document.getElementById('nicknameHint');
    const loginBtn = document.getElementById('loginBtn');
    
    if (nickname.length < 3) {
        hint.textContent = '❌ Минимум 3 символа';
        hint.style.color = '#d63031';
        loginBtn.disabled = true;
    } else if (!isNicknameUnique(nickname)) {
        hint.textContent = '❌ Этот ник уже занят';
        hint.style.color = '#d63031';
        loginBtn.disabled = true;
    } else {
        hint.textContent = '✅ Ник доступен';
        hint.style.color = '#00b894';
        loginBtn.disabled = false;
    }
});

// ========== ВХОД ==========
document.getElementById('loginBtn').addEventListener('click', () => {
    const nickname = document.getElementById('loginInput').value.trim();
    
    if (!nickname || nickname.length < 3) {
        showNotification('Ошибка', 'Ник должен быть минимум 3 символа', 'error');
        return;
    }
    
    if (!isNicknameUnique(nickname)) {
        showNotification('Ошибка', 'Этот ник уже занят', 'error');
        return;
    }
    
    // Регистрируем ник
    addNickname(nickname);
    
    gameState.nickname = nickname;
    document.getElementById('playerName').textContent = nickname;
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    showNotification('Добро пожаловать!', `Привет, ${nickname}!`, 'success');
    startGameLoop();
    updateUI();
});

// ========== ПОКАЗ УВЕДОМЛЕНИЙ ==========
function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<strong>${title}</strong><br>${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== МЕНЮ ==========
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sideMenu').classList.add('active');
});

document.getElementById('closeMenu').addEventListener('click', () => {
    document.getElementById('sideMenu').classList.remove('active');
});

// Навигация
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const tabId = item.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        document.getElementById('sideMenu').classList.remove('active');
        
        // Загружаем контент для вкладки
        switch(tabId) {
            case 'friends':
                renderFriends();
                break;
            case 'clubs':
                renderClubs();
                break;
            case 'shop':
                renderShop();
                break;
            case 'leaders':
                renderLeaders();
                break;
            case 'settings':
                renderSettings();
                break;
        }
    });
});

// ========== ДРУЗЬЯ ==========
function renderFriends() {
    const container = document.getElementById('friendsContainer');
    const friends = [
        { id: 1, name: 'Киберпанкер', status: 'online', level: 5, avatar: '👾' },
        { id: 2, name: 'КликерМастер', status: 'offline', level: 12, avatar: '🤖' },
        { id: 3, name: 'Игрок2026', status: 'online', level: 3, avatar: '👤' }
    ];
    
    container.innerHTML = friends.map(friend => `
        <div class="friend-card">
            <div class="friend-info">
                <div class="friend-avatar">${friend.avatar}</div>
                <div class="friend-details">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-status ${friend.status}">${friend.status}</div>
                </div>
            </div>
            <div class="friend-actions">
                <button class="friend-action" onclick="chatWithFriend(${friend.id})">💬</button>
                <button class="friend-action" onclick="giftFriend(${friend.id})">🎁</button>
            </div>
        </div>
    `).join('');
}

// ========== КЛУБЫ ==========
function renderClubs() {
    const container = document.getElementById('clubsContainer');
    const clubs = [
        { id: 1, name: 'Киберпанк', icon: '🔥', members: 12, maxMembers: 20, level: 5, balance: 4500 },
        { id: 2, name: 'Кликеры', icon: '👆', members: 8, maxMembers: 15, level: 3, balance: 2100 }
    ];
    
    container.innerHTML = clubs.map(club => `
        <div class="club-card">
            <div class="club-header">
                <span class="club-icon">${club.icon}</span>
                <span class="club-name">${club.name}</span>
                <span class="club-level">Ур.${club.level}</span>
            </div>
            <div class="club-stats">
                <span>👥 ${club.members}/${club.maxMembers}</span>
                <span>💰 ${club.balance}</span>
            </div>
            <button class="club-join" onclick="joinClub(${club.id})">Вступить</button>
        </div>
    `).join('');
}

// ========== МАГАЗИН ==========
function renderShop() {
    const grid = document.getElementById('shopGrid');
    const items = [
        { id: 'autoclicker', name: 'Автокликер', desc: '+1/сек', price: 50, icon: '🤖' },
        { id: 'power', name: 'Сила', desc: '+1 к силе', price: 100, icon: '💪' },
        { id: 'booster', name: 'Бустер', desc: 'x2 30сек', price: 200, icon: '🚀' },
        { id: 'key', name: 'Ключ', desc: 'Джекпот', price: 150, icon: '🔑' }
    ];
    
    grid.innerHTML = items.map(item => `
        <div class="shop-item">
            <span class="shop-icon">${item.icon}</span>
            <div class="shop-name">${item.name}</div>
            <div class="shop-desc">${item.desc}</div>
            <button class="shop-price" onclick="buyItem('${item.id}', ${item.price})">${item.price}💰</button>
        </div>
    `).join('');
}

// ========== ТОП ИГРОКОВ ==========
function renderLeaders() {
    const container = document.getElementById('leaderboard');
    const leaders = [
        { name: 'Киберпанкер', score: 15420 },
        { name: 'КликерМастер', score: 12350 },
        { name: 'Игрок2026', score: 9870 }
    ];
    
    container.innerHTML = leaders.map((leader, i) => `
        <div class="stat-row">
            <span>${i+1}. ${leader.name}</span>
            <span>💰 ${leader.score}</span>
        </div>
    `).join('');
}

// ========== НАСТРОЙКИ ==========
function renderSettings() {
    const container = document.getElementById('settingsContainer');
    container.innerHTML = `
        <div class="stat-row">
            <span>🔔 Уведомления</span>
            <label class="switch">
                <input type="checkbox" ${gameState.settings.notifications ? 'checked' : ''} onchange="toggleSetting('notifications')">
                <span class="slider"></span>
            </label>
        </div>
        <div class="stat-row">
            <span>🔊 Звуки</span>
            <label class="switch">
                <input type="checkbox" ${gameState.settings.sounds ? 'checked' : ''} onchange="toggleSetting('sounds')">
                <span class="slider"></span>
            </label>
        </div>
        <div class="stat-row">
            <span>📳 Вибрация</span>
            <label class="switch">
                <input type="checkbox" ${gameState.settings.vibration ? 'checked' : ''} onchange="toggleSetting('vibration')">
                <span class="slider"></span>
            </label>
        </div>
        <div class="stat-row">
            <span>💾 Автосохранение</span>
            <label class="switch">
                <input type="checkbox" ${gameState.settings.autoSave ? 'checked' : ''} onchange="toggleSetting('autoSave')">
                <span class="slider"></span>
            </label>
        </div>
    `;
}

// ========== ИГРОВОЙ ЦИКЛ ==========
function startGameLoop() {
    setInterval(() => {
        if (!gameState.nickname) return;
        
        // Автокликер
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            if (gameState.autoclickers > 0) {
                let multiplier = 1;
                if (gameState.turbo.active) multiplier = 2;
                
                const gain = gameState.autoclickers * gameState.power * multiplier;
                gameState.balance += gain;
                gameState.totalEarned += gain;
                
                // Анимация
                const auto = document.getElementById('floatingAuto');
                auto.style.transform = 'scale(1.1)';
                setTimeout(() => auto.style.transform = '', 200);
            }
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
                showNotification('Автокликер остановлен', 'Время вышло', 'info');
            }
        }
        
        // Турбо
        if (gameState.turbo.active) {
            gameState.turbo.timeLeft--;
            if (gameState.turbo.timeLeft <= 0) {
                gameState.turbo.active = false;
            }
        }
        
        updateUI();
    }, 1000);
}

// ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
function updateUI() {
    document.getElementById('balance').textContent = Math.floor(gameState.balance);
    document.getElementById('power').textContent = gameState.power;
    document.getElementById('cps').textContent = gameState.autoclickers;
    document.getElementById('autoCount').textContent = gameState.autoclickers;
    
    // Профиль
    document.getElementById('profileClicks').textContent = gameState.totalClicks;
    document.getElementById('profileEarned').textContent = Math.floor(gameState.totalEarned);
    document.getElementById('profileBoxes').textContent = gameState.boxesOpened;
    document.getElementById('profileDays').textContent = gameState.daysActive;
    
    const level = Math.floor(gameState.totalClicks / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${level}`;
    
    // Автокликер
    const autoStatus = document.getElementById('autoStatus');
    const autoTimer = document.getElementById('autoTimer');
    const autoElement = document.getElementById('floatingAuto');
    
    if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
        autoStatus.textContent = '▶️';
        autoTimer.textContent = `+${gameState.autoclickers}/сек`;
        autoElement.classList.toggle('turbo', gameState.turbo.active);
    } else {
        autoStatus.textContent = '⏸️';
        autoTimer.textContent = '0/сек';
        autoElement.classList.remove('turbo');
    }
    
    document.getElementById('autoPowerBtn').textContent = 
        gameState.autoClicker.enabled ? '⏹️' : '▶️';
}

// ========== КЛИК ==========
document.getElementById('clickBtn').addEventListener('click', () => {
    const multiplier = gameState.turbo.active ? 2 : 1;
    const gain = gameState.power * multiplier;
    
    gameState.balance += gain;
    gameState.totalClicks++;
    gameState.totalEarned += gain;
    
    // Анимация
    const btn = document.getElementById('clickBtn');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = '', 100);
    
    updateUI();
});

// ========== УПРАВЛЕНИЕ АВТОКЛИКЕРОМ ==========
document.getElementById('autoPowerBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (gameState.autoclickers === 0) {
        showNotification('Ошибка', 'Купите автокликер!', 'error');
        return;
    }
    
    if (gameState.autoClicker.enabled) {
        gameState.autoClicker.enabled = false;
        gameState.autoClicker.timeLeft = 0;
    } else {
        gameState.autoClicker.enabled = true;
        gameState.autoClicker.timeLeft = 120;
    }
    
    updateUI();
});

document.getElementById('autoTurboBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (gameState.balance >= 100) {
        gameState.balance -= 100;
        gameState.turbo.active = true;
        gameState.turbo.timeLeft = 120;
        showNotification('Турбо!', 'x2 на 2 минуты', 'success');
        updateUI();
    } else {
        showNotification('Недостаточно', 'Нужно 100💰', 'error');
    }
});

// ========== ПОКУПКИ ==========
window.buyItem = (id, price) => {
    if (gameState.balance >= price) {
        gameState.balance -= price;
        
        switch(id) {
            case 'autoclicker':
                gameState.autoclickers++;
                showNotification('Успешно!', 'Автокликер +1', 'success');
                break;
            case 'power':
                gameState.power++;
                showNotification('Успешно!', 'Сила +1', 'success');
                break;
            case 'booster':
                gameState.booster.active = true;
                gameState.booster.timeLeft = 30;
                showNotification('Бустер!', 'x2 на 30 сек', 'success');
                break;
            case 'key':
                localStorage.setItem('hasKey', 'true');
                showNotification('Ключ получен!', 'Удача в боксе', 'success');
                break;
        }
        
        updateUI();
    } else {
        showNotification('Недостаточно!', `Нужно ${price - gameState.balance}💰`, 'error');
    }
};

// ========== БОКС ==========
document.getElementById('boxBtn').addEventListener('click', () => {
    if (gameState.balance >= 100) {
        gameState.balance -= 100;
        gameState.boxesOpened++;
        
        const hasKey = localStorage.getItem('hasKey') === 'true';
        let reward;
        
        if (hasKey) {
            reward = 500;
            localStorage.removeItem('hasKey');
        } else {
            const random = Math.random();
            reward = random < 0.5 ? 50 : random < 0.8 ? 100 : random < 0.95 ? 200 : 500;
        }
        
        gameState.balance += reward;
        showNotification('Бокс открыт!', `+${reward} монет`, reward >= 500 ? 'warning' : 'success');
        updateUI();
    }
});

// ========== ЕЖЕДНЕВНАЯ НАГРАДА ==========
document.getElementById('dailyBtn').addEventListener('click', () => {
    const today = new Date().toDateString();
    
    if (gameState.lastDaily !== today) {
        gameState.balance += 500;
        gameState.lastDaily = today;
        gameState.daysActive++;
        showNotification('Ежедневно!', '+500 монет', 'success');
        updateUI();
    }
});

// ========== ПЕРЕТАСКИВАНИЕ АВТОКЛИКЕРА ==========
const autoElement = document.getElementById('floatingAuto');
const dragHandle = document.getElementById('autoDragHandle');
let isDragging = false;

dragHandle.addEventListener('mousedown', startDrag);
dragHandle.addEventListener('touchstart', startDrag, { passive: false });

function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    
    const startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    const startLeft = autoElement.offsetLeft;
    const startTop = autoElement.offsetTop;
    
    function onDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        let newLeft = startLeft + (clientX - startX);
        let newTop = startTop + (clientY - startY);
        
        newLeft = Math.max(0, Math.min(window.innerWidth - autoElement.offsetWidth, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - autoElement.offsetHeight, newTop));
        
        autoElement.style.left = newLeft + 'px';
        autoElement.style.top = newTop + 'px';
        autoElement.style.right = 'auto';
        autoElement.style.bottom = 'auto';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

// ========== СОХРАНЕНИЕ ==========
document.getElementById('saveToFile').addEventListener('click', () => {
    const dataStr = JSON.stringify(gameState);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameState.nickname}_save.click`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Сохранено!', 'Игра сохранена в файл', 'success');
});

// ========== ВЫХОД ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginInput').value = '';
    document.getElementById('loginBtn').disabled = true;
    gameState.nickname = '';
});

// ========== БЫСТРЫЙ ПЕРЕХОД К ДРУЗЬЯМ ==========
document.getElementById('friendsQuickBtn').addEventListener('click', () => {
    document.querySelector('.menu-item[data-tab="friends"]').click();
});

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
    friends: [],
    friendRequests: [],
    club: null,
    clubRequests: [],
    settings: {
        notifications: true,
        sounds: true,
        vibration: true,
        autoSave: true
    },
    booster: { active: false, timeLeft: 0 },
    turbo: { active: false, timeLeft: 0 },
    autoClicker: { 
        enabled: false, 
        timeLeft: 0, 
        maxTime: 120,
        level: 1,
        baseIncome: 1
    },
    autoPosition: { x: window.innerWidth - 160, y: window.innerHeight - 200 },
    giftPosition: { x: window.innerWidth - 85, y: window.innerHeight - 180 },
    version: '4.2'
};

// ========== ЛОКАЛЬНОЕ СОХРАНЕНИЕ ==========
const SAVE_KEY = 'clicker_game_save';

function loadLocalSave() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.version && parsed.version >= '4.0') {
                gameState = { ...gameState, ...parsed };
                console.log('✅ Локальное сохранение загружено');
                return true;
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
    return false;
}

function saveLocalSave() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        console.log('💾 Игра сохранена');
        return true;
    } catch (e) {
        console.error('Ошибка сохранения:', e);
        return false;
    }
}

// ========== ЗАГРУЗКА .CLICK ФАЙЛА (ИСПРАВЛЕНО) ==========
function loadClickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.click,.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                // Пробуем распарсить как JSON
                const content = event.target.result;
                let loadedData;
                
                try {
                    loadedData = JSON.parse(content);
                } catch (jsonError) {
                    // Если не JSON, возможно это старый формат
                    showNotification('Ошибка', 'Неверный формат файла', 'error');
                    return;
                }
                
                // Проверяем структуру
                if (!loadedData || typeof loadedData !== 'object') {
                    throw new Error('Неверный формат данных');
                }
                
                // Загружаем данные
                gameState = { ...gameState, ...loadedData };
                
                // Обновляем интерфейс
                document.getElementById('playerName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('profileName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                // Восстанавливаем позиции
                restorePositions();
                
                // Обновляем UI
                updateUI();
                renderSkins();
                
                showNotification('Успешно!', 'Игра загружена из файла', 'success');
                
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                showNotification('Ошибка загрузки', 'Файл поврежден или имеет неверный формат', 'error');
            } finally {
                document.body.removeChild(input);
            }
        };
        
        reader.onerror = function() {
            showNotification('Ошибка', 'Не удалось прочитать файл', 'error');
            document.body.removeChild(input);
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ========== ВОССТАНОВЛЕНИЕ ПОЗИЦИЙ ==========
function restorePositions() {
    const autoElement = document.getElementById('autoClicker');
    const giftElement = document.getElementById('floatingGift');
    
    if (autoElement) {
        if (gameState.autoPosition) {
            autoElement.style.left = gameState.autoPosition.x + 'px';
            autoElement.style.top = gameState.autoPosition.y + 'px';
            autoElement.style.right = 'auto';
            autoElement.style.bottom = 'auto';
        } else {
            // Позиция по умолчанию
            autoElement.style.right = '15px';
            autoElement.style.bottom = '200px';
        }
    }
    
    if (giftElement) {
        if (gameState.giftPosition) {
            giftElement.style.left = gameState.giftPosition.x + 'px';
            giftElement.style.top = gameState.giftPosition.y + 'px';
            giftElement.style.right = 'auto';
            giftElement.style.bottom = 'auto';
        } else {
            // Позиция по умолчанию
            giftElement.style.right = '15px';
            giftElement.style.bottom = '100px';
        }
    }
}

// ========== ПЕРЕДВИЖЕНИЕ АВТОКЛИКЕРА ==========
let isDragging = false;
let currentElement = null;

function makeDraggable(element, savePositionKey) {
    if (!element) return;
    
    let startX, startY, startLeft, startTop;
    
    function startDrag(e) {
        // Не реагируем на клики по кнопкам
        if (e.target.closest('button') && !e.target.closest('.auto-drag, .gift-drag-handle')) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        currentElement = element;
        element.classList.add('dragging');
        
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        
        startX = clientX;
        startY = clientY;
        
        const rect = element.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }
    
    function onDrag(e) {
        if (!isDragging || currentElement !== element) return;
        e.preventDefault();
        
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        let newLeft = startLeft + (clientX - startX);
        let newTop = startTop + (clientY - startY);
        
        // Ограничения
        newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
        
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    }
    
    function stopDrag() {
        if (!isDragging || currentElement !== element) return;
        
        isDragging = false;
        currentElement = null;
        element.classList.remove('dragging');
        
        // Сохраняем позицию
        const rect = element.getBoundingClientRect();
        gameState[savePositionKey] = {
            x: rect.left,
            y: rect.top
        };
        saveLocalSave();
        
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }
    
    // Добавляем обработчики на весь элемент для возможности перетаскивания за любую часть
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag, { passive: false });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 CLICKER 4.2 загружается...');
    
    // Загружаем локальное сохранение
    if (loadLocalSave() && gameState.nickname) {
        document.getElementById('playerName').textContent = gameState.nickname;
        document.getElementById('profileName').textContent = gameState.nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        restorePositions();
        showNotification('Добро пожаловать!', `С возвращением, ${gameState.nickname}!`, 'success');
    }
    
    // Загружаем тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    // Делаем элементы перетаскиваемыми
    setTimeout(() => {
        const autoElement = document.getElementById('autoClicker');
        const giftElement = document.getElementById('floatingGift');
        
        if (autoElement) {
            makeDraggable(autoElement, 'autoPosition');
        }
        if (giftElement) {
            makeDraggable(giftElement, 'giftPosition');
        }
    }, 100);
    
    // Инициализация
    initEventListeners();
    startGameLoop();
    updateUI();
});

// ========== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ==========
function initEventListeners() {
    // Загрузка из файла
    document.getElementById('loadGameFile').addEventListener('click', loadClickFile);
    
    // Вход
    document.getElementById('loginBtn').addEventListener('click', () => {
        const nickname = document.getElementById('loginInput').value.trim();
        
        if (!nickname || nickname.length < 3) {
            showNotification('Ошибка', 'Ник должен быть минимум 3 символа', 'error');
            return;
        }
        
        gameState.nickname = nickname;
        document.getElementById('playerName').textContent = nickname;
        document.getElementById('profileName').textContent = nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        saveLocalSave();
        showNotification('Добро пожаловать!', `Привет, ${nickname}!`, 'success');
        updateUI();
    });
    
    // Меню
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sideMenu').classList.add('active');
    });
    
    document.getElementById('closeMenu').addEventListener('click', () => {
        document.getElementById('sideMenu').classList.remove('active');
    });
    
    document.getElementById('profileBtn').addEventListener('click', () => {
        document.querySelector('.menu-item[data-tab="profile"]').click();
    });
    
    document.getElementById('casesBtn').addEventListener('click', () => {
        document.querySelector('.menu-item[data-tab="cases"]').click();
    });
    
    // Навигация по меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const tabId = item.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            document.getElementById('sideMenu').classList.remove('active');
        });
    });
    
    // Тема
    document.getElementById('themeToggle').addEventListener('click', () => {
        const themes = ['dark', 'light', 'neon', 'forest'];
        const current = document.body.getAttribute('data-theme') || 'dark';
        const next = themes[(themes.indexOf(current) + 1) % themes.length];
        setTheme(next);
        showNotification('Тема изменена', `Активирована ${next} тема`, 'info');
    });
    
    // Клик
    document.getElementById('clickBtn').addEventListener('click', () => {
        const multiplier = gameState.turbo.active ? 2 : 1;
        const gain = gameState.power * multiplier;
        
        gameState.balance += gain;
        gameState.totalClicks++;
        gameState.totalEarned += gain;
        
        const btn = document.getElementById('clickBtn');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
        
        updateUI();
    });
    
    // Ежедневная награда
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance += 500;
            gameState.lastDaily = today;
            gameState.daysActive++;
            showNotification('Ежедневная награда!', '+500 монет', 'success');
            saveLocalSave();
            updateUI();
        } else {
            showNotification('Уже получали!', 'Возвращайтесь завтра', 'warning');
        }
    });
    
    // Кейсы
    document.getElementById('closeCaseAnimation').addEventListener('click', () => {
        document.getElementById('caseAnimation').style.display = 'none';
    });
    
    // Подарок
    const giftElement = document.getElementById('floatingGift');
    if (giftElement) {
        giftElement.addEventListener('click', (e) => {
            if (isDragging) return;
            
            const now = Date.now();
            const lastGift = gameState.lastGift || 0;
            const hours24 = 24 * 60 * 60 * 1000;
            
            if (now - lastGift >= hours24) {
                gameState.balance += 50;
                gameState.lastGift = now;
                giftElement.classList.remove('available');
                showNotification('🎁 Ежедневный подарок!', '+50 монет', 'success');
                updateUI();
            } else {
                const timeLeft = hours24 - (now - lastGift);
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                showNotification('Подарок уже получен', `Следующий через ${hours}ч ${minutes}м`, 'info');
            }
        });
    }
    
    // Сохранение в файл
    document.getElementById('saveToFile').addEventListener('click', () => {
        const dataStr = JSON.stringify(gameState, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${gameState.nickname || 'player'}_clicker_${Date.now()}.click`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Сохранено!', 'Игра сохранена в файл', 'success');
    });
    
    // Выход
    document.getElementById('logoutBtn').addEventListener('click', () => {
        saveLocalSave();
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('loginInput').value = '';
        gameState.nickname = '';
    });
}

// ========== СИСТЕМА КЕЙСОВ ==========
window.openCase = (caseType) => {
    let price, rewards;
    
    switch(caseType) {
        case 'ordinary':
            price = 100;
            rewards = [50, 100, 200, 500];
            break;
        case 'rare':
            price = 500;
            rewards = [100, 250, 500, 1000];
            break;
        case 'epic':
            price = 1000;
            rewards = [500, 1000, 2000, 5000];
            break;
        default:
            return;
    }
    
    if (gameState.balance < price) {
        showNotification('Недостаточно средств!', `Нужно ${price}💰`, 'error');
        return;
    }
    
    showCaseAnimation(caseType, () => {
        gameState.balance -= price;
        gameState.casesOpened++;
        
        const random = Math.random() * 100;
        let win;
        
        if (random < 50) win = rewards[0];
        else if (random < 80) win = rewards[1];
        else if (random < 95) win = rewards[2];
        else win = rewards[3];
        
        gameState.balance += win;
        
        if (win > gameState.bestCaseWin) {
            gameState.bestCaseWin = win;
        }
        
        document.getElementById('caseAnimationResult').innerHTML = `+${win}💰`;
        document.getElementById('caseAnimationText').textContent = 'Вы выиграли!';
        
        saveLocalSave();
        updateUI();
    });
};

function showCaseAnimation(caseType, callback) {
    const overlay = document.getElementById('caseAnimation');
    const box = document.getElementById('caseAnimationBox');
    const text = document.getElementById('caseAnimationText');
    const result = document.getElementById('caseAnimationResult');
    
    box.className = 'case-animation-box';
    box.textContent = caseType === 'ordinary' ? '📦' : caseType === 'rare' ? '💎' : '👑';
    text.textContent = 'Открываем кейс...';
    result.innerHTML = '';
    
    overlay.style.display = 'flex';
    
    setTimeout(() => {
        box.classList.add('opening');
    }, 100);
    
    setTimeout(() => {
        callback();
    }, 1500);
}

// ========== ТЕМЫ ==========
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.textContent = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : theme === 'neon' ? '🌈' : '🌲';
    }
}

// ========== УВЕДОМЛЕНИЯ ==========
function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<strong>${title}</strong><br>${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== ОБНОВЛЕНИЕ ТАЙМЕРА ПОДАРКА ==========
function updateGiftTimer() {
    const timerElement = document.getElementById('giftTimer');
    const giftElement = document.getElementById('floatingGift');
    
    if (!timerElement || !giftElement) return;
    
    if (!gameState.lastGift) {
        timerElement.textContent = 'Готов!';
        giftElement.classList.add('available');
        return;
    }
    
    const now = Date.now();
    const timeLeft = (24 * 60 * 60 * 1000) - (now - gameState.lastGift);
    
    if (timeLeft <= 0) {
        timerElement.textContent = 'Готов!';
        giftElement.classList.add('available');
    } else {
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        timerElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        giftElement.classList.remove('available');
    }
}

// ========== ИГРОВОЙ ЦИКЛ ==========
function startGameLoop() {
    setInterval(() => {
        if (!gameState.nickname) return;
        
        // Автокликер
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            const progress = (gameState.autoClicker.timeLeft / gameState.autoClicker.maxTime) * 100;
            const progressBar = document.getElementById('autoProgress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            const income = gameState.autoClicker.level * gameState.power;
            gameState.balance += income;
            gameState.totalEarned += income;
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
                const status = document.getElementById('autoStatus');
                const timer = document.getElementById('autoTimer');
                if (status) status.textContent = '⏸️ Остановлен';
                if (timer) timer.textContent = '0:00';
            }
        }
        
        // Турбо
        if (gameState.turbo.active) {
            gameState.turbo.timeLeft--;
            if (gameState.turbo.timeLeft <= 0) {
                gameState.turbo.active = false;
                const auto = document.getElementById('autoClicker');
                if (auto) auto.classList.remove('turbo');
            }
        }
        
        updateUI();
    }, 1000);
    
    // Таймер для отображения времени
    setInterval(() => {
        if (gameState.autoClicker.enabled) {
            const minutes = Math.floor(gameState.autoClicker.timeLeft / 60);
            const seconds = gameState.autoClicker.timeLeft % 60;
            const timer = document.getElementById('autoTimer');
            if (timer) {
                timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }, 500);
    
    // Таймер подарка
    setInterval(updateGiftTimer, 60000);
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    const elements = {
        balance: document.getElementById('balance'),
        power: document.getElementById('power'),
        cps: document.getElementById('cps'),
        autoCount: document.getElementById('autoCount'),
        autoLevel: document.getElementById('autoLevel'),
        profileClicks: document.getElementById('profileClicks'),
        profileEarned: document.getElementById('profileEarned'),
        profileBoxes: document.getElementById('profileBoxes'),
        profileDays: document.getElementById('profileDays'),
        totalCasesOpened: document.getElementById('totalCasesOpened'),
        bestCaseWin: document.getElementById('bestCaseWin'),
        playerLevel: document.getElementById('playerLevel'),
        profileLevelBadge: document.getElementById('profileLevelBadge'),
        playerClub: document.getElementById('playerClub'),
        profileClubBadge: document.getElementById('profileClubBadge'),
        autoStatus: document.getElementById('autoStatus'),
        autoStartBtn: document.getElementById('autoStartBtn')
    };
    
    if (elements.balance) elements.balance.textContent = Math.floor(gameState.balance);
    if (elements.power) elements.power.textContent = gameState.power;
    if (elements.cps) elements.cps.textContent = gameState.autoclickers;
    if (elements.autoCount) elements.autoCount.textContent = gameState.autoclickers;
    if (elements.autoLevel) elements.autoLevel.textContent = `Ур.${gameState.autoClicker.level}`;
    
    if (elements.profileClicks) elements.profileClicks.textContent = gameState.totalClicks;
    if (elements.profileEarned) elements.profileEarned.textContent = Math.floor(gameState.totalEarned);
    if (elements.profileBoxes) elements.profileBoxes.textContent = gameState.casesOpened;
    if (elements.profileDays) elements.profileDays.textContent = gameState.daysActive;
    
    if (elements.totalCasesOpened) elements.totalCasesOpened.textContent = gameState.casesOpened;
    if (elements.bestCaseWin) elements.bestCaseWin.textContent = gameState.bestCaseWin + '💰';
    
    const level = Math.floor(gameState.totalClicks / 100) + 1;
    if (elements.playerLevel) elements.playerLevel.textContent = `Уровень ${level}`;
    if (elements.profileLevelBadge) elements.profileLevelBadge.textContent = `Уровень ${level}`;
    
    if (gameState.club) {
        if (elements.playerClub) elements.playerClub.textContent = `🏰 ${gameState.club.name}`;
        if (elements.profileClubBadge) elements.profileClubBadge.textContent = `🏰 ${gameState.club.name}`;
    }
    
    if (elements.autoStatus) {
        elements.autoStatus.textContent = gameState.autoClicker.enabled ? '⚡ Работает' : '⏸️ Остановлен';
    }
    
    if (elements.autoStartBtn) {
        elements.autoStartBtn.textContent = gameState.autoClicker.enabled ? '⏹️' : '▶️';
    }
    
    updateGiftTimer();
    
    if (gameState.settings.autoSave) {
        saveLocalSave();
    }
}

// ========== СКИНЫ ==========
function renderSkins() {
    const grid = document.getElementById('skinsGrid');
    if (!grid) return;
    
    const skins = [
        { id: 'red', name: 'Красный', price: 200 },
        { id: 'blue', name: 'Синий', price: 200 },
        { id: 'green', name: 'Зеленый', price: 200 },
        { id: 'gold', name: 'Золотой', price: 500 },
        { id: 'rainbow', name: 'Радуга', price: 1000 },
        { id: 'dark', name: 'Темный', price: 300 }
    ];
    
    grid.innerHTML = skins.map(skin => {
        const owned = gameState.ownedSkins.includes(skin.id);
        return `
            <div class="skin-item" data-skin="${skin.id}" data-price="${skin.price}">
                <div class="skin-preview skin-${skin.id}"></div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-price">${owned ? '✓ Владеете' : skin.price + '💰'}</div>
                <button class="skin-buy" ${owned ? 'disabled' : ''}>
                    ${gameState.skin === skin.id ? 'Надет' : owned ? 'В коллекции' : 'Купить'}
                </button>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.skin-item').forEach(item => {
        item.addEventListener('click', () => {
            const skinId = item.dataset.skin;
            const price = parseInt(item.dataset.price);
            
            if (gameState.ownedSkins.includes(skinId)) {
                gameState.skin = skinId;
                document.getElementById('clickBtn').className = `clicker-btn skin-${skinId}`;
                renderSkins();
                showNotification('Скин надет!', 'Кнопка изменила цвет', 'success');
            } else if (gameState.balance >= price) {
                gameState.balance -= price;
                gameState.ownedSkins.push(skinId);
                gameState.skin = skinId;
                renderSkins();
                updateUI();
                showNotification('Скин куплен!', 'Теперь он ваш', 'success');
            } else {
                showNotification('Недостаточно!', `Нужно ${price}💰`, 'error');
            }
        });
    });
}

// ========== УПРАВЛЕНИЕ АВТОКЛИКЕРОМ ==========
document.getElementById('autoStartBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (gameState.autoclickers === 0) {
        showNotification('Ошибка', 'Купите автокликер в магазине!', 'error');
        return;
    }
    
    if (gameState.autoClicker.enabled) {
        gameState.autoClicker.enabled = false;
        document.getElementById('autoStatus').textContent = '⏸️ Остановлен';
        document.getElementById('autoStartBtn').textContent = '▶️';
    } else {
        gameState.autoClicker.enabled = true;
        gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime;
        document.getElementById('autoStatus').textContent = '⚡ Работает';
        document.getElementById('autoStartBtn').textContent = '⏹️';
        document.getElementById('autoProgress').style.width = '100%';
    }
    
    saveLocalSave();
});

document.getElementById('autoUpgradeBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const price = 100 * gameState.autoClicker.level;
    if (gameState.balance >= price) {
        gameState.balance -= price;
        gameState.autoClicker.level++;
        gameState.autoClicker.maxTime += 30;
        showNotification('Улучшено!', `Уровень автокликера ${gameState.autoClicker.level}`, 'success');
        updateUI();
        saveLocalSave();
    } else {
        showNotification('Недостаточно средств', `Нужно ${price}💰`, 'error');
    }
});

document.getElementById('autoBoostBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (gameState.balance >= 50) {
        gameState.balance -= 50;
        gameState.turbo.active = true;
        gameState.turbo.timeLeft = 30;
        document.getElementById('autoClicker').classList.add('turbo');
        showNotification('Турбо!', 'x2 на 30 секунд', 'success');
        updateUI();
        saveLocalSave();
    } else {
        showNotification('Недостаточно средств', 'Нужно 50💰', 'error');
    }
});

// ========== СОХРАНЕНИЕ ПРИ ВЫХОДЕ ==========
window.addEventListener('beforeunload', () => {
    if (gameState.nickname) {
        saveLocalSave();
    }
});

// Инициализируем скины
setTimeout(() => {
    renderSkins();
}, 500);

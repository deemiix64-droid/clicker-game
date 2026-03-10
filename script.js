// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    nickname: '',
    balance: 1000,
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
    autoPosition: { x: window.innerWidth - 140, y: window.innerHeight - 200 },
    giftPosition: { x: window.innerWidth - 80, y: window.innerHeight - 160 },
    version: '4.6'
};

// ========== ЛОКАЛЬНОЕ СОХРАНЕНИЕ ==========
const SAVE_KEY = 'clicker_save_46';

function loadLocalSave() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.version && parsed.version >= '4.6') {
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
    // Создаем скрытый input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.click,.json';
    input.style.position = 'fixed';
    input.style.top = '-100px';
    input.style.left = '-100px';
    input.style.opacity = '0';
    document.body.appendChild(input);
    
    // Показываем загрузку
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) {
            document.getElementById('loadingOverlay').style.display = 'none';
            document.body.removeChild(input);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                let loadedData;
                
                // Пробуем распарсить JSON
                try {
                    loadedData = JSON.parse(content);
                } catch (jsonError) {
                    throw new Error('Неверный формат файла');
                }
                
                // Проверяем структуру
                if (!loadedData || typeof loadedData !== 'object') {
                    throw new Error('Файл поврежден');
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
                renderShop();
                renderSkins();
                renderCases();
                
                showNotification('✅ Успешно!', 'Игра загружена из файла', 'success');
                
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                showNotification('❌ Ошибка', error.message || 'Не удалось загрузить файл', 'error');
            } finally {
                document.getElementById('loadingOverlay').style.display = 'none';
                document.body.removeChild(input);
            }
        };
        
        reader.onerror = function() {
            document.getElementById('loadingOverlay').style.display = 'none';
            showNotification('❌ Ошибка', 'Не удалось прочитать файл', 'error');
            document.body.removeChild(input);
        };
        
        reader.readAsText(file);
    };
    
    // Имитируем клик
    setTimeout(() => {
        input.click();
    }, 100);
}

// ========== ВОССТАНОВЛЕНИЕ ПОЗИЦИЙ ==========
function restorePositions() {
    const autoElement = document.getElementById('autoClicker');
    const giftElement = document.getElementById('floatingGift');
    
    if (autoElement && gameState.autoPosition) {
        autoElement.style.left = gameState.autoPosition.x + 'px';
        autoElement.style.top = gameState.autoPosition.y + 'px';
        autoElement.style.right = 'auto';
        autoElement.style.bottom = 'auto';
    }
    
    if (giftElement && gameState.giftPosition) {
        giftElement.style.left = gameState.giftPosition.x + 'px';
        giftElement.style.top = gameState.giftPosition.y + 'px';
        giftElement.style.right = 'auto';
        giftElement.style.bottom = 'auto';
    }
}

// ========== ПЕРЕТАСКИВАНИЕ ЭЛЕМЕНТОВ ==========
function makeDraggable(element, positionKey) {
    if (!element) return;
    
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    const startDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
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
    };
    
    const onDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        let newLeft = startLeft + (clientX - startX);
        let newTop = startTop + (clientY - startY);
        
        newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
        
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    };
    
    const stopDrag = () => {
        if (!isDragging) return;
        
        isDragging = false;
        element.classList.remove('dragging');
        
        const rect = element.getBoundingClientRect();
        gameState[positionKey] = {
            x: rect.left,
            y: rect.top
        };
        
        if (gameState.settings.autoSave) {
            saveLocalSave();
        }
        
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    };
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag, { passive: false });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 CLICKER 4.6 загружается...');
    
    // Загружаем сохранение
    if (loadLocalSave() && gameState.nickname) {
        document.getElementById('playerName').textContent = gameState.nickname;
        document.getElementById('profileName').textContent = gameState.nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        restorePositions();
    }
    
    // Загружаем тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    // Инициализация
    initEventListeners();
    
    // Делаем элементы перетаскиваемыми
    setTimeout(() => {
        makeDraggable(document.getElementById('autoClicker'), 'autoPosition');
        makeDraggable(document.getElementById('floatingGift'), 'giftPosition');
    }, 500);
    
    // Рендерим магазин и скины
    renderShop();
    renderSkins();
    renderCases();
    renderPromoList();
    
    // Запускаем игровой цикл
    startGameLoop();
});

// ========== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ==========
function initEventListeners() {
    // Загрузка из файла
    const loadBtn = document.getElementById('loadGameFile');
    if (loadBtn) {
        loadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            loadClickFile();
        });
    }
    
    // Вход
    document.getElementById('loginBtn').addEventListener('click', () => {
        const nickname = document.getElementById('loginInput').value.trim();
        
        if (!nickname || nickname.length < 3) {
            showNotification('❌ Ошибка', 'Ник должен быть минимум 3 символа', 'error');
            return;
        }
        
        gameState.nickname = nickname;
        document.getElementById('playerName').textContent = nickname;
        document.getElementById('profileName').textContent = nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        saveLocalSave();
        showNotification('✅ Добро пожаловать!', `Привет, ${nickname}!`, 'success');
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
    
    document.getElementById('shopBtn').addEventListener('click', () => {
        document.querySelector('.menu-item[data-tab="shop"]').click();
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
        const themes = ['dark', 'light'];
        const current = document.body.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
        showNotification('🎨 Тема изменена', `Активирована ${next === 'dark' ? 'тёмная' : 'светлая'} тема`, 'info');
    });
    
    // Клик
    document.getElementById('clickBtn').addEventListener('click', () => {
        const multiplier = 1;
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
            showNotification('📅 Ежедневная награда!', '+500 монет', 'success');
            saveLocalSave();
            updateUI();
        } else {
            showNotification('⏰ Уже получали!', 'Возвращайтесь завтра', 'warning');
        }
    });
    
    // Подарок
    const giftElement = document.getElementById('floatingGift');
    if (giftElement) {
        giftElement.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const now = Date.now();
            const lastGift = gameState.lastGift || 0;
            const hours24 = 24 * 60 * 60 * 1000;
            
            if (now - lastGift >= hours24) {
                gameState.balance += 50;
                gameState.lastGift = now;
                giftElement.classList.remove('available');
                showNotification('🎁 Ежедневный подарок!', '+50 монет', 'success');
                updateUI();
                saveLocalSave();
            } else {
                const timeLeft = hours24 - (now - lastGift);
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                showNotification('⏰ Подарок уже получен', `Следующий через ${hours}ч ${minutes}м`, 'info');
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
        showNotification('💾 Сохранено!', 'Игра сохранена в файл', 'success');
    });
    
    // Выход
    document.getElementById('logoutBtn').addEventListener('click', () => {
        saveLocalSave();
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('loginInput').value = '';
        gameState.nickname = '';
    });
    
    // Кейс анимация
    document.getElementById('closeCaseAnimation').addEventListener('click', () => {
        document.getElementById('caseAnimation').style.display = 'none';
    });
    
    // Промокоды
    document.getElementById('activatePromo').addEventListener('click', activatePromo);
    
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
}

// ========== ТЕМЫ ==========
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

// ========== УВЕДОМЛЕНИЯ ==========
function showNotification(title, message, type = 'info') {
    if (!gameState.settings.notifications && type !== 'error') return;
    
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
    
    if (gameState.settings.vibration && type === 'success') {
        navigator.vibrate?.(50);
    }
}

// ========== МАГАЗИН ==========
function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    
    const items = [
        { id: 'autoclicker', name: 'Автокликер', desc: '+1/сек', price: 50, icon: '🤖' },
        { id: 'power', name: 'Сила', desc: '+1 к силе', price: 100, icon: '💪' }
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

window.buyItem = (id, price) => {
    if (gameState.balance >= price) {
        gameState.balance -= price;
        
        if (id === 'autoclicker') {
            gameState.autoclickers++;
            showNotification('✅ Успешно!', `Автокликер +1 (всего: ${gameState.autoclickers})`, 'success');
        } else if (id === 'power') {
            gameState.power++;
            showNotification('✅ Успешно!', `Сила +1 (теперь: ${gameState.power})`, 'success');
        }
        
        updateUI();
        saveLocalSave();
    } else {
        showNotification('❌ Недостаточно', `Нужно еще ${price - gameState.balance}💰`, 'error');
    }
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
                showNotification('🎨 Скин надет!', 'Кнопка изменила цвет', 'success');
            } else if (gameState.balance >= price) {
                gameState.balance -= price;
                gameState.ownedSkins.push(skinId);
                gameState.skin = skinId;
                renderSkins();
                updateUI();
                showNotification('✅ Скин куплен!', 'Теперь он ваш', 'success');
                saveLocalSave();
            } else {
                showNotification('❌ Недостаточно', `Нужно ${price}💰`, 'error');
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
            <button class="case-btn" onclick="openCase('ordinary')">Открыть</button>
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
    
    if (type === 'ordinary') {
        price = 100;
        const rand = Math.random();
        if (rand < 0.5) reward = 50;
        else if (rand < 0.8) reward = 100;
        else if (rand < 0.95) reward = 200;
        else reward = 500;
    } else if (type === 'rare') {
        price = 500;
        const rand = Math.random();
        if (rand < 0.4) reward = 100;
        else if (rand < 0.7) reward = 250;
        else if (rand < 0.9) reward = 500;
        else reward = 1000;
    } else {
        price = 1000;
        const rand = Math.random();
        if (rand < 0.5) reward = 500;
        else if (rand < 0.8) reward = 1000;
        else if (rand < 0.95) reward = 2000;
        else reward = 5000;
    }
    
    if (gameState.balance < price) {
        showNotification('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        return;
    }
    
    showCaseAnimation(type, () => {
        gameState.balance -= price;
        gameState.casesOpened++;
        gameState.balance += reward;
        
        if (reward > gameState.bestCaseWin) {
            gameState.bestCaseWin = reward;
        }
        
        document.getElementById('caseResult').innerHTML = `+${reward}💰`;
        document.getElementById('caseText').textContent = 'Вы выиграли!';
        
        updateUI();
        saveLocalSave();
    });
};

function showCaseAnimation(type, callback) {
    const overlay = document.getElementById('caseAnimation');
    const box = document.getElementById('caseBox');
    const text = document.getElementById('caseText');
    const result = document.getElementById('caseResult');
    
    box.className = 'case-box';
    box.textContent = type === 'ordinary' ? '📦' : type === 'rare' ? '💎' : '👑';
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

// ========== ПРОМОКОДЫ ==========
function renderPromoList() {
    const list = document.getElementById('promoList');
    if (!list) return;
    
    const promos = [
        { code: 'START', reward: '+100💰' },
        { code: 'GIFT', reward: '+300💰' },
        { code: 'POWER', reward: 'Сила +1' }
    ];
    
    list.innerHTML = promos.map(p => `
        <div class="promo-item">
            <span class="promo-code">${p.code}</span>
            <span class="promo-reward">${p.reward}</span>
        </div>
    `).join('');
}

function activatePromo() {
    const input = document.getElementById('promoInput');
    const code = input.value.toUpperCase().trim();
    
    if (!code) {
        showNotification('❌ Ошибка', 'Введите промокод', 'error');
        return;
    }
    
    if (gameState.usedCodes.includes(code)) {
        showNotification('❌ Ошибка', 'Промокод уже использован', 'error');
        return;
    }
    
    let success = false;
    let message = '';
    
    switch(code) {
        case 'START':
            gameState.balance += 100;
            success = true;
            message = '+100💰';
            break;
        case 'GIFT':
            gameState.balance += 300;
            success = true;
            message = '+300💰';
            break;
        case 'POWER':
            gameState.power++;
            success = true;
            message = 'Сила +1';
            break;
        default:
            showNotification('❌ Ошибка', 'Неверный промокод', 'error');
            return;
    }
    
    if (success) {
        gameState.usedCodes.push(code);
        showNotification('✅ Промокод активирован!', message, 'success');
        input.value = '';
        updateUI();
        saveLocalSave();
    }
}

// ========== АВТОКЛИКЕР ==========
document.getElementById('autoStartBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (gameState.autoclickers === 0) {
        showNotification('❌ Ошибка', 'Купите автокликер в магазине!', 'error');
        return;
    }
    
    if (gameState.autoClicker.enabled) {
        gameState.autoClicker.enabled = false;
        document.getElementById('autoStatus').textContent = '⏸️';
        document.getElementById('autoStartBtn').textContent = '▶️';
    } else {
        gameState.autoClicker.enabled = true;
        gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime;
        document.getElementById('autoStatus').textContent = '⚡';
        document.getElementById('autoStartBtn').textContent = '⏹️';
        document.getElementById('autoProgress').style.width = '100%';
    }
    
    saveLocalSave();
});

document.getElementById('autoUpgradeBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    const price = 100 * gameState.autoClicker.level;
    if (gameState.balance >= price) {
        gameState.balance -= price;
        gameState.autoClicker.level++;
        gameState.autoClicker.maxTime += 30;
        showNotification('⬆️ Улучшено!', `Уровень автокликера ${gameState.autoClicker.level}`, 'success');
        updateUI();
        saveLocalSave();
    } else {
        showNotification('❌ Недостаточно', `Нужно ${price}💰`, 'error');
    }
});

document.getElementById('autoBoostBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    showNotification('⚡ Турбо', 'Скоро будет доступно', 'info');
});

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
    
    const now = Date.now();
    const timeLeft = (24 * 60 * 60 * 1000) - (now - gameState.lastGift);
    
    if (timeLeft <= 0) {
        timer.textContent = 'Готов!';
        gift.classList.add('available');
    } else {
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        timer.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        gift.classList.remove('available');
    }
}

// ========== ИГРОВОЙ ЦИКЛ ==========
function startGameLoop() {
    setInterval(() => {
        if (!gameState.nickname) return;
        
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            gameState.autoClicker.timeLeft--;
            
            const progress = (gameState.autoClicker.timeLeft / gameState.autoClicker.maxTime) * 100;
            const progressBar = document.getElementById('autoProgress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (gameState.autoclickers > 0) {
                const income = gameState.autoClicker.level * gameState.power;
                gameState.balance += income;
                gameState.totalEarned += income;
            }
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
                document.getElementById('autoStatus').textContent = '⏸️';
                document.getElementById('autoStartBtn').textContent = '▶️';
            }
        }
        
        updateUI();
    }, 1000);
    
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
    
    setInterval(updateGiftTimer, 60000);
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    document.getElementById('balance').textContent = Math.floor(gameState.balance);
    document.getElementById('power').textContent = gameState.power;
    document.getElementById('cps').textContent = gameState.autoclickers;
    
    document.getElementById('profileClicks').textContent = gameState.totalClicks;
    document.getElementById('profileEarned').textContent = Math.floor(gameState.totalEarned);
    document.getElementById('profileCases').textContent = gameState.casesOpened;
    document.getElementById('profileBestWin').textContent = gameState.bestCaseWin + '💰';
    
    const level = Math.floor(gameState.totalClicks / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${level}`;
    document.getElementById('profileLevel').textContent = `Уровень ${level}`;
    
    document.getElementById('autoLevel').textContent = `Ур.${gameState.autoClicker.level}`;
    
    updateGiftTimer();
    
    if (gameState.settings.autoSave && gameState.nickname) {
        saveLocalSave();
    }
}

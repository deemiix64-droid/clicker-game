// ========== СЕКРЕТНЫЙ КЛЮЧ ==========
const SECRET_KEY = "CLICKER_SECRET_KEY_2026_SUPER_SECURE";
const SALT = "CLICKER_SALT_3.3";

// ========== КЛАСС ДЛЯ ЗАЩИТЫ ДАННЫХ ==========
class SecurityManager {
    static hashData(data) {
        return CryptoJS.SHA256(data + SALT).toString();
    }
    
    static createSignature(data) {
        const dataString = JSON.stringify(data) + SECRET_KEY;
        return CryptoJS.SHA256(dataString).toString();
    }
    
    static verifyIntegrity(data, signature) {
        const calculatedSignature = this.createSignature(data);
        return calculatedSignature === signature;
    }
    
    static encryptData(data) {
        const dataString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
    }
    
    static decryptData(encryptedData) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch (e) {
            throw new Error('Неверный формат файла или файл поврежден');
        }
    }
    
    static getDeviceFingerprint() {
        const navigator = window.navigator;
        const screen = window.screen;
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown'
        ].join('|');
        
        return CryptoJS.SHA256(fingerprint).toString();
    }
}

// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    nickname: 'Игрок',
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
    booster: {
        active: false,
        timeLeft: 0,
        multiplier: 1
    },
    turbo: {
        active: false,
        timeLeft: 0,
        multiplier: 2
    },
    autoClicker: {
        enabled: true,  // Включен ли автокликер
        manualMode: false // Ручной режим (выключен)
    },
    autoPosition: {
        x: window.innerWidth - 150,
        y: window.innerHeight - 150
    },
    version: '3.3',
    deviceId: null,
    signature: null
};

// ========== ПРОВЕРКА ФАЙЛА .click ==========
function validateClickFile(data) {
    const signature = data.signature;
    const dataWithoutSignature = { ...data };
    delete dataWithoutSignature.signature;
    
    if (!SecurityManager.verifyIntegrity(dataWithoutSignature, signature)) {
        return { valid: false, reason: 'Файл поврежден или изменен' };
    }
    
    if (data.version !== '3.3') {
        return { valid: false, reason: 'Несовместимая версия' };
    }
    
    if (data.balance < 0 || data.balance > 1000000) {
        return { valid: false, reason: 'Баланс вне допустимых пределов' };
    }
    
    if (data.autoclickers > 1000) {
        return { valid: false, reason: 'Слишком много автокликеров' };
    }
    
    if (data.power > 100) {
        return { valid: false, reason: 'Сила клика завышена' };
    }
    
    return { valid: true };
}

// ========== СОХРАНЕНИЕ В ФАЙЛ ==========
function saveToFile() {
    const dataToSave = { 
        ...gameState,
        deviceId: SecurityManager.getDeviceFingerprint(),
        exportDate: new Date().toISOString()
    };
    
    const signature = SecurityManager.createSignature(dataToSave);
    dataToSave.signature = signature;
    
    const encrypted = SecurityManager.encryptData(dataToSave);
    
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameState.nickname}_clicker_${Date.now()}.click`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Успешно!', 'Игра сохранена в .click файл', 'success');
}

// ========== ЗАГРУЗКА ИЗ ФАЙЛА ==========
function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.click';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const decrypted = SecurityManager.decryptData(event.target.result);
                
                const validation = validateClickFile(decrypted);
                if (!validation.valid) {
                    throw new Error(validation.reason);
                }
                
                gameState = { ...decrypted };
                
                document.getElementById('playerName').textContent = gameState.nickname;
                updateUI();
                
                document.getElementById('nicknameModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                // Восстанавливаем позицию автокликера
                if (gameState.autoPosition) {
                    const auto = document.getElementById('floatingAuto');
                    auto.style.left = gameState.autoPosition.x + 'px';
                    auto.style.top = gameState.autoPosition.y + 'px';
                    auto.style.right = 'auto';
                    auto.style.bottom = 'auto';
                }
                
                showNotification('Успешно!', 'Игра загружена из файла', 'success');
                
            } catch (error) {
                showNotification('Ошибка загрузки!', error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ========== СИСТЕМА УВЕДОМЛЕНИЙ ==========
function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'notificationSlide 0.5s reverse';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// ========== ПЕРЕКЛЮЧЕНИЕ ТЕМ ==========
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('clicker_theme', theme);
}

const savedTheme = localStorage.getItem('clicker_theme') || 'dark';
setTheme(savedTheme);

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        setTheme(theme);
        showNotification('Тема изменена', `Активирована ${theme} тема`, 'info');
    });
});

// ========== УПРАВЛЕНИЕ НИКОМ ==========
function showNicknameModal() {
    document.getElementById('nicknameModal').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
}

function hideNicknameModal() {
    document.getElementById('nicknameModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
}

document.getElementById('startNewGame').addEventListener('click', () => {
    const nickname = document.getElementById('nicknameInput').value.trim() || 'Игрок';
    
    gameState = {
        ...gameState,
        nickname: nickname,
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
        booster: { active: false, timeLeft: 0, multiplier: 1 },
        turbo: { active: false, timeLeft: 0, multiplier: 2 },
        autoClicker: { enabled: true, manualMode: false },
        deviceId: SecurityManager.getDeviceFingerprint()
    };
    
    document.getElementById('playerName').textContent = nickname;
    hideNicknameModal();
    updateUI();
    showNotification('Добро пожаловать!', `Привет, ${nickname}!`, 'success');
});

document.getElementById('loadGameFile').addEventListener('click', loadFromFile);

document.getElementById('changeNickBtn').addEventListener('click', () => {
    const newNick = prompt('Введите новый ник:', gameState.nickname);
    if (newNick && newNick.trim()) {
        gameState.nickname = newNick.trim();
        document.getElementById('playerName').textContent = gameState.nickname;
        showNotification('Ник изменен', `Теперь вас зовут ${gameState.nickname}`, 'success');
        updateUI();
    }
});

// ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
function updateUI() {
    document.getElementById('balance').textContent = Math.floor(gameState.balance);
    document.getElementById('power').textContent = gameState.power;
    document.getElementById('cps').textContent = gameState.autoclickers;
    document.getElementById('playerName').textContent = gameState.nickname;
    
    // Автокликер
    document.getElementById('autoCount').textContent = gameState.autoclickers;
    const autoTimer = document.getElementById('autoTimer');
    const autoStatus = document.getElementById('autoStatus');
    
    // Обновляем статус автокликера
    if (!gameState.autoClicker.enabled || gameState.autoClicker.manualMode) {
        autoStatus.textContent = '⏸️';
        autoTimer.textContent = `+0/сек (выкл)`;
    } else if (gameState.turbo.active) {
        autoStatus.textContent = '⚡';
        autoTimer.textContent = `+${gameState.autoclickers * 2}/сек (${gameState.turbo.timeLeft}с)`;
        document.getElementById('floatingAuto').classList.add('turbo-mode');
    } else if (gameState.booster.active) {
        autoStatus.textContent = '🚀';
        autoTimer.textContent = `+${gameState.autoclickers * 2}/сек (${gameState.booster.timeLeft}с)`;
        document.getElementById('floatingAuto').classList.remove('turbo-mode');
    } else {
        autoStatus.textContent = '▶️';
        autoTimer.textContent = `+${gameState.autoclickers}/сек`;
        document.getElementById('floatingAuto').classList.remove('turbo-mode');
    }
    
    // Обновляем кнопки управления
    const powerBtn = document.getElementById('autoPowerBtn');
    const toggleBtn = document.getElementById('autoToggleBtn');
    
    if (gameState.turbo.active) {
        powerBtn.classList.add('active');
        powerBtn.textContent = '⏹️';
    } else {
        powerBtn.classList.remove('active');
        powerBtn.textContent = '▶️';
    }
    
    if (gameState.autoClicker.manualMode) {
        toggleBtn.classList.remove('active');
        toggleBtn.textContent = '⏸️';
    } else {
        toggleBtn.classList.add('active');
        toggleBtn.textContent = '▶️';
    }
    
    // Скин кнопки
    const clickBtn = document.getElementById('clickBtn');
    clickBtn.className = `mega-click-btn skin-${gameState.skin}`;
    
    // Профиль
    document.getElementById('totalClicks').textContent = gameState.totalClicks;
    document.getElementById('totalEarned').textContent = Math.floor(gameState.totalEarned);
    document.getElementById('boxesOpened').textContent = gameState.boxesOpened;
    document.getElementById('daysActive').textContent = gameState.daysActive;
    
    const level = Math.floor(gameState.totalClicks / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${level}`;
}

// ========== КЛИК ==========
document.getElementById('clickBtn').addEventListener('click', () => {
    const multiplier = (gameState.booster && gameState.booster.active) ? 2 : 1;
    const gain = gameState.power * multiplier;
    
    gameState.balance += gain;
    gameState.totalClicks++;
    gameState.totalEarned += gain;
    
    const btn = document.getElementById('clickBtn');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = '', 100);
    
    updateUI();
});

// ========== ПЛАВАЮЩИЙ АВТОКЛИКЕР (клик) ==========
document.getElementById('floatingAuto').addEventListener('click', (e) => {
    // Не срабатывает при клике на кнопки управления
    if (e.target.closest('.auto-power') || e.target.closest('.auto-toggle') || e.target.closest('.auto-drag-handle')) {
        return;
    }
    
    const multiplier = (gameState.booster && gameState.booster.active) ? 2 : 1;
    const gain = gameState.power * multiplier;
    
    gameState.balance += gain;
    gameState.totalClicks++;
    gameState.totalEarned += gain;
    
    const auto = document.getElementById('floatingAuto');
    auto.style.transform = 'scale(1.2)';
    setTimeout(() => auto.style.transform = '', 200);
    
    updateUI();
});

// ========== УПРАВЛЕНИЕ АВТОКЛИКЕРОМ ==========

// Кнопка турбо режима (2 минуты)
document.getElementById('autoPowerBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (gameState.turbo.active) {
        // Выключаем турбо
        gameState.turbo.active = false;
        gameState.turbo.timeLeft = 0;
        showNotification('Турбо выключен', 'Режим x2 отключен', 'info');
    } else {
        // Включаем турбо на 2 минуты (если есть автокликеры)
        if (gameState.autoclickers > 0) {
            gameState.turbo.active = true;
            gameState.turbo.timeLeft = 120; // 2 минуты = 120 секунд
            showNotification('Турбо режим!', 'x2 на 2 минуты', 'success');
        } else {
            showNotification('Ошибка', 'Купите сначала автокликер!', 'error');
        }
    }
    
    updateUI();
});

// Кнопка вкл/выкл автокликера
document.getElementById('autoToggleBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    gameState.autoClicker.manualMode = !gameState.autoClicker.manualMode;
    
    if (gameState.autoClicker.manualMode) {
        showNotification('Автокликер выключен', 'Ручной режим', 'warning');
    } else {
        showNotification('Автокликер включен', 'Автоматический режим', 'success');
    }
    
    updateUI();
});

// ========== ПЕРЕМЕЩЕНИЕ АВТОКЛИКЕРА ==========
let isDragging = false;
let startX, startY, startLeft, startTop;

const autoElement = document.getElementById('floatingAuto');
const dragHandle = document.getElementById('autoDragHandle');

dragHandle.addEventListener('mousedown', startDrag);
dragHandle.addEventListener('touchstart', startDrag, { passive: false });

function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    autoElement.classList.add('dragging');
    
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    
    startX = clientX;
    startY = clientY;
    
    const rect = autoElement.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;
    
    // Ограничиваем краями экрана
    const rect = autoElement.getBoundingClientRect();
    newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, newLeft));
    newTop = Math.max(0, Math.min(window.innerHeight - rect.height, newTop));
    
    autoElement.style.left = newLeft + 'px';
    autoElement.style.top = newTop + 'px';
    autoElement.style.right = 'auto';
    autoElement.style.bottom = 'auto';
}

function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    autoElement.classList.remove('dragging');
    
    // Сохраняем позицию
    const rect = autoElement.getBoundingClientRect();
    gameState.autoPosition = {
        x: rect.left,
        y: rect.top
    };
    
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
}

// ========== ТАЙМЕР АВТОКЛИКЕРА ==========
setInterval(() => {
    // Автокликер работает только если включен
    if (gameState.autoclickers > 0 && !gameState.autoClicker.manualMode && gameState.autoClicker.enabled) {
        let multiplier = 1;
        
        if (gameState.turbo.active) {
            multiplier = gameState.turbo.multiplier;
        } else if (gameState.booster.active) {
            multiplier = gameState.booster.multiplier;
        }
        
        const gain = gameState.autoclickers * gameState.power * multiplier;
        
        gameState.balance += gain;
        gameState.totalEarned += gain;
        
        const auto = document.getElementById('floatingAuto');
        auto.style.boxShadow = '0 0 30px #4CAF50';
        setTimeout(() => auto.style.boxShadow = '', 200);
        
        updateUI();
    }
    
    // Обновляем таймеры
    if (gameState.turbo.active) {
        gameState.turbo.timeLeft--;
        if (gameState.turbo.timeLeft <= 0) {
            gameState.turbo.active = false;
            showNotification('Турбо режим закончился', 'x2 больше не активен', 'info');
        }
    }
    
    if (gameState.booster.active) {
        gameState.booster.timeLeft--;
        if (gameState.booster.timeLeft <= 0) {
            gameState.booster.active = false;
            showNotification('Бустер закончился', 'Множитель больше не активен', 'info');
        }
    }
}, 1000);

// ========== МАГАЗИН ==========
document.querySelectorAll('[data-item]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const item = e.target.dataset.item;
        const price = parseInt(e.target.dataset.price);
        
        if (gameState.balance >= price) {
            gameState.balance -= price;
            
            switch(item) {
                case 'autoclicker':
                    gameState.autoclickers++;
                    showNotification('Покупка успешна!', `Автокликер +1 (всего: ${gameState.autoclickers})`, 'success');
                    break;
                case 'turbo':
                    if (gameState.autoclickers > 0) {
                        gameState.turbo.active = true;
                        gameState.turbo.timeLeft = 120; // 2 минуты
                        showNotification('Турбо активирован!', 'x2 на 2 минуты', 'success');
                    } else {
                        showNotification('Ошибка', 'Сначала купите автокликер!', 'error');
                        gameState.balance += price;
                    }
                    break;
                case 'power':
                    gameState.power++;
                    showNotification('Покупка успешна!', `Сила клика +1 (теперь: ${gameState.power})`, 'success');
                    break;
                case 'booster':
                    if (!gameState.booster) gameState.booster = { active: false, timeLeft: 0, multiplier: 1 };
                    gameState.booster.active = true;
                    gameState.booster.timeLeft = 30;
                    showNotification('Бустер активирован!', 'x2 на 30 секунд', 'warning');
                    break;
                case 'key':
                    localStorage.setItem('hasKey', 'true');
                    showNotification('Ключ получен!', 'Следующий бокс гарантирует джекпот', 'success');
                    break;
            }
            
            updateUI();
        } else {
            showNotification('Недостаточно средств!', `Нужно еще ${price - gameState.balance} монет`, 'error');
        }
    });
});

// ========== СКИНЫ ==========
document.querySelectorAll('.skin-card').forEach(card => {
    card.addEventListener('click', () => {
        const skin = card.dataset.skin;
        const price = parseInt(card.dataset.price);
        
        if (gameState.ownedSkins.includes(skin)) {
            gameState.skin = skin;
            showNotification('Скин надет!', 'Кнопка изменила цвет', 'success');
            updateUI();
        } else {
            if (gameState.balance >= price) {
                gameState.balance -= price;
                gameState.ownedSkins.push(skin);
                gameState.skin = skin;
                showNotification('Скин куплен!', 'Теперь он доступен в коллекции', 'success');
                updateUI();
            } else {
                showNotification('Недостаточно средств!', `Нужно еще ${price - gameState.balance} монет`, 'error');
            }
        }
    });
});

// ========== АНИМАЦИЯ БОКСА ==========
function createConfetti() {
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 1500);
    }
}

function animateBox() {
    const boxBtn = document.getElementById('boxBtn');
    boxBtn.classList.add('box-opening');
    createConfetti();
    setTimeout(() => boxBtn.classList.remove('box-opening'), 600);
}

// ========== БОКСЫ ==========
document.getElementById('boxBtn').addEventListener('click', () => {
    if (gameState.balance >= 100) {
        animateBox();
        gameState.balance -= 100;
        gameState.boxesOpened++;
        
        const hasKey = localStorage.getItem('hasKey') === 'true';
        let reward;
        
        setTimeout(() => {
            if (hasKey) {
                reward = 500;
                localStorage.removeItem('hasKey');
                showNotification('КЛЮЧ ИСПОЛЬЗОВАН!', 'ДЖЕКПОТ! +500 монет!', 'warning');
            } else {
                const random = Math.random();
                if (random < 0.5) {
                    reward = 50;
                    showNotification('Бокс открыт', 'Вы получили 50 монет', 'info');
                } else if (random < 0.8) {
                    reward = 100;
                    showNotification('Бокс открыт', 'Вы получили 100 монет', 'success');
                } else if (random < 0.95) {
                    reward = 200;
                    showNotification('Бокс открыт', 'Вы получили 200 монет!', 'success');
                } else {
                    reward = 500;
                    createConfetti();
                    showNotification('ДЖЕКПОТ!', '500 монет! Поздравляем!', 'warning');
                }
            }
            
            gameState.balance += reward;
            updateUI();
        }, 300);
    } else {
        showNotification('Недостаточно монет!', 'Нужно 100 монет', 'error');
    }
});

// ========== ЕЖЕДНЕВНАЯ НАГРАДА ==========
document.getElementById('dailyBtn').addEventListener('click', () => {
    const today = new Date().toDateString();
    
    if (gameState.lastDaily !== today) {
        gameState.balance += 500;
        gameState.lastDaily = today;
        gameState.daysActive++;
        
        showNotification('Ежедневная награда!', '+500 монет', 'success');
        updateUI();
    } else {
        showNotification('Уже получали!', 'Возвращайтесь завтра', 'warning');
    }
});

// ========== ПРОМОКОДЫ ==========
document.getElementById('applyPromo').addEventListener('click', () => {
    const code = document.getElementById('promoInput').value.toUpperCase();
    
    if (gameState.usedCodes.includes(code)) {
        showNotification('Промокод уже использован!', 'Попробуйте другой', 'error');
        return;
    }
    
    let reward = 0;
    let message = '';
    
    switch(code) {
        case 'START':
            reward = 100;
            message = '+100 монет';
            break;
        case 'CLICKER':
            reward = 200;
            message = '+200 монет';
            break;
        case 'GIFT':
            reward = 300;
            message = '+300 монет';
            break;
        case 'POWER':
            gameState.power++;
            message = 'Сила клика +1';
            break;
        case 'BOX':
            localStorage.setItem('hasKey', 'true');
            message = 'Получен ключ от бокса';
            break;
        case 'TURBO':
            if (gameState.autoclickers > 0) {
                gameState.turbo.active = true;
                gameState.turbo.timeLeft = 120;
                message = 'Турбо режим на 2 минуты!';
            } else {
                showNotification('Ошибка', 'Сначала купите автокликер!', 'error');
                return;
            }
            break;
        default:
            showNotification('Неверный промокод!', 'Попробуйте START, CLICKER, GIFT', 'error');
            return;
    }
    
    if (reward > 0) {
        gameState.balance += reward;
    }
    
    gameState.usedCodes.push(code);
    showNotification('Промокод активирован!', message, 'success');
    updateUI();
});

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
function updateLeaderboard() {
    const leaders = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    const existingIndex = leaders.findIndex(l => l.name === gameState.nickname);
    if (existingIndex >= 0) {
        leaders[existingIndex].score = gameState.balance;
    } else {
        leaders.push({ name: gameState.nickname, score: gameState.balance });
    }
    
    leaders.sort((a, b) => b.score - a.score);
    
    const topLeaders = leaders.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(topLeaders));
    
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    topLeaders.forEach((leader, index) => {
        list.innerHTML += `
            <div class="leader-item">
                <span>${index + 1}. ${leader.name}</span>
                <span>💰 ${Math.floor(leader.score)}</span>
            </div>
        `;
    });
}

// ========== ПЕРЕКЛЮЧЕНИЕ ТАБОВ ==========
document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// ========== КНОПКИ СОХРАНЕНИЯ ==========
document.getElementById('saveToFile').addEventListener('click', saveToFile);
document.getElementById('loadFromFile').addEventListener('click', loadFromFile);

// ========== АНТИ-ЧИТ ==========
setInterval(() => {
    const start = Date.now();
    debugger;
    if (Date.now() - start > 100) {
        showNotification('⚠️ Обнаружена консоль', 'Не пытайтесь взломать игру', 'warning');
        gameState.balance = Math.max(0, gameState.balance - 100);
        updateUI();
    }
}, 10000);

// ========== СОХРАНЕНИЕ ПРИ ВЫХОДЕ ==========
window.addEventListener('beforeunload', () => {
    if (gameState.nickname !== 'Игрок') {
        saveToFile();
    }
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
showNicknameModal();
updateLeaderboard();
setInterval(updateLeaderboard, 5000);
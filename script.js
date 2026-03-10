// ========== СЕКРЕТНЫЙ КЛЮЧ ==========
const SECRET_KEY = "CLICKER_SECRET_KEY_2026_SUPER_SECURE";
const SALT = "CLICKER_SALT_3.5";

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
    booster: { active: false, timeLeft: 0 },
    turbo: { active: false, timeLeft: 0 },
    autoClicker: { 
        enabled: false, // По умолчанию выключен
        manualMode: false,
        timeLeft: 0, // Время работы в секундах
        maxTime: 120 // Максимальное время работы (2 минуты)
    },
    autoPosition: { x: window.innerWidth - 140, y: window.innerHeight - 180 },
    version: '3.5'
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Игра загружается...');
    
    // Показываем модальное окно
    document.getElementById('nicknameModal').style.display = 'flex';
    
    // Загружаем тему
    const savedTheme = localStorage.getItem('clicker_theme') || 'dark';
    setTheme(savedTheme);
    
    // Инициализируем обработчики
    initEventListeners();
    
    // Запускаем таймеры
    startGameLoop();
});

// ========== УСТАНОВКА ТЕМЫ ==========
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('clicker_theme', theme);
}

// ========== ЗАПУСК ИГРОВОГО ЦИКЛА ==========
function startGameLoop() {
    console.log('⏰ Игровой цикл запущен');
    
    // ОСНОВНОЙ ТАЙМЕР (каждую секунду)
    setInterval(() => {
        // Проверяем что игра активна
        if (gameState.nickname === 'Игрок') return;
        
        // ===== АВТОКЛИКЕР =====
        // Проверяем включен ли автокликер и есть ли время
        if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
            // Уменьшаем время
            gameState.autoClicker.timeLeft--;
            
            // Начисляем деньги (если есть автокликеры)
            if (gameState.autoclickers > 0) {
                // Рассчитываем множитель
                let multiplier = 1;
                if (gameState.turbo.active) multiplier = 2;
                else if (gameState.booster.active) multiplier = 2;
                
                const gain = gameState.autoclickers * gameState.power * multiplier;
                gameState.balance += gain;
                gameState.totalEarned += gain;
                
                console.log(`🤖 Автокликер: +${gain} монет (осталось ${gameState.autoClicker.timeLeft}с)`);
                
                // Анимация
                const auto = document.getElementById('floatingAuto');
                if (auto) {
                    auto.style.transform = 'scale(1.1)';
                    auto.style.boxShadow = '0 0 30px #4CAF50';
                    setTimeout(() => {
                        auto.style.transform = '';
                        auto.style.boxShadow = '';
                    }, 200);
                }
            }
            
            // Если время вышло - выключаем
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
                console.log('⏸️ Автокликер остановлен (время вышло)');
                showNotification('Автокликер остановлен', 'Время работы истекло', 'info');
            }
        }
        
        // ===== ТУРБО РЕЖИМ =====
        if (gameState.turbo.active) {
            gameState.turbo.timeLeft--;
            if (gameState.turbo.timeLeft <= 0) {
                gameState.turbo.active = false;
                console.log('⚡ Турбо закончился');
                showNotification('Турбо закончился', 'Режим x2 отключен', 'info');
            }
        }
        
        // ===== БУСТЕР =====
        if (gameState.booster.active) {
            gameState.booster.timeLeft--;
            if (gameState.booster.timeLeft <= 0) {
                gameState.booster.active = false;
                console.log('🚀 Бустер закончился');
                showNotification('Бустер закончился', 'Режим x2 отключен', 'info');
            }
        }
        
        updateUI();
    }, 1000);
    
    // АВТОСОХРАНЕНИЕ (каждые 30 секунд)
    setInterval(() => {
        if (gameState.nickname !== 'Игрок') {
            console.log('💾 Автосохранение...');
            saveToStorage();
        }
    }, 30000);
}

// ========== СОХРАНЕНИЕ ==========
function saveToStorage() {
    localStorage.setItem('clicker_save', JSON.stringify(gameState));
}

function loadFromStorage() {
    const saved = localStorage.getItem('clicker_save');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            gameState = { ...gameState, ...loaded };
            console.log('📂 Загружено из localStorage');
        } catch (e) {
            console.error('Ошибка загрузки');
        }
    }
}

// ========== СОХРАНЕНИЕ В ФАЙЛ ==========
function saveToFile() {
    try {
        // Подготавливаем данные для сохранения
        const dataToSave = { ...gameState };
        
        // Создаем простую подпись (без сложного шифрования)
        const dataString = JSON.stringify(dataToSave);
        const signature = btoa(dataString + SECRET_KEY).slice(0, 20);
        
        // Сохраняем в простом формате
        const saveData = {
            data: dataToSave,
            signature: signature,
            timestamp: Date.now()
        };
        
        // Создаем файл
        const jsonString = JSON.stringify(saveData);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${gameState.nickname}_clicker_${Date.now()}.click`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ Файл сохранен');
        showNotification('Успешно!', 'Игра сохранена в файл', 'success');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showNotification('Ошибка!', 'Не удалось сохранить файл', 'error');
    }
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
                // Просто парсим JSON (без сложной проверки)
                const fileContent = event.target.result;
                const saveData = JSON.parse(fileContent);
                
                // Проверяем структуру
                if (!saveData.data) {
                    throw new Error('Неверный формат файла');
                }
                
                // Простая проверка подписи
                const dataString = JSON.stringify(saveData.data);
                const expectedSignature = btoa(dataString + SECRET_KEY).slice(0, 20);
                
                if (saveData.signature !== expectedSignature) {
                    // Если подпись не совпадает, но данные есть - всё равно загружаем
                    console.warn('⚠️ Подпись не совпадает, но загружаем');
                }
                
                // Загружаем данные
                gameState = { ...gameState, ...saveData.data };
                
                // Обновляем интерфейс
                document.getElementById('playerName').textContent = gameState.nickname;
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
                
                console.log('✅ Файл загружен');
                updateUI();
                showNotification('Успешно!', 'Игра загружена из файла', 'success');
                
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                showNotification('Ошибка!', 'Не удалось загрузить файл: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ========== УВЕДОМЛЕНИЯ ==========
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

// ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
function updateUI() {
    document.getElementById('balance').textContent = Math.floor(gameState.balance);
    document.getElementById('power').textContent = gameState.power;
    document.getElementById('cps').textContent = gameState.autoclickers;
    document.getElementById('autoCount').textContent = gameState.autoclickers;
    
    // Обновляем статус автокликера
    const autoStatus = document.getElementById('autoStatus');
    const autoTimer = document.getElementById('autoTimer');
    const autoElement = document.getElementById('floatingAuto');
    
    if (gameState.autoClicker.enabled && gameState.autoClicker.timeLeft > 0) {
        // Автокликер работает
        if (gameState.turbo.active) {
            autoStatus.textContent = '⚡ ТУРБО';
            autoTimer.textContent = `+${gameState.autoclickers * 2}/сек (ост. ${gameState.autoClicker.timeLeft}с)`;
            autoElement.classList.add('turbo');
        } else if (gameState.booster.active) {
            autoStatus.textContent = '🚀 БУСТЕР';
            autoTimer.textContent = `+${gameState.autoclickers * 2}/сек (ост. ${gameState.autoClicker.timeLeft}с)`;
            autoElement.classList.remove('turbo');
        } else {
            autoStatus.textContent = '▶️ РАБОТАЕТ';
            autoTimer.textContent = `+${gameState.autoclickers}/сек (ост. ${gameState.autoClicker.timeLeft}с)`;
            autoElement.classList.remove('turbo');
        }
    } else {
        // Автокликер выключен
        autoStatus.textContent = '⏸️ ВЫКЛ';
        autoTimer.textContent = '+0/сек';
        autoElement.classList.remove('turbo');
    }
    
    // Обновляем текст кнопки включения
    const powerBtn = document.getElementById('autoPowerBtn');
    if (gameState.autoClicker.enabled) {
        powerBtn.textContent = '⏹️';
        powerBtn.title = 'Остановить';
    } else {
        powerBtn.textContent = '▶️';
        powerBtn.title = 'Запустить на 2 минуты';
    }
    
    // Обновляем скин кнопки
    const clickBtn = document.getElementById('clickBtn');
    clickBtn.className = `clicker-btn skin-${gameState.skin}`;
    
    // Обновляем статистику
    document.getElementById('totalClicks').textContent = gameState.totalClicks;
    document.getElementById('totalEarned').textContent = Math.floor(gameState.totalEarned);
    document.getElementById('boxesOpened').textContent = gameState.boxesOpened;
    document.getElementById('daysActive').textContent = gameState.daysActive;
    
    // Обновляем уровень
    const level = Math.floor(gameState.totalClicks / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${level}`;
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
function initEventListeners() {
    console.log('🔧 Инициализация обработчиков...');
    
    // НОВАЯ ИГРА
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
            booster: { active: false, timeLeft: 0 },
            turbo: { active: false, timeLeft: 0 },
            autoClicker: { 
                enabled: false, 
                manualMode: false,
                timeLeft: 0,
                maxTime: 120
            }
        };
        
        document.getElementById('playerName').textContent = nickname;
        document.getElementById('nicknameModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        console.log('🎮 Новая игра для', nickname);
        updateUI();
        showNotification('Добро пожаловать!', `Привет, ${nickname}!`, 'success');
    });
    
    // ЗАГРУЗКА ИЗ ФАЙЛА
    document.getElementById('loadGameFile').addEventListener('click', loadFromFile);
    
    // СМЕНА НИКА
    document.getElementById('changeNickBtn').addEventListener('click', () => {
        const newNick = prompt('Введите новый ник:', gameState.nickname);
        if (newNick && newNick.trim()) {
            gameState.nickname = newNick.trim();
            document.getElementById('playerName').textContent = gameState.nickname;
            showNotification('Ник изменен', `Теперь вас зовут ${gameState.nickname}`, 'success');
            updateUI();
        }
    });
    
    // СОХРАНЕНИЕ/ЗАГРУЗКА
    document.getElementById('saveToFile').addEventListener('click', saveToFile);
    document.getElementById('loadFromFile').addEventListener('click', loadFromFile);
    
    // ТЕМЫ
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            showNotification('Тема изменена', `Активирована ${theme} тема`, 'info');
        });
    });
    
    // КЛИК ПО КНОПКЕ
    document.getElementById('clickBtn').addEventListener('click', () => {
        const multiplier = (gameState.booster.active || gameState.turbo.active) ? 2 : 1;
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
    
    // КЛИК ПО АВТОКЛИКЕРУ
    document.getElementById('floatingAuto').addEventListener('click', (e) => {
        if (e.target.closest('.auto-btn') || e.target.closest('.auto-drag')) return;
        
        const multiplier = (gameState.booster.active || gameState.turbo.active) ? 2 : 1;
        const gain = gameState.power * multiplier;
        
        gameState.balance += gain;
        gameState.totalClicks++;
        gameState.totalEarned += gain;
        
        // Анимация
        const auto = document.getElementById('floatingAuto');
        auto.style.transform = 'scale(1.1)';
        setTimeout(() => auto.style.transform = '', 200);
        
        updateUI();
    });
    
    // КНОПКА ВКЛ/ВЫКЛ АВТОКЛИКЕРА (ЗАПУСК НА 2 МИНУТЫ)
    document.getElementById('autoPowerBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (gameState.autoclickers === 0) {
            showNotification('Ошибка', 'Купите автокликер!', 'error');
            return;
        }
        
        if (gameState.autoClicker.enabled) {
            // Выключаем
            gameState.autoClicker.enabled = false;
            gameState.autoClicker.timeLeft = 0;
            console.log('⏸️ Автокликер остановлен');
            showNotification('Автокликер остановлен', '', 'info');
        } else {
            // Включаем на 2 минуты
            gameState.autoClicker.enabled = true;
            gameState.autoClicker.timeLeft = 120; // 2 минуты
            console.log('▶️ Автокликер запущен на 2 минуты');
            showNotification('Автокликер запущен', 'Будет работать 2 минуты', 'success');
        }
        
        updateUI();
    });
    
    // КНОПКА ТУРБО (ПОКУПНОЙ)
    document.getElementById('autoToggleBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (gameState.autoclickers === 0) {
            showNotification('Ошибка', 'Купите автокликер!', 'error');
            return;
        }
        
        if (gameState.turbo.active) {
            gameState.turbo.active = false;
            gameState.turbo.timeLeft = 0;
            console.log('⚡ Турбо выключен');
            showNotification('Турбо выключен', '', 'info');
        } else {
            // Проверяем баланс для турбо
            if (gameState.balance >= 100) {
                gameState.balance -= 100;
                gameState.turbo.active = true;
                gameState.turbo.timeLeft = 120;
                console.log('⚡ Турбо куплен на 2 минуты');
                showNotification('Турбо режим!', 'x2 на 2 минуты', 'success');
            } else {
                showNotification('Недостаточно средств!', 'Турбо стоит 100💰', 'error');
            }
        }
        
        updateUI();
    });
    
    // МАГАЗИН
    document.querySelectorAll('[data-item]').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.dataset.item;
            const price = parseInt(btn.dataset.price);
            
            if (gameState.balance >= price) {
                gameState.balance -= price;
                
                switch(item) {
                    case 'autoclicker':
                        gameState.autoclickers++;
                        console.log('🤖 Куплен автокликер, теперь:', gameState.autoclickers);
                        showNotification('Успешно!', `Автокликер +1 (всего: ${gameState.autoclickers})`, 'success');
                        break;
                    case 'turbo':
                        gameState.turbo.active = true;
                        gameState.turbo.timeLeft = 120;
                        console.log('⚡ Куплен турбо режим');
                        showNotification('Турбо активирован!', 'x2 на 2 минуты', 'success');
                        break;
                    case 'power':
                        gameState.power++;
                        console.log('💪 Сила увеличена до:', gameState.power);
                        showNotification('Успешно!', `Сила клика +1 (теперь: ${gameState.power})`, 'success');
                        break;
                    case 'booster':
                        gameState.booster.active = true;
                        gameState.booster.timeLeft = 30;
                        console.log('🚀 Бустер активирован');
                        showNotification('Бустер активирован!', 'x2 на 30 секунд', 'success');
                        break;
                    case 'key':
                        localStorage.setItem('hasKey', 'true');
                        console.log('🔑 Ключ получен');
                        showNotification('Ключ получен!', 'Следующий бокс гарантирует джекпот', 'success');
                        break;
                }
                
                updateUI();
            } else {
                showNotification('Недостаточно средств!', `Нужно еще ${price - gameState.balance} монет`, 'error');
            }
        });
    });
    
    // СКИНЫ
    document.querySelectorAll('.skin-item').forEach(item => {
        item.addEventListener('click', () => {
            const skin = item.dataset.skin;
            const price = parseInt(item.dataset.price);
            
            if (gameState.ownedSkins.includes(skin)) {
                gameState.skin = skin;
                console.log('🎨 Надет скин:', skin);
                showNotification('Скин надет!', 'Кнопка изменила цвет', 'success');
                updateUI();
            } else if (gameState.balance >= price) {
                gameState.balance -= price;
                gameState.ownedSkins.push(skin);
                gameState.skin = skin;
                console.log('🎨 Куплен скин:', skin);
                showNotification('Скин куплен!', 'Теперь он доступен', 'success');
                updateUI();
            } else {
                showNotification('Недостаточно средств!', `Нужно еще ${price - gameState.balance} монет`, 'error');
            }
        });
    });
    
    // ПРОМОКОДЫ
    document.getElementById('applyPromo').addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.toUpperCase();
        
        if (gameState.usedCodes.includes(code)) {
            showNotification('Промокод уже использован!', '', 'error');
            return;
        }
        
        let message = '';
        
        switch(code) {
            case 'START':
                gameState.balance += 100;
                message = '+100 монет';
                break;
            case 'CLICKER':
                gameState.balance += 200;
                message = '+200 монет';
                break;
            case 'GIFT':
                gameState.balance += 300;
                message = '+300 монет';
                break;
            case 'POWER':
                gameState.power++;
                message = 'Сила клика +1';
                break;
            case 'BOX':
                localStorage.setItem('hasKey', 'true');
                message = 'Ключ получен';
                break;
            case 'TURBO':
                gameState.turbo.active = true;
                gameState.turbo.timeLeft = 120;
                message = 'Турбо режим!';
                break;
            default:
                showNotification('Неверный код!', 'Попробуйте START, CLICKER, GIFT', 'error');
                return;
        }
        
        gameState.usedCodes.push(code);
        console.log('🔑 Промокод активирован:', code);
        showNotification('Промокод активирован!', message, 'success');
        updateUI();
    });
    
    // БОКС
    document.getElementById('boxBtn').addEventListener('click', () => {
        if (gameState.balance >= 100) {
            gameState.balance -= 100;
            gameState.boxesOpened++;
            
            const hasKey = localStorage.getItem('hasKey') === 'true';
            
            if (hasKey) {
                gameState.balance += 500;
                localStorage.removeItem('hasKey');
                console.log('🎁 Джекпот по ключу!');
                showNotification('ДЖЕКПОТ!', '+500 монет (ключ)', 'warning');
            } else {
                const random = Math.random();
                if (random < 0.5) {
                    gameState.balance += 50;
                    showNotification('Бокс открыт', '+50 монет', 'info');
                } else if (random < 0.8) {
                    gameState.balance += 100;
                    showNotification('Бокс открыт', '+100 монет', 'success');
                } else if (random < 0.95) {
                    gameState.balance += 200;
                    showNotification('Бокс открыт', '+200 монет', 'success');
                } else {
                    gameState.balance += 500;
                    console.log('🎁 ДЖЕКПОТ!');
                    showNotification('ДЖЕКПОТ!', '+500 монет', 'warning');
                }
            }
            
            updateUI();
        } else {
            showNotification('Недостаточно монет!', 'Нужно 100 монет', 'error');
        }
    });
    
    // ЕЖЕДНЕВНАЯ НАГРАДА
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance += 500;
            gameState.lastDaily = today;
            gameState.daysActive++;
            console.log('📅 Ежедневная награда получена');
            showNotification('Ежедневная награда!', '+500 монет', 'success');
            updateUI();
        } else {
            showNotification('Уже получали!', 'Возвращайтесь завтра', 'warning');
        }
    });
    
    // НАВИГАЦИЯ
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
    
    // ПЕРЕТАСКИВАНИЕ АВТОКЛИКЕРА
    const autoElement = document.getElementById('floatingAuto');
    const dragHandle = document.getElementById('autoDragHandle');
    
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
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
        if (!isDragging) return;
        
        isDragging = false;
        autoElement.classList.remove('dragging');
        
        const rect = autoElement.getBoundingClientRect();
        gameState.autoPosition = { x: rect.left, y: rect.top };
        
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }
    
    // ЛИДЕРЫ
    updateLeaderboard();
    setInterval(updateLeaderboard, 10000);
}

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
function updateLeaderboard() {
    const leaders = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    if (gameState.nickname !== 'Игрок') {
        const existing = leaders.findIndex(l => l.name === gameState.nickname);
        if (existing >= 0) {
            leaders[existing].score = gameState.balance;
        } else {
            leaders.push({ name: gameState.nickname, score: gameState.balance });
        }
    }
    
    leaders.sort((a, b) => b.score - a.score);
    const topLeaders = leaders.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(topLeaders));
    
    const list = document.getElementById('leaderboardList');
    list.innerHTML = topLeaders.map((l, i) => 
        `<div class="leader-row"><span>${i + 1}. ${l.name}</span><span>💰 ${Math.floor(l.score)}</span></div>`
    ).join('');
}

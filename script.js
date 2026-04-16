// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    nickname: '',
    deviceId: '',
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
    title: '👆 Новичок',
    titles: ['👆 Новичок'],
    role: '',
    friends: [],
    friendRequests: [],
    clan: null,
    clanRequests: [],
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
    version: '7.1'
};

// ========== ГЛОБАЛЬНЫЕ БАЗЫ ДАННЫХ ==========
let playersDB = [];
let leaderboardDB = [];
let clansDB = [];
let customPromoCodes = [];
let events = [];

// ========== ЗАГРУЗКА БАЗ ДАННЫХ ==========
function loadClansDB() {
    const saved = localStorage.getItem('clans_db');
    if (saved) {
        try {
            clansDB = JSON.parse(saved);
        } catch (e) {
            clansDB = [];
        }
    } else {
        clansDB = [];
    }
}

function saveClansDB() {
    localStorage.setItem('clans_db', JSON.stringify(clansDB));
}

// ========== СИСТЕМА ДРУЗЕЙ ==========
function sendFriendRequest(friendName) {
    if (friendName === gameState.nickname) {
        showNotif('❌ Ошибка', 'Нельзя добавить себя в друзья', 'error');
        return false;
    }
    
    const friend = playersDB.find(p => p.name === friendName);
    if (!friend) {
        showNotif('❌ Ошибка', 'Игрок не найден', 'error');
        return false;
    }
    
    if (gameState.friends.includes(friendName)) {
        showNotif('❌ Ошибка', 'Уже в друзьях', 'error');
        return false;
    }
    
    if (!friend.friendRequests) friend.friendRequests = [];
    if (friend.friendRequests.includes(gameState.nickname)) {
        showNotif('❌ Ошибка', 'Заявка уже отправлена', 'error');
        return false;
    }
    
    friend.friendRequests.push(gameState.nickname);
    savePlayersDB();
    showNotif('✅ Заявка отправлена', `Приглашение для ${friendName}`, 'success');
    return true;
}

function acceptFriendRequest(friendName) {
    const index = gameState.friendRequests.indexOf(friendName);
    if (index === -1) return;
    
    gameState.friendRequests.splice(index, 1);
    if (!gameState.friends) gameState.friends = [];
    gameState.friends.push(friendName);
    
    // Добавляем в друзья и другому игроку
    const friend = playersDB.find(p => p.name === friendName);
    if (friend) {
        if (!friend.friends) friend.friends = [];
        if (!friend.friends.includes(gameState.nickname)) {
            friend.friends.push(gameState.nickname);
        }
        // Удаляем заявку
        const reqIndex = friend.friendRequests.indexOf(gameState.nickname);
        if (reqIndex !== -1) friend.friendRequests.splice(reqIndex, 1);
        savePlayersDB();
    }
    
    showNotif('✅ Друг добавлен', friendName, 'success');
    renderFriends();
    saveGame();
}

function declineFriendRequest(friendName) {
    const index = gameState.friendRequests.indexOf(friendName);
    if (index !== -1) {
        gameState.friendRequests.splice(index, 1);
        showNotif('❌ Заявка отклонена', friendName, 'info');
        renderFriends();
        saveGame();
    }
}

function removeFriend(friendName) {
    const index = gameState.friends.indexOf(friendName);
    if (index !== -1) {
        gameState.friends.splice(index, 1);
        
        // Удаляем из друзей другого игрока
        const friend = playersDB.find(p => p.name === friendName);
        if (friend && friend.friends) {
            const friendIndex = friend.friends.indexOf(gameState.nickname);
            if (friendIndex !== -1) friend.friends.splice(friendIndex, 1);
            savePlayersDB();
        }
        
        showNotif('❌ Друг удален', friendName, 'info');
        renderFriends();
        saveGame();
    }
}

function renderFriends() {
    const container = document.getElementById('friendsList');
    const activeTab = document.querySelector('.friends-tab.active').dataset.friends;
    
    if (!container) return;
    
    if (activeTab === 'requests') {
        if (!gameState.friendRequests || gameState.friendRequests.length === 0) {
            container.innerHTML = '<div class="friend-placeholder">Нет входящих заявок</div>';
            return;
        }
        
        container.innerHTML = gameState.friendRequests.map(friend => `
            <div class="friend-request-card">
                <div class="friend-info">
                    <div class="friend-avatar">👤</div>
                    <div class="friend-details">
                        <div class="friend-name">${friend}</div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="request-accept" onclick="acceptFriendRequest('${friend}')">✅</button>
                    <button class="request-decline" onclick="declineFriendRequest('${friend}')">❌</button>
                </div>
            </div>
        `).join('');
        return;
    }
    
    let friends = gameState.friends || [];
    
    if (activeTab === 'online') {
        // Проверяем онлайн статус (по последнему входу)
        friends = friends.filter(f => {
            const player = playersDB.find(p => p.name === f);
            return player && (Date.now() - (player.lastSeen || 0) < 5 * 60 * 1000);
        });
    }
    
    if (friends.length === 0) {
        container.innerHTML = '<div class="friend-placeholder">У вас пока нет друзей</div>';
        return;
    }
    
    container.innerHTML = friends.map(friend => {
        const player = playersDB.find(p => p.name === friend);
        const isOnline = player && (Date.now() - (player.lastSeen || 0) < 5 * 60 * 1000);
        const level = player ? Math.floor((player.totalClicks || 0) / 100) + 1 : 1;
        
        return `
            <div class="friend-card">
                <div class="friend-info">
                    <div class="friend-avatar">👤</div>
                    <div class="friend-details">
                        <div class="friend-name">${friend}</div>
                        <div class="friend-status ${isOnline ? 'online' : ''}">
                            ${isOnline ? '🟢 Онлайн' : '⚫ Офлайн'} • Ур.${level}
                        </div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-action" onclick="viewPlayerProfile('${friend}')">👁️</button>
                    <button class="friend-action" onclick="sendGift('${friend}')">🎁</button>
                    <button class="friend-action" onclick="removeFriend('${friend}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function sendGift(friendName) {
    if (gameState.balance >= 100) {
        gameState.balance -= 100;
        showNotif('🎁 Подарок отправлен!', `${friendName} получил 100💰`, 'success');
        saveGame();
        updateUI();
    } else {
        showNotif('❌ Недостаточно', 'Нужно 100💰', 'error');
    }
}

// ========== СИСТЕМА КЛАНОВ ==========
function createClan(clanName, type) {
    if (gameState.clan) {
        showNotif('❌ Ошибка', 'Вы уже в клане', 'error');
        return false;
    }
    
    const price = 500;
    if (gameState.balance < price) {
        showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        return false;
    }
    
    if (clansDB.some(c => c.name.toLowerCase() === clanName.toLowerCase())) {
        showNotif('❌ Ошибка', 'Клан с таким названием уже существует', 'error');
        return false;
    }
    
    gameState.balance -= price;
    
    const newClan = {
        id: Date.now().toString(),
        name: clanName,
        icon: '🏰',
        owner: gameState.nickname,
        members: [gameState.nickname],
        level: 1,
        balance: 0,
        type: type,
        requests: [],
        created: Date.now(),
        xp: 0
    };
    
    clansDB.push(newClan);
    gameState.clan = {
        id: newClan.id,
        name: newClan.name,
        icon: newClan.icon,
        owner: newClan.owner,
        members: newClan.members,
        level: newClan.level,
        balance: newClan.balance
    };
    
    saveClansDB();
    saveGame();
    showNotif('🏰 Клан создан!', clanName, 'success');
    renderClans();
    updateClanUI();
    return true;
}

function sendClanRequest(clanId) {
    if (gameState.clan) {
        showNotif('❌ Ошибка', 'Вы уже в клане', 'error');
        return;
    }
    
    const clan = clansDB.find(c => c.id === clanId);
    if (!clan) return;
    
    if (clan.type === 'public') {
        joinClan(clanId);
    } else {
        if (!clan.requests) clan.requests = [];
        if (clan.requests.includes(gameState.nickname)) {
            showNotif('❌ Ошибка', 'Заявка уже отправлена', 'error');
            return;
        }
        
        clan.requests.push(gameState.nickname);
        saveClansDB();
        showNotif('✅ Заявка отправлена', `В клан ${clan.name}`, 'success');
        renderClans();
    }
}

function joinClan(clanId) {
    const clan = clansDB.find(c => c.id === clanId);
    if (!clan) return;
    
    if (gameState.clan) {
        showNotif('❌ Ошибка', 'Вы уже в клане', 'error');
        return;
    }
    
    if (!clan.members) clan.members = [];
    clan.members.push(gameState.nickname);
    
    // Удаляем заявку если была
    if (clan.requests) {
        const reqIndex = clan.requests.indexOf(gameState.nickname);
        if (reqIndex !== -1) clan.requests.splice(reqIndex, 1);
    }
    
    gameState.clan = {
        id: clan.id,
        name: clan.name,
        icon: clan.icon,
        owner: clan.owner,
        members: clan.members,
        level: clan.level,
        balance: clan.balance
    };
    
    saveClansDB();
    saveGame();
    showNotif('✅ Вы вступили в клан!', clan.name, 'success');
    renderClans();
    updateClanUI();
}

function leaveClan() {
    if (!gameState.clan) return;
    
    const clan = clansDB.find(c => c.id === gameState.clan.id);
    if (clan) {
        clan.members = clan.members.filter(m => m !== gameState.nickname);
        
        // Если клан опустел - удаляем
        if (clan.members.length === 0) {
            const index = clansDB.findIndex(c => c.id === clan.id);
            if (index !== -1) clansDB.splice(index, 1);
        }
        
        saveClansDB();
    }
    
    gameState.clan = null;
    saveGame();
    showNotif('🚪 Вы покинули клан', '', 'info');
    renderClans();
    updateClanUI();
}

function kickFromClan(memberName) {
    if (!gameState.clan) return;
    if (gameState.clan.owner !== gameState.nickname) {
        showNotif('❌ Ошибка', 'Только владелец клана может кикать', 'error');
        return;
    }
    
    const clan = clansDB.find(c => c.id === gameState.clan.id);
    if (clan) {
        clan.members = clan.members.filter(m => m !== memberName);
        saveClansDB();
        
        // Обновляем у игрока
        const player = playersDB.find(p => p.name === memberName);
        if (player) {
            player.clan = null;
            savePlayersDB();
        }
        
        // Обновляем у текущего игрока
        gameState.clan.members = clan.members;
        
        showNotif('👢 Игрок исключен', memberName, 'warning');
        renderClans();
        updateClanUI();
    }
}

function upgradeClan() {
    if (!gameState.clan) return;
    if (gameState.clan.owner !== gameState.nickname) {
        showNotif('❌ Ошибка', 'Только владелец клана может улучшать', 'error');
        return;
    }
    
    const price = 1000 * (gameState.clan.level || 1);
    if (gameState.balance >= price) {
        gameState.balance -= price;
        
        const clan = clansDB.find(c => c.id === gameState.clan.id);
        if (clan) {
            clan.level = (clan.level || 1) + 1;
            clan.balance = (clan.balance || 0) + price;
            saveClansDB();
            
            gameState.clan.level = clan.level;
            gameState.clan.balance = clan.balance;
            
            showNotif('⬆️ Клан улучшен!', `Уровень ${clan.level}`, 'success');
            renderClans();
            updateClanUI();
            updateUI();
            saveGame();
        }
    } else {
        showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
    }
}

function renderClans() {
    const container = document.getElementById('clansList');
    const myClanSection = document.getElementById('myClanSection');
    const myClanCard = document.getElementById('myClanCard');
    
    if (!container) return;
    
    // Показываем клан игрока
    if (gameState.clan) {
        myClanSection.style.display = 'block';
        
        const level = gameState.clan.level || 1;
        const memberCount = gameState.clan.members?.length || 1;
        
        myClanCard.innerHTML = `
            <div class="clan-header">
                <span class="clan-icon">${gameState.clan.icon || '🏰'}</span>
                <span class="clan-name">${gameState.clan.name}</span>
                <span class="clan-level">Ур.${level}</span>
            </div>
            <div class="clan-stats">
                <span>👥 ${memberCount}/20</span>
                <span>💰 ${formatNumber(gameState.clan.balance || 0)}</span>
                <span>🏆 ${formatNumber(gameState.clan.xp || 0)} XP</span>
            </div>
            <div class="clan-members" id="clanMembersList">
                ${(gameState.clan.members || []).map(m => `
                    <div class="clan-member">
                        <div class="clan-member-avatar">👤</div>
                        <span class="clan-member-name">${m}</span>
                        <span class="clan-member-role">
                            ${m === gameState.clan.owner ? '👑 Владелец' : ''}
                        </span>
                        ${gameState.clan.owner === gameState.nickname && m !== gameState.nickname ? `
                            <button class="clan-action" onclick="kickFromClan('${m}')">🚪</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="clan-actions">
                ${gameState.clan.owner === gameState.nickname ? `
                    <button class="clan-action" onclick="upgradeClan()">⬆️ Улучшить (${1000 * (gameState.clan.level || 1)}💰)</button>
                    <button class="clan-action invite" id="inviteToClanBtn">📨 Пригласить</button>
                ` : ''}
                <button class="clan-action leave" onclick="leaveClan()">🚪 Покинуть клан</button>
            </div>
        `;
        
        // Кнопка приглашения
        document.getElementById('inviteToClanBtn')?.addEventListener('click', () => {
            const friendName = prompt('Введите ник друга для приглашения:');
            if (friendName) {
                const friend = playersDB.find(p => p.name === friendName);
                if (friend && gameState.friends.includes(friendName)) {
                    sendClanInvite(friendName);
                } else {
                    showNotif('❌ Ошибка', 'Друг не найден', 'error');
                }
            }
        });
        
    } else {
        myClanSection.style.display = 'none';
    }
    
    // Список доступных кланов
    const search = document.getElementById('clanSearchInput')?.value.toLowerCase() || '';
    let clans = clansDB.filter(c => c.name.toLowerCase().includes(search));
    
    if (clans.length === 0) {
        container.innerHTML = '<div class="clan-placeholder">Нет доступных кланов</div>';
        return;
    }
    
    container.innerHTML = clans.map(clan => {
        const hasRequest = clan.requests?.includes(gameState.nickname);
        const isMember = clan.members?.includes(gameState.nickname);
        
        return `
            <div class="clan-list-card">
                <div class="clan-list-header">
                    <span class="clan-icon">${clan.icon || '🏰'}</span>
                    <span class="clan-list-name">${clan.name}</span>
                    <span class="clan-level">Ур.${clan.level || 1}</span>
                </div>
                <div class="clan-list-stats">
                    <span>👥 ${clan.members?.length || 1}/20</span>
                    <span>💰 ${formatNumber(clan.balance || 0)}</span>
                    <span>${clan.type === 'public' ? '🔓 Публичный' : '🔒 Приватный'}</span>
                </div>
                ${!isMember ? `
                    <button class="clan-join-btn ${hasRequest ? 'requested' : ''}" 
                            onclick="sendClanRequest('${clan.id}')"
                            ${hasRequest ? 'disabled' : ''}>
                        ${hasRequest ? '⏳ Заявка отправлена' : '📝 Вступить'}
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function sendClanInvite(friendName) {
    if (!gameState.clan) return;
    
    const friend = playersDB.find(p => p.name === friendName);
    if (friend && friend.friends?.includes(gameState.nickname)) {
        if (!friend.clanRequests) friend.clanRequests = [];
        friend.clanRequests.push({
            clanId: gameState.clan.id,
            clanName: gameState.clan.name,
            from: gameState.nickname
        });
        savePlayersDB();
        showNotif('✅ Приглашение отправлено', friendName, 'success');
    }
}

function updateClanUI() {
    if (gameState.clan) {
        document.getElementById('playerClan').innerHTML = `🏰 ${gameState.clan.name}`;
        document.getElementById('profileClan').innerHTML = `🏰 Клан: ${gameState.clan.name}`;
    } else {
        document.getElementById('playerClan').innerHTML = '';
        document.getElementById('profileClan').innerHTML = '';
    }
}

// ========== АДМИН ПАНЕЛЬ ==========
const ADMIN_NICKNAME = 'Admin';

function isAdmin() {
    return gameState.nickname === ADMIN_NICKNAME;
}

function updateAdminVisibility() {
    const adminBtn = document.getElementById('adminBtn');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const isAdminUser = isAdmin();
    
    if (adminBtn) adminBtn.style.display = isAdminUser ? 'flex' : 'none';
    if (adminMenuItem) adminMenuItem.style.display = isAdminUser ? 'block' : 'none';
}

function adminGiveResources() {
    const playerName = document.getElementById('adminPlayerName').value.trim();
    const clicks = parseInt(document.getElementById('adminClicks').value) || 0;
    const money = parseInt(document.getElementById('adminMoney').value) || 0;
    const role = document.getElementById('adminRole').value;
    
    if (!playerName) {
        showNotif('❌ Ошибка', 'Введите ник игрока', 'error');
        return;
    }
    
    const player = playersDB.find(p => p.name === playerName);
    if (!player) {
        showNotif('❌ Ошибка', 'Игрок не найден', 'error');
        return;
    }
    
    if (clicks > 0) player.totalClicks = (player.totalClicks || 0) + clicks;
    if (money > 0) player.balance = (player.balance || 0) + money;
    if (role) {
        player.role = role;
        if (playerName === gameState.nickname) {
            gameState.role = role;
            updateRoleUI();
        }
    }
    
    savePlayersDB();
    showNotif('✅ Успешно', `Выдано ${money}💰 и ${clicks} кликов`, 'success');
    
    document.getElementById('adminClicks').value = '';
    document.getElementById('adminMoney').value = '';
    document.getElementById('adminRole').value = '';
}

function adminAddPromo() {
    const code = document.getElementById('promoCodeName').value.trim().toUpperCase();
    const rewardType = document.getElementById('promoRewardType').value;
    const rewardValue = parseInt(document.getElementById('promoRewardValue').value) || 0;
    
    if (!code) {
        showNotif('❌ Ошибка', 'Введите название промокода', 'error');
        return;
    }
    
    if (rewardValue <= 0 && rewardType !== 'vip' && rewardType !== 'turbo') {
        showNotif('❌ Ошибка', 'Введите количество', 'error');
        return;
    }
    
    customPromoCodes.push({
        code: code,
        type: rewardType,
        value: rewardValue,
        created: Date.now(),
        uses: 0
    });
    
    saveCustomPromoCodes();
    renderAdminPromoList();
    renderPromoList();
    
    showNotif('✅ Промокод создан', code, 'success');
    
    document.getElementById('promoCodeName').value = '';
    document.getElementById('promoRewardValue').value = '';
}

function deletePromoCode(code) {
    customPromoCodes = customPromoCodes.filter(p => p.code !== code);
    saveCustomPromoCodes();
    renderAdminPromoList();
    renderPromoList();
    showNotif('✅ Промокод удален', code, 'success');
}

function adminAddEvent() {
    const name = document.getElementById('eventName').value.trim();
    const type = document.getElementById('eventType').value;
    const endTime = document.getElementById('eventEndTime').value;
    
    if (!name) {
        showNotif('❌ Ошибка', 'Введите название события', 'error');
        return;
    }
    
    if (!endTime) {
        showNotif('❌ Ошибка', 'Выберите время окончания', 'error');
        return;
    }
    
    events.push({
        name: name,
        type: type,
        endTime: new Date(endTime).getTime(),
        active: true,
        created: Date.now()
    });
    
    saveEvents();
    renderAdminEventsList();
    
    showNotif('✅ Событие создано', name, 'success');
    
    document.getElementById('eventName').value = '';
    document.getElementById('eventEndTime').value = '';
}

function deleteEvent(index) {
    events.splice(index, 1);
    saveEvents();
    renderAdminEventsList();
    showNotif('✅ Событие удалено', '', 'success');
}

function saveCustomPromoCodes() {
    localStorage.setItem('custom_promocodes', JSON.stringify(customPromoCodes));
}

function loadCustomPromoCodes() {
    const saved = localStorage.getItem('custom_promocodes');
    if (saved) {
        try {
            customPromoCodes = JSON.parse(saved);
        } catch (e) {
            customPromoCodes = [];
        }
    }
}

function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

function loadEvents() {
    const saved = localStorage.getItem('events');
    if (saved) {
        try {
            events = JSON.parse(saved);
            const now = Date.now();
            events.forEach(e => {
                if (e.endTime && e.endTime <= now) {
                    e.active = false;
                }
            });
        } catch (e) {
            events = [];
        }
    }
}

function renderAdminPromoList() {
    const container = document.getElementById('adminPromoList');
    if (!container) return;
    
    if (customPromoCodes.length === 0) {
        container.innerHTML = '<div class="promo-item">Нет созданных промокодов</div>';
        return;
    }
    
    container.innerHTML = customPromoCodes.map(promo => `
        <div class="promo-item">
            <span><strong>${promo.code}</strong> - ${promo.type === 'money' ? promo.value + '💰' : promo.type === 'clicks' ? promo.value + ' кликов' : promo.type === 'vip' ? 'VIP статус' : 'Турбо'}</span>
            <button onclick="deletePromoCode('${promo.code}')">🗑️</button>
        </div>
    `).join('');
}

function renderAdminEventsList() {
    const container = document.getElementById('adminEventsList');
    if (!container) return;
    
    if (events.length === 0) {
        container.innerHTML = '<div class="event-item">Нет активных событий</div>';
        return;
    }
    
    container.innerHTML = events.map((event, index) => `
        <div class="event-item">
            <div>
                <strong>${event.name}</strong><br>
                ${event.type === 'double' ? 'x2 доход' : event.type === 'discount' ? 'Скидка 50%' : 'Бесплатные кейсы'}
                ${event.active ? '🟢 Активно' : '🔴 Завершено'}
            </div>
            <button onclick="deleteEvent(${index})">🗑️</button>
        </div>
    `).join('');
}

function renderAdminPlayersList() {
    const container = document.getElementById('adminPlayersList');
    if (!container) return;
    
    const search = document.getElementById('playersSearch')?.value.toLowerCase() || '';
    const filtered = playersDB.filter(p => p.name.toLowerCase().includes(search));
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="player-item">Нет игроков</div>';
        return;
    }
    
    container.innerHTML = filtered.map(player => `
        <div class="player-item">
            <div>
                <span class="player-name">${player.name}</span>
                <div class="player-badges">
                    ${player.role === 'vip' ? '<span class="player-badge vip">👑 VIP</span>' : ''}
                    ${player.role === 'content' ? '<span class="player-badge content">🎬 CM</span>' : ''}
                </div>
            </div>
            <button onclick="viewPlayerProfile('${player.name}')">👁️</button>
        </div>
    `).join('');
}

// ========== УНИКАЛЬНЫЙ ID УСТРОЙСТВА ==========
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = CryptoJS.SHA256(
            navigator.userAgent + 
            screen.width + 
            screen.height + 
            screen.colorDepth +
            new Date().getTimezoneOffset()
        ).toString();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

function linkDevice(nickname) {
    localStorage.setItem('linked_device', getDeviceId());
    localStorage.setItem('linked_nickname', nickname);
}

// ========== БАЗА ДАННЫХ ИГРОКОВ ==========
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
    syncLeaderboard();
}

function syncLeaderboard() {
    leaderboardDB = playersDB.map(p => ({
        name: p.name,
        score: p.balance || 0,
        title: p.title || '👆 Новичок',
        role: p.role || '',
        lastUpdate: Date.now()
    }));
    
    leaderboardDB.sort((a, b) => (b.score || 0) - (a.score || 0));
    if (leaderboardDB.length > 50) leaderboardDB = leaderboardDB.slice(0, 50);
    
    localStorage.setItem('leaderboard_db', JSON.stringify(leaderboardDB));
    renderLeaderboard();
}

function isNicknameUnique(nickname) {
    if (!nickname) return false;
    return !playersDB.some(p => p.name.toLowerCase() === nickname.toLowerCase());
}

function registerPlayer(nickname, deviceId) {
    const playerData = {
        name: nickname,
        deviceId: deviceId,
        registered: Date.now(),
        lastSeen: Date.now(),
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
        title: '👆 Новичок',
        titles: ['👆 Новичок'],
        role: '',
        friends: [],
        friendRequests: [],
        clan: null,
        autoClickerLevel: 1
    };
    
    playersDB.push(playerData);
    savePlayersDB();
    return playerData;
}

function loadPlayerData(nickname) {
    const player = playersDB.find(p => p.name === nickname);
    if (player) {
        gameState.balance = player.balance || 0;
        gameState.totalClicks = player.totalClicks || 0;
        gameState.totalEarned = player.totalEarned || 0;
        gameState.autoclickers = player.autoclickers || 0;
        gameState.power = player.power || 1;
        gameState.casesOpened = player.casesOpened || 0;
        gameState.bestCaseWin = player.bestCaseWin || 0;
        gameState.daysActive = player.daysActive || 1;
        gameState.skin = player.skin || 'red';
        gameState.ownedSkins = player.ownedSkins || ['red'];
        gameState.title = player.title || '👆 Новичок';
        gameState.titles = player.titles || ['👆 Новичок'];
        gameState.role = player.role || '';
        gameState.friends = player.friends || [];
        gameState.friendRequests = player.friendRequests || [];
        gameState.clan = player.clan || null;
        gameState.autoClicker.level = player.autoClickerLevel || 1;
    }
}

function updatePlayerData() {
    const index = playersDB.findIndex(p => p.name === gameState.nickname);
    if (index >= 0) {
        playersDB[index] = {
            ...playersDB[index],
            lastSeen: Date.now(),
            balance: gameState.balance || 0,
            totalClicks: gameState.totalClicks || 0,
            totalEarned: gameState.totalEarned || 0,
            autoclickers: gameState.autoclickers || 0,
            power: gameState.power || 1,
            casesOpened: gameState.casesOpened || 0,
            bestCaseWin: gameState.bestCaseWin || 0,
            daysActive: gameState.daysActive || 1,
            skin: gameState.skin || 'red',
            ownedSkins: gameState.ownedSkins || ['red'],
            title: gameState.title || '👆 Новичок',
            titles: gameState.titles || ['👆 Новичок'],
            role: gameState.role || '',
            friends: gameState.friends || [],
            friendRequests: gameState.friendRequests || [],
            clan: gameState.clan || null,
            autoClickerLevel: gameState.autoClicker?.level || 1
        };
        savePlayersDB();
        syncLeaderboard();
    }
}

// ========== ПРОСМОТР ПРОФИЛЯ ==========
function viewPlayerProfile(playerName) {
    const player = playersDB.find(p => p.name === playerName);
    if (!player) {
        showNotif('❌ Ошибка', 'Игрок не найден', 'error');
        return;
    }
    
    const level = Math.floor((player.totalClicks || 0) / 100) + 1;
    
    const profileHTML = `
        <div class="player-profile-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <div class="profile-modal-avatar">👤</div>
                    <div class="profile-modal-info">
                        <h2>${player.name}</h2>
                        <div class="profile-modal-title">${player.title || '👆 Новичок'}</div>
                        ${player.role === 'vip' ? '<div style="color: #f1c40f;">👑 VIP</div>' : ''}
                        ${player.role === 'content' ? '<div style="color: #e67e22;">🎬 Content Maker</div>' : ''}
                        ${player.clan ? '<div style="color: var(--accent);">🏰 Клан: ' + player.clan.name + '</div>' : ''}
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
                        <span class="stat-value">${formatNumber(player.balance || 0)}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>👆 Всего кликов:</span>
                        <span class="stat-value">${formatNumber(player.totalClicks || 0)}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>📈 Заработано:</span>
                        <span class="stat-value">${formatNumber(player.totalEarned || 0)}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>🤖 Автокликеров:</span>
                        <span class="stat-value">${player.autoclickers || 0}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>⚡ Сила клика:</span>
                        <span class="stat-value">${player.power || 1}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>🎁 Кейсов открыто:</span>
                        <span class="stat-value">${player.casesOpened || 0}</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>🏆 Лучший выигрыш:</span>
                        <span class="stat-value">${formatNumber(player.bestCaseWin || 0)}💰</span>
                    </div>
                    <div class="profile-stat-row">
                        <span>📅 Дней в игре:</span>
                        <span class="stat-value">${player.daysActive || 1}</span>
                    </div>
                </div>
                
                <div class="profile-modal-titles">
                    <h4>Полученные титулы (${(player.titles || []).length})</h4>
                    <div class="profile-titles-grid">
                        ${(player.titles || []).map(title => `
                            <div class="profile-title-item">${title}</div>
                        `).join('')}
                    </div>
                </div>
                
                ${player.name !== gameState.nickname ? `
                    <div class="profile-modal-actions">
                        <button class="btn-primary" onclick="sendFriendRequest('${player.name}')">➕ Добавить в друзья</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('profileModal');
    if (oldModal) oldModal.remove();
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'profileModal';
    modalContainer.innerHTML = profileHTML;
    document.body.appendChild(modalContainer);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.remove();
}

// ========== ТАБЛИЦА ЛИДЕРОВ ==========
function loadLeaderboard() {
    const saved = localStorage.getItem('leaderboard_db');
    if (saved) {
        try {
            leaderboardDB = JSON.parse(saved);
        } catch (e) {
            leaderboardDB = [];
        }
    } else {
        leaderboardDB = [];
    }
    renderLeaderboard();
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
                    ${player.role === 'vip' ? `<span class="leader-title">👑 VIP</span>` : ''}
                    ${player.role === 'content' ? `<span class="leader-title">🎬 CM</span>` : ''}
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
    if (!gameState) return;
    
    let newTitles = [];
    
    titles.forEach(title => {
        if (gameState.titles && gameState.titles.includes(title.name)) return;
        
        let earned = false;
        
        if (title.clicks !== undefined && (gameState.totalClicks || 0) >= title.clicks) earned = true;
        if (title.balance !== undefined && (gameState.balance || 0) >= title.balance) earned = true;
        if (title.autoclickers !== undefined && (gameState.autoclickers || 0) >= title.autoclickers) earned = true;
        if (title.cases !== undefined && (gameState.casesOpened || 0) >= title.cases) earned = true;
        if (title.days !== undefined && (gameState.daysActive || 0) >= title.days) earned = true;
        
        if (earned) {
            newTitles.push(title.name);
            if (!gameState.titles) gameState.titles = ['👆 Новичок'];
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
    if (!titleName) return;
    if (gameState.titles && gameState.titles.includes(titleName)) {
        gameState.title = titleName;
        renderTitles();
        showNotif('✅ Титул надет!', titleName, 'success');
        saveGame();
        updatePlayerData();
    }
}

function renderTitles() {
    const container = document.getElementById('profileTitles');
    if (!container) return;
    if (!gameState.titles) gameState.titles = ['👆 Новичок'];
    if (!gameState.title) gameState.title = '👆 Новичок';
    
    const clickTitles = titles.filter(t => t.clicks !== undefined);
    const balanceTitles = titles.filter(t => t.balance !== undefined);
    const autoTitles = titles.filter(t => t.autoclickers !== undefined);
    const caseTitles = titles.filter(t => t.cases !== undefined);
    const dayTitles = titles.filter(t => t.days !== undefined);
    
    container.innerHTML = `
        <div class="current-title" onclick="selectTitle('${gameState.title.replace(/'/g, "\\'")}')">
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
                             onclick="${has ? `selectTitle('${title.name.replace(/'/g, "\\'")}')` : ''}"
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
                             onclick="${has ? `selectTitle('${title.name.replace(/'/g, "\\'")}')` : ''}"
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
                             onclick="${has ? `selectTitle('${title.name.replace(/'/g, "\\'")}')` : ''}"
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
                             onclick="${has ? `selectTitle('${title.name.replace(/'/g, "\\'")}')` : ''}"
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
                             onclick="${has ? `selectTitle('${title.name.replace(/'/g, "\\'")}')` : ''}"
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
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ========== СОХРАНЕНИЕ ==========
function saveGame() {
    try {
        localStorage.setItem('clicker_save', JSON.stringify(gameState));
        updatePlayerData();
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

// ========== ЗАГРУЗКА ФАЙЛА С ЗАЩИТОЙ ==========
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
                
                const deviceId = getDeviceId();
                if (data.deviceId && data.deviceId !== deviceId) {
                    if (!confirm('⚠️ Этот файл создан на другом устройстве. Загрузить его? (Привязка устройства изменится)')) {
                        document.getElementById('loading').style.display = 'none';
                        document.body.removeChild(input);
                        return;
                    }
                }
                
                Object.keys(data).forEach(key => {
                    if (typeof data[key] === 'number' && isNaN(data[key])) {
                        data[key] = 0;
                    }
                });
                
                gameState = { ...gameState, ...data };
                gameState.deviceId = deviceId;
                
                linkDevice(gameState.nickname);
                
                document.getElementById('playerName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('profileName').textContent = gameState.nickname || 'Игрок';
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                updateUI();
                renderShop();
                renderSkins();
                renderCases();
                renderTitles();
                renderFriends();
                renderClans();
                updateRoleUI();
                updateClanUI();
                updateAdminVisibility();
                updatePlayerData();
                
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
    if (!gameState.settings || !gameState.settings.notifications && type !== 'error') return;
    
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
    
    if (gameState.settings && gameState.settings.vibration && type === 'success') {
        navigator.vibrate?.(50);
    }
}

// ========== ОБНОВЛЕНИЕ UI РОЛИ ==========
function updateRoleUI() {
    const playerBadge = document.getElementById('playerBadge');
    const profileBadge = document.getElementById('profileBadge');
    
    if (playerBadge) {
        playerBadge.className = 'player-badge';
        playerBadge.innerHTML = '';
        if (gameState.role === 'vip') {
            playerBadge.classList.add('vip');
            playerBadge.innerHTML = '👑 VIP';
        } else if (gameState.role === 'content') {
            playerBadge.classList.add('content');
            playerBadge.innerHTML = '🎬 Content Maker';
        }
    }
    
    if (profileBadge) {
        profileBadge.className = 'profile-badge';
        profileBadge.innerHTML = '';
        if (gameState.role === 'vip') {
            profileBadge.classList.add('vip');
            profileBadge.innerHTML = '👑 VIP статус';
        } else if (gameState.role === 'content') {
            profileBadge.classList.add('content');
            profileBadge.innerHTML = '🎬 Content Maker';
        }
    }
}

// ========== ТУРБО РЕЖИМ ==========
function activateTurbo() {
    const turboPrice = 50;
    
    if ((gameState.balance || 0) < turboPrice) {
        showNotif('❌ Недостаточно', `Нужно ${turboPrice}💰`, 'error');
        return false;
    }
    
    gameState.balance -= turboPrice;
    gameState.turbo.active = true;
    gameState.turbo.timeLeft = gameState.turbo.maxTime || 30;
    
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
    
    if (gameState.turbo && gameState.turbo.active && (gameState.turbo.timeLeft || 0) > 0) {
        turboStatus.innerHTML = `<span class="turbo-icon">⚡</span><span>Турбо АКТИВЕН (x2)</span>`;
        const seconds = gameState.turbo.timeLeft || 0;
        turboTimer.textContent = `0:${seconds.toString().padStart(2, '0')}`;
        const progress = (seconds / (gameState.turbo.maxTime || 30)) * 100;
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
    loadClansDB();
    loadCustomPromoCodes();
    loadEvents();
    
    if (loadGame() && gameState.nickname) {
        document.getElementById('playerName').textContent = gameState.nickname;
        document.getElementById('profileName').textContent = gameState.nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        updateRoleUI();
        updateClanUI();
        updateAdminVisibility();
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
    renderFriends();
    renderClans();
    updateTurboUI();
    startLoop();
});

// ========== СОБЫТИЯ ==========
function initEvents() {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const name = document.getElementById('loginInput').value.trim();
        const deviceId = getDeviceId();
        
        if (!name || name.length < 3) {
            showNotif('❌ Ошибка', 'Минимум 3 символа', 'error');
            return;
        }
        
        const linkedNickname = localStorage.getItem('linked_nickname');
        if (linkedNickname && linkedNickname !== name) {
            showNotif('❌ Ошибка', 'На этом устройстве уже есть аккаунт. Используйте загрузку файла для смены.', 'error');
            return;
        }
        
        if (!isNicknameUnique(name) && !linkedNickname) {
            showNotif('❌ Ошибка', 'Этот ник уже занят', 'error');
            return;
        }
        
        const existingPlayer = playersDB.find(p => p.name === name);
        if (existingPlayer) {
            loadPlayerData(name);
        } else {
            registerPlayer(name, deviceId);
            loadPlayerData(name);
        }
        
        gameState.nickname = name;
        gameState.deviceId = deviceId;
        
        linkDevice(name);
        
        document.getElementById('playerName').textContent = name;
        document.getElementById('profileName').textContent = name;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        updateRoleUI();
        updateClanUI();
        updateAdminVisibility();
        renderFriends();
        renderClans();
        saveGame();
        
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
    
    // Друзья
    document.getElementById('addFriendBtn')?.addEventListener('click', () => {
        document.getElementById('addFriendModal').style.display = 'flex';
    });
    
    document.getElementById('sendFriendRequest')?.addEventListener('click', () => {
        const friendName = document.getElementById('friendNameInput').value.trim();
        if (friendName) {
            sendFriendRequest(friendName);
            document.getElementById('addFriendModal').style.display = 'none';
            document.getElementById('friendNameInput').value = '';
        }
    });
    
    document.getElementById('closeAddFriend')?.addEventListener('click', () => {
        document.getElementById('addFriendModal').style.display = 'none';
        document.getElementById('friendNameInput').value = '';
    });
    
    document.querySelectorAll('.friends-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFriends();
        });
    });
    
    // Кланы
    document.getElementById('createClanBtn')?.addEventListener('click', () => {
        document.getElementById('createClanModal').style.display = 'flex';
    });
    
    document.getElementById('confirmCreateClan')?.addEventListener('click', () => {
        const clanName = document.getElementById('clanNameInput').value.trim();
        const clanType = document.getElementById('clanTypeSelect').value;
        if (clanName) {
            createClan(clanName, clanType);
            document.getElementById('createClanModal').style.display = 'none';
            document.getElementById('clanNameInput').value = '';
        }
    });
    
    document.getElementById('closeCreateClan')?.addEventListener('click', () => {
        document.getElementById('createClanModal').style.display = 'none';
        document.getElementById('clanNameInput').value = '';
    });
    
    document.getElementById('clanSearchInput')?.addEventListener('input', () => renderClans());
    
    // Админ панель
    document.getElementById('adminGive')?.addEventListener('click', adminGiveResources);
    document.getElementById('adminAddPromo')?.addEventListener('click', adminAddPromo);
    document.getElementById('adminAddEvent')?.addEventListener('click', adminAddEvent);
    document.getElementById('playersSearch')?.addEventListener('input', () => renderAdminPlayersList());
    
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
            else if (tab === 'friends') renderFriends();
            else if (tab === 'clans') renderClans();
            else if (tab === 'admin') {
                renderAdminPromoList();
                renderAdminEventsList();
                renderAdminPlayersList();
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
        const multiplier = (gameState.turbo && gameState.turbo.active) ? (gameState.turbo.multiplier || 2) : 1;
        const gain = (gameState.power || 1) * multiplier;
        
        gameState.balance = (gameState.balance || 0) + gain;
        gameState.totalClicks = (gameState.totalClicks || 0) + 1;
        gameState.totalEarned = (gameState.totalEarned || 0) + gain;
        
        const btn = document.getElementById('clickBtn');
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
        
        checkTitles();
        
        updateUI();
    });
    
    document.getElementById('dailyBtn').addEventListener('click', () => {
        const today = new Date().toDateString();
        
        if (gameState.lastDaily !== today) {
            gameState.balance = (gameState.balance || 0) + 500;
            gameState.lastDaily = today;
            gameState.daysActive = (gameState.daysActive || 1) + 1;
            showNotif('📅 Награда!', '+500 монет');
            checkTitles();
            updateUI();
            saveGame();
        } else {
            showNotif('⏰ Уже получали', 'Завтра будет снова', 'warning');
        }
    });
    
    document.getElementById('floatingGift').addEventListener('click', () => {
        const now = Date.now();
        const last = gameState.lastGift || 0;
        
        if (now - last >= 86400000) {
            gameState.balance = (gameState.balance || 0) + 50;
            gameState.lastGift = now;
            showNotif('🎁 Подарок!', '+50 монет');
            updateUI();
            saveGame();
        } else {
            const left = 86400000 - (now - last);
            const hours = Math.floor(left / 3600000);
            const mins = Math.floor((left % 3600000) / 60000);
            showNotif('⏰ Ожидайте', `${hours}ч ${mins}м`, 'info');
        }
    });
    
    document.getElementById('saveToFile').addEventListener('click', () => {
        try {
            const dataToSave = {
                ...gameState,
                deviceId: getDeviceId(),
                exportDate: Date.now()
            };
            const data = JSON.stringify(dataToSave, null, 2);
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
        
        if (gameState.usedCodes && gameState.usedCodes.includes(code)) {
            showNotif('❌ Уже использован', '', 'error');
            return;
        }
        
        const customPromo = customPromoCodes.find(p => p.code === code);
        
        if (customPromo) {
            switch(customPromo.type) {
                case 'money':
                    gameState.balance = (gameState.balance || 0) + customPromo.value;
                    showNotif('✅ Промокод!', `+${customPromo.value}💰`, 'success');
                    break;
                case 'clicks':
                    gameState.totalClicks = (gameState.totalClicks || 0) + customPromo.value;
                    showNotif('✅ Промокод!', `+${customPromo.value} кликов`, 'success');
                    break;
                case 'vip':
                    gameState.role = 'vip';
                    updateRoleUI();
                    showNotif('✅ Промокод!', 'Получен VIP статус!', 'success');
                    break;
                case 'turbo':
                    activateTurbo();
                    showNotif('✅ Промокод!', 'Турбо активирован!', 'success');
                    break;
            }
            
            customPromo.uses++;
            saveCustomPromoCodes();
        } else {
            let msg = '';
            switch(code) {
                case 'START':
                    gameState.balance = (gameState.balance || 0) + 100;
                    msg = '+100💰';
                    break;
                case 'GIFT':
                    gameState.balance = (gameState.balance || 0) + 300;
                    msg = '+300💰';
                    break;
                case 'POWER':
                    gameState.power = (gameState.power || 1) + 1;
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
            showNotif('✅ Промокод!', msg, 'success');
        }
        
        if (!gameState.usedCodes) gameState.usedCodes = [];
        gameState.usedCodes.push(code);
        document.getElementById('promoInput').value = '';
        checkTitles();
        updateUI();
        saveGame();
    });
    
    document.getElementById('notificationsCheck').addEventListener('change', (e) => {
        if (!gameState.settings) gameState.settings = {};
        gameState.settings.notifications = e.target.checked;
    });
    
    document.getElementById('vibrationCheck').addEventListener('change', (e) => {
        if (!gameState.settings) gameState.settings = {};
        gameState.settings.vibration = e.target.checked;
    });
    
    document.getElementById('autosaveCheck').addEventListener('change', (e) => {
        if (!gameState.settings) gameState.settings = {};
        gameState.settings.autoSave = e.target.checked;
    });
    
    document.getElementById('soundsCheck').addEventListener('change', (e) => {
        if (!gameState.settings) gameState.settings = {};
        gameState.settings.sounds = e.target.checked;
    });
    
    document.getElementById('autoMenuStart').addEventListener('click', () => {
        if (!gameState.autoclickers || gameState.autoclickers === 0) {
            showNotif('❌ Ошибка', 'Купите автокликер', 'error');
            return;
        }
        
        if (gameState.autoClicker.enabled) {
            gameState.autoClicker.enabled = false;
            showNotif('⏸️ Автокликер остановлен', '', 'info');
        } else {
            gameState.autoClicker.enabled = true;
            gameState.autoClicker.timeLeft = gameState.autoClicker.maxTime || 120;
            showNotif('▶️ Автокликер запущен', `Будет работать ${gameState.autoClicker.maxTime || 120} сек`, 'success');
        }
        
        updateAutoMenu();
        saveGame();
    });
    
    document.getElementById('autoMenuUpgrade').addEventListener('click', () => {
        const level = gameState.autoClicker.level || 1;
        const price = 100 * level;
        
        if ((gameState.balance || 0) >= price) {
            gameState.balance -= price;
            gameState.autoClicker.level = level + 1;
            gameState.autoClicker.maxTime = (gameState.autoClicker.maxTime || 120) + 30;
            showNotif('⬆️ Улучшено!', `Уровень ${gameState.autoClicker.level}`, 'success');
            checkTitles();
            updateUI();
            updateAutoMenu();
            saveGame();
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
    const level = gameState.autoClicker?.level || 1;
    const count = gameState.autoclickers || 0;
    const power = gameState.power || 1;
    
    document.getElementById('autoMenuLevel').textContent = level;
    document.getElementById('autoMenuCount').textContent = count;
    document.getElementById('autoMenuIncome').textContent = `${level * power}/сек`;
    document.getElementById('upgradePrice').textContent = `${100 * level}💰`;
    
    const startBtn = document.getElementById('autoMenuStart');
    if (startBtn) {
        startBtn.innerHTML = gameState.autoClicker?.enabled ? 
            '<span>⏹️</span><span>Остановить</span>' : 
            '<span>▶️</span><span>Запустить</span>';
    }
    
    if (gameState.autoClicker?.enabled) {
        const timeLeft = gameState.autoClicker.timeLeft || 0;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('autoMenuTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const maxTime = gameState.autoClicker.maxTime || 120;
        const progress = maxTime > 0 ? ((maxTime - timeLeft) / maxTime) * 100 : 0;
        document.getElementById('autoMenuProgress').style.width = Math.min(100, Math.max(0, progress)) + '%';
    } else {
        const maxTime = gameState.autoClicker?.maxTime || 120;
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
        <div class="shop-card">
            <span class="card-icon">👑</span>
            <span class="card-title">VIP Статус</span>
            <span class="card-desc">Эксклюзивный значок</span>
            <span class="card-price">1000💰</span>
            <button class="card-btn" onclick="buyItem('vip')">Купить</button>
        </div>
    `;
}

window.buyItem = function(type) {
    if (type === 'auto') {
        if ((gameState.balance || 0) >= 50) {
            gameState.balance -= 50;
            gameState.autoclickers = (gameState.autoclickers || 0) + 1;
            showNotif('✅ Куплено!', `Автокликер +${gameState.autoclickers}`);
            checkTitles();
        } else {
            showNotif('❌ Недостаточно', 'Нужно 50💰', 'error');
            return;
        }
    } else if (type === 'power') {
        if ((gameState.balance || 0) >= 100) {
            gameState.balance -= 100;
            gameState.power = (gameState.power || 1) + 1;
            showNotif('✅ Куплено!', `Сила +${gameState.power}`);
        } else {
            showNotif('❌ Недостаточно', 'Нужно 100💰', 'error');
            return;
        }
    } else if (type === 'turbo') {
        if ((gameState.balance || 0) >= 50) {
            gameState.balance -= 50;
            activateTurbo();
        } else {
            showNotif('❌ Недостаточно', 'Нужно 50💰', 'error');
            return;
        }
    } else if (type === 'vip') {
        if ((gameState.balance || 0) >= 1000) {
            gameState.balance -= 1000;
            gameState.role = 'vip';
            updateRoleUI();
            showNotif('✅ Куплено!', 'VIP статус получен!', 'success');
            checkTitles();
        } else {
            showNotif('❌ Недостаточно', 'Нужно 1000💰', 'error');
            return;
        }
    }
    
    updateUI();
    updateAutoMenu();
    saveGame();
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
        const owned = gameState.ownedSkins && gameState.ownedSkins.includes(s.id);
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
            const price = parseInt(card.dataset.price) || 0;
            
            if (gameState.ownedSkins && gameState.ownedSkins.includes(id)) {
                gameState.skin = id;
                document.getElementById('clickBtn').className = `clicker skin-${id}`;
                renderSkins();
                showNotif('🎨 Скин надет!');
            } else if ((gameState.balance || 0) >= price) {
                gameState.balance -= price;
                if (!gameState.ownedSkins) gameState.ownedSkins = ['red'];
                gameState.ownedSkins.push(id);
                gameState.skin = id;
                renderSkins();
                updateUI();
                showNotif('✅ Скин куплен!');
                checkTitles();
                saveGame();
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
    
    if ((gameState.balance || 0) < price) {
        showNotif('❌ Недостаточно', `Нужно ${price}💰`, 'error');
        return;
    }
    
    showCaseAnimation(type, () => {
        gameState.balance -= price;
        gameState.casesOpened = (gameState.casesOpened || 0) + 1;
        gameState.balance += reward;
        
        if (reward > (gameState.bestCaseWin || 0)) {
            gameState.bestCaseWin = reward;
        }
        
        document.getElementById('caseResult').innerHTML = `+${formatNumber(reward)}💰`;
        document.getElementById('caseText').textContent = 'Вы выиграли!';
        
        checkTitles();
        
        updateUI();
        saveGame();
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
    
    let html = `
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
    
    customPromoCodes.forEach(promo => {
        html += `
            <div class="promo-item">
                <span class="promo-code">${promo.code}</span>
                <span class="promo-reward">${promo.type === 'money' ? '+' + promo.value + '💰' : promo.type === 'clicks' ? '+' + promo.value + ' кликов' : promo.type === 'vip' ? 'VIP статус' : 'Турбо'}</span>
            </div>
        `;
    });
    
    list.innerHTML = html;
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
        
        if (gameState.turbo && gameState.turbo.active && (gameState.turbo.timeLeft || 0) > 0) {
            gameState.turbo.timeLeft--;
            if (gameState.turbo.timeLeft <= 0) {
                gameState.turbo.active = false;
                updateTurboUI();
            }
        }
        
        if (gameState.autoClicker && gameState.autoClicker.enabled && (gameState.autoClicker.timeLeft || 0) > 0) {
            gameState.autoClicker.timeLeft--;
            
            const multiplier = (gameState.turbo && gameState.turbo.active) ? (gameState.turbo.multiplier || 2) : 1;
            const gain = (gameState.autoClicker.level || 1) * (gameState.power || 1) * multiplier;
            
            gameState.balance = (gameState.balance || 0) + gain;
            gameState.totalEarned = (gameState.totalEarned || 0) + gain;
            
            if (gameState.autoClicker.timeLeft <= 0) {
                gameState.autoClicker.enabled = false;
            }
            
            updateAutoMenu();
        }
        
        updateUI();
    }, 1000);
    
    setInterval(() => {
        if (gameState.autoClicker && gameState.autoClicker.enabled) updateAutoMenu();
        updateTurboUI();
    }, 500);
    
    setInterval(updateGiftTimer, 60000);
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    document.getElementById('balance').textContent = formatNumber(gameState.balance || 0);
    document.getElementById('power').textContent = formatNumber(gameState.power || 1);
    document.getElementById('cps').textContent = formatNumber(gameState.autoclickers || 0);
    
    document.getElementById('totalClicks').textContent = formatNumber(gameState.totalClicks || 0);
    document.getElementById('totalEarned').textContent = formatNumber(gameState.totalEarned || 0);
    document.getElementById('totalCases').textContent = formatNumber(gameState.casesOpened || 0);
    document.getElementById('bestWin').textContent = formatNumber(gameState.bestCaseWin || 0) + '💰';
    document.getElementById('totalDays').textContent = formatNumber(gameState.daysActive || 1);
    
    const lvl = Math.floor((gameState.totalClicks || 0) / 100) + 1;
    document.getElementById('playerLevel').textContent = `Уровень ${lvl}`;
    document.getElementById('profileLevel').textContent = `Уровень ${lvl}`;
    
    updateGiftTimer();
    
    if (gameState.settings && gameState.settings.autoSave && gameState.nickname) {
        saveGame();
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
window.buyItem = buyItem;
window.openCase = openCase;
window.selectTitle = selectTitle;
window.viewPlayerProfile = viewPlayerProfile;
window.closeProfileModal = closeProfileModal;
window.deletePromoCode = deletePromoCode;
window.deleteEvent = deleteEvent;
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.removeFriend = removeFriend;
window.sendGift = sendGift;
window.createClan = createClan;
window.sendClanRequest = sendClanRequest;
window.joinClan = joinClan;
window.leaveClan = leaveClan;
window.kickFromClan = kickFromClan;
window.upgradeClan = upgradeClan;

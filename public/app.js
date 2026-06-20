// Utilitários de Performance
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function localDateISO(dateObj = new Date()) {
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
}

function localMonthKey(dateObj = new Date()) {
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}`;
}

const todayLocal = localDateISO();

const state = {
  token: localStorage.getItem('soninhos_token') || '',
  user: JSON.parse(localStorage.getItem('soninhos_user') || 'null'),
  deviceId: '',
  currentDate: todayLocal,
  selectedCalendarDate: todayLocal,
  calendarMonth: todayLocal.slice(0, 7),
  tags: [],
  friends: [],
  incomingRequests: [],
  selectedOwnerId: 'me',
  locationSharingEnabled: false,
  locationWatchId: null,
  friendLocationPollId: null,
  soninhos: 0,
  shopItems: [],
  customWallpapers: [],
  customThemeColors: [],
  equipped: { active_font: null, active_tag_effect: null, active_wallpaper: null, active_theme_color: null },
  shopFilter: 'all',
  passView: 'rewards',
  pass: {
    active: false,
    weekStart: '',
    paidAt: null,
    today: '',
    todayReward: 20,
    todayClaimed: false,
    todayClaimReward: 0,
    weeklyClaimCount: 0,
    soninhosBalance: 0,
    weeklyPrice: 100,
    weekdayReward: 20,
    weekendReward: 100,
    itemsFolder: '/passe-itens/',
    profileItemsFolder: '/passe-itens/perfil/',
    items: [],
    activeProfileImage: null,
    weeklyProfileRewardClaimed: false,
    canClaimWeeklyProfileReward: false,
    currentWeeklyProfileReward: null,
    ownedProfileRewards: [],
  },
  adminUnlocked: false,
  adminUsers: [],
  adminShopItems: [],
  garden: {
    player: null,
    plants: [],
    crops: [],
    offers: [],
    inventory: [],
    decor: { catalog: [], inventory: [], equippedItems: [], equipped: null },
    offerCycle: null,
    layoutBySlot: {},
    decorLayoutById: {},
    editMode: false,
    dragging: false,
    decorInventoryOpen: false,
    decorSearch: '',
  },
};

const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const authMessage = document.getElementById('authMessage');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const welcomeName = document.getElementById('welcomeName');
const welcomeProfileImage = document.getElementById('welcomeProfileImage');
const logoutBtn = document.getElementById('logoutBtn');
const dreamDate = document.getElementById('dreamDate');
const dreamForm = document.getElementById('dreamForm');
const dreamContentInput = document.getElementById('dreamContent');
const dreamMessage = document.getElementById('dreamMessage');
const dreamList = document.getElementById('dreamList');
const tagForm = document.getElementById('tagForm');
const tagList = document.getElementById('tagList');
const tagMessage = document.getElementById('tagMessage');
const dreamTagChecklist = document.getElementById('dreamTagChecklist');
const calendarGrid = document.getElementById('calendarGrid');
const calendarTitle = document.getElementById('calendarTitle');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const totalDreams = document.getElementById('totalDreams');
const importantDreams = document.getElementById('importantDreams');
const topTags = document.getElementById('topTags');
const monthBars = document.getElementById('monthBars');
const rankingSoninhosList = document.getElementById('rankingSoninhosList');
const rankingDreamsList = document.getElementById('rankingDreamsList');
const journalOwnerSelect = document.getElementById('journalOwnerSelect');
const friendSearchForm = document.getElementById('friendSearchForm');
const friendQuery = document.getElementById('friendQuery');
const friendSearchResults = document.getElementById('friendSearchResults');
const incomingRequests = document.getElementById('incomingRequests');
const friendsList = document.getElementById('friendsList');
const friendMessage = document.getElementById('friendMessage');
const locationShareBtn = document.getElementById('locationShareBtn');
const locationShareStatus = document.getElementById('locationShareStatus');
const friendLocationSelect = document.getElementById('friendLocationSelect');
const refreshFriendLocationBtn = document.getElementById('refreshFriendLocationBtn');
const friendLocationView = document.getElementById('friendLocationView');
const friendLocationStatusList = document.getElementById('friendLocationStatusList');
const soninhosBalance = document.getElementById('soninhosBalance');
const shopGrid = document.getElementById('shopGrid');
const shopMessage = document.getElementById('shopMessage');
const shopBalanceDisplay = document.getElementById('shopBalanceDisplay');
const passSoninhosDisplay = document.getElementById('passSoninhosDisplay');
const shopThemeCard = document.getElementById('shopThemeCard');
const customThemeForm = document.getElementById('customThemeForm');
const customThemeColor = document.getElementById('customThemeColor');
const customThemeStatus = document.getElementById('customThemeStatus');
const removeCustomThemeBtn = document.getElementById('removeCustomThemeBtn');
const customThemePreview = document.getElementById('customThemePreview');
const customThemeLabel = document.getElementById('customThemeLabel');
const customThemeColorList = document.getElementById('customThemeColorList');
const customThemeSubmitBtn = document.getElementById('customThemeSubmitBtn');
const customThemePreviewBtn = document.getElementById('customThemePreviewBtn');
const shopWallpaperCard = document.getElementById('shopWallpaperCard');
const customWallpaperForm = document.getElementById('customWallpaperForm');
const customWallpaperUrl = document.getElementById('customWallpaperUrl');
const customWallpaperStatus = document.getElementById('customWallpaperStatus');
const removeCustomWallpaperBtn = document.getElementById('removeCustomWallpaperBtn');
const customWallpaperList = document.getElementById('customWallpaperList');
const shopAdminPanel = document.getElementById('shopAdminPanel');
const adminUserSelect = document.getElementById('adminUserSelect');
const adminCoinsAmount = document.getElementById('adminCoinsAmount');
const adminAddCoinsBtn = document.getElementById('adminAddCoinsBtn');
const adminRemoveCoinsBtn = document.getElementById('adminRemoveCoinsBtn');
const adminItemSelect = document.getElementById('adminItemSelect');
const adminTogglePurchaseBtn = document.getElementById('adminTogglePurchaseBtn');
const adminPurchaseState = document.getElementById('adminPurchaseState');
const adminStatus = document.getElementById('adminStatus');
const adminAccountsList = document.getElementById('adminAccountsList');
const passWeekTitle = document.getElementById('passWeekTitle');
const passWeekLabel = document.getElementById('passWeekLabel');
const passStatusBadge = document.getElementById('passStatusBadge');
const passRewardToday = document.getElementById('passRewardToday');
const passClaimCount = document.getElementById('passClaimCount');
const passClaimHint = document.getElementById('passClaimHint');
const passClaimBtn = document.getElementById('passClaimBtn');
const passClaimMessage = document.getElementById('passClaimMessage');
const passPreviewWeekday = document.getElementById('passPreviewWeekday');
const passPreviewWeekend = document.getElementById('passPreviewWeekend');
const passPreviewProfileImage = document.getElementById('passPreviewProfileImage');
const passPreviewProfileName = document.getElementById('passPreviewProfileName');
const passPreviewProfileHint = document.getElementById('passPreviewProfileHint');
const passPaymentSummary = document.getElementById('passPaymentSummary');
const passPayBtn = document.getElementById('passPayBtn');
const passPaymentMessage = document.getElementById('passPaymentMessage');
const passRewardsView = document.getElementById('passRewardsView');
const passPaymentView = document.getElementById('passPaymentView');
const passProfileView = document.getElementById('passProfileView');
const passWeeklyProfilePreview = document.getElementById('passWeeklyProfilePreview');
const passWeeklyProfileName = document.getElementById('passWeeklyProfileName');
const passWeeklyProfileHint = document.getElementById('passWeeklyProfileHint');
const passClaimProfileBtn = document.getElementById('passClaimProfileBtn');
const passClaimProfileMessage = document.getElementById('passClaimProfileMessage');
const passProfileRewardsList = document.getElementById('passProfileRewardsList');
const passProfileEquipMessage = document.getElementById('passProfileEquipMessage');
const gardenBalance = document.getElementById('gardenBalance');
const gardenLevel = document.getElementById('gardenLevel');
const gardenXp = document.getElementById('gardenXp');
const gardenBuySlotBtn = document.getElementById('gardenBuySlotBtn');
const gardenSlotInfo = document.getElementById('gardenSlotInfo');
const gardenSlots = document.getElementById('gardenSlots');
const gardenMessage = document.getElementById('gardenMessage');
const gardenSeeds = document.getElementById('gardenSeeds');
const gardenOffers = document.getElementById('gardenOffers');
const gardenOfferTimer = document.getElementById('gardenOfferTimer');
const gardenInventory = document.getElementById('gardenInventory');
const gardenVisual = document.getElementById('gardenVisual');
const gardenEditModeBtn = document.getElementById('gardenEditModeBtn');
const gardenEditHint = document.getElementById('gardenEditHint');
const gardenDecorBalance = document.getElementById('gardenDecorBalance');
const gardenDecorSearch = document.getElementById('gardenDecorSearch');
const gardenDecorCatalog = document.getElementById('gardenDecorCatalog');
const gardenDecorInventory = document.getElementById('gardenDecorInventory');
const gardenDecorInventoryPanel = document.getElementById('gardenDecorInventoryPanel');
const gardenDecorInventoryToggleBtn = document.getElementById('gardenDecorInventoryToggleBtn');
const gardenDecorMessage = document.getElementById('gardenDecorMessage');

const DEFAULT_PROFILE_AVATAR = '/avatar-boneco-sem-rosto.svg';

const ADMIN_TRIGGER_KEY = 'william';

function adminApi(path, options = {}) {
  return api(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'x-admin-key': ADMIN_TRIGGER_KEY,
    },
  });
}

function getAdminSelectedUser() {
  const selectedId = Number(adminUserSelect?.value || 0);
  return state.adminUsers.find((user) => user.id === selectedId) || null;
}

function getAdminSelectedItem() {
  const selectedItemId = String(adminItemSelect?.value || '');
  return state.adminShopItems.find((item) => item.id === selectedItemId) || null;
}

function renderAdminAccountsList() {
  if (!adminAccountsList) return;
  adminAccountsList.innerHTML = '';

  if (!state.adminUsers.length) {
    adminAccountsList.innerHTML = '<p>Nenhuma conta registrada.</p>';
    return;
  }

  state.adminUsers.forEach((user) => {
    const row = document.createElement('article');
    row.className = 'friend-item';
    row.innerHTML = `
      <p>
        <strong>${escapeHtml(user.name)}</strong><br />
        <small>${escapeHtml(user.email)}</small><br />
        <small>ID: ${user.id} | Saldo: ✨ ${user.soninhos_balance}</small>
      </p>
    `;
    adminAccountsList.appendChild(row);
  });
}

function renderAdminSelectors() {
  if (!adminUserSelect || !adminItemSelect) return;

  const currentUserValue = adminUserSelect.value;
  adminUserSelect.innerHTML = '';
  state.adminUsers.forEach((user) => {
    const option = document.createElement('option');
    option.value = String(user.id);
    option.textContent = `${user.name} (#${user.id})`;
    adminUserSelect.appendChild(option);
  });
  if (currentUserValue && Array.from(adminUserSelect.options).some((o) => o.value === currentUserValue)) {
    adminUserSelect.value = currentUserValue;
  }

  const currentItemValue = adminItemSelect.value;
  adminItemSelect.innerHTML = '';
  state.adminShopItems.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} (${item.category})`;
    adminItemSelect.appendChild(option);
  });
  if (currentItemValue && Array.from(adminItemSelect.options).some((o) => o.value === currentItemValue)) {
    adminItemSelect.value = currentItemValue;
  }
}

function updateAdminPurchaseState() {
  if (!adminPurchaseState || !adminTogglePurchaseBtn) return;
  const user = getAdminSelectedUser();
  const item = getAdminSelectedItem();
  if (!user || !item) {
    adminPurchaseState.textContent = 'Selecione conta e item.';
    return;
  }

  const owned = Array.isArray(user.purchases) && user.purchases.includes(item.id);
  adminPurchaseState.textContent = owned ? 'Status atual: Comprado' : 'Status atual: Nao comprado';
  adminTogglePurchaseBtn.textContent = owned ? 'Marcar como nao comprado' : 'Marcar como comprado';
}

async function loadAdminData() {
  const [usersData, itemsData] = await Promise.all([
    adminApi('/api/admin/users'),
    adminApi('/api/admin/shop/items'),
  ]);

  state.adminUsers = usersData.users || [];
  state.adminShopItems = itemsData.items || [];
  renderAdminSelectors();
  renderAdminAccountsList();
  updateAdminPurchaseState();
}

async function unlockAdminPanel() {
  if (!shopAdminPanel) return;
  state.adminUnlocked = true;
  shopAdminPanel.classList.remove('hidden');
  await loadAdminData();
  showMessage(customWallpaperStatus, 'Painel admin liberado.');
}

async function adjustSelectedUserBalance(signal) {
  const user = getAdminSelectedUser();
  if (!user) {
    showMessage(adminStatus, 'Selecione uma conta.', true);
    return;
  }

  const amount = Number(adminCoinsAmount?.value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage(adminStatus, 'Informe um valor valido.', true);
    return;
  }

  const delta = signal > 0 ? amount : -amount;
  try {
    const result = await adminApi(`/api/admin/users/${encodeURIComponent(user.id)}/coins`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    });
    showMessage(adminStatus, `Saldo atualizado para ✨ ${result.user.soninhos_balance}.`);
    await loadAdminData();
    await loadShopData();
  } catch (err) {
    showMessage(adminStatus, err.message, true);
  }
}

async function toggleSelectedUserPurchase() {
  const user = getAdminSelectedUser();
  const item = getAdminSelectedItem();
  if (!user || !item) {
    showMessage(adminStatus, 'Selecione conta e item.', true);
    return;
  }

  const currentlyOwned = Array.isArray(user.purchases) && user.purchases.includes(item.id);

  try {
    const result = await adminApi(`/api/admin/users/${encodeURIComponent(user.id)}/purchases/toggle`, {
      method: 'POST',
      body: JSON.stringify({ itemId: item.id, owned: !currentlyOwned }),
    });
    const statusText = result.owned ? 'comprado' : 'nao comprado';
    showMessage(adminStatus, `Item ${item.name} marcado como ${statusText} para ${user.name}.`);
    await loadAdminData();
    await loadShopData();
  } catch (err) {
    showMessage(adminStatus, err.message, true);
  }
}

async function hashText(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function initDeviceId() {
  const saved = localStorage.getItem('soninhos_device_id');
  if (saved) {
    state.deviceId = saved;
    return;
  }

  const seed = [navigator.userAgent, navigator.language, navigator.platform, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
  state.deviceId = await hashText(seed);
  localStorage.setItem('soninhos_device_id', state.deviceId);
}

function showAuthMessage(text, isError = false) {
  authMessage.textContent = text;
  authMessage.style.color = isError ? '#b74242' : '#7f6edc';
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? '#b74242' : '#7f6edc';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDateTime(value) {
  if (!value) return 'agora';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'agora';
  return date.toLocaleString('pt-BR');
}

function stopLocationTrackingLocally() {
  if (state.locationWatchId !== null) {
    navigator.geolocation.clearWatch(state.locationWatchId);
    state.locationWatchId = null;
  }
}

function renderFriendLocationOptions() {
  const previousValue = friendLocationSelect.value;
  friendLocationSelect.innerHTML = '';

  if (!state.friends.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Adicione amigos para ver localizacao';
    friendLocationSelect.appendChild(option);
    friendLocationSelect.disabled = true;
    refreshFriendLocationBtn.disabled = true;
    return;
  }

  friendLocationSelect.disabled = false;
  refreshFriendLocationBtn.disabled = false;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecione um amigo';
  friendLocationSelect.appendChild(placeholder);

  state.friends.forEach((friend) => {
    const option = document.createElement('option');
    option.value = String(friend.id);
    option.textContent = `${friend.name} ${friend.locationSharing ? '🟢' : '🔴'}`;
    friendLocationSelect.appendChild(option);
  });

  if (previousValue && Array.from(friendLocationSelect.options).some((opt) => opt.value === previousValue)) {
    friendLocationSelect.value = previousValue;
  }
}

function renderFriendLocationStatusList() {
  friendLocationStatusList.innerHTML = '';

  if (!state.friends.length) {
    friendLocationStatusList.innerHTML = '<p>Sem amigos adicionados ainda.</p>';
    return;
  }

  state.friends.forEach((friend) => {
    const row = document.createElement('article');
    row.className = 'friend-item';

    const info = document.createElement('div');
    info.className = 'friend-main';
    info.innerHTML = `
      <strong>${escapeHtml(friend.name)}</strong>
      <small>${escapeHtml(friend.email)}</small>
      <span class="friend-meta">Atualizacao: ${friend.locationUpdatedAt ? formatDateTime(friend.locationUpdatedAt) : 'sem registro'}</span>
    `;

    const status = document.createElement('span');
    status.className = `status-pill ${friend.locationSharing ? 'status-on' : 'status-off'}`;
    status.textContent = friend.locationSharing ? 'Compartilhando' : 'Nao compartilhando';

    row.appendChild(info);
    row.appendChild(status);
    friendLocationStatusList.appendChild(row);
  });
}

function getCurrentPositionAsync() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  });
}

async function sendOwnLocation(position) {
  await api('/api/location/update', {
    method: 'POST',
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    })
  });
}

function updateShareButton() {
  locationShareBtn.textContent = state.locationSharingEnabled
    ? 'Pausar compartilhamento'
    : 'Ativar compartilhamento';
  locationShareBtn.className = state.locationSharingEnabled ? 'btn-ghost' : 'btn-primary';
}

async function fetchFriendLocation(friendId) {
  if (!friendId) {
    friendLocationView.textContent = 'Selecione um amigo para ver a localizacao em tempo real.';
    return;
  }

  try {
    const data = await api(`/api/friends/${encodeURIComponent(friendId)}/location`);
    if (!data.available) {
      friendLocationView.textContent = data.message || 'Localizacao indisponivel agora.';
      return;
    }

    const { latitude, longitude, accuracy, updatedAt } = data.location;
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const mapEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
    friendLocationView.innerHTML = `
      <strong>${data.friend.name}</strong><br />
      Latitude: ${latitude.toFixed(6)}<br />
      Longitude: ${longitude.toFixed(6)}<br />
      Precisao aproximada: ${Math.round(accuracy || 0)} m<br />
      Atualizado em: ${formatDateTime(updatedAt)}<br />
      <a class="location-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Abrir no Google Maps</a>
      <iframe
        class="location-map"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        src="${mapEmbedUrl}"
        title="Mapa de localizacao de ${escapeHtml(data.friend.name)}"
      ></iframe>
    `;
  } catch (err) {
    friendLocationView.textContent = err.message;
  }
}

async function startLocationSharing() {
  if (!('geolocation' in navigator)) {
    showMessage(locationShareStatus, 'Geolocalizacao nao suportada neste dispositivo.', true);
    return;
  }

  let firstPosition;
  try {
    firstPosition = await getCurrentPositionAsync();
  } catch (error) {
    const message = error.code === error.PERMISSION_DENIED
      ? 'Permissao de localizacao negada.'
      : 'Nao foi possivel obter sua localizacao inicial.';
    showMessage(locationShareStatus, message, true);
    await api('/api/location/share', {
      method: 'POST',
      body: JSON.stringify({ enabled: false })
    });
    state.locationSharingEnabled = false;
    updateShareButton();
    return;
  }

  await api('/api/location/share', {
    method: 'POST',
    body: JSON.stringify({ enabled: true })
  });

  await sendOwnLocation(firstPosition);

  stopLocationTrackingLocally();

  state.locationWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      try {
        await sendOwnLocation(position);
        showMessage(locationShareStatus, `Compartilhando localizacao em tempo real (${formatDateTime(new Date())}).`);
      } catch (err) {
        showMessage(locationShareStatus, err.message, true);
      }
    },
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? 'Permissao de localizacao negada.'
        : 'Nao foi possivel obter sua localizacao.';
      showMessage(locationShareStatus, message, true);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    }
  );

  state.locationSharingEnabled = true;
  updateShareButton();
  showMessage(locationShareStatus, `Compartilhando localizacao em tempo real (${formatDateTime(new Date())}).`);
}

async function stopLocationSharing() {
  stopLocationTrackingLocally();
  await api('/api/location/share', {
    method: 'POST',
    body: JSON.stringify({ enabled: false })
  });
  state.locationSharingEnabled = false;
  updateShareButton();
  showMessage(locationShareStatus, 'Compartilhamento de localizacao pausado.');
}

async function loadLocationSharingStatus() {
  try {
    const status = await api('/api/location/share');
    state.locationSharingEnabled = Boolean(status.enabled);
    updateShareButton();

    if (state.locationSharingEnabled) {
      showMessage(locationShareStatus, `Compartilhamento ativo (ultimo update: ${formatDateTime(status.updatedAt)}).`);
      await startLocationSharing();
    } else {
      showMessage(locationShareStatus, 'Compartilhamento desativado.');
    }
  } catch {
    state.locationSharingEnabled = false;
    updateShareButton();
  }
}

function stopFriendLocationPolling() {
  if (state.friendLocationPollId) {
    clearInterval(state.friendLocationPollId);
    state.friendLocationPollId = null;
  }
}

function startFriendLocationPolling() {
  stopFriendLocationPolling();
  state.friendLocationPollId = setInterval(() => {
    const friendId = friendLocationSelect.value;
    if (friendId) {
      fetchFriendLocation(friendId);
    }
  }, 10000);
}

function selectedOwnerQueryPart() {
  if (state.selectedOwnerId === 'me') return '';
  return `&userId=${encodeURIComponent(state.selectedOwnerId)}`;
}

function selectedOwnerLabel() {
  if (state.selectedOwnerId === 'me') return 'seu diario';
  const friend = state.friends.find((item) => String(item.id) === String(state.selectedOwnerId));
  if (!friend) return 'diario compartilhado';
  return `diario de ${friend.name}`;
}

function updateJournalComposeState() {
  const editable = state.selectedOwnerId === 'me';
  const controls = dreamForm.querySelectorAll('textarea, select, input[type="checkbox"], button[type="submit"]');
  controls.forEach((control) => {
    control.disabled = !editable;
  });

  if (!editable) {
    showMessage(dreamMessage, `Visualizando ${selectedOwnerLabel()}. Para escrever, selecione Meu diario.`);
  } else if (dreamMessage.textContent.includes('Visualizando')) {
    dreamMessage.textContent = '';
  }
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': state.deviceId,
    ...(options.headers || {})
  };

  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(path, { ...options, headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.message || 'Falha na operacao');
  return payload;
}

function switchAuthTab(mode) {
  const isLogin = mode === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', isLogin);
}

function setLoggedIn(user, token) {
  state.user = user;
  state.token = token;
  loadGardenLayoutFromStorage();
  loadGardenDecorLayoutFromStorage();
  localStorage.setItem('soninhos_user', JSON.stringify(user));
  localStorage.setItem('soninhos_token', token);

  welcomeName.textContent = user.name.toUpperCase();
  applyProfileBadge(null);
  authView.classList.add('hidden');
  appView.classList.remove('hidden');

  dreamDate.value = state.currentDate;
  state.selectedCalendarDate = state.currentDate;

  bootstrapAppData();
}

function logout() {
  stopLocationTrackingLocally();
  stopFriendLocationPolling();
  stopGardenRefresh();
  stopGardenCountdown();
  state.locationSharingEnabled = false;

  state.user = null;
  state.token = '';
  state.soninhos = 0;
  state.equipped = { active_font: null, active_tag_effect: null, active_wallpaper: null };
  state.pass = {
    active: false,
    weekStart: '',
    paidAt: null,
    today: '',
    todayReward: 20,
    todayClaimed: false,
    todayClaimReward: 0,
    weeklyClaimCount: 0,
    soninhosBalance: 0,
    weeklyPrice: 100,
    weekdayReward: 20,
    weekendReward: 100,
    itemsFolder: '/passe-itens/',
    profileItemsFolder: '/passe-itens/perfil/',
    items: [],
    activeProfileImage: null,
    weeklyProfileRewardClaimed: false,
    canClaimWeeklyProfileReward: false,
    currentWeeklyProfileReward: null,
    ownedProfileRewards: [],
  };
  state.garden = {
    player: null,
    plants: [],
    crops: [],
    offers: [],
    inventory: [],
    decor: { catalog: [], inventory: [], equippedItems: [], equipped: null },
    offerCycle: null,
    layoutBySlot: {},
    decorLayoutById: {},
    editMode: false,
    dragging: false,
    decorInventoryOpen: false,
    decorSearch: '',
  };
  applyWallpaper(null);
  applyProfileBadge(null);
  updateSoninhosDisplay();
  activatePassView('rewards');
  localStorage.removeItem('soninhos_user');
  localStorage.removeItem('soninhos_token');
  authView.classList.remove('hidden');
  appView.classList.add('hidden');
}

async function fetchTags() {
  const data = await api('/api/tags');
  state.tags = data.tags;
  renderTags();
  renderTagChecklist();
}

function getOwnedTagEffectItems() {
  return state.shopItems.filter((item) => item.category === 'tag_effect' && item.owned && String(item.effect_class || '').trim());
}

const TAG_CUSTOM_ITEM_ID = 'tag_custom_personalizada';
const TAG_FONT_OPTIONS = [
  { value: '', label: 'Fonte padrao' },
  { value: 'font-dancing', label: 'Cursiva Sonhadora' },
  { value: 'font-orbitron', label: 'Galatica' },
  { value: 'font-playfair', label: 'Poetica' },
  { value: 'font-courier', label: 'Maquina do Tempo' },
];
const TAG_ANIMATION_OPTIONS = [
  { value: '', label: 'Sem animacao' },
  { value: 'tag-anim-blink', label: 'Piscando' },
  { value: 'tag-anim-pulse', label: 'Pulso suave' },
  { value: 'tag-anim-float', label: 'Flutuante' },
];

function hasCustomTagUpgrade() {
  return state.shopItems.some((item) => item.id === TAG_CUSTOM_ITEM_ID && item.owned);
}

function isEquipableShopItem(item) {
  if (item.category === 'font') return true;
  if (item.category !== 'tag_effect') return false;
  return Boolean(String(item.effect_class || '').trim());
}

function getTagChipClassName(tag) {
  return ['tag-chip', 'tag-customizable', tag.tag_effect_class || '', tag.tag_font_class || '', tag.tag_animation_class || '']
    .filter(Boolean)
    .join(' ');
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || '').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(127, 110, 220, ${alpha})`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTagColorPreview(element, color) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(String(color || '').trim()) ? String(color).trim() : '#7f6edc';
  element.style.setProperty('--tag-custom-bg', hexToRgba(safeColor, 0.16));
  element.style.setProperty('--tag-custom-border', hexToRgba(safeColor, 0.42));
  element.style.setProperty('--tag-custom-text', safeColor);
}

function buildSelectFromOptions(options, selectedValue, className) {
  const select = document.createElement('select');
  select.className = className;
  options.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.value;
    option.textContent = entry.label;
    select.appendChild(option);
  });
  select.value = selectedValue || '';
  return select;
}

function getEquippedFontEffectClass() {
  const fontItem = state.shopItems.find((item) => item.id === state.equipped.active_font);
  return fontItem?.effect_class || null;
}

function parseDreamTagDetails(rawDetails) {
  if (!rawDetails) return [];
  return String(rawDetails)
    .split('||')
    .map((entry) => {
      const [name, color, effectClass, fontClass, animationClass] = entry.split('::');
      return {
        name: name || '',
        color: color || '#7f6edc',
        effectClass: effectClass || '',
        fontClass: fontClass || '',
        animationClass: animationClass || '',
      };
    })
    .filter((tag) => tag.name);
}

function renderOwnerSelect() {
  journalOwnerSelect.innerHTML = '';

  const own = document.createElement('option');
  own.value = 'me';
  own.textContent = 'Meu diario';
  journalOwnerSelect.appendChild(own);

  state.friends.forEach((friend) => {
    const option = document.createElement('option');
    option.value = String(friend.id);
    option.textContent = `Diario de ${friend.name}`;
    journalOwnerSelect.appendChild(option);
  });

  if (!Array.from(journalOwnerSelect.options).some((opt) => opt.value === String(state.selectedOwnerId))) {
    state.selectedOwnerId = 'me';
  }
  journalOwnerSelect.value = String(state.selectedOwnerId);
  updateJournalComposeState();
}

function renderIncomingRequests() {
  incomingRequests.innerHTML = '';
  if (!state.incomingRequests.length) {
    incomingRequests.innerHTML = '<p>Sem pedidos pendentes.</p>';
    return;
  }

  state.incomingRequests.forEach((requestItem) => {
    const row = document.createElement('article');
    row.className = 'friend-item';
    row.innerHTML = `<p><strong>${requestItem.name}</strong><br /><small>${requestItem.email}</small></p>`;

    const actions = document.createElement('div');
    actions.className = 'friend-actions';

    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'btn-primary';
    acceptBtn.textContent = 'Aceitar';
    acceptBtn.addEventListener('click', async () => {
      try {
        await api(`/api/friends/requests/${requestItem.id}/accept`, { method: 'POST' });
        showMessage(friendMessage, `Voce agora e amigo de ${requestItem.name}.`);
        await loadFriendsData();
      } catch (err) {
        showMessage(friendMessage, err.message, true);
      }
    });

    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.className = 'btn-ghost';
    rejectBtn.textContent = 'Recusar';
    rejectBtn.addEventListener('click', async () => {
      try {
        await api(`/api/friends/requests/${requestItem.id}/reject`, { method: 'POST' });
        showMessage(friendMessage, 'Pedido recusado.');
        await loadFriendsData();
      } catch (err) {
        showMessage(friendMessage, err.message, true);
      }
    });

    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);
    row.appendChild(actions);
    incomingRequests.appendChild(row);
  });
}

function renderFriendsList() {
  friendsList.innerHTML = '';
  if (!state.friends.length) {
    friendsList.innerHTML = '<p>Voce ainda nao tem amigos adicionados.</p>';
    return;
  }

  state.friends.forEach((friend) => {
    const row = document.createElement('article');
    row.className = 'friend-item';
    row.innerHTML = `<p><strong>${friend.name}</strong><br /><small>${friend.email}</small></p>`;

    const actions = document.createElement('div');
    actions.className = 'friend-actions';
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'btn-ghost';
    viewBtn.textContent = 'Ver diario';
    viewBtn.addEventListener('click', async () => {
      state.selectedOwnerId = String(friend.id);
      renderOwnerSelect();
      await loadDreamsForDate(state.selectedCalendarDate);
      state.calendarMonth = state.selectedCalendarDate.slice(0, 7);
      await renderCalendar();
      await loadStats();
      activateTab('journal');
    });

    actions.appendChild(viewBtn);
    row.appendChild(actions);
    friendsList.appendChild(row);
  });
}

function renderFriendSearchResults(users) {
  friendSearchResults.innerHTML = '';
  if (!users.length) {
    friendSearchResults.innerHTML = '<p>Nenhum usuario encontrado.</p>';
    return;
  }

  users.forEach((person) => {
    const row = document.createElement('article');
    row.className = 'friend-item';
    row.innerHTML = `<p><strong>${person.name}</strong><br /><small>${person.email}</small></p>`;

    const actions = document.createElement('div');
    actions.className = 'friend-actions';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-primary';
    addBtn.textContent = 'Adicionar';
    addBtn.addEventListener('click', async () => {
      try {
        const result = await api('/api/friends/request', {
          method: 'POST',
          body: JSON.stringify({ email: person.email })
        });
        showMessage(friendMessage, result.message || 'Pedido enviado.');
        await loadFriendsData();
      } catch (err) {
        showMessage(friendMessage, err.message, true);
      }
    });

    actions.appendChild(addBtn);
    row.appendChild(actions);
    friendSearchResults.appendChild(row);
  });
}

async function loadFriendsData() {
  const [friendsData, requestsData] = await Promise.all([
    api('/api/friends'),
    api('/api/friends/requests')
  ]);

  state.friends = (friendsData.friends || []).map((friend) => ({
    ...friend,
    locationSharing: Boolean(friend.location_sharing),
    locationUpdatedAt: friend.location_updated_at || null
  }));
  state.incomingRequests = requestsData.incoming || [];
  renderOwnerSelect();
  renderIncomingRequests();
  renderFriendsList();
  renderFriendLocationOptions();
  renderFriendLocationStatusList();
  renderTransferFriendSelect();
}

function renderTransferFriendSelect() {
  const select = document.getElementById('transferFriendSelect');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione um amigo</option>';
  state.friends.forEach((friend) => {
    const option = document.createElement('option');
    option.value = String(friend.id);
    option.textContent = friend.name;
    select.appendChild(option);
  });
}

function buildRankingRow(user, i, scoreText, isMe) {
  const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
  const prefix = medals[i] || ('#' + (i + 1));
  const row = document.createElement('article');
  row.className = 'friend-item ranking-item' + (isMe ? ' ranking-me' : '');

  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = prefix + ' ' + (user.name || '—');
  p.appendChild(strong);
  if (isMe) {
    const em = document.createElement('em');
    em.textContent = ' (voce)';
    p.appendChild(em);
  }

  const score = document.createElement('span');
  score.className = 'ranking-score';
  score.textContent = scoreText;

  row.appendChild(p);
  row.appendChild(score);
  return row;
}

async function loadRanking() {
  if (!rankingSoninhosList || !rankingDreamsList) return;

  rankingSoninhosList.innerHTML = '<p>Carregando...</p>';
  rankingDreamsList.innerHTML = '<p>Carregando...</p>';

  try {
    const data = await api('/api/ranking');

    rankingSoninhosList.innerHTML = '';
    if (!data.topSoninhos || !data.topSoninhos.length) {
      rankingSoninhosList.innerHTML = '<p>Nenhum dado disponivel ainda.</p>';
    } else {
      data.topSoninhos.forEach((user, i) => {
        const isMe = state.user && user.id === state.user.id;
        const row = buildRankingRow(user, i, '\u2728 ' + (user.soninhos || 0) + ' soninhos', isMe);
        rankingSoninhosList.appendChild(row);
      });
    }

    rankingDreamsList.innerHTML = '';
    if (!data.topDreams || !data.topDreams.length) {
      rankingDreamsList.innerHTML = '<p>Nenhum dado disponivel ainda.</p>';
    } else {
      data.topDreams.forEach((user, i) => {
        const isMe = state.user && user.id === state.user.id;
        const row = buildRankingRow(user, i, '\uD83D\uDCD6 ' + (user.total_dreams || 0) + ' sonhos', isMe);
        rankingDreamsList.appendChild(row);
      });
    }
  } catch (err) {
    const msg = (err && err.message) ? err.message : 'Erro ao carregar ranking.';
    rankingSoninhosList.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = msg;
    rankingSoninhosList.appendChild(p);
    rankingDreamsList.innerHTML = '';
  }
}

function renderTags() {
  tagList.innerHTML = '';
  const customTagUnlocked = hasCustomTagUpgrade();

  if (!state.tags.length) {
    tagList.innerHTML = '<p>Nenhuma tag criada ainda.</p>';
    return;
  }

  state.tags.forEach((tag) => {
    const chip = document.createElement('div');
    chip.className = getTagChipClassName(tag);
    chip.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:${tag.color}"></span>${tag.name}`;
    applyTagColorPreview(chip, tag.color || '#7f6edc');

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = tag.color || '#7f6edc';
    colorInput.className = 'tag-color-picker';
    colorInput.disabled = !customTagUnlocked;
    colorInput.title = customTagUnlocked ? '' : 'Compre Tag Personalizada na loja para liberar a cor da tag';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'tag-save-btn';
    save.textContent = 'Salvar';

    const effectSelect = buildSelectFromOptions([
      { value: '', label: 'Sem efeito' },
    ], tag.tag_effect_class || '', 'tag-effect-select');

    getOwnedTagEffectItems().forEach((item) => {
      const option = document.createElement('option');
      option.value = item.effect_class;
      option.textContent = item.name;
      effectSelect.appendChild(option);
    });

    const fontSelect = buildSelectFromOptions(TAG_FONT_OPTIONS, tag.tag_font_class || '', 'tag-effect-select');
    fontSelect.disabled = !customTagUnlocked;
    fontSelect.title = customTagUnlocked ? '' : 'Compre Tag Personalizada na loja para liberar fonte da tag';

    const animationSelect = buildSelectFromOptions(TAG_ANIMATION_OPTIONS, tag.tag_animation_class || '', 'tag-effect-select');
    animationSelect.disabled = !customTagUnlocked;
    animationSelect.title = customTagUnlocked ? '' : 'Compre Tag Personalizada na loja para liberar animacao da tag';

    const syncColorPreview = () => {
      applyTagColorPreview(chip, colorInput.value);
    };

    const debouncedSyncColorPreview = debounce(syncColorPreview, 150);

    colorInput.addEventListener('input', () => {
      debouncedSyncColorPreview();
    });

    save.addEventListener('click', async () => {
      try {
        const payload = {
          color: colorInput.value,
          tagEffectClass: effectSelect.value || null,
        };

        if (customTagUnlocked) {
          payload.tagFontClass = fontSelect.value || null;
          payload.tagAnimationClass = animationSelect.value || null;
        }

        await api(`/api/tags/${tag.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        showMessage(tagMessage, `Tag ${tag.name} atualizada.`);
        await fetchTags();
        await loadStats();
      } catch (err) {
        showMessage(tagMessage, err.message, true);
      }
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = 'x';
    del.addEventListener('click', async () => {
      try {
        await api(`/api/tags/${tag.id}`, { method: 'DELETE' });
        await fetchTags();
        await loadDreamsForDate(state.selectedCalendarDate);
        await renderCalendar();
        await loadStats();
      } catch (err) {
        showMessage(tagMessage, err.message, true);
      }
    });

    chip.appendChild(colorInput);
    chip.appendChild(effectSelect);
    chip.appendChild(fontSelect);
    chip.appendChild(animationSelect);
    chip.appendChild(save);
    chip.appendChild(del);
    tagList.appendChild(chip);
  });
}

function renderTagChecklist() {
  dreamTagChecklist.innerHTML = '';
  if (!state.tags.length) {
    dreamTagChecklist.innerHTML = '<p>Crie tags para relacionar aos sonhos.</p>';
    return;
  }

  state.tags.forEach((tag) => {
    const id = `dream-tag-${tag.id}`;
    const label = document.createElement('label');
    label.className = getTagChipClassName(tag);
    label.innerHTML = `<input type="checkbox" value="${tag.id}" id="${id}" /> <span style="color:${tag.color}">#${tag.name}</span>`;
    dreamTagChecklist.appendChild(label);
  });
}

function readSelectedTagIds() {
  return Array.from(dreamTagChecklist.querySelectorAll('input[type="checkbox"]:checked')).map((el) => Number(el.value));
}

function buildAutoDreamTitle(date, mood) {
  const [year, month, day] = date.split('-');
  const shortDate = `${day}/${month}/${year}`;
  if (mood) return `Sonho em ${shortDate} (${mood})`;
  return `Sonho em ${shortDate}`;
}

async function loadDreamsForDate(date) {
  state.selectedCalendarDate = date;
  dreamDate.value = date;
  const data = await api(`/api/dreams?date=${date}${selectedOwnerQueryPart()}`);

  dreamList.innerHTML = '';
  if (!data.dreams.length) {
    dreamList.innerHTML = `<p>Nenhum sonho registrado nesta data em ${selectedOwnerLabel()}.</p>`;
    return;
  }

  data.dreams.forEach((dream) => {
    const tagDetails = parseDreamTagDetails(dream.tag_details);
    const tagsHtml = tagDetails.length
      ? tagDetails
        .map((tag) => {
          const className = ['tag-chip', tag.effectClass || '', tag.fontClass || '', tag.animationClass || '']
            .filter(Boolean)
            .map((entry) => escapeHtml(entry))
            .join(' ');
          return `<span class="${className}" style="margin-right:6px;"><span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:${escapeHtml(tag.color)}"></span>#${escapeHtml(tag.name)}</span>`;
        })
        .join('')
      : (dream.tag_names
          ? `<small>Tags: ${escapeHtml(dream.tag_names)}</small>`
          : '<small>Tags: sem tags</small>');

    const item = document.createElement('article');
    item.className = 'dream-item';
    item.innerHTML = `
      <h4>${dream.title} ${dream.is_important ? '⭐' : ''}</h4>
      <p class="dream-content ${escapeHtml(dream.applied_font_class || '')}">${dream.content}</p>
      <small>Humor: ${dream.mood || 'nao informado'}</small><br />
      <div class="dream-tags-line">${tagsHtml}</div>
    `;
    dreamList.appendChild(item);
  });
}

function formatMonthTitle(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

async function renderCalendar() {
  const [year, month] = state.calendarMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevDays = new Date(year, month - 1, 0).getDate();
  const cells = [];

  for (let i = startWeekDay - 1; i >= 0; i -= 1) {
    const d = prevDays - i;
    const date = new Date(year, month - 2, d);
    cells.push({ date, inactive: true });
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ date: new Date(year, month - 1, d), inactive: false });
  }

  while (cells.length % 7 !== 0) {
    const d = cells.length - (startWeekDay + daysInMonth) + 1;
    const date = new Date(year, month, d);
    cells.push({ date, inactive: true });
  }

  const monthData = await api(`/api/dreams?month=${state.calendarMonth}${selectedOwnerQueryPart()}`);
  const dreamDaySet = new Set(monthData.dreams.map((d) => d.date));

  calendarTitle.textContent = formatMonthTitle(state.calendarMonth);
  calendarGrid.innerHTML = '';

  cells.forEach(({ date, inactive }) => {
    const dateStr = localDateISO(date);
    const isToday = dateStr === localDateISO();
    const isSelected = dateStr === state.selectedCalendarDate;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = `day-cell ${inactive ? 'inactive' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`.trim();
    el.innerHTML = `<strong>${date.getDate()}</strong>${dreamDaySet.has(dateStr) ? '<div class="dot"></div>' : ''}`;

    el.addEventListener('click', async () => {
      state.selectedCalendarDate = dateStr;
      await loadDreamsForDate(dateStr);
      await renderCalendar();
      activateTab('journal');
    });

    calendarGrid.appendChild(el);
  });
}

async function loadStats() {
  const query = state.selectedOwnerId === 'me' ? '' : `?userId=${encodeURIComponent(state.selectedOwnerId)}`;
  const [stats] = await Promise.all([
    api(`/api/stats${query}`),
    loadRanking(),
  ]);
  totalDreams.textContent = String(stats.totals.totalDreams || 0);
  importantDreams.textContent = String(stats.totals.importantDreams || 0);

  topTags.innerHTML = '';
  if (!stats.topTags.length) {
    topTags.innerHTML = '<li>Sem tags associadas ainda.</li>';
  } else {
    stats.topTags.forEach((row) => {
      const li = document.createElement('li');
      li.textContent = `${row.name}: ${row.count}`;
      topTags.appendChild(li);
    });
  }

  monthBars.innerHTML = '';
  const maxCount = Math.max(...stats.byMonth.map((r) => Number(r.count)), 1);
  stats.byMonth.forEach((row) => {
    const width = Math.round((Number(row.count) / maxCount) * 100);
    const item = document.createElement('div');
    item.className = 'bar-row';
    item.innerHTML = `
      <span>${row.month}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
      <strong>${row.count}</strong>
    `;
    monthBars.appendChild(item);
  });
}

function activateTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));

  const targetPanel = document.getElementById(`tab-${tabName}`) || document.getElementById('tab-garden');
  const targetButton = document.querySelector(`.nav-btn[data-tab="${tabName}"]`) || document.querySelector('.nav-btn[data-tab="garden"]');

  if (targetPanel) targetPanel.classList.add('active');
  if (targetButton) targetButton.classList.add('active');
}

function formatShortDate(dateValue) {
  const [year, month, day] = String(dateValue || '').split('-');
  if (!year || !month || !day) return '--/--';
  return `${day}/${month}`;
}

function formatPassWeekLabel(weekStart) {
  if (!weekStart) return 'Semana atual indisponivel';
  const [year, month, day] = weekStart.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 6);
  return `${formatShortDate(weekStart)} ate ${formatShortDate(localDateISO(end))}`;
}

function activatePassView(viewName) {
  state.passView = viewName;
  document.querySelectorAll('.pass-view-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.passView === viewName);
  });
  if (passRewardsView) passRewardsView.classList.toggle('active', viewName === 'rewards');
  if (passPaymentView) passPaymentView.classList.toggle('active', viewName === 'payment');
  if (passProfileView) passProfileView.classList.toggle('active', viewName === 'profile');
}

function applyProfileBadge(imagePath) {
  if (!welcomeProfileImage) return;

  welcomeProfileImage.src = imagePath || DEFAULT_PROFILE_AVATAR;
  welcomeProfileImage.classList.remove('hidden');
}

function renderPassProfileRewards() {
  if (!passProfileRewardsList) return;
  passProfileRewardsList.innerHTML = '';

  const rewards = Array.isArray(state.pass.profileCatalog) ? state.pass.profileCatalog : [];
  const ownedSet = new Set(
    (Array.isArray(state.pass.ownedProfileRewards) ? state.pass.ownedProfileRewards : [])
      .map((item) => item.image_path)
  );
  if (!rewards.length) {
    passProfileRewardsList.innerHTML = '<p class="pass-muted">Nenhuma foto de perfil encontrada nas pastas do passe.</p>';
    return;
  }

  rewards.forEach((reward) => {
    const card = document.createElement('article');
    card.className = 'pass-profile-card';

    const preview = document.createElement('img');
    preview.className = 'pass-profile-thumb';
    preview.src = reward.imagePath;
    preview.alt = `Foto de perfil ${reward.itemName}`;

    const info = document.createElement('div');
    info.className = 'pass-profile-info';
    info.innerHTML = `<strong>${escapeHtml(reward.itemName)}</strong>`;

    const actions = document.createElement('div');
    actions.className = 'shop-item-actions';

    const isActive = reward.imagePath === state.pass.activeProfileImage;
    const isOwned = ownedSet.has(reward.imagePath);
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = isActive ? 'btn-ghost' : (isOwned ? 'btn-primary' : 'btn-ghost');
    toggleBtn.textContent = isActive ? 'Remover' : (isOwned ? 'Equipar' : 'Resgatar primeiro');
    toggleBtn.disabled = !isActive && !isOwned;
    toggleBtn.addEventListener('click', async () => {
      if (isActive) {
        await unequipPassProfileReward();
      } else {
        await equipPassProfileImage(reward.imagePath);
      }
    });
    actions.appendChild(toggleBtn);

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(actions);
    passProfileRewardsList.appendChild(card);
  });
}

function renderPass() {
  if (!passWeekLabel || !passStatusBadge || !passRewardToday || !passClaimCount || !passClaimHint || !passClaimBtn) return;

  const isActive = Boolean(state.pass.active);
  const paidLabel = state.pass.paidAt ? `Pago em ${formatDateTime(state.pass.paidAt)}` : 'Ainda nao pago nesta semana';

  if (passWeekTitle) {
    passWeekTitle.textContent = isActive ? 'Passe semanal ativo' : 'Passe semanal inativo';
  }
  passWeekLabel.textContent = `${formatPassWeekLabel(state.pass.weekStart)} • ${paidLabel}`;
  passStatusBadge.textContent = isActive ? 'Ativo' : 'Inativo';
  passStatusBadge.classList.toggle('status-on', isActive);
  passStatusBadge.classList.toggle('status-off', !isActive);
  passRewardToday.textContent = `✨ ${state.pass.todayReward || 0}`;
  passClaimCount.textContent = `${state.pass.weeklyClaimCount || 0}/7`;
  if (passPreviewWeekday) {
    passPreviewWeekday.textContent = `✨ ${state.pass.weekdayReward || 20} soninhos por dia`;
  }
  if (passPreviewWeekend) {
    passPreviewWeekend.textContent = `✨ ${state.pass.weekendReward || 100} soninhos por dia`;
  }
  passClaimHint.textContent = isActive
    ? (state.pass.todayClaimed
      ? `Hoje ja foi resgatado: +✨ ${state.pass.todayClaimReward || state.pass.todayReward || 0}.`
      : 'Seu passe esta ativo. Resgate os soninhos de hoje agora.')
    : 'Pague o passe semanal na aba de pagamento para liberar os resgates diarios.';
  passClaimBtn.disabled = !isActive || state.pass.todayClaimed;
  passClaimBtn.textContent = state.pass.todayClaimed ? 'Soninhos de hoje ja resgatados' : 'Resgatar soninhos de hoje';

  if (passPaymentSummary) {
    passPaymentSummary.textContent = isActive
      ? `Passe ja pago para a semana ${formatPassWeekLabel(state.pass.weekStart)}.`
      : `Pague ${state.pass.weeklyPrice || 100} soninhos para ativar o passe desta semana.`;
  }
  if (passPayBtn) {
    passPayBtn.disabled = isActive;
    passPayBtn.textContent = isActive ? 'Passe ja pago nesta semana' : `Pagar ${state.pass.weeklyPrice || 100} soninhos`;
  }

  const weeklyProfileReward = state.pass.currentWeeklyProfileReward;
  if (passPreviewProfileName) {
    passPreviewProfileName.textContent = weeklyProfileReward?.itemName || 'Foto de perfil semanal';
  }
  if (passPreviewProfileHint) {
    passPreviewProfileHint.textContent = state.pass.weeklyProfileRewardClaimed
      ? 'Voce ja desbloqueou esta foto nesta semana. Ela ficou permanente no inventario.'
      : 'Disponivel so nesta semana (segunda a domingo).';
  }
  if (passPreviewProfileImage) {
    if (weeklyProfileReward?.imagePath) {
      passPreviewProfileImage.src = weeklyProfileReward.imagePath;
      passPreviewProfileImage.classList.remove('hidden');
    } else {
      passPreviewProfileImage.src = '';
      passPreviewProfileImage.classList.add('hidden');
    }
  }
  if (passWeeklyProfileName) {
    passWeeklyProfileName.textContent = weeklyProfileReward?.itemName || 'Nenhuma recompensa configurada';
  }
  if (passWeeklyProfilePreview) {
    if (weeklyProfileReward?.imagePath) {
      passWeeklyProfilePreview.src = weeklyProfileReward.imagePath;
      passWeeklyProfilePreview.classList.remove('hidden');
    } else {
      passWeeklyProfilePreview.src = '';
      passWeeklyProfilePreview.classList.add('hidden');
    }
  }
  if (passWeeklyProfileHint) {
    const profileStatusText = state.pass.weeklyProfileRewardClaimed
      ? 'Foto da semana ja resgatada. Ela e permanente no seu inventario.'
      : 'Com o passe ativo, voce pode resgatar a foto semanal agora.';
    passWeeklyProfileHint.textContent = `${profileStatusText} Se nao resgatar ate domingo, a recompensa da semana expira.`;
  }
  if (passClaimProfileBtn) {
    passClaimProfileBtn.disabled = !state.pass.canClaimWeeklyProfileReward;
    passClaimProfileBtn.textContent = state.pass.weeklyProfileRewardClaimed
      ? 'Foto semanal ja resgatada'
      : 'Resgatar foto de perfil da semana';
  }

  applyProfileBadge(state.pass.activeProfileImage || null);
  renderPassProfileRewards();
}

let gardenCountdownInterval = null;
let gardenRefreshInterval = null;

function stopGardenCountdown() {
  if (gardenCountdownInterval) {
    clearInterval(gardenCountdownInterval);
    gardenCountdownInterval = null;
  }
}

function stopGardenRefresh() {
  if (gardenRefreshInterval) {
    clearInterval(gardenRefreshInterval);
    gardenRefreshInterval = null;
  }
}

function startGardenRefresh() {
  stopGardenRefresh();
  gardenRefreshInterval = setInterval(() => {
    const gardenPanel = document.getElementById('tab-garden');
    if (gardenPanel?.classList.contains('active')) {
      loadGardenData();
    }
  }, 15000);
}

function startGardenRealtimeCountdown() {
  stopGardenCountdown();
  gardenCountdownInterval = setInterval(() => {
    updateGardenRealtimeUI();
  }, 1000);
}

function formatDurationMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getGardenCropAtSlot(slotIndex) {
  return state.garden.crops.find((crop) => Number(crop.slotIndex) === Number(slotIndex)) || null;
}

function getDefaultGardenSlotPositions() {
  return {
    1: { x: 12, y: 62 },
    2: { x: 30, y: 57 },
    3: { x: 48, y: 62 },
    4: { x: 66, y: 56 },
    5: { x: 84, y: 61 },
    6: { x: 22, y: 77 },
    7: { x: 50, y: 80 },
    8: { x: 78, y: 77 },
  };
}

function clampGardenPercent(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeGardenPosition(pos, fallback) {
  return {
    x: clampGardenPercent(Number(pos?.x), 6, 94) || fallback.x,
    y: clampGardenPercent(Number(pos?.y), 44, 90) || fallback.y,
  };
}

function getGardenLayoutStorageKey() {
  const userPart = state.user?.id ? `u${state.user.id}` : 'guest';
  return `soninhos_garden_layout_${userPart}`;
}

function loadGardenLayoutFromStorage() {
  const defaults = getDefaultGardenSlotPositions();
  const parsed = {};
  try {
    const raw = localStorage.getItem(getGardenLayoutStorageKey());
    const payload = raw ? JSON.parse(raw) : {};
    for (let slot = 1; slot <= 8; slot += 1) {
      const key = String(slot);
      parsed[key] = normalizeGardenPosition(payload?.[key], defaults[slot]);
    }
  } catch {
    for (let slot = 1; slot <= 8; slot += 1) {
      parsed[String(slot)] = { ...defaults[slot] };
    }
  }
  state.garden.layoutBySlot = parsed;
}

function saveGardenLayoutToStorage() {
  try {
    localStorage.setItem(getGardenLayoutStorageKey(), JSON.stringify(state.garden.layoutBySlot || {}));
  } catch {
    // armazenamento indisponivel
  }
}

function getGardenSlotPosition(slot) {
  const defaults = getDefaultGardenSlotPositions();
  const fallback = defaults[slot] || { x: 50, y: 70 };
  const key = String(slot);
  if (!state.garden.layoutBySlot?.[key]) {
    if (!state.garden.layoutBySlot) state.garden.layoutBySlot = {};
    state.garden.layoutBySlot[key] = { ...fallback };
  }
  return normalizeGardenPosition(state.garden.layoutBySlot[key], fallback);
}

function getDefaultGardenDecorPosition(decorId = '', index = 0) {
  const key = String(decorId || 'decor');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const x = 14 + (Math.abs(hash + (index * 17)) % 72);
  const y = 12 + (Math.abs(hash + (index * 11)) % 30);
  return { x, y };
}

function normalizeGardenDecorPosition(pos, fallback = getDefaultGardenDecorPosition()) {
  return {
    x: clampGardenPercent(Number(pos?.x), 4, 96) || fallback.x,
    y: clampGardenPercent(Number(pos?.y), 6, 92) || fallback.y,
  };
}

function getGardenDecorLayoutStorageKey() {
  const userPart = state.user?.id ? `u${state.user.id}` : 'guest';
  return `soninhos_garden_decor_layout_${userPart}`;
}

function loadGardenDecorLayoutFromStorage() {
  try {
    const raw = localStorage.getItem(getGardenDecorLayoutStorageKey());
    const payload = raw ? JSON.parse(raw) : {};
    state.garden.decorLayoutById = (payload && typeof payload === 'object') ? payload : {};
  } catch {
    state.garden.decorLayoutById = {};
  }
}

function saveGardenDecorLayoutToStorage() {
  try {
    localStorage.setItem(getGardenDecorLayoutStorageKey(), JSON.stringify(state.garden.decorLayoutById || {}));
  } catch {
    // armazenamento indisponivel
  }
}

function getGardenEquippedDecors() {
  const equipped = state.garden.decor?.equippedItems;
  if (Array.isArray(equipped) && equipped.length) return equipped;
  return (state.garden.decor?.inventory || [])
    .filter((item) => item.equipped)
    .map((item) => ({
      decorId: item.decorId,
      name: item.name,
      description: item.description,
      assetPath: item.assetPath,
      sceneMode: item.sceneMode || 'backdrop',
    }));
}

function getGardenDecorPosition(decorId, index = 0) {
  if (!state.garden.decorLayoutById) {
    state.garden.decorLayoutById = {};
  }
  const key = String(decorId || 'decor');
  const fallback = getDefaultGardenDecorPosition(key, index);
  if (!state.garden.decorLayoutById[key]) {
    state.garden.decorLayoutById[key] = { ...fallback };
  }
  const entry = state.garden.decorLayoutById[key];
  const normalized = normalizeGardenDecorPosition(entry, fallback);
  state.garden.decorLayoutById[key] = { ...normalized, scale: Number(entry?.scale) || 1 };
  return state.garden.decorLayoutById[key];
}

function getGardenDecorScale(decorId) {
  const entry = state.garden.decorLayoutById?.[String(decorId)];
  return Math.max(0.3, Math.min(4, Number(entry?.scale) || 1));
}

function adjustGardenDecorScale(decorId, delta) {
  if (!state.garden.decorLayoutById) state.garden.decorLayoutById = {};
  const key = String(decorId);
  const current = getGardenDecorScale(key);
  const next = Math.max(0.3, Math.min(4, Math.round((current + delta) * 10) / 10));
  state.garden.decorLayoutById[key] = {
    ...(state.garden.decorLayoutById[key] || {}),
    scale: next,
  };
  saveGardenDecorLayoutToStorage();
  renderGardenVisual();
}

function getGardenDecorObjects() {
  return getGardenEquippedDecors().filter((item) => String(item.sceneMode || '').toLowerCase() === 'object');
}

function getGardenBackdropDecor() {
  return getGardenEquippedDecors().find((item) => String(item.sceneMode || '').toLowerCase() === 'backdrop') || null;
}

function updateGardenEditUI() {
  if (!gardenEditModeBtn || !gardenEditHint) return;
  const active = Boolean(state.garden.editMode);
  gardenEditModeBtn.classList.toggle('active', active);
  gardenEditModeBtn.textContent = active ? '⚙️ Finalizar' : '⚙️ Editar';
  gardenEditHint.textContent = active
    ? 'Modo edicao ativo: arraste as plantas e decoracoes para reposicionar.'
    : 'Crescimento visual por tipo de flor';
}

function toggleGardenEditMode() {
  state.garden.editMode = !state.garden.editMode;
  state.garden.dragging = false;
  updateGardenEditUI();
  renderGardenVisual();
}

function bindGardenPlantDrag(plantEl, sceneEl, markerEl, slot) {
  if (!plantEl || !sceneEl || !markerEl) return;
  if (!state.garden.editMode) return;

  plantEl.addEventListener('pointerdown', (event) => {
    if (!state.garden.editMode) return;
    event.preventDefault();
    const pointerId = event.pointerId;
    state.garden.dragging = true;
    plantEl.classList.add('dragging');
    plantEl.setPointerCapture(pointerId);

    const move = (moveEvent) => {
      const rect = sceneEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nextX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const nextY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      const safeX = clampGardenPercent(nextX, 6, 94);
      const safeY = clampGardenPercent(nextY, 44, 90);
      const key = String(slot);
      state.garden.layoutBySlot[key] = { x: safeX, y: safeY };
      plantEl.style.setProperty('--x', `${safeX}%`);
      plantEl.style.setProperty('--y', `${safeY}%`);
      markerEl.style.setProperty('--x', `${safeX}%`);
      markerEl.style.setProperty('--y', `${safeY}%`);
    };

    const finish = () => {
      plantEl.classList.remove('dragging');
      state.garden.dragging = false;
      saveGardenLayoutToStorage();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  });
}

function bindGardenDecorDrag(wrapperEl, sceneEl, decorId) {
  if (!wrapperEl || !sceneEl) return;
  if (!state.garden.editMode) return;

  const dragHandle = wrapperEl.querySelector('.garden-scene-decor-object') || wrapperEl;

  dragHandle.addEventListener('pointerdown', (event) => {
    if (!state.garden.editMode) return;
    event.preventDefault();
    event.stopPropagation();
    state.garden.dragging = true;
    wrapperEl.classList.add('dragging');

    const move = (moveEvent) => {
      const rect = sceneEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nextX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const nextY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      const safeX = clampGardenPercent(nextX, 4, 96);
      const safeY = clampGardenPercent(nextY, 6, 92);
      if (!state.garden.decorLayoutById) state.garden.decorLayoutById = {};
      const prevEntry = state.garden.decorLayoutById[String(decorId)] || {};
      state.garden.decorLayoutById[String(decorId)] = { ...prevEntry, x: safeX, y: safeY };
      wrapperEl.style.setProperty('--x', `${safeX}%`);
      wrapperEl.style.setProperty('--y', `${safeY}%`);
    };

    const finish = () => {
      wrapperEl.classList.remove('dragging');
      state.garden.dragging = false;
      saveGardenDecorLayoutToStorage();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  });
}

function applyGardenDecorToScene(sceneEl) {
  if (!sceneEl) return;
  const backdrop = getGardenBackdropDecor();
  const assetPath = backdrop?.assetPath || '';
  const hasBackdrop = Boolean(assetPath);
  sceneEl.classList.toggle('decor-backdrop', hasBackdrop);
  if (hasBackdrop) {
    sceneEl.style.backgroundImage = `url('${assetPath}')`;
    sceneEl.style.backgroundSize = 'cover';
    sceneEl.style.backgroundPosition = 'center';
  } else {
    sceneEl.style.backgroundImage = '';
    sceneEl.style.backgroundSize = '';
    sceneEl.style.backgroundPosition = '';
  }
}

function updateGardenDecorInventoryUI() {
  if (!gardenDecorInventoryPanel || !gardenDecorInventoryToggleBtn) return;
  const open = Boolean(state.garden.decorInventoryOpen);
  gardenDecorInventoryPanel.classList.toggle('is-collapsed', !open);
  gardenDecorInventoryToggleBtn.textContent = open ? 'Fechar inventário' : 'Abrir inventário';
}

function renderGardenDecorTab() {
  if (gardenDecorCatalog) {
    gardenDecorCatalog.innerHTML = '';
    const searchTerm = String(state.garden.decorSearch || '').trim().toLowerCase();
    const items = (state.garden.decor?.catalog || []).filter((item) => {
      if (!searchTerm) return true;
      const haystack = [item.name, item.description, item.rarity]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    });

    if (!items.length) {
      gardenDecorCatalog.innerHTML = searchTerm
        ? '<p class="pass-muted">Nenhuma decoracao encontrada na busca.</p>'
        : '<p class="pass-muted">Nenhuma decoracao disponivel.</p>';
    } else {
      items.forEach((item) => {
        const owned = Number(item.ownedQuantity || 0) > 0;
        const equipped = Boolean(item.equipped);
        const card = document.createElement('article');
        card.className = 'garden-decor-card';
        card.style.borderColor = item.rarityColor || '#9ea3ad';
        card.innerHTML = `
          <img class="garden-decor-preview" src="${item.assetPath}" alt="${escapeHtml(item.name)}" />
          <div class="garden-decor-info">
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.description)}</small>
            <small>Preco: ✨ ${Number(item.price || 0)}</small>
            <small>Raridade: ${escapeHtml(item.rarity || 'comum')}</small>
            <small>${owned ? `No inventario: x${item.ownedQuantity}` : 'Ainda nao comprado'}</small>
          </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'shop-item-actions';

        if (!owned) {
          const buyBtn = document.createElement('button');
          buyBtn.type = 'button';
          buyBtn.className = 'btn-primary';
          buyBtn.textContent = 'Comprar';
          buyBtn.addEventListener('click', async () => {
            await buyGardenDecor(item.id);
          });
          actions.appendChild(buyBtn);
        } else if (equipped) {
          const equippedBtn = document.createElement('button');
          equippedBtn.type = 'button';
          equippedBtn.className = 'garden-decor-equipped-tag';
          equippedBtn.textContent = 'Equipado';
          equippedBtn.title = 'Clique para desequipar';
          equippedBtn.addEventListener('click', async () => {
            await unequipGardenDecor(item.id);
          });
          actions.appendChild(equippedBtn);
        } else {
          const equipBtn = document.createElement('button');
          equipBtn.type = 'button';
          equipBtn.className = 'btn-primary';
          equipBtn.textContent = 'Desequipado';
          equipBtn.title = 'Clique para equipar';
          equipBtn.addEventListener('click', async () => {
            await equipGardenDecor(item.id);
          });
          actions.appendChild(equipBtn);
        }

        card.appendChild(actions);
        gardenDecorCatalog.appendChild(card);
      });
    }
  }

  if (gardenDecorInventory) {
    gardenDecorInventory.innerHTML = '';
    const ownedItems = state.garden.decor?.inventory || [];

    if (!ownedItems.length) {
      gardenDecorInventory.innerHTML = '<p class="pass-muted">Seu inventario de decoracao esta vazio.</p>';
    } else {
      ownedItems.forEach((item) => {
        const pill = document.createElement('article');
        pill.className = `garden-decor-inventory-item${item.equipped ? ' equipped' : ''}`;
        pill.style.borderColor = item.rarityColor || '#9ea3ad';
        pill.innerHTML = `
          <div class="garden-decor-item-visual">
            ${item.assetPath ? `<img class="garden-decor-item-thumb" src="${item.assetPath}" alt="${escapeHtml(item.name)}" />` : '<span class="garden-decor-item-emoji">🪴</span>'}
          </div>
          <div class="garden-decor-item-info">
            <strong>${escapeHtml(item.name)}</strong>
            <small>Quantidade: x${Number(item.quantity || 0)}</small>
            <small>${item.equipped ? 'Equipado no cenário' : 'Guardado no inventário'}</small>
          </div>
          <div class="garden-decor-item-meta">
            <span class="garden-decor-rarity">${escapeHtml(item.rarity || 'comum')}</span>
            <span class="garden-decor-qty">x${Number(item.quantity || 0)}</span>
          </div>
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = item.equipped ? 'garden-decor-toggle-btn active' : 'garden-decor-toggle-btn';
        toggleBtn.textContent = item.equipped ? 'Equipado' : 'Desequipado';
        toggleBtn.title = item.equipped ? 'Clique para desequipar' : 'Clique para equipar';
        toggleBtn.addEventListener('click', async () => {
          if (item.equipped) {
            await unequipGardenDecor(item.decorId);
          } else {
            await equipGardenDecor(item.decorId);
          }
        });
        pill.appendChild(toggleBtn);
        gardenDecorInventory.appendChild(pill);
      });
    }
  }

  updateGardenDecorInventoryUI();
}

function getGardenCropStage(crop) {
  const readyAt = Date.parse(crop?.readyAt || '');
  const plantedAt = Date.parse(crop?.plantedAt || '');
  if (!Number.isFinite(readyAt) || !Number.isFinite(plantedAt) || readyAt <= plantedAt) {
    return 1;
  }
  const total = readyAt - plantedAt;
  const elapsed = Math.max(0, Math.min(total, Date.now() - plantedAt));
  const progress = elapsed / total;
  if (progress >= 1) return 4;
  if (progress >= 0.72) return 3;
  if (progress >= 0.4) return 2;
  if (progress >= 0.12) return 1;
  return 0;
}

function getGardenSpriteSheetForPlant(crop) {
  const plantId = String(crop?.plantId || '').toLowerCase();
  const sheets = {
    margarida_lunar: '/garden-sprites/margarida_lunar.svg',
    lavanda_nevoa: '/garden-sprites/lavanda_nevoa.svg',
    rosa_onirica: '/garden-sprites/rosa_onirica.svg',
    orquidea_estelar: '/garden-sprites/orquidea_estelar.svg',
    lirio_cromatico: '/garden-sprites/lirio_cromatico.svg',
  };
  return sheets[plantId] || '/garden-sprites/margarida_lunar.svg';
}

function renderGardenVisual() {
  if (!gardenVisual || !state.garden.player) return;

  const maxSlots = Number(state.garden.player.maxSlots || 2);
  updateGardenEditUI();

  const plantedCount = state.garden.crops.length;
  const totalUnlocked = Math.max(0, maxSlots);
  const emptyUnlocked = Math.max(0, totalUnlocked - plantedCount);

  gardenVisual.innerHTML = '';

  const scene = document.createElement('div');
  scene.className = `garden-scene${state.garden.editMode ? ' edit-mode' : ''}`;
  scene.innerHTML = '<div class="garden-scene-sky" aria-hidden="true"></div><div class="garden-scene-ground" aria-hidden="true"></div>';
  applyGardenDecorToScene(scene);

  const decorObjects = getGardenDecorObjects();
  decorObjects.forEach((decor, index) => {
    const decorPos = getGardenDecorPosition(decor.decorId, index);
    const scale = getGardenDecorScale(decor.decorId);
    const wrapper = document.createElement('div');
    wrapper.className = 'garden-scene-decor-wrapper';
    wrapper.style.setProperty('--x', `${decorPos.x}%`);
    wrapper.style.setProperty('--y', `${decorPos.y}%`);
    wrapper.style.setProperty('--scale', String(scale));
    wrapper.dataset.decorId = String(decor.decorId || '');

    const decorEl = document.createElement('button');
    decorEl.type = 'button';
    decorEl.className = 'garden-scene-decor-object';
    decorEl.title = state.garden.editMode
      ? `Arraste para posicionar ${decor?.name || 'o item decorativo'}.`
      : (decor?.name || 'Decoracao ativa');
    decorEl.innerHTML = `<img src="${escapeHtml(decor?.assetPath || '')}" alt="${escapeHtml(decor?.name || 'Decoracao')}" />`;
    wrapper.appendChild(decorEl);
    bindGardenDecorDrag(wrapper, scene, decor.decorId);

    if (state.garden.editMode) {
      const controls = document.createElement('div');
      controls.className = 'garden-decor-resize-controls';

      const minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.className = 'garden-decor-resize-btn';
      minusBtn.textContent = '−';
      minusBtn.title = 'Diminuir item';
      minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustGardenDecorScale(decor.decorId, -0.1);
      });

      const scaleLabel = document.createElement('span');
      scaleLabel.className = 'garden-decor-scale-label';
      scaleLabel.textContent = `${Math.round(scale * 100)}%`;

      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = 'garden-decor-resize-btn';
      plusBtn.textContent = '+';
      plusBtn.title = 'Aumentar item';
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustGardenDecorScale(decor.decorId, 0.1);
      });

      controls.appendChild(minusBtn);
      controls.appendChild(scaleLabel);
      controls.appendChild(plusBtn);
      wrapper.appendChild(controls);
    }

    scene.appendChild(wrapper);
  });

  const markerBySlot = new Map();

  for (let slot = 1; slot <= 8; slot += 1) {
    const unlocked = slot <= maxSlots;
    const pos = getGardenSlotPosition(slot);
    const marker = document.createElement('span');
    marker.className = `garden-scene-slot${unlocked ? ' unlocked' : ' locked'}`;
    marker.style.setProperty('--x', `${pos.x}%`);
    marker.style.setProperty('--y', `${pos.y}%`);
    marker.title = unlocked ? `Espaco ${slot} desbloqueado` : `Espaco ${slot} bloqueado`;
    marker.dataset.slot = String(slot);
    markerBySlot.set(slot, marker);
    scene.appendChild(marker);

    if (!unlocked) continue;
    const crop = getGardenCropAtSlot(slot);
    if (!crop) continue;

    const stage = getGardenCropStage(crop);
    const spriteSheet = getGardenSpriteSheetForPlant(crop);
    const readyAt = Date.parse(crop.readyAt || '');
    const isReady = Number.isFinite(readyAt) && Date.now() >= readyAt;

    const plant = document.createElement('div');
    plant.className = `garden-scene-plant${isReady ? ' ready' : ''}`;
    plant.style.setProperty('--x', `${pos.x}%`);
    plant.style.setProperty('--y', `${pos.y}%`);
    plant.dataset.slot = String(slot);
    plant.title = isReady
      ? `${crop.plantName || 'Flor'} pronta para colher`
      : `${crop.plantName || 'Flor'} crescendo`;
    plant.innerHTML = `
      <div
        class="garden-sprite-sheet"
        style="--stage:${stage};background-image:url('${escapeHtml(spriteSheet)}');"
        aria-hidden="true"
      ></div>
    `;
    scene.appendChild(plant);

    const markerEl = markerBySlot.get(slot);
    bindGardenPlantDrag(plant, scene, markerEl, slot);
  }

  const caption = document.createElement('p');
  caption.className = 'garden-scene-caption';
  caption.textContent = state.garden.editMode
    ? `Modo edicao: arraste as plantas para onde quiser e clique em Finalizar.`
    : `Jardim unico: ${plantedCount} plantada(s), ${emptyUnlocked} espaco(s) livre(s).`;

  gardenVisual.appendChild(scene);
  gardenVisual.appendChild(caption);
}

function formatGardenTypeLabel(type) {
  if (type === 'speed') return 'Velocidade';
  if (type === 'yield') return 'Colheita';
  if (type === 'xp') return 'XP';
  if (type === 'luck') return 'Sorte';
  return 'Item';
}

function renderGardenInventory() {
  if (!gardenInventory) return;
  gardenInventory.innerHTML = '';

  if (!state.garden.inventory.length) {
    gardenInventory.innerHTML = '<span class="garden-upgrade-pill">Inventario vazio</span>';
    return;
  }

  state.garden.inventory.forEach((item) => {
    const pill = document.createElement('span');
    pill.className = 'garden-upgrade-pill';
    pill.style.borderColor = item.rarityColor || '#9ea3ad';
    const pct = Math.round((item.effectValue || 0) * 100);
    pill.textContent = `${item.icon || '🧰'} ${item.name} x${item.quantity} • ${formatGardenTypeLabel(item.type)} +${pct}%`;
    gardenInventory.appendChild(pill);
  });
}

function buildGardenItemSelect() {
  const select = document.createElement('select');
  select.innerHTML = '<option value="">Sem item (plantio puro)</option>';
  state.garden.inventory.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.templateId;
    const pct = Math.round((item.effectValue || 0) * 100);
    option.textContent = `${item.icon || '🧰'} ${item.name} x${item.quantity} (+${pct}% ${formatGardenTypeLabel(item.type)})`;
    select.appendChild(option);
  });
  return select;
}

function renderGardenSlots() {
  if (!gardenSlots || !gardenSlotInfo || !state.garden.player) return;
  const maxSlots = Number(state.garden.player.maxSlots || 2);
  const nextSlotPrice = Number(state.garden.player.nextSlotPrice || 0);

  gardenSlotInfo.textContent = `Espacos desbloqueados: ${maxSlots}. Proximo desbloqueio: ✨ ${nextSlotPrice}.`;
  if (gardenBuySlotBtn) {
    gardenBuySlotBtn.disabled = maxSlots >= 8;
    gardenBuySlotBtn.textContent = maxSlots >= 8 ? 'Limite de espacos atingido' : `Desbloquear espaco (✨ ${nextSlotPrice})`;
  }

  gardenSlots.innerHTML = '';
  for (let slot = 1; slot <= 8; slot += 1) {
    const crop = getGardenCropAtSlot(slot);
    const unlocked = slot <= maxSlots;
    const card = document.createElement('article');
    card.className = `garden-slot${unlocked ? '' : ' locked'}`;

    if (!unlocked) {
      card.innerHTML = `<h5>Espaco ${slot}</h5><small>Bloqueado</small>`;
      gardenSlots.appendChild(card);
      continue;
    }

    if (!crop) {
      const select = document.createElement('select');
      const availablePlants = state.garden.plants.filter((plant) => plant.unlocked && plant.seedQuantity > 0);
      if (!availablePlants.length) {
        select.innerHTML = '<option value="">Sem sementes disponiveis</option>';
        select.disabled = true;
      } else {
        select.innerHTML = '<option value="">Escolha a semente</option>';
        availablePlants.forEach((plant) => {
          const option = document.createElement('option');
          option.value = plant.id;
          option.textContent = `${plant.name} (x${plant.seedQuantity})`;
          select.appendChild(option);
        });
      }

      const plantBtn = document.createElement('button');
      plantBtn.type = 'button';
      plantBtn.className = 'btn-primary';
      plantBtn.textContent = 'Plantar';
      plantBtn.disabled = select.disabled;
      const itemSelect = buildGardenItemSelect();
      plantBtn.addEventListener('click', async () => {
        const plantId = select.value;
        if (!plantId) {
          showMessage(gardenMessage, 'Escolha uma semente para plantar.', true);
          return;
        }
        await plantGardenSeed(slot, plantId, itemSelect.value || null);
      });

      const title = document.createElement('h5');
      title.textContent = `Espaco ${slot}`;
      const subtitle = document.createElement('small');
      subtitle.textContent = 'Livre para plantar';
      card.appendChild(title);
      card.appendChild(subtitle);
      card.appendChild(select);
      card.appendChild(itemSelect);
      card.appendChild(plantBtn);
      gardenSlots.appendChild(card);
      continue;
    }

    const readyAt = Date.parse(crop.readyAt);
    const isReady = Number.isFinite(readyAt) && Date.now() >= readyAt;
    const remaining = isReady ? 0 : Math.max(0, readyAt - Date.now());
    const expectedReward = Math.max(1, Math.round((crop.baseReward || 1) * (crop.yieldMultiplier || 1)));

    const harvestBtn = document.createElement('button');
    harvestBtn.type = 'button';
    harvestBtn.className = isReady ? 'btn-primary' : 'btn-ghost';
    harvestBtn.textContent = isReady ? 'Colher agora' : 'Ainda crescendo';
    harvestBtn.disabled = !isReady;
    harvestBtn.addEventListener('click', async () => {
      await harvestGardenSlot(slot);
    });

    const info = document.createElement('div');
    const statusLine = document.createElement('small');
    statusLine.className = 'garden-crop-timer';
    statusLine.dataset.readyAt = String(crop.readyAt || '');
    statusLine.dataset.slot = String(slot);
    statusLine.textContent = isReady ? 'Pronto para colher!' : `Tempo restante: ${formatDurationMs(remaining)}`;

    const rewardLine = document.createElement('small');
    rewardLine.textContent = `Colheita prevista: ✨ ${expectedReward}`;

    const title = document.createElement('h5');
    title.innerHTML = `<span class="garden-plant-icon" style="background:${escapeHtml(crop.plantRarityColor || '#9ea3ad')};">${escapeHtml(crop.plantIcon || '🌱')}</span> Espaco ${slot} • ${escapeHtml(crop.plantName)}`;

    info.appendChild(title);
    info.appendChild(statusLine);
    info.appendChild(document.createElement('br'));
    info.appendChild(rewardLine);
    if (crop.appliedItem?.name) {
      const appliedLine = document.createElement('small');
      appliedLine.textContent = `Item aplicado: ${crop.appliedItem.icon || '🧰'} ${crop.appliedItem.name}`;
      info.appendChild(document.createElement('br'));
      info.appendChild(appliedLine);
    }

    card.appendChild(info);
    harvestBtn.classList.add('garden-harvest-btn');
    harvestBtn.dataset.readyAt = String(crop.readyAt || '');
    card.appendChild(harvestBtn);
    gardenSlots.appendChild(card);
  }
}

function renderGardenSeeds() {
  if (!gardenSeeds || !state.garden.player) return;
  gardenSeeds.innerHTML = '';
  const level = Number(state.garden.player.level || 1);

  state.garden.plants.forEach((plant) => {
    const card = document.createElement('article');
    card.className = 'garden-item';
    card.style.borderColor = plant.rarityColor || '#9ea3ad';
    const unlocked = Boolean(plant.unlocked);
    const lockedText = unlocked ? '' : `Nivel ${plant.unlockLevel}`;

    card.innerHTML = `
      <strong><span class="garden-seed-icon">${escapeHtml(plant.icon || '🌱')}</span> ${escapeHtml(plant.name)}</strong>
      <small>Raridade: ${escapeHtml(plant.rarity)} • Cresce em ${plant.growMinutes} min</small>
      <small>Semente: ✨ ${plant.seedCost} • Colheita base: ✨ ${plant.harvestReward}</small>
      <small>XP de colheita: +${plant.xpReward} • Inventario: x${plant.seedQuantity}</small>
      <small>${unlocked ? 'Desbloqueada' : `Bloqueada (${lockedText})`}</small>
    `;

    const buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.className = 'btn-primary';
    buyBtn.textContent = `Comprar 1 (✨ ${plant.seedCost})`;
    buyBtn.disabled = !unlocked || level < plant.unlockLevel;
    buyBtn.addEventListener('click', async () => {
      await buyGardenSeed(plant.id, 1);
    });

    card.appendChild(buyBtn);
    gardenSeeds.appendChild(card);
  });
}

function renderGardenOffers() {
  if (!gardenOffers) return;
  gardenOffers.innerHTML = '';

  if (!state.garden.offers.length) {
    gardenOffers.innerHTML = '<p class="pass-muted">Sem ofertas neste ciclo.</p>';
    return;
  }

  state.garden.offers.forEach((offer) => {
    const card = document.createElement('article');
    card.className = 'garden-item';
    card.style.borderColor = offer.rarityColor || '#8e77cc';

    if (offer.empty) {
      card.innerHTML = `
        <span class="garden-offer-tier">Slot vazio</span>
        <strong>🌫️ Sem item</strong>
        <small>${escapeHtml(offer.description || 'Volte no proximo ciclo.')}</small>
      `;
      gardenOffers.appendChild(card);
      return;
    }

    const effectPct = Math.round((offer.effectValue || 0) * 100);

    card.innerHTML = `
      <span class="garden-offer-tier">Tier ${offer.tier}</span>
      <strong>${escapeHtml(offer.icon || '🧰')} ${escapeHtml(offer.name)}</strong>
      <small>${escapeHtml(offer.description)}</small>
      <small>Efeito: +${effectPct}% • Estoque: ${offer.stock}</small>
      <small>Preco: ✨ ${offer.price}</small>
    `;

    const actions = document.createElement('div');
    actions.className = 'shop-item-actions';

    const buyOneBtn = document.createElement('button');
    buyOneBtn.type = 'button';
    buyOneBtn.className = 'btn-primary';
    buyOneBtn.textContent = 'Comprar 1';
    buyOneBtn.disabled = offer.stock <= 0;
    buyOneBtn.addEventListener('click', async () => {
      await buyGardenUpgrade(offer.offerId, 1);
    });

    const buyAllBtn = document.createElement('button');
    buyAllBtn.type = 'button';
    buyAllBtn.className = 'btn-ghost';
    buyAllBtn.textContent = `Comprar estoque (${offer.stock})`;
    buyAllBtn.disabled = offer.stock <= 0;
    buyAllBtn.addEventListener('click', async () => {
      await buyGardenUpgrade(offer.offerId, offer.stock);
    });

    actions.appendChild(buyOneBtn);
    actions.appendChild(buyAllBtn);
    card.appendChild(actions);
    gardenOffers.appendChild(card);
  });
}

function updateGardenRealtimeUI() {
  if (gardenOfferTimer && state.garden.offerCycle?.resetAt) {
    const resetAt = Date.parse(state.garden.offerCycle.resetAt);
    if (Number.isFinite(resetAt)) {
      const offerRemaining = Math.max(0, resetAt - Date.now());
      gardenOfferTimer.textContent = `Proxima rotacao em ${formatDurationMs(offerRemaining)}`;
      if (offerRemaining <= 0) {
        loadGardenData();
      }
    }
  }

  document.querySelectorAll('.garden-crop-timer').forEach((timerEl) => {
    const readyAt = Date.parse(timerEl.dataset.readyAt || '');
    const button = timerEl.closest('.garden-slot')?.querySelector('.garden-harvest-btn');
    if (!Number.isFinite(readyAt) || !button) return;
    const remaining = Math.max(0, readyAt - Date.now());
    const ready = remaining <= 0;
    timerEl.textContent = ready ? 'Pronto para colher!' : `Tempo restante: ${formatDurationMs(remaining)}`;
    button.disabled = !ready;
    button.className = ready ? 'btn-primary garden-harvest-btn' : 'btn-ghost garden-harvest-btn';
    button.textContent = ready ? 'Colher agora' : 'Ainda crescendo';
  });

  if (!state.garden.dragging) {
    renderGardenVisual();
  }
}

function renderGarden() {
  if (!state.garden.player) return;
  if (gardenBalance) gardenBalance.textContent = `✨ ${state.garden.player.soninhosBalance || 0}`;
  if (gardenLevel) gardenLevel.textContent = String(state.garden.player.level || 1);
  if (gardenXp) gardenXp.textContent = `${state.garden.player.xpInLevel || 0} / ${state.garden.player.xpToNext || 0}`;

  renderGardenSlots();
  renderGardenVisual();
  renderGardenSeeds();
  renderGardenOffers();
  renderGardenInventory();
  renderGardenDecorTab();
  updateGardenRealtimeUI();
  startGardenRealtimeCountdown();
}

function applyGardenSnapshot(data) {
  state.garden.player = data.player || null;
  state.garden.plants = data.plants || [];
  state.garden.crops = data.crops || [];
  state.garden.offers = data.offers || [];
  state.garden.inventory = data.inventory || [];
  state.garden.decor = data.decor || { catalog: [], inventory: [], equippedItems: [], equipped: null };
  state.garden.offerCycle = data.offerCycle || null;
  if (state.garden.player) {
    state.soninhos = state.garden.player.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
  }
}

async function loadGardenData(showSilent = true) {
  try {
    const data = await api('/api/garden/status');
    applyGardenSnapshot(data);
    renderGarden();
  } catch (err) {
    if (!showSilent) {
      showMessage(gardenMessage, err.message, true);
    }
  }
}

async function loadGardenDecorData(showSilent = true) {
  try {
    const data = await api('/api/garden/decor/status');
    state.garden.decor = data || { catalog: [], inventory: [], equippedItems: [], equipped: null };
    renderGardenDecorTab();
    renderGardenVisual();
  } catch (err) {
    if (!showSilent && gardenDecorMessage) {
      showMessage(gardenDecorMessage, err.message, true);
    }
  }
}

async function buyGardenSeed(plantId, quantity = 1) {
  try {
    const data = await api('/api/garden/seeds/buy', {
      method: 'POST',
      body: JSON.stringify({ plantId, quantity }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenMessage, data.message || 'Semente comprada.');
  } catch (err) {
    showMessage(gardenMessage, err.message, true);
  }
}

async function plantGardenSeed(slotIndex, plantId, itemTemplateId = null) {
  try {
    const data = await api('/api/garden/plant', {
      method: 'POST',
      body: JSON.stringify({ slotIndex, plantId, itemTemplateId }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenMessage, data.message || 'Plantio realizado.');
  } catch (err) {
    showMessage(gardenMessage, err.message, true);
  }
}

async function harvestGardenSlot(slotIndex) {
  try {
    const data = await api('/api/garden/harvest', {
      method: 'POST',
      body: JSON.stringify({ slotIndex }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenMessage, data.message || 'Colheita realizada.');
  } catch (err) {
    showMessage(gardenMessage, err.message, true);
  }
}

async function buyGardenSlot() {
  try {
    const data = await api('/api/garden/slots/buy', { method: 'POST' });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenMessage, data.message || 'Espaco desbloqueado.');
  } catch (err) {
    showMessage(gardenMessage, err.message, true);
  }
}

async function buyGardenUpgrade(offerId, quantity = 1) {
  try {
    const data = await api('/api/garden/upgrades/buy', {
      method: 'POST',
      body: JSON.stringify({ offerId, quantity }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenMessage, data.message || 'Upgrade comprado.');
  } catch (err) {
    showMessage(gardenMessage, err.message, true);
  }
}

async function buyGardenDecor(decorId) {
  try {
    const data = await api('/api/garden/decor/buy', {
      method: 'POST',
      body: JSON.stringify({ decorId }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenDecorMessage, data.message || 'Decoracao comprada.');
  } catch (err) {
    showMessage(gardenDecorMessage, err.message, true);
  }
}

async function equipGardenDecor(decorId) {
  try {
    const data = await api('/api/garden/decor/equip', {
      method: 'POST',
      body: JSON.stringify({ decorId }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenDecorMessage, data.message || 'Decoracao equipada.');
  } catch (err) {
    showMessage(gardenDecorMessage, err.message, true);
  }
}

async function unequipGardenDecor(decorId = null) {
  try {
    const data = await api('/api/garden/decor/unequip', {
      method: 'POST',
      body: JSON.stringify({ decorId }),
    });
    applyGardenSnapshot(data);
    renderGarden();
    showMessage(gardenDecorMessage, data.message || 'Decoracao removida.');
  } catch (err) {
    showMessage(gardenDecorMessage, err.message, true);
  }
}

// ─── LOJA DOS SONHOS ─────────────────────────────────────────────────────────

function updateSoninhosDisplay() {
  const txt = `✨ ${state.soninhos} soninhos`;
  if (soninhosBalance) soninhosBalance.textContent = txt;
  if (shopBalanceDisplay) shopBalanceDisplay.textContent = `✨ ${state.soninhos}`;
  if (passSoninhosDisplay) passSoninhosDisplay.textContent = `✨ ${state.soninhos}`;
  if (gardenBalance) gardenBalance.textContent = `✨ ${state.soninhos}`;
  if (gardenDecorBalance) gardenDecorBalance.textContent = `✨ ${state.soninhos}`;
}

function clampColorChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const toHex = (value) => clampColorChannel(value).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHexColors(baseHex, mixHex, amount) {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHex);
  if (!base || !mix) return baseHex;
  return rgbToHex(
    base.r + (mix.r - base.r) * amount,
    base.g + (mix.g - base.g) * amount,
    base.b + (mix.b - base.b) * amount,
  );
}

function getContrastInk(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#2f2559';
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.65 ? '#2f2559' : '#f7f3ff';
}

function applyThemeColor(colorValue) {
  const root = document.documentElement;
  if (!colorValue) {
    root.style.removeProperty('--bg');
    root.style.removeProperty('--paper');
    root.style.removeProperty('--ink');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-soft');
    root.style.removeProperty('--overlay-start');
    root.style.removeProperty('--overlay-end');
    root.style.removeProperty('--glow-one');
    root.style.removeProperty('--glow-two');
    root.style.removeProperty('--glow-three');
    root.style.removeProperty('--orb-a');
    root.style.removeProperty('--orb-b');
    root.style.removeProperty('--glass-soft');
    if (customThemeColor) customThemeColor.value = '#7f6edc';
    if (customThemePreview) customThemePreview.style.background = '#7f6edc';
    if (customThemeLabel) customThemeLabel.textContent = 'Tema atual: padrao';
    return;
  }

  const accent = colorValue;
  const accentSoft = mixHexColors(accent, '#ffffff', 0.2);
  const paper = mixHexColors(accent, '#d7c7ff', 0.45);
  const bg = mixHexColors(accent, '#b09ae8', 0.35);
  const muted = mixHexColors(accent, '#3f2b76', 0.45);
  const ink = getContrastInk(mixHexColors(accent, '#ffffff', 0.55));
  const overlayStart = hexToRgba(mixHexColors(accent, '#1c113b', 0.3), 0.46);
  const overlayEnd = hexToRgba(mixHexColors(accent, '#ffffff', 0.15), 0.5);
  const glowOne = hexToRgba(mixHexColors(accent, '#ffffff', 0.78), 0.58);
  const glowTwo = hexToRgba(mixHexColors(accent, '#eef0ff', 0.65), 0.52);
  const glowThree = hexToRgba(mixHexColors(accent, '#fff6ff', 0.7), 0.42);
  const orbA = mixHexColors(accent, '#ffd8ff', 0.5);
  const orbB = mixHexColors(accent, '#c3c7ff', 0.38);
  const glassSoft = hexToRgba(mixHexColors(accent, '#ffffff', 0.35), 0.12);

  root.style.setProperty('--bg', bg);
  root.style.setProperty('--paper', paper);
  root.style.setProperty('--ink', ink);
  root.style.setProperty('--muted', muted);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-soft', accentSoft);
  root.style.setProperty('--overlay-start', overlayStart);
  root.style.setProperty('--overlay-end', overlayEnd);
  root.style.setProperty('--glow-one', glowOne);
  root.style.setProperty('--glow-two', glowTwo);
  root.style.setProperty('--glow-three', glowThree);
  root.style.setProperty('--orb-a', orbA);
  root.style.setProperty('--orb-b', orbB);
  root.style.setProperty('--glass-soft', glassSoft);

  if (customThemeColor) customThemeColor.value = accent;
  if (customThemePreview) customThemePreview.style.background = accent;
  if (customThemeLabel) customThemeLabel.textContent = `Tema atual: ${accent.toUpperCase()}`;
}

let themePreviewTimeout = null;
const themePreviewBackup = { oldColor: null, previewColor: null };

function previewThemeColorTemporary(colorValue) {
  if (themePreviewTimeout) clearTimeout(themePreviewTimeout);
  themePreviewBackup.oldColor = state.equipped.active_theme_color;
  themePreviewBackup.previewColor = colorValue; // Armazena a cor do preview
  applyThemeColor(colorValue);
  themePreviewTimeout = setTimeout(() => {
    applyThemeColor(themePreviewBackup.oldColor || null);
    themePreviewTimeout = null;
    // Manter as pills e input mostrando a cor que estava em preview
    updateThemeLivePreview(themePreviewBackup.previewColor);
    if (customThemeColor) {
      customThemeColor.value = themePreviewBackup.previewColor;
    }
    if (customThemePreview) {
      customThemePreview.style.background = themePreviewBackup.previewColor;
    }
  }, 5000);
}

function updateThemeLivePreview(colorValue) {
  const previewAccent = document.getElementById('previewAccentPill');
  const previewBg = document.getElementById('previewBgPill');
  const previewPaper = document.getElementById('previewPaperPill');
  if (!previewAccent) return;
  const accent = colorValue;
  const bg = mixHexColors(accent, '#b09ae8', 0.35);
  const paper = mixHexColors(accent, '#d7c7ff', 0.45);
  previewAccent.style.background = accent;
  previewAccent.style.color = getContrastInk(mixHexColors(accent, '#ffffff', 0.55));
  previewBg.style.background = bg;
  previewBg.style.color = getContrastInk(mixHexColors(bg, '#ffffff', 0.55));
  previewPaper.style.background = paper;
  previewPaper.style.color = getContrastInk(mixHexColors(paper, '#ffffff', 0.55));

  if (customThemeSubmitBtn) {
    const owned = state.customThemeColors.some(
      (c) => c.color.toUpperCase() === colorValue.toUpperCase()
    );
    customThemeSubmitBtn.textContent = owned ? 'Usar (gratuito)' : 'Comprar por 120';
  }
}

function renderCustomThemeColors() {
  if (!customThemeColorList) return;
  customThemeColorList.innerHTML = '';

  if (!state.customThemeColors.length) {
    customThemeColorList.innerHTML = '<p class="shop-wallpaper-empty">Nenhuma cor comprada ainda.</p>';
    return;
  }

  state.customThemeColors.forEach((entry) => {
    const card = document.createElement('article');
    card.className = `shop-wallpaper-item${entry.active ? ' shop-wallpaper-item-active' : ''}`;

    const swatch = document.createElement('div');
    swatch.className = 'shop-theme-color-swatch';
    swatch.style.background = entry.color;
    swatch.title = entry.color;

    const info = document.createElement('div');
    info.className = 'shop-wallpaper-info';
    info.innerHTML = `
      <strong style="color:${entry.color}">${entry.color}</strong>
      <small>${entry.active ? 'Em uso' : 'Salvo'}</small>
    `;

    const actions = document.createElement('div');
    actions.className = 'shop-item-actions';

    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = 'btn-primary';
    useBtn.textContent = entry.active ? 'Usando' : 'Usar';
    useBtn.disabled = Boolean(entry.active);
    useBtn.addEventListener('click', async () => {
      try {
        await api(`/api/shop/theme/use/${encodeURIComponent(entry.id)}`, { method: 'POST' });
        await loadShopData();
        showMessage(customThemeStatus, 'Cor aplicada permanentemente.');
      } catch (err) {
        showMessage(customThemeStatus, err.message, true);
      }
    });

    if (entry.active) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-ghost';
      removeBtn.textContent = 'Restaurar padrão';
      removeBtn.addEventListener('click', async () => {
        try {
          await removeCustomThemeColor();
          await loadShopData();
          showMessage(customThemeStatus, 'Tema padrão restaurado.');
        } catch (err) {
          showMessage(customThemeStatus, err.message, true);
        }
      });
      actions.appendChild(removeBtn);
    }

    actions.appendChild(useBtn);

    card.appendChild(swatch);
    card.appendChild(info);
    card.appendChild(actions);
    customThemeColorList.appendChild(card);
  });
}

function applyWallpaper(pathValue) {
  if (pathValue) {
    document.body.style.setProperty('--user-wallpaper', `url("${pathValue}")`);
    document.body.classList.add('has-custom-wallpaper');
    if (customWallpaperStatus) {
      showMessage(customWallpaperStatus, 'Wallpaper personalizado ativo.');
    }
    return;
  }

  document.body.style.removeProperty('--user-wallpaper');
  document.body.classList.remove('has-custom-wallpaper');
  if (customWallpaperStatus) {
    customWallpaperStatus.textContent = '';
  }
}

function applyEquipped() {
  // Remove todas as classes de efeito anteriores do body
  Array.from(document.body.classList).forEach((cls) => {
    if (cls.startsWith('font-') || cls.startsWith('tag-')) {
      document.body.classList.remove(cls);
    }
  });

  const fontItem = state.shopItems.find((i) => i.id === state.equipped.active_font);
  if (fontItem) document.body.classList.add(fontItem.effect_class);
  // Efeito de tag agora e aplicado por tag individual, nao globalmente no body.
  applyWallpaper(state.equipped.active_wallpaper || null);
  applyThemeColor(state.equipped.active_theme_color || null);
}

const CATEGORY_LABELS = { font: 'Fonte', tag_effect: 'Efeito de Tag' };

function updateShopPanels() {
  const themeMode = state.shopFilter === 'theme';
  const wallpaperMode = state.shopFilter === 'wallpaper';
  if (shopThemeCard) {
    shopThemeCard.classList.toggle('hidden', !themeMode);
  }
  if (shopWallpaperCard) {
    shopWallpaperCard.classList.toggle('hidden', !wallpaperMode);
  }
  if (shopGrid) {
    shopGrid.classList.toggle('hidden', wallpaperMode || themeMode);
  }
  if (shopMessage) {
    shopMessage.classList.toggle('hidden', wallpaperMode || themeMode);
  }
}

function renderShop() {
  updateShopPanels();

  if (state.shopFilter === 'theme') {
    applyThemeColor(state.equipped.active_theme_color || null);
    updateThemeLivePreview(customThemeColor ? customThemeColor.value : '#7f6edc');
    renderCustomThemeColors();
    return;
  }

  if (state.shopFilter === 'wallpaper') {
    renderCustomWallpapers();
    return;
  }

  shopGrid.innerHTML = '';
  const filtered = state.shopFilter === 'all'
    ? state.shopItems
    : state.shopItems.filter((i) => i.category === state.shopFilter);

  if (!filtered.length) {
    shopGrid.innerHTML = '<p style="text-align:center;color:#c9adff">Nenhum item nesta categoria.</p>';
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('article');
    card.className = `shop-item-card${item.owned ? ' shop-item-owned' : ''}${item.equipped ? ' shop-item-equipped' : ''}`;

    const preview = document.createElement('div');
    preview.className = 'shop-item-preview';
    if (item.category === 'font') {
      preview.classList.add(item.effect_class);
      preview.textContent = 'Abc';
    } else if (String(item.effect_class || '').trim()) {
      preview.innerHTML = `<span class="tag-chip shop-preview-tag ${item.effect_class}">#sonho</span>`;
    } else {
      preview.innerHTML = '<span class="tag-chip shop-preview-tag">PRO</span>';
    }

    const info = document.createElement('div');
    info.className = 'shop-item-info';

    const badge = document.createElement('span');
    badge.className = 'shop-category-badge';
    badge.textContent = CATEGORY_LABELS[item.category] || item.category;

    const name = document.createElement('strong');
    name.className = 'shop-item-name';
    name.textContent = item.name;

    const desc = document.createElement('p');
    desc.className = 'shop-item-desc';
    desc.textContent = item.description;

    const price = document.createElement('p');
    price.className = 'shop-item-price';
    price.textContent = item.owned ? '✅ Adquirido' : `✨ ${item.price} soninhos`;

    info.appendChild(badge);
    info.appendChild(name);
    info.appendChild(desc);
    info.appendChild(price);

    const actions = document.createElement('div');
    actions.className = 'shop-item-actions';

    if (!item.owned) {
      const buyBtn = document.createElement('button');
      buyBtn.type = 'button';
      buyBtn.className = 'btn-primary shop-buy-btn';
      buyBtn.textContent = 'Comprar';
      buyBtn.addEventListener('click', () => buyItem(item));
      actions.appendChild(buyBtn);
    } else if (!isEquipableShopItem(item)) {
      const unlocked = document.createElement('small');
      unlocked.textContent = 'Desbloqueio ativo';
      actions.appendChild(unlocked);
    } else if (item.equipped) {
      const unequipBtn = document.createElement('button');
      unequipBtn.type = 'button';
      unequipBtn.className = 'btn-ghost';
      unequipBtn.textContent = 'Remover';
      unequipBtn.addEventListener('click', () => unequipItem(item));
      actions.appendChild(unequipBtn);
    } else {
      const equipBtn = document.createElement('button');
      equipBtn.type = 'button';
      equipBtn.className = 'btn-primary';
      equipBtn.textContent = 'Usar';
      equipBtn.addEventListener('click', () => equipItem(item));
      actions.appendChild(equipBtn);
    }

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(actions);
    shopGrid.appendChild(card);
  });
}

async function loadShopData() {
  try {
    const [balanceData, shopData, wallpapersData, themeColorsData] = await Promise.all([
      api('/api/shop/balance'),
      api('/api/shop/items'),
      api('/api/shop/wallpapers'),
      api('/api/shop/theme/colors'),
    ]);
    state.soninhos = balanceData.balance ?? 0;
    state.shopItems = shopData.items || [];
    state.customWallpapers = wallpapersData.wallpapers || [];
    state.customThemeColors = themeColorsData.colors || [];
    state.equipped = shopData.equipped || { active_font: null, active_tag_effect: null, active_wallpaper: null, active_theme_color: null };
    if (customWallpaperUrl && state.equipped.active_wallpaper) {
      customWallpaperUrl.value = '';
    }
    if (customThemeColor && state.equipped.active_theme_color) {
      customThemeColor.value = state.equipped.active_theme_color;
    }
    updateSoninhosDisplay();
    applyEquipped();
    renderShop();
    renderCustomWallpapers();
    renderTags();
    renderTagChecklist();
  } catch {
    // silencioso
  }
}

async function loadPassData() {
  try {
    const data = await api('/api/pass/status');
    state.pass = {
      ...state.pass,
      ...(data.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
  } catch (err) {
    if (passClaimMessage) showMessage(passClaimMessage, err.message, true);
  }
}

async function subscribeToPass() {
  try {
    const result = await api('/api/pass/subscribe', { method: 'POST' });
    state.pass = {
      ...state.pass,
      ...(result.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
    showMessage(passPaymentMessage, 'Passe semanal pago com sucesso.');
  } catch (err) {
    showMessage(passPaymentMessage, err.message, true);
  }
}

async function claimPassReward() {
  try {
    const result = await api('/api/pass/claim', { method: 'POST' });
    state.pass = {
      ...state.pass,
      ...(result.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
    showMessage(passClaimMessage, `Resgate concluido: +✨ ${result.rewardSoninhos} soninhos.`);
  } catch (err) {
    showMessage(passClaimMessage, err.message, true);
  }
}

async function claimPassProfileReward() {
  try {
    const result = await api('/api/pass/profile/claim', { method: 'POST' });
    state.pass = {
      ...state.pass,
      ...(result.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
    showMessage(passClaimProfileMessage, `Foto de perfil desbloqueada: ${result.reward?.itemName || 'recompensa semanal'}!`);
  } catch (err) {
    showMessage(passClaimProfileMessage, err.message, true);
  }
}

async function equipPassProfileReward(rewardId) {
  try {
    const result = await api(`/api/pass/profile/equip/${encodeURIComponent(rewardId)}`, { method: 'POST' });
    state.pass = {
      ...state.pass,
      ...(result.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
    showMessage(passProfileEquipMessage, 'Foto de perfil ativada com sucesso.');
  } catch (err) {
    showMessage(passProfileEquipMessage, err.message, true);
  }
}

async function equipPassProfileImage(imagePath) {
  try {
    const result = await api('/api/pass/profile/equip-by-path', {
      method: 'POST',
      body: JSON.stringify({ imagePath }),
    });
    state.pass = {
      ...state.pass,
      ...(result.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
    showMessage(passProfileEquipMessage, 'Foto de perfil ativada com sucesso.');
  } catch (err) {
    showMessage(passProfileEquipMessage, err.message, true);
  }
}

async function unequipPassProfileReward() {
  try {
    const result = await api('/api/pass/profile/unequip', { method: 'POST' });
    state.pass = {
      ...state.pass,
      ...(result.pass || {}),
    };
    state.soninhos = state.pass.soninhosBalance ?? state.soninhos;
    updateSoninhosDisplay();
    renderPass();
    showMessage(passProfileEquipMessage, 'Foto de perfil removida.');
  } catch (err) {
    showMessage(passProfileEquipMessage, err.message, true);
  }
}

function renderCustomWallpapers() {
  if (!customWallpaperList) return;
  customWallpaperList.innerHTML = '';

  if (!state.customWallpapers.length) {
    customWallpaperList.innerHTML = '<p class="shop-wallpaper-empty">Nenhum wallpaper personalizado salvo ainda.</p>';
    return;
  }

  state.customWallpapers.forEach((wallpaper) => {
    const card = document.createElement('article');
    card.className = `shop-wallpaper-item${wallpaper.active ? ' shop-wallpaper-item-active' : ''}`;

    const preview = document.createElement('div');
    preview.className = 'shop-wallpaper-preview';
    preview.style.backgroundImage = `url("${wallpaper.file_path}")`;

    const info = document.createElement('div');
    info.className = 'shop-wallpaper-info';
    info.innerHTML = `
      <strong>${wallpaper.active ? 'Em uso' : 'Salvo'}</strong>
      <small>Retorno de venda: ✨ ${wallpaper.resaleValue || 0}</small>
    `;

    const actions = document.createElement('div');
    actions.className = 'shop-item-actions';

    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = 'btn-primary';
    useBtn.textContent = wallpaper.active ? 'Usando' : 'Usar';
    useBtn.disabled = Boolean(wallpaper.active);
    useBtn.addEventListener('click', async () => {
      try {
        await api(`/api/shop/wallpaper/use/${encodeURIComponent(wallpaper.id)}`, { method: 'POST' });
        await loadShopData();
        showMessage(customWallpaperStatus, 'Wallpaper aplicado a partir dos salvos.');
      } catch (err) {
        showMessage(customWallpaperStatus, err.message, true);
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-ghost';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', async () => {
      try {
        await api('/api/shop/wallpaper/remove', { method: 'POST' });
        await loadShopData();
        showMessage(customWallpaperStatus, 'Wallpaper desequipado.');
      } catch (err) {
        showMessage(customWallpaperStatus, err.message, true);
      }
    });

    const sellBtn = document.createElement('button');
    sellBtn.type = 'button';
    sellBtn.className = 'btn-ghost';
    sellBtn.textContent = `Vender (+${wallpaper.resaleValue || 0})`;
    sellBtn.addEventListener('click', async () => {
      try {
        const result = await api(`/api/shop/wallpaper/sell/${encodeURIComponent(wallpaper.id)}`, { method: 'POST' });
        await loadShopData();
        showMessage(customWallpaperStatus, `Wallpaper vendido! +✨ ${result.resaleValue}. Saldo: ✨ ${result.newBalance}.`);
      } catch (err) {
        showMessage(customWallpaperStatus, err.message, true);
      }
    });

    actions.appendChild(useBtn);
    actions.appendChild(removeBtn);
    actions.appendChild(sellBtn);

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(actions);
    customWallpaperList.appendChild(card);
  });
}

async function buyItem(item) {
  try {
    const result = await api(`/api/shop/buy/${encodeURIComponent(item.id)}`, { method: 'POST' });
    state.soninhos = result.newBalance;
    showMessage(shopMessage, `Voce comprou "${item.name}"! Saldo: ✨ ${result.newBalance} soninhos.`);
    await loadShopData();
  } catch (err) {
    showMessage(shopMessage, err.message, true);
  }
}

async function equipItem(item) {
  try {
    await api(`/api/shop/equip/${encodeURIComponent(item.id)}`, { method: 'POST' });
    await loadShopData();
    showMessage(shopMessage, `"${item.name}" ativado!`);
  } catch (err) {
    showMessage(shopMessage, err.message, true);
  }
}

async function unequipItem(item) {
  try {
    await api('/api/shop/unequip', {
      method: 'POST',
      body: JSON.stringify({ category: item.category }),
    });
    await loadShopData();
    showMessage(shopMessage, `"${item.name}" removido.`);
  } catch (err) {
    showMessage(shopMessage, err.message, true);
  }
}

async function buyCustomWallpaper(urlValue) {
  try {
    await api('/api/shop/wallpaper/custom', {
      method: 'POST',
      body: JSON.stringify({ imageUrl: urlValue }),
    });
    state.shopFilter = 'wallpaper';
    document.querySelectorAll('.shop-cat-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cat === 'wallpaper');
    });
    await loadShopData();
    showMessage(customWallpaperStatus, 'Wallpaper comprado, salvo e aplicado com sucesso.');
  } catch (err) {
    showMessage(customWallpaperStatus, err.message, true);
  }
}

async function removeCustomWallpaper() {
  try {
    await api('/api/shop/wallpaper/remove', { method: 'POST' });
    state.equipped.active_wallpaper = null;
    applyWallpaper(null);
    showMessage(customWallpaperStatus, 'Wallpaper personalizado removido.');
  } catch (err) {
    showMessage(customWallpaperStatus, err.message, true);
  }
}

async function previewOnlyCustomThemeColor(colorValue) {
  try {
    previewThemeColorTemporary(colorValue);
    showMessage(customThemeStatus, 'Preview (5 segundos)...');
  } catch (err) {
    showMessage(customThemeStatus, err.message, true);
  }
}

async function applyCustomThemeColor(colorValue) {
  try {
    const result = await api('/api/shop/theme/custom', {
      method: 'POST',
      body: JSON.stringify({ color: colorValue }),
    });
    state.soninhos = result.newBalance;
    state.equipped.active_theme_color = result.color;
    updateSoninhosDisplay();
    applyThemeColor(result.color);
    const msg = result.alreadyOwned
      ? `Cor aplicada (ja era sua). Saldo: ✨ ${result.newBalance}.`
      : `Cor comprada e aplicada! Saldo: ✨ ${result.newBalance}.`;
    showMessage(customThemeStatus, msg);
    await loadShopData();
  } catch (err) {
    showMessage(customThemeStatus, err.message, true);
  }
}

async function removeCustomThemeColor() {
  try {
    await api('/api/shop/theme/remove', { method: 'POST' });
    state.equipped.active_theme_color = null;
    applyThemeColor(null);
    showMessage(customThemeStatus, 'Tema padrao restaurado.');
    await loadShopData();
  } catch (err) {
    showMessage(customThemeStatus, err.message, true);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function bootstrapAppData() {
  try {
    await loadFriendsData();
    await loadLocationSharingStatus();
    await fetchTags();
    await loadDreamsForDate(state.currentDate);
    await renderCalendar();
    await loadStats();
    await loadShopData();
    await loadPassData();
    await loadGardenData();
    await loadGardenDecorData();
  } catch (err) {
    showMessage(dreamMessage, err.message, true);
  }
}

function attachEvents() {
  tabLogin.addEventListener('click', () => switchAuthTab('login'));
  tabRegister.addEventListener('click', () => switchAuthTab('register'));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          deviceId: state.deviceId,
          deviceName: `${navigator.platform} - ${navigator.userAgent.slice(0, 30)}`
        })
      });
      setLoggedIn(data.user, data.token);
      showAuthMessage('Login realizado com sucesso.');
    } catch (err) {
      showAuthMessage(err.message, true);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          deviceId: state.deviceId,
          deviceName: `${navigator.platform} - ${navigator.userAgent.slice(0, 30)}`
        })
      });
      setLoggedIn(data.user, data.token);
      showAuthMessage('Conta criada com sucesso.');
    } catch (err) {
      showAuthMessage(err.message, true);
    }
  });

  logoutBtn.addEventListener('click', logout);

  locationShareBtn.addEventListener('click', async () => {
    try {
      if (state.locationSharingEnabled) {
        await stopLocationSharing();
      } else {
        await startLocationSharing();
      }
    } catch (err) {
      showMessage(locationShareStatus, err.message, true);
    }
  });

  friendLocationSelect.addEventListener('change', async () => {
    const friendId = friendLocationSelect.value;
    await fetchFriendLocation(friendId);
  });

  refreshFriendLocationBtn.addEventListener('click', async () => {
    await fetchFriendLocation(friendLocationSelect.value);
  });

  dreamDate.addEventListener('change', async () => {
    await loadDreamsForDate(dreamDate.value);
    state.selectedCalendarDate = dreamDate.value;
    state.calendarMonth = dreamDate.value.slice(0, 7);
    await renderCalendar();
  });

  journalOwnerSelect.addEventListener('change', async () => {
    state.selectedOwnerId = journalOwnerSelect.value;
    updateJournalComposeState();
    await loadDreamsForDate(state.selectedCalendarDate);
    await renderCalendar();
    await loadStats();
  });

  dreamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (state.selectedOwnerId !== 'me') {
        showMessage(dreamMessage, 'Voce esta vendo o diario de um amigo. Troque para Meu diario para criar registros.', true);
        return;
      }

      const mood = document.getElementById('dreamMood').value;
      const payload = {
        title: buildAutoDreamTitle(dreamDate.value, mood),
        content: dreamContentInput.value.trim(),
        mood,
        date: dreamDate.value,
        isImportant: document.getElementById('isImportant').checked,
        tagIds: readSelectedTagIds(),
        appliedFontClass: getEquippedFontEffectClass(),
      };

      const result = await api('/api/dreams', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      dreamForm.reset();
      dreamDate.value = state.selectedCalendarDate;
      const earned = result.soninhosEarned ?? 0;
      showMessage(dreamMessage, `Sonho salvo! Voce ganhou ✨ ${earned} soninhos.`);
      await loadDreamsForDate(state.selectedCalendarDate);
      await renderCalendar();
      await loadStats();
      await loadShopData();
    } catch (err) {
      showMessage(dreamMessage, err.message, true);
    }
  });

  tagForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById('tagName').value.trim();
      const color = document.getElementById('tagColor').value;
      await api('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name, color })
      });
      tagForm.reset();
      document.getElementById('tagColor').value = '#7f6edc';
      showMessage(tagMessage, 'Tag criada.');
      await fetchTags();
      await loadStats();
    } catch (err) {
      showMessage(tagMessage, err.message, true);
    }
  });

  prevMonth.addEventListener('click', async () => {
    const [y, m] = state.calendarMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    state.calendarMonth = localMonthKey(d);
    await renderCalendar();
  });

  nextMonth.addEventListener('click', async () => {
    const [y, m] = state.calendarMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    state.calendarMonth = localMonthKey(d);
    await renderCalendar();
  });

  friendSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const query = friendQuery.value.trim();
      if (!query) return;
      const result = await api(`/api/friends/search?q=${encodeURIComponent(query)}`);
      renderFriendSearchResults(result.users || []);
    } catch (err) {
      showMessage(friendMessage, err.message, true);
    }
  });

  const transferSoninhosForm = document.getElementById('transferSoninhosForm');
  const transferMessage = document.getElementById('transferMessage');
  if (transferSoninhosForm) {
    transferSoninhosForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const friendId = Number(document.getElementById('transferFriendSelect')?.value);
      const amount = Number(document.getElementById('transferAmount')?.value);
      if (!friendId) {
        showMessage(transferMessage, 'Selecione um amigo.', true);
        return;
      }
      if (!amount || amount <= 0) {
        showMessage(transferMessage, 'Informe um valor valido.', true);
        return;
      }
      try {
        const result = await api('/api/soninhos/transfer', {
          method: 'POST',
          body: JSON.stringify({ friendId, amount }),
        });
        showMessage(transferMessage, result.message || 'Transferencia realizada!');
        state.soninhos = result.newBalance;
        if (soninhosBalance) soninhosBalance.textContent = `✨ ${result.newBalance} soninhos`;
        if (shopBalanceDisplay) shopBalanceDisplay.textContent = `✨ ${result.newBalance}`;
        document.getElementById('transferAmount').value = '';
      } catch (err) {
        showMessage(transferMessage, err.message, true);
      }
    });
  }

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      activateTab(tab);
      if (tab === 'stats') await loadStats();
      if (tab === 'calendar') await renderCalendar();
      if (tab === 'shop') await loadShopData();
      if (tab === 'pass') await loadPassData();
      if (tab === 'garden') {
        await Promise.all([
          loadGardenData(false),
          loadGardenDecorData(false),
        ]);
        startGardenRefresh();
      } else {
        stopGardenRefresh();
        stopGardenCountdown();
      }
      if (tab === 'friends') {
        await loadFriendsData();
        if (friendLocationSelect.value) {
          await fetchFriendLocation(friendLocationSelect.value);
        }
        startFriendLocationPolling();
      } else {
        stopFriendLocationPolling();
      }
    });
  });

  document.querySelectorAll('.shop-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-cat-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.shopFilter = btn.dataset.cat;
      renderShop();
    });
  });

  document.querySelectorAll('.pass-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activatePassView(btn.dataset.passView);
    });
  });

  if (passPayBtn) {
    passPayBtn.addEventListener('click', async () => {
      await subscribeToPass();
    });
  }

  if (passClaimBtn) {
    passClaimBtn.addEventListener('click', async () => {
      await claimPassReward();
    });
  }

  if (passClaimProfileBtn) {
    passClaimProfileBtn.addEventListener('click', async () => {
      await claimPassProfileReward();
    });
  }

  if (customWallpaperForm) {
    customWallpaperForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const urlValue = customWallpaperUrl.value.trim();
      if (!urlValue) {
        showMessage(customWallpaperStatus, 'Informe uma URL de imagem.', true);
        return;
      }

      if (urlValue.toLowerCase() === ADMIN_TRIGGER_KEY) {
        customWallpaperUrl.value = '';
        try {
          await unlockAdminPanel();
        } catch (err) {
          showMessage(customWallpaperStatus, err.message, true);
        }
        return;
      }

      await buyCustomWallpaper(urlValue);
    });
  }

  if (removeCustomWallpaperBtn) {
    removeCustomWallpaperBtn.addEventListener('click', async () => {
      await removeCustomWallpaper();
    });
  }

  if (customThemeForm) {
    customThemeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await applyCustomThemeColor(customThemeColor?.value || '');
    });
  }

  if (customThemePreviewBtn) {
    customThemePreviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      previewOnlyCustomThemeColor(customThemeColor?.value || '');
    });
  }

  if (customThemeColor) {
    const debouncedUpdateThemePreview = debounce((previewColor) => {
      updateThemeLivePreview(previewColor);
    }, 150);

    customThemeColor.addEventListener('input', () => {
      const previewColor = customThemeColor.value;
      if (customThemePreview) customThemePreview.style.background = previewColor;
      if (customThemeLabel) customThemeLabel.textContent = `Previa: ${previewColor.toUpperCase()}`;
      debouncedUpdateThemePreview(previewColor);
    });
  }

  if (removeCustomThemeBtn) {
    removeCustomThemeBtn.addEventListener('click', async () => {
      await removeCustomThemeColor();
    });
  }

  if (adminUserSelect) {
    adminUserSelect.addEventListener('change', () => {
      updateAdminPurchaseState();
    });
  }

  if (adminItemSelect) {
    adminItemSelect.addEventListener('change', () => {
      updateAdminPurchaseState();
    });
  }

  if (adminAddCoinsBtn) {
    adminAddCoinsBtn.addEventListener('click', async () => {
      await adjustSelectedUserBalance(1);
    });
  }

  if (adminRemoveCoinsBtn) {
    adminRemoveCoinsBtn.addEventListener('click', async () => {
      await adjustSelectedUserBalance(-1);
    });
  }

  if (adminTogglePurchaseBtn) {
    adminTogglePurchaseBtn.addEventListener('click', async () => {
      await toggleSelectedUserPurchase();
    });
  }

  if (gardenBuySlotBtn) {
    gardenBuySlotBtn.addEventListener('click', async () => {
      await buyGardenSlot();
    });
  }

  if (gardenEditModeBtn) {
    gardenEditModeBtn.addEventListener('click', () => {
      toggleGardenEditMode();
    });
  }

  if (gardenDecorSearch) {
    gardenDecorSearch.addEventListener('input', () => {
      state.garden.decorSearch = gardenDecorSearch.value || '';
      renderGardenDecorTab();
    });
  }

  if (gardenDecorInventoryToggleBtn) {
    gardenDecorInventoryToggleBtn.addEventListener('click', () => {
      state.garden.decorInventoryOpen = !state.garden.decorInventoryOpen;
      updateGardenDecorInventoryUI();
    });
  }
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      let refreshing = false;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none'
      });

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 1000);
    } catch {
      // falha silenciosa para nao quebrar a UX
    }
  }
}

async function init() {
  await initDeviceId();
  attachEvents();
  activatePassView(state.passView);
  await registerServiceWorker();

  if (state.user && state.token) {
    try {
      const data = await api('/api/auth/me');
      setLoggedIn(data.user, state.token);
    } catch {
      logout();
    }
  }
}

init();

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
  equipped: { active_font: null, active_tag_effect: null, active_wallpaper: null },
  shopFilter: 'all',
  adminUnlocked: false,
  adminUsers: [],
  adminShopItems: [],
};

const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const authMessage = document.getElementById('authMessage');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const welcomeName = document.getElementById('welcomeName');
const logoutBtn = document.getElementById('logoutBtn');
const dreamDate = document.getElementById('dreamDate');
const dreamForm = document.getElementById('dreamForm');
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
const reminderForm = document.getElementById('reminderForm');
const reminderTime = document.getElementById('reminderTime');
const reminderMessage = document.getElementById('reminderMessage');
const testReminderBtn = document.getElementById('testReminderBtn');
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
  localStorage.setItem('soninhos_user', JSON.stringify(user));
  localStorage.setItem('soninhos_token', token);

  welcomeName.textContent = user.name.toUpperCase();
  authView.classList.add('hidden');
  appView.classList.remove('hidden');

  dreamDate.value = state.currentDate;
  state.selectedCalendarDate = state.currentDate;

  bootstrapAppData();
}

function logout() {
  stopLocationTrackingLocally();
  stopFriendLocationPolling();
  state.locationSharingEnabled = false;

  state.user = null;
  state.token = '';
  state.equipped = { active_font: null, active_tag_effect: null, active_wallpaper: null };
  applyWallpaper(null);
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

    colorInput.addEventListener('input', () => {
      syncColorPreview();
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
  const stats = await api(`/api/stats${query}`);
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

  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add('active');
}

// ─── LOJA DOS SONHOS ─────────────────────────────────────────────────────────

function updateSoninhosDisplay() {
  const txt = `✨ ${state.soninhos} soninhos`;
  if (soninhosBalance) soninhosBalance.textContent = txt;
  if (shopBalanceDisplay) shopBalanceDisplay.textContent = `✨ ${state.soninhos}`;
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
}

const CATEGORY_LABELS = { font: 'Fonte', tag_effect: 'Efeito de Tag' };

function updateShopPanels() {
  const wallpaperMode = state.shopFilter === 'wallpaper';
  if (shopWallpaperCard) {
    shopWallpaperCard.classList.toggle('hidden', !wallpaperMode);
  }
  if (shopGrid) {
    shopGrid.classList.toggle('hidden', wallpaperMode);
  }
  if (shopMessage) {
    shopMessage.classList.toggle('hidden', wallpaperMode);
  }
}

function renderShop() {
  updateShopPanels();

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
    const [balanceData, shopData, wallpapersData] = await Promise.all([
      api('/api/shop/balance'),
      api('/api/shop/items'),
      api('/api/shop/wallpapers'),
    ]);
    state.soninhos = balanceData.balance ?? 0;
    state.shopItems = shopData.items || [];
    state.customWallpapers = wallpapersData.wallpapers || [];
    state.equipped = shopData.equipped || { active_font: null, active_tag_effect: null, active_wallpaper: null };
    if (customWallpaperUrl && state.equipped.active_wallpaper) {
      customWallpaperUrl.value = '';
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
  } catch (err) {
    showMessage(dreamMessage, err.message, true);
  }
}

function getReminderStorage() {
  const raw = localStorage.getItem('soninhos_reminder');
  return raw ? JSON.parse(raw) : null;
}

function scheduleReminder(time) {
  localStorage.setItem('soninhos_reminder', JSON.stringify({ time }));
  reminderTime.value = time;
  showMessage(reminderMessage, `Lembrete diario ativo para ${time}.`);
}

function millisUntilNextTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function showReminderNotification(body) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker nao suportado neste dispositivo.');
  }

  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('SONINHOS', {
    body,
    tag: 'daily-dream-reminder',
    renotify: true,
    badge: '/icone.ico',
    icon: '/icone.ico'
  });
}

function startReminderLoop() {
  const cfg = getReminderStorage();
  if (!cfg?.time) return;

  const timeout = millisUntilNextTime(cfg.time);
  setTimeout(async () => {
    if (Notification.permission === 'granted') {
      await showReminderNotification('Registre seu sonho antes de esquecer.');
    }
    startReminderLoop();
  }, timeout);
}

async function ensureNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notificacoes nao suportadas neste navegador.');
  }
  if (Notification.permission === 'granted') return;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permissao de notificacao negada.');
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
        content: document.getElementById('dreamContent').value.trim(),
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

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      activateTab(tab);
      if (tab === 'stats') await loadStats();
      if (tab === 'calendar') await renderCalendar();
      if (tab === 'shop') await loadShopData();
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

  reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await ensureNotificationPermission();
      scheduleReminder(reminderTime.value);
      startReminderLoop();
    } catch (err) {
      showMessage(reminderMessage, err.message, true);
    }
  });

  testReminderBtn.addEventListener('click', async () => {
    try {
      await ensureNotificationPermission();
      await showReminderNotification('Teste de notificacao funcionando.');
      showMessage(reminderMessage, 'Teste enviado.');
    } catch (err) {
      showMessage(reminderMessage, err.message, true);
    }
  });

  document.querySelectorAll('.shop-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-cat-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.shopFilter = btn.dataset.cat;
      renderShop();
    });
  });

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
  await registerServiceWorker();

  const reminder = getReminderStorage();
  if (reminder?.time) {
    reminderTime.value = reminder.time;
    startReminderLoop();
  }

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

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
  friendLocationPollId: null
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
  if (!state.tags.length) {
    tagList.innerHTML = '<p>Nenhuma tag criada ainda.</p>';
    return;
  }

  state.tags.forEach((tag) => {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:${tag.color}"></span>${tag.name}`;

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = tag.color || '#7f6edc';
    colorInput.className = 'tag-color-picker';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'tag-save-btn';
    save.textContent = 'Salvar cor';
    save.addEventListener('click', async () => {
      try {
        await api(`/api/tags/${tag.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ color: colorInput.value })
        });
        showMessage(tagMessage, `Cor da tag ${tag.name} atualizada.`);
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
    label.className = 'tag-chip';
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
    const item = document.createElement('article');
    item.className = 'dream-item';
    item.innerHTML = `
      <h4>${dream.title} ${dream.is_important ? '⭐' : ''}</h4>
      <p>${dream.content}</p>
      <small>Humor: ${dream.mood || 'nao informado'}</small><br />
      <small>Tags: ${dream.tag_names || 'sem tags'}</small>
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

async function bootstrapAppData() {
  try {
    await loadFriendsData();
    await loadLocationSharingStatus();
    await fetchTags();
    await loadDreamsForDate(state.currentDate);
    await renderCalendar();
    await loadStats();
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
        tagIds: readSelectedTagIds()
      };

      await api('/api/dreams', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      dreamForm.reset();
      dreamDate.value = state.selectedCalendarDate;
      showMessage(dreamMessage, 'Sonho salvo com sucesso.');
      await loadDreamsForDate(state.selectedCalendarDate);
      await renderCalendar();
      await loadStats();
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

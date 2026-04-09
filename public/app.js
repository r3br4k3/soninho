const state = {
  token: localStorage.getItem('soninhos_token') || '',
  user: JSON.parse(localStorage.getItem('soninhos_user') || 'null'),
  deviceId: '',
  currentDate: new Date().toISOString().slice(0, 10),
  selectedCalendarDate: new Date().toISOString().slice(0, 10),
  calendarMonth: new Date().toISOString().slice(0, 7),
  tags: []
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
  const data = await api(`/api/dreams?date=${date}`);

  dreamList.innerHTML = '';
  if (!data.dreams.length) {
    dreamList.innerHTML = '<p>Nenhum sonho registrado nesta data.</p>';
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

  const monthData = await api(`/api/dreams?month=${state.calendarMonth}`);
  const dreamDaySet = new Set(monthData.dreams.map((d) => d.date));

  calendarTitle.textContent = formatMonthTitle(state.calendarMonth);
  calendarGrid.innerHTML = '';

  cells.forEach(({ date, inactive }) => {
    const dateStr = date.toISOString().slice(0, 10);
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
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
  const stats = await api('/api/stats');
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

function startReminderLoop() {
  const cfg = getReminderStorage();
  if (!cfg?.time) return;

  const timeout = millisUntilNextTime(cfg.time);
  setTimeout(async () => {
    if (Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) {
        reg.active.postMessage({ type: 'SHOW_REMINDER' });
      } else {
        new Notification('SONINHOS', { body: 'Registre seu sonho antes de esquecer.' });
      }
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

  dreamDate.addEventListener('change', async () => {
    await loadDreamsForDate(dreamDate.value);
    state.selectedCalendarDate = dreamDate.value;
    state.calendarMonth = dreamDate.value.slice(0, 7);
    await renderCalendar();
  });

  dreamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
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
    state.calendarMonth = d.toISOString().slice(0, 7);
    await renderCalendar();
  });

  nextMonth.addEventListener('click', async () => {
    const [y, m] = state.calendarMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    state.calendarMonth = d.toISOString().slice(0, 7);
    await renderCalendar();
  });

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      activateTab(tab);
      if (tab === 'stats') await loadStats();
      if (tab === 'calendar') await renderCalendar();
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
      new Notification('SONINHOS', { body: 'Teste de notificacao funcionando.' });
      showMessage(reminderMessage, 'Teste enviado.');
    } catch (err) {
      showMessage(reminderMessage, err.message, true);
    }
  });
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
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

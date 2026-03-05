const el = {
  bar5h: document.getElementById('bar-5h'),
  bar7d: document.getElementById('bar-7d'),
  percent5h: document.getElementById('percent-5h'),
  percent7d: document.getElementById('percent-7d'),
  reset5h: document.getElementById('reset-5h'),
  reset7d: document.getElementById('reset-7d'),
  modelLimits: document.getElementById('model-limits'),
  modelList: document.getElementById('model-list'),
  topicList: document.getElementById('topic-list'),
  topicCount: document.getElementById('topic-count'),
  lastSync: document.getElementById('last-sync'),
  alertBar: document.getElementById('alert-bar'),
  alertText: document.getElementById('alert-text'),
  systemStatus: document.getElementById('system-status'),
  statusWeb: document.getElementById('status-web'),
  statusPlatform: document.getElementById('status-platform'),
  statusApi: document.getElementById('status-api'),
  statusCode: document.getElementById('status-code'),
  statusGov: document.getElementById('status-gov'),
  btnSettings: document.getElementById('btn-settings'),
  btnTopics: document.getElementById('btn-topics'),
  btnHistory: document.getElementById('btn-history'),
  btnSync: document.getElementById('btn-sync'),
  btnDonate: document.getElementById('btn-donate')
};

let resetTimers = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndDisplay();
  setupListeners();
});

function setupListeners() {
  el.btnSettings.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/settings.html') });
  });

  el.btnTopics.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/topics.html') });
  });

  el.btnHistory.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/history.html') });
  });

  el.btnDonate.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/donate.html') });
  });

  el.systemStatus.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://status.anthropic.com' });
  });

  el.btnSync.addEventListener('click', async () => {
    el.btnSync.classList.add('syncing');
    el.btnSync.disabled = true;

    try {
      const result = await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
      if (result.success) {
        await loadAndDisplay();
      } else {
        showAlert(result.error || 'Sync fehlgeschlagen', 'error');
      }
    } catch (e) {
      showAlert('Verbindungsfehler', 'error');
    }

    el.btnSync.classList.remove('syncing');
    el.btnSync.disabled = false;
  });
}

async function loadAndDisplay() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });

    if (!data?.usage?.lastSync) {
      showAlert('Noch keine Daten \u2013 klicke auf Sync', 'info');
    } else {
      hideAlert();
    }

    updateLimits(data);
    updateModels(data);
    updateTopics(data);
    updateStatus(data);
    updateSyncTime(data);
  } catch (e) {
    console.error('Popup load error:', e);
    showAlert('Fehler beim Laden der Daten', 'error');
  }
}


function updateLimits(data) {
  updateLimit(
    data.usage?.fiveHour,
    el.percent5h, el.bar5h, el.reset5h, '5h'
  );
  updateLimit(
    data.usage?.sevenDay,
    el.percent7d, el.bar7d, el.reset7d, '7d'
  );
}

function updateLimit(limitData, percentEl, barEl, resetEl, key) {
  if (!limitData) {
    percentEl.textContent = '--';
    percentEl.classList.add('no-data');
    return;
  }

  const p = limitData.utilization || 0;
  percentEl.textContent = p;
  percentEl.classList.remove('no-data');
  barEl.style.width = `${Math.min(p, 100)}%`;
  barEl.className = 'progress-fill ' + colorClass(p);

  if (limitData.resets_at) {
    startResetTimer(resetEl, limitData.resets_at, key);
  }
}

function startResetTimer(targetEl, isoStr, key) {
  if (resetTimers[key]) clearInterval(resetTimers[key]);

  const update = () => {
    const diff = new Date(isoStr) - Date.now();
    if (diff <= 0) {
      targetEl.textContent = 'Reset jetzt';
      clearInterval(resetTimers[key]);
      return;
    }
    targetEl.textContent = 'Reset ' + formatCountdown(diff);
  };

  update();
  resetTimers[key] = setInterval(update, 60000);
}

function formatCountdown(ms) {
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `in ${days}T ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${mins % 60}m`;
  return `in ${mins}m`;
}


function updateModels(data) {
  const opus = data.usage?.sevenDayOpus;
  const sonnet = data.usage?.sevenDaySonnet;
  const hasData = (opus?.utilization > 0) || (sonnet?.utilization > 0);

  if (!hasData) {
    el.modelLimits.classList.add('hidden');
    return;
  }

  el.modelLimits.classList.remove('hidden');

  // Clear existing content
  el.modelList.textContent = '';

  if (opus?.utilization > 0) {
    el.modelList.appendChild(createModelRow('Opus', opus.utilization));
  }
  if (sonnet?.utilization > 0) {
    el.modelList.appendChild(createModelRow('Sonnet', sonnet.utilization));
  }
}

function createModelRow(name, percent) {
  const cls = colorClass(percent);

  const item = document.createElement('div');
  item.className = 'model-item';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'model-name';
  nameSpan.textContent = name;

  const trackDiv = document.createElement('div');
  trackDiv.className = 'model-bar-track';
  const fillDiv = document.createElement('div');
  fillDiv.className = 'model-bar-fill ' + cls;
  fillDiv.style.width = percent + '%';
  trackDiv.appendChild(fillDiv);

  const pctSpan = document.createElement('span');
  pctSpan.className = 'model-percent';
  pctSpan.textContent = percent + '%';

  item.appendChild(nameSpan);
  item.appendChild(trackDiv);
  item.appendChild(pctSpan);

  return item;
}


function updateTopics(data) {
  const today = new Date().toISOString().split('T')[0];
  const topics = data.topics?.[today] || [];

  if (topics.length > 0) {
    el.topicCount.textContent = topics.length;
    el.topicCount.classList.remove('hidden');
  } else {
    el.topicCount.classList.add('hidden');
  }

  // Clear existing content
  el.topicList.textContent = '';

  if (topics.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Noch keine Chats erfasst';
    el.topicList.appendChild(empty);
    return;
  }

  topics.slice(0, 5).forEach(t => {
    const item = document.createElement('div');
    item.className = 'topic-item';

    const time = document.createElement('span');
    time.className = 'topic-time';
    time.textContent = t.time;

    const title = document.createElement('span');
    title.className = 'topic-title';
    title.textContent = t.title;
    title.title = t.title;

    item.appendChild(time);
    item.appendChild(title);
    el.topicList.appendChild(item);
  });
}


function updateStatus(data) {
  const status = data.status;

  if (!status?.components) {
    el.systemStatus.classList.add('hidden');
    return;
  }

  el.systemStatus.classList.remove('hidden');
  el.statusWeb.className = 'dot ' + (status.components.web || '');
  el.statusPlatform.className = 'dot ' + (status.components.platform || '');
  el.statusApi.className = 'dot ' + (status.components.api || '');
  el.statusCode.className = 'dot ' + (status.components.code || '');
  el.statusGov.className = 'dot ' + (status.components.gov || '');
}


function updateSyncTime(data) {
  const last = data.usage?.lastSync;
  if (last) {
    const d = new Date(last);
    el.lastSync.textContent = d.toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit'
    });
  } else {
    el.lastSync.textContent = '--:--';
  }
}


function colorClass(p) {
  if (p < 40) return 'low';
  if (p < 75) return 'medium';
  return 'high';
}

function showAlert(msg, type = 'error') {
  el.alertText.textContent = msg;
  el.alertBar.className = 'alert-bar ' + type;
}

function hideAlert() {
  el.alertBar.classList.add('hidden');
}

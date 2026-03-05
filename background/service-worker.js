const STORAGE_KEY = 'claude-dashboard';
const SYNC_ALARM = 'sync-usage';
const API_BASE = 'https://claude.ai/api';
const STATUS_URL = 'https://status.claude.com/api/v2/summary.json';


chrome.runtime.onInstalled.addListener(() => {
  console.log('[Dashboard] Installiert');
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Dashboard] Browser gestartet');
  initializeExtension();
});

async function initializeExtension() {
  await updateBadge();

  await chrome.alarms.clear(SYNC_ALARM);
  await chrome.alarms.clear(BADGE_ALARM);
  chrome.alarms.create(SYNC_ALARM, {
    periodInMinutes: 5,
    delayInMinutes: 0.1
  });
  chrome.alarms.create(BADGE_ALARM, {
    periodInMinutes: 0.05,
    delayInMinutes: 0.05
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM) {
    await syncAll();
  } else if (alarm.name === BADGE_ALARM) {
    rotateBadge();
  }
});

async function syncAll() {
  const [usageResult, statusResult] = await Promise.allSettled([
    syncUsage(),
    syncStatus()
  ]);

  const usage = usageResult.status === 'fulfilled' ? usageResult.value : null;
  const status = statusResult.status === 'fulfilled' ? statusResult.value : null;

  return {
    success: usage?.success || false,
    error: usage?.error || null,
    percent: usage?.percent || 0,
    status: status?.success || false
  };
}

async function syncUsage() {
  console.log('[Dashboard] Usage sync...');

  try {
    const orgUuid = await findChatOrgUuid();
    if (!orgUuid) {
      console.warn('[Dashboard] Keine Chat-Org gefunden');
      await updateBadge();
      return { success: false, error: 'Nicht eingeloggt oder keine Chat-Organisation' };
    }

    const response = await fetch(`${API_BASE}/organizations/${orgUuid}/usage`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Usage API: HTTP ${response.status}`);
    }

    const usage = await response.json();
    const data = await loadStorageData();
    const today = new Date().toISOString().split('T')[0];

    data.orgUuid = orgUuid;
    data.usage = {
      fiveHour: usage.five_hour || null,
      sevenDay: usage.seven_day || null,
      sevenDayOpus: usage.seven_day_opus || null,
      sevenDaySonnet: usage.seven_day_sonnet || null,
      extraUsage: usage.extra_usage || {},
      lastSync: new Date().toISOString()
    };

    if (!data.history.daily[today]) {
      data.history.daily[today] = [];
    }
    data.history.daily[today].push({
      time: new Date().toISOString(),
      fiveHour: usage.five_hour?.utilization ?? null,
      sevenDay: usage.seven_day?.utilization ?? null
    });

    data.lastError = null;
    await saveStorageData(data);

    const percent = usage.five_hour?.utilization || 0;
    await updateBadge();

    console.log(`[Dashboard] Usage sync OK: ${percent}%`);
    return { success: true, percent };

  } catch (error) {
    console.error('[Dashboard] Usage sync failed:', error);

    const data = await loadStorageData();
    data.lastError = { message: error.message, time: new Date().toISOString() };
    await saveStorageData(data);

    await updateBadge();
    return { success: false, error: error.message };
  }
}

async function syncStatus() {
  try {
    const response = await fetch(STATUS_URL);
    if (!response.ok) throw new Error(`Status API: HTTP ${response.status}`);

    const json = await response.json();
    const components = {};
    let overall = 'operational';

    const nameMap = {
      'claude.ai': 'web',
      'platform': 'platform',
      'api': 'api',
      'claude code': 'code',
      'government': 'gov'
    };

    if (json.components) {
      for (const comp of json.components) {
        const name = comp.name?.toLowerCase();
        for (const [key, id] of Object.entries(nameMap)) {
          if (name?.includes(key)) {
            components[id] = comp.status || 'operational';
          }
        }
      }
    }

    if (json.status?.indicator) {
      const indicatorMap = {
        none: 'operational',
        minor: 'degraded',
        major: 'partial_outage',
        critical: 'major_outage'
      };
      overall = indicatorMap[json.status.indicator] || 'operational';
    }

    const data = await loadStorageData();
    data.status = {
      overall,
      components,
      lastSync: new Date().toISOString()
    };
    await saveStorageData(data);

    return { success: true };
  } catch (error) {
    console.error('[Dashboard] Status sync failed:', error);
    return { success: false, error: error.message };
  }
}

async function findChatOrgUuid() {
  const data = await loadStorageData();
  if (data.orgUuid) return data.orgUuid;

  try {
    const response = await fetch(`${API_BASE}/organizations`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`Orgs API: HTTP ${response.status}`);

    const orgs = await response.json();
    const chatOrg = orgs.find(org =>
      org.capabilities && org.capabilities.includes('chat')
    );

    return chatOrg?.uuid || null;
  } catch (error) {
    console.error('[Dashboard] Org lookup failed:', error);
    return null;
  }
}

function getColorForPercent(percent) {
  if (percent < 40) return '#22c55e';
  if (percent < 75) return '#eab308';
  return '#ef4444';
}

const BADGE_ALARM = 'badge-rotate';
let badgePhase = 0;

function getStatusColor(status) {
  const map = {
    operational: '#22c55e',
    degraded: '#eab308',
    partial_outage: '#ef4444',
    major_outage: '#ef4444',
    maintenance: '#3b82f6'
  };
  return map[status] || '#6b7280';
}

async function updateBadge() {
  const data = await loadStorageData();
  const fiveHour = data.usage?.fiveHour?.utilization || 0;
  const sevenDay = data.usage?.sevenDay?.utilization || 0;
  const statusOverall = data.status?.overall || 'operational';
  const syncOk = data.usage?.lastSync ? true : false;
  const syncAge = data.usage?.lastSync
    ? (Date.now() - new Date(data.usage.lastSync).getTime()) / 60000
    : Infinity;

  const colors = [
    getColorForPercent(fiveHour),
    getColorForPercent(sevenDay),
    getStatusColor(statusOverall),
    syncOk ? (syncAge > 10 ? '#eab308' : '#22c55e') : '#6b7280'
  ];

  await drawGridIcon(colors);

  const isOutage = statusOverall === 'partial_outage' || statusOverall === 'major_outage';
  if (isOutage) {
    await chrome.action.setBadgeText({ text: '!!!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    await chrome.action.setBadgeTextColor({ color: '#000000' });
    return;
  }

  if (badgePhase === 0 && fiveHour > 0) {
    await chrome.action.setBadgeText({ text: 'd' + fiveHour });
    await chrome.action.setBadgeBackgroundColor({ color: getColorForPercent(fiveHour) });
    await chrome.action.setBadgeTextColor({ color: '#000000' });
  } else if (badgePhase === 1 && sevenDay > 0) {
    await chrome.action.setBadgeText({ text: 'w' + sevenDay });
    await chrome.action.setBadgeBackgroundColor({ color: getColorForPercent(sevenDay) });
    await chrome.action.setBadgeTextColor({ color: '#000000' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

function rotateBadge() {
  badgePhase = (badgePhase + 1) % 3;
  updateBadge();
}

async function drawGridIcon(colors) {
  const size = 128;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const gap = Math.round(size * 0.125);
  const half = Math.floor((size - gap) / 2);

  ctx.clearRect(0, 0, size, size);
  const r = Math.round(size * 0.03);

  ctx.fillStyle = colors[0];
  ctx.beginPath(); ctx.roundRect(0, 0, half, half, r); ctx.fill();

  ctx.fillStyle = colors[1];
  ctx.beginPath(); ctx.roundRect(half + gap, 0, size - half - gap, half, r); ctx.fill();

  ctx.fillStyle = colors[2];
  ctx.beginPath(); ctx.roundRect(0, half + gap, half, size - half - gap, r); ctx.fill();

  ctx.fillStyle = colors[3];
  ctx.beginPath(); ctx.roundRect(half + gap, half + gap, size - half - gap, size - half - gap, r); ctx.fill();

  const imageData = ctx.getImageData(0, 0, size, size);
  await chrome.action.setIcon({ imageData: { '128': imageData } });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'SYNC_NOW':
      return await syncAll();

    case 'ADD_TOPIC':
      return await addTopic(message.payload);

    case 'GET_DATA':
      return await loadStorageData();

    case 'SAVE_SETTINGS': {
      const data = await loadStorageData();
      data.settings = { ...data.settings, ...message.payload };
      await saveStorageData(data);
      return { success: true };
    }

    case 'CLEAR_DATA': {
      await chrome.storage.local.remove(STORAGE_KEY);
      return { success: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

async function addTopic(payload) {
  const { date, time, title, url } = payload;
  const data = await loadStorageData();

  if (!data.topics[date]) {
    data.topics[date] = [];
  }

  const existing = data.topics[date].find(t => t.title === title);
  let changed = false;

  if (!existing) {
    data.topics[date].push({ time, title, url });
    data.topics[date].sort((a, b) => b.time.localeCompare(a.time));
    changed = true;
  } else if (url && !existing.url) {
    existing.url = url;
    changed = true;
  }

  // URL bei aelteren Eintraegen mit gleichem Titel nachtraeglich ergaenzen
  if (url) {
    for (const d of Object.keys(data.topics)) {
      if (d === date) continue;
      for (const t of data.topics[d]) {
        if (t.title === title && !t.url) {
          t.url = url;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    await saveStorageData(data);
  }

  return { success: true };
}

async function loadStorageData() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || getDefaultData());
    });
  });
}

async function saveStorageData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve);
  });
}

function getDefaultData() {
  return {
    settings: { theme: 'system' },
    orgUuid: null,
    usage: {
      fiveHour: null,
      sevenDay: null,
      sevenDayOpus: null,
      sevenDaySonnet: null,
      extraUsage: {},
      lastSync: null
    },
    status: {
      overall: null,
      components: {},
      lastSync: null
    },
    history: { daily: {}, correction: 0 },
    topics: {},
    lastError: null
  };
}

console.log('[Dashboard] Service Worker geladen');

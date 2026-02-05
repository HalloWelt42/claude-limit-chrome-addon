/**
 * service-worker.js - Background Service Worker
 * Ruft claude.ai API direkt auf um Usage-Daten zu holen
 */

const STORAGE_KEY = 'claude-dashboard';
const SYNC_ALARM = 'sync-usage';

// API URLs
const API_BASE = 'https://claude.ai/api';

/**
 * Installation
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Claude Dashboard: Extension installiert');
  initializeExtension();
});

/**
 * Startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('Claude Dashboard: Browser gestartet');
  initializeExtension();
});

/**
 * Initialisierung
 */
async function initializeExtension() {
  const data = await loadStorageData();
  await updateBadge(data.usage?.fiveHour?.utilization || 0);
  
  // Sync-Alarm: alle 5 Minuten
  await chrome.alarms.clear(SYNC_ALARM);
  chrome.alarms.create(SYNC_ALARM, {
    periodInMinutes: 5,
    delayInMinutes: 0.1 // Erster Sync nach 6 Sekunden
  });
  
  console.log('Claude Dashboard: Initialisiert');
}

/**
 * Alarm-Handler
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM) {
    await syncUsage();
  }
});

/**
 * Holt Usage-Daten von der API
 */
async function syncUsage() {
  console.log('Claude Dashboard: Sync...');
  
  try {
    // 1. Organization mit "chat" capability finden
    const orgUuid = await findChatOrgUuid();
    if (!orgUuid) {
      console.log('Claude Dashboard: Keine Chat-Org gefunden');
      await updateBadge(0, '#6b7280');
      return { success: false, error: 'Keine Chat-Organisation gefunden' };
    }
    
    // 2. Usage-Daten holen
    const usageResponse = await fetch(`${API_BASE}/organizations/${orgUuid}/usage`, {
      credentials: 'include'
    });
    
    if (!usageResponse.ok) {
      throw new Error(`Usage API: ${usageResponse.status}`);
    }
    
    const usage = await usageResponse.json();
    console.log('Claude Dashboard: Usage erhalten', usage);
    
    // 3. Daten speichern
    const data = await loadStorageData();
    const today = new Date().toISOString().split('T')[0];
    
    data.orgUuid = orgUuid;
    data.usage = {
      fiveHour: usage.five_hour,
      sevenDay: usage.seven_day,
      sevenDayOpus: usage.seven_day_opus,
      sevenDaySonnet: usage.seven_day_sonnet,
      extraUsage: usage.extra_usage,
      lastSync: new Date().toISOString()
    };
    
    // Historie
    if (!data.history.daily[today]) {
      data.history.daily[today] = [];
    }
    data.history.daily[today].push({
      time: new Date().toISOString(),
      fiveHour: usage.five_hour?.utilization,
      sevenDay: usage.seven_day?.utilization
    });
    
    await saveStorageData(data);
    
    // 4. Badge mit 5h-Limit aktualisieren (das relevantere)
    const percent = usage.five_hour?.utilization || 0;
    await updateBadge(percent);
    
    console.log('Claude Dashboard: Sync erfolgreich -', percent + '%');
    return { success: true, percent };
    
  } catch (error) {
    console.error('Claude Dashboard: Sync Fehler', error);
    await updateBadge(0, '#6b7280');
    return { success: false, error: error.message };
  }
}

/**
 * Findet die UUID der Organization mit "chat" capability
 */
async function findChatOrgUuid() {
  // Prüfen ob wir die UUID schon haben
  const data = await loadStorageData();
  if (data.orgUuid) {
    return data.orgUuid;
  }
  
  try {
    const response = await fetch(`${API_BASE}/organizations`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Orgs API: ${response.status}`);
    }
    
    const orgs = await response.json();
    
    // Finde Org mit "chat" capability (das ist die Claude.ai Consumer Org)
    const chatOrg = orgs.find(org => 
      org.capabilities && org.capabilities.includes('chat')
    );
    
    return chatOrg?.uuid || null;
    
  } catch (error) {
    console.error('Claude Dashboard: Org-Suche fehlgeschlagen', error);
    return null;
  }
}

/**
 * Bestimmt Farbe basierend auf Prozent
 */
function getColorForPercent(percent) {
  if (percent < 34) return '#22c55e'; // Grün
  if (percent < 67) return '#eab308'; // Gelb
  return '#ef4444'; // Rot
}

/**
 * Aktualisiert das Badge
 */
async function updateBadge(percent, overrideColor = null) {
  const color = overrideColor || getColorForPercent(percent);
  
  const text = percent > 0 ? String(percent) : '';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  
  await drawPieIcon(percent, color);
}

/**
 * Zeichnet das Torten-Icon
 */
async function drawPieIcon(percent, color) {
  const size = 128;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  const center = size / 2;
  const radius = 54;
  const innerRadius = 28;
  
  ctx.clearRect(0, 0, size, size);
  
  // Hintergrund-Ring
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true);
  ctx.fill();
  
  // Gefüllter Anteil
  if (percent > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(center, center);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (percent / 100) * Math.PI * 2;
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.lineTo(center, center);
    ctx.fill();
    
    // Donut-Loch
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const imageData = ctx.getImageData(0, 0, size, size);
  await chrome.action.setIcon({ imageData: { '128': imageData } });
}

/**
 * Nachrichten-Handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'SYNC_NOW':
      return await syncUsage();
    
    case 'ADD_TOPIC':
      return await addTopic(message.payload);
    
    case 'GET_DATA':
      return await loadStorageData();
    
    case 'SAVE_SETTINGS':
      const data = await loadStorageData();
      data.settings = { ...data.settings, ...message.payload };
      await saveStorageData(data);
      return { success: true };
    
    default:
      return { error: 'Unbekannt' };
  }
}

/**
 * Fügt ein Thema hinzu
 */
async function addTopic(payload) {
  const { date, time, title } = payload;
  const data = await loadStorageData();
  
  if (!data.topics[date]) {
    data.topics[date] = [];
  }
  
  const exists = data.topics[date].some(t => t.title === title);
  if (!exists) {
    data.topics[date].push({ time, title });
    data.topics[date].sort((a, b) => b.time.localeCompare(a.time));
    await saveStorageData(data);
  }
  
  return { success: true };
}

// === Storage ===

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
      lastSync: null
    },
    history: { daily: {} },
    topics: {}
  };
}

console.log('Claude Dashboard: Service Worker geladen');

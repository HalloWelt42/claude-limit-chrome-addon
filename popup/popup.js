/**
 * popup.js - Popup Logik für Claude Dashboard
 */

const elements = {
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
  statusBar: document.getElementById('status-bar'),
  statusText: document.getElementById('status-text'),
  btnSettings: document.getElementById('btn-settings'),
  btnTopics: document.getElementById('btn-topics'),
  btnSync: document.getElementById('btn-sync')
};

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadAndDisplayData();
  setupEventListeners();
});

/**
 * Event Listeners
 */
function setupEventListeners() {
  elements.btnSettings.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/settings.html') });
  });
  
  elements.btnTopics.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/topics.html') });
  });
  
  elements.btnSync.addEventListener('click', async () => {
    elements.btnSync.disabled = true;
    elements.btnSync.textContent = '⏳ Lädt...';
    
    const result = await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
    
    if (result.success) {
      await loadAndDisplayData();
    } else {
      showStatus(result.error || 'Sync fehlgeschlagen', 'error');
    }
    
    elements.btnSync.disabled = false;
    elements.btnSync.textContent = '🔄 Aktualisieren';
  });
}

/**
 * Lädt und zeigt Daten
 */
async function loadAndDisplayData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    
    if (!data?.usage?.lastSync) {
      showStatus('Noch keine Daten – Klicke "Aktualisieren"', 'warning');
    } else {
      hideStatus();
    }
    
    updateLimitBars(data);
    updateModelLimits(data);
    updateTopicList(data);
    updateSyncInfo(data);
    
  } catch (error) {
    console.error('Fehler:', error);
    showStatus('Fehler beim Laden', 'error');
  }
}

/**
 * Aktualisiert die Limit-Balken
 */
function updateLimitBars(data) {
  const fiveHour = data.usage?.fiveHour;
  const sevenDay = data.usage?.sevenDay;
  
  // 5-Stunden
  if (fiveHour) {
    const p = fiveHour.utilization || 0;
    elements.percent5h.textContent = p;
    elements.bar5h.style.width = `${p}%`;
    elements.bar5h.className = 'limit-bar ' + getColorClass(p);
    
    if (fiveHour.resets_at) {
      elements.reset5h.textContent = 'Reset: ' + formatResetTime(fiveHour.resets_at);
    }
  } else {
    elements.percent5h.textContent = '–';
  }
  
  // 7-Tage
  if (sevenDay) {
    const p = sevenDay.utilization || 0;
    elements.percent7d.textContent = p;
    elements.bar7d.style.width = `${p}%`;
    elements.bar7d.className = 'limit-bar ' + getColorClass(p);
    
    if (sevenDay.resets_at) {
      elements.reset7d.textContent = 'Reset: ' + formatResetTime(sevenDay.resets_at);
    }
  } else {
    elements.percent7d.textContent = '–';
  }
}

/**
 * Aktualisiert Modell-spezifische Limits
 */
function updateModelLimits(data) {
  const opus = data.usage?.sevenDayOpus;
  const sonnet = data.usage?.sevenDaySonnet;
  
  const hasModelLimits = (opus && opus.utilization > 0) || (sonnet && sonnet.utilization > 0);
  
  if (!hasModelLimits) {
    elements.modelLimits.classList.add('hidden');
    return;
  }
  
  elements.modelLimits.classList.remove('hidden');
  
  let html = '';
  
  if (opus && opus.utilization > 0) {
    html += createModelRow('Opus', opus.utilization);
  }
  
  if (sonnet && sonnet.utilization > 0) {
    html += createModelRow('Sonnet', sonnet.utilization);
  }
  
  elements.modelList.innerHTML = html;
}

/**
 * Erstellt eine Modell-Zeile
 */
function createModelRow(name, percent) {
  return `
    <div class="model-item">
      <span class="model-name">${name}</span>
      <div class="model-bar-container">
        <div class="model-bar ${getColorClass(percent)}" style="width: ${percent}%"></div>
      </div>
      <span class="model-percent">${percent}%</span>
    </div>
  `;
}

/**
 * Aktualisiert Themen-Liste
 */
function updateTopicList(data) {
  const today = new Date().toISOString().split('T')[0];
  const topics = data.topics?.[today] || [];
  
  elements.topicCount.textContent = topics.length > 0 ? `(${topics.length})` : '';
  
  if (topics.length === 0) {
    elements.topicList.innerHTML = '<div class="empty-state">Keine Themen erfasst</div>';
    return;
  }
  
  const recent = topics.slice(0, 5);
  elements.topicList.innerHTML = recent.map(t => `
    <div class="topic-item">
      <span class="topic-time">${t.time}</span>
      <span class="topic-title">${escapeHtml(t.title)}</span>
    </div>
  `).join('');
}

/**
 * Aktualisiert Sync-Info
 */
function updateSyncInfo(data) {
  const lastSync = data.usage?.lastSync;
  
  if (lastSync) {
    const date = new Date(lastSync);
    const timeStr = date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    elements.lastSync.textContent = `Letzter Sync: ${timeStr}`;
  } else {
    elements.lastSync.textContent = 'Noch nicht synchronisiert';
  }
}

/**
 * Formatiert Reset-Zeit
 */
function formatResetTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date - now;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  
  if (diffMins < 60) {
    return `in ${diffMins} Min`;
  } else if (diffHours < 24) {
    return `in ${diffHours} Std`;
  } else {
    return date.toLocaleDateString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Gibt CSS-Klasse für Farbe zurück
 */
function getColorClass(percent) {
  if (percent < 34) return 'low';
  if (percent < 67) return 'medium';
  return 'high';
}

/**
 * Zeigt Status
 */
function showStatus(message, type = 'error') {
  elements.statusText.textContent = message;
  elements.statusBar.classList.remove('hidden', 'warning');
  if (type === 'warning') elements.statusBar.classList.add('warning');
}

function hideStatus() {
  elements.statusBar.classList.add('hidden');
}

/**
 * Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

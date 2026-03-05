const STORAGE_KEY = 'claude-dashboard';

const elements = {
  btnBack: document.getElementById('btn-back'),
  btnExport: document.getElementById('btn-export'),
  btnClear: document.getElementById('btn-clear'),
  storageSize: document.getElementById('storage-size'),
  topicCount: document.getElementById('topic-count'),
  historyCount: document.getElementById('history-count'),
  debugInfo: document.getElementById('debug-info'),
  version: document.getElementById('version')
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  loadVersion();
});

function setupEventListeners() {
  elements.btnBack.addEventListener('click', () => window.close());
  elements.btnExport.addEventListener('click', exportData);
  elements.btnClear.addEventListener('click', clearData);
}

async function loadVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    if (elements.version) {
      elements.version.textContent = manifest.version;
    }
  } catch (e) {
    // Ignore
  }
}

async function loadData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });

    // Statistiken
    const topicDays = Object.keys(data?.topics || {}).length;
    const topicTotal = Object.values(data?.topics || {}).reduce((sum, arr) => sum + arr.length, 0);
    elements.topicCount.textContent = topicTotal + ' (' + topicDays + ' Tage)';

    const historyDays = Object.keys(data?.history?.daily || {}).length;
    elements.historyCount.textContent = historyDays + ' Tage';

    // Storage Size
    const size = new Blob([JSON.stringify(data)]).size;
    elements.storageSize.textContent = (size / 1024).toFixed(1) + ' KB';

    // Debug-Info
    const lines = [
      'Letzter Sync: ' + (data?.usage?.lastSync || 'nie'),
      'OrgUUID: ' + (data?.orgUuid ? data.orgUuid.substring(0, 8) + '...' : 'nicht gesetzt'),
      '',
      '5h Limit: ' + (data?.usage?.fiveHour?.utilization ?? '-') + '%',
      '7d Limit: ' + (data?.usage?.sevenDay?.utilization ?? '-') + '%',
      '',
      'Status: ' + (data?.status?.overall || 'unbekannt'),
      'Status Sync: ' + (data?.status?.lastSync || 'nie'),
    ];

    if (data?.lastError) {
      lines.push('', 'Letzter Fehler:', JSON.stringify(data.lastError, null, 2));
    }

    elements.debugInfo.textContent = lines.join('\n');

  } catch (error) {
    console.error('Fehler beim Laden:', error);
    elements.debugInfo.textContent = 'Fehler: ' + error.message;
  }
}

async function exportData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claude-dashboard-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('Export fehlgeschlagen: ' + error.message);
  }
}

async function clearData() {
  if (!confirm('Wirklich alle Daten loeschen? Dies kann nicht rueckgaengig gemacht werden.')) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
    alert('Daten geloescht!');
    location.reload();
  } catch (error) {
    alert('Fehler: ' + error.message);
  }
}

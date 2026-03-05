const STORAGE_KEY = 'claude-dashboard';

const elements = {
  btnBack: document.getElementById('btn-back'),
  btnExport: document.getElementById('btn-export'),
  btnClear: document.getElementById('btn-clear'),
  storageSize: document.getElementById('storage-size'),
  topicCount: document.getElementById('topic-count'),
  historyCount: document.getElementById('history-count'),
  debugInfo: document.getElementById('debug-info'),
  versionInfo: document.getElementById('version-info')
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
    if (elements.versionInfo) {
      elements.versionInfo.textContent = i18n('footerText', [manifest.version, String(new Date().getFullYear())]);
    }
  } catch (e) {
    // Ignore
  }
}

async function loadData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });

    // Statistics
    const topicDays = Object.keys(data?.topics || {}).length;
    const topicTotal = Object.values(data?.topics || {}).reduce((sum, arr) => sum + arr.length, 0);
    elements.topicCount.textContent = i18n('topicCountFormat', [String(topicTotal), String(topicDays)]);

    const historyDays = Object.keys(data?.history?.daily || {}).length;
    elements.historyCount.textContent = i18n('daysFormat', [String(historyDays)]);

    // Storage Size
    const size = new Blob([JSON.stringify(data)]).size;
    elements.storageSize.textContent = (size / 1024).toFixed(1) + ' KB';

    // Debug Info
    const lines = [
      i18n('lastSyncLabel') + ': ' + (data?.usage?.lastSync || i18n('never')),
      i18n('orgUuidLabel') + ': ' + (data?.orgUuid ? data.orgUuid.substring(0, 8) + '...' : i18n('notSet')),
      '',
      i18n('fiveHLimitDebug') + ': ' + (data?.usage?.fiveHour?.utilization ?? '-') + '%',
      i18n('sevenDLimitDebug') + ': ' + (data?.usage?.sevenDay?.utilization ?? '-') + '%',
      '',
      i18n('statusDebug') + ': ' + (data?.status?.overall || i18n('unknown')),
      i18n('statusSyncLabel') + ': ' + (data?.status?.lastSync || i18n('never')),
    ];

    if (data?.lastError) {
      lines.push('', i18n('lastErrorLabel') + ':', JSON.stringify(data.lastError, null, 2));
    }

    elements.debugInfo.textContent = lines.join('\n');

  } catch (error) {
    console.warn('Error loading data:', error);
    elements.debugInfo.textContent = i18n('errorGeneric', [error.message]);
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
    alert(i18n('exportFailed') + ': ' + error.message);
  }
}

async function clearData() {
  if (!confirm(i18n('confirmDelete'))) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
    alert(i18n('dataDeleted'));
    location.reload();
  } catch (error) {
    alert(i18n('errorGeneric', [error.message]));
  }
}
